import { lightsDown } from '../../data/site'
import { useGsapScope, gsap, SplitText, prefersReducedMotion } from '../../lib/useGsap'
import { useScrubVideo, scrubVideoProps } from '../../lib/useScrubVideo'

/* ============================================================
   CHAPTER 01 — LIGHTS DOWN

   Darkness -> anticipation -> projection -> reveal.

   THE ONE IDEA
   The photograph is never faded in. It is at full opacity from
   the first frame and simply has not been REACHED by any light
   yet. What scrubs is the beam: a cone with an apex at the
   projector port, a half-angle and a throw distance, expressed
   as a mask of two intersected gradients (see `.beam-frame` in
   index.css, where the geometry is written down properly).

   That distinction is the whole section. A cross-fade says "here
   is the next slide". A beam opening from 3 degrees to 58 while
   its reach runs 5% -> 152% says "the projector has come on and
   the room is arriving". Same photograph, same three cheap
   properties, completely different sentence.

   THE FIVE PHASES, as scrubbed positions on one timeline:

     .00  DARKNESS      near-black. One line of mono type, at
                        14% opacity, and nothing else.
     .06  FIRST LIGHT   the gate opens — a warm hairline at the
                        apex, before there is any cone at all.
     .10  PROJECTION    spread, reach and exposure ramp together.
                        The annotation column arrives with it,
                        because that is when there is light to
                        read it by.
     .46  REVEAL        the room is lit; the statement resolves
                        line by line out of masked boxes.
     .86  THE GATE      NOT a fade. The frame collapses to a
                        single horizontal line of light and the
                        line snaps shut, the way a projector gate
                        closes, and the last tenth of the pin is
                        held on pure black. Every section either
                        side of this one is bg-ink, so the join is
                        a cut rather than a dissolve.

   WHY THE BEAM IS TWEENED AS `fromTo`, EXPLICITLY
   `--spread` and `--reach` are tweened straight on the element as
   custom properties, with both ends written out. Two earlier
   shapes of this do not survive: a plain proxy object driven by
   `onUpdate` is reverted along with its closure when StrictMode
   double-invokes the effect, and a bare `to()` re-reads its start
   value from the live element on every `invalidateOnRefresh` —
   which, once the beam is open, records the OPEN state as the
   start and the section never goes dark again. Explicit from-
   values are immune to both.
   ============================================================ */

const D = lightsDown

/* Beam geometry, start -> end. Portrait needs a wider cone for the
   same coverage: the apex-to-corner angle genuinely grows when the
   frame gets narrow, so this is a measurement, not a taste call. */
/* `feather` opens with the wedge, and it is not a nicety: a 7-degree
   soft edge on a 6-degree beam is a beam, and the same 7 degrees on a
   116-degree one is a hard diagonal cut across the photograph. The
   softness has to stay proportional to the spread or the last third
   of the reveal looks like a shape rather than like light. */
const BEAM = {
  wide: { spread: [3, 58], reach: [5, 152], feather: [7, 26], lift: [0.26, 1.04] },
  narrow: { spread: [4, 78], reach: [6, 168], feather: [8, 32], lift: [0.3, 1.02] },
}

export default function LightsDown() {
  const { ref: videoRef, ready: hasFootage } = useScrubVideo(D.video)

  const root = useGsapScope(
    (el) => {
      const q = (s) => el.querySelector(s)
      const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

      const beam = q('[data-beam]')
      const media = q('[data-media]')
      const video = q('[data-video]')
      const still = q('[data-still]')
      const cone = q('[data-cone]')
      const gate = q('[data-gate-line]')
      const chapter = q('[data-chapter]')
      const kicker = q('[data-kicker]')
      const statement = q('[data-statement]')
      const caption = q('[data-caption]')
      const slit = q('[data-slit]')
      const shutter = q('[data-shutter]')
      const specs = qa('[data-spec]')

      /* `video` is null whenever no clip is configured, and GSAP warns
         on a null target rather than ignoring it. */
      if (video) gsap.set(video, { autoAlpha: hasFootage ? 1 : 0 })
      gsap.set(still, { autoAlpha: hasFootage ? 0 : 1 })

      /* --- Reduced motion: the room, lit, and every line of type. --- */
      if (prefersReducedMotion()) {
        gsap.set(beam, { '--spread': 90, '--reach': 200 })
        gsap.set(media, { filter: 'brightness(1)' })
        gsap.set([chapter, kicker, statement, caption, ...specs], { autoAlpha: 1, y: 0 })
        gsap.set([cone, gate, slit], { autoAlpha: 0 })
        return
      }

      /* Split before the timeline exists, so the lines are real boxes
         by the time anything is asked to move them. `autoSplit: false`
         on purpose — re-splitting mid-scrub would rebuild the tween
         under a playhead that is already inside it and jump. The
         resize case is covered by ScrollTrigger's own refresh. */
      const split = SplitText.create(statement, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: false,
      })

      const mm = gsap.matchMedia()

      mm.add(
        {
          wide: '(min-width: 768px)',
          narrow: '(max-width: 767px)',
        },
        (ctx) => {
          const { wide } = ctx.conditions
          const g = wide ? BEAM.wide : BEAM.narrow

          /* Opening state. Everything the timeline will touch is set
             here rather than in markup, so a refresh mid-section
             rebuilds from a known frame instead of from wherever the
             last playhead left things. */
          gsap.set(beam, {
            '--spread': g.spread[0],
            '--reach': g.reach[0],
            '--feather': g.feather[0],
          })
          gsap.set(media, { filter: `brightness(${g.lift[0]})`, scale: 1.14 })
          gsap.set(chapter, { autoAlpha: 0, y: -10 })
          gsap.set(kicker, { autoAlpha: 0.14, y: 0 })
          gsap.set(split.lines, { yPercent: 112 })
          gsap.set(statement, { autoAlpha: 1 })
          gsap.set(caption, { autoAlpha: 0, y: 14 })
          gsap.set(specs, { autoAlpha: 0, x: 22 })
          gsap.set(cone, { autoAlpha: 0 })
          gsap.set(gate, { autoAlpha: 0, scaleX: 0 })
          gsap.set(slit, { autoAlpha: 0, scaleX: 1 })
          gsap.set(shutter, { clipPath: 'inset(0% 0% 0% 0%)' })

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              /* Absolute pixels from a function `end`. A function
                 returning `+=N%` resolves against the trigger's own
                 height, which pinSpacing then grows by that amount —
                 so every refresh multiplies the pin again. Spaces.jsx
                 carries the same note and the same fix. */
              end: () => `+=${Math.round(window.innerHeight * (wide ? 2.6 : 1.7))}`,
              pin: '[data-stage]',
              scrub: 0.55,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          /* --- PHASE 01 · darkness ------------------------------- */
          tl.to(kicker, { autoAlpha: 1, duration: 0.05 }, 0)
          tl.to(chapter, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.02)

          /* --- PHASE 02 · first light ---------------------------- */
          /* The gate before the cone. A projector makes a slit of
             light at the lens a beat before there is a beam to see,
             and skipping that beat is what makes a reveal read as a
             transition rather than as a machine starting. */
          tl.to(gate, { autoAlpha: 1, scaleX: 1, duration: 0.045, ease: 'power2.out' }, 0.055)
          tl.to(cone, { autoAlpha: 1, duration: 0.06 }, 0.075)

          /* --- PHASE 03 · projection ----------------------------- */
          tl.fromTo(
            beam,
            { '--spread': g.spread[0], '--reach': g.reach[0], '--feather': g.feather[0] },
            {
              '--spread': g.spread[1],
              '--reach': g.reach[1],
              '--feather': g.feather[1],
              duration: 0.36,
              ease: 'power2.inOut',
            },
            0.1,
          )
          tl.to(
            media,
            { filter: `brightness(${g.lift[1]})`, duration: 0.36, ease: 'power2.out' },
            0.1,
          )
          tl.to(gate, { autoAlpha: 0, duration: 0.08 }, 0.14)
          tl.to(specs, { autoAlpha: 1, x: 0, duration: 0.06, stagger: 0.035 }, 0.17)

          /* The push-in runs the entire pin. A held frame that is also
             perfectly still is the one thing that makes a pin read as
             a page that has stopped responding. */
          tl.to(media, { scale: 1, duration: 1, ease: 'none' }, 0)

          /* The haze settles back once the room is lit — a beam is
             most visible in the moment it arrives, least once the
             screen is carrying the light. */
          tl.to(cone, { autoAlpha: 0.42, duration: 0.14 }, 0.4)

          /* --- PHASE 04 · reveal --------------------------------- */
          tl.to(
            split.lines,
            { yPercent: 0, duration: 0.16, stagger: 0.055, ease: 'power3.out' },
            0.48,
          )
          tl.to(caption, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.7)

          /* --- PHASE 05 · the gate closes ------------------------ */
          tl.to([chapter, kicker, caption], { autoAlpha: 0, duration: 0.05 }, 0.82)
          tl.to(split.lines, { yPercent: -112, duration: 0.06, stagger: 0.02 }, 0.82)
          tl.to([cone, specs], { autoAlpha: 0, duration: 0.04 }, 0.84)

          /* The collapse. Top and bottom close on the centre line
             while a hairline of light survives in the middle of it,
             then that line goes too. Both halves are one property
             each — clip-path on the shutter, opacity+scaleX on the
             slit — so the whole exit is two composited elements. */
          tl.to(
            shutter,
            { clipPath: 'inset(49.9% 0% 49.9% 0%)', duration: 0.1, ease: 'power3.in' },
            0.86,
          )
          tl.to(slit, { autoAlpha: 1, duration: 0.05, ease: 'power2.out' }, 0.87)
          tl.to(slit, { autoAlpha: 0, scaleX: 0.1, duration: 0.04, ease: 'power3.in' }, 0.93)

          if (hasFootage) {
            tl.fromTo(
              video,
              { currentTime: 0 },
              { currentTime: video.duration, duration: 0.9 },
              0.05,
            )
          }

          return () => tl.kill()
        },
      )

      return () => {
        mm.revert()
        split.revert()
      }
    },
    [hasFootage],
  )

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.alt}
      /* `isolate` so the pinned child keeps its own stacking context —
         without it Safari can paint it under the next section's
         background once the pin releases. */
      className="relative isolate bg-ink"
    >
      <div data-stage className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink">
        {/* Everything the gate closes over. The slit below is its
            sibling, so it survives the clip. */}
        <div data-shutter className="absolute inset-0">
          {/* ---- The room, lit only where the beam has reached ---- */}
          <div data-beam className="beam absolute inset-0">
            <div data-media className="beam-frame absolute inset-0 will-change-transform">
              <img
                data-still
                src={D.poster}
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable="false"
                className="plate absolute inset-0 [--plate-contrast:1.04]"
              />
              {/* Mounted only when a clip exists — a dev server answers
                  an unknown path with the SPA shell, so a <video> aimed
                  at a missing file downloads index.html at preload
                  priority and then fails to decode it. */}
              {D.video && (
                <video
                  ref={videoRef}
                  data-video
                  src={D.video}
                  poster={D.poster}
                  {...scrubVideoProps}
                  className="absolute inset-0 h-full w-full object-cover opacity-0"
                />
              )}
            </div>

            {/* The beam itself — haze, not the surface it lands on. */}
            <div data-cone aria-hidden="true" className="beam-cone absolute inset-0" />
          </div>

          {/* The projector gate, at the apex. A warm hairline, before
              there is any cone to see. */}
          <div
            data-gate-line
            aria-hidden="true"
            className="pointer-events-none absolute left-[70%] top-[9%] h-px w-16 origin-center md:left-[78%] md:top-[13%] md:w-24"
            style={{
              background:
                'linear-gradient(to right, rgba(255,240,214,0) 0%, rgba(255,244,224,0.95) 50%, rgba(255,240,214,0) 100%)',
              boxShadow: '0 0 22px 3px rgba(255,236,200,0.5)',
            }}
          />

          {/* A floor, and almost nothing across the middle. The light
              in these frames IS the picture, so the scrim earns its
              opacity only where type has to be read over it: the base,
              where the statement and the two annotation columns sit,
              and a little at the head so the chapter mark survives a
              bright ceiling. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.58) 20%, rgba(0,0,0,0.06) 52%, rgba(0,0,0,0.40) 100%)',
            }}
          />

          {/* ---- Type ---- */}
          <div className="relative flex h-full flex-col justify-between py-14 sm:py-16">
            <header className="shell-wide">
              <span data-chapter className="t-label flex items-center gap-3 text-fog">
                {D.chapter}
                <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
              </span>
            </header>

            <div className="shell-wide">
              <span data-kicker className="t-label block text-fog">
                {D.kicker}
              </span>
              <p data-statement className="t-cinema mt-6 max-w-5xl text-pure sm:mt-8">
                {D.statement}
              </p>

              {/* The caption and the calibration sheet share one row,
                  in the two corners the beam never crosses. The sheet
                  used to sit top-right, which is exactly where the
                  apex is — three lines of mono over the brightest part
                  of the frame, unreadable for a third of the pin. */}
              <div className="mt-8 flex items-end justify-between gap-10 sm:mt-10">
                <p data-caption className="t-label text-mist">
                  {D.caption}
                </p>

                {/* Hairline-ruled rows. No card, no border, nothing
                    that reads as a widget. */}
                <dl className="hidden w-56 shrink-0 md:block">
                  {D.gate.map(([k, v]) => (
                    <div
                      key={k}
                      data-spec
                      className="flex items-baseline justify-between gap-4 border-t border-white/12 py-2"
                    >
                      <dt className="t-label text-mist">{k}</dt>
                      <dd className="t-num text-[0.6875rem] text-fog">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* The line the frame collapses into. Outside the shutter, so
            the clip that closes the frame does not close this. */}
        <div
          data-slit
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px origin-center"
          style={{
            background:
              'linear-gradient(to right, rgba(255,240,214,0) 0%, rgba(255,247,232,0.95) 22%, rgba(255,247,232,0.95) 78%, rgba(255,240,214,0) 100%)',
            boxShadow: '0 0 40px 6px rgba(255,236,200,0.35)',
          }}
        />
      </div>
    </section>
  )
}
