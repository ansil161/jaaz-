import { Lines, Rise } from '@/features/public/components/Motion'

/* ============================================================
   ONE SOLUTION — THE SPECIFICATION

   Seven or eight measured facts, set as a schedule.

   This is the answer to the second question anybody asks about
   a room like this, and it is the one section on the page that
   should look like a document rather than a spread. Mono,
   tabular numerals, a hairline per row, values right-aligned so
   the figures form a column you can run an eye down. That is
   what a specification looks like, and dressing it up as
   editorial type would be costume.

   `spec.note` is the honest part and is set immediately under
   the heading rather than as a footnote: every figure here is
   indicative and re-derived from a survey, and a visitor should
   read that BEFORE the numbers, not after they have already
   taken one as a quote.
   ============================================================ */

export default function Spec({ solution: s }) {
  const { spec } = s

  return (
    <section id="spec" className="relative scroll-mt-32 bg-ink py-24 sm:py-32">
      <div className="shell-wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Lines as="h2" className="t-chapter text-bone">
              {spec.label}
            </Lines>
            <Lines as="p" className="t-body mt-7 max-w-[34ch] text-mist">
              {spec.note}
            </Lines>
          </div>

          <Rise
            as="dl"
            selector="[data-row]"
            y={18}
            stagger={0.05}
            className="lg:col-span-7 lg:col-start-6"
          >
            {spec.rows.map((row) => (
              <div
                key={row.label}
                data-row
                className="flex flex-col gap-1.5 border-t border-white/[0.09] py-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
              >
                <dt className="t-num text-[0.76rem] text-mist">{row.label}</dt>
                <dd className="t-num text-[0.9rem] text-bone sm:text-right">{row.value}</dd>
              </div>
            ))}
          </Rise>
        </div>
      </div>
    </section>
  )
}
