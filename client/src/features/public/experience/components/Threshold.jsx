import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/animation/useGsap'
import { threshold } from '@/features/public/data/experience'
import Reel from './Reel'

/* ============================================================
   THRESHOLD — the first viewport

   A luxury architectural film, not a website animation. The
   difference in practice is restraint: one continuous move, no
   cuts, nothing sliding in from an edge, and the type arriving
   after the building rather than on top of it.

   THREE MOVES, AND NO MORE

   1. The plate holds a slow push. It is already at 1.06 when the
      page opens and travels to 1.0 across twelve seconds, so the
      first frame is never the frame the visitor is left looking
      at. This runs whether or not a clip exists, which is what
      keeps the still version cinematic rather than static.

   2. The headline reveals by line, masked. Late, because the
      building has to establish itself first — a title card over
      an unread image is a slide, not an opening.

   3. Leaving the hero drifts the plate down and lifts the type
      away at a different rate. That parallax is the only reason
      the second section feels like it is arriving from somewhere
      rather than simply being the next block.

   The scroll cue at the foot is the one piece of interface in
   the viewport, and it is a rule that draws downward — the same
   annotation language as the rest of the page, not a bouncing
   chevron.
   ============================================================ */

export default function Threshold({ onEnter, onExplore }) {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const ctx = gsap.context(() => {
      const media = el.querySelector('[data-media]')

      if (prefersReducedMotion()) {
        gsap.set('[data-veil]', { autoAlpha: 0 })
        gsap.set('[data-line]', { autoAlpha: 1, y: 0 })
        return
      }

      /* The opening. A veil over the plate lifts as the push
         starts, so the page resolves OUT of black rather than
         cutting to a lit building. */
      const open = gsap.timeline({ delay: 0.35 })

      open
        .to('[data-veil]', { autoAlpha: 0, duration: 1.9, ease: 'power2.inOut' })
        .fromTo(
          media,
          { scale: 1.06 },
          { scale: 1, duration: 12, ease: 'none' },
          0,
        )
        .from(
          '[data-line]',
          { autoAlpha: 0, y: 26, duration: 1.15, stagger: 0.12, ease: 'power3.out' },
          0.9,
        )
        .from('[data-cue]', { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 1.9)

      /* The exit. Deliberately separate from the opening timeline:
         one is time-based and plays once, the other is scrub-linked
         and has to remain live for as long as the hero is on
         screen. Merging them would tie the push to the scrollbar
         and lose the slow drift entirely. */
      gsap.to(media, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })

      gsap.to('[data-type]', {
        yPercent: -30,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: true },
      })
    }, el)

    /* The hero is a full-viewport element on a page whose height
       changes as plates decode; one refresh once it has settled
       keeps every trigger below it measuring against the real
       document. */
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 400)

    return () => {
      window.clearTimeout(id)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={root}
      className="relative flex h-svh min-h-[34rem] flex-col justify-end overflow-hidden bg-ink"
      aria-label="Experience the extraordinary"
    >
      <div data-media className="absolute inset-0 will-change-transform">
        <Reel
          slot={threshold.reel}
          still={threshold.slot}
          alt={threshold.alt}
          priority
          fill
        />
      </div>

      {/* The grade. A warm floor under the type and a cooler top,
          so the building keeps its dusk and the headline still
          clears contrast against it at every crop. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.42) 38%, rgba(0,0,0,0.12) 68%, rgba(0,0,0,0.38) 100%)',
        }}
        aria-hidden="true"
      />

      {/* The veil the page opens out of. */}
      <div data-veil className="pointer-events-none absolute inset-0 bg-ink" aria-hidden="true" />

      <div data-type className="shell-wide relative pb-16 sm:pb-20">
        <h1 className="t-display max-w-4xl text-pure">
          {threshold.headline.map((line) => (
            <span key={line} data-line className="block">
              {line === threshold.headline[threshold.headline.length - 1] ? (
                <em className="italic-display text-cove">{line}</em>
              ) : (
                line
              )}
            </span>
          ))}
        </h1>

        <p data-line className="t-sub mt-8 max-w-md text-fog">
          {threshold.body}
        </p>

        <div data-line className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4">
          <button type="button" onClick={onEnter} className="btn-flat focus-ring">
            {threshold.primary.label}
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
              aria-hidden="true"
              className="btn-flat-arrow shrink-0"
            >
              <path d="M2.5 8h10.5" />
              <path d="M9 4l4 4-4 4" />
            </svg>
          </button>

          <button type="button" onClick={onExplore} className="cta-footnote focus-ring">
            {threshold.secondary.label}
          </button>
        </div>
      </div>

      {/* The cue. A rule that draws down, in the drawing language
          the rest of the page uses. */}
      <div
        data-cue
        className="pointer-events-none absolute right-6 bottom-16 hidden flex-col items-center gap-3 sm:right-10 sm:flex"
        aria-hidden="true"
      >
        <span className="t-label text-[0.5rem] text-pure/50">Scroll</span>
        <span className="jaz-scroll-tick block h-16 w-px bg-white/25" />
      </div>
    </section>
  )
}
