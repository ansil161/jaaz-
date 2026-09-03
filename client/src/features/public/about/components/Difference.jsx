import { difference } from '@/features/public/data/about'
import { Mark } from '@/features/public/components/Mark'
import { Lines } from '@/features/public/components/Motion'
import { SectionLabel } from '@/features/public/components/Editorial'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   ABOUT 02 — THE JAAZ DIFFERENCE

   The signature section of the page, and the only one that makes
   an argument by SUBTRACTION.

   Each row holds two versions of the same job. The conventional
   word is set in outline — present, legible, but hollow — and a
   rule strikes through it as it arrives. The JAAZ word is solid,
   and wipes up out of the mask underneath.

   The whole point is that it is not a comparison table. Nothing
   is scored, nothing is ticked. One word is struck out and a
   better one takes its place, four times, and the argument is
   finished before you have read a single line of body copy.
   ============================================================ */

export default function Difference() {
  const root = useGsapScope((el) => {
    const rows = gsap.utils.toArray(el.querySelectorAll('[data-row]'))

    if (prefersReducedMotion()) {
      rows.forEach((row) => {
        gsap.set(row.querySelectorAll('[data-from], [data-to], [data-body]'), { autoAlpha: 1 })
        gsap.set(row.querySelector('[data-strike]'), { scaleX: 1 })
      })
      return
    }

    rows.forEach((row) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: row, start: 'top 74%', once: true },
      })

      tl.fromTo(
        row.querySelector('[data-from]'),
        { autoAlpha: 0, x: -18 },
        { autoAlpha: 1, x: 0, duration: 1 },
      )
        /* The strike lands before the replacement appears — the old
           idea has to be crossed out before the new one is offered. */
        .fromTo(
          row.querySelector('[data-strike]'),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.72, ease: 'jaz-io' },
          0.42,
        )
        .fromTo(
          row.querySelector('[data-to]'),
          { yPercent: 112 },
          { yPercent: 0, duration: 1.1 },
          0.72,
        )
        .fromTo(
          row.querySelector('[data-body]'),
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 1 },
          0.9,
        )

      /* Scroll-linked counter-drift, so a row that has finished its
         entrance is still moving relative to the one above it. */
      gsap.fromTo(
        row.querySelector('[data-body]'),
        { yPercent: -3 },
        {
          yPercent: 3,
          ease: 'none',
          scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  }, [])

  return (
    <section
      ref={root}
      id="difference"
      className="relative bg-ink py-28 sm:py-36"
    >
      <div className="shell-wide">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* --- The claim. Held in place while the proof scrolls. --- */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <SectionLabel>{difference.label}</SectionLabel>

              <Lines as="h2" className="t-heading mt-10 text-pure" stagger={0.11}>
                {difference.heading.map((line, i) => (
                  <span key={line} className="block">
                    {i === 1 ? <em className="italic-display">{line}</em> : line}
                  </span>
                ))}
              </Lines>

              <Lines as="p" className="t-body mt-7 max-w-sm text-mist">
                {difference.intro}
              </Lines>
            </div>
          </div>

          {/* --- The four swaps --- */}
          <div className="lg:col-span-7 lg:col-start-6">
            <ul className="space-y-16 sm:space-y-20">
              {difference.pairs.map((pair) => (
                <li
                  key={pair.to}
                  data-row
                  className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0"
                >
                  {/* The mark, where the ordinal used to be. A count
                      told you this was the third of four swaps, which
                      is the one thing the row already says by sitting
                      third. The mark says what is being swapped IN —
                      a body in a chair, a room as a volume, a pair of
                      dividers, two rings that do not come apart — so
                      the argument is made
                      once in the glyph before it is made again in the
                      word underneath.

                      `block` matters: an inline-block wrapper after an
                      inline element puts the mark ON the same line as
                      the word it labels, and the two collide. */}
                  <Mark name={pair.icon} size={26} className="block text-ash" />

                  {/* The word being replaced. Outlined, then struck. */}
                  <div className="relative mt-4 inline-block">
                    <span
                      data-from
                      className="font-display block text-[clamp(2.1rem,5.4vw,4.25rem)] leading-[1.04] text-transparent"
                      style={{
                        visibility: 'hidden',
                        WebkitTextStroke: '1px rgba(255,255,255,0.34)',
                      }}
                    >
                      {pair.from}
                    </span>
                    <span
                      data-strike
                      aria-hidden="true"
                      className="absolute top-1/2 left-0 h-px w-full origin-left bg-pure/45"
                    />
                  </div>

                  {/* The word that replaces it. */}
                  <div className="mask-line mt-1">
                    <span
                      data-to
                      className="font-display block text-[clamp(2.4rem,6.4vw,5.25rem)] leading-[1.02] text-pure"
                    >
                      {pair.to}
                    </span>
                  </div>

                  <p
                    data-body
                    className="t-body mt-6 max-w-lg text-mist will-change-transform"
                    style={{ visibility: 'hidden' }}
                  >
                    {pair.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
