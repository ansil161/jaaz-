import { record } from '@/features/public/data/about'
import { Lines, Counter, Rise, Drift } from '@/features/public/components/Motion'
import { SectionLabel, ConfirmNote } from '@/features/public/components/Editorial'

/* ============================================================
   ABOUT 09 — TRACK RECORD

   Three figures, because three is what JAAZ supplied.

   A fourth was not invented to balance the row, and the grid is
   built for three rather than padded out — which is why the
   numbers are set at display scale across a full-width ledger
   instead of sitting in a four-up tile strip with a gap in it.
   ============================================================ */

export default function Record() {
  return (
    <section
      id="record"
      className="relative bg-ink py-28 sm:py-36"
    >
      <div className="shell-wide">
        <SectionLabel>{record.label}</SectionLabel>

        <Lines as="h2" className="t-display mt-12 max-w-[15ch] text-pure" stagger={0.11}>
          {record.heading.map((line, i) => (
            <span key={line} className="block">
              {i === 1 ? <em className="italic-display">{line}</em> : line}
            </span>
          ))}
        </Lines>

        <Drift y={4} className="mt-20">
          <Rise
            className="grid gap-x-8 gap-y-12 border-t border-white/12 pt-12 sm:grid-cols-3"
            selector="[data-stat]"
            stagger={0.12}
          >
            {record.stats.map((s) => (
              <div key={s.label} data-stat>
                <div className="t-num font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.9] text-pure">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="t-label mt-4 text-mist">{s.label}</div>
              </div>
            ))}
          </Rise>
        </Drift>

        {record.note && <ConfirmNote className="mt-14">{record.note}</ConfirmNote>}
      </div>
    </section>
  )
}
