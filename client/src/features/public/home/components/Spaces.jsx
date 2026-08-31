import { useState } from 'react'
import { spaces } from '@/features/public/data/site'
import { Lines } from '@/features/public/components/Motion'
import { prefersReducedMotion } from '@/lib/animation/useGsap'
import SpacesCarousel from './SpacesCarousel'

/* ============================================================
   CHAPTER 02 — SPACES

   Two zones, side by side, and they are independent of each
   other in the only sense that matters: the active card's state
   does not live in this file.

   LEFT   the section's argument — label, heading, standfirst,
          and the line it closes on. Fixed copy. It never moves,
          slides or fades when the carousel turns, and it cannot,
          because <SpacesCarousel/> owns `active` and this
          component is not in that state's subtree. React is
          never even asked to re-render this panel.
   RIGHT  <SpacesCarousel/>, self-contained: its own clock, its
          own pager, and every fact about a room — name, line,
          dimensions, materials — inside that room's own card.

   THE RIGHT ZONE RUNS OFF THE EDGE OF THE SCREEN.
   The row is padded on the left only. The card column keeps
   going past the page's right gutter so the next card bleeds
   off the viewport rather than stopping short of it at a margin
   — which is the difference between a carousel that continues
   and one that has simply ended. `overflow-hidden` on the
   section is what makes that safe.

   WHAT THIS REPLACED
   A pinned, scroll-scrubbed projector: a fixed gate with a film
   strip pulled through it, six viewports tall. It is gone on
   request, and with it about five screens of homepage scroll.
   ============================================================ */

const N = spaces.items.length

export default function Spaces() {
  const [reduced] = useState(() => prefersReducedMotion())

  /* ---------- Reduced motion: the six rooms, laid flat ----------
     Not the carousel with the transition switched off. These cards
     carry the section's whole content, and "less motion" must never
     mean "less content" — so everything is on screen at once and
     nothing needs a control to reach. */
  if (reduced) {
    return (
      <section id="spaces" className="relative bg-ink py-24">
        <header className="shell-wide">
          <span className="t-label text-mist">{spaces.label}</span>
          <h2 className="t-heading mt-3 text-bone">{spaces.heading}</h2>
          <p className="t-body mt-4 max-w-md text-mist">{spaces.intro}</p>
        </header>

        <div className="shell-wide mt-14 grid gap-12 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.items.map((s) => (
            <article key={s.n}>
              <div className="relative aspect-4/3 overflow-hidden rounded-[clamp(0.9rem,1.4vw,1.3rem)]">
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  decoding="async"
                  className="plate absolute inset-0 [--plate-brightness:1.02] [--plate-contrast:1.06] [--plate-saturate:0.9]"
                />
              </div>
              <p className="t-num mt-5 text-[0.625rem] text-cove">
                {s.n} <span className="text-fog/50">/ {String(N).padStart(2, '0')}</span>
              </p>
              <h3 className="t-heading mt-2 text-pure">{s.title}</h3>
              <p className="t-sub mt-1.5 text-bone">{s.line}</p>
              <p className="t-num mt-4 text-[0.6875rem] leading-relaxed text-mist">
                {s.meta}
                <span className="mt-1 block text-ash">
                  {s.dim} &middot; {s.spec}
                </span>
              </p>
            </article>
          ))}
        </div>

        <p className="shell-wide t-heading mt-16 max-w-lg text-pure">{spaces.closing}</p>
      </section>
    )
  }

  return (
    <section id="spaces" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      {/* Padded on the LEFT only — see the note above. `max-w` keeps
          the pair from stretching past the site's measure on very wide
          screens while still letting the cards reach the edge. */}
      <div className="mx-auto grid max-w-[120rem] items-center gap-14 pl-[var(--gutter)] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        {/* ---------- ZONE 1 — fixed ---------- */}
        <div className="pr-[var(--gutter)] lg:pr-0">
          <span className="t-label text-mist">{spaces.label}</span>

          <Lines as="h2" className="t-display mt-4 max-w-[14ch] text-bone">
            {spaces.heading}
          </Lines>

          <Lines as="p" className="t-sub mt-6 max-w-[34ch] text-fog">
            {spaces.intro}
          </Lines>

          <Lines
            as="p"
            className="t-body mt-10 max-w-[30ch] border-t border-white/[0.1] pt-8 text-mist"
          >
            {spaces.closing}
          </Lines>
        </div>

        {/* ---------- ZONE 2 — independent ---------- */}
        <SpacesCarousel items={spaces.items} />
      </div>
    </section>
  )
}
