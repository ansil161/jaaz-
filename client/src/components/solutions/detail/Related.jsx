import { relatedTo, solutionsIndex } from '../../../data/solutions'
import { Link } from '../../chrome/PageTransition'
import { Lines, Rise } from '../../ui/Motion'

/* ============================================================
   ONE SOLUTION — THE OTHER ONES

   Three related solutions, and each row carries the same three
   things the catalogue itself sorts on: what it TOUCHES, what
   band it costs in, and where it sits on the barrel.

   `touches` is the load-bearing one and it comes from the
   lens's own data — "inside the walls", "everything outside",
   "where you actually sit". A list of three more product names
   asks the reader to remember what each one was. A list of
   three scopes lets them choose without opening anything.

   It closes the page instead of a "next solution" link,
   because these are not chapters in an order — they are nine
   parallel answers, and the useful thing at the bottom of one
   is the two or three nearest to it, not whichever happens to
   be numbered next.
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

export default function Related({ solution: s }) {
  const others = relatedTo(s)
  if (!others.length) return null

  const { stops } = solutionsIndex.lens

  return (
    <section className="relative bg-ink py-24 sm:py-32">
      <div className="shell-wide">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Lines as="h2" className="t-chapter max-w-[16ch] text-bone">
            Nearest to this one.
          </Lines>
          <Link
            to="/solutions"
            className="focus-ring t-label inline-flex shrink-0 items-center gap-3 text-mist transition-colors duration-500 hover:text-cove"
          >
            All nine
            <Arrow size={12} />
          </Link>
        </div>

        <Rise as="ul" selector="[data-row]" y={20} stagger={0.07} className="hover-dim mt-16">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                data-row
                to={`/solutions/${other.slug}`}
                className="focus-ring group flex flex-col gap-3 border-t border-white/[0.09] py-7 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
              >
                <span className="flex min-w-0 items-baseline gap-6 sm:gap-9">
                  <span className="t-num w-7 shrink-0 text-xs text-cove">{other.n}</span>
                  <span className="min-w-0">
                    <span className="t-heading block text-[clamp(1.5rem,2.4vw,2.4rem)] text-bone transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">
                      {other.title}
                    </span>
                    <span className="t-label mt-3 block text-mist">
                      {stops[other.slug]?.touches}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-6 pl-13 sm:pl-0">
                  <span className="t-num text-[0.72rem] text-mist">{other.range}</span>
                  <Arrow
                    size={15}
                    className="text-mist transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-hover:text-cove"
                  />
                </span>
              </Link>
            </li>
          ))}
        </Rise>
      </div>
    </section>
  )
}
