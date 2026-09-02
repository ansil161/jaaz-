import Overture from '@/features/public/solutions/components/Overture'
import { solutions, solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { Lines, Rise } from '@/features/public/components/Motion'

/* ============================================================
   SOLUTIONS — THE CATALOGUE

   Nine cards. A photograph and what it is, all nine visible in
   about two screens, every one of them a way into its own page.

   WHY CARDS AND NOT THE LENS
   The lens that stood here held one solution on screen at a
   time and made you scroll nine screens to see the ninth. It
   was the better ARGUMENT and the worse CATALOGUE, and this
   page's job is the catalogue: a visitor arrives asking which
   of the nine is theirs, and the fastest honest answer is all
   nine side by side with their scope and their budget band
   showing.

   WHAT KEEPS IT FROM BEING A TEMPLATE GRID
   A card is a lazy container when the card is a box with an
   icon, a heading and a paragraph in it. These are not that.
   There is no box: the card IS the photograph, in the house's
   `.plate-soft` frame — the same "an object you could pick up"
   treatment the About page uses — with type set beneath it on
   open ink. Nothing is outlined, nothing is filled, and the
   only rule on a card is the hairline above its footer.

   And every card carries three things that differ per
   solution and that a visitor actually chooses on: what it
   TOUCHES (a room, one wall, inside the walls, a chair), what
   band it costs in, and one line of the best writing in the
   file. Nine identical shells around nine different facts is a
   catalogue. Nine identical shells around nine restatements of
   the same fact is the thing worth refusing.

   THE OPENING CARRIES NO PHOTOGRAPH
   Deliberately. There are nine below it, and a tenth at the top
   would be the only one on the page that is not a solution —
   competing with the grid it is supposed to introduce.
   <Overture> is type on a black stage and one sheet of paper for
   the same reason: this page's picture is the grid.
   ============================================================ */

function Arrow({ size = 14, className = '' }) {
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

export default function Catalogue() {
  const { meta, statement, overture, lens, index } = solutionsIndex
  const { coda } = overture

  return (
    <>
      {/* ---- The opening ----
          Three statements, pinned and scrubbed, the third of them on
          paper. See <Overture> for why it replaced the headline block
          that used to stand here. ---- */}
      <Overture />

      {/* ---- What the pin releases into ----
          The rest of that opening sentence, and the two lines of the
          hero the overture did not take. It is deliberately quiet and
          deliberately NOT centred: the stage above it is the only
          thing on this page set on the axis, and the moment a second
          block joins it there, the first one stops being a title card
          and starts being a layout. This is back on the left rule,
          which is where the page proper begins. ---- */}
      <section className="relative bg-ink pt-24 pb-20 sm:pt-32 sm:pb-24">
        <div className="shell-wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <Lines as="p" className="t-sub max-w-[42ch] text-fog lg:col-span-5">
              {coda}
            </Lines>
            <Lines as="p" className="t-body max-w-[50ch] text-mist lg:col-span-5 lg:col-start-7">
              {statement}
            </Lines>
          </div>

          <p className="t-label mt-14 text-mist">{meta}</p>
        </div>
      </section>

      {/* ---- The nine ---- */}
      <section id="catalogue" className="relative bg-ink pb-24 sm:pb-32">
        <div className="shell-wide">
          <Rise
            as="ul"
            selector="[data-card]"
            y={30}
            stagger={0.07}
            start="top 88%"
            className="grid gap-x-8 gap-y-16 sm:grid-cols-2 sm:gap-y-20 xl:grid-cols-3"
          >
            {solutions.map((s) => {
              const stop = lens.stops[s.slug]

              return (
                <li key={s.slug} data-card className="flex">
                  <Link
                    to={`/solutions/${s.slug}`}
                    className="focus-ring group flex w-full flex-col"
                  >
                    {/* A PLAIN PLATE, not <Figure>, and both halves of
                        that are deliberate.

                        Figure ends its entrance holding
                        `clip-path: inset(0%)` inline, and a square clip
                        on a rounded box wins: `.plate-soft`'s 23px
                        corners were being cut back to right angles the
                        moment each card arrived. It also writes the
                        image's transform from the scroll, which would
                        silently beat any `group-hover:scale-*` class
                        with nothing to explain why.

                        And the card already HAS an entrance — <Rise>
                        fades and lifts it. A second one inside it is
                        two effects doing one job.

                        So: the frame owns the radius and the clipping,
                        the image owns the hover. `--plate-brightness`
                        is a registered custom property, so
                        `transition: filter` is a real interpolation and
                        not a jump. */}
                    <div className="plate-soft relative aspect-4/3 w-full overflow-hidden">
                      <img
                        src={s.hero}
                        alt={s.heroAlt}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        className="plate absolute inset-0 [--plate-brightness:0.92] [--plate-contrast:1.05] [--plate-saturate:0.94] transition-[filter,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:[--plate-brightness:1.08] group-hover:scale-[1.04]"
                        style={{ objectPosition: stop.focus }}
                      />
                    </div>

                    <div className="mt-7 flex items-baseline gap-5">
                      <span className="t-num text-[0.7rem] text-cove">{s.n}</span>
                      <span className="t-label text-mist">{s.tier}</span>
                    </div>

                    <h2 className="t-heading mt-4 text-[clamp(1.35rem,1.9vw,2.05rem)] text-bone transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
                      {s.title}
                    </h2>

                    <p className="font-display italic-display mt-4 max-w-[28ch] text-[1.05rem] leading-[1.3] text-cove">
                      {s.statement}
                    </p>

                    <p className="t-body mt-4 line-clamp-3 text-fog">{s.sub}</p>

                    {/* Pushed to the bottom of whichever card is tallest
                        in the row, so the footers line up across the grid
                        even though the titles above them do not. */}
                    <div className="mt-auto flex items-end justify-between gap-6 border-t border-white/[0.1] pt-6">
                      <span>
                        <span className="t-label block text-mist">{stop.touches}</span>
                        <span className="t-num mt-2 block text-[0.74rem] text-bone">
                          {s.range}
                        </span>
                      </span>
                      <Arrow
                        size={15}
                        className="mb-1 text-mist transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-hover:text-cove"
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </Rise>

          {/* ---- The answer for someone none of the nine fits ---- */}
          <Rise
            className="mt-24 flex flex-col gap-6 border-t border-white/[0.1] pt-12 sm:mt-32 sm:flex-row sm:items-center sm:justify-between"
            y={18}
            stagger={0.08}
          >
            <p className="t-sub max-w-[36ch] text-fog">{index.fallback}</p>
            <Link
              to="/contact"
              className="focus-ring t-label inline-flex shrink-0 items-center gap-3 text-bone transition-colors duration-500 hover:text-cove"
            >
              {index.fallbackAction}
              <Arrow size={12} />
            </Link>
          </Rise>
        </div>
      </section>
    </>
  )
}
