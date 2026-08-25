import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { gsap } from '../lib/gsap'
import {
  VISIBLE_FROM,
  ZONE_ORIGIN,
  beats,
  gamingDesigns,
  scenes,
  skies,
  theatreDesigns,
} from '../data/house'
import { buildHouse } from './houseZones'

/* ============================================================
   THE STAGE — one camera, one house, one scrollbar

   Everything that is not geometry: the sky, the sun, the render
   loop, the camera the scroll drives, and the culling that keeps
   a nine-zone residence as cheap to draw as the single room it
   grew out of.

   THREE THINGS SIT BETWEEN THE SCROLLBAR AND THE LENS, and each
   is the difference between walking and dragging a slider:
   a Catmull-Rom spline through the beats (so the camera arcs
   through a corner instead of hinging at it), damping (so the
   room has mass), and a sub-centimetre sway (because a perfectly
   still camera is the loudest tell that a shot is rendered).

   THE SKY IS REAL. Day, sunset, blue hour and night move the
   sun, re-mix the gradient, change the fog and the exposure, and
   bring the pool and landscape circuits up as the daylight goes.
   None of it is a filter over a still.
   ============================================================ */

const V = () => new THREE.Vector3()

function catmull(out, p0, p1, p2, p3, t) {
  const t2 = t * t
  const t3 = t2 * t
  const c = (a, b, cc, d) =>
    0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3)
  out.set(c(p0.x, p1.x, p2.x, p3.x), c(p0.y, p1.y, p2.y, p3.y), c(p0.z, p1.z, p2.z, p3.z))
  return out
}

/** A beat's coordinates are local to its zone; only the theatre
 *  carries an offset, but routing everything through here means
 *  no caller has to know which. */
export function toWorld(vec, zone) {
  const o = ZONE_ORIGIN[zone] ?? [0, 0, 0]
  return new THREE.Vector3(vec[0] + o[0], vec[1] + o[1], vec[2] + o[2])
}

const SKY_VERT = `
  varying vec3 vP;
  void main() {
    vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/* A two-stop vertical gradient. The exponent compresses the
   interesting part of the ramp down toward the horizon, which is
   where a real sky does most of its work — a linear mix puts the
   colour change up at the zenith where nobody is looking. */
const SKY_FRAG = `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  varying vec3 vP;
  void main() {
    float h = normalize(vP).y;
    float t = clamp(pow(max(h, 0.0), 0.42), 0.0, 1.0);
    gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
  }
`

export function createStage(canvas, { onBeat } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x060a12, 0.0125)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.42

  /* ---- Sky ---- */
  const skyUniforms = {
    topColor: { value: new THREE.Color(0x03060e) },
    horizonColor: { value: new THREE.Color(0x0b1522) },
  }
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(220, 24, 16),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  )
  scene.add(sky)

  const sun = new THREE.DirectionalLight(0x2a3c58, 0.12)
  sun.position.set(40, -14, 0)
  scene.add(sun)

  const hemi = new THREE.HemisphereLight(0xbcd4e6, 0x14180f, 0.09)
  scene.add(hemi)

  const camera = new THREE.PerspectiveCamera(52, 1, 0.08, 400)

  const house = buildHouse()
  scene.add(house.root)

  /* Base intensities, captured once, so a smart-home scene can
     dim the whole house by a factor without ever losing what the
     designed value was. */
  const baseIntensity = new Map()
  house.root.traverse((o) => {
    if (o.isLight) baseIntensity.set(o, o.intensity)
  })

  /* ---- Post ---- */
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.34, 0.7, 0.94)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  /* ---- Camera path ---- */
  const camPts = beats.map((b) => toWorld(b.cam, b.zone))
  const lookPts = beats.map((b) => toWorld(b.look, b.zone))
  const at = (arr, i) => arr[Math.max(0, Math.min(arr.length - 1, i))]

  const targetPos = V()
  const targetLook = V()
  const shownPos = V().copy(camPts[0])
  const shownLook = V().copy(lookPts[0])
  let primed = false
  let progress = 0
  let activeBeat = -1
  let exposureTarget = 0.92

  function sample(p) {
    const clamped = Math.max(0, Math.min(1, p))
    let i = 0
    while (i < beats.length - 2 && clamped > beats[i + 1].p) i++
    const a = beats[i]
    const b = beats[i + 1]
    const t = Math.max(0, Math.min(1, (clamped - a.p) / Math.max(1e-6, b.p - a.p)))
    catmull(targetPos, at(camPts, i - 1), at(camPts, i), at(camPts, i + 1), at(camPts, i + 2), t)
    catmull(targetLook, at(lookPts, i - 1), at(lookPts, i), at(lookPts, i + 1), at(lookPts, i + 2), t)
    return i
  }

  /* ---- Sky state ---- */
  let currentSky = null
  const skyTweens = []
  function applySky(id, immediate) {
    const s = skies[id] ?? skies.night
    if (currentSky === s.id) return s
    currentSky = s.id
    const d = immediate ? 0 : 1.6

    const set = (colorObj, hex) => {
      const t = new THREE.Color(hex)
      if (immediate) colorObj.copy(t)
      else skyTweens.push(gsap.to(colorObj, { r: t.r, g: t.g, b: t.b, duration: d, ease: 'power2.inOut', overwrite: 'auto' }))
    }

    set(skyUniforms.topColor.value, s.top)
    set(skyUniforms.horizonColor.value, s.horizon)
    set(sun.color, s.sunColor)
    set(scene.fog.color, s.fog)
    set(hemi.color, s.horizon)

    if (immediate) {
      sun.position.set(...s.sun)
      sun.intensity = s.sunI
      hemi.intensity = s.ambient
      scene.fog.density = s.fogDensity
    } else {
      skyTweens.push(
        gsap.to(sun.position, { x: s.sun[0], y: s.sun[1], z: s.sun[2], duration: d, ease: 'power2.inOut', overwrite: 'auto' }),
        gsap.to(sun, { intensity: s.sunI, duration: d, ease: 'power2.inOut', overwrite: 'auto' }),
        gsap.to(hemi, { intensity: s.ambient, duration: d, ease: 'power2.inOut', overwrite: 'auto' }),
        gsap.to(scene.fog, { density: s.fogDensity, duration: d, ease: 'power2.inOut', overwrite: 'auto' }),
      )
    }
    return s
  }

  /* ---- Smart-home scenes: the whole house at once ---- */
  const zoneLights = {
    living: house.zones.living.lights,
    spine: [...house.zones.spine.lights, ...house.zones.corridorB.lights, ...house.zones.entrance.lights],
    terrace: house.zones.exterior.lights,
  }
  let currentScene = null
  function applyScene(index, immediate) {
    const sc = scenes[index]
    if (!sc || currentScene === sc.id) return sc
    currentScene = sc.id
    const d = immediate ? 0 : 1.2
    for (const [key, lights] of Object.entries(zoneLights)) {
      const factor = sc.house[key] ?? 1
      for (const l of lights) {
        const target = (baseIntensity.get(l) ?? l.intensity) * factor
        if (immediate) l.intensity = target
        else gsap.to(l, { intensity: target, duration: d, ease: 'power2.inOut', overwrite: 'auto' })
      }
    }
    house.zones.terrace.setLighting(
      { pool: sc.house.pool ?? 0, landscape: (sc.house.terrace ?? 0) * 1.1 },
      { immediate, duration: d },
    )
    return sc
  }

  /* ---- Zone culling ---- */
  let visibleKey = ''
  function cull(zone) {
    const list = VISIBLE_FROM[zone] ?? Object.keys(house.zones)
    const key = list.join(',')
    if (key === visibleKey) return
    visibleKey = key
    for (const [id, z] of Object.entries(house.zones)) z.group.visible = list.includes(id)
  }

  const LAST = beats.length - 1

  function setProgress(p, { snap = false } = {}) {
    progress = p
    const segment = sample(p)

    /* `sample` returns the SEGMENT the camera is travelling
       along, which is always the beat you have left rather than
       the one you are arriving at — so at the very end of the
       scroll it reports the second-to-last beat and the final one
       never fires. The walk ended on "Good Night" with the house
       dark, instead of on the reveal it was built toward. */
    const i = p >= beats[LAST].p ? LAST : segment

    if (i !== activeBeat) {
      activeBeat = i
      const beat = beats[i]
      const immediate = !primed || snap

      cull(beat.zone)

      const skyState = applySky(beat.sky ?? currentSky ?? 'night', immediate)

      /* The zone's own design. Only zones that HAVE designs
         respond; a corridor beat simply carries the camera. */
      let designExposure = null
      if (beat.design !== undefined) {
        if (beat.zone === 'theatre') {
          house.zones.theatre.apply(beat, { immediate })
          designExposure = theatreDesigns[beat.design]?.exposure ?? null
        } else if (beat.zone === 'gaming') {
          house.zones.gaming.apply(beat, { immediate })
          designExposure = gamingDesigns[beat.design]?.exposure ?? null
        } else if (beat.zone === 'audio') {
          house.zones.audio.apply(beat, { immediate })
        } else if (beat.zone === 'terrace') {
          const d = house.zones.terrace.apply(beat, { immediate })
          /* Outside, the pool and landscape circuits are a
             function of BOTH the scheme and the hour: a lit pool
             at midday is a fitting nobody switched off. */
          house.zones.terrace.setLighting(
            { pool: (d.poolLight ?? 0) * skyState.artificial, landscape: (d.landscape ?? 0) * skyState.artificial },
            { immediate },
          )
        }
      } else if (beat.zone === 'theatre') {
        house.zones.theatre.apply(beat, { immediate })
      }

      if (beat.scene !== undefined) applyScene(beat.scene, immediate)

      exposureTarget = designExposure ?? skyState.exposure
      onBeat?.(i, beat)
    }

    if (!primed || snap) {
      primed = true
      shownPos.copy(targetPos)
      shownLook.copy(targetLook)
      place(0)
      composer.render()
    }
  }

  /* ---- Loop ---- */
  let last = performance.now()
  let elapsed = 0

  function place(dt) {
    /* Lenis already smooths the scroll value this camera follows,
       so heavy damping here is a SECOND smoother in series — and
       two in series is not smoother, it is laggier. At 5.2 the
       camera trailed the scroll by roughly 200ms and the whole
       walk felt disconnected from the wheel. 15 keeps a little
       weight in the move without adding perceptible lag. */
    const k = 1 - Math.exp(-15 * dt)
    shownPos.lerp(targetPos, k)
    shownLook.lerp(targetLook, Math.min(1, k * 1.15))

    const swayX = Math.sin(elapsed * 0.42) * 0.012 + Math.sin(elapsed * 0.27) * 0.008
    const swayY = Math.cos(elapsed * 0.35) * 0.009

    camera.position.set(shownPos.x + swayX, shownPos.y + swayY, shownPos.z)
    camera.lookAt(shownLook)
    camera.rotation.z += Math.sin(elapsed * 0.23) * 0.0035

    sky.position.copy(camera.position)
    renderer.toneMappingExposure += (exposureTarget - renderer.toneMappingExposure) * k
  }

  function frame() {
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    elapsed += dt
    place(dt)
    composer.render()
  }

  function resize(width, height) {
    camera.aspect = width / height
    camera.fov = THREE.MathUtils.clamp(52 + (1.6 - width / height) * 16, 52, 74)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
  }

  const proj = V()
  function project(vec3, zone, width, height) {
    const o = ZONE_ORIGIN[zone] ?? [0, 0, 0]
    proj.set(vec3[0] + o[0], vec3[1] + o[1], vec3[2] + o[2]).project(camera)
    return {
      x: (proj.x * 0.5 + 0.5) * width,
      y: (-proj.y * 0.5 + 0.5) * height,
      visible: proj.z > -1 && proj.z < 1,
    }
  }

  function dispose() {
    for (const t of skyTweens) t.kill()
    house.dispose()
    sky.geometry.dispose()
    sky.material.dispose()
    envRT.dispose()
    pmrem.dispose()
    bloom.dispose?.()
    composer.dispose?.()
    renderer.dispose()
    renderer.forceContextLoss?.()
  }

  return {
    renderer,
    scene,
    camera,
    frame,
    resize,
    setProgress,
    project,
    dispose,
    get progress() {
      return progress
    },
  }
}
