import ProjectFrame from './ProjectFrame'
import Words from '../solutions/Words'
import { Link } from '../chrome/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   NEXT PROJECT — the last full-screen image on the page.

   Two things at once, which is why it is here rather than a
   "back to projects" link in a footer: it is the closing
   cinematic frame the brief asks every project to end on, AND
   it is the only route onward that does not ask the visitor to
   go back to an index and start choosing again.

   The plate opens as you arrive at it and the next project's
   name rises over it — the same gesture the index uses to
   introduce a chapter, so arriving at the next project from
   here feels like turning a page rather than following a link.
   ============================================================ */

export default function DetailNext({ project }) {
  const { slug, title, flatTitle, location, category, hero } = project

  const root = useGsapScope((el) => {
    const words = gsap.utils.toArray(el.querySelectorAll('[data-word]'))
    const lift = gsap.utils.toArray(el.querySelectorAll('[data-lift]'))

    if (prefersReducedMotion()) {
      gsap.set(words, { yPercent: 0 })
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      return
    }

    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          end: 'top 24%',
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(words, { yPercent: 108 }, { yPercent: 0, duration: 0.6, stagger: 0.08 }, 0)
      .fromTo(lift, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.2)
  }, [])

  return (
    <section ref={root} className="relative bg-ink" aria-label="Next project">
      <Link
        to={`/projects/${slug}`}
        aria-label={`Next project: ${flatTitle} — ${category}, ${location}`}
        className="group focus-ring relative block"
      >
        <ProjectFrame
          src={hero.src}
          srcSet={hero.srcSet}
          ratio={null}
          alt={hero.alt}
          sizes="100vw"
          className="h-[72svh] min-h-[22rem] sm:h-[84svh]"
          imgClassName="[--plate-brightness:0.6] [--plate-contrast:1.06] transition-[filter] duration-700 group-hover:[--plate-brightness:0.76]"
          inset={12}
          radiusFrom={18}
          drift={7}
          scaleFrom={1.12}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.34) 32%, rgba(0,0,0,0) 62%)',
            }}
          />
        </ProjectFrame>

        <div className="shell-wide pointer-events-none absolute inset-x-0 bottom-0 pb-[6vh]">
          <span data-lift className="t-label block text-cove" style={{ opacity: 0 }}>
            Next project
          </span>

          <p className="t-display mt-5 text-bone">
            {title.map((line) => (
              <Words key={line} as="span" text={line} className="block" />
            ))}
          </p>

          <div
            data-lift
            className="mt-6 flex items-center gap-4 text-mist"
            style={{ opacity: 0 }}
          >
            <span className="t-label">{location}</span>
            <span
              aria-hidden="true"
              className="block h-px w-8 bg-current transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-14"
            />
            <span className="t-label">{category}</span>
          </div>
        </div>
      </Link>
    </section>
  )
}
