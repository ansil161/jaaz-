import Words from '@/features/public/components/Words'
import { Link } from '@/features/public/router/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   PROJECT DETAIL — THE HERO

   The photograph is the page. Everything drawn on top of it is
   there under sufferance and has to earn its contrast.

   That is why there is no full-frame scrim: a flat black wash
   over a room someone spent nine months building is the cheapest
   possible way to make type legible, and it costs the picture
   exactly the thing the visitor came for. The gradient here is
   weighted to the bottom third — where the type actually lands —
   and the top of the frame is left at the exposure the plate was
   graded to.

   A quiet route back to the collection sits above the title.
   Arriving here from a search result rather than from /projects
   is a normal way to land on a project page, and "the only way
   out is the browser's back button" is not a considered answer
   to it.
   ============================================================ */

export default function DetailHero({ project }) {
  const { hero, title, location, year, category, services } = project

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const img = q('[data-hero-img]')
    const words = qa('[data-word]')
    const lift = qa('[data-lift]')
    const copy = q('[data-copy]')

    if (prefersReducedMotion()) {
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      gsap.set(words, { yPercent: 0 })
      return
    }

    gsap
      .timeline({ defaults: { ease: 'jaz' } })
      .from(img, { scale: 1.13, duration: 2.6 }, 0)
      .fromTo(words, { yPercent: 108 }, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'power3.out' }, 0.35)
      .fromTo(lift, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.85)

    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(img, { yPercent: 0 }, { yPercent: 10, duration: 1 }, 0)
      .fromTo(copy, { yPercent: 0, autoAlpha: 1 }, { yPercent: -22, autoAlpha: 0, duration: 1 }, 0)
  }, [])

  const hidden = { opacity: 0, visibility: 'hidden' }

  return (
    <section
      ref={root}
      className="relative flex h-[var(--app-h)] min-h-[34rem] flex-col justify-end overflow-hidden bg-ink"
    >
      <img
        data-hero-img
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="100vw"
        alt={hero.alt}
        fetchPriority="high"
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-brightness:0.66] [--plate-contrast:1.08]"
        style={{ height: '116%', top: '-8%' }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 26%, rgba(0,0,0,0.06) 56%, rgba(0,0,0,0.42) 100%)',
        }}
      />

      <div data-copy className="shell-wide relative pb-[7vh]">
        <Link
          data-lift
          to="/projects"
          className="focus-ring group inline-flex items-center gap-2.5 text-mist transition-colors duration-500 hover:text-bone"
          style={hidden}
        >
          <span
            aria-hidden="true"
            className="block h-px w-6 bg-current transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-9"
          />
          <span className="t-label">All projects</span>
        </Link>

        {/* One <Words> per authored line, so the title breaks where the
            data says it breaks rather than wherever the column runs
            out. Every word across every line still shares one stagger. */}
        <h1 className="t-cinema mt-7 text-bone">
          {title.map((line) => (
            <Words key={line} as="span" text={line} className="block" />
          ))}
        </h1>

        <div className="mt-9 grid gap-7 sm:grid-cols-12 sm:items-end">
          <div data-lift className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-span-5" style={hidden}>
            <span className="t-label text-fog">{location}</span>
            <span className="h-px w-6 bg-white/25" aria-hidden="true" />
            <span className="t-label text-mist">{category}</span>
            <span className="t-num text-xs text-mist">{year}</span>
          </div>

          {/* The scope, set as a run of small labels rather than a
              column of pills — the same information a chip set carries,
              without seven boxes over a photograph. */}
          <ul
            data-lift
            className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-6 sm:col-start-7 sm:justify-end"
            style={hidden}
          >
            {services.map((s) => (
              <li key={s} className="t-label text-mist">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
