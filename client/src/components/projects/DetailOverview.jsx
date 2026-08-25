import { Lines, ScrubText } from '../ui/Motion'

/* ============================================================
   OVERVIEW — the only place on the page that is mostly words.

   It sits directly under the hero because that is where the two
   questions land: what was this, and what did you actually do.
   Answer them in two paragraphs and get back to the rooms.

   THE STATEMENT IS SCRUBBED, THE PROSE IS NOT.
   The one-line summary resolves word by word as you scroll —
   this site reserves that for the few sentences a page is built
   around, and on a project page that is the sentence describing
   the project. Applied to the paragraphs underneath it as well,
   the effect stops being emphasis and becomes a reading tax.

   THE SPEC COLUMN IS A LIST, NOT A TABLE OF CARDS.
   Four facts, hairline-ruled, label left and value right — the
   way a drawing's title block sets them. Boxing each pair would
   turn four facts into four objects competing with the
   photographs either side of this section.
   ============================================================ */

export default function DetailOverview({ project }) {
  const { summary, overview, spec, services } = project

  return (
    <section className="relative bg-ink py-[13vh]" aria-label="Overview">
      <div className="shell-wide">
        <ScrubText as="p" className="t-heading max-w-[24ch] text-bone" end="top 34%">
          {summary}
        </ScrubText>

        <div className="mt-[9vh] grid gap-y-14 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-6">
            {overview.map((para, i) => (
              <Lines
                key={para.slice(0, 24)}
                as="p"
                className={`t-body max-w-[68ch] text-mist ${i ? 'mt-7' : ''}`}
              >
                {para}
              </Lines>
            ))}
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <dl>
              {spec.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-6 border-t border-white/10 py-4"
                >
                  <dt className="t-label shrink-0 text-ash">{label}</dt>
                  <dd className="t-body text-right text-fog">{value}</dd>
                </div>
              ))}
            </dl>

            <h2 className="t-label mt-12 text-ash">Scope</h2>
            <ul className="mt-4 space-y-1.5">
              {services.map((s) => (
                <li key={s} className="t-body text-mist">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
