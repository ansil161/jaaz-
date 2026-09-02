import Overture from '@/features/public/solutions/components/Overture'
import Spread from '@/features/public/solutions/components/Spread'
import { solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { Lines, Rise } from '@/features/public/components/Motion'

/* ============================================================
   SOLUTIONS — THE CATALOGUE

   The opening, then all nine solutions as spreads, then the
   answer for someone none of the nine fits.

   THIS FILE IS NOW THE PAGE'S RUNNING ORDER, NOT A LAYOUT
   The card grid that used to live here is gone. ansil asked for
   ONE design across the whole catalogue — the split-rule spread
   built for 01-04 — so <Spread> owns all nine and this component
   owns only what sits either side of them. The card markup was
   deleted rather than parked: it is in git, and a second dormant
   layout in this file is the thing that makes the next change
   ambiguous.

   Every fact the card carried survives at spread scale — the
   numeral, tier, title, the italic `statement`, `sub`, what it
   TOUCHES and what band it costs in. That list is the point of
   the catalogue: a visitor arrives asking which of the nine is
   theirs, and those are what they actually choose on. Nine
   identical shells around nine different facts is a catalogue;
   nine identical shells around nine restatements of one fact is
   the thing worth refusing.

   THE OPENING CARRIES NO PHOTOGRAPH
   Deliberately. There are nine below it, and a tenth at the top
   would be the only one on the page that is not a solution —
   competing with the spreads it is supposed to introduce.
   <Overture> is type on a black stage and one sheet of paper for
   the same reason: this page's picture is the nine.
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
  const { meta, statement, overture, index } = solutionsIndex
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

      {/* ---- All nine, a screen each ---- */}
      <Spread />

      {/* ---- The answer for someone none of the nine fits ---- */}
      <section className="relative bg-ink pt-8 pb-24 sm:pb-32">
        <div className="shell-wide">
          <Rise
            className="flex flex-col gap-6 border-t border-white/[0.1] pt-12 sm:flex-row sm:items-center sm:justify-between"
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
