import { solutionsIndex } from '../../data/solutions'
import Words from './Words'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   SOLUTIONS — THE OVERTURE

   One room, held, and three lines of type. Nothing else.

   The page that follows is nine chapters long, so this has one
   job and it is not to summarise them: it is to set the light.
   A visitor should understand within one screen that they are
   about to be shown rooms, slowly, and that the site is going to
   take its time.

   It is deliberately the quietest screen on the page. Everything
   after it gets an oversized numeral, a composition and a colour
   temperature; this gets a photograph, a headline and dark.

   THE HANDOVER
   The overture does not end — it is covered. Chapter one sticks
   over the top of it while this screen's type drifts up and
   fades and the plate keeps sinking, so the first cut on the
   page is a dissolve rather than a boundary. No wave, no divider,
   no rule.
   ============================================================ */

export default function Overture() {
  const { headline, sub, meta, image, imageAlt, chapters } = solutionsIndex

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const img = q('[data-img]')
    const words = qa('[data-word]')
    const lift = qa('[data-lift]')
    const copy = q('[data-copy]')

    if (prefersReducedMotion()) {
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      gsap.set(words, { yPercent: 0 })
      return
    }

    /* The arrival. A load entrance, not a scroll one — this is already
       on screen when the page lands. The plate opens first and is still
       settling when the headline starts, so the room reads as the
       reason for the sentence rather than a backdrop behind it. */
    gsap
      .timeline({ defaults: { ease: 'jaz' } })
      .from(img, { scale: 1.18, duration: 2.8 }, 0)
      .fromTo(
        words,
        { yPercent: 108 },
        { yPercent: 0, duration: 1.5, stagger: 0.08, ease: 'power3.out' },
        0.35,
      )
      .fromTo(lift, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.12 }, 0.9)

    /* The handover. Two rates, so the screen comes apart in depth
       instead of sliding away in one piece. */
    const out = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })

    out
      .fromTo(img, { yPercent: 0 }, { yPercent: 9, duration: 1 }, 0)
      .fromTo(copy, { yPercent: 0, autoAlpha: 1 }, { yPercent: -26, autoAlpha: 0, duration: 1 }, 0)
  }, [])

  const hidden = { opacity: 0, visibility: 'hidden' }

  return (
    <section
      ref={root}
      className="relative flex h-[var(--app-h)] min-h-[36rem] flex-col justify-end overflow-hidden bg-ink"
    >
      <img
        data-img
        src={image}
        alt={imageAlt}
        fetchPriority="high"
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-brightness:0.6] [--plate-contrast:1.08] [--plate-saturate:0.9]"
        style={{ height: '118%', top: '-9%' }}
      />

      {/* Warm light pooling at the base, cool fall-off at the top —
          the same cove wash the rest of the site opens on, and the only
          non-photographic mark on this screen. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.72) 26%, rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 55% at 50% 104%, rgba(201, 173, 124, 0.16) 0%, rgba(201, 173, 124, 0.05) 40%, transparent 70%)',
        }}
      />

      <div data-copy className="shell-wide relative pb-[9vh]">
        <Words
          as="h1"
          text={headline.join(' ')}
          className="t-hero max-w-[13ch] text-bone"
        />

        <div className="mt-12 grid gap-8 sm:grid-cols-12 sm:items-end">
          <p data-lift className="t-sub max-w-[42ch] text-fog sm:col-span-6" style={hidden}>
            {sub}
          </p>

          <div
            data-lift
            className="flex items-baseline gap-8 sm:col-span-4 sm:col-start-9 sm:justify-end"
            style={hidden}
          >
            <span className="t-label text-mist">{meta}</span>
            <span className="t-label text-cove">{chapters.hint}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
