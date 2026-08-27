import { Lines } from '../../ui/Motion'

/* ============================================================
   ONE SOLUTION — THE ARGUMENT

   `headline` and `intro` are the two fields on every solution
   that say WHY it exists rather than what is in it, and neither
   had anywhere to live before this page did.

   It sits after "is this yours" on purpose. The reader has
   already been told, honestly, whether to keep going; this is
   the first block that is allowed to persuade, and it has
   earned the right to by having offered the exit first.

   One display line against two paragraphs, nothing else. It is
   the quietest section on the page because the two either side
   of it — the fit lists and the seven-layer schedule — are both
   dense, and a page of uniformly dense screens is one nobody
   finishes.
   ============================================================ */

export default function Overview({ solution: s }) {
  return (
    <section id="why" className="relative scroll-mt-32 bg-ink pb-24 sm:pb-32">
      <div className="shell-wide">
        <div className="grid gap-12 border-t border-white/[0.09] pt-20 lg:grid-cols-12 lg:gap-8 sm:pt-24">
          <Lines as="h2" className="t-chapter text-bone lg:col-span-5" stagger={0.1}>
            {s.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </Lines>

          <div className="lg:col-span-6 lg:col-start-7">
            {s.intro.map((para, i) => (
              <Lines
                key={para}
                as="p"
                className={`t-sub max-w-[52ch] text-fog ${i > 0 ? 'mt-7' : ''}`}
              >
                {para}
              </Lines>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
