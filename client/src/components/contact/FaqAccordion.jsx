import { useState } from 'react'
import { faq } from '../../data/contact'
import { Lines, Rise } from '../ui/Motion'
import { SectionLabel } from '../ui/Editorial'

/* ============================================================
   QUESTIONS — "Before you send it."

   Matches the reference's FAQ panel: label + heading held on the
   left, an accordion of hairline-divided rows on the right, the
   first one open by default so the page always shows at least
   one answered question rather than six closed lines.
   ============================================================ */

export default function FaqAccordion() {
  const [open, setOpen] = useState(0)

  return (
    <section className="relative bg-paper py-24 text-ink sm:py-32">
      <div className="shell-wide grid gap-14 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <SectionLabel tone="paper">{faq.label}</SectionLabel>
          <Lines as="h2" className="t-heading mt-8 max-w-xs text-ink" stagger={0.11}>
            {faq.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? (
                  <em className="italic-display" style={{ color: 'var(--color-cove)' }}>
                    {l}
                  </em>
                ) : (
                  l
                )}
              </span>
            ))}
          </Lines>
          <Lines as="p" className="t-body mt-6 max-w-xs text-ink/55">
            {faq.body}
          </Lines>
        </div>

        <Rise as="div" className="lg:col-span-7 lg:col-start-6" y={16} stagger={0.05}>
          {faq.items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-t border-ink/12 last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="focus-ring flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="t-sub text-[1.05rem] text-ink">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg text-ink/40 transition-transform duration-400"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'none' }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.5s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="t-body max-w-md pb-6 text-sm text-ink/60">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </Rise>
      </div>
    </section>
  )
}
