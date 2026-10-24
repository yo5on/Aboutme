import * as THREE from 'three'

// Cursor-following eyes for me.glb.
//
// me.glb is a single Tripo mesh (1 node, 1 material, no skeleton, no morph targets) and its eyes are
// painted into a fragmented texture atlas, so there is no eyeball to rotate. Instead, a clone of the face
// material warps each painted eye opening: the iris (with its dark rim) slides rigidly, the sclera around it
// stretches to follow, and the lids stay put and cover whatever slides under them, so nothing is erased or
// redrawn and no ghost of the painted iris can show. With zero gaze the warp is the identity and the eyes
// are exactly as painted. The GLB's geometry, texture and material are left untouched.
//
// Points are in me.glb's model space (face looks along +X, up +Y).
const EYES = [
  { y: 0.155, z: 0.086 }, // eye on the viewer's left (+Z)
  { y: 0.145, z: -0.085 }, // eye on the viewer's right
]
const R = 0.06 // capture half-size around each eye (the openings are ~0.08 wide)
const S = 1024 // capture resolution
const FRONT_X = 0.1 // eye surface sits at x ≈ 0.14–0.19; ignore anything further back
const TUCK = 0.25 // how far (iris radii) the iris may slide under a lid at full gaze
const MAX_TRAVEL = 0.9 // iris travel cap (iris radii)
const STRETCH = 3 // gap behind the iris ≤ 3× the sclera band filling it; more smears the lid shading

export interface EyeRig {
  // absolute gaze in [-1, 1] (not accumulated): +x = toward the viewer's right (the eye's -Z side), +y = up
  setGaze(x: number, y: number): void
}

export function addEyeTracking(mesh: THREE.Mesh, gl: THREE.WebGLRenderer): EyeRig | null {
  const src = mesh.material as THREE.MeshStandardMaterial
  if (!src.map) return null

  // 1) Straight-on unlit capture of each eye, read back as sRGB bytes
  const rt = new THREE.WebGLRenderTarget(S, S)
  const flat = new THREE.MeshBasicMaterial({ map: src.map, toneMapped: false })
  flat.onBeforeCompile = (s) => {
    // Mip level 0: the minified capture would otherwise pull dark atlas gutter into the UV-island seams
    // around the iris, and the warp would drag those seams into view
    s.fragmentShader = s.fragmentShader
      .replace('#include <map_fragment>', 'diffuseColor *= textureLod(map, vMapUv, 0.0);')
      .replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF(gl_FragColor);')
  }
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(mesh.geometry, flat))
  const cam = new THREE.OrthographicCamera(-R, R, R, -R, 0.01, 1)
  const prevTarget = gl.getRenderTarget()
  const prevClear = gl.getClearColor(new THREE.Color())
  const prevAlpha = gl.getClearAlpha()

  const eyes = EYES.map((e) => {
    cam.position.set(0.6, e.y, e.z)
    cam.lookAt(0, e.y, e.z) // screen right = model -Z
    gl.setRenderTarget(rt)
    // The postprocessing composer turns autoClear off; without this the second eye was drawn over the
    // first eye's colour and depth, giving the right eye a split, doubled iris
    gl.setClearColor(0x000000, 0)
    gl.clear()
    gl.render(scene, cam)
    const px = new Uint8Array(S * S * 4)
    gl.readRenderTargetPixels(rt, 0, 0, S, S, px) // row 0 = bottom, same as the DataTexture below
    const found = analyse(px)
    if (!found) return null
    const tex = new THREE.DataTexture(px, S, S)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = tex.minFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return { box: new THREE.Vector4(e.z, e.y, 1 / (2 * R), FRONT_X), ...found, tex, off: new THREE.Vector2() }
  })
  gl.setRenderTarget(prevTarget)
  gl.setClearColor(prevClear, prevAlpha)
  rt.dispose()
  flat.dispose()
  if (eyes.some((e) => !e)) {
    console.warn('[eyeTracking] could not find the painted irises; eyes stay static')
    return null
  }
  const [L, Rt] = eyes as NonNullable<(typeof eyes)[number]>[]
  // Both eyes turn together, so each direction gets the travel the tighter eye allows (e.g. looking to the
  // viewer's right is limited by the left eye's nasal corner and the right eye's outer corner)
  const reach = L.reach.map((v, i) => Math.min(v, Rt.reach[i]))

  // 2) Cloned face material with the iris shift spliced in after the base colour lookup
  const mat = src.clone()
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, {
      uEyeTex0: { value: L.tex }, uEyeBox0: { value: L.box }, uIris0: { value: L.iris }, uOff0: { value: L.off },
      uEyeTex1: { value: Rt.tex }, uEyeBox1: { value: Rt.box }, uIris1: { value: Rt.iris }, uOff1: { value: Rt.off },
    })
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEyePos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvEyePos = position;')
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vEyePos;
uniform sampler2D uEyeTex0, uEyeTex1;
uniform vec4 uEyeBox0, uEyeBox1; // capture centre z, y, 1 / capture size, min x
uniform vec3 uIris0, uIris1; // iris centre uv, radius
uniform vec2 uOff0, uOff1; // iris shift (uv)
vec3 eyeLook(sampler2D tex, vec4 box, vec3 iris, vec2 off, vec3 base) {
  vec2 uv = vec2(box.x - vEyePos.z, vEyePos.y - box.y) * box.z + 0.5;
  if (vEyePos.x < box.w || uv != clamp(uv, 0.0, 1.0)) return base;
  float open = texture2D(tex, uv).a; // 0 at the lids, 1 well inside the opening
  float len = length(off);
  if (open <= 0.0 || len == 0.0) return base;
  // Measured along the gaze (t = distance behind the iris centre): the iris + rim and the sclera ahead of
  // it slide rigidly, and the lid ahead covers them. Behind the moved iris, the sclera band between the
  // painted iris edge and the lid is stretched linearly to fill the gap. Sources therefore stay inside the
  // opening and never land on the painted iris, so it can't ghost through
  vec2 back = -off / len;
  float t = dot(uv - iris.xy, back);
  float side = abs(dot(uv - iris.xy, vec2(-back.y, back.x)));
  // where this line leaves the painted iris and its soft dark halo (the chord, not the radius, off-centre)
  float edge = sqrt(max(iris.z * iris.z - side * side, 0.0));
  float halo = sqrt(max(1.2544 * iris.z * iris.z - side * side, 0.0));
  float s = t + len;
  if (t > edge - len) {
    // march to the lid behind this pixel
    float h = iris.z * 0.1, lid = t, prev = open;
    for (int i = 1; i <= 36; i++) {
      float a = texture2D(tex, uv + back * h * float(i)).a;
      // interpolate the crossing between steps; a stepped lid would band the stretched sclera
      if (a < 0.05) { lid += h * clamp((prev - 0.05) / max(prev - a, 1e-5), 0.0, 1.0); break; }
      lid = t + h * float(i);
      prev = a;
    }
    // source band starts just past the halo
    s = lid - (lid - t) * max(lid - halo, 0.0) / max(lid - edge + len, 1e-5);
  }
  // only the strip the iris travels through moves; the sclera beside it stays put
  vec2 src = uv + back * (s - t) * (1.0 - smoothstep(iris.z * 1.15, iris.z * 1.9, side));
  // the lids stay put and cover the iris with a soft edge; add only the change, so the lit face colour is
  // kept and zero gaze is an exact no-op
  return base + (texture2D(tex, src).rgb - texture2D(tex, uv).rgb) * smoothstep(0.0, 0.25, open);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
diffuseColor.rgb = eyeLook(uEyeTex0, uEyeBox0, uIris0, uOff0, diffuseColor.rgb);
diffuseColor.rgb = eyeLook(uEyeTex1, uEyeBox1, uIris1, uOff1, diffuseColor.rgb);`)
  }
  mat.customProgramCacheKey = () => 'me-eyes'
  mesh.material = mat

  return {
    setGaze(x, y) {
      // travel limit for this direction, interpolated between the 8 measured ones
      const a = (Math.atan2(y, x) / (Math.PI / 4) + 8) % 8
      const i = Math.floor(a), f = a - i
      const lim = reach[i] * (1 - f) + reach[(i + 1) % 8] * f
      for (const e of [L, Rt]) e.off.set(x * lim * e.iris.z, y * lim * e.iris.z)
    },
  }
}

// From one capture: eye opening (written to px's alpha), iris circle (uv centre, uv radius) and how far the
// iris can travel (in iris radii) in 8 directions, counter-clockwise from the viewer's right.
function analyse(px: Uint8Array): { iris: THREE.Vector3; reach: number[] } | null {
  const sclera = new Uint8Array(S * S)
  for (let i = 0; i < S * S; i++) {
    const r = px[4 * i], g = px[4 * i + 1], b = px[4 * i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    sclera[i] = mn > 120 && mx - mn < 0.35 * mx ? 1 : 0
  }
  // opening = per row, everything between the outermost sclera pixels (the lids are convex)
  const open = new Uint8Array(S * S)
  for (let y = 0; y < S; y++) {
    let a = -1, b = -1
    for (let x = 0; x < S; x++) if (sclera[y * S + x]) { if (a < 0) a = x; b = x }
    if (b - a > S / 64) open.fill(1, y * S + a, y * S + b + 1)
  }
  // iris = dark pixels inside the opening; robust extents (ignore stray lash / lid-line pixels)
  const xs: number[] = [], ys: number[] = []
  for (let i = 0; i < S * S; i++) {
    if (!open[i] || sclera[i]) continue
    if (0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2] < 110) { xs.push(i % S); ys.push(Math.floor(i / S)) }
  }
  if (xs.length < S * S / 500) return null
  const q = (v: number[], p: number) => v.sort((m, n) => m - n)[Math.floor(p * (v.length - 1))]
  const x0 = q(xs, 0.02), x1 = q(xs, 0.98), y0 = q(ys, 0.02), y1 = q(ys, 0.98)
  const r = (x1 - x0) / 2
  // a fully visible iris is as tall as it is wide; otherwise the upper lid covers its top
  const cy = y1 - y0 > 1.8 * r ? (y0 + y1) / 2 : y0 + r
  // Travel limits from the opening itself, in 8 directions (iris radii): the iris may go up to the lid ahead
  // plus a little tuck under it, and the sclera band behind it (lid to halo) may stretch at most STRETCH
  // times its own width to fill the gap it leaves
  const ix = Math.round((x0 + x1) / 2), iy = Math.round(cy)
  const lidDist = (dx: number, dy: number) => {
    let n = 0
    for (let x = ix, y = iy; x >= 0 && y >= 0 && x < S && y < S && open[y * S + x]; x += dx, y += dy) n++
    return (n * Math.hypot(dx, dy)) / r
  }
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
  const reach = dirs.map(([dx, dy]) =>
    THREE.MathUtils.clamp(Math.min(lidDist(dx, dy) - 1 + TUCK, (lidDist(-dx, -dy) - 1.12) * STRETCH), 0, MAX_TRAVEL))
  // Warp weight in alpha: 0 on and outside the lids, ramping to 1 a distance B inside the opening.
  // Box blur of the mask via a summed-area table; at a straight edge the blur is 0.5 + d / 2B.
  const B = Math.max(3, Math.round(r * 0.8))
  const sat = new Float64Array((S + 1) * (S + 1))
  for (let y = 0; y < S; y++) {
    let row = 0
    for (let x = 0; x < S; x++) {
      row += open[y * S + x]
      sat[(y + 1) * (S + 1) + x + 1] = sat[y * (S + 1) + x + 1] + row
    }
  }
  for (let y = 0; y < S; y++) {
    const ya = Math.max(0, y - B), yb = Math.min(S, y + B + 1)
    for (let x = 0; x < S; x++) {
      let a = 0
      if (open[y * S + x]) {
        const xa = Math.max(0, x - B), xb = Math.min(S, x + B + 1)
        const sum = sat[yb * (S + 1) + xb] - sat[ya * (S + 1) + xb] - sat[yb * (S + 1) + xa] + sat[ya * (S + 1) + xa]
        a = Math.min(1, Math.max(0, (sum / ((2 * B + 1) * (2 * B + 1)) - 0.5) * 2))
      }
      px[4 * (y * S + x) + 3] = Math.round(a * 255)
    }
  }
  // 1.08: include the iris' soft outer edge
  return { iris: new THREE.Vector3(((x0 + x1) / 2 + 0.5) / S, (cy + 0.5) / S, (r * 1.08) / S), reach }
}
