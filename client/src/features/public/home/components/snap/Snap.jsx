import { useCallback, useEffect, useRef, useState } from 'react'
import Plate from '@/features/public/components/Plate'
import { hasStill } from '@/features/public/utils/media'
import { snap, snapStates, BEATS, stateAt } from '@/features/public/data/snap'
import {
  useGsapScope,
  gsap,
  ScrollTrigger,
  SplitText,
  prefersReducedMotion,
} from '@/lib/animation/useGsap'
import SnapHand from './SnapHand'
import { HAND } from './handGeometry'
import SnapMotes from './SnapMotes'
import SnapStates from './SnapStates'

/* ============================================================
   SIGNATURE SNAP

   One room. One gesture. Different worlds.

   This is the section the homepage is built to arrive at: the
   single interaction that has to make the site feel authored
   rather than assembled. Everything else on this page describes
   what JAAZ does. This one performs it.

   THE ONE IDEA, AND THE ONE RULE THAT PROTECTS IT
   The snap is not a transition between two pictures. It is a
   CAUSE. Every visual consequence in the scene radiates from the
   exact point where the two fingertips meet — the flash, the
   motes, and the wipe that carries the cinema in are all
   measured from one invisible node inside the hand drawing (see
   `measureContact` below). Nothing is placed at a hand-tuned
   percentage, because the moment one of them drifts from the
   others the gesture stops reading as the reason the room
   changed and starts reading as a slide that happened to follow
   it.

   ------------------------------------------------------------
   THE FOUR ACTS, AS POSITIONS ON ONE PINNED TIMELINE
   Written down in data/snap.js, so the pacing is editable
   without reading any of this.

     preSnap    .00  An elegant room, cold and desaturated, with
                     no cinema equipment anywhere in it. The
                     hand is DRAWN into existence, wrist first.
                .17  Tension. The two digits rotate closed around
                     their own knuckles while a readout counts
                     the gap between them down to zero.

     snap       .30  Contact. Two frames of warm white blowout,
                     and the motes are thrown.
                .32  THE FREEZE. Thirty-four thousandths of the
                     pin with NOTHING tweened on it. Under a
                     scrub that is a genuinely motionless frame
                     the visitor keeps scrolling through, which
                     is what makes the transformation feel like
                     it had physical consequences. It is a gap in
                     a timeline: nothing here creates it, and
                     closing it removes the effect silently.

     transform  .355 The cinema arrives on a radial mask opening
                     from the contact point — the room is not
                     cross-faded, it is REACHED, the same
                     distinction <LightsDown> is built on. The
                     hand un-draws itself and leaves; it was
                     never the product.
                .47  The payoff resolves.

     states     .60  One room, five ways. The plate underneath
                     never changes and that is the entire
                     argument — see data/snap.js.

   ------------------------------------------------------------
   WHY THE STATES ARE NOT ON THE SCRUB TIMELINE

   Everything continuous is scrubbed. Which of five states you
   are in is not continuous, so it is React state, derived from
   the playhead in `onUpdate` and set only on the frames where
   the integer actually changes — five renders across the whole
   pin rather than one per scroll frame.

   That split is what makes the transport clickable. The control
   moves the SCROLL; the playhead then derives the state exactly
   as it always does. There is one source of truth and nothing to
   reconcile, where setting the index on click would have it
   overwritten by the next scroll frame.

   ------------------------------------------------------------
   REDUCED MOTION GETS THE END OF THE STORY, NOT A FASTER ONE

   No pin, no scrub, no motes, natural height. The room is
   already the cinema, the payoff is already resolved, the hand
   is drawn and closed at the instant of contact — a still of the
   gesture rather than the gesture. The transport still works and
   still changes the five states; it simply sets the index
   directly, because there is no pin to scroll to.
   ============================================================ */

const TAB_ID = 'snap-tab'
const PANEL_ID = 'snap-panel'

/* The pin is looked up by id when a state is selected rather than
   held in a ref. A ref has a lifecycle — matchMedia re-runs its
   callback on a breakpoint change and StrictMode double-invokes
   the layout effect, and each of those runs the teardown that
   nulls it — so a cached instance is one ordering away from being
   null at the moment somebody clicks, and the control then does
   nothing at all with no error to find. The registry always has
   the live one, or nothing, and "nothing" is a state this already
   handles: it means reduced motion, and no pin to travel. */
const TRIGGER_ID = 'snap-scene'

/** The gap between the fingertips, in degrees, at rest. It is the
 *  sum of the two closing rotations rather than a number chosen to
 *  look technical — so the readout is measuring the drawing. */
const GAP = Math.abs(HAND.thumbClosed) + HAND.fingerClosed

export default function Snap() {
  const [index, setIndex] = useState(0)

  /* Written every scroll frame, read by the canvas. Never state:
     the motes do not need React and React does not need them. */
  const moteProgress = useRef(0)
  const moteOrigin = useRef({ x: 0.5, y: 0.5 })

  const state = snapStates[index]
  const count = snapStates.length


  /* ---- Selecting a state moves the scroll, not the state ---- */
  const select = useCallback(
    (i) => {
      const wrapped = ((i % count) + count) % count
      const st = ScrollTrigger.getById(TRIGGER_ID)
      const lenis = typeof window !== 'undefined' ? window.__lenis : null

      /* No pin to travel through — reduced motion, or the trigger
         has not been built yet. Setting the index directly is the
         correct behaviour there, not a degraded one. */
      if (!st) {
        setIndex(wrapped)
        return
      }

      const y = st.start + (st.end - st.start) * stateAt(wrapped)
      if (lenis) lenis.scrollTo(y, { duration: 1.1 })
      else window.scrollTo({ top: y, behavior: 'smooth' })
    },
    [count],
  )

  /* ============================================================
     THE SCENE
     ============================================================ */
  const root = useGsapScope((el) => {
    const q = (s) => el.querySelector(s)
    const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

    const stage = q('[data-stage]')
    const flinch = q('[data-flinch]')
    const frame = q('[data-frame]')
    const ordinary = q('[data-ordinary]')
    const cold = q('[data-cold]')
    const cinema = q('[data-cinema]')
    const flash = q('[data-flash]')
    const handBox = q('[data-hand-box]')
    const handFill = q('[data-hand-fill]')
    const strokes = qa('[data-draw]')
    const digits = qa('[data-thumb]')
    const fingers = qa('[data-finger]')
    const chapter = q('[data-chapter]')
    const tagBefore = q('[data-tag="before"]')
    const tagAfter = q('[data-tag="after"]')
    const kicker = q('[data-kicker]')
    const tension = q('[data-tension]')
    const gapNum = q('[data-gap]')
    const payoff = q('[data-payoff]')
    const payoffMark = q('[data-payoff-mark]')
    const stateBlock = q('[data-state-block]')
    const transport = q('[data-transport]')

    /* ---- The one measurement the whole scene is placed from ----
       `offsetLeft`/`offsetTop` are LAYOUT values, so they are
       immune to whatever transform the timeline currently has on
       the hand — which matters, because the hand is mid-flight
       for most of the scene and a `getBoundingClientRect()` here
       would put the flash wherever the hand happened to be on the
       frame the measurement ran. */
    const measureContact = () => {
      if (!handBox || !stage || !stage.clientWidth) return
      const x = (handBox.offsetLeft + handBox.offsetWidth * (HAND.contact[0] / HAND.size)) / stage.clientWidth
      const y = (handBox.offsetTop + handBox.offsetHeight * (HAND.contact[1] / HAND.size)) / stage.clientHeight
      stage.style.setProperty('--snap-x', `${(x * 100).toFixed(2)}%`)
      stage.style.setProperty('--snap-y', `${(y * 100).toFixed(2)}%`)
      moteOrigin.current = { x, y }
    }
    measureContact()

    /* --- Reduced motion: the last frame of the story, held. ---

       THIS IS THE STATES ACT, NOT A COMPOSITE OF ALL FOUR. The first
       version set everything the scene ever shows to visible at once
       and produced two bugs that are invisible until you look at it:
       the big display-serif payoff and the state block occupy the
       SAME slot by design — the claim leaves and the evidence takes
       its place — so switching both on stacked "One room. Different
       worlds." and "Watch." on top of each other. And the hand was
       held at contact over a room it had already transformed, which
       is a frame from an earlier act sitting on top of a later one,
       landing across the readout column.

       So: the claim is carried by `payoffMark`, the mono standing
       header, which is the same words in the place the animated
       version leaves them; the big payoff stays down; and the hand
       is absent because by this point in the story it has left. A
       reduced-motion visitor gets a complete, legible section that
       makes the same argument — not a still of every act at once. */
    if (prefersReducedMotion()) {
      gsap.set(cinema, { '--wipe': 118 })
      gsap.set([cold, kicker, tension, flash, tagBefore, payoff], { autoAlpha: 0 })
      gsap.set([chapter, tagAfter, payoffMark, stateBlock, transport], {
        autoAlpha: 1,
        y: 0,
      })
      /* The gesture is the one thing here with no honest still. It
         is drawn, closed and then gone in the animated scene, and
         any frozen pose of it contradicts the transformed room it
         is sitting on. */
      gsap.set(handBox, { autoAlpha: 0 })
      if (gapNum) gapNum.textContent = '00'
      return
    }

    /* Split before the timeline exists, so the payoff is real line
       boxes by the time anything is asked to move them.
       `autoSplit: false` deliberately: re-splitting mid-scrub
       rebuilds a tween under a playhead already inside it, and it
       jumps. ScrollTrigger's own refresh covers resize. */
    const split = SplitText.create(payoff, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: false,
    })

    const mm = gsap.matchMedia()

    mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767px)' }, (ctx) => {
      const { wide } = ctx.conditions

      /* Opening state, all of it, so a refresh mid-scene rebuilds
         from a known frame rather than from wherever the playhead
         happened to leave things. */
      gsap.set(cinema, { '--wipe': 0 })
      gsap.set(frame, { scale: 1.12 })
      gsap.set(flinch, { scale: 1 })
      gsap.set(ordinary, { autoAlpha: 1 })
      gsap.set(cold, { autoAlpha: 1 })
      gsap.set(flash, { autoAlpha: 0 })
      gsap.set(handBox, { autoAlpha: 0, xPercent: wide ? 22 : 30 })
      gsap.set(handFill, { opacity: 0 })
      gsap.set(strokes, { drawSVG: '0%' })
      gsap.set(digits, { rotation: 0, svgOrigin: HAND.thumbPivot })
      gsap.set(fingers, { rotation: 0, svgOrigin: HAND.fingerPivot })
      gsap.set(chapter, { autoAlpha: 0, y: -10 })
      gsap.set(tagBefore, { autoAlpha: 0 })
      gsap.set(tagAfter, { autoAlpha: 0 })
      gsap.set(kicker, { autoAlpha: 0, y: 12 })
      gsap.set(tension, { autoAlpha: 0, y: 10 })
      gsap.set(payoff, { autoAlpha: 1 })
      gsap.set(split.lines, { yPercent: 115 })
      gsap.set(payoffMark, { autoAlpha: 0 })
      gsap.set(stateBlock, { autoAlpha: 0, y: 26 })
      gsap.set(transport, { autoAlpha: 0, y: 18 })

      /* The readout is a proxy object rather than a tween on the
         node's text, and it is a `fromTo` for the reason
         <LightsDown> documents: a bare `to()` re-reads its start
         from the live value on `invalidateOnRefresh`, so once the
         count has run the "start" becomes zero and the readout
         never counts again. */
      const gapState = { v: GAP }
      const writeGap = () => {
        if (gapNum) gapNum.textContent = String(Math.round(gapState.v)).padStart(2, '0')
      }
      writeGap()

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          id: TRIGGER_ID,
          trigger: el,
          start: 'top top',
          /* Absolute pixels from a function. A function returning
             `+=N%` resolves against the trigger's own height,
             which pinSpacing then grows by that amount — so every
             refresh multiplies the pin again. Same note, same fix,
             as <LightsDown> and <Spaces>. */
          end: () => `+=${Math.round(window.innerHeight * (wide ? 3.4 : 2.4))}`,
          pin: '[data-stage]',
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: measureContact,
          onUpdate: (self) => {
            const p = self.progress

            /* Motes live from the peak to the start of the states
               act, normalised so the canvas never has to know
               where on the page it is. */
            moteProgress.current = gsap.utils.clamp(
              0,
              1,
              (p - BEATS.snap) / (BEATS.states - BEATS.snap),
            )

            /* One property write drives all five transport bars.
               See the note in SnapStates. */
            const sp = gsap.utils.clamp(0, 1, (p - BEATS.states) / (1 - BEATS.states))
            transport?.style.setProperty('--states-p', sp.toFixed(4))

            /* The only thing in the scene that becomes React
               state, and only on the frames where the integer
               actually moves. */
            const next = p < BEATS.states ? 0 : Math.min(count - 1, Math.floor(sp * count))
            setIndex((prev) => (prev === next ? prev : next))
          },
        },
      })

      /* ---- The push-in runs the entire pin. A pinned frame that
              is also perfectly still is the one thing that makes a
              pin read as a page that has stopped responding. ---- */
      tl.to(frame, { scale: 1, duration: 1 }, 0)

      /* ================= ACT 01 · ORDINARY ================= */
      tl.addLabel('preSnap', 0)
      tl.to(chapter, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.01)
      tl.to(tagBefore, { autoAlpha: 1, duration: 0.04 }, 0.02)
      tl.to(kicker, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.03)

      /* ================= ACT 02 · THE HAND ================= */
      /* It does not arrive, it is DRAFTED. The contour draws wrist
         first and fingertips last, so the gesture assembles toward
         the point it is about to make. */
      tl.to(handBox, { autoAlpha: 1, xPercent: 0, duration: 0.13, ease: 'power2.out' }, BEATS.handIn)
      tl.to(
        strokes,
        { drawSVG: '100%', duration: 0.1, stagger: 0.012, ease: 'power1.inOut' },
        BEATS.handIn + 0.005,
      )
      /* The mass arrives behind the line, never with it. A contour
         that fills at the same moment it is drawn is a shape
         fading in; a contour that is completed and THEN weighted
         is an object being made. */
      tl.to(handFill, { opacity: 0.72, duration: 0.07 }, BEATS.handIn + 0.09)

      /* ================= ACT 03 · TENSION ================= */
      tl.to(tension, { autoAlpha: 1, y: 0, duration: 0.04 }, BEATS.tension - 0.01)
      /* EVERY ROTATION TWEEN RESTATES ITS `svgOrigin`, and that is
         not belt-and-braces. Setting it once in `gsap.set` above
         does NOT make it stick: the next tween that touches
         `rotation` resolves the origin again and, with nothing to
         resolve, rotates the digit about the SVG's own (0,0). The
         failure is silent and total — the thumb swings up and to
         the right, the finger swings out to the left, the two of
         them travel away from each other for the entire tension
         beat, and the snap goes off in empty space between them.
         Nothing errors, and the drawing looks like it came apart.
         If you add a rotation here, it carries a pivot. */
      tl.to(
        digits,
        {
          rotation: HAND.thumbClosed,
          svgOrigin: HAND.thumbPivot,
          duration: 0.12,
          ease: 'power2.in',
        },
        BEATS.tension,
      )
      tl.to(
        fingers,
        {
          rotation: HAND.fingerClosed,
          svgOrigin: HAND.fingerPivot,
          duration: 0.12,
          ease: 'power2.in',
        },
        BEATS.tension,
      )
      tl.fromTo(
        gapState,
        { v: GAP },
        { v: 0, duration: 0.12, ease: 'power2.in', onUpdate: writeGap },
        BEATS.tension,
      )
      /* The room holds its breath: the cold scrim thickens and the
         push-in is the only thing still moving. */
      tl.to(cold, { autoAlpha: 1.25, duration: 0.1 }, BEATS.tension)
      tl.to(kicker, { autoAlpha: 0.35, duration: 0.08 }, BEATS.tension + 0.04)

      /* ================= ACT 04 · THE SNAP ================= */
      tl.addLabel('snap', BEATS.snap)

      /* Two frames of warm white, thrown from the contact point.
         Not a sheet: `[data-flash]` is a radial from `--snap-x/y`,
         so the blowout has an origin and the eye is told where to
         look on the one frame that matters. */
      tl.to(flash, { autoAlpha: 1, duration: 0.006, ease: 'power4.out' }, BEATS.snap)
      tl.to(flash, { autoAlpha: 0, duration: 0.012, ease: 'power2.in' }, BEATS.snap + 0.006)

      /* The strike. A real snap is not the fingers meeting — it is
         the middle finger sliding OFF the thumb and hitting the
         palm, so the finger carries past contact while the thumb
         springs back. Two tweens, and the whole gesture stops
         looking like a pinch. */
      tl.to(
        fingers,
        {
          rotation: HAND.fingerStrike,
          svgOrigin: HAND.fingerPivot,
          duration: 0.01,
          ease: 'power4.in',
        },
        BEATS.snap,
      )
      tl.to(
        digits,
        {
          rotation: HAND.thumbRecoil,
          svgOrigin: HAND.thumbPivot,
          duration: 0.014,
          ease: 'power3.out',
        },
        BEATS.snap,
      )

      /* The camera flinches. A separate element from the push-in so
         the two transforms compose instead of fighting over one. */
      tl.to(flinch, { scale: 1.045, duration: 0.008, ease: 'power4.out' }, BEATS.snap)
      tl.to(flinch, { scale: 1, duration: 0.05, ease: 'power2.out' }, BEATS.snap + 0.008)

      tl.to(
        el,
        { '--snap-glow': 1, duration: 0.008 },
        BEATS.snap,
      )
      tl.to(el, { '--snap-glow': 0, duration: 0.12 }, BEATS.snap + 0.01)

      tl.to([kicker, tension], { autoAlpha: 0, duration: 0.01 }, BEATS.snap)

      /* --------------------------------------------------------
         THE FREEZE lives here: BEATS.snapOut (.318) to
         BEATS.transform (.355). Deliberately empty. Do not fill
         it — see the header.
         -------------------------------------------------------- */

      /* ================= ACT 05 · TRANSFORM ================= */
      tl.addLabel('transform', BEATS.transform)

      /* The room is REACHED, not cross-faded. `--wipe` is the
         radius of a mask opening from the contact point, so the
         cinema spreads out of the snap rather than appearing over
         the top of the old room. */
      tl.to(cinema, { '--wipe': 118, duration: 0.17, ease: 'power2.inOut' }, BEATS.transform)
      tl.to(cold, { autoAlpha: 0, duration: 0.12 }, BEATS.transform)
      tl.to(ordinary, { autoAlpha: 0, duration: 0.12 }, BEATS.transform + 0.06)
      tl.to(tagBefore, { autoAlpha: 0, duration: 0.03 }, BEATS.transform)
      tl.to(tagAfter, { autoAlpha: 1, duration: 0.05 }, BEATS.transform + 0.06)

      /* The hand leaves the way it came — un-drawn, fingertips
         first. It was the cause, not the product, and leaving it
         on screen through the payoff would make the section about
         a hand. */
      tl.to(handFill, { opacity: 0, duration: 0.05 }, BEATS.transform + 0.02)
      tl.to(
        strokes,
        { drawSVG: '100% 100%', duration: 0.08, stagger: { each: 0.008, from: 'end' } },
        BEATS.transform + 0.03,
      )
      tl.to(
        handBox,
        { autoAlpha: 0, xPercent: wide ? 10 : 14, duration: 0.08, ease: 'power1.in' },
        BEATS.transform + 0.07,
      )

      /* ================= ACT 06 · PAYOFF ================= */
      tl.to(
        split.lines,
        { yPercent: 0, duration: 0.09, stagger: 0.04, ease: 'power3.out' },
        BEATS.payoff,
      )

      /* ================= ACT 07 · STATES ================= */
      tl.addLabel('states', BEATS.states)

      /* The claim is made once at full size, then it becomes the
         section's standing header and the stage is handed over to
         the evidence. Two elements rather than one scaled down:
         display serif at 40% of its designed size is a different,
         worse typeface. */
      tl.to(
        split.lines,
        { yPercent: -115, duration: 0.05, stagger: 0.02, ease: 'power2.in' },
        BEATS.states - 0.05,
      )
      tl.to(payoffMark, { autoAlpha: 1, duration: 0.04 }, BEATS.states - 0.01)
      tl.to(stateBlock, { autoAlpha: 1, y: 0, duration: 0.05 }, BEATS.states)
      tl.to(transport, { autoAlpha: 1, y: 0, duration: 0.05 }, BEATS.states - 0.02)

      return () => tl.kill()
    })

    return () => {
      mm.revert()
      split.revert()
    }
  }, [])

  /* ============================================================
     THE STATE ITSELF

     Its own effect, keyed on the index, and NOT part of the scrub
     timeline. Two reasons, both load-bearing:

     1. The copy is React-rendered, so the nodes the timeline
        would target are replaced on every change — a tween built
        once at mount would be holding a stale element.
     2. It has to behave identically whether the state changed
        because you scrolled or because you clicked, and a tween
        that runs on the value rather than on the playhead does
        that for free.

     The grade goes on the IMAGE, never on its frame: `.plate`
     declares its own `--plate-*` defaults, and an element's own
     declaration beats an inherited one, so the same properties
     set on a wrapper are silently ignored.
     ============================================================ */
  useEffect(() => {
    const el = root.current
    if (!el) return

    const img = el.querySelector('[data-cinema-img]')
    const wash = el.querySelector('[data-wash]')
    const swaps = el.querySelectorAll('[data-swap]')
    const { grade, wash: w } = state
    const reduce = prefersReducedMotion()
    const duration = reduce ? 0 : 0.9

    const tl = gsap.timeline({ defaults: { duration, ease: 'jaz-io', overwrite: 'auto' } })

    if (img) {
      tl.to(
        img,
        {
          '--plate-brightness': grade.brightness,
          '--plate-contrast': grade.contrast,
          '--plate-saturate': grade.saturate,
        },
        0,
      )
    }

    if (wash) {
      tl.to(
        wash,
        { '--wash-at': w.at, '--wash-tint': w.tint, '--wash-power': w.power, duration: 0 },
        0,
      )
      /* The light does not slide across the room; it goes out and
         comes back up somewhere else, which is what a lighting
         state change actually looks like. */
      tl.fromTo(wash, { opacity: 0.15 }, { opacity: 1 }, 0)
    }

    if (swaps.length && !reduce) {
      tl.fromTo(
        swaps,
        { yPercent: 105, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.66, stagger: 0.06, ease: 'jaz' },
        0,
      )
    } else if (swaps.length) {
      gsap.set(swaps, { yPercent: 0, autoAlpha: 1 })
    }

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const cinemaRendered = hasStill(snap.cinema.still)

  return (
    <section
      ref={root}
      id={snap.id}
      aria-label="One room, different worlds"
      /* `isolate` so the pinned child keeps its own stacking
         context — without it Safari can paint it under the next
         section's background the moment the pin releases. */
      className="snap-scene relative isolate bg-ink"
    >
      {/* ONE VIEWPORT AT EVERY WIDTH. This carried
          `max-lg:min-h-[38rem] lg:h-[var(--app-h)]` — a phone got a
          608px-tall stage and no height, which is a real bug rather
          than a smaller composition: the element being PINNED was
          then shorter than the screen holding it, so the scene
          played inside a letterboxed strip with the page's
          background above and below it for the whole pin. A pinned
          scene has to fill the viewport or it does not read as a
          scene at all. `--app-h` is the MEASURED height (see
          useViewportHeight), so it is already correct on mobile
          browsers whose chrome makes 100vh a lie. */}
      <div data-stage className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink">
        {/* ---- The camera. `flinch` is the recoil, `frame` the
                slow push-in; two elements so the two transforms
                compose rather than overwrite one another. ---- */}
        <div data-flinch className="absolute inset-0">
          {/* NO `will-change` HERE, and it is not an oversight. This
              element wraps `.snap-reveal`, which carries a mask —
              and promoting a layer that contains a mask or a
              clip-path is a layer Chrome intermittently fails to
              rasterise: the frame draws, the photograph inside stays
              black, and any unrelated repaint brings it back. GSAP
              promotes what it is animating on its own; the hint buys
              nothing here and costs a picture. */}
          <div data-frame className="absolute inset-0">
            {/* 01 · the ordinary room. NO `will-change` anywhere
                below this point: the cinema layer is masked, and a
                promoted mask/clip layer is one Chrome
                intermittently fails to rasterise — the frame draws
                and the photograph inside stays black. */}
            <div data-ordinary className="absolute inset-0">
              <img
                src={snap.ordinary.photo}
                alt={snap.ordinary.alt}
                /* EAGER, AND THAT IS NOT AN OVERSIGHT. Both plates
                   in this section are full-bleed stages inside a
                   pin, and lazy-loading is wrong for both: this one
                   is the first thing the section shows, so arriving
                   late means the scene opens on an empty frame, and
                   the cinema below has to be DECODED BEFORE THE
                   WIPE STARTS or the transformation reveals
                   nothing. `fetchPriority="low"` is what keeps that
                   honest — they are fetched off the critical path,
                   just not deferred until a viewport test that a
                   pinned section fails in the first place. */
                loading="eager"
                fetchPriority="low"
                decoding="async"
                draggable="false"
                /* GRADED UP, NOT DOWN. The instinct is to dim the
                   "before" room, and it is wrong for this set:
                   several of these photographs are exposed near
                   black already, and anything under about 0.8
                   brightness turns them into black rectangles. What
                   makes this room read as ORDINARY is the absence of
                   colour, not the absence of light — so the
                   saturation comes off and the exposure goes up a
                   little to survive the scrims above it. */
                className="plate absolute inset-0 [--plate-brightness:1.08] [--plate-contrast:1.02] [--plate-saturate:0.4]"
              />
            </div>

            {/* The cold. Doing the "ordinary" grade with a scrim
                rather than by dropping `--plate-brightness`,
                because several of the room photographs in this set
                are exposed near black and anything under about 0.8
                turns them into black rectangles. A scrim cools the
                room without ever being able to erase it. */}
            {/* A PLAIN ALPHA OVERLAY, NOT `mix-blend-multiply`. The
                blend version reads identically — multiply against a
                near-black room is the same picture — and it costs a
                composited stacking context on a full-bleed layer
                inside a pin, on top of a mask and a canvas. Three
                blended full-screen layers in one pinned stage is
                enough to lock a renderer, and this one was buying
                nothing for it. */}
            <div data-cold aria-hidden="true" className="absolute inset-0 bg-[#08101c]/42" />

            {/* 05 · the room after, revealed by a radial mask whose
                radius is `--wipe` and whose origin is the measured
                contact point. */}
            <div data-cinema className="snap-reveal absolute inset-0">
              {cinemaRendered ? (
                <Plate
                  slot={snap.cinema.still}
                  alt={snap.cinema.alt}
                  data-cinema-img
                  sizes="100vw"
                  loading="eager"
                  fetchPriority="low"
                  className="plate absolute inset-0"
                />
              ) : (
                <img
                  data-cinema-img
                  src={snap.cinema.photo}
                  alt={snap.cinema.alt}
                  loading="eager"
                  fetchPriority="low"
                  decoding="async"
                  draggable="false"
                  className="plate absolute inset-0"
                />
              )}

              {/* 07 · the light signature. The only thing that
                  changes between the five states, along with the
                  grade on the plate above — the photograph itself
                  never moves, which is the section's whole claim. */}
              <div data-wash aria-hidden="true" className="snap-wash absolute inset-0" />
            </div>
          </div>
        </div>

        {/* ---- What the snap threw off ---- */}
        <SnapMotes progress={moteProgress} origin={moteOrigin} className="z-10" />

        {/* ---- The hand ---- */}
        <div
          data-hand-box
          aria-hidden="true"
          /* CENTRED BY LAYOUT, NOT BY A TRANSFORM. The obvious
             `top-1/2 -translate-y-1/2` centres it just as well and
             breaks the one measurement this whole scene is placed
             from: `offsetTop` reports the LAYOUT position, so the
             translate is invisible to it and the contact point is
             measured half a hand too low — the flash and the wipe
             then originate below the fingers that caused them.
             `inset-y-0` + a height + `my-auto` centres in layout,
             so the measurement stays true. */
          className="pointer-events-none absolute inset-y-0 z-20 my-auto max-lg:right-[-8%] max-lg:aspect-square max-lg:w-[74vw] lg:right-[12%] lg:h-[min(56vw,72vh)] lg:w-[min(56vw,72vh)]"
        >
          <SnapHand className="h-full w-full overflow-visible" />
        </div>

        {/* ---- Two frames of contact ---- */}
        <div data-flash aria-hidden="true" className="snap-flash pointer-events-none absolute inset-0 z-30" />

        {/* ---- The floor the type is read against. Weighted at the
                base and the head only: the light in these frames IS
                the picture, so a scrim across the middle would be
                paying for legibility nothing needs. ---- */}
        {/* TWO SCRIMS, NOT ONE, AND THEY DO DIFFERENT JOBS.

            A single bottom-weighted gradient has to choose between a
            legible reading edge and an untouched picture, and it was
            choosing the picture: the state line and every mono label
            in this scene sat on a LIT room at around 5% of black and
            failed contrast outright. Splitting them lets the reading
            edge take the weight — a wash down the left third, where
            all the type is — while the screen wall in the middle of
            the frame, which is the thing the section is selling,
            keeps its own light. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            background:
              'linear-gradient(100deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 20%, rgba(0,0,0,0.28) 42%, rgba(0,0,0,0) 62%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 16%, rgba(0,0,0,0.34) 34%, rgba(0,0,0,0.04) 58%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* ============ TYPE ============ */}
        {/* THE TOP PADDING CLEARS THE NAV, and it has to be stated
            here rather than inherited from the section rhythm. The
            site's header is a SOLID BLACK BAR 86px tall on the
            homepage, and this stage is pinned at `top: 0` — so the
            usual `py-12` put the chapter mark and the before/after
            tag at y=64, entirely underneath it. They were invisible
            on the actual page while looking perfectly correct in
            isolation, which is the failure mode a section built in
            its own preview harness is most likely to ship. */}
        <div className="relative z-40 flex h-full flex-col justify-between pt-28 pb-12 sm:pb-14 lg:pb-16">
          {/* ---- Head ---- */}
          <header className="shell-wide flex items-start justify-between gap-8">
            {/* ONE RUNNING HEAD, ON ONE LINE. The claim used to sit
                as a second mono label stacked under the chapter mark,
                which put four separate captions around the edges of a
                photograph before the section had said anything. Set
                after the rule it reads as a running head — the same
                words, in the same place, carrying the claim for the
                reduced-motion build without adding a corner. */}
            <span data-chapter className="t-label flex flex-wrap items-center gap-x-3 gap-y-2 text-fog">
              {snap.chapter}
              <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
              <span data-payoff-mark className="text-mist">{snap.payoff.join(' ')}</span>
            </span>

            <div className="relative shrink-0 text-right">
              <span data-tag="before" className="t-label block text-mist">
                {snap.ordinary.tag}
              </span>
              <span data-tag="after" className="t-label absolute inset-0 block text-cove">
                {snap.cinema.tag}
              </span>
            </div>
          </header>

          {/* ---- The readout beside the hand. Not a caption: the
                  number is the measured gap between the two digits
                  in the drawing, counting to contact. ---- */}
          <div
            data-tension
            className="shell-wide pointer-events-none -mt-8 flex items-center gap-4 max-lg:hidden"
          >
            <span className="block h-px w-10 bg-cove/50" aria-hidden="true" />
            <span className="t-label text-ash">{snap.tension}</span>
            <span className="t-num text-2xl leading-none text-cove tabular-nums">
              <span data-gap>{GAP}</span>
              <span className="text-sm text-ash">&#176;</span>
            </span>
          </div>

          {/* ---- Foot ---- */}
          <div className="shell-wide">
            <span data-kicker className="t-label block text-fog">
              {snap.kicker}
            </span>

            {/* The payoff, at the size it deserves once. */}
            <p data-payoff className="t-cinema mt-5 max-w-4xl text-pure sm:mt-7">
              {snap.payoff.map((line, i) => (
                <span key={line} className="block">
                  {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
                </span>
              ))}
            </p>

            {/* The five states. The word takes the slot the payoff
                just left, at the same size — the claim, then the
                evidence, in the same place. */}
            <div
              data-state-block
              id={PANEL_ID}
              role="tabpanel"
              aria-labelledby={`${TAB_ID}-${state.key}`}
              tabIndex={0}
              className="focus-ring absolute inset-x-0 bottom-[12rem] px-[var(--gutter)] sm:bottom-[13rem] lg:bottom-[14rem]"
            >
              <div className="mx-auto flex w-full max-w-[108rem] items-end justify-between gap-10">
                <div className="min-w-0">
                  <span className="mask-line block">
                    <h3 data-swap className="t-cinema block text-pure">
                      {state.word}
                      <span className="text-cove">.</span>
                    </h3>
                  </span>
                  <p className="t-sub mt-4 max-w-[34ch] text-bone">
                    <span className="mask-line block">
                      <span data-swap className="block">
                        {state.line}
                      </span>
                    </span>
                  </p>
                </div>

                {/* The engineering readout. Hairline-ruled rows, no
                    card, nothing that reads as a widget — the same
                    sheet <LightsDown> puts beside its beam, and the
                    thing that stops five words over one photograph
                    from reading as a colour picker. */}
                <dl data-swap className="hidden w-52 shrink-0 lg:block">
                  {state.readout.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-4 border-t border-white/12 py-2"
                    >
                      <dt className="t-label text-fog">{k}</dt>
                      <dd className="t-num text-[0.6875rem] text-bone">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Announced on change; the swap above is decorative
                  motion a screen reader never receives. */}
              <span className="sr-only" aria-live="polite">
                {`${state.n} of 0${snapStates.length}. ${state.word}. ${state.line}`}
              </span>
            </div>

            {/* ---- The transport ---- */}
            {/* LIFTED CLEAR OF THE FLOATING CHAT WIDGET. The site
                mounts an "Ask JAAZ AI" pill at `fixed bottom-6
                right-6 z-[80]`, and at the obvious `bottom-10` this
                transport ran underneath it — the ESCAPE cell was
                half-covered by a control from another component
                sitting forty stacking levels above it. Text losing
                a corner to that widget is a shrug; an INTERACTIVE
                cell losing one is a control that silently does
                nothing where a visitor happens to click. It does
                not show up in the section's own preview, because
                the widget is not there. */}
            <div data-transport className="absolute inset-x-0 bottom-20 px-[var(--gutter)] sm:bottom-24">
              <div className="mx-auto w-full max-w-[108rem]">
                {/* ONE LABEL ON THIS RAIL. "States" named a control
                    strip that already names itself five times over,
                    and it was set at the same weight as the
                    instruction beside it, so the row read as two
                    captions arguing. The instruction stays, on the
                    reading edge, at a weight that can actually be
                    read off a lit photograph. */}
                <div className="mb-3">
                  <span className="t-label text-mist">{snap.hint}</span>
                </div>
                <SnapStates
                  states={snapStates}
                  index={index}
                  onSelect={select}
                  tabId={TAB_ID}
                  panelId={PANEL_ID}
                  label="Choose a state"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
