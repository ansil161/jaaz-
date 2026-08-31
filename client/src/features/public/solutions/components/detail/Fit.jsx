import { Fragment } from 'react'
import { crossRefs } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { Lines, Rise } from '@/features/public/components/Motion'

/* ============================================================
   ONE SOLUTION — IS THIS YOURS

   The first thing after the hero, and that placement is the
   whole point.

   A brochure puts "who this is for" at the end, after it has
   spent five screens selling. That order is written for the
   seller. The visitor's first question is whether to keep
   reading at all, and this page can answer it honestly in ten
   seconds — so it does, before the specification, before the
   gallery, before anything is argued.

   THE "NOT FOR" COLUMN IS THE NAVIGATION
   Almost every line in `fit.no` already names the solution the
   reader should be looking at instead — "see Bar & Lounge
   Audio", "start with Acoustic Treatment", "this is included in
   Private Home Theatre". `crossRefs` finds those names and this
   renders them as links, so the moment someone learns they are
   on the wrong page they are one click from the right one
   rather than back at an index hunting for a half-remembered
   name.

   That is also the answer to "which of the nine is mine": nine
   pages that each say what they are NOT for, and point.
   ============================================================ */

function Tick({ className = '' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`mt-[0.42em] shrink-0 ${className}`}
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  )
}

function Slash({ className = '' }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`mt-[0.42em] shrink-0 ${className}`}
    >
      <path d="M3.5 12.5l9-9" />
    </svg>
  )
}

/* One line of the "not for" list, with any solution it names turned
   into a route. A solution never links to itself — see `crossRefs`. */
function Line({ text, self }) {
  return (
    <>
      {crossRefs(text, self).map((part, i) =>
        typeof part === 'string' ? (
          <Fragment key={i}>{part}</Fragment>
        ) : (
          <Link
            key={i}
            to={`/solutions/${part.slug}`}
            className="focus-ring link-underline text-bone transition-colors duration-500 hover:text-cove"
          >
            {part.name}
          </Link>
        ),
      )}
    </>
  )
}

export default function Fit({ solution: s }) {
  const { fit } = s

  return (
    <section id="fit" className="relative scroll-mt-32 bg-ink py-24 sm:py-32">
      <div className="shell-wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Lines as="h2" className="t-display text-bone lg:col-span-5" stagger={0.1}>
            {fit.heading.map((line, i) => (
              <span key={line} className="block">
                {i === fit.heading.length - 1 ? (
                  <em className="italic-display text-cove">{line}</em>
                ) : (
                  line
                )}
              </span>
            ))}
          </Lines>

          <div className="grid gap-12 lg:col-span-7 lg:grid-cols-2 lg:gap-10">
            <Rise selector="[data-item]" y={20} stagger={0.07}>
              <p data-item className="t-label mb-8 text-fog">
                {fit.yes.title}
              </p>
              <ul className="space-y-6">
                {fit.yes.items.map((item) => (
                  <li key={item} data-item className="flex gap-4">
                    <Tick className="text-cove" />
                    <span className="t-body text-bone">{item}</span>
                  </li>
                ))}
              </ul>
            </Rise>

            <Rise selector="[data-item]" y={20} stagger={0.07}>
              <p data-item className="t-label mb-8 text-mist">
                {fit.no.title}
              </p>
              <ul className="space-y-6">
                {fit.no.items.map((item) => (
                  <li key={item} data-item className="flex gap-4">
                    <Slash className="text-ash" />
                    <span className="t-body text-fog">
                      <Line text={item} self={s.slug} />
                    </span>
                  </li>
                ))}
              </ul>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  )
}
