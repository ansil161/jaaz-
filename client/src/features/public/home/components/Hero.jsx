import { useRef } from 'react'
import TheatreScene from './TheatreScene'
import { hero, heroStages, heroPlate, heroMedia } from '@/features/public/data/site'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import { useScrubVideo, scrubVideoProps } from '@/features/public/home/hooks/useScrubVideo'
import { scrollToId } from '@/features/public/hooks/useLenis'

/* ============================================================
   HERO — "the room wakes up"

   The section is pinned for ~4 viewport heights. Across that
   distance a single scrubbed timeline brings the theatre's
   light sources up ONE AT A TIME: structure, aisle lights,
   acoustic walls, ceiling cove, star ceiling, and finally the
   screen itself. Nothing is revealed in a single scroll — each
   gesture buys one more layer of the room.

   TWO ROOMS, ONE CHOREOGRAPHY
   The room is drawn in SVG (TheatreScene) unless a scrubbable
   clip is available at `heroMedia.src`, in which case the
   footage takes over and is seeked frame-by-frame off the same
   timeline. The cue map, the pin length, the headline assembly
   and the stage read-out are identical either way — only the
   thing being lit changes. That is deliberate: the vector room
   is not a placeholder to be thrown away, it is the fallback
   for reduced motion, for a failed download, and for the first
   few hundred milliseconds before the clip is seekable.

   The headline is in mix-blend-mode: difference, so when the
   screen finally ignites behind it, the type inverts from white
   to black instead of being washed out.

   In the DRAWN version there is one further cue: the room
   dissolves into a PHOTOGRAPH of a finished cinema, matched to
   the same one-point composition — the diagram becomes the
   building. Footage needs no such trick, because it is already
   the building, so that step is skipped rather than faked.
   ============================================================ */

/* Where each light source lands on the 0–1 scrub timeline.
   Deliberately uneven — the darkness at the start should feel
   longer than it is, and the screen should arrive as a release. */
const CUE = {
  structure: 0.04,
  steps: 0.14,
  walls: 0.27,
  cove: 0.41,
  stars: 0.54,
  screen: 0.66,
  real: 0.82,
}

export default function Hero() {
  const stageLabelRef = useRef(null)
  const ticksRef = useRef([])
  const lastStage = useRef(-1)

  /* `ready` flips once — from false to true — the moment the clip is
     genuinely seekable. It is a GSAP dependency below, so the whole
     scope tears down and rebuilds against the footage at that point. */
  const { ref: videoRef, ready: hasFootage } = useScrubVideo(heroMedia.src)

  const root = useGsapScope(
    (el) => {
      const scene = el.querySelector('[data-scene]')
      const video = el.querySelector('[data-hero-video]')
      const plate = el.querySelector('[data-hero-plate]')
      const scrim = el.querySelector('[data-hero-scrim]')
      const headline = el.querySelector('[data-headline]')
      const lines = el.querySelectorAll('[data-hero-line] > span')
      const outro = el.querySelectorAll('[data-hero-outro]')
      const hint = el.querySelector('[data-hero-hint]')
      const layer = (name) => el.querySelector(`[data-layer="${name}"]`)

      /* --- Reduced motion: hand over the finished room, no scrubbing. --- */
      if (prefersReducedMotion()) {
        gsap.set(scene, { autoAlpha: 0 })
        gsap.set(video, { autoAlpha: 0 })
        gsap.set([plate, scrim], { autoAlpha: 1 })
        gsap.set(headline, { mixBlendMode: 'normal' })
        gsap.set([lines, outro], { yPercent: 0, autoAlpha: 1 })
        gsap.set(hint, { autoAlpha: 0 })
        if (stageLabelRef.current) stageLabelRef.current.textContent = heroStages.at(-1).label
        gsap.set(ticksRef.current, { scaleX: 1 })
        return
      }

      gsap.set(lines, { yPercent: 108 })
      gsap.set(outro, { autoAlpha: 0, y: 28 })

      /* Which room is on stage. The unused one is taken to zero rather
         than unmounted, so switching over when the clip lands is a
         cross-fade of two already-laid-out layers and never a reflow. */
      gsap.set(scene, { autoAlpha: hasFootage ? 0 : 1 })
      gsap.set(video, { autoAlpha: hasFootage ? 1 : 0 })
      gsap.set([plate, scrim], { autoAlpha: 0 })

      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: '(min-width: 768px)',
          mobile: '(max-width: 767px)',
        },
        (ctx) => {
          const { desktop } = ctx.conditions
          /* Shorter throw on phones — the same choreography, less thumb work. */
          const distance = desktop ? '+=420%' : '+=260%'

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: el,
              start: 'top top',
              end: distance,
              pin: '[data-hero-stage]',
              scrub: 0.7,
              anticipatePin: 1,
              onUpdate: (self) => {
                /* Drive the stage read-out imperatively. Putting this in
                   React state would re-render the tree every scroll frame. */
                const p = self.progress
                const cues = Object.values(CUE)
                let idx = 0
                for (let i = 0; i < cues.length; i++) if (p >= cues[i]) idx = i + 1
                if (idx !== lastStage.current) {
                  lastStage.current = idx
                  const stage = heroStages[Math.min(idx, heroStages.length - 1)]
                  if (stageLabelRef.current) stageLabelRef.current.textContent = stage.label
                  ticksRef.current.forEach((t, i) => {
                    if (t) gsap.to(t, { scaleX: i < idx ? 1 : 0, duration: 0.5, ease: 'jaz' })
                  })
                }
              },
            },
          })

          if (hasFootage) {
            /* ---------- THE ROOM, FILMED ----------
               One tween owns the whole clip. `currentTime` is a plain
               numeric property, so GSAP writes it exactly like any
               other — the browser does the decoding. */
            tl.fromTo(
              video,
              { currentTime: 0 },
              { currentTime: video.duration, duration: 1 },
              0,
            )

            /* A slow counter-push so the frame is never perfectly still
               even where the footage itself holds. */
            tl.fromTo(
              video,
              { scale: desktop ? 1.1 : 1.22 },
              { scale: 1, duration: 1 },
              0,
            )

            /* Footage ends lit, which is exactly where difference blend
               stops helping and starts eating the headline. Same hand-off
               as the drawn version, timed to the clip instead of a cue. */
            tl.to(scrim, { autoAlpha: 1, duration: 0.16 }, 0.66)
            tl.set(headline, { mixBlendMode: 'normal' }, 0.74)
            tl.to(headline, { scale: 0.78, yPercent: -13, duration: 0.18 }, 0.7)
          } else {
            /* ---------- THE ROOM, DRAWN ---------- */

            /* The camera opens up as the room does: we start tight and
               slightly disoriented, and settle into the full geometry. */
            tl.fromTo(
              scene,
              { scale: desktop ? 1.18 : 1.32, yPercent: 2 },
              { scale: 1, yPercent: 0, duration: 1 },
              0,
            )

            /* --- The light cues. Each one is a separate scroll gesture. --- */
            const light = (name, at, dur, to = 1) =>
              tl.to(layer(name), { opacity: to, duration: dur }, at)

            light('structure', CUE.structure, 0.1)
            light('steps', CUE.steps, 0.12)
            light('walls', CUE.walls, 0.14)
            light('cove', CUE.cove, 0.12)
            light('seats', CUE.cove + 0.04, 0.1, 0.55) // rim-lit by the cove only
            light('stars', CUE.stars, 0.11)
            light('screen', CUE.screen, 0.13)
            light('seats', CUE.screen + 0.02, 0.1, 1) // now fully silhouetted
            light('beam', CUE.screen + 0.05, 0.14)

            /* --- The drawing becomes the building. --- */
            tl.to(scene, { autoAlpha: 0, scale: 1.08, duration: 0.16 }, CUE.real)
            tl.fromTo(
              plate,
              { autoAlpha: 0, scale: 1.16 },
              { autoAlpha: 1, scale: 1, duration: 0.18 },
              CUE.real,
            )
            tl.to(scrim, { autoAlpha: 1, duration: 0.14 }, CUE.real + 0.02)
            /* Difference blend is a gift over a lit screen and a liability
               over a photograph, where mid-greys cancel the type out. */
            tl.set(headline, { mixBlendMode: 'normal' }, CUE.real + 0.06)
            tl.to(headline, { scale: 0.76, yPercent: -14, duration: 0.18 }, CUE.real + 0.02)
          }

          /* ---------- SHARED ---------- */

          /* Headline assembles one line per stage, so reading the
             sentence and lighting the room happen at the same rate. */
          tl.to(lines[0], { yPercent: 0, duration: 0.16 }, CUE.steps)
          tl.to(lines[1], { yPercent: 0, duration: 0.16 }, CUE.cove)
          tl.to(lines[2], { yPercent: 0, duration: 0.16 }, CUE.screen)

          /* Sub-line and CTA arrive last, once the room can hold them. */
          tl.to(outro, { autoAlpha: 1, y: 0, duration: 0.11, stagger: 0.03 }, 0.9)

          /* The hint has done its job the moment the user scrolls. */
          tl.to(hint, { autoAlpha: 0, duration: 0.05 }, 0.02)
        },
      )

      return () => mm.revert()
    },
    [hasFootage],
  )

  return (
    <section ref={root} id="hero" className="relative">
      <div
        data-hero-stage
        className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink isolate"
      >
        {/* --- The room, drawn --- */}
        <div data-scene className="absolute inset-0 will-change-transform">
          <TheatreScene className="h-full w-full" />
        </div>

        {/* --- The room, filmed ---
            Mounted only when a clip is actually configured, so the
            no-footage case requests nothing at all. When it IS
            configured it stays mounted from the start — invisible and
            inert until `useScrubVideo` confirms the file is genuinely
            seekable — so the hand-off from the drawn room is a
            cross-fade of two laid-out layers, never a mount. */}
        {heroMedia.src && (
          <video
            ref={videoRef}
            data-hero-video
            src={heroMedia.src}
            poster={heroMedia.poster}
            {...scrubVideoProps}
            className="absolute inset-0 h-full w-full object-cover opacity-0 will-change-transform"
          />
        )}

        {/* --- The room, built --- */}
        <div data-hero-plate className="absolute inset-0 will-change-transform">
          <img
            src={heroPlate.src}
            alt={heroPlate.alt}
            /* Eager + high priority: this is the payoff frame, and it
               must never arrive after the scroll that calls for it. */
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable="false"
            /* Lifted off the shared `.plate` grading: this frame is a
               deliberately dark room, and the house curve would sink it. */
            className="plate [--plate-brightness:1.04] [--plate-contrast:1.04]"
          />
        </div>
        <div
          data-hero-scrim
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/15 to-ink/30"
        />

        {/* --- Headline. Difference blend so it survives the screen. --- */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <h1
            data-headline
            /* No max-width: every line in `hero.headline` is authored as
               one line, and a wrap inside a mask-line would be sliced in
               half by its own overflow. */
            className="t-hero mix-blend-difference origin-center px-6 text-center text-pure"
          >
            {hero.headline.map((line) => (
              <span key={line} data-hero-line className="mask-line">
                <span className="block">{line}</span>
              </span>
            ))}
          </h1>
        </div>

        {/* --- Corner furniture: label, stage read-out, hint --- */}
        {/* The fixed nav already holds the top of the frame, so the
            hero only furnishes the bottom edge. */}
        <div className="pointer-events-none absolute inset-0 shell flex flex-col justify-end py-6 sm:py-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            {/* Sub + CTA, released at the end of the sequence. */}
            <div className="max-w-md">
              <p data-hero-outro className="t-sub text-fog">
                {hero.sub}
              </p>
              <div data-hero-outro className="pointer-events-auto mt-7">
                <button
                  type="button"
                  onClick={() => scrollToId('contact')}
                  className="btn focus-ring text-pure"
                >
                  {hero.cta}
                  <span className="btn-arrow" aria-hidden="true">
                    &#8594;
                  </span>
                </button>
              </div>
            </div>

            {/* Stage read-out — six ticks, one per light source. */}
            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-3">
              <span ref={stageLabelRef} className="t-label text-mist">
                {heroStages[0].label}
              </span>
              <div className="flex gap-1.5" aria-hidden="true">
                {heroStages.map((s, i) => (
                  <span key={s.id} className="relative block h-px w-7 bg-smoke sm:w-9">
                    <span
                      ref={(n) => {
                        ticksRef.current[i] = n
                      }}
                      className="absolute inset-0 origin-left scale-x-0 bg-pure"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- Scroll invitation --- */}
        <div
          data-hero-hint
          className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
        >
          <span className="t-label whitespace-nowrap text-ash">{hero.scrollHint}</span>
          <span className="relative block h-10 w-px overflow-hidden bg-smoke">
            <span className="jaz-scroll-tick absolute inset-x-0 top-0 h-4 bg-fog" />
          </span>
        </div>
      </div>
    </section>
  )
}
