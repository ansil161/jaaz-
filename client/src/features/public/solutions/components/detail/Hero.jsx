import { solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import Words from '@/features/public/components/Words'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   ONE SOLUTION — THE HERO

   The page opens FROM the shape it was clicked on.

   On the catalogue, this solution is a stop on a lens, and its
   opening is a specific shape: the flagship is the whole frame,
   acoustic treatment is a standing column, the terrace is a
   horizon. This hero starts clipped to exactly that shape and
   opens to full bleed. Someone who clicked a narrow column sees
   a narrow column become a room, so arriving here reads as the
   lens opening rather than as a page load — and the two screens
   are visibly the same object.

   WHAT IT HAS TO SAY, IN ORDER
   1. Yes, this is the thing you clicked.  (the title, as H1)
   2. In one sentence, what it is.         (`sub`)
   3. What it costs and how long it takes. (the fact row)

   Point 3 is the second question every visitor to this site
   arrives with and it used to be nine screens down. It is set in
   the mono face because it is measurement, and the values are
   left unlabelled because they are self-describing — "10–16
   weeks", "On survey", "Flagship" — and inventing labels for
   them would be inventing copy.

   `headline` and `statement` deliberately do NOT appear here.
   They are the argument for the solution, and the argument
   belongs after the reader knows what they are looking at.
   ============================================================ */

const HIDDEN = { opacity: 0, visibility: 'hidden' }

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

export default function Hero({ solution: s }) {
  const stop = solutionsIndex.lens.stops[s.slug]

  /* `meta` is authored as one string of facts joined by a middot —
     "Dedicated room · 6–14 seats · 10–16 weeks". Split, it becomes a
     row that can be scanned instead of read. */
  const facts = [...String(s.meta).split('·').map((f) => f.trim()), s.range, s.tier].filter(Boolean)

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const frame = q('[data-frame]')
    const img = q('[data-img]')
    const words = qa('[data-word]')
    const lift = qa('[data-lift]')

    if (prefersReducedMotion()) {
      gsap.set(frame, { clipPath: 'none' })
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      gsap.set(words, { yPercent: 0 })
      return
    }

    gsap
      .timeline({ defaults: { ease: 'jaz' } })
      /* The opening this solution has on the catalogue, becoming the
         whole frame. `jaz-io` rather than `jaz` because it is a state
         change — a lens finishing a move it started on the last page. */
      .fromTo(
        frame,
        { clipPath: `inset(${stop.y}% ${stop.x}% ${stop.y}% ${stop.x}% round ${stop.r}%)` },
        { clipPath: 'inset(0% 0% 0% 0% round 0%)', duration: 1.5, ease: 'jaz-io' },
        0,
      )
      .from(img, { scale: 1.16, duration: 2.6 }, 0)
      .fromTo(
        words,
        { yPercent: 108 },
        { yPercent: 0, duration: 1.3, stagger: 0.07, ease: 'power3.out' },
        0.5,
      )
      .fromTo(
        lift,
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 },
        0.9,
      )

    /* The plate keeps sinking as the page leaves it. */
    gsap.fromTo(
      img,
      { yPercent: 0 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: 0.8 },
      },
    )
  }, [s.slug])

  return (
    <header
      ref={root}
      className="relative flex min-h-[var(--app-h)] flex-col justify-end overflow-hidden bg-ink pt-28 pb-[7vh]"
    >
      <div data-frame className="absolute inset-0">
        <img
          data-img
          src={s.hero}
          alt={s.heroAlt}
          fetchPriority="high"
          decoding="async"
          draggable="false"
          className="plate absolute inset-0 h-full w-full object-cover [--plate-brightness:0.7] [--plate-contrast:1.06] [--plate-saturate:0.94]"
          style={{ objectPosition: stop.focus, height: '110%', top: '-5%' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.7) 26%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.5) 100%)',
          }}
        />
      </div>

      <div className="shell-wide relative">
        {/* Back to the catalogue, at the top of the reading order and
            not buried at the bottom — someone who opened the wrong one
            should not have to read it to leave. */}
        <Link
          data-lift
          to="/solutions"
          className="focus-ring t-label mb-10 inline-flex items-center gap-3 text-mist transition-colors duration-500 hover:text-cove"
          style={HIDDEN}
        >
          <Arrow size={12} className="rotate-180" />
          All nine solutions
        </Link>

        <div className="flex items-baseline gap-6">
          <span data-lift className="t-num text-[0.72rem] text-cove" style={HIDDEN}>
            {s.n}
          </span>
          <Words as="h1" text={s.title} className="t-display max-w-[16ch] text-bone" />
        </div>

        <p data-lift className="t-sub mt-8 max-w-[52ch] text-fog" style={HIDDEN}>
          {s.sub}
        </p>

        {/* The fact row. Cost and programme, one screen in. */}
        {/* A list, not a <dl>. These are five facts of the same kind,
            not five term/definition pairs, and a description list with
            no <dt> in it is invalid markup that a screen reader reads
            as a broken table. */}
        <ul
          data-lift
          className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/[0.12] pt-6"
          style={HIDDEN}
        >
          {facts.map((fact, i) => (
            <li key={fact} className="flex items-center gap-7">
              {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-white/15" />}
              <span className="t-num text-[0.74rem] text-bone">{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
