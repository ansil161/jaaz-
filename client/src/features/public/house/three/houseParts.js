import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/* ============================================================
   HOUSE PARTS — the kit every room is built from

   One residence, nine zones, and the only way that stays
   coherent (and affordable) is if every zone is assembled from
   the same small set of pieces: a shell, a run of battens, a
   dropped coffer with a lit reveal, glazing, seating, a screen.

   TWO RULES HOLD THE WHOLE HOUSE TOGETHER.

   1. MATERIALS ARE PER-ZONE, NOT GLOBAL. `makeMaterials()`
      returns a fresh set for each zone, because the theatre's
      walls and the gaming suite's walls have to be tintable
      independently — sharing one instance would repaint the whole
      house every time a single room changed design. The cost is a
      few extra material objects; the alternative is a house that
      can only ever be one colour.

   2. GEOMETRY IS BUILT ONCE AND RE-DRESSED. Nothing is created
      or destroyed while the camera is moving. A design change is
      colour tweens and visibility flags, never a rebuild —
      allocating a mesh mid-walk is exactly what drops the frame
      the visitor notices.

   AXES for the whole house: +x east, +y up, -z toward the
   theatre screen. The theatre sits at the origin end; the spine
   corridor runs north up +z; the terrace lies east beyond +x.
   ============================================================ */

export const DBL = THREE.DoubleSide

/** A plane, with sides. Walls need both — the house is seen from
 *  outside during the arrival and from the terrace afterwards,
 *  and a single-sided wall is a window into the room behind it. */
export function panel(w, h, material) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), material)
}

/**
 * The tintable material set for one zone.
 *
 * `cove` and `step` are deliberately dim: they are the SOURCE of
 * the light, and a source rendered at the full value of the light
 * it casts reads as a hard graphic line ruled to the vanishing
 * point rather than as concealed lighting.
 */
export function makeMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({ color: 0x24242a, roughness: 0.94, side: DBL }),
    floor: new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.68, side: DBL }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0x131316, roughness: 0.96, side: DBL }),
    batten: new THREE.MeshStandardMaterial({ color: 0x53392a, roughness: 0.55, metalness: 0.04 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.62, metalness: 0 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x4a3325, roughness: 0.45, metalness: 0.05 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.42, metalness: 0.7 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.95 }),
    cove: new THREE.MeshBasicMaterial({ color: 0x8a5a26 }),
    step: new THREE.MeshBasicMaterial({ color: 0x7a5426 }),
  }
}

/** Speaker/equipment materials, which fade rather than tint. */
export function makeFadeMaterials() {
  return {
    body: new THREE.MeshStandardMaterial({
      color: 0x121215,
      roughness: 0.45,
      metalness: 0.35,
      transparent: true,
    }),
    face: new THREE.MeshStandardMaterial({
      color: 0x1d1d21,
      roughness: 0.92,
      transparent: true,
    }),
  }
}

/* Glass is shared across the whole house — every pane in the
   building is the same specification, so one instance is correct
   rather than merely convenient. Very low opacity with a high
   environment contribution reads as glass far better than any
   amount of transmission, and costs nothing. */
export const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x8fa6b8,
  roughness: 0.06,
  metalness: 0.1,
  transparent: true,
  opacity: 0.16,
  side: DBL,
})

export const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0x0e0f11,
  roughness: 0.4,
  metalness: 0.6,
})

/* The water carries its own glow. Underwater niches sit below an
   opaque surface, so lighting them lights nothing a viewer above
   the water can see — the signature of a lit pool at night is the
   WATER being bright, plus the wash it throws onto the coping.
   `emissiveIntensity` is what the terrace's lighting circuit
   actually drives. */
export const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x0d2a33,
  roughness: 0.08,
  metalness: 0.35,
  emissive: new THREE.Color(0x2f8fa8),
  emissiveIntensity: 0,
})

/**
 * A rectangular room shell with an optional list of openings.
 *
 * `openings` are cut by BUILDING AROUND THEM rather than by
 * subtracting geometry: each wall that has a hole is emitted as
 * the pieces surrounding it. CSG would be the obvious approach
 * and is not worth a library, a build step, or the artefacts it
 * leaves on coplanar faces — four quads produce exactly the same
 * picture.
 *
 * An opening is `{ wall: 'n'|'s'|'e'|'w', from, to, h }` where
 * `from`/`to` are along that wall's own axis, in world units.
 */
export function shell({ x0, x1, z0, z1, h, mat, openings = [], floor = true, ceiling = true }) {
  const g = new THREE.Group()
  const w = x1 - x0
  const d = z1 - z0
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2

  if (floor) {
    const f = panel(w, d, mat.floor)
    f.rotation.x = -Math.PI / 2
    f.position.set(cx, 0, cz)
    g.add(f)
  }
  if (ceiling) {
    const c = panel(w, d, mat.ceiling)
    c.rotation.x = Math.PI / 2
    c.position.set(cx, h, cz)
    g.add(c)
  }

  /* Each wall, described once, then emitted in pieces around any
     openings that belong to it. */
  const walls = [
    { id: 'n', a0: x0, a1: x1, fixed: z1, axis: 'x', rot: Math.PI },
    { id: 's', a0: x0, a1: x1, fixed: z0, axis: 'x', rot: 0 },
    { id: 'e', a0: z0, a1: z1, fixed: x1, axis: 'z', rot: -Math.PI / 2 },
    { id: 'w', a0: z0, a1: z1, fixed: x0, axis: 'z', rot: Math.PI / 2 },
  ]

  for (const wall of walls) {
    const holes = openings
      .filter((o) => o.wall === wall.id)
      .sort((a, b) => a.from - b.from)

    /* Solid runs between the holes, plus the lintel over each. */
    let cursor = wall.a0
    for (const hole of holes) {
      const from = Math.max(wall.a0, hole.from)
      const to = Math.min(wall.a1, hole.to)
      if (from > cursor) emit(g, wall, cursor, from, 0, h, mat.wall)
      const top = hole.h ?? h
      if (top < h) emit(g, wall, from, to, top, h, mat.wall)
      cursor = to
    }
    if (cursor < wall.a1) emit(g, wall, cursor, wall.a1, 0, h, mat.wall)
  }

  return g
}

/** One piece of wall, between `a0`..`a1` along its axis and
 *  `y0`..`y1` in height. */
function emit(group, wall, a0, a1, y0, y1, material) {
  const len = a1 - a0
  const height = y1 - y0
  if (len <= 0.001 || height <= 0.001) return
  const mesh = panel(len, height, material)
  mesh.rotation.y = wall.rot
  const mid = (a0 + a1) / 2
  if (wall.axis === 'x') mesh.position.set(mid, y0 + height / 2, wall.fixed)
  else mesh.position.set(wall.fixed, y0 + height / 2, mid)
  group.add(mesh)
}

/**
 * A dropped coffer with a lit reveal — the single most
 * identifiable feature of an expensive room.
 *
 * The lit strips sit IN the reveal, below the coffer panel,
 * facing down into the room. Putting them above the panel (the
 * obvious first guess) means the panel occludes them from every
 * angle inside the room and all that survives is a smear.
 */
export function coffer({ x0, x1, z0, z1, h, drop = 0.3, inset = 0.75, mat }) {
  const g = new THREE.Group()
  const cw = x1 - x0 - inset * 2
  const cd = z1 - z0 - inset * 2
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  if (cw <= 0.4 || cd <= 0.4) return g

  const panelMesh = panel(cw, cd, mat.ceiling)
  panelMesh.rotation.x = Math.PI / 2
  panelMesh.position.set(cx, h - drop, cz)
  g.add(panelMesh)

  /* The returns of the drop, so the step reads as solid rather
     than as a slab hovering under the ceiling. */
  for (const side of [-1, 1]) {
    const rx = panel(cd, drop, mat.ceiling)
    rx.rotation.y = side * Math.PI * 0.5
    rx.position.set(cx + side * (cw / 2), h - drop / 2, cz)
    g.add(rx)
    const rz = panel(cw, drop, mat.ceiling)
    rz.rotation.y = side < 0 ? Math.PI : 0
    rz.position.set(cx, h - drop / 2, cz + side * (cd / 2))
    g.add(rz)
  }

  const y = h - drop + 0.03
  for (const side of [-1, 1]) {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, cd), mat.cove)
    s1.position.set(cx + side * (cw / 2 + 0.04), y, cz)
    g.add(s1)
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(cw + 0.16, 0.03, 0.03), mat.cove)
    s2.position.set(cx, y, cz + side * (cd / 2 + 0.04))
    g.add(s2)
  }

  return g
}

/** Vertical acoustic battens along a wall run, as one instanced
 *  mesh. Eighty fins for one draw call, and a single visibility
 *  flag turns the whole scheme on or off. */
export function battenRun({ mat, count, height, at }) {
  const geo = new THREE.BoxGeometry(0.055, height, 0.11)
  const mesh = new THREE.InstancedMesh(geo, mat.batten, count)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < count; i++) {
    const p = at(i / Math.max(1, count - 1))
    dummy.position.set(p.x, height / 2, p.z)
    dummy.rotation.y = p.ry ?? 0
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

/** A glazed opening: mullions plus a pane. Used for every window
 *  and every sliding door in the house. */
export function glazing({ from, to, h, fixed, axis, mullions = 4, sill = 0 }) {
  const g = new THREE.Group()
  const len = to - from
  const place = (a, y, w, ht, thick) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, ht, thick), frameMaterial)
    if (axis === 'x') m.position.set(a, y, fixed)
    else m.position.set(fixed, y, a)
    if (axis === 'z') {
      m.geometry.dispose()
      m.geometry = new THREE.BoxGeometry(thick, ht, w)
    }
    g.add(m)
  }

  /* Head and sill. */
  place((from + to) / 2, h, len, 0.09, 0.09)
  place((from + to) / 2, sill + 0.045, len, 0.09, 0.09)

  for (let i = 0; i <= mullions; i++) {
    const a = from + (len * i) / mullions
    place(a, (h + sill) / 2, 0.07, h - sill, 0.07)
  }

  const pane = panel(len, h - sill, glassMaterial)
  if (axis === 'x') pane.position.set((from + to) / 2, (h + sill) / 2, fixed)
  else {
    pane.rotation.y = Math.PI / 2
    pane.position.set(fixed, (h + sill) / 2, (from + to) / 2)
  }
  g.add(pane)

  return g
}

/** One recliner: base, back, headrest, arms, timber console. */
export function recliner(leather, trim) {
  const s = new THREE.Group()
  const add = (geo, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, z)
    m.rotation.x = rx
    s.add(m)
    return m
  }

  add(new RoundedBoxGeometry(0.82, 0.42, 0.88, 3, 0.07), leather, 0, 0.36, 0)
  add(new RoundedBoxGeometry(0.8, 0.78, 0.2, 3, 0.07), leather, 0, 0.86, 0.36, -0.16)
  add(new RoundedBoxGeometry(0.52, 0.26, 0.18, 3, 0.06), leather, 0, 1.32, 0.28, -0.1)

  for (const side of [-1, 1]) {
    add(new RoundedBoxGeometry(0.14, 0.26, 0.8, 3, 0.05), leather, side * 0.46, 0.6, -0.02)
    add(new THREE.BoxGeometry(0.15, 0.02, 0.5), trim, side * 0.46, 0.74, -0.06)
  }
  return s
}

/** A low lounge unit — the outdoor and living seating. */
export function lounge(fabric, trim, w = 2.2) {
  const g = new THREE.Group()
  const base = new THREE.Mesh(new RoundedBoxGeometry(w, 0.34, 0.95, 3, 0.05), fabric)
  base.position.y = 0.24
  g.add(base)
  const back = new THREE.Mesh(new RoundedBoxGeometry(w, 0.46, 0.2, 3, 0.05), fabric)
  back.position.set(0, 0.62, 0.38)
  g.add(back)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.08, 1.05), trim)
  plinth.position.y = 0.04
  g.add(plinth)
  return g
}

/**
 * A screen: image plane, bezel, and the area light it casts.
 *
 * Returned as a unit-sized plane so changing size is one tween on
 * `scale` rather than new geometry. The caller positions and
 * orients it; `axis` says which way it faces so the light can be
 * aimed with it.
 */
export function screenUnit(screenMat, bezelMat, { facing = 'z' } = {}) {
  const g = new THREE.Group()

  const bezel = panel(1, 1, bezelMat)
  bezel.position.z = -0.02
  g.add(bezel)

  const image = panel(1, 1, screenMat)
  g.add(image)

  const light = new THREE.RectAreaLight(0xbcd0e8, 2.2, 4, 2)
  light.position.z = 0.06
  g.add(light)

  return { group: g, image, bezel, light, facing }
}

/** The canvas the screens display: a dim held frame, not a
 *  lightbox. A near-white screen blows out under bloom and turns
 *  the room into a light source with furniture in it. */
export function screenTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 64, 8, 128, 64, 170)
  grad.addColorStop(0, '#8b98a8')
  grad.addColorStop(0.45, '#5c6878')
  grad.addColorStop(1, '#2b3340')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 128)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Deterministic pseudo-random, so a star ceiling or a planting
 *  bed is identical on every load and never reshuffles. */
export function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Fibre-optic points across a ceiling. */
export function starfield({ x0, x1, z0, z1, y, count = 210, seed = 20260825 }) {
  const rnd = seeded(seed)
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = x0 + rnd() * (x1 - x0)
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z0 + rnd() * (z1 - z0)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({
    color: 0xffeccd,
    size: 0.024,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
    toneMapped: false,
  })
  return new THREE.Points(geo, mat)
}

/** Dispose everything under a node. */
export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []
    for (const m of mats) {
      if (m.map) m.map.dispose()
      m.dispose()
    }
  })
}
