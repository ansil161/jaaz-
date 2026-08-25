import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../../lib/useGsap'
import { Link } from '../chrome/PageTransition'

/* ============================================================
   INFO PANEL — an architectural annotation, not a product card

   The brief is explicit about what this must NOT feel like, and
   the difference is mostly what has been left out: no image, no
   price, no rating, no "add", no rounded card floating on a
   shadow. What is left is a title, one line of intent, a
   specification list and one quiet route onward — the anatomy of
   a drawing note.

   WHY IT DOCKS RATHER THAN FLOATS

   A panel pinned beside its hotspot has to solve collision at
   every viewport: the ceiling spot sits at 11% from the top and
   the seating spot at 84%, so a floating panel would fall off the
   plate at both ends and need clamping logic that inevitably
   detaches it from its point anyway. Docking to one edge is
   honest about that — the active point stays lit and expanded, so
   the connection is carried by STATE rather than by proximity,
   and the panel always occupies the same considered position.

   The specification list is where the restraint is easiest to
   lose. Each line is a fact with a unit or a material in it. No
   line is an adjective.
   ============================================================ */

export default function InfoPanel({ spot, onClose }) {
  const root = useRef(null)

  /* Enter on mount and on every change of spot. Keyed by id at the
     call site so switching hotspots remounts and replays rather
     than swapping the text underneath a static panel. */
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(el, { autoAlpha: 0, y: 14, duration: 0.62, ease: 'power3.out' })
      gsap.from(el.querySelectorAll('[data-line]'), {
        autoAlpha: 0,
        y: 8,
        duration: 0.5,
        stagger: 0.045,
        delay: 0.1,
        ease: 'power3.out',
      })
    }, el)
    return () => ctx.revert()
  }, [spot.id])

  /* Escape closes. A panel that can only be dismissed by finding
     the same small point again is a trap. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { title, lede, specs, cta } = spot.panel

  return (
    <aside
      ref={root}
      aria-label={title}
      className="pointer-events-auto w-full max-w-sm border border-white/10 bg-ink-4/92 p-7 backdrop-blur-md sm:p-8"
    >
      <div className="flex items-start justify-between gap-6">
        <h3 data-line className="t-heading text-[1.6rem] leading-tight text-pure">
          {title}
        </h3>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring -m-2 shrink-0 p-2 text-mist transition-colors duration-300 hover:text-pure"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <p data-line className="italic-display mt-3 text-[0.95rem] text-cove">
        {lede}
      </p>

      <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6">
        {specs.map((line) => (
          <li
            key={line}
            data-line
            className="t-body flex gap-3 text-[0.9rem] leading-snug text-fog"
          >
            {/* A rule rather than a bullet: this is a schedule of
                facts, and a disc would make it a shopping list. */}
            <span className="mt-2.5 h-px w-3 shrink-0 bg-white/25" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>

      {cta && (
        <Link
          to={cta.to}
          data-line
          className="link-underline t-label focus-ring mt-7 inline-flex items-center gap-2 text-[0.6rem] text-pure"
        >
          {cta.label}
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M2.5 8h10.5" />
            <path d="M9 4l4 4-4 4" />
          </svg>
        </Link>
      )}
    </aside>
  )
}
