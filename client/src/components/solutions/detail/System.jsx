import { Lines, Rise, ScrubText } from '../../ui/Motion'

/* ============================================================
   ONE SOLUTION — WHAT IT IS MADE OF

   `system.layers` is the substance of the whole catalogue: the
   trades that make up this solution, each with what it is, why
   it is there, and three specifics. Up to seven of them.

   NOT CARDS
   Seven equal boxes of heading-plus-text is what this wants to
   become and it is the wrong answer twice over: it flattens an
   ORDER that matters — the shell is treated before a speaker is
   chosen — and it makes seven things of visibly different
   weight look identical. This is a numbered schedule. The
   number is load-bearing here in a way a decorative 01/02/03
   never is: it is the sequence the work actually happens in.

   The heading column sticks while the layers run past it, so it
   is always clear what this list is a list OF. `tall-lg` gates
   that, and the gate is the honest one: sticking is only worth
   anything if the thing that sticks is meaningfully shorter
   than the window, and on a 1366x768 laptop this column is most
   of it. Below the gate it simply scrolls, which is the correct
   short-window composition rather than a degraded one.
   ============================================================ */

export default function System({ solution: s }) {
  const { system, statement } = s

  return (
    <section id="system" className="relative scroll-mt-32 overflow-hidden bg-ink-2 py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(64% 40% at 82% 0%, rgba(201, 173, 124, 0.07) 0%, transparent 62%)',
        }}
      />

      <div className="shell-wide relative">
        {/* The best line in this solution's copy, given its own air
            before the schedule begins. */}
        <ScrubText
          as="p"
          className="font-display italic-display mb-20 max-w-[20ch] text-[clamp(1.6rem,3.4vw,3.2rem)] leading-[1.15] text-cove sm:mb-28"
        >
          {statement}
        </ScrubText>

        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 tall-lg:sticky tall-lg:top-40 tall-lg:self-start">
            <p className="t-label mb-6 text-mist">{system.label}</p>
            <Lines as="h2" className="t-chapter text-bone" stagger={0.1}>
              {system.heading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </Lines>
            <Lines as="p" className="t-body mt-8 max-w-[38ch] text-fog">
              {system.intro}
            </Lines>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Rise as="ol" selector="[data-layer]" y={26} stagger={0.06} className="space-y-px">
              {system.layers.map((layer) => (
                <li
                  key={layer.n}
                  data-layer
                  className="grid gap-x-8 gap-y-4 border-t border-white/[0.09] py-9 sm:grid-cols-12"
                >
                  <span className="t-num text-[0.72rem] text-cove sm:col-span-1">{layer.n}</span>

                  <div className="sm:col-span-11">
                    <h3 className="t-heading text-[clamp(1.35rem,2vw,1.9rem)] text-bone">
                      {layer.title}
                    </h3>
                    <p className="t-body mt-3 max-w-[46ch] text-fog">{layer.body}</p>

                    <ul className="mt-6 space-y-2.5">
                      {layer.points.map((point) => (
                        <li key={point} className="flex gap-4">
                          <span
                            aria-hidden="true"
                            className="mt-[0.62em] h-px w-4 shrink-0 bg-ash"
                          />
                          <span className="t-num text-[0.76rem] leading-relaxed text-mist">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </Rise>
          </div>
        </div>
      </div>
    </section>
  )
}
