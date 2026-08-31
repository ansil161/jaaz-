import { useCallback, useEffect, useState } from 'react'
import { testimonials } from '@/features/public/data/site'
import { Rule, Rise, Drift } from '@/features/public/components/Motion'

/* ============================================================
   09 — TESTIMONIALS
   One voice at a time, at full size.

   Three quotes shown as a single slot rather than three cards:
   a wall of testimonials asks to be skimmed, one enormous quote
   asks to be read. The stack is a CSS grid with every slide in
   the same cell, so the container is always as tall as the
   longest quote and nothing jumps between slides.
   ============================================================ */

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function Testimonials() {
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState(1)
  const total = testimonials.items.length

  const go = useCallback(
    (next) => {
      setDir(next > active || (active === total - 1 && next === 0) ? 1 : -1)
      setActive((next + total) % total)
    },
    [active, total],
  )

  /* Arrow keys move the slider whenever it is the focused region. */
  useEffect(() => {
    const onKey = (e) => {
      if (!document.activeElement?.closest?.('[data-testimonials]')) return
      if (e.key === 'ArrowRight') go(active + 1)
      if (e.key === 'ArrowLeft') go(active - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, go])

  return (
    <section
      id="testimonials"
      data-testimonials
      className="relative border-t border-white/10 bg-ink py-28 sm:py-36"
      tabIndex={-1}
    >
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{testimonials.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <h2 className="t-heading mt-14 text-bone">{testimonials.heading}</h2>

        <Rise className="mt-16 sm:mt-20" y={26}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* --- Portrait. Cross-wipes with the quote. --- */}
            <Drift y={8} className="lg:col-span-3">
              <div className="relative aspect-[4/5] w-40 overflow-hidden bg-ink-3 sm:w-52 lg:w-full">
                {testimonials.items.map((t, i) => (
                  <img
                    key={t.name}
                    src={t.image}
                    alt={t.name}
                    /* Stacked cross-fade — must not be lazy. */
                    loading="eager"
                    fetchPriority="low"
                    decoding="async"
                    className="plate absolute inset-0"
                    style={{
                      clipPath:
                        i === active ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
                      transform: i === active ? 'scale(1)' : 'scale(1.08)',
                      transition: `clip-path 1s ${EASE}, transform 1.2s ${EASE}`,
                      zIndex: i === active ? 2 : 1,
                    }}
                  />
                ))}
              </div>
            </Drift>

            {/* --- The quote --- */}
            <div className="lg:col-span-8 lg:col-start-5">
              <div className="grid">
                {testimonials.items.map((t, i) => {
                  const isActive = i === active
                  return (
                    <blockquote
                      key={t.name}
                      aria-hidden={!isActive}
                      className="[grid-area:1/1]"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive
                          ? 'translateY(0)'
                          : `translateY(${dir > 0 ? 28 : -28}px)`,
                        transition: `opacity 0.7s ${EASE}, transform 0.9s ${EASE}`,
                        pointerEvents: isActive ? 'auto' : 'none',
                      }}
                    >
                      <p className="t-display text-bone" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.9rem)', lineHeight: 1.18 }}>
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <footer className="mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                        <cite className="t-label not-italic text-pure">{t.name}</cite>
                        <span className="t-label text-ash">{t.context}</span>
                      </footer>
                    </blockquote>
                  )
                })}
              </div>

              {/* --- Controls --- */}
              <div className="mt-14 flex items-center justify-between gap-6 border-t border-white/10 pt-7">
                <div className="flex items-center gap-4">
                  <span className="t-num text-xs text-fog">
                    {String(active + 1).padStart(2, '0')}
                    <span className="text-ash"> / {String(total).padStart(2, '0')}</span>
                  </span>
                  <div className="flex gap-1.5">
                    {testimonials.items.map((t, i) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => go(i)}
                        aria-label={`Show testimonial ${i + 1}`}
                        aria-current={i === active}
                        className="focus-ring group py-2"
                      >
                        <span
                          className="block h-px w-8 transition-colors duration-500"
                          style={{ background: i === active ? '#fff' : '#2a2a2d' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { d: -1, label: 'Previous testimonial', glyph: '←' },
                    { d: 1, label: 'Next testimonial', glyph: '→' },
                  ].map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => go(active + b.d)}
                      aria-label={b.label}
                      className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-fog transition-colors duration-500 hover:border-pure hover:bg-pure hover:text-ink"
                    >
                      <span aria-hidden="true">{b.glyph}</span>
                    </button>
                  ))}
                </div>
              </div>

              <a href="#" className="link-underline t-label mt-10 inline-block text-mist focus-ring">
                View more projects
              </a>
            </div>
          </div>
        </Rise>
      </div>
    </section>
  )
}
