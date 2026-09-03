import { useState } from 'react'
import { craft } from '@/features/public/data/site'
import { Lines, Rule, Figure, Drift } from '@/features/public/components/Motion'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   06 — FROM SETUP TO SHOWTIME
   Five disciplines, one held image.

   The plate on the left never moves; only its contents change,
   wiping over each other as the corresponding discipline
   reaches the reading line. Five separate image sections would
   have said the same thing five times — this says it once.
   ============================================================ */

export default function Craft() {
  const [active, setActive] = useState(0)

  const root = useGsapScope((el) => {
    const rows = gsap.utils.toArray(el.querySelectorAll('[data-craft-row]'))

    /* One trigger per row, switching state as it crosses the reading
       line. Five state changes over the whole section — cheap enough
       to live in React rather than being driven imperatively. */
    rows.forEach((row, i) => {
      ScrollTrigger.create({
        trigger: row,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => self.isActive && setActive(i),
      })
    })

    if (prefersReducedMotion()) return

    /* The plate is sticky for the length of the list, which is a long
       time for a picture to sit perfectly still. Scrub a slow push-in
       across the whole section so it keeps moving under the swaps. */
    gsap.fromTo(
      el.querySelectorAll('[data-plate-stack] img'),
      { scale: 1.12 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el.querySelector('[data-craft-list]'),
          start: 'top 80%',
          end: 'bottom bottom',
          scrub: true,
        },
      },
    )

    gsap.from(rows, {
      autoAlpha: 0,
      y: 26,
      duration: 1.1,
      stagger: 0.06,
      ease: 'jaz',
      scrollTrigger: { trigger: el.querySelector('[data-craft-list]'), start: 'top 80%', once: true },
    })
  }, [])

  return (
    <section ref={root} id="craft" className="relative bg-ink py-28 sm:py-36">
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{craft.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-display col-span-12 text-bone lg:col-span-6">
            {craft.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display text-pure">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines as="p" className="t-body col-span-12 max-w-md text-mist lg:col-span-4 lg:col-start-9">
            {craft.intro}
          </Lines>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ---- The held plate (desktop only) ---- */}
          <div className="hidden lg:col-span-6 lg:block">
            <div className="sticky top-[18vh]">
              <div
                data-plate-stack
                className="relative aspect-[3/2] w-full overflow-hidden bg-ink-3"
              >
                {craft.items.map((item, i) => (
                  <img
                    key={item.n}
                    src={item.image}
                    alt={item.title}
                    /* Eager: see Spaces. A stacked cross-fade shows the
                       wrong picture under the right caption if any plate
                       in the stack has not decoded yet. */
                    loading="eager"
                    fetchPriority={i === 0 ? 'auto' : 'low'}
                    decoding="async"
                    className="plate absolute inset-0 transition-[clip-path,transform] duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
                    style={{
                      /* The incoming image wipes up over the outgoing one
                         and settles from a slight over-scale. */
                      clipPath:
                        i <= active ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
                      transform: i === active ? 'scale(1)' : 'scale(1.06)',
                      zIndex: i,
                    }}
                  />
                ))}
                {/* Frame caption. Needs an explicit z-index: the stacked
                    plates carry z-index 0..n, so an auto-z sibling would
                    be painted underneath all but the first of them. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-gradient-to-t from-ink/85 to-transparent p-6">
                  <Mark name={craft.items[active].icon} size={20} className="text-fog" />
                  <span className="t-label text-mist">{craft.items[active].title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ---- The list ---- */}
          <div data-craft-list className="lg:col-span-6">
            {craft.items.map((item, i) => {
              const isActive = active === i
              return (
                <article
                  key={item.n}
                  data-craft-row
                  onMouseEnter={() => setActive(i)}
                  className="border-t border-white/10 py-9 last:border-b sm:py-12"
                >
                  {/* items-start, not items-baseline: the mark that
                      replaced the ordinal has no baseline of its own,
                      and a nudge down puts its box on the heading's
                      cap line, which is what reads as aligned. */}
                  <div className="flex items-start gap-5 sm:gap-8">
                    <Drift as="span" y={22} className="block">
                      <Mark
                        name={item.icon}
                        size={20}
                        className="mt-1 transition-colors duration-500"
                        style={{ color: isActive ? '#fff' : '#55555b' }}
                      />
                    </Drift>
                    <div className="flex-1">
                      <h3
                        className="t-heading transition-colors duration-500"
                        style={{ color: isActive ? '#ffffff' : '#55555b' }}
                      >
                        {item.title}
                      </h3>
                      <p className="t-body mt-4 max-w-md text-mist">{item.body}</p>

                      {/* On touch the plate can't be sticky, so each row
                          carries its own image. */}
                      <Figure
                        src={item.image}
                        alt={item.title}
                        className="mt-7 aspect-[3/2] w-full lg:hidden"
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
