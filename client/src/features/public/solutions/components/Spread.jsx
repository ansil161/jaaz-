import { solutions, solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { Rise } from '@/features/public/components/Motion'

/* ============================================================
   SOLUTIONS — THE SPREAD

   All nine solutions, one per screen, on a centre rule.

   THIS IS THE WHOLE CATALOGUE
   It was four spreads over a five-card grid for about an hour.
   ansil: "use the same design for the entire cards in the
   catalogue section, i dont want card change into new design" —
   one layout for all nine. The grid is gone, and so is the
   heading that used to introduce it.

   Nine screens of scroll is the cost, and it is worth naming,
   because a nine-screen /solutions is what the pinned lens was
   replaced FOR. The difference is that nothing here is pinned:
   every row is in normal document flow, a flick of the wheel
   clears one, and the browser's own find-in-page reaches the
   ninth. The lens made you scrub through eight stops to see the
   ninth; this only makes you scroll past it.

   THE CENTRE RULE IS THE LAYOUT, NOT A DECORATION
   One hairline down the middle of the section, running its whole
   height. Every row is built against it: the photograph runs
   from the rule to the outer edge of the SCREEN (not the page
   shell — this is the only full-bleed section on the page), and
   the type sits on the other side, set flush TO the rule rather
   than to the page gutter. Rows alternate which side they take,
   so the rule is crossed four times and reads as a spine.

   Setting the type toward the rule is the part that makes this
   not a two-column template: on an odd row the paragraph is
   right-aligned, which no card grid ever is, and the ragged edge
   lands against the photograph instead of out in the margin.

   THE NUMBER IS THE ONLY THING THAT GREW
   `n` is already on every card as 8px mono beside the tier. Here
   it is the display face at ~7vw in bone at 13% — large enough
   to be the row's landmark, quiet enough that the title still
   wins. It replaces the small numeral rather than joining it;
   two sizes of the same number in one block is a bug.

   NO <Figure>, NO <Drift>
   Same reason as the cards: Figure ends its entrance holding an
   inline square `clip-path`, which beats the frame's radius, and
   it writes the image transform from the scroll, which beats the
   hover. Drift is out for a different reason — it sets
   `will-change: transform`, and this frame clips (rounded
   `overflow-hidden`); a promoted clipping layer is the trap that
   renders a plate black until something unrelated repaints.
   <Rise> staggering the two halves is the whole entrance.
   ============================================================ */

function Arrow({ size = 15, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d="M2.5 8h10.5" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  )
}

export default function Spread() {
  const { lens } = solutionsIndex

  return (
    <section
      id="catalogue"
      className="relative bg-ink"
      style={{ '--rail': 'clamp(1.5rem, 4.4vw, 5.5rem)' }}
    >
      {/* The spine. Faded at both ends so it arrives and leaves
          rather than butting into the sections either side, and
          hidden below lg where there is no second column for it
          to divide. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 lg:block"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.11) 7%, rgba(255,255,255,0.11) 93%, transparent 100%)',
        }}
      />

      {solutions.map((s, i) => {
        const stop = lens.stops[s.slug]
        /* Odd rows (01, 03, 05...) open with the photograph on the
           left, so the page starts on a picture. Even rows put the
           type there and mirror everything: column order, text
           alignment, which corners are rounded, and the direction
           the footer reads. */
        const mirrored = i % 2 === 1

        return (
          <article key={s.slug} className="relative">
            <Link
              to={`/solutions/${s.slug}`}
              className="focus-ring group block"
              aria-label={`${s.title} — ${s.tier}`}
            >
              <Rise
                className="grid items-center gap-y-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-y-0 lg:py-28 xl:py-32"
                y={34}
                stagger={0.12}
                start="top 82%"
              >
                {/* ---- The photograph ----
                    Full bleed to the outer edge of the screen, a
                    rail's worth of clear air on the rule side, and
                    rounded on the rule side ONLY — a radius on an
                    edge that runs off the viewport is a corner
                    nobody can see cutting a photograph nobody
                    asked to be cut. Square everywhere below lg,
                    where it bleeds both ways. */}
                <div
                  className={
                    mirrored
                      ? 'lg:order-2 lg:pl-[var(--rail)]'
                      : 'lg:order-1 lg:pr-[var(--rail)]'
                  }
                >
                  <div
                    className={`plate-soft relative aspect-4/3 w-full overflow-hidden rounded-none ${
                      mirrored
                        ? 'lg:rounded-l-[clamp(1rem,1.7vw,1.6rem)]'
                        : 'lg:rounded-r-[clamp(1rem,1.7vw,1.6rem)]'
                    }`}
                  >
                    <img
                      src={s.hero}
                      alt={s.heroAlt}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className="plate absolute inset-0 [--plate-brightness:0.95] [--plate-contrast:1.04] [--plate-saturate:0.95] transition-[filter,transform] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:[--plate-brightness:1.06] group-hover:scale-[1.035]"
                      style={{ objectPosition: stop.focus }}
                    />
                  </div>
                </div>

                {/* ---- The type ----
                    Flush to the rule, ragged toward the outer
                    edge. `ms-auto` on a mirrored row pins the
                    block's right edge to the rail instead of
                    letting a max-width leave it stranded in the
                    middle of the half. */}
                <div
                  className={
                    mirrored
                      ? 'lg:order-1 lg:pr-[var(--rail)] lg:pl-0 lg:text-right'
                      : 'lg:order-2 lg:pl-[var(--rail)] lg:pr-0'
                  }
                >
                  <div
                    className={`px-[var(--gutter)] lg:max-w-[42ch] lg:px-0 ${
                      mirrored ? 'lg:ms-auto' : ''
                    }`}
                  >
                    <p
                      aria-hidden="true"
                      className="font-display text-[clamp(3.25rem,7vw,7.5rem)] leading-[0.8] tracking-[-0.03em] text-bone/[0.13] transition-colors duration-700 group-hover:text-bone/[0.2]"
                    >
                      {s.n}
                    </p>

                    <p className="t-label mt-5 text-mist sm:mt-7">{s.tier}</p>

                    <h2 className="t-heading mt-4 text-bone transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
                      {s.title}
                    </h2>

                    <p className="font-display italic-display mt-5 text-[clamp(1.15rem,1.6vw,1.55rem)] leading-[1.28] text-cove">
                      {s.statement}
                    </p>

                    <p className="t-body mt-5 text-fog">{s.sub}</p>

                    <div
                      className={`mt-9 flex items-end gap-6 border-t border-white/[0.1] pt-6 ${
                        mirrored ? 'lg:flex-row-reverse' : ''
                      }`}
                    >
                      <span className="grow">
                        <span className="t-label block text-mist">{stop.touches}</span>
                        <span className="t-num mt-2 block text-[0.74rem] text-bone">
                          {s.range}
                        </span>
                      </span>
                      <Arrow className="mb-1 text-mist transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-hover:text-cove" />
                    </div>
                  </div>
                </div>
              </Rise>
            </Link>
          </article>
        )
      })}
    </section>
  )
}
