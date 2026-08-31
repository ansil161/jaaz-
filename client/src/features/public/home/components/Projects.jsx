import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { projects } from '@/features/public/data/site'
import { Lines, Rule } from '@/features/public/components/Motion'
import { Link } from '@/features/public/router/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   PROJECTS — proof, placed directly after the claim.

   The section above this one asserts 200+ rooms. This is where
   that number stops being a number. It is the earliest point on
   the page where a visitor can check the work rather than read
   about it, which is why it sits third rather than near the
   bottom where portfolios usually end up.

   A HORIZONTAL RAIL, NOT A GRID
   A grid of six shows everything at once and therefore
   flattens all six to the same weight. A rail shows two and a
   half and implies more — the crop at the right edge is doing
   the same work a magazine spread does when a photograph runs
   off the page. It also means the filter has something to
   visibly DO: the rail snaps back to its start and refills.

   Filtering is React state rather than a scroll-driven trick,
   because it is a discrete choice the visitor makes, and the
   entrance is rebuilt against the new set through the `active`
   dependency on the GSAP scope below.

   ARROWS, MATCHING THE REFERENCE CAROUSEL EXACTLY.
   Meridian's own project rail is an Owl Carousel: a pair of
   circular prev/next buttons, one item's worth of travel per
   click, the leading arrow disabled the moment there is nothing
   left in that direction to page to. This rail already had the
   filter tabs and the snap points Owl needs; what it didn't have
   was that paging affordance, so a visitor could only discover it
   was scrollable by already knowing to drag it. The buttons here
   reproduce that behaviour on the DOM's own scroll machinery
   (`scrollBy`) rather than pulling in Owl/jQuery for one section
   of a React site.
   ============================================================ */

export default function Projects() {
  const [active, setActive] = useState('all')
  const railRef = useRef(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })

  /* The arrow pair floats centred on the IMAGE, not the whole card —
     matching the reference, where the caption sits outside the
     carousel entirely. Cards here stack a caption underneath the
     image inside the same scroll track, so centring against the
     card's full height would land the buttons low, inside the
     caption. Measuring the image's own rendered height (and
     re-measuring on resize / when the result set changes it) is what
     keeps the arrows honestly centred rather than eyeballed against
     one breakpoint. */
  const firstImageRef = useRef(null)
  const [imgH, setImgH] = useState(0)

  const shown = useMemo(
    () =>
      active === 'all'
        ? projects.items
        : projects.items.filter((p) => p.tags.includes(active)),
    [active],
  )

  /* 4px of slack either side — a rail that has genuinely reached its
     end can still report a fractional `scrollLeft` short of the true
     max on some browsers, which would otherwise leave `next` stuck
     enabled forever with nowhere left to go. */
  const updateEdges = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const max = rail.scrollWidth - rail.clientWidth
    setEdges({ atStart: rail.scrollLeft <= 4, atEnd: rail.scrollLeft >= max - 4 })
  }, [])

  /* Re-measured on every filter change too — a shorter result set can
     turn a rail that used to overflow into one that fits the viewport
     outright, which means both arrows should now read as disabled.

     The ResizeObserver on the inner track matters more than it looks:
     it re-measures whenever the rail's own CONTENT size changes, not
     just when it scrolls. Without it, the very first `updateEdges()`
     call can run before the lazy-loaded images have taken their final
     height — `scrollWidth` is still small, so `atEnd` computes true
     immediately — and because nothing after that ever re-measures
     except an actual scroll, `next` stays wrongly disabled at
     scrollLeft 0 forever, on a rail that plainly has five more cards
     to show. */
  useLayoutEffect(() => {
    updateEdges()
    const rail = railRef.current
    if (!rail) return
    rail.addEventListener('scroll', updateEdges, { passive: true })
    const ro = new ResizeObserver(updateEdges)
    ro.observe(rail.firstElementChild)
    return () => {
      rail.removeEventListener('scroll', updateEdges)
      ro.disconnect()
    }
  }, [updateEdges, shown])

  useLayoutEffect(() => {
    const el = firstImageRef.current
    if (!el) return
    const measure = () => setImgH(el.getBoundingClientRect().height)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shown])

  /* One item's worth of travel per click — the first card's own
     rendered width plus the row's gap — so paging never launches the
     rail further than a single project at a time, same as the
     carousel this is matched against. */
  const page = useCallback((dir) => {
    const rail = railRef.current
    const card = rail?.querySelector('[data-card]')
    if (!rail || !card) return
    const gap = parseFloat(getComputedStyle(rail.firstElementChild).columnGap || '0')
    rail.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
  }, [])

  const root = useGsapScope(
    (el) => {
      const rail = el.querySelector('[data-rail]')
      const cards = el.querySelectorAll('[data-card]')
      if (!cards.length) return

      /* Snap the rail back to the head of the list on every filter
         change. Left where it was, a shorter result set can leave the
         viewport parked past the end of it, looking empty. */
      if (rail) rail.scrollLeft = 0

      if (prefersReducedMotion()) {
        gsap.set(cards, { autoAlpha: 1, y: 0 })
        return
      }

      /* No ScrollTrigger here. On the first pass the section is below
         the fold and a trigger would be right, but on every subsequent
         filter change the section is already on screen and a `once`
         trigger would never fire again — the new cards would stay at
         opacity 0. A plain tween covers both cases. */
      gsap.from(cards, {
        autoAlpha: 0,
        y: 34,
        duration: 1,
        stagger: 0.07,
        ease: 'jaz',
      })
    },
    [active],
  )

  return (
    <section ref={root} id="projects" className="relative bg-ink py-28 sm:py-36">
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{projects.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-display col-span-12 text-bone lg:col-span-6">
            {projects.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display text-pure">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines
            as="p"
            className="t-body col-span-12 max-w-md text-mist lg:col-span-4 lg:col-start-9"
          >
            {projects.intro}
          </Lines>
        </div>

        {/* --- Filters. A rule under the row rather than boxes around
                each chip: the active state is the only thing that needs
                a container, so only it gets one. --- */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-5">
          <div className="flex flex-wrap gap-2">
            {projects.filters.map((f) => {
              const on = f.id === active
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f.id)}
                  aria-pressed={on}
                  className={`t-label focus-ring rounded-full px-4 py-2.5 transition-colors duration-500 ${
                    on
                      ? 'bg-pure text-ink'
                      : 'text-ash hover:text-bone'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Count, so the filter reports its own result. Tabular so the
              number does not shift the label beside it — and beside it,
              the way out. This rail is a preview of /projects, and until
              it said so the only route to the collection was the nav. */}
          <div className="flex items-center gap-6">
            <span className="t-num text-xs text-ash">
              {String(shown.length).padStart(2, '0')} / {String(projects.items.length).padStart(2, '0')}
            </span>
            <Link
              to="/projects"
              className="group focus-ring t-label flex items-center gap-2.5 text-mist transition-colors duration-500 hover:text-bone"
            >
              All projects
              <span
                aria-hidden="true"
                className="block h-px w-6 bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-9"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* --- The rail, and the arrow pair riding over it. `relative`
              here (not on the rail itself) is what lets the buttons sit
              at a fixed position while the rail scrolls underneath
              them, exactly like the reference's carousel controls. --- */}
      <div className="relative">
        <div
          data-rail
          ref={railRef}
          className="rail-x mt-12 flex snap-x snap-mandatory overflow-x-auto pb-4"
        >
        {/* The gutters sit on the inner track rather than on the scroll
            container: padding-inline-end on a flex scroll container is
            not reliably included in its scrollable area, which drops the
            trailing gutter and butts the last card against the edge. */}
        <div
          className="flex gap-5 sm:gap-7"
          style={{ paddingInline: 'var(--gutter)' }}
        >
        {shown.map((p, i) => (
          <article
            key={p.n}
            data-card
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[26rem]"
          >
            <Link to={`/projects/${p.slug}`} className="group focus-ring block">
            <div
              ref={i === 0 ? firstImageRef : null}
              className="relative aspect-[4/5] w-full overflow-hidden bg-ink-3"
            >
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                decoding="async"
                draggable="false"
                /* The scale lives on the image and the clip on the frame,
                   so the crop tightens rather than the card growing. */
                className="plate transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
              />
              <span className="t-num absolute left-5 top-5 text-xs text-pure/70">{p.n}</span>
            </div>

            <div className="mt-6">
              <h3 className="t-heading text-bone">{p.title}</h3>
              <p className="t-label mt-3 text-ash">{p.meta}</p>
              <p className="t-body mt-4 max-w-sm text-mist">{p.body}</p>
            </div>
            </Link>
          </article>
        ))}
        </div>
        </div>

        {/* --- The arrow pair. Circular, floating, centred on the
                measured image height — not the whole card. `prev`
                disables the instant the rail is at rest, matching the
                reference exactly rather than always showing a control
                with nothing behind it to do. --- */}
        {imgH > 0 && (
          <div
            className="shell-wide pointer-events-none absolute inset-x-0 hidden items-center justify-between sm:flex"
            style={{ top: imgH / 2, transform: 'translateY(-50%)' }}
          >
            <button
              type="button"
              onClick={() => page(-1)}
              disabled={edges.atStart}
              aria-label="Previous project"
              className="focus-ring pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-ink/70 text-pure backdrop-blur transition-[opacity,border-color] duration-500 hover:border-white/40 disabled:pointer-events-none disabled:opacity-25"
            >
              <span aria-hidden="true">&#8592;</span>
            </button>
            <button
              type="button"
              onClick={() => page(1)}
              disabled={edges.atEnd}
              aria-label="Next project"
              className="focus-ring pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-ink/70 text-pure backdrop-blur transition-[opacity,border-color] duration-500 hover:border-white/40 disabled:pointer-events-none disabled:opacity-25"
            >
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
