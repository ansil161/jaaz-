import { collections } from '../../data/site'
import { Lines, Rule } from '../ui/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   THE KIT — six categories, travelling sideways.

   On desktop the section takes the viewport, pins, and converts
   vertical scroll into horizontal travel across the rail. It is
   the one place on this page where the page's own axis changes,
   and it is spent here on purpose: this is the section most at
   risk of reading as a six-up grid of filler cards, and the
   axis change is what stops it.

   The distance is MEASURED, never assumed — `scrollWidth` minus
   the viewport, resolved through functions so ScrollTrigger can
   re-run them on refresh. Hard-coding it means the last card
   sits half off screen the moment a font loads late or the
   window is resized.

   The pin is gated on HEIGHT as well as width — see the
   `kit-tall` variant in index.css for why, and keep the query
   there and the one in gsap.matchMedia below identical.

   Everywhere else — phones, and short desktop windows — the
   section falls back to a plain snapping rail. A pinned
   horizontal rail on a phone fights the browser's own scroll
   direction and loses, and on a short window it clips its own
   captions. A rail the user can simply flick has neither
   problem, and it is what touch is good at anyway.
   ============================================================ */

export default function Collections() {
  const root = useGsapScope((el) => {
    const cards = el.querySelectorAll('[data-kit-card]')

    if (prefersReducedMotion()) {
      gsap.set(cards, { autoAlpha: 1, y: 0 })
      return
    }

    const mm = gsap.matchMedia()

    /* ---------- Desktop: pin and travel sideways ---------- */
    mm.add('(min-width: 1024px) and (min-height: 760px)', () => {
      const viewport = el.querySelector('[data-kit-viewport]')
      const track = el.querySelector('[data-kit-track]')
      const bar = el.querySelector('[data-kit-bar]')

      /* Measured at refresh time, not at build time.

         This subtraction is only correct because the gutters live on
         the TRACK, not on the viewport. `clientWidth` includes the
         viewport's own padding, so padding there would leave the
         travel two gutters short and clip the last card off the right
         edge — visible only at wide widths, where --gutter is 5rem. */
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          /* The pin lasts exactly as long as the travel, so the section
             releases the instant the last card is flush right. */
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.to(track, { x: () => -distance(), duration: 1 }, 0)
      /* The bar is the only affordance telling you how much rail is
         left. Without it a pinned section of unknown length is just a
         page that has stopped scrolling. */
      tl.fromTo(bar, { scaleX: 0.06 }, { scaleX: 1, duration: 1 }, 0)

      return () => tl.scrollTrigger?.kill()
    })

    /* ---------- Entrance, both breakpoints ---------- */
    gsap.from(cards, {
      autoAlpha: 0,
      y: 40,
      duration: 1.1,
      stagger: 0.08,
      ease: 'jaz',
      scrollTrigger: { trigger: el, start: 'top 75%', once: true },
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={root}
      id="collections"
      className="relative overflow-hidden bg-ink py-28 kit-tall:flex kit-tall:h-[var(--app-h)] kit-tall:flex-col kit-tall:justify-center kit-tall:py-0"
    >
      <div className="shell-wide shrink-0">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{collections.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-heading col-span-12 text-bone lg:col-span-5">
            {collections.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display text-pure">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines
            as="p"
            className="t-body col-span-12 max-w-md text-mist lg:col-span-4 lg:col-start-9"
          >
            {collections.intro}
          </Lines>
        </div>
      </div>

      {/* --- The rail. Native scroll on touch, GSAP-driven on desktop. --- */}
      <div
        data-kit-viewport
        className="rail-x mt-14 flex snap-x snap-mandatory overflow-x-auto lg:mt-16 kit-tall:snap-none kit-tall:overflow-x-hidden"
      >
        {/* Gutters belong to the track — see `distance()` above. They
            also give the native rail on touch a trailing gutter, which
            padding on a flex scroll container does not reliably do. */}
        <div
          data-kit-track
          className="flex gap-5 sm:gap-7 kit-tall:will-change-transform"
          style={{ paddingInline: 'var(--gutter)' }}
        >
          {collections.items.map((item) => (
            <article
              key={item.n}
              data-kit-card
              className="group w-[76vw] shrink-0 snap-start sm:w-[44vw] lg:w-[22rem]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-3">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="plate transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
                {/* The number sits ON the plate, so the card needs no
                    separate header row above the picture. */}
                <span className="t-num absolute left-5 top-5 text-xs text-pure/70">
                  {item.n}
                </span>
              </div>
              <h3 className="t-heading mt-6 text-bone">{item.title}</h3>
              <p className="t-body mt-4 text-mist">{item.body}</p>
            </article>
          ))}
        </div>
      </div>

      {/* --- Travel indicator. Desktop only: on touch the browser's own
              scrollbar already says this. --- */}
      <div
        aria-hidden="true"
        className="shell-wide mt-12 hidden shrink-0 kit-tall:mt-14 kit-tall:block"
      >
        <div className="h-px w-full bg-white/10">
          <div data-kit-bar className="h-px w-full origin-left bg-fog" />
        </div>
      </div>
    </section>
  )
}
