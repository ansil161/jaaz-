import { obsessions } from '@/features/public/data/about'
import { Lines, Figure, Rise, Drift } from '@/features/public/components/Motion'
import { SectionLabel } from '@/features/public/components/Editorial'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   ABOUT 07 — WHAT WE OBSESS OVER

   Back to paper, and set as a printed ledger: a wide plate across
   the top, then four numbered clauses in two columns.

   This is the plainest section on the page and that is deliberate.
   It is where JAAZ commits to things that are inconvenient — a
   measurement you did not want, engineering you will never see,
   one number to call, support after the money has cleared. Copy
   like that is undermined by choreography, so all it gets is a
   staggered entrance and a rule.
   ============================================================ */

export default function Obsessions() {
  return (
    <section id="obsessions" className="on-paper relative bg-paper py-28 text-ink sm:py-36">
      <div className="shell-wide">
        <SectionLabel tone="paper">{obsessions.label}</SectionLabel>

        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Lines as="h2" className="t-display max-w-[11ch] text-ink" stagger={0.11}>
            {obsessions.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display">{line}</em> : line}
              </span>
            ))}
          </Lines>
        </div>

        <Drift y={3} className="mt-14">
          <Figure
            src={obsessions.image}
            alt={obsessions.imageAlt}
            parallax={10}
            placeholder="bg-ink/8"
            className="aspect-[16/9] w-full sm:aspect-[21/9]"
          />
        </Drift>

        <Rise
          as="ol"
          className="mt-16 grid gap-x-10 gap-y-12 border-t border-ink/15 pt-12 sm:grid-cols-2 lg:gap-x-16"
          selector="[data-clause]"
          stagger={0.11}
        >
          {obsessions.items.map((item) => (
            <li key={item.n} data-clause>
              {/* items-center, not items-baseline: a drawn mark has no
                  baseline to sit on, and aligning its box to the cap
                  line of the heading is what actually looks level. */}
              <div className="flex items-center gap-4">
                <Mark name={item.icon} size={23} className="shrink-0 text-ink/45" />
                <h3 className="t-heading text-ink">{item.title}</h3>
              </div>
              <p className="t-body mt-4 max-w-md text-ink/65 sm:pl-10">{item.body}</p>
            </li>
          ))}
        </Rise>
      </div>
    </section>
  )
}
