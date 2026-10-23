import * as THREE from 'three'

// Cursor-following eyes for me.glb.
//
// me.glb is a single Tripo mesh (1 node, 1 material, no skeleton, no morph targets) and its eyes are
// painted into a fragmented texture atlas, so there is nothing to rotate. Instead, a clone of the face
// material redraws each painted iris a little off-centre: the iris disc is copied from a one-off
// straight-on capture of the eye, the spot it leaves is filled with sclera from the same row, and
// everything is clipped to the eye opening so the iris slides under the lids. The GLB's geometry,
// texture and material are left untouched, and with zero gaze the eyes look exactly as painted.
//
// Points are in me.glb's model space (face looks along +X, up +Y).
const EYES = [
  { y: 0.155, z: 0.086 }, // character's left eye (+Z)
  { y: 0.145, z: -0.085 }, // character's right eye
]
const R = 0.06 // capture half-size around each eye (the openings are ~0.08 wide)
const S = 512 // capture resolution
const FRONT_X = 0.1 // eye surface sits at x ≈ 0.14–0.19; ignore anything further back
const MAX_SHIFT = { x: 0.45, y: 0.28 } // iris travel as a fraction of its radius

export interface EyeRig {
  // gaze in [-1, 1]: +x = toward the viewer's right (the eye's -Z side), +y = up
  setGaze(x: number, y: number): void
}

export function addEyeTracking(mesh: THREE.Mesh, gl: THREE.WebGLRenderer): EyeRig | null {
  const src = mesh.material as THREE.MeshStandardMaterial
  if (!src.map) return null

  // 1) Straight-on unlit capture of each eye, read back as sRGB bytes
  const rt = new THREE.WebGLRenderTarget(S, S)
  const flat = new THREE.MeshBasicMaterial({ map: src.map, toneMapped: false })
  flat.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <colorspace_fragment>', 'gl_FragColor = sRGBTransferOETF(gl_FragColor);')
  }
  const scene = new THREE.Scene()
  scene.add(new THREE.Mesh(mesh.geometry, flat))
  const cam = new THREE.OrthographicCamera(-R, R, R, -R, 0.01, 1)
  const prevTarget = gl.getRenderTarget()

  const eyes = EYES.map((e) => {
    cam.position.set(0.6, e.y, e.z)
    cam.lookAt(0, e.y, e.z) // screen right = model -Z
    gl.setRenderTarget(rt)
    gl.render(scene, cam)
    const px = new Uint8Array(S * S * 4)
    gl.readRenderTargetPixels(rt, 0, 0, S, S, px) // row 0 = bottom, same as the DataTexture below
    const iris = analyse(px)
    if (!iris) return null
    const tex = new THREE.DataTexture(px, S, S)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = tex.minFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return { box: new THREE.Vector4(e.z, e.y, 1 / (2 * R), FRONT_X), iris, tex, off: new THREE.Vector2() }
  })
  gl.setRenderTarget(prevTarget)
  rt.dispose()
  flat.dispose()
  if (eyes.some((e) => !e)) {
    console.warn('[eyeTracking] could not find the painted irises; eyes stay static')
    return null
  }
  const [L, Rt] = eyes as NonNullable<(typeof eyes)[number]>[]

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
  float open = texture2D(tex, uv).a;
  if (open <= 0.0) return base;
  float aa = 0.006;
  float inOld = 1.0 - smoothstep(iris.z - aa, iris.z, distance(uv, iris.xy));
  float inNew = 1.0 - smoothstep(iris.z - aa, iris.z, distance(uv - off, iris.xy));
  // sclera for the spot the iris left: same row, just outside the painted iris on either side
  vec4 a = texture2D(tex, vec2(iris.x - iris.z * 1.1, uv.y));
  vec4 b = texture2D(tex, vec2(iris.x + iris.z * 1.1, uv.y));
  vec3 fill = (a.rgb * a.a + b.rgb * b.a + base * 0.02) / (a.a + b.a + 0.02);
  vec3 col = mix(mix(base, fill, inOld), texture2D(tex, uv - off).rgb, inNew);
  return mix(base, col, open);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
diffuseColor.rgb = eyeLook(uEyeTex0, uEyeBox0, uIris0, uOff0, diffuseColor.rgb);
diffuseColor.rgb = eyeLook(uEyeTex1, uEyeBox1, uIris1, uOff1, diffuseColor.rgb);`)
  }
  mat.customProgramCacheKey = () => 'me-eyes'
  mesh.material = mat

  return {
    setGaze(x, y) {
      for (const e of [L, Rt]) e.off.set(x * MAX_SHIFT.x * e.iris.z, y * MAX_SHIFT.y * e.iris.z)
    },
  }
}

// Eye opening (alpha) + iris circle (uv centre, uv radius) from one capture. Mutates px's alpha.
function analyse(px: Uint8Array): THREE.Vector3 | null {
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
    if (b - a > 8) open.fill(1, y * S + a, y * S + b + 1)
  }
  // iris = dark pixels inside the opening; robust extents (ignore stray lash / lid-line pixels)
  const xs: number[] = [], ys: number[] = []
  for (let i = 0; i < S * S; i++) {
    if (!open[i] || sclera[i]) continue
    if (0.3 * px[4 * i] + 0.59 * px[4 * i + 1] + 0.11 * px[4 * i + 2] < 110) { xs.push(i % S); ys.push(Math.floor(i / S)) }
  }
  if (xs.length < 500) return null
  const q = (v: number[], p: number) => v.sort((m, n) => m - n)[Math.floor(p * (v.length - 1))]
  const x0 = q(xs, 0.02), x1 = q(xs, 0.98), y0 = q(ys, 0.02), y1 = q(ys, 0.98)
  const r = (x1 - x0) / 2
  // a fully visible iris is as tall as it is wide; otherwise the upper lid covers its top
  const cy = y1 - y0 > 1.8 * r ? (y0 + y1) / 2 : y0 + r
  // soft-edged opening mask in alpha (5×5 box blur)
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let sum = 0
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) sum += open[Math.min(S - 1, Math.max(0, y + dy)) * S + Math.min(S - 1, Math.max(0, x + dx))]
      px[4 * (y * S + x) + 3] = Math.round((sum / 25) * 255)
    }
  }
  return new THREE.Vector3(((x0 + x1) / 2 + 0.5) / S, (cy + 0.5) / S, (r * 1.08) / S) // 1.08: include the iris' soft outer edge
}
