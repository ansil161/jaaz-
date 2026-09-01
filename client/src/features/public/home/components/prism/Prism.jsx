import { useCallback, useEffect, useRef, useState } from 'react'
import Plate from '@/features/public/components/Plate'
import { hasStill } from '@/features/public/utils/media'
import { prism, prismModes, prismModeCount } from '@/features/public/data/prism'
import {
  useGsapScope,
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
} from '@/lib/animation/useGsap'
import PrismFacets from './PrismFacets'
import PrismLines from './PrismLines'
import PrismPanel from './PrismPanel'
import PrismIndex from './PrismIndex'
import { FRAME, at, faceAt, markerAt, facetClip, facetSvg } from './prismGeometry'

/* ============================================================
   THE PRISM

   One room. Different worlds.

   ONE OBJECT, FIVE FACES. A single photograph of a single room
   sits at the centre of the composition inside an aperture cut
   out of the page. Five modes — WATCH, PLAY, LISTEN, HOST,
   ESCAPE — are placed around it, off any axis and off any
   circle, each tied back to the room by one short hairline.
   Scrolling turns the object to a different face: the light in
   the room changes, the aperture is cut differently, and the
   reading panel changes what it says. The photograph never
   moves, and never swaps. That is the argument.

   ------------------------------------------------------------
   THE ONE RULE: THE ROOM DOES NOT CHANGE, THE LIGHT DOES

   There is exactly one <img> in this section and it is loaded
   once. Everything that separates the five modes is a filter, a
   radial wash, a flat veil, and four chamfer percentages — all
   of them CSS on properties that already exist. If a future edit
   gives a mode its own picture, the headline becomes a lie the
   layout is telling and the section is worth nothing.

   ------------------------------------------------------------
   WHAT WAS REMOVED, AND WHY IT IS NOT COMING BACK

   This slot held a cinematic "snap" — a drawn hand, a countdown
   to contact, two frames of blowout, a particle throw, a masked
   wipe — across 3.4 viewports of pinned scroll. The five modes
   were the content and they lived in the last 40% of it.

   The whole apparatus (SnapHand, SnapMotes, handGeometry, the
   BEATS timeline, the contact-point measurement, the mote
   canvas) is gone. Nothing here is a shortened version of it:
   a composition that states the idea on arrival does not need a
   sequence to explain it, and the pin is now 2.2 viewports of
   pure face-turning rather than 3.4 of story.

   ------------------------------------------------------------
   WHY THE FACE IS NOT ON THE SCRUB TIMELINE

   Everything continuous — the parallax, the index marker — is
   scrubbed. WHICH of five faces you are on is not continuous, so
   it is React state, derived from the playhead in `onUpdate` and
   set only on the frames where the integer actually changes:
   five renders across the whole pin rather than one per scroll
   frame.

   That split is what makes the index clickable. The control
   moves the SCROLL; the playhead then derives the face exactly
   as it always does. One source of truth and nothing to
   reconcile, where setting the index on click would have it
   overwritten by the next scroll frame.

   ------------------------------------------------------------
   FIVE PARALLAX LAYERS, AND NO 3D

   Depth here is entirely differential speed. Across the pin the
   hairlines travel furthest, then the markers, then the type,
   then the room (which moves the other way), then the panel. The
   pointer does the same thing an order of magnitude smaller — a
   few pixels, never a tilt. Two separate elements per layer, an
   outer one for the scroll and an inner one for the pointer, so
   the two transforms compose instead of fighting over one `y`.

   `force3D: false` ON THE ROOM LAYER IS LOAD-BEARING. Its
   descendant carries the aperture's `clip-path`, and a promoted
   layer containing a clip-path or a mask is one Chrome
   intermittently fails to rasterise: the frame draws and the
   photograph inside it stays black until an unrelated repaint
   brings it back. GSAP's default `force3D: "auto"` promotes for
   the duration of a tween, and a scrubbed tween lasts as long as
   the section does. A 2D translate on one element costs nothing
   measurable and cannot lose the picture.

   ------------------------------------------------------------
   REDUCED MOTION KEEPS THE WHOLE SECTION

   There is nothing here that only makes sense in motion, which
   is the advantage of a composition over a sequence. No pin, no
   scrub, no parallax, no pointer — the same layout, at rest,
   with the index setting the face directly and the light
   changing without a tween. Nothing is hidden and nothing is
   explained away.
   ============================================================ */

const TAB_ID = 'prism-tab'
const PANEL_ID = 'prism-panel'

/* The pin is looked up by id when a face is selected rather than
   held in a ref. A ref has a lifecycle — matchMedia re-runs its
   callback on a breakpoint change and StrictMode double-invokes
   the layout effect, and each of those runs the teardown that
   nulls it — so a cached instance is one ordering away from
   being null at the moment somebody clicks, and the control then
   does nothing at all with no error to find. The registry always
   has the live one, or nothing, and "nothing" is a state this
   already handles: it means reduced motion, and no pin to
   travel. */
const TRIGGER_ID = 'prism-scene'

/* The five layers, slowest-moving first.

   `y` is the TOTAL scroll travel across the pin, applied as
   +y/2 to -y/2, so every layer is at its designed position at
   the middle of the section rather than at one end of it.
   `px`/`py` are the pointer's maximum pull in pixels, at the
   corners of the stage. Negative values on the room are what
   makes it read as the thing furthest away. */
const LAYERS = [
  { k: 'lines', y: 40, px: 10, py: 8 },
  { k: 'faces', y: 26, px: 7, py: 5 },
  { k: 'type', y: 15, px: 3, py: 2 },
  { k: 'room', y: -18, px: -4, py: -3, flat: true },
  { k: 'panel', y: 9, px: 2, py: 2 },
]

/**
 * Write the aperture.
 *
 * ONE FUNCTION, TWO CONSUMERS, ONE FRAME. The `clip-path` on the
 * photograph and the `points` of the hairline tracing it are
 * generated from the same four numbers here, so they cannot
 * disagree by the couple of pixels that nobody catches in review
 * and everybody sees on the page.
 *
 * Called from the layout effect as well as the mode effect: a
 * `useEffect` runs after paint, so leaving the first write to it
 * shows one frame of an unclipped rectangle on every mount.
 */
const applyFacet = (el, f) => {
  if (!el) return
  const clip = el.querySelector('[data-clip]')
  const outline = el.querySelector('[data-outline]')
  if (clip) clip.style.clipPath = facetClip(f)
  if (outline) outline.setAttribute('points', facetSvg(f))
}

export default function Prism() {
  const [index, setIndex] = useState(0)
  const mode = prismModes[index]

  /* The live aperture, as four numbers. Held in a ref rather than
     in state because it is written on every frame of a 0.9s
     morph and read by nothing in React — see the effect below. */
  const facet = useRef({ ...prismModes[0].facet })

  /* ---- Selecting a face moves the scroll, not the state ---- */
  const select = useCallback((i) => {
    const wrapped = ((i % prismModeCount) + prismModeCount) % prismModeCount
    const st = ScrollTrigger.getById(TRIGGER_ID)
    const lenis = typeof window !== 'undefined' ? window.__lenis : null

    /* No pin to travel through — reduced motion, or the trigger
       has not been built yet. Setting the index directly is the
       correct behaviour there, not a degraded one. */
    if (!st) {
      setIndex(wrapped)
      return
    }

    const y = st.start + (st.end - st.start) * at(wrapped)
    if (lenis) lenis.scrollTo(y, { duration: 1.05 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }, [])

  /* ============================================================
     THE SCENE
     ============================================================ */
  const root = useGsapScope((el) => {
    const q = (s) => el.querySelector(s)
    const indexEl = q('[data-index]')

    const layer = (k) => q(`[data-par="${k}"]`)
    const point = (k) => q(`[data-point="${k}"]`)

    /* Before paint, so the photograph is never seen unclipped. */
    applyFacet(el, facet.current)

    /* --- Reduced motion: the composition, standing still. ---
       Everything below this line is scroll and pointer. None of
       it carries meaning the layout does not already carry, so
       there is nothing to substitute — the section simply is what
       it is, and the index effect further down still runs. */
    if (prefersReducedMotion()) {
      indexEl?.style.setProperty('--prism-marker', '0.1')
      return
    }

    const mm = gsap.matchMedia()

    mm.add({ wide: '(min-width: 1024px)', narrow: '(max-width: 1023px)' }, (ctx) => {
      const { wide } = ctx.conditions

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
             as <LightsDown> and <Spaces>.

             2.2 viewports for five faces, against the 3.4 the
             cinematic build took to reach the same five. A pin is
             a promise that something is happening; this one has
             five things and no story, so it is priced for five. */
          end: () => `+=${Math.round(window.innerHeight * (wide ? 2.2 : 1.7))}`,
          pin: '[data-stage]',
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress

            /* One property write drives the whole rail. See the
               note in <PrismIndex>. */
            indexEl?.style.setProperty('--prism-marker', markerAt(p).toFixed(4))

            /* The only thing in the scene that becomes React
               state, and only on the frames where the integer
               actually moves. */
            const next = faceAt(p)
            setIndex((prev) => (prev === next ? prev : next))
          },
        },
      })

      /* ---- The five layers ---- */
      LAYERS.forEach(({ k, y, flat }) => {
        const node = layer(k)
        if (!node) return
        tl.fromTo(
          node,
          { y: y / 2 },
          { y: -y / 2, duration: 1, force3D: !flat },
          0,
        )
      })

      /* The room breathes very slightly across the pin. Not a
         push-in and not a reveal: a pinned frame that is also
         perfectly still is the one thing that makes a pin read as
         a page that has stopped responding, and 3% over two
         viewports is below the threshold at which anyone can say
         what changed. */
      const roomInner = point('room')
      if (roomInner) {
        tl.fromTo(
          roomInner,
          { scale: 1.03 },
          { scale: 1, duration: 1, force3D: false },
          0,
        )
      }

      /* ---- Arrival ----
         Opacity only, and deliberately so: every one of these
         elements already has `y` written by the scrub above, and
         a second timeline animating the same property on the same
         node is the class of bug that looks like a rendering
         glitch. The layers stagger in the order they are read. */
      const arrivals = LAYERS.map((l) => layer(l.k)).filter(Boolean)
      const intro = gsap.from([...arrivals, indexEl].filter(Boolean), {
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.09,
        ease: 'jaz',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      })

      return () => {
        tl.kill()
        intro.scrollTrigger?.kill()
        intro.kill()
      }
    })

    /* ============================================================
       THE POINTER

       A few pixels, on a fine pointer only. The brief every line
       of this obeys is that it must be impossible to point at:
       the room moves four pixels against ten on the hairlines, so
       what the eye registers is DEPTH rather than movement. There
       is no rotation anywhere in it — a tilt would make the
       composition a card being held, and the aperture is meant to
       be cut into the page rather than lying on it.
       ============================================================ */
    const fine =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches

    if (!fine) return () => mm.revert()

    const setters = LAYERS.map(({ k, px, py, flat }) => {
      const node = point(k)
      if (!node) return null
      const opts = { duration: 0.9, ease: 'power3', force3D: !flat }
      return { x: gsap.quickTo(node, 'x', opts), y: gsap.quickTo(node, 'y', opts), px, py }
    }).filter(Boolean)

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      setters.forEach((s) => {
        s.x(nx * s.px * 2)
        s.y(ny * s.py * 2)
      })
    }

    const onLeave = () =>
      setters.forEach((s) => {
        s.x(0)
        s.y(0)
      })

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      mm.revert()
    }
  }, [])

  /* ============================================================
     THE FACE ITSELF

     Its own effect, keyed on the mode, and NOT part of the scrub
     timeline. Two reasons, both load-bearing:

     1. The copy is React-rendered, so the nodes the timeline
        would target are replaced on every change — a tween built
        once at mount would be holding a stale element.
     2. It has to behave identically whether the face changed
        because you scrolled or because you clicked, and a tween
        that runs on the value rather than on the playhead does
        that for free.

     THE APERTURE IS TWEENED THROUGH A PROXY, not through two
     independent tweens. The `clip-path` on the photograph and the
     `points` of the hairline that outlines it are generated from
     the same four numbers, in the same `onUpdate`, on the same
     frame. Animating them separately puts the outline a couple of
     pixels off the picture for the length of every transition —
     which is the amount nobody catches in review and everybody
     sees on the page.

     The grade goes on the IMAGE, never on its frame: `.plate`
     declares its own `--plate-*` defaults, and an element's own
     declaration beats an inherited one, so the same properties
     set on a wrapper are silently ignored.
     ============================================================ */
  useEffect(() => {
    const el = root.current
    if (!el) return

    const img = el.querySelector('[data-room-img]')
    const wash = el.querySelector('[data-wash]')
    const veil = el.querySelector('[data-veil]')
    const swaps = el.querySelectorAll('[data-swap]')
    const softs = el.querySelectorAll('[data-swap-soft]')
    const indexEl = el.querySelector('[data-index]')

    const reduce = prefersReducedMotion()
    const duration = reduce ? 0 : 0.9

    /* Reduced motion never runs the pin, so the marker has no
       playhead to report and would sit at the left end of the
       rail under every face. It follows the selection instead. */
    if (reduce) indexEl?.style.setProperty('--prism-marker', markerAt(at(index)).toFixed(4))

    const writeFacet = () => applyFacet(el, facet.current)
    writeFacet()

    const tl = gsap.timeline({ defaults: { duration, ease: 'jaz-io', overwrite: 'auto' } })

    tl.to(facet.current, { ...mode.facet, onUpdate: writeFacet }, 0)

    if (img) {
      tl.to(
        img,
        {
          '--plate-brightness': mode.grade.brightness,
          '--plate-contrast': mode.grade.contrast,
          '--plate-saturate': mode.grade.saturate,
        },
        0,
      )
    }

    if (wash) {
      tl.set(
        wash,
        { '--wash-at': mode.wash.at, '--wash-tint': mode.wash.tint, '--wash-power': mode.wash.power },
        0,
      )
      /* The light does not slide across the room; it goes out and
         comes back up somewhere else, which is what a lighting
         state change actually looks like. */
      tl.fromTo(wash, { opacity: reduce ? 1 : 0.12 }, { opacity: 1 }, 0)
    }

    if (veil) tl.to(veil, { opacity: mode.veil }, 0)

    if (!reduce) {
      if (swaps.length) {
        tl.fromTo(
          swaps,
          { yPercent: 105, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.66, stagger: 0.055, ease: 'jaz' },
          0,
        )
      }
      if (softs.length) {
        tl.fromTo(
          softs,
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.66, stagger: 0.045, ease: 'jaz' },
          0.06,
        )
      }
    } else {
      gsap.set(swaps, { yPercent: 0, autoAlpha: 1 })
      gsap.set(softs, { y: 0, autoAlpha: 1 })
    }

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, index])

  const rendered = hasStill(prism.room.still)

  return (
    <section
      ref={root}
      id={prism.id}
      aria-label="One room, different worlds"
      /* `isolate` so the pinned child keeps its own stacking
         context — without it Safari can paint it under the next
         section's background the moment the pin releases. */
      className="prism-scene relative isolate bg-ink"
    >
      {/* ONE VIEWPORT AT EVERY WIDTH. `--app-h` is the MEASURED
          height (see useViewportHeight), so it is already correct
          on mobile browsers whose chrome makes 100vh a lie. A
          pinned element shorter than the screen holding it plays
          inside a letterboxed strip, which does not read as a
          scene at all. */}
      <div data-stage className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink">
        {/* The ground the composition is cut out of. Not a
            decoration and not a vignette: a barely-there lift
            behind the centre of the frame, so the aperture reads
            as an opening in a dark surface rather than as a
            picture pasted onto black. */}
        <div aria-hidden="true" className="prism-ground absolute inset-0" />

        {/* THE TWO CLEARANCES ARE MEASURED, NOT CHOSEN.

            TOP: the site's bar is `py-4` around an `h-9` mark on a
            phone (68px) and `py-5` around `h-10` above `sm` (80px),
            and this stage is pinned at `top: 0` — so anything set
            at the usual section rhythm sits underneath it,
            invisible on the page while looking perfectly correct
            in isolation. That is the failure mode a section built
            in its own preview harness ships with.

            BOTTOM: the site mounts an "Ask JAAZ AI" pill at
            `fixed bottom-6 right-6 z-[80]`, which owns roughly the
            bottom 72px of the right-hand edge. The index rail is
            interactive across its full width, and a control that
            silently does nothing where a visitor happens to click
            is worse than one that is not there. */}
        <div
          className="relative z-10 mx-auto flex h-full w-full max-w-[108rem] flex-col px-[var(--gutter)] pt-[clamp(5.25rem,11vh,7.25rem)] pb-[clamp(5rem,8.5vh,6.5rem)]"
        >
          {/* ---- The running head ---- */}
          <header className="flex shrink-0 items-center gap-3">
            <span className="t-label text-fog">{prism.chapter}</span>
            <span className="block h-px w-8 bg-white/20" aria-hidden="true" />
            <span className="t-label text-mist max-sm:hidden">
              {prismModeCount} faces · one room
            </span>
          </header>

          {/* ============================================================
              THE FIELD

              The coordinate box every number in prismGeometry.js is
              a percentage of. On desktop it is a positioning
              context and all five children are absolute inside it;
              below `lg` it collapses to an ordinary column and the
              same five children take their places in the flow. One
              DOM, two compositions — see <PrismFacets> for why the
              phone gets a different arrangement rather than a
              smaller one.
              ============================================================ */}
          <div
            data-field
            className="relative mt-[clamp(1rem,3vh,2.5rem)] flex min-h-0 flex-1 flex-col gap-[clamp(0.75rem,2vh,1.25rem)] lg:mt-[clamp(1.5rem,3vh,2.5rem)] lg:block"
          >
            {/* ---- L1 · the implied geometry ----
                Desktop only. On a phone there is no room around the
                photograph for a line to cross, and five hairlines
                over the picture would be decoration on top of the
                one thing the section is selling. */}
            <div
              data-par="lines"
              aria-hidden="true"
              className="pointer-events-none max-lg:hidden lg:absolute lg:inset-0"
            >
              <div data-point="lines" className="h-full w-full">
                <PrismLines index={index} />
              </div>
            </div>

            {/* ---- L4 · the room ----
                Placed before the markers in the DOM so the markers
                and their hairlines paint over the aperture's edge
                rather than under it.

                The four inset values come from FRAME in
                prismGeometry.js through custom properties rather
                than being typed into the class list, so the
                photograph and the markers around it are placed from
                ONE set of numbers. Tailwind cannot read a JS
                constant; a custom property can. */}
            <div
              data-par="room"
              style={{
                '--f-l': `${FRAME.l}%`,
                '--f-r': `${100 - FRAME.r}%`,
                '--f-t': `${FRAME.t}%`,
                '--f-b': `${100 - FRAME.b}%`,
              }}
              className="relative order-3 min-h-0 flex-1 lg:absolute lg:top-[var(--f-t)] lg:right-[var(--f-r)] lg:bottom-[var(--f-b)] lg:left-[var(--f-l)] lg:order-none lg:flex-none"
            >
              <div data-point="room" className="h-full w-full">
                {/* THE APERTURE.

                    NO `will-change` ANYWHERE IN THIS SUBTREE, and
                    it is not an oversight — see the header. The
                    clip-path is written by JS on this element and
                    the outline below traces the same four numbers,
                    so the two can never disagree. */}
                <div data-clip className="prism-clip relative h-full w-full overflow-hidden">
                  {rendered ? (
                    <Plate
                      slot={prism.room.still}
                      alt={prism.room.alt}
                      data-room-img
                      sizes="(min-width: 1024px) 38vw, 92vw"
                      loading="eager"
                      fetchPriority="low"
                      className="plate absolute inset-0"
                    />
                  ) : (
                    <img
                      data-room-img
                      src={prism.room.photo}
                      alt={prism.room.alt}
                      /* EAGER, AND NOT AN OVERSIGHT. This is the
                         only picture in a full-bleed pinned stage,
                         and lazy-loading defers it until a viewport
                         test a pinned section fails in the first
                         place — the scene would open on an empty
                         aperture. `fetchPriority="low"` is what
                         keeps that honest: off the critical path,
                         not deferred. */
                      loading="eager"
                      fetchPriority="low"
                      decoding="async"
                      draggable="false"
                      className="plate absolute inset-0"
                    />
                  )}

                  {/* The light signature. Along with the grade on
                      the photograph above, the ONLY thing that
                      changes between the five faces. */}
                  <div data-wash aria-hidden="true" className="prism-wash absolute inset-0" />

                  {/* Flat dark, for the faces that are mostly it. */}
                  <div data-veil aria-hidden="true" className="absolute inset-0 bg-ink" />
                </div>

                {/* The hairline that traces the cut. Its own SVG,
                    overlaid exactly on the frame box in a 0-100
                    viewBox, so its points and the clip-path above
                    are literally the same numbers. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="prism-outline pointer-events-none absolute inset-0 h-full w-full"
                >
                  <polygon data-outline vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>

            {/* ---- L2 · the five faces ----
                A 3.75rem band above the image on a phone; the whole
                field on a desktop. */}
            <div
              data-par="faces"
              className="pointer-events-none relative order-2 h-[3.25rem] shrink-0 lg:absolute lg:inset-0 lg:order-none lg:h-auto"
            >
              <div data-point="faces" className="h-full w-full">
                <PrismFacets
                  modes={prismModes}
                  index={index}
                  onSelect={select}
                  className="absolute inset-0"
                />
              </div>
            </div>

            {/* ---- L3 · the claim ---- */}
            <div
              data-par="type"
              className="order-1 shrink-0 lg:absolute lg:inset-y-0 lg:left-0 lg:order-none lg:flex lg:w-[20.5%] lg:flex-col lg:justify-center"
            >
              <div data-point="type">
                <h2 className="prism-heading text-pure">
                  {prism.heading.map((line, i) => (
                    <span key={line} className="block">
                      {i === 2 ? <em className="italic-display text-cove">{line}</em> : line}
                    </span>
                  ))}
                </h2>
                {/* THE SUPPORTING SENTENCE STANDS DOWN ON A SHORT
                    WINDOW, and is never on a phone at all.
                    Everything else in this column is load-bearing;
                    one sentence of support is the block that can go
                    when a 1366x768 laptop leaves the field about
                    440px of height. Same reasoning as the
                    `stage-tall` gate <Possibilities> uses — and
                    declared as ONE custom variant rather than
                    stacked inline, because Tailwind silently emits
                    no rule at all for a stacked arbitrary media
                    variant (see the note above it in site.css). */}
                <p className="t-body prism-tall:block mt-[clamp(0.875rem,2.2vh,1.5rem)] hidden max-w-[46ch] text-fog lg:max-w-none">
                  {prism.intro}
                </p>
              </div>
            </div>

            {/* ---- L5 · the reading panel ---- */}
            <div
              data-par="panel"
              className="order-4 shrink-0 lg:absolute lg:inset-y-0 lg:right-0 lg:order-none lg:flex lg:w-[20%] lg:flex-col lg:justify-center"
            >
              <div data-point="panel">
                <PrismPanel
                  mode={mode}
                  total={prismModeCount}
                  panelId={PANEL_ID}
                  tabId={TAB_ID}
                />
              </div>
            </div>
          </div>

          {/* ---- The index ----
              CLEAR OF THE FLOATING CHAT WIDGET. The site mounts an
              "Ask JAAZ AI" pill at `fixed bottom-6 right-6
              z-[80]`, which owns roughly the bottom 72px of the
              right-hand edge. The stage's bottom padding is set
              past that on purpose: text losing a corner to that
              widget is a shrug, an INTERACTIVE cell losing one is
              a control that silently does nothing where a visitor
              happens to click — and it does not show up in this
              section's own preview, because the widget is not
              there. */}
          <div data-index className="mt-[clamp(1rem,2.5vh,2rem)] shrink-0">
            <PrismIndex
              modes={prismModes}
              index={index}
              onSelect={select}
              tabId={TAB_ID}
              panelId={PANEL_ID}
              label="Choose a face"
            />
            <div className="mt-[clamp(0.5rem,1.4vh,0.75rem)]">
              <span className="t-label text-[0.5625rem] text-mist">{prism.hint}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
