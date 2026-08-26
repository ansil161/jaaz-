import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   ARCHITECTURAL GRID

   The Solutions pages are the one part of the site arguing from
   specification — reverberation times, isolation targets, IP
   ratings, motor counts. This is the visual argument for the
   same thing: a fine blueprint grid sitting behind the content,
   with the corner tick marks and coordinate labels of a real
   drawing sheet, not a repeating pattern chosen for texture.

   It drifts at a fraction of scroll speed — much slower than the
   content in front of it — so the page reads as a drawing you
   are moving OVER rather than a background that scrolls with
   you. `will-change: transform` plus one `fromTo` per axis is
   the same technique `<Drift>` uses elsewhere; this is its own
   component because it drives four separate correlated layers
   (grid, verticals, ticks, labels) off one ScrollTrigger rather
   than one element off its own.
   ============================================================ */

const COLS = [12, 28, 50, 72, 88]

export default function ArchitecturalGrid({ className = '', dense = false }) {
  const root = useGsapScope((el) => {
    if (prefersReducedMotion()) return

    gsap.to(el.querySelector('[data-grid-fine]'), {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
    gsap.to(el.querySelector('[data-grid-marks]'), {
      yPercent: -4,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    })
  }, [])

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Fine grid — the drawing sheet. */}
      <div
        data-grid-fine
        className="absolute inset-x-0 will-change-transform"
        style={{
          top: '-8%',
          height: '116%',
          opacity: dense ? 0.07 : 0.045,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: '5.2vw 5.2vw',
        }}
      />

      {/* Column guides + corner ticks + coordinate labels. */}
      <div data-grid-marks className="absolute inset-0 will-change-transform">
        {COLS.map((pct) => (
          <div
            key={pct}
            className="absolute inset-y-0 w-px bg-white/[0.07]"
            style={{ left: `${pct}%` }}
          />
        ))}

        {[
          { top: 0, left: 0 },
          { top: 0, right: 0 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute h-6 w-6 border-white/15"
            style={{
              ...pos,
              borderTopWidth: pos.top === 0 ? '1px' : 0,
              borderLeftWidth: pos.left === 0 ? '1px' : 0,
              borderRightWidth: pos.right === 0 ? '1px' : 0,
              margin: '2.5rem',
            }}
          />
        ))}

        <span
          className="t-num absolute top-10 left-10 text-[0.65rem] tracking-[0.2em] text-mist/50"
          style={{ writingMode: 'vertical-rl' }}
        >
          JAAZ / SPEC.01
        </span>
        <span className="t-num absolute right-10 bottom-10 text-[0.65rem] tracking-[0.2em] text-mist/50">
          SCALE — N.T.S.
        </span>
      </div>
    </div>
  )
}
