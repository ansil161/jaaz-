import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { gsap } from '@/lib/animation/gsap'
import {
  PLAN,
  audioSets,
  gamingDesigns,
  outdoorDesigns,
  screens,
  speakerSets,
  theatreDesigns,
  wallMaterials,
} from '@/features/public/data/house'
import {
  battenRun,
  coffer,
  disposeTree,
  frameMaterial,
  glazing,
  lounge,
  makeFadeMaterials,
  makeMaterials,
  panel,
  recliner,
  screenTexture,
  screenUnit,
  seeded,
  shell,
  starfield,
  waterMaterial,
} from './houseParts'

/* ============================================================
   THE ZONES — nine spaces that add up to one residence

   Each zone builds its own geometry, owns its own materials and
   exposes one `apply()`. The house never rebuilds anything: a
   design change is colour tweens and visibility flags, and a zone
   the camera cannot see is switched off entirely — which is what
   makes a house this size cost about the same to draw as the
   single room it grew out of.

   Switching a group off also switches off every light inside it,
   because three skips lights on invisible objects. So the
   culling is doing double duty: fewer triangles AND fewer lights
   in the shader, for free.
   ============================================================ */

/* Shared tween helper. Colours are interpolated in place so a
   material can be re-tinted mid-walk without reallocating. */
const TWEENS = []
function tint(material, hex, dur, immediate) {
  if (immediate) {
    material.color.setHex(hex)
    return
  }
  const t = new THREE.Color(hex)
  TWEENS.push(
    gsap.to(material.color, {
      r: t.r,
      g: t.g,
      b: t.b,
      duration: dur,
      ease: 'power2.inOut',
      overwrite: 'auto',
    }),
  )
}

function dim(hex, k) {
  return new THREE.Color(hex).multiplyScalar(k).getHex()
}

/** Fade a group in or out, and stop drawing it when it is gone. */
function fade(group, on, dur, immediate) {
  if (immediate) {
    group.visible = on
    group.userData.o = on ? 1 : 0
    group.traverse((c) => {
      if (c.material && c.material.transparent) c.material.opacity = on ? 1 : 0
    })
    return
  }
  if (on && !group.visible) group.visible = true
  if (group.userData.o === undefined) group.userData.o = group.visible ? 1 : 0
  TWEENS.push(
    gsap.to(group.userData, {
      o: on ? 1 : 0,
      duration: dur,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: () => {
        const o = group.userData.o
        group.traverse((c) => {
          if (c.material && c.material.transparent) c.material.opacity = o
        })
      },
      onComplete: () => {
        if (!on) group.visible = false
      },
    }),
  )
}

function intensity(light, value, dur, immediate) {
  if (immediate) light.intensity = value
  else
    TWEENS.push(
      gsap.to(light, { intensity: value, duration: dur, ease: 'power2.inOut', overwrite: 'auto' }),
    )
}

/* ============================================================
   THEATRE
   ============================================================ */
function buildTheatre() {
  const P = { w: 9, d: 14, h: 3.4, halfW: 4.5, zScreen: -7, zBack: 7 }
  const mat = makeMaterials()
  const spkMat = makeFadeMaterials()
  const g = new THREE.Group()

  g.add(
    shell({
      x0: -P.halfW,
      x1: P.halfW,
      z0: P.zScreen,
      z1: P.zBack,
      h: P.h,
      mat,
      openings: [{ wall: 'n', from: -0.9, to: 0.9, h: 2.4 }],
    }),
  )

  /* The door reveal — 300mm of wall thickness you pass through.
     Without it the threshold reads as a printed hole rather than
     as an opening in something solid. */
  for (const side of [-1, 1]) {
    const jamb = panel(0.3, 2.4, mat.trim)
    jamb.rotation.y = side * -Math.PI * 0.5
    jamb.position.set(side * 0.9, 1.2, P.zBack + 0.15)
    g.add(jamb)
  }
  const soffit = panel(1.8, 0.3, mat.trim)
  soffit.rotation.x = Math.PI / 2
  soffit.position.set(0, 2.4, P.zBack + 0.15)
  g.add(soffit)

  const battens = battenRun({
    mat,
    count: 76,
    height: P.h,
    at: (t) => {
      const side = t < 0.5 ? -1 : 1
      const u = t < 0.5 ? t * 2 : (t - 0.5) * 2
      return { x: side * (P.halfW - 0.06), z: -6.6 + u * 13.2 }
    },
  })
  g.add(battens)

  g.add(coffer({ x0: -P.halfW, x1: P.halfW, z0: P.zScreen, z1: P.zBack, h: P.h, mat }))

  const stars = starfield({ x0: -3.5, x1: 3.5, z0: -5.4, z1: 5.4, y: P.h - 0.34 })
  g.add(stars)

  /* Screen */
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false })
  const unit = screenUnit(screenMat, mat.metal)
  unit.group.position.set(0, 1.55, P.zScreen + 0.06)
  g.add(unit.group)

  /* Seating: two blocks of three, twice, with a centre aisle. */
  const riser = new THREE.Mesh(new THREE.BoxGeometry(P.w, 0.45, 4.6), mat.floor)
  riser.position.set(0, 0.225, 4.7)
  g.add(riser)
  for (const x of [-2.7, -1.75, -0.8, 0.8, 1.75, 2.7]) {
    const a = recliner(mat.leather, mat.trim)
    a.position.set(x, 0, 1.2)
    g.add(a)
    const b = recliner(mat.leather, mat.trim)
    b.position.set(x, 0.45, 3.9)
    g.add(b)
  }

  const nosing = new THREE.Mesh(new THREE.BoxGeometry(P.w - 0.4, 0.025, 0.04), mat.step)
  nosing.position.set(0, 0.44, 2.38)
  g.add(nosing)

  /* Speakers, all four systems, shown on demand. */
  const spk = {
    towers: new THREE.Group(),
    inwall: new THREE.Group(),
    surrounds: new THREE.Group(),
    ceiling: new THREE.Group(),
    subs: new THREE.Group(),
  }
  for (const side of [-1, 1]) {
    const body = new THREE.Mesh(new RoundedBoxGeometry(0.34, 1.15, 0.34, 2, 0.02), spkMat.body)
    body.position.set(side * 3.0, 0.575, P.zScreen + 0.55)
    spk.towers.add(body)
    const sub = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.55, 0.5, 2, 0.03), spkMat.body)
    sub.position.set(side * 3.85, 0.275, P.zScreen + 0.5)
    spk.subs.add(sub)
  }
  for (const [x, y] of [[-2.75, 1.5], [2.75, 1.5], [0, 0.62]]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.05), spkMat.face)
    box.position.set(x, y, P.zScreen + 0.03)
    spk.inwall.add(box)
  }
  for (const side of [-1, 1]) {
    for (const z of [-2.2, 1.6]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.42), spkMat.face)
      s.position.set(side * (P.halfW - 0.03), 1.35, z)
      spk.surrounds.add(s)
    }
    for (const z of [-2.6, 1.4]) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 18), spkMat.face)
      d.position.set(side * 1.7, P.h - 0.25, z)
      spk.ceiling.add(d)
    }
  }
  for (const s of Object.values(spk)) {
    s.visible = false
    g.add(s)
  }

  const coveLights = [-3.4, 3.4].map((z) => {
    const l = new THREE.PointLight(0xffb765, 2.1, 16, 2)
    l.position.set(0, P.h - 0.35, z)
    g.add(l)
    return l
  })
  const fill = new THREE.PointLight(0x9fb6d4, 0.7, 12, 2)
  fill.position.set(0, 1.4, P.zScreen + 2.4)
  g.add(fill)
  /* A rim from behind the seating. Black leather in a black room
     has no silhouette without it. */
  const rim = new THREE.PointLight(0xffd2a0, 1.1, 11, 2)
  rim.position.set(0, 2.9, 6.2)
  g.add(rim)

  let last = null
  function apply(state, { immediate = false, duration = 0.85 } = {}) {
    const d = theatreDesigns[state.design ?? 0] ?? theatreDesigns[0]
    const wallId = state.wall ?? d.wall
    const screenId = state.screen ?? d.screen
    const spkId = state.speakers ?? d.speakers
    const key = `${d.id}|${wallId}|${screenId}|${spkId}`
    if (key === last) return d
    last = key

    const wm = wallMaterials[wallId] ?? wallMaterials.charcoal
    tint(mat.wall, wm.color, duration, immediate)
    mat.wall.roughness = wm.roughness
    tint(mat.floor, d.floor, duration, immediate)
    tint(mat.ceiling, d.ceil, duration, immediate)
    tint(mat.batten, d.battenColor, duration, immediate)
    tint(mat.leather, d.seat, duration, immediate)
    mat.leather.roughness = d.seatRough
    tint(mat.cove, dim(d.cove, 0.34), duration, immediate)
    tint(mat.step, dim(d.cove, 0.34), duration, immediate)

    battens.visible = d.battens
    const starMat = stars.material
    if (immediate) {
      starMat.opacity = d.star ? 0.72 : 0
      stars.visible = d.star
    } else {
      stars.visible = true
      TWEENS.push(
        gsap.to(starMat, {
          opacity: d.star ? 0.72 : 0,
          duration,
          ease: 'power2.inOut',
          overwrite: 'auto',
          onComplete: () => {
            stars.visible = starMat.opacity > 0.01
          },
        }),
      )
    }

    for (const l of coveLights) {
      l.color.setHex(d.cove)
      intensity(l, d.coveI, duration, immediate)
    }

    const sc = screens[screenId] ?? screens.scope
    const sw = sc.w
    const sh = sc.w / sc.aspect
    if (immediate) {
      unit.image.scale.set(sw, sh, 1)
      unit.bezel.scale.set(sw + 0.24, sh + 0.24, 1)
      unit.light.width = sw
      unit.light.height = sh
    } else {
      TWEENS.push(
        gsap.to(unit.image.scale, { x: sw, y: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.bezel.scale, { x: sw + 0.24, y: sh + 0.24, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.light, { width: sw, height: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
      )
    }

    const set = speakerSets[spkId] ?? speakerSets.inwall
    for (const [k, group] of Object.entries(spk)) fade(group, set.show.includes(k), duration * 0.7, immediate)

    return d
  }

  return { group: g, apply, exposureFor: (i) => (theatreDesigns[i] ?? theatreDesigns[0]).exposure }
}

/* ============================================================
   SPINE — the corridor every room opens off
   ============================================================ */
function buildSpine() {
  const P = PLAN.spine
  const mat = makeMaterials()
  mat.wall.color.setHex(0x1f1d1b)
  mat.floor.color.setHex(0x201c18)
  mat.ceiling.color.setHex(0x141312)
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 's', from: PLAN.theatre.door.x0, to: PLAN.theatre.door.x1, h: 2.4 },
        { wall: 'n', from: -7.4, to: -5.6, h: 2.4 },
        { wall: 'e', from: PLAN.corridorB.z0, to: PLAN.corridorB.z1 },
        { wall: 'w', from: 24, to: 30 },
      ],
    }),
  )

  /* Slot lights washing the walls. The corridor is long and
     featureless by design; these are what give the walk something
     to move past, which is most of what makes it read as travel. */
  /* Ten slots drawn, three casting. The corridor is long and the
     slots are what give the walk something to move past; the
     lighting only has to be continuous, not per-slot. */
  const lights = []
  const RUN = [10, 16, 22, 28, 34]
  RUN.forEach((z, i) => {
    for (const side of [-1, 1]) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.1, 0.04), mat.cove)
      slot.position.set(side < 0 ? P.x0 + 0.03 : P.x1 - 0.03, 1.35, z)
      g.add(slot)
    }
    if (i % 2) return
    const l = new THREE.PointLight(0xffb765, 1.5, 13, 2)
    l.position.set((P.x0 + P.x1) / 2, 2.4, z)
    g.add(l)
    lights.push(l)
  })

  return { group: g, lights, mat }
}

/* ============================================================
   ENTRANCE
   ============================================================ */
function buildEntrance() {
  const P = PLAN.entrance
  const mat = makeMaterials()
  mat.wall.color.setHex(0x232120)
  mat.floor.color.setHex(0x241f1a)
  mat.ceiling.color.setHex(0x161514)
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 's', from: -7.4, to: -5.6, h: 2.4 },
        { wall: 'n', from: -7.6, to: -5.4, h: 2.6 },
      ],
    }),
  )
  g.add(glazing({ from: -7.6, to: -5.4, h: 2.6, fixed: P.z1, axis: 'x', mullions: 2 }))
  g.add(coffer({ ...P, mat, drop: 0.26, inset: 0.6 }))

  const l = new THREE.PointLight(0xffb765, 1.6, 12, 2)
  l.position.set((P.x0 + P.x1) / 2, 2.6, 42)
  g.add(l)

  return { group: g, lights: [l], mat }
}

/* ============================================================
   LIVING — and the stage the smart-home scenes are read from
   ============================================================ */
function buildLiving() {
  const P = PLAN.living
  const mat = makeMaterials()
  mat.wall.color.setHex(0x6a6259)
  mat.floor.color.setHex(0x3a2e22)
  mat.ceiling.color.setHex(0x5f584f)
  mat.fabric.color.setHex(0x4a463f)
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 'e', from: 24, to: 30 },
        { wall: 'w', from: 23, to: 32 },
        { wall: 'n', from: -15, to: -10 },
      ],
    }),
  )
  g.add(glazing({ from: 23, to: 32, h: P.h - 0.2, fixed: P.x0, axis: 'z', mullions: 5 }))
  g.add(glazing({ from: -15, to: -10, h: P.h - 0.2, fixed: P.z1, axis: 'x', mullions: 3 }))
  g.add(coffer({ ...P, mat, drop: 0.28, inset: 1.1 }))

  const sofa = lounge(mat.fabric, mat.trim, 3.2)
  sofa.position.set(-12.5, 0, 25)
  g.add(sofa)
  const sofa2 = lounge(mat.fabric, mat.trim, 2.4)
  sofa2.rotation.y = Math.PI / 2
  sofa2.position.set(-15.4, 0, 28)
  g.add(sofa2)

  const table = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.28, 0.8, 3, 0.03), mat.trim)
  table.position.set(-12.5, 0.24, 27)
  g.add(table)

  /* The living display, flush in the east return. */
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false })
  const unit = screenUnit(screenMat, mat.metal)
  unit.group.rotation.y = Math.PI / 2
  unit.group.position.set(P.x0 + 0.08, 1.5, 27)
  unit.image.scale.set(2.6, 1.46, 1)
  unit.bezel.scale.set(2.84, 1.7, 1)
  unit.light.width = 2.6
  unit.light.height = 1.46
  unit.light.intensity = 1.2
  g.add(unit.group)

  const lights = [
    new THREE.PointLight(0xffc98a, 2.2, 16, 2),
    new THREE.PointLight(0xffc98a, 1.6, 14, 2),
  ]
  lights[0].position.set(-12, 3.1, 26)
  lights[1].position.set(-15, 3.1, 31)
  for (const l of lights) g.add(l)

  return { group: g, lights, mat, screen: unit }
}

/* ============================================================
   CORRIDOR B — the link east, ending in the glass door
   ============================================================ */
function buildCorridorB() {
  const P = PLAN.corridorB
  const mat = makeMaterials()
  mat.wall.color.setHex(0x1f1d1b)
  mat.floor.color.setHex(0x201c18)
  mat.ceiling.color.setHex(0x141312)
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 'w', from: P.z0, to: P.z1 },
        { wall: 'e', from: 10.4, to: 13.6, h: 2.6 },
      ],
    }),
  )
  /* The glass door itself. Kept as glazing rather than a solid
     leaf because the point of the beat is that you can SEE the
     terrace before you reach it — the reveal happens through the
     door, not after it. */
  g.add(glazing({ from: 10.4, to: 13.6, h: 2.6, fixed: P.x1, axis: 'z', mullions: 2 }))

  const lights = [10, 1].map((x) => {
    const l = new THREE.PointLight(0xffb765, 1.5, 15, 2)
    l.position.set(x, 2.4, 12)
    g.add(l)
    return l
  })

  return { group: g, lights, mat }
}

/* ============================================================
   AUDIO — one chair, five ways to put sound around it
   ============================================================ */
function buildAudio() {
  const P = PLAN.audio
  const mat = makeMaterials()
  mat.wall.color.setHex(0x2b2723)
  mat.floor.color.setHex(0x2e2418)
  mat.ceiling.color.setHex(0x1a1815)
  const spkMat = makeFadeMaterials()
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 's', from: 5, to: 7, h: 2.4 },
        { wall: 'n', from: 5, to: 7, h: 2.4 },
        { wall: 'e', from: 16, to: 22 },
      ],
    }),
  )
  g.add(glazing({ from: 16, to: 22, h: P.h - 0.3, fixed: P.x1, axis: 'z', mullions: 3 }))
  g.add(coffer({ ...P, mat, drop: 0.26, inset: 0.9 }))

  /* Battens on the west return, behind the speakers. */
  g.add(
    battenRun({
      mat,
      count: 30,
      height: P.h,
      at: (t) => ({ x: P.x0 + 0.06, z: 15 + t * 8 }),
    }),
  )

  const chair = recliner(mat.leather, mat.trim)
  chair.position.set(7, 0, 19.5)
  g.add(chair)

  const sets = {
    towers: new THREE.Group(),
    bookshelf: new THREE.Group(),
    inwall: new THREE.Group(),
    ceiling: new THREE.Group(),
    sub: new THREE.Group(),
  }
  for (const side of [-1, 1]) {
    const x = 7 + side * 1.9
    const tower = new THREE.Mesh(new RoundedBoxGeometry(0.34, 1.18, 0.36, 2, 0.02), spkMat.body)
    tower.position.set(x, 0.59, 15.6)
    sets.towers.add(tower)

    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), spkMat.body)
    stand.position.set(x, 0.35, 15.8)
    sets.bookshelf.add(stand)
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.42, 0.3, 2, 0.02), spkMat.body)
    box.position.set(x, 0.9, 15.8)
    sets.bookshelf.add(box)

    const flush = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.05), spkMat.face)
    flush.position.set(x, 1.4, P.z0 + 0.04)
    sets.inwall.add(flush)

    for (const z of [16.6, 21]) {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 18), spkMat.face)
      disc.position.set(x, P.h - 0.22, z)
      sets.ceiling.add(disc)
    }
  }
  const sub = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.55, 0.5, 2, 0.03), spkMat.body)
  sub.position.set(3.1, 0.275, 15.4)
  sets.sub.add(sub)

  for (const s of Object.values(sets)) {
    s.visible = false
    g.add(s)
  }

  const lights = [
    new THREE.PointLight(0xffb765, 1.9, 13, 2),
    new THREE.PointLight(0xffd2a0, 1.0, 10, 2),
  ]
  lights[0].position.set(7, P.h - 0.4, 18)
  lights[1].position.set(7, 2.6, 22)
  for (const l of lights) g.add(l)

  let last = null
  function apply(state, { immediate = false, duration = 0.8 } = {}) {
    const set = audioSets[state.design ?? 0] ?? audioSets[0]
    if (set.id === last) return set
    last = set.id
    for (const [k, group] of Object.entries(sets)) fade(group, set.show.includes(k), duration, immediate)
    return set
  }

  return { group: g, lights, mat, apply }
}

/* ============================================================
   GAMING — four suites in one room
   ============================================================ */
function buildGaming() {
  const P = PLAN.gaming
  const mat = makeMaterials()
  const spkMat = makeFadeMaterials()
  const g = new THREE.Group()

  g.add(
    shell({
      ...P,
      mat,
      openings: [
        { wall: 's', from: 5, to: 7, h: 2.4 },
        { wall: 'e', from: 26, to: 32, h: 2.6 },
      ],
    }),
  )
  g.add(glazing({ from: 26, to: 32, h: 2.6, fixed: P.x1, axis: 'z', mullions: 3 }))
  g.add(coffer({ ...P, mat, drop: 0.26, inset: 0.9 }))

  /* On the NORTH wall, not the west. The display is on the west
     return, and a batten run there put a picket fence directly in
     front of the screen — 20mm proud of it, so every scheme with
     battens switched on rendered the picture through a set of
     bars. The north wall is what the camera sees to its right on
     the way in, and articulating it is what stops the room
     reading as three flat planes. */
  const battens = battenRun({
    mat,
    count: 40,
    height: P.h,
    at: (t) => ({ x: -1.2 + t * 12.4, z: P.z1 - 0.07 }),
  })
  g.add(battens)

  /* The display, on the west return so the camera meets it head
     on as it walks in from the terrace. */
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false })
  const unit = screenUnit(screenMat, mat.metal)
  unit.group.rotation.y = Math.PI / 2
  unit.group.position.set(P.x0 + 0.08, 1.45, 29)
  g.add(unit.group)

  const kit = {
    desk: new THREE.Group(),
    chair: new THREE.Group(),
    rig: new THREE.Group(),
    lounge: new THREE.Group(),
    stations: new THREE.Group(),
    towers: new THREE.Group(),
    panels: new THREE.Group(),
  }

  const desk = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.08, 0.85, 3, 0.02), mat.trim)
  desk.position.set(1.2, 0.74, 29)
  kit.desk.add(desk)
  for (const z of [28.7, 29.3]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.07), mat.metal)
    leg.position.set(0.1, 0.36, z)
    kit.desk.add(leg)
    const leg2 = leg.clone()
    leg2.position.x = 2.3
    kit.desk.add(leg2)
  }

  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.14, 0.6, 3, 0.04), mat.leather)
  seat.position.set(2.4, 0.5, 29)
  kit.chair.add(seat)
  const backRest = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.8, 0.14, 3, 0.04), mat.leather)
  backRest.position.set(2.7, 0.95, 29)
  kit.chair.add(backRest)

  /* Racing rig: cockpit, wheel deck, seat. */
  const tub = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.3, 0.9, 3, 0.05), mat.metal)
  tub.position.set(1.6, 0.3, 29)
  kit.rig.add(tub)
  const rigSeat = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.9, 0.5, 3, 0.05), mat.leather)
  rigSeat.position.set(2.2, 0.8, 29)
  rigSeat.rotation.z = 0.18
  kit.rig.add(rigSeat)
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 22), mat.metal)
  wheel.position.set(1.0, 0.85, 29)
  wheel.rotation.y = Math.PI / 2
  kit.rig.add(wheel)

  const gl = lounge(mat.fabric, mat.trim, 2.6)
  gl.rotation.y = -Math.PI / 2
  gl.position.set(3.4, 0, 29)
  kit.lounge.add(gl)

  for (const z of [27.6, 29, 30.4]) {
    const d = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.07, 0.7, 3, 0.02), mat.trim)
    d.position.set(1.0, 0.74, z)
    kit.stations.add(d)
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.9), mat.metal)
    m.position.set(0.3, 1.05, z)
    kit.stations.add(m)
  }

  for (const side of [-1, 1]) {
    const t = new THREE.Mesh(new RoundedBoxGeometry(0.3, 1.0, 0.3, 2, 0.02), spkMat.body)
    t.position.set(-1.2, 0.5, 29 + side * 2.2)
    kit.towers.add(t)
  }

  for (const z of [26.5, 28, 29.5, 31]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.9), mat.fabric)
    p.position.set(P.x1 - 0.1, 1.7, z)
    kit.panels.add(p)
  }

  for (const k of Object.values(kit)) {
    k.visible = false
    g.add(k)
  }

  const coveLights = [26.8, 31.6].map((z) => {
    const l = new THREE.PointLight(0xffb765, 1.9, 15, 2)
    l.position.set(4, P.h - 0.35, z)
    g.add(l)
    return l
  })

  let last = null
  function apply(state, { immediate = false, duration = 0.85 } = {}) {
    const d = gamingDesigns[state.design ?? 0] ?? gamingDesigns[0]
    if (d.id === last) return d
    last = d.id

    tint(mat.wall, d.wall, duration, immediate)
    tint(mat.floor, d.floor, duration, immediate)
    tint(mat.ceiling, d.ceil, duration, immediate)
    tint(mat.cove, dim(d.cove, 0.34), duration, immediate)
    tint(mat.step, dim(d.cove, 0.34), duration, immediate)
    battens.visible = d.battens

    for (const l of coveLights) {
      l.color.setHex(d.cove)
      intensity(l, d.coveI, duration, immediate)
    }

    const sw = d.screen.w
    const sh = d.screen.w / d.screen.aspect
    if (immediate) {
      unit.image.scale.set(sw, sh, 1)
      unit.bezel.scale.set(sw + 0.2, sh + 0.2, 1)
      unit.light.width = sw
      unit.light.height = sh
    } else {
      TWEENS.push(
        gsap.to(unit.image.scale, { x: sw, y: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.bezel.scale, { x: sw + 0.2, y: sh + 0.2, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.light, { width: sw, height: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
      )
    }

    for (const [k, group] of Object.entries(kit)) fade(group, d.show.includes(k), duration * 0.7, immediate)
    return d
  }

  return { group: g, lights: coveLights, mat, apply, exposureFor: (i) => (gamingDesigns[i] ?? gamingDesigns[0]).exposure }
}

/* ============================================================
   TERRACE — paving, pool, and four ways to use them
   ============================================================ */
function buildTerrace() {
  const P = PLAN.terrace
  const Q = PLAN.pool
  const mat = makeMaterials()
  const spkMat = makeFadeMaterials()
  const g = new THREE.Group()

  /* Paving in four strips AROUND the pool, not one slab across
     it. The first version laid a single plane over the whole
     terrace at y = 0.01 — one centimetre above the water — so the
     pool, its lights and its reflections were all sealed under a
     lid, and the centrepiece of the outdoor experience simply did
     not exist on screen. */
  const slab = (x0, x1, z0, z1) => {
    if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return
    const s = panel(x1 - x0, z1 - z0, mat.floor)
    s.rotation.x = -Math.PI / 2
    s.position.set((x0 + x1) / 2, 0.01, (z0 + z1) / 2)
    g.add(s)
  }
  slab(P.x0, P.x1, P.z0, Q.z0)
  slab(P.x0, P.x1, Q.z1, P.z1)
  slab(P.x0, Q.x0, Q.z0, Q.z1)
  slab(Q.x1, P.x1, Q.z0, Q.z1)

  /* A stone coping standing slightly proud of the paving, so the
     water has an edge rather than simply stopping. */
  const copingMat = new THREE.MeshStandardMaterial({ color: 0x5b564e, roughness: 0.85 })
  const cw = 0.45
  const bar = (w, d, x, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, d), copingMat)
    m.position.set(x, 0.045, z)
    g.add(m)
  }
  /* FOUR BARS, not a slab. A solid box the size of the pool is
     just the paving lid again one layer down — the water has to
     be surrounded, not covered. */
  bar(Q.x1 - Q.x0 + cw * 2, cw, (Q.x0 + Q.x1) / 2, Q.z0 - cw / 2)
  bar(Q.x1 - Q.x0 + cw * 2, cw, (Q.x0 + Q.x1) / 2, Q.z1 + cw / 2)
  bar(cw, Q.z1 - Q.z0, Q.x0 - cw / 2, (Q.z0 + Q.z1) / 2)
  bar(cw, Q.z1 - Q.z0, Q.x1 + cw / 2, (Q.z0 + Q.z1) / 2)

  /* The pool: a sunken box with a water plane just below the
     coping, and its own light. Water is the single most valuable
     object out here — it is what carries every other light in the
     scene as a reflection. */
  const poolBox = new THREE.Mesh(
    new THREE.BoxGeometry(Q.x1 - Q.x0, 1.6, Q.z1 - Q.z0),
    new THREE.MeshStandardMaterial({ color: 0x11333d, roughness: 0.5, side: THREE.BackSide }),
  )
  poolBox.position.set((Q.x0 + Q.x1) / 2, -0.8, (Q.z0 + Q.z1) / 2)
  g.add(poolBox)

  const water = panel(Q.x1 - Q.x0, Q.z1 - Q.z0, waterMaterial)
  water.rotation.x = -Math.PI / 2
  water.position.set((Q.x0 + Q.x1) / 2, -0.06, (Q.z0 + Q.z1) / 2)
  g.add(water)

  /* Five niches rather than three, and brighter. Underwater
     light has to travel through the water AND light the coping
     around it, and at the first values the pool read as a dark
     hole in a dark terrace. */
  /* FOUR niches, not ten. Every visible light is evaluated on every
     lit pixel in a forward renderer, so the terrace was costing ten
     lighting evaluations per fragment for a glow the emissive water
     was already providing. Four, spread down the length, read
     identically and cost less than half. Just ABOVE the surface —
     below it they were sealed under an opaque plane. */
  const poolLights = []
  for (const z of [Q.z0 + 3, Q.z1 - 3]) {
    for (const side of [-1, 1]) {
      const l = new THREE.PointLight(0x7fd8e8, 3.4, 16, 2)
      l.position.set((Q.x0 + Q.x1) / 2 + side * 5.0, 0.22, z)
      g.add(l)
      poolLights.push(l)
    }
  }

  /* Planting along the north and east edges, so the terrace has a
     boundary and the camera has parallax as it moves. */
  const rnd = seeded(90210)
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x1d2a1c, roughness: 0.95 })
  /* Dense and overlapping, sitting into the ground rather than on
     it. Spaced apart at full height they read as a row of crates;
     overlapped and part-buried they read as planting. */
  const hedge = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 1.0, 1.4), plantMat, 72)
  const dummy = new THREE.Object3D()
  for (let i = 0; i < 72; i++) {

    if (i < 40) dummy.position.set(P.x0 + 0.6 + (i / 39) * 27, 0.34 + rnd() * 0.22, P.z1 - 1.1)
    else dummy.position.set(P.x1 - 1.1, 0.34 + rnd() * 0.22, P.z0 + 1 + ((i - 40) / 31) * 44)
    dummy.rotation.y = rnd() * 3
    dummy.updateMatrix()
    hedge.setMatrixAt(i, dummy.matrix)
  }
  hedge.instanceMatrix.needsUpdate = true
  g.add(hedge)

  /* Every fitting is still drawn — they are what the eye reads as
     "there are lights here" — but only four of them actually cast.
     A visible emissive fitting costs one small mesh; a PointLight
     costs a lighting evaluation on every fragment in the scene. */
  const landscapeLights = []
  const FITTINGS = [[14.4, 2], [14.4, 10], [14.4, 18], [14.4, 26], [34, 4], [34, 14], [24, 30], [30, 24]]
  FITTINGS.forEach(([lx, lz], i) => {
    const fitting = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), mat.step)
    fitting.position.set(lx, 0.06, lz)
    g.add(fitting)
    if (i % 2) return
    const l = new THREE.PointLight(0xffc98a, 3.0, 14, 2)
    l.position.set(lx, 0.5, lz)
    g.add(l)
    landscapeLights.push(l)
  })

  /* The outdoor display, at the head of the pool facing the
     house, so the camera walking east meets it straight on. */
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false })
  const unit = screenUnit(screenMat, mat.metal)
  unit.group.rotation.y = -Math.PI / 2
  unit.group.position.set(35.5, 1.9, 8)
  g.add(unit.group)
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.9, 0.14), frameMaterial)
  post.position.set(35.6, 0.95, 8)
  g.add(post)

  const kit = {
    lounge: new THREE.Group(),
    cinemaSeats: new THREE.Group(),
    dining: new THREE.Group(),
    towers: new THREE.Group(),
    inwall: new THREE.Group(),
  }

  for (const z of [5, 11]) {
    const l = lounge(mat.fabric, mat.trim, 2.4)
    l.rotation.y = -Math.PI / 2
    l.position.set(14.8, 0, z)
    kit.lounge.add(l)
  }

  for (let row = 0; row < 2; row++) {
    for (const z of [5.5, 7.5, 9.5]) {
      const c = lounge(mat.fabric, mat.trim, 1.1)
      c.rotation.y = -Math.PI / 2
      c.position.set(20 + row * 1.6, 0, z)
      kit.cinemaSeats.add(c)
    }
  }

  const tableTop = new THREE.Mesh(new RoundedBoxGeometry(3.6, 0.09, 1.1, 3, 0.02), mat.trim)
  tableTop.position.set(16.5, 0.74, 20)
  kit.dining.add(tableTop)
  for (let i = 0; i < 6; i++) {
    const ch = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.85, 0.44, 3, 0.04), mat.fabric)
    ch.position.set(15 + (i % 3) * 1.5, 0.42, i < 3 ? 19.2 : 20.8)
    kit.dining.add(ch)
  }

  for (const z of [4, 12]) {
    const t = new THREE.Mesh(new RoundedBoxGeometry(0.32, 1.0, 0.32, 2, 0.02), spkMat.body)
    t.position.set(15.4, 0.5, z)
    kit.towers.add(t)
  }
  for (const z of [6, 10, 14]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.3), spkMat.face)
    f.position.set(12.06, 2.3, z)
    kit.inwall.add(f)
  }

  for (const k of Object.values(kit)) {
    k.visible = false
    g.add(k)
  }

  let last = null
  function apply(state, { immediate = false, duration = 0.9 } = {}) {
    const d = outdoorDesigns[state.design ?? 0] ?? outdoorDesigns[0]
    if (d.id === last) return d
    last = d.id

    tint(mat.floor, d.paving, duration, immediate)
    tint(waterMaterial, d.water, duration, immediate)

    const sw = d.screen.w
    const sh = d.screen.w / d.screen.aspect
    if (immediate) {
      unit.image.scale.set(sw, sh, 1)
      unit.bezel.scale.set(sw + 0.2, sh + 0.2, 1)
      unit.light.width = sw
      unit.light.height = sh
      unit.group.position.y = 1.1 + sh / 2
    } else {
      TWEENS.push(
        gsap.to(unit.image.scale, { x: sw, y: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.bezel.scale, { x: sw + 0.2, y: sh + 0.2, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.light, { width: sw, height: sh, duration, ease: 'power3.inOut', overwrite: 'auto' }),
        gsap.to(unit.group.position, { y: 1.1 + sh / 2, duration, ease: 'power3.inOut', overwrite: 'auto' }),
      )
    }

    for (const [k, group] of Object.entries(kit)) fade(group, d.show.includes(k), duration * 0.7, immediate)
    return d
  }

  /** The pool and landscape circuits, driven by sky and by the
   *  smart-home scenes. Separate from `apply` because the time of
   *  day changes them without the design changing at all. */
  function setLighting({ pool, landscape }, { immediate = false, duration = 1.1 } = {}) {
    for (const l of poolLights) intensity(l, pool * 2.4, duration, immediate)
    for (const l of landscapeLights) intensity(l, landscape * 2.2, duration, immediate)
    /* The surface brightens with the circuit. Without this the
       pool stays a dark rectangle no matter how many niches are
       switched on around it. */
    const glow = Math.min(1.15, pool * 0.85)
    if (immediate) waterMaterial.emissiveIntensity = glow
    else
      TWEENS.push(
        gsap.to(waterMaterial, {
          emissiveIntensity: glow,
          duration,
          ease: 'power2.inOut',
          overwrite: 'auto',
        }),
      )
  }

  return { group: g, mat, apply, setLighting, screen: unit }
}

/* ============================================================
   EXTERIOR — ground, roof, and the light the house throws out
   ============================================================ */
function buildExterior() {
  const g = new THREE.Group()

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x14180f, roughness: 0.98 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  g.add(ground)

  /* One flat roof over the whole built footprint, with an
     overhang. Without it, an exterior shot looks down into rooms
     like a dollhouse. */
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.9, side: THREE.DoubleSide })
  const roof = new THREE.Mesh(new THREE.BoxGeometry(33, 0.35, 58), roofMat)
  roof.position.set(-3, 3.72, 19)
  g.add(roof)

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(33.6, 0.5, 58.6), roofMat)
  parapet.position.set(-3, 3.6, 19)
  g.add(parapet)

  /* Façade uplights along the east elevation — the light that
     makes the house read as a building at night rather than as a
     silhouette. */
  /* Uplights on BOTH elevations the visitor actually sees: the
     east glazing they walk out through, and the north façade they
     arrive at. The first pass lit only the east side, so the
     arrival — the very first shot of the whole journey — was a
     black slab against a black sky. */
  const facadeLights = []
  const fittingMat = new THREE.MeshBasicMaterial({ color: 0x4e3418 })
  const put = (x, z, i, cast) => {
    if (cast) {
      const l = new THREE.PointLight(0xffb765, i, 16, 2)
      l.position.set(x, 0.4, z)
      g.add(l)
      facadeLights.push(l)
    }
    /* Small and low. At 80mm across and full brightness these read
       as orange blocks lying on the drive rather than as recessed
       uplights — and the pair nearest the opening camera were only
       five metres from the lens. */
    const fitting = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 10), fittingMat)
    fitting.position.set(x, 0.035, z)
    g.add(fitting)
  }
  /* `cast: false` still draws the fitting and its glow but adds no
     light to the shader. The elevation reads as a line of uplights
     either way; only four of them are doing real work. */
  put(12.5, 6, 2.2, true)
  put(12.5, 26, 2.2, true)
  for (const z of [0, 16, 32]) put(12.5, z, 0, false)
  put(-9.5, 46.6, 2.6, true)
  put(-3.5, 46.6, 2.6, true)
  for (const x of [-12, -1]) put(x, 46.6, 0, false)
  /* Only the far pair. The near markers sat inside the opening
     shot's foreground and pulled the eye straight off the house. */
  put(-10.5, 52, 0, false)
  put(-2.5, 52, 0, false)

  return { group: g, lights: facadeLights }
}

/* ============================================================
   THE HOUSE
   ============================================================ */
export function buildHouse() {
  RectAreaLightUniformsLib.init()

  const zones = {
    exterior: buildExterior(),
    entrance: buildEntrance(),
    living: buildLiving(),
    spine: buildSpine(),
    theatre: buildTheatre(),
    corridorB: buildCorridorB(),
    terrace: buildTerrace(),
    gaming: buildGaming(),
    audio: buildAudio(),
  }

  zones.theatre.group.position.set(-6.5, 0, -1)

  const root = new THREE.Group()
  for (const z of Object.values(zones)) root.add(z.group)

  function dispose() {
    for (const t of TWEENS) t.kill()
    TWEENS.length = 0
    disposeTree(root)
  }

  return { root, zones, dispose }
}
