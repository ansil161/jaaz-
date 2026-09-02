import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Plate from '@/features/public/components/Plate'
import { hasStill } from '@/features/public/utils/media'
import { scene, sceneList, sceneCount, sceneChannels } from '@/features/public/data/scene'
import {
  useGsapScope,
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
} from '@/lib/animation/useGsap'
import SceneIcon from './sceneIcons'
import SceneAdjust from './SceneAdjust'

/* ============================================================
   THE SCENE EXPERIENCE MODULE

   "Choose the moment. We'll set the scene."

   The visitor picks an evening and the room reconfigures itself
   in front of them — the photograph re-lights, and five device
   states arrive one after another over a second and a half.

   Built to the JAAZ Scene Experience concept document. The
   content, the scene table, the cascade timings and the manual
   control list all live in data/scene.js with the document
   section they came from noted beside each; this file is the
   composition and the machine.

   ------------------------------------------------------------
   THE ARGUMENT IS THE 1.5 SECONDS, NOT THE PICTURE SWAP

   A section that changed the photograph on a press would be a
   picture chooser, and this site already has one of those in
   <Feeling>. What makes this the AUTOMATION rather than a
   gallery is that the room takes time and takes it in an order:

     0.2s  lights           you dim before you do anything else
     0.5s  curtains         then you close the room
     0.8s  screen           then you throw a picture at the wall
     1.0s  audio            then you turn the sound on
     1.2s  climate          the slowest system, last
     1.5s  "Room ready"     a beat, then the room reports in

   Those are the document's own numbers (§7). The PANEL does not
   list them in that order — it lists them in reading order
   (§8): projector, audio, lights, curtains, climate. The two
   orders disagree on purpose and the disagreement is the effect:
   a visitor cannot say why the cascade feels like a room waking
   up, and would notice instantly if the rows simply lit top to
   bottom like a progress list.

   ------------------------------------------------------------
   NOTHING IS PLACED ON THE PHOTOGRAPH

   Not one label, chip, pill, badge, tick strip or translucent
   panel. The only things over the room are things that could
   have been LIT in it: a radial wash whose position, colour
   temperature and power belong to the scene, a flat veil for the
   two evenings that genuinely go dark, and a short falloff at
   the inner edge so the picture does not cut hard against the
   panel. Every readable thing lives in the column beside it.

   This is a standing rule on this site rather than a choice made
   here, and it is the rule the page has been corrected on: room
   photography with device chips parked on it reads as a product
   demo screenshotted onto somebody else's cinematography.

   ------------------------------------------------------------
   THREE PIECES OF STATE, AND THEY ARE NOT THE SAME THING

     active   which scene is chosen.

     room     what the room is actually SET TO — lights,
              climate, curtains, volume, seats. A scene writes
              all five; the manual layer overwrites individual
              ones. This is the truth.

     shown    what the readout is currently PAINTING. It lags
              `room` by design: that lag IS the cascade. Without
              a second copy the five rows would all change on the
              same frame and there would be nothing to watch.

   A manual change writes `room` and `shown` together, with no
   lag, because a control the visitor is holding has to answer
   immediately. Choosing a scene resets both and re-runs the
   cascade.

   ------------------------------------------------------------
   THE PANEL IS NEVER EMPTY, AND THAT IS WHY THE CASCADE IS SAFE

   `shown` is seeded with the opening scene's complete state, so
   the readout is fully populated before a line of JavaScript
   runs — no-JS, reduced-motion and pre-hydration all get the
   whole panel. The cascade re-animates values that are, on the
   first run, already correct. It is a way of PRESENTING five
   things that are already in the document, which means removing
   it costs the presentation and none of the content.
   ============================================================ */

/* The room's opening settings for a scene. Kept as one function
   because it is called from three places — mount, selection and
   the reset the manual layer performs — and three copies of an
   object literal is three places to forget a key. */
const settingsFor = (s) => ({
  lights: s.lights,
  climate: s.climate,
  curtain: s.states.curtain,
  volume: s.volume,
  seat: s.seat,
})

/* What each of the five readout rows says, given a scene and the
   room's current settings. Two of the five are FIGURES rather
   than words — see the note over `scenes` in data/scene.js: the
   manual layer hands the visitor a lights percentage and a
   temperature, and a control that disagrees with the readout
   above it would break the exact claim this section is making. */
const paint = (s, r) => ({
  screen: s.states.screen,
  sound: s.states.sound,
  light: `${r.lights}%`,
  curtain: r.curtain,
  climate: `${r.climate}°C`,
})

/* Which readout row a manual control writes into. `volume` and
   `seat` are deliberately absent: the readout states what the
   SCENE set, and those two are finer than a scene. Adding rows
   for them would turn five states into seven and the panel into
   the dashboard the document says it must not be. */
const CHANNEL_OF = { lights: 'light', climate: 'climate', curtain: 'curtain' }

/* §7: "Default scene: Movie Night. The visual should initially
   feel calm and cinematic." Resolved once at module scope — the
   opening grade is a constant, and rebuilding the same nine
   numbers on every render of a section that re-renders five
   times per cascade is work with no output. */
const OPENING_LOOK = lookVars(sceneList[0].look)

export default function Scene() {
  const [active, setActive] = useState(0)
  const [room, setRoom] = useState(() => settingsFor(sceneList[0]))
  const [shown, setShown] = useState(() => paint(sceneList[0], settingsFor(sceneList[0])))
  const [phase, setPhase] = useState('ready')
  const [open, setOpen] = useState(false)
  const [touched, setTouched] = useState(() => new Set())

  /* THE CASCADE READS THIS, NOT THE STATE. A timeline built on
     one render closes over the `touched` of that render, so a
     value the visitor changes DURING the 1.5s would be stamped
     back over by a callback that was scheduled before they
     touched it. The ref is the only copy that is current at the
     moment each cue fires. */
  const touchedRef = useRef(new Set())

  /* The section does not run its cascade until it has been seen.
     A timeline that fires while the section is four screens down
     the page has spent the one moment it exists for on nobody. */
  const [armed, setArmed] = useState(false)

  const stageRef = useRef(null)
  const listRef = useRef(null)
  const railRef = useRef(null)
  const btnRefs = useRef([])
  const valueRefs = useRef({})

  const current = sceneList[active]

  /* ---- Arm on arrival ----
     The cascade is the one moment this section exists for, and
     spending it while the section is four screens down the page
     spends it on nobody. `once`, and deliberately NOT gated on
     reduced motion — this does not animate anything, it decides
     when an animation is allowed to begin, and a reduced-motion
     visitor still needs the readout to answer their presses. */
  const root = useGsapScope((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => setArmed(true),
    })
    return () => st.kill()
  }, [])

  /* ---- Choosing a scene ----
     Resets the room to that scene's settings and clears every
     manual mark. That reset is the "automatic when you want it"
     half of the document's proposition made real: one press puts
     the whole room back under the scene's control, including
     anything the visitor had overridden by hand. */
  const choose = useCallback((i) => {
    touchedRef.current = new Set()
    setTouched(new Set())
    setActive(i)
    setRoom(settingsFor(sceneList[i]))
  }, [])

  /* ---- The manual layer writes through ----
     Both copies, on the same frame. A control being dragged has
     to answer under the thumb; running a held slider through a
     1.5-second cascade would feel like a broken connection. */
  const adjust = useCallback(
    (key, value) => {
      const channel = CHANNEL_OF[key]
      if (channel) {
        touchedRef.current.add(channel)
        setTouched(new Set(touchedRef.current))
      }
      setRoom((prev) => {
        const next = { ...prev, [key]: value }
        if (channel) {
          const painted = paint(sceneList[active], next)
          setShown((s) => ({ ...s, [channel]: painted[channel] }))
        }
        return next
      })
    },
    [active],
  )

  /* ============================================================
     THE CASCADE

     One master timeline per selection, and every cue is placed
     with the position parameter rather than with a chain of
     delays — the timings in data/scene.js are absolute offsets
     from the press, so they are written into the timeline as
     absolute offsets and can be read back out of this file and
     compared to the document without arithmetic.

     Keyed on [active, armed] ONLY. The callbacks below call
     `setShown`, which re-renders; if this effect depended on
     `shown` it would tear itself down and rebuild mid-cascade
     five times, and the visitor would see the first row arrive
     and nothing else.
     ============================================================ */
  useEffect(() => {
    if (!armed) return

    const s = sceneList[active]
    const target = paint(s, settingsFor(s))
    const stage = stageRef.current

    if (prefersReducedMotion()) {
      setShown(target)
      setPhase('ready')
      applyLook(stage, s.look, true)
      return
    }

    setPhase('setting')

    const tl = gsap.timeline()

    /* The room re-lights across the WHOLE cascade rather than at
       any one cue. Nothing in a real room changes instantly, and
       the light is the one thing every subsystem here touches —
       so it is the continuous background the five discrete
       events happen against. `jaz-io` because this is a state
       change, not an entrance. */
    applyLook(stage, s.look, false, tl)

    sceneChannels.forEach((c) => {
      tl.call(
        () => {
          /* A channel the visitor has taken by hand is not the
             scene's to set. See `touchedRef` above. */
          if (touchedRef.current.has(c.key)) return
          setShown((prev) => ({ ...prev, [c.key]: target[c.key] }))

          const el = valueRefs.current[c.key]
          if (!el) return
          /* The from-state lands this frame, on the OLD text;
             React swaps the text on the next one, while the
             element is at zero. So the value is never seen
             changing — only arriving. */
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 9 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: 'jaz', overwrite: true },
          )
        },
        null,
        c.at,
      )
    })

    tl.call(() => setPhase('ready'), null, scene.readyAt)

    return () => tl.kill()
  }, [active, armed])

  /* ---- The rule that slides under the chosen scene ----
     Measured from the button the browser just laid out rather
     than computed from an index: the five words are different
     lengths and the row wraps at narrow widths, so the only
     reliable box is the real one. Same mechanism <Feeling> uses,
     for the same reason. */
  const placeRail = useCallback(
    (animate) => {
      const rail = railRef.current
      const btn = btnRefs.current[active]
      if (!rail || !btn) return

      const to = {
        x: btn.offsetLeft,
        y: btn.offsetTop + btn.offsetHeight - 2,
        width: btn.offsetWidth,
      }
      if (!animate || prefersReducedMotion()) {
        gsap.set(rail, { ...to, autoAlpha: 1 })
        return
      }
      gsap.to(rail, { ...to, autoAlpha: 1, duration: 0.6, ease: 'jaz', overwrite: true })
    },
    [active],
  )

  useEffect(() => {
    placeRail(true)
  }, [placeRail])

  /* Re-measure on anything that can change a word's box: a
     resize, a rotation, and the web font landing — Instrument
     Serif replaces a fallback whose metrics are nothing like it,
     and a rule measured against Times is a rule in the wrong
     place. */
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const settle = () => placeRail(false)
    const ro = new ResizeObserver(settle)
    ro.observe(list)
    document.fonts?.ready.then(settle)
    return () => ro.disconnect()
  }, [placeRail])

  /* ---- Keyboard ----
     A real tablist: arrows wrap, Home and End jump, and focus
     follows the selection so the rail, the panel and the caret
     never disagree about which scene is chosen. */
  const onKeyDown = (e) => {
    const last = sceneCount - 1
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    choose(next)
    btnRefs.current[next]?.focus()
  }

  const rendered = useMemo(() => hasStill(scene.room.still), [])

  return (
    <section
      ref={root}
      id={scene.id}
      aria-label="Choose the moment and the room sets the scene"
      className="scene-module relative isolate bg-ink"
    >
      <div className="shell-wide">
        {/* ---- The headline (§5) ---- */}
        <header className="scene-head">
          <span className="t-label flex items-center gap-3 text-fog">
            {scene.label}
            <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
          </span>

          <div className="mt-[clamp(1.5rem,4vh,2.75rem)] flex flex-col gap-[clamp(1rem,3vh,2rem)] lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <h2 className="scene-claim text-pure">
              {scene.heading.map((line, i) => (
                <span key={line} className="block">
                  {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
                </span>
              ))}
            </h2>
            <p className="t-body max-w-[40ch] text-fog lg:pb-[0.6em]">{scene.intro}</p>
          </div>
        </header>

        {/* ============================================================
            THE COMPOSITION (§4)

            Large visual, information panel beside it, navigation
            underneath. The picture is the hero and takes the
            larger share; the panel is four short blocks and does
            not need half a screen.

            THE PANEL IS SECOND IN THE DOM and stays second on a
            phone, where it sits under the picture. The control
            that changes the room is directly below both, so the
            reading order on every width is: room, what the room
            is doing, what to ask it for.
            ============================================================ */}
        <div className="scene-composition">
          {/* ---- The room ----
              THE OPENING LOOK IS AN INLINE STYLE, NOT A CSS
              DEFAULT. The stylesheet could carry movie night's
              nine numbers as fallbacks, and then there would be
              two copies of the grade — one in data/scene.js that
              a designer edits and one in site.css that nobody
              remembers, silently governing the first paint and
              every no-JS visitor. Seeded from the data instead,
              so there is exactly one place those numbers live. */}
          <figure ref={stageRef} style={OPENING_LOOK} className="scene-stage">
            {rendered ? (
              <Plate
                slot={scene.room.still}
                alt={scene.room.alt}
                sizes="(min-width: 1024px) 62vw, 100vw"
                priority={false}
                className="plate scene-plate"
              />
            ) : (
              <img
                src={scene.room.photo}
                alt={scene.room.alt}
                loading="lazy"
                decoding="async"
                draggable="false"
                className="plate scene-plate"
              />
            )}

            {/* The light signature. Along with the exposure on the
                photograph, the only thing separating one evening
                from another — and the only thing over the picture
                that could have been lit in the room. */}
            <span aria-hidden="true" className="scene-wash" />
            {/* Flat dark, for the two evenings that genuinely go
                black. Everything else is done with exposure:
                black over the top crushes the whole frame towards
                grey and takes the lit terrace down with it, where
                dropping the exposure keeps the contrast between
                the lamp, the screen and the dark around them. */}
            <span aria-hidden="true" className="scene-veil" />
            {/* A SHORT falloff at the inner edge — an edge with a
                shadow on it, not a blend. The panel and the room
                are two materials butted together, and softening
                the seam across a third of the picture makes it
                look like one material that has been badly lit. */}
            <span aria-hidden="true" className="scene-edge" />
          </figure>

          {/* ---- The information panel (§8) ----
              "Information, not a dashboard." Editorial and
              minimal: what JAAZ is doing, stated, without making
              the visitor feel they have to operate any of it. */}
          <div
            id="scene-panel"
            role="tabpanel"
            aria-labelledby={`scene-tab-${current.key}`}
            tabIndex={-1}
            className="scene-panel"
          >
            <div>
              {/* `key` re-mounts the block on every selection,
                  which is what re-runs its entrance. Without it
                  React patches the text in place and the answer
                  is simply different, with no moment of
                  arriving. */}
              <SceneHeadline key={current.key} s={current} />
            </div>

            {/* ---- The five states ----
                Each row is one subsystem. The glyph names the
                channel, the label is the question and the value
                is the answer — and the value is the larger of the
                two, because "Closed" is the interesting word and
                "Curtains" is only what it answers. A question set
                larger than its answer is a form, not a
                specification. */}
            <dl className="scene-rows">
              {sceneChannels.map((c) => (
                <div key={c.key} className="scene-row">
                  <dt className="scene-row-k">
                    <SceneIcon name={c.key} size={18} className="scene-row-glyph" />
                    {c.label}
                  </dt>
                  <dd className="scene-row-v">
                    <span
                      ref={(el) => {
                        valueRefs.current[c.key] = el
                      }}
                      className="scene-row-value"
                    >
                      {shown[c.key]}
                    </span>
                    {/* The manual mark. One warm dot, and it is
                        the only thing on the panel that says a
                        human overruled the scene. It is what
                        makes "manual when you need it" something
                        the visitor can see rather than something
                        the copy asserts. */}
                    {touched.has(c.key) ? (
                      <span
                        className="scene-row-manual"
                        title="Set by hand"
                        aria-label="set by hand"
                      />
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>

            {/* ---- The status line (§8) ----
                The counter the document draws as "01 / 05 →". The
                arrow is a real control rather than a decoration —
                it advances to the next scene, which is the one
                thing an arrow drawn beside a counter promises. */}
            <div className="scene-status">
              <p className="scene-state">
                <span
                  aria-hidden="true"
                  className={`scene-dot ${phase === 'ready' ? 'is-ready' : 'is-setting'}`}
                />
                {phase === 'ready' ? scene.readyWord : `${scene.settingWord}…`}
              </p>

              <div className="scene-count">
                <span className="t-num">
                  {current.n} <span className="text-ash">/ 0{sceneCount}</span>
                </span>
                <button
                  type="button"
                  onClick={() => choose((active + 1) % sceneCount)}
                  aria-label="Next scene"
                  className="scene-next focus-ring"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            {/* The live region. The cascade is a visual event and
                a screen reader gets none of it, so the finished
                state is announced once, as a sentence, rather
                than as five row changes fired half a second
                apart. `polite` — this is a consequence of the
                visitor's own press, not an interruption. */}
            <p aria-live="polite" className="sr-only">
              {phase === 'ready'
                ? `${current.title}. Room ready. Projector ${shown.screen}. Audio ${shown.sound}. Lights ${shown.light}. Curtains ${shown.curtain}. Climate ${shown.climate}.`
                : `${current.title}. Setting the scene.`}
            </p>
          </div>
        </div>

        {/* ============================================================
            THE SCENE SELECTOR (§9)

            "Use small monochrome line icons or typography." This
            is the typography answer, and it is the right one
            here: five words in the site's display face with one
            warm rule that SLIDES between them. No pill, no
            segmented control, no strip of ticks, no thumbnails —
            each of which is app chrome, and each of which this
            site has ruled out by name.

            The rule sliding is what makes the selection read as a
            move from one word to another rather than as two
            separate states being toggled.
            ============================================================ */}
        <div className="scene-controls">
          <div
            ref={listRef}
            role="tablist"
            aria-label="Choose a scene"
            onKeyDown={onKeyDown}
            className="scene-nav"
          >
            <span ref={railRef} aria-hidden="true" className="scene-rail" />
            {sceneList.map((s, i) => {
              const on = i === active
              return (
                <button
                  key={s.key}
                  ref={(el) => {
                    btnRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`scene-tab-${s.key}`}
                  aria-selected={on}
                  aria-controls="scene-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => choose(i)}
                  className={`scene-word focus-ring ${on ? 'text-pure' : 'text-ash hover:text-fog'}`}
                >
                  {s.nav}
                </button>
              )
            })}
          </div>

          {/* ---- The secondary action (§10) ----
              One line of type and an arrow that turns. It is
              deliberately quieter than any of the five words
              beside it: the document's whole argument is that the
              visitor should not have to operate anything, so the
              control that lets them cannot be the loudest thing
              in the section. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="scene-adjust"
            className="scene-adjust-toggle focus-ring"
          >
            <span className="scene-adjust-cue">
              {scene.manualCue.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
            <span className="scene-adjust-label">
              {open ? scene.adjust.close : scene.adjust.open}
              <span aria-hidden="true" className={`scene-caret ${open ? 'is-open' : ''}`}>
                →
              </span>
            </span>
          </button>
        </div>

        {/* ---- The manual layer, closed until asked for ---- */}
        <SceneAdjust open={open} room={room} onChange={adjust} />

        {/* §13. Said after the demonstration, where it is a
            caption; said before it, it would be a claim. */}
        <p className="scene-coda">{scene.coda}</p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   THE SCENE'S OWN COPY

   Split out so it can be remounted by key — three blocks that
   rise as a group, which is the smallest amount of motion that
   still says "this is the answer to what you just pressed".
   ------------------------------------------------------------ */
function SceneHeadline({ s }) {
  const ref = useGsapScope((el) => {
    const parts = el.children
    if (prefersReducedMotion()) {
      gsap.set(parts, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.from(parts, { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.07, ease: 'jaz' })
  }, [])

  return (
    <div ref={ref}>
      <p className="t-label text-mist">{s.title}</p>
      <p className="scene-line mt-[clamp(0.75rem,2vh,1.25rem)] text-pure">{s.line}</p>
      <p className="t-body mt-[clamp(0.75rem,2vh,1.125rem)] max-w-[34ch] text-fog">{s.body}</p>
    </div>
  )
}

/* ------------------------------------------------------------
   THE LOOK

   Nine numbers per scene, written onto the stage as custom
   properties. Four of them are the registered `--plate-*`
   properties the `.plate` primitive builds its filter from; the
   rest position and colour the wash, set the veil and place the
   crop.

   THE GRADE GOES ON THE STAGE, NOT ON THE IMAGE, AND THAT IS THE
   OPPOSITE OF THE USUAL RULE HERE. `.plate` declares its own
   `--plate-*` defaults, and an element's own declaration beats an
   inherited one — so setting them on an ancestor normally does
   nothing at all. `.scene-plate` therefore re-declares each one
   as `var(--scene-brightness)` explicitly, which is what lets a
   single write on the stage move the picture, the wash and the
   veil together. The alternative is three separate tween targets
   kept in sync by hand.

   `--scene-x`, `--scene-y` and `--scene-zoom` are plain numbers
   rather than a percentage pair and a scale, because GSAP
   interpolates a number and cannot interpolate "70% 46%". The
   stylesheet multiplies them back into units.
   ------------------------------------------------------------ */
function lookVars(look) {
  const [x, y] = look.crop.pos.split(' ').map(parseFloat)
  return {
    '--scene-brightness': look.grade.brightness,
    '--scene-contrast': look.grade.contrast,
    '--scene-saturate': look.grade.saturate,
    '--scene-wash-at': look.wash.at,
    '--scene-wash-tint': look.wash.tint,
    '--scene-wash-power': look.wash.power,
    '--scene-veil': look.veil,
    '--scene-x': x,
    '--scene-y': y,
    '--scene-zoom': look.crop.zoom,
  }
}

function applyLook(stage, look, immediate, tl) {
  if (!stage) return

  const vars = lookVars(look)

  if (immediate) {
    gsap.set(stage, vars)
    return
  }

  /* THE TWO STRING PROPERTIES ARE SET, NOT TWEENED. `--scene-
     wash-at` is a position pair and `--scene-wash-tint` is three
     comma-separated channels; neither interpolates, and asking
     GSAP to try leaves the property holding an unparseable value
     and the wash disappears. They are stamped at time zero while
     the wash's POWER carries the transition — which is also what
     a light actually does when it moves: it does not slide across
     the ceiling, one fixture comes down as another comes up. */
  const { '--scene-wash-at': at, '--scene-wash-tint': tint, ...numeric } = vars

  const t = tl ?? gsap.timeline()
  t.set(stage, { '--scene-wash-at': at, '--scene-wash-tint': tint }, 0)
  t.to(stage, { ...numeric, duration: scene.readyAt, ease: 'jaz-io' }, 0)
}

