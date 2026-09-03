import { solutions, solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { Lines, Rise } from '@/features/public/components/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   SOLUTIONS — THE CLOSE

   After nine chapters, the page owes the visitor one screen
   where all nine are in the same place at the same size. Not a
   table — a table needs rules, and this page has none. Nine
   lines of large type with a lot of air, and the cursor doing
   the separating: hovering one entry dims the other eight, so
   the row you are reading is the only one at full strength.
   Light instead of geometry.

   It is also the page's only piece of true navigation redundancy,
   and it earns that: someone who has scrolled thirteen screens to
   the bottom should not have to scroll back up to reach the room
   they liked.

   Everything stays on ink. The old build inverted to paper here;
   this one does not, because the brief asked for a single deep
   near-black world and a hard flip to off-white in the last
   screen would undo it.
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

export default function SolutionsIndex() {
  const { statement, index, lens } = solutionsIndex

  /* The list runs its own entrance rather than going through <Rise>.
     Not because Rise is broken — it is not — but because `fromTo` states
     both ends of the reveal in one place, next to the markup that ships
     the rows hidden. `Rise` uses `gsap.from`, which infers the end state
     from whatever the element happens to compute to at the moment the
     tween is built; with `.hover-dim` also writing `opacity` on these
     same rows, an inferred end value is one stylesheet edit away from
     being wrong. Everything else on the page uses the same explicit
     form.

     THE TWEEN TARGET IS THE LINK, NOT THE ROW. `.hover-dim > *` is a
     stylesheet rule, and an element's own style attribute always beats
     one — so the moment this entrance finished and left `opacity: 1`
     inline on the <li>, the dim could never apply again and the whole
     effect was silently dead. Animating a child leaves the row's own
     opacity to CSS, and the two multiply: the row dims to 0.4 while
     the link inside it stays at 1. */
  const list = useGsapScope((el) => {
    const rows = gsap.utils.toArray(el.querySelectorAll('[data-row]'))
    if (!rows.length) return

    if (prefersReducedMotion()) {
      gsap.set(rows, { autoAlpha: 1, y: 0 })
      return
    }

    gsap.fromTo(
      rows,
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.05,
        ease: 'jaz',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    )
  }, [])

  return (
    <section id="catalogue" className="relative overflow-hidden bg-ink py-28 sm:py-36">
      {/* The light lifts one last time before the close. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 46% at 50% 0%, rgba(201, 173, 124, 0.09) 0%, transparent 64%)',
        }}
      />

      <div className="shell-wide relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Lines as="h2" className="t-display text-bone lg:col-span-6" stagger={0.1}>
            {index.heading.map((line, i) => (
              <span key={line} className="block">
                {i === index.heading.length - 1 ? (
                  <em className="italic-display text-cove">{line}</em>
                ) : (
                  line
                )}
              </span>
            ))}
          </Lines>

          <Lines as="p" className="t-body max-w-[46ch] text-fog lg:col-span-5 lg:col-start-8 lg:pb-3">
            {statement}
          </Lines>
        </div>

        <ul ref={list} className="hover-dim mt-20 sm:mt-28">
          {solutions.map((s) => (
            <li key={s.slug}>
              <Link
                to={`/solutions/${s.slug}`}
                data-row
                style={{ opacity: 0, visibility: 'hidden' }}
                className="focus-ring group flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10 sm:py-7"
              >
                <span className="flex min-w-0 items-start gap-6 sm:gap-9">
                  {/* The catalogue numeral is gone. Nine solutions in a
                      column do not need to be told they are nine, and
                      "04" was the least useful thing that could have
                      occupied the first column of a row whose whole
                      job is to let someone recognise their own room.
                      The mark is the same one that heads the solution
                      when they open it. */}
                  <Mark name={s.icon} size={22} className="mt-1 w-7 shrink-0 text-cove" />
                  <span className="min-w-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">
                    <span className="t-heading block text-bone">{s.title}</span>
                    {/* What it TOUCHES, not what it contains. Nine product
                        names ask the reader to remember what each one was;
                        nine scopes let them recognise their own room. It is
                        the same line the barrel puts in the corner of every
                        stop, from the same place in the data. */}
                    <span className="t-label mt-2.5 block text-mist">
                      {lens.stops[s.slug]?.touches}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-6 pl-13 sm:pl-0">
                  <span className="t-num text-[0.72rem] text-mist">{s.range}</span>
                  <Arrow
                    size={15}
                    className="text-mist transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 group-hover:text-cove"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* ---- The answer for someone none of the nine fits ---- */}
        <Rise
          className="mt-24 flex flex-col gap-6 sm:mt-32 sm:flex-row sm:items-center sm:justify-between"
          y={18}
          stagger={0.08}
        >
          <p className="t-sub max-w-[34ch] text-fog">{index.fallback}</p>
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
  )
}
