import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   EXPERIENCE CONTENT — the numeral, the name, the line

   TWO STATES, NOT ONE
   `night` is what the visitor just picked; `shown` is what this
   column is currently displaying. They are deliberately allowed to
   disagree for about a third of a second, because the transition
   has an OUT beat before the swap — and you cannot animate text
   out if React has already replaced it. The rail highlights the
   new choice immediately (the click must feel answered) while the
   copy finishes leaving before it arrives.

   The old line exits UPWARD and the new one enters from BELOW.
   Not decoration: opposite directions are what make the change
   read as one thing replacing another rather than as a crossfade,
   which at this size looks like a rendering fault.

   THE NAME IS MONO, NOT SERIF
   Every other section on this site sets its subject in the display
   serif. Here the serif is spent entirely on the fixed heading,
   and the changing name is small, uppercase and letterspaced —
   which is what makes the numeral the loudest thing in the column
   and the section read as an instrument rather than an article.

   WHY THIS RETURNS A FRAGMENT AND NOT A COLUMN
   The two compositions disagree about where the copy goes. On
   desktop it sits under the name in the left column; on mobile it
   goes UNDER THE VIDEO, which lives in a different part of the
   tree. A wrapper div makes that impossible without rendering the
   copy twice and keeping two transitions in sync. So the blocks
   are returned loose, as direct items of the section's own grid,
   and each places itself at both breakpoints. The animation scope
   comes in as `scopeRef` since there is no root of its own.
   ============================================================ */

/**
 * `onShown` reports the moment the column has actually finished
 * swapping. The tag on the plate needs it: driven straight from the
 * selection it renamed itself the instant you clicked, so for a third
 * of a second it captioned the OUTGOING picture with the incoming
 * night's name. It has to follow the swap, not lead it, and this
 * component is the only thing that knows when that happens.
 */
export default function ExperienceContent({ night, total, scopeRef, onShown }) {
  const [shown, setShown] = useState(night)
  const mounted = useRef(false)
  const reduced = prefersReducedMotion()

  const swaps = () => scopeRef.current?.querySelectorAll('[data-swap]')

  /* ---- Leave, then swap ---- */
  useEffect(() => {
    if (shown.key === night.key) return

    const targets = swaps()
    if (reduced || !targets?.length) {
      setShown(night)
      return
    }

    const tl = gsap.to(targets, {
      yPercent: -110,
      autoAlpha: 0,
      duration: 0.3,
      stagger: 0.045,
      ease: 'power2.in',
      onComplete: () => setShown(night),
    })

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night, reduced])

  /* ---- Arrive ---- */
  useEffect(() => {
    onShown?.(shown)

    const targets = swaps()
    if (!targets?.length) return

    if (reduced || !mounted.current) {
      mounted.current = true
      gsap.set(targets, { yPercent: 0, autoAlpha: 1 })
      return
    }

    const tl = gsap.fromTo(
      targets,
      { yPercent: 110, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.62, stagger: 0.055, ease: 'jaz' },
    )
    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, reduced])

  return (
    <>
      <div className="order-3 lg:order-none lg:col-span-6 lg:col-start-1 lg:row-start-2 lg:self-end">
        {/* The hollow numeral, and the denominator it is measured
            against. Baseline-aligned so the small "/ 06" sits on the
            numeral's foot rather than floating beside its middle. */}
        <div className="flex items-baseline gap-4">
          {/* Extra vertical padding on the mask: `.mask-line`'s 0.08em
              is cut for solid type, and this glyph is a CONTOUR whose
              stroke sits proud of the box the mask measures. */}
          <span className="block overflow-hidden py-[0.14em]">
            <span data-swap className="numeral-hollow block">
              {shown.n}
            </span>
          </span>
          <span className="t-num text-sm text-ash">/ {total}</span>
        </div>

        <h3 className="t-label mt-6 text-[0.82rem] text-pure">
          <span className="mask-line">
            <span data-swap className="block">
              {shown.title}
            </span>
          </span>
        </h3>
      </div>

      {/* The line. Under the video on a phone, under the name on a
          desktop — see the note above on why this is not nested. */}
      <p className="order-5 t-body mt-1 max-w-[34ch] text-mist lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-3 lg:mt-0 lg:self-start">
        <span className="mask-line">
          <span data-swap className="block">
            {shown.copy}
          </span>
        </span>
      </p>

      {/* Announced on change; the visual swap above is decorative
          motion a screen reader never receives. One live region for
          the whole section — the rail already reports position. */}
      <span className="sr-only" aria-live="polite">
        {`${shown.n} of ${total}. ${shown.title}. ${shown.copy}`}
      </span>
    </>
  )
}
