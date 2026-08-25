import { brand } from '../../data/site'
import { Lines, Rule, Figure, Counter, Rise, Magnetic, Drift } from '../ui/Motion'
import { Link } from '../chrome/PageTransition'

/* ============================================================
   04 — BRING THE BIG SCREEN HOME
   The page inverts to paper here. After three black sections
   the switch reads as stepping out of the cinema and into the
   studio — which is exactly what this section is about.

   Layout is deliberately asymmetric: a tall portrait plate held
   on the left while the copy, the numbers and the CTA scroll
   past it on the right.
   ============================================================ */

export default function Brand() {
  return (
    <section
      id="brand"
      className="on-paper relative bg-paper py-28 text-ink sm:py-36"
    >
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-ink/45">{brand.label}</span>
          <Rule className="max-w-40 text-ink" />
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* --- The plate. Sticky, so the copy moves against it. --- */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Figure
                src={brand.image}
                alt={brand.imageAlt}
                parallax={11}
                placeholder="bg-ink/8"
                className="aspect-[4/5] w-full lg:aspect-[3/4]"
              />
              <p className="t-label mt-4 text-ink/40">{brand.imageAlt}</p>
            </div>
          </div>

          {/* --- The argument --- */}
          <div className="lg:col-span-6 lg:col-start-7">
            <Lines as="h2" className="t-display text-ink" stagger={0.11}>
              {brand.heading.map((l, i) => (
                <span key={l} className="block">
                  {i === 1 ? <em className="italic-display">{l}</em> : l}
                </span>
              ))}
            </Lines>

            <div className="mt-10 max-w-xl space-y-6">
              {brand.body.map((para) => (
                <Lines key={para} as="p" className="t-body text-ink/65">
                  {para}
                </Lines>
              ))}
            </div>

            {/* --- Numbers. Set as a rule-divided ledger, not as tiles. --- */}
            <Drift y={5} className="mt-16">
              <Rise
                className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-ink/15 pt-10 sm:grid-cols-3 lg:gap-x-6"
                selector="[data-stat]"
                stagger={0.1}
              >
                {brand.stats.map((s) => (
                  <div key={s.label} data-stat>
                    <div className="t-num font-display text-4xl leading-none text-ink sm:text-5xl">
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="t-label mt-3 text-ink/45">{s.label}</div>
                  </div>
                ))}
              </Rise>
            </Drift>

            <Rise className="mt-14" y={20}>
              <Magnetic>
                <Link to="/about" className="btn btn-on-paper focus-ring text-ink">
                  {brand.cta}
                  <span className="btn-arrow" aria-hidden="true">
                    &#8594;
                  </span>
                </Link>
              </Magnetic>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  )
}
