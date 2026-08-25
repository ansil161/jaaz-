import ProjectFrame from './ProjectFrame'
import { Link } from '../chrome/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   THE REST OF THE WORK — cards, under the one that leads.

   The page makes an argument with two sizes and only two: one
   project gets a full screen of photograph and about three
   screens of scroll, and every other project gets a card. That
   contrast IS the statement — it says "this is the one to look
   at, and here is everything else" without a badge, a ribbon or
   the word "featured" anywhere on the page. Six equal chapters
   said all six were equal; six equal cards would say the same
   thing one size down.

   NOT THE DEFAULT CARD GRID, and the differences are the point:

   · TWO COLUMNS, NOT THREE. Three columns turns a photograph
     into a thumbnail. Two lets each room be seen.
   · THE SECOND COLUMN IS DROPPED. Every card in it starts a
     screen-tenth lower, so the eye travels down a stagger rather
     than across a table. It is the single cheapest thing that
     stops a grid reading as a grid.
   · NOTHING IS DRAWN AROUND THEM. No border, no fill, no
     radius, no shadow. The photograph is the card; the type sits
     under it on the page's own black, the way a plate is
     captioned in a monograph.
   · THE SET DIMS AROUND THE ONE YOU ARE POINTING AT — the
     site's own `.hover-dim`, so separation comes from light
     instead of from a box. It is also a better hover than the 4%
     zoom everything else in the category reaches for.

   The plate cannot take a CSS hover-scale, and that is worth
   knowing before someone tries: `ProjectFrame` drives the
   image's `scale` and `yPercent` from the scroll, which GSAP
   writes as an inline transform. A `group-hover:scale-*` class
   loses to it silently. The hover lifts `--plate-brightness`
   instead — a registered custom property, so `transition: filter`
   is a real interpolation on it.
   ============================================================ */

/** Same drawn arrow as everywhere else in this system. */
function Arrow({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d="M2.5 8h10.5" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  )
}

export default function ProjectCards({ items, startIndex = 1, resetKey }) {
  const root = useGsapScope(
    (el) => {
      const cards = gsap.utils.toArray(el.querySelectorAll('[data-card]'))
      if (!cards.length) return

      if (prefersReducedMotion()) {
        gsap.set(cards, { autoAlpha: 1, y: 0 })
        return
      }

      /* Per-card triggers rather than one on the container: a two-column
         stagger means the cards genuinely arrive at different scroll
         positions, and a single container trigger would fire the whole
         set the moment the first one appeared — including the ones two
         screens further down. `once` is right here (unlike the lead
         chapter, which scrubs): a card is a destination, not a moment,
         and re-playing its entrance on the way back up would fight the
         hover state someone is already reaching for. */
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            ease: 'jaz',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          },
        )
      })
    },
    [resetKey],
  )

  if (!items.length) return null

  return (
    <div ref={root} className="shell-wide mt-[10vh] sm:mt-[14vh]">
      <div className="hover-dim grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:gap-x-14 lg:gap-y-24">
        {items.map((p, i) => {
          const num = String(startIndex + i + 1).padStart(2, '0')
          return (
            <article
              key={p.slug}
              /* The drop on the right-hand column. Only from `sm` up — in
                 one column it would simply be an inconsistent gap.

                 THE ARTICLE CARRIES NO INLINE OPACITY, and that is
                 load-bearing rather than tidy. `.hover-dim > *` fades the
                 siblings of whatever is under the cursor, and it is a
                 stylesheet rule — so the moment GSAP finishes this card's
                 entrance and leaves `opacity: 1` sitting in the element's
                 own style attribute, the dim can never apply again.
                 Inline wins, silently, and the effect simply stops
                 existing. The entrance therefore animates an inner box
                 and leaves the article's own opacity to CSS. */
              className={`group ${i % 2 === 1 ? 'sm:mt-[10vh]' : ''}`}
            >
              <div data-card style={{ opacity: 0 }}>
                <Link
                  to={`/projects/${p.slug}`}
                  aria-label={`${p.flatTitle} — ${p.category}, ${p.location}`}
                  className="focus-ring block"
                >
                  <ProjectFrame
                    src={p.hero.src}
                    srcSet={p.hero.srcSet}
                    ratio={4 / 5}
                    alt={p.hero.alt}
                    sizes="(min-width: 640px) 46vw, 100vw"
                    inset={9}
                    drift={7}
                    scaleFrom={1.14}
                    imgClassName="[--plate-brightness:0.74] [--plate-contrast:1.05] transition-[filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:[--plate-brightness:0.92]"
                  >
                    <span
                      aria-hidden="true"
                      className="t-num absolute top-5 left-5 text-xs text-pure/70"
                    >
                      {num}
                    </span>

                    {/* The affordance, held under the frame's bottom edge
                        until the card is pointed at. Inside the clip, so
                        it is uncovered by the frame rather than floating
                        over it. */}
                    <span className="absolute right-5 bottom-5 flex translate-y-4 items-center gap-2.5 text-pure opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <span className="t-label">View project</span>
                      <Arrow size={11} />
                    </span>
                  </ProjectFrame>

                  <h3 className="t-heading mt-6 text-bone transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5">
                    {p.flatTitle}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span className="t-label text-fog">{p.location}</span>
                    <span className="h-px w-5 bg-white/25" aria-hidden="true" />
                    <span className="t-label text-ash">{p.category}</span>
                    <span className="t-num text-xs text-ash">{p.year}</span>
                  </div>

                  <p className="t-body mt-4 max-w-[46ch] text-mist">{p.summary}</p>
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
