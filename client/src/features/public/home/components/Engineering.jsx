import { useState } from 'react'
import { engineering } from '@/features/public/data/site'
import { Lines } from '@/features/public/components/Motion'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   CH. 04 — ENGINEERED. NOT ASSEMBLED.

   Six disciplines, and the page's only section that argues
   entirely in figures.

   ------------------------------------------------------------
   WHY THERE IS NO DIAGRAM IN HERE

   The obvious build for this section is a self-drawing speaker
   plan and an animated frequency curve. That register — hairline
   rules, 11px monospace annotation, a drop-line from a number to
   the thing it labels — has already been ruled out on this site
   once, and for a good reason: it turns a company that sells
   rooms people sit in into a company that sells a dashboard.

   So the drawing IS the typography. Each discipline gets ONE
   figure set in the display face at four times body size, and
   the figure carries the proof that a diagram would have had to
   spend a hundred lines of SVG on. It also survives a phone,
   which no six-part technical drawing does.

   ------------------------------------------------------------
   TWO READING PATHS, AND THE SECOND ONE IS THE ARGUMENT

   Read across a row and you get a discipline. Read only the
   `decides` lines straight down the column — they are the one
   thing in the section set in warm italic, so the eye can — and
   they chain:

     picture -> front row -> what the walls absorb -> wall depth
     -> the plan -> the wiring -> the only step that can prove it

   That chain is the difference between the two halves of the
   headline. An assembled room is six purchases. An engineered
   one is six decisions that cannot be taken in any other order.

   ------------------------------------------------------------
   THE LIGHT

   One warm pool sits behind whichever figure is in the reading
   band, and nothing else changes state — no dimming of the rows
   you are not on, because dimming body copy to signal focus
   makes the section harder to read in exchange for a lighting
   effect. `data-live` is a CSS-only transition on an ordinary
   opacity, so the six ScrollTriggers that set it are cheap and
   the fallback is simply an unlit column.
   ============================================================ */

export default function Engineering() {
  /* Which row is in the reading band. Six state changes over the
     whole section — cheap enough to live in React, which is the
     same call <Craft> makes for the same reason. */
  const [live, setLive] = useState(0)

  const root = useGsapScope((el) => {
    const rows = gsap.utils.toArray(el.querySelectorAll('[data-eng-row]'))

    rows.forEach((row, i) => {
      ScrollTrigger.create({
        trigger: row,
        start: 'top 64%',
        end: 'bottom 64%',
        onToggle: (self) => self.isActive && setLive(i),
      })
    })

    if (prefersReducedMotion()) return

    /* The figure arrives warm and STAYS warm. `once`, not a scrub:
       a column of numerals that cools down again on the way back up
       is a column that never settles, and the point of the section
       is that these are settled. */
    rows.forEach((row) => {
      const figure = row.querySelector('[data-eng-figure]')
      gsap.from(figure, {
        autoAlpha: 0,
        /* Travels a long way for a small element. The figure is the
           heaviest thing in the row, so it needs the longest arrival
           or it reads as having simply appeared. */
        y: 44,
        duration: 1.4,
        ease: 'jaz',
        scrollTrigger: { trigger: row, start: 'top 84%', once: true },
      })
    })
  }, [])

  return (
    <section
      ref={root}
      id={engineering.id}
      className="relative bg-ink py-24 sm:py-32 lg:py-40"
    >
      <div className="shell-wide">
        {/* ---- The claim ---- */}
        <header className="lg:grid lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <span className="t-label flex items-center gap-3 text-fog">
              {engineering.chapter}
              <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
              <span className="text-mist">{engineering.label}</span>
            </span>

            <Lines
              as="h2"
              className="t-display mt-8 max-w-[11ch] leading-[1.02] text-bone lg:mt-10"
              stagger={0.11}
            >
              {engineering.heading.map((line, i) => (
                <span key={line} className="block">
                  {/* The page's universal pivot — one word of every
                      display headline turns warm. Here it is the half
                      of the headline the section spends its length
                      earning. */}
                  {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
                </span>
              ))}
            </Lines>
          </div>

          <Lines
            as="p"
            className="t-body mt-8 max-w-[46ch] text-fog lg:col-span-5 lg:mt-0 lg:self-end lg:pb-[0.5em]"
          >
            {engineering.intro}
          </Lines>
        </header>

        {/* ---- The six ----
            An ordered list, because the order is load-bearing: each
            row's closing line names what the next one has to solve.
            No rules between rows — the space does that work, and a
            stack of hairlines is the exact look this section is
            avoiding. */}
        <ol className="mt-16 sm:mt-20 lg:mt-24">
          {engineering.items.map((item, i) => (
            <li
              key={item.n}
              data-eng-row
              data-live={live === i ? 'true' : 'false'}
              className="eng-row grid grid-cols-1 gap-y-6 py-10 sm:py-12 lg:grid-cols-12 lg:gap-x-10 lg:py-14"
            >
              {/* THE FIGURE. Its own column, left, so the six of them
                  form a single vertical run of numerals down the
                  page — which is what makes the section read as a
                  ledger rather than as six paragraphs with numbers
                  in front of them. */}
              <div className="relative lg:col-span-4">
                {/* The pool of warm light, behind the figure and
                    nothing else. A radial gradient rather than a box,
                    so it has no edge to notice.

                    It is NOT given a negative z-index: this section
                    establishes no stacking context of its own, so a
                    negative descendant would resolve against the root
                    and paint underneath the page's black background —
                    which is a light that simply never appears. The
                    type is lifted over it instead. */}
                <span aria-hidden="true" className="eng-pool" />

                <span className="relative z-10 block">
                  <span data-eng-figure className="eng-figure block text-cove">
                    {item.figure}
                  </span>
                  <span className="mt-3 block text-[0.8125rem] leading-[1.5] text-mist">
                    {item.note}
                  </span>
                </span>
              </div>

              <div className="lg:col-span-7 lg:col-start-6">
                <h3 className="t-heading text-pure">{item.name}</h3>

                <p className="t-body mt-4 max-w-[52ch] text-fog">{item.body}</p>

                {/* THE CHAIN. The only warm italic in the row, so the
                    six of them can be read as a column on their own —
                    see the header. */}
                <p className="eng-decides mt-6 max-w-[46ch] text-cove">
                  <em className="italic-display">{item.decides}</em>
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* ---- The close ---- */}
        <Lines
          as="p"
          className="t-display mt-16 max-w-[16ch] leading-[1.02] text-bone sm:mt-20 lg:mt-24"
          stagger={0.1}
        >
          {engineering.closing.pre}
          <em className="italic-display text-cove">{engineering.closing.turn}</em>
          {engineering.closing.post}
        </Lines>
      </div>
    </section>
  )
}
