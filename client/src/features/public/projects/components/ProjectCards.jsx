import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   THE WORK — alternating editorial rows.

   One project, one full-width row, two columns: the room on one
   side and what it is on the other, with the sides swapping every
   row so the eye zig-zags down the page instead of running down a
   single rail. Rows are separated by a hairline and nothing else.

   NOTHING PINS, NOTHING OVERLAPS, NOTHING IS EVER COVERED.
   This replaced a sticky stack, and the replacement is the whole
   point: every row is in normal document flow and fully visible
   for as long as it is on screen. There is no `position: sticky`
   in this file and there should not be one added — the layout's
   promise is that you can scroll back to any project and find it
   exactly where you left it, uncovered.

   THE ALTERNATION IS DOM-ORDER-INDEPENDENT, and that is what
   makes the mobile rule free. The media column is FIRST in the
   source for every row, so the single-column fallback below
   860px puts the photograph on top every time with no reordering
   at all. The swap is `order` on the two columns, applied only
   from 860px up, where there are two columns for it to swap.

   Reading the row numbers as the visitor does — the first row is
   row one — the odd rows run text-left / image-right and the even
   rows run image-left / text-right. In zero-based `i` that is
   `i % 2 === 0` for the odd ones, which is the one place this
   file is worth reading twice.

   THE ENTRANCE IS AN INTERSECTION OBSERVER, NOT A SCROLL
   TRIGGER. The rest of this site drives motion from GSAP's
   ScrollTrigger, and this deliberately does not: the row needs to
   fire exactly once, at a fixed visibility fraction, and never
   again — no scrub, no reverse, no re-measurement when the
   document changes height under a filter change. `unobserve` on
   first hit makes "once" structural rather than a flag someone
   can regress.

   WHY THE HOVER SCALE IS A PLAIN `<img>` AND NOT `<ProjectFrame>`
   `ProjectFrame` is this section's usual way in, and it is the
   wrong tool here. It drives the image's `scale` from the scroll
   and writes it as an inline transform, which beats any
   `group-hover:scale-*` class silently — the hover would simply
   do nothing, with no error to explain why. A row that scales its
   photograph on hover needs the transform channel free, so the
   plate is a plain image with the house `.plate` grading on it
   and no scroll-linked transform at all.
   ============================================================ */

/* 700ms, and the house's own entrance curve. */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const TRANSITION = `opacity 700ms ${EASE}, transform 700ms ${EASE}`

export default function ProjectCards({ items, resetKey }) {
  const root = useRef(null)
  const [shown, setShown] = useState(() => new Set())

  useEffect(() => {
    const el = root.current
    if (!el) return

    const rows = Array.from(el.querySelectorAll('[data-row]'))
    if (!rows.length) return

    /* Reduced motion gets the finished state, not a slower entrance.
       These rows carry the page's whole content; "less motion" must
       never mean "less content". */
    if (prefersReducedMotion()) {
      setShown(new Set(rows.map((_, i) => i)))
      return
    }

    setShown(new Set())

    const io = new IntersectionObserver(
      (entries) => {
        const arrived = []
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          arrived.push(Number(entry.target.dataset.index))
          /* Once. Dropping the row here is what guarantees it can never
             re-fire on the way back up — cheaper and far harder to break
             than checking a flag on every future callback. */
          io.unobserve(entry.target)
        })
        if (!arrived.length) return
        setShown((prev) => {
          const next = new Set(prev)
          arrived.forEach((i) => next.add(i))
          return next
        })
      },
      { threshold: 0.2 },
    )

    rows.forEach((row) => io.observe(row))
    return () => io.disconnect()
    /* Re-armed on a filter change: the rows are different elements with
       different indices, and the old observer was watching nodes React
       has already thrown away. */
  }, [resetKey])

  if (!items.length) return null

  const last = items.length - 1

  return (
    <div ref={root} className="shell-wide">
      {items.map((p, i) => {
        const on = shown.has(i)

        /* Written as two whole literal class strings rather than one
           interpolated string: Tailwind scans source text, so a class
           assembled at runtime is a class that was never generated. */
        const mediaOrder = i % 2 === 0 ? 'min-[860px]:order-2' : 'min-[860px]:order-1'
        const textOrder = i % 2 === 0 ? 'min-[860px]:order-1' : 'min-[860px]:order-2'

        return (
          <div key={p.slug}>
            <article
              data-row
              data-index={i}
              style={{
                opacity: on ? 1 : 0,
                transform: on ? 'translateY(0)' : 'translateY(28px)',
                transition: TRANSITION,
              }}
            >
              <div
                aria-label={`${p.flatTitle} — ${p.category}, ${p.location}`}
                className="group grid gap-y-8 py-[7vh] min-[860px]:grid-cols-2 min-[860px]:items-center min-[860px]:gap-x-14 lg:gap-x-20"
              >
                {/* ---- Media. First in the source on every row. ---- */}
                <div className={`${mediaOrder} aspect-[4/3] overflow-hidden rounded-2xl`}>
                  <img
                    src={p.hero.src}
                    srcSet={p.hero.srcSet}
                    sizes="(min-width: 860px) 46vw, 100vw"
                    alt={p.hero.alt}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    /* The only thing that moves on hover, and the transform
                       channel is free for it — see the note above. */
                    className="plate [--plate-brightness:0.86] [--plate-contrast:1.04] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>

                {/* ---- Text ---- */}
                <div className={textOrder}>
                  {/* WAS "001", outlined, at display size. The row's
                      ground note is now the room's own mark at the
                      same weight and the same size — a theatre, a
                      controller, a glass — so the largest quiet mark
                      in the column says what kind of room this is
                      instead of how far down the list it sits.

                      Outlined, not filled, and at a stroke that lands
                      near a pixel at this size: the numeral it
                      replaces was drawn with `-webkit-text-stroke: 1px`
                      and the mark has to sit at the same weight or
                      the rhythm of the column changes. */}
                  <Mark
                    name={p.icon}
                    strokeWidth={0.35}
                    className="numeral-index block"
                  />

                  <p className="t-label mt-4 text-cove/80">
                    {p.category}
                    <span className="mx-2.5 text-white/25">/</span>
                    <span className="text-fog">{p.location}</span>
                  </p>

                  <h3 className="t-heading mt-5 text-[clamp(1.75rem,3vw,2.75rem)] text-bone">
                    {p.flatTitle}
                  </h3>

                  {/* The hook, then the read. */}
                  <p className="t-sub mt-5 max-w-[44ch] text-bone">{p.summary}</p>
                  <p className="t-body mt-4 max-w-[52ch] text-mist">{p.overview[0]}</p>

                  <ul className="mt-7 flex flex-wrap gap-2" aria-label="Specification">
                    {p.spec.map(([term, value]) => (
                      <li
                        key={term}
                        className="flex items-baseline gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5"
                      >
                        <span className="t-label text-[0.54rem] text-cove/70">{term}</span>
                        <span className="t-num text-[0.7rem] text-fog">{value}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="t-num mt-7 text-xs text-ash">{p.year}</p>
                </div>
              </div>
            </article>

            {/* Between rows only. A rule under the last row would be
                closing a list that has already ended. */}
            {i < last && <div className="h-px w-full bg-white/10" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}
