import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

// Small personal details projected onto me.glb's face as decals: a fabric bandage across the
// bridge of the nose and a lipstick kiss on the cheek. The decal geometry is cut from the real
// face triangles (no floating cards), shares the mesh's transform (follows every camera move and
// the works spin), and leaves the original mesh and texture untouched.
//
// All points are in me.glb's own model space (bust faces +X, up +Y, pivot at the bbox centre;
// eye centre ≈ (0.21, 0.19, 0), nose tip ≈ (0.30, 0.09, 0)).
interface Detail {
  name: string
  aim: THREE.Vector3 // a point just behind the skin to aim at
  from: THREE.Vector3 // direction the ray comes from (roughly the surface normal)
  size: THREE.Vector3 // decal width, height, projection depth
  roll: number // rotation around the surface normal (rad)
  texture: () => THREE.Texture
  roughness: number
}

const DETAILS: Detail[] = [
  {
    name: 'nose-bandage',
    aim: new THREE.Vector3(0.21, 0.152, 0),
    from: new THREE.Vector3(1, 0, 0),
    size: new THREE.Vector3(0.12, 0.036, 0.09),
    roll: THREE.MathUtils.degToRad(-7),
    texture: bandageTexture,
    roughness: 0.85,
  },
  {
    // on the character's right cheek (world +X side, the side the close-ups visit)
    name: 'cheek-kiss',
    aim: new THREE.Vector3(0.16, 0.06, -0.11),
    from: new THREE.Vector3(0.85, 0.05, -0.52),
    size: new THREE.Vector3(0.07, 0.056, 0.06),
    roll: THREE.MathUtils.degToRad(18),
    texture: kissTexture,
    roughness: 0.42,
  },
]


export function addFaceDetails(mesh: THREE.Mesh) {
  const src = mesh.geometry
  const pos = src.attributes.position.array as ArrayLike<number>
  const nrm = src.attributes.normal.array as ArrayLike<number>
  const idx = src.index ? (src.index.array as ArrayLike<number>) : null
  const vertCount = idx ? idx.length : pos.length / 3

  // 1) One pass over the raw arrays: copy out each detail's local face patch, so the raycast and
  //    decal clip a few thousand triangles instead of all 1.9M
  // patch radius: half the decal box diagonal + room for the aim point sitting behind the skin
  const r2s = DETAILS.map((d) => (d.size.length() / 2 + 0.03) ** 2)
  const patches = DETAILS.map(() => ({ p: [] as number[], n: [] as number[] }))
  for (let i = 0; i < vertCount; i += 3) {
    const a = (idx ? idx[i] : i) * 3
    for (let d = 0; d < DETAILS.length; d++) {
      const aim = DETAILS[d].aim
      const dx = pos[a] - aim.x
      const dy = pos[a + 1] - aim.y
      const dz = pos[a + 2] - aim.z
      if (dx * dx + dy * dy + dz * dz > r2s[d]) continue
      const { p, n } = patches[d]
      for (let k = 0; k < 3; k++) {
        const v = (idx ? idx[i + k] : i + k) * 3
        p.push(pos[v], pos[v + 1], pos[v + 2])
        n.push(nrm[v], nrm[v + 1], nrm[v + 2])
      }
    }
  }

  DETAILS.forEach((d, di) => {
    const { p, n } = patches[di]
    const patchGeo = new THREE.BufferGeometry()
    patchGeo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    patchGeo.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3))
    const patch = new THREE.Mesh(patchGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))

    // 2) Find the exact skin point + normal under the aim point
    const dir = d.from.clone().normalize()
    const ray = new THREE.Raycaster(d.aim.clone().addScaledVector(dir, 0.5), dir.clone().negate())
    const hit = ray.intersectObject(patch)[0]
    if (!hit || !hit.face) {
      console.warn(`[faceDetails] no surface found for ${d.name}`)
      patchGeo.dispose()
      return
    }
    const normal = hit.face.normal.clone()
    if (normal.dot(dir) < 0) normal.negate()

    // 3) Orient the projector along the normal (up stays model +Y so the bandage reads horizontal)
    const helper = new THREE.Object3D()
    helper.position.copy(hit.point)
    helper.lookAt(hit.point.clone().add(normal))
    helper.rotateZ(d.roll)

    // patch has an identity matrixWorld, so the decal comes out in model space → child of the mesh
    const geo = new DecalGeometry(patch, hit.point, helper.rotation, d.size)
    patchGeo.dispose()
    const decal = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        map: d.texture(),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: d.roughness,
        metalness: 0,
      })
    )
    decal.name = d.name
    decal.receiveShadow = true
    decal.renderOrder = 1
    mesh.add(decal)
  })
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

// Fabric adhesive bandage: tan strip, paler gauze pad, vent holes, slightly darker worn edges
function bandageTexture() {
  return canvasTexture(512, 154, (ctx) => {
    const W = 512
    const H = 154
    const strip = new Path2D()
    strip.roundRect(6, 8, W - 12, H - 16, (H - 16) / 2)
    ctx.save()
    ctx.clip(strip)
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#c99a74')
    g.addColorStop(0.5, '#c39270')
    g.addColorStop(1, '#b48463')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // fine fabric weave
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,240,225,0.10)' : 'rgba(120,70,40,0.07)'
      ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 3, 1)
    }
    // vent holes on both adhesive tabs
    ctx.fillStyle = 'rgba(105,62,38,0.5)'
    for (const x0 of [44, 352]) {
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 4; y++) {
          ctx.beginPath()
          ctx.arc(x0 + x * 21 + (y % 2) * 10, 40 + y * 25, 3.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    // gauze pad
    ctx.fillStyle = '#dcc2a6'
    ctx.beginPath()
    ctx.roundRect(196, 30, 120, H - 60, 10)
    ctx.fill()
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = 'rgba(170,130,100,0.12)'
      ctx.fillRect(196 + Math.random() * 120, 30 + Math.random() * (H - 60), 1.5, 1.5)
    }
    ctx.strokeStyle = 'rgba(150,105,75,0.35)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
    // soft darker rim where the edge lifts off the skin
    ctx.strokeStyle = 'rgba(130,82,55,0.45)'
    ctx.lineWidth = 4
    ctx.stroke(strip)
  })
}

// Lipstick imprint: two lips with a cupid's bow, broken up by lip creases, softer at the edges
function kissTexture() {
  return canvasTexture(256, 204, (ctx) => {
    const lips = new Path2D()
    // upper lip
    lips.moveTo(18, 104)
    lips.bezierCurveTo(48, 70, 86, 44, 112, 62)
    lips.quadraticCurveTo(128, 72, 144, 62)
    lips.bezierCurveTo(170, 44, 208, 70, 238, 104)
    lips.bezierCurveTo(196, 96, 160, 92, 128, 101)
    lips.bezierCurveTo(96, 92, 60, 96, 18, 104)
    // lower lip
    lips.moveTo(26, 112)
    lips.bezierCurveTo(70, 108, 100, 112, 128, 113)
    lips.bezierCurveTo(156, 112, 186, 108, 230, 112)
    lips.bezierCurveTo(200, 160, 160, 176, 128, 176)
    lips.bezierCurveTo(96, 176, 56, 160, 26, 112)

    ctx.filter = 'blur(1.4px)'
    ctx.fillStyle = 'rgba(176, 30, 58, 0.72)'
    ctx.fill(lips)
    ctx.filter = 'none'

    // lip creases: thin gaps radiating from the mouth line
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,0.75)'
    for (let i = 0; i < 46; i++) {
      const x = 30 + (i / 45) * 196 + (Math.random() - 0.5) * 4
      const lean = (x - 128) * 0.12
      ctx.lineWidth = 0.8 + Math.random() * 1.3
      ctx.beginPath()
      ctx.moveTo(x, 106 - 6 - Math.random() * 8)
      ctx.lineTo(x - lean, 60 + Math.random() * 18)
      ctx.moveTo(x, 110 + 4 + Math.random() * 8)
      ctx.lineTo(x + lean, 176 - Math.random() * 24)
      ctx.stroke()
    }
    // patchy transfer — lipstick never prints evenly
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.35})`
      ctx.beginPath()
      ctx.arc(20 + Math.random() * 216, 50 + Math.random() * 130, 1 + Math.random() * 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  })
}
