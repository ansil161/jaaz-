import { solutions, solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   SOLUTIONS — THE LENS, UNROLLED

   What a phone gets, and what anyone who has asked their
   operating system for less motion gets on any screen.

   This is not the barrel with the animation switched off. A
   barrel needs a viewport it can hold still while the wheel
   turns it, and a phone does not have one to spare. So the nine
   stops are laid out as nine plates, in order, and the idea
   survives in the one place it actually lives: THE SHAPE. Each
   solution still opens by exactly as much of the frame as it
   touches — the flagship is the full plate, acoustic treatment
   is a standing column, the terrace is a horizon, the chair is
   a pin-spot — and the openings still stop down as you descend.

   The title is still lit only where the opening falls across
   it. That works here for the same reason it works on the
   barrel: the bright copy is `aria-hidden` and cut by the same
   inset the picture is cut by, and the copy underneath it — the
   one carrying the information — is whole and passes contrast
   on its own.

   The only thing lost is the turn between the stops, which is a
   scroll mechanism and has no business on a device where a
   scroll is a thrown finger.
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

/* The stop's own geometry, as a static cut — the same numbers the
   barrel animates to, damped.

   Damped because the barrel cuts a LANDSCAPE stage and this cuts a
   portrait one. 39% off each side of a 1366px stage is a 300px
   standing column; 39% off each side of a phone is a 75px sliver of
   photograph, which is not a composition, it is a mistake. At 0.64
   the nine silhouettes still differ from each other in exactly the
   same order — full frame, letterbox, panel, column, band, room,
   horizon, pool, pin-spot — and every one of them is still a
   photograph you can read. */
const DAMP = 0.64
const damp = (n) => Number((n * DAMP).toFixed(1))
const cut = (s) =>
  `inset(${damp(s.y)}% ${damp(s.x)}% ${damp(s.y)}% ${damp(s.x)}% round ${s.r}%)`

export default function LensStack() {
  const { headline, sub, meta, lens } = solutionsIndex
  const stops = solutions.map((s) => ({ ...s, ...lens.stops[s.slug] }))

  const root = useGsapScope((el) => {
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))
    const lift = qa('[data-lift]')

    if (prefersReducedMotion()) {
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      return
    }

    /* The headline is on screen when the page lands, so it runs on
       load. Everything below it is not, and must not. */
    gsap.fromTo(
      qa('[data-open] [data-lift]'),
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'jaz' },
    )

    /* Each stop entering on its own trigger, rather than one stagger
       over all thirty elements at mount. Written as one timeline per
       article so the plate is always uncovered BEFORE its title —
       nine independent tweens racing a shared stagger cannot promise
       that, and the whole point of a stop is that you see the room
       and then read what it is. */
    qa('article').forEach((article) => {
      const frame = article.querySelector('[data-frame]')
      const img = frame.querySelector('img')

      gsap
        .timeline({
          defaults: { ease: 'jaz' },
          scrollTrigger: { trigger: article, start: 'top 78%', once: true },
        })
        .fromTo(
          article.querySelectorAll('[data-lift]'),
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.14 },
          0,
        )
        .from(img, { scale: 1.14, duration: 1.8 }, 0)

      /* One continuous move per plate, for as long as it is on
         screen. Cheap, and it is the difference between a column of
         photographs and a slideshow. */
      gsap.fromTo(
        img,
        { yPercent: -3.5 },
        {
          yPercent: 3.5,
          ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  }, [])

  return (
    <div ref={root} className="relative bg-ink">
      {/* ---- The headline, lit through the lens at its widest ---- */}
      <section
        data-open
        className="shell-wide relative flex min-h-[76vh] flex-col justify-end pt-32 pb-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(78% 46% at 50% 6%, rgba(201, 173, 124, 0.11) 0%, transparent 66%)',
          }}
        />
        <h1 data-lift className="t-hero relative max-w-[13ch] text-bone" style={HIDDEN}>
          {headline.join(' ')}
        </h1>
        <p data-lift className="t-sub relative mt-9 max-w-[42ch] text-fog" style={HIDDEN}>
          {sub}
        </p>
        <p data-lift className="t-label relative mt-8 text-mist" style={HIDDEN}>
          {meta}
        </p>
      </section>

      {/* ---- The nine, still stopping down ---- */}
      {stops.map((s) => (
        <article key={s.slug} className="shell-wide relative pb-24 sm:pb-32">
          <p data-lift className="t-label mb-5 text-mist" style={HIDDEN}>
            {s.touches}
          </p>

          <div
            data-frame
            data-lift
            className="relative aspect-4/5 w-full overflow-hidden sm:aspect-16/10"
            style={{ ...HIDDEN, clipPath: cut(s) }}
          >
            <img
              src={s.hero}
              alt={s.heroAlt}
              loading="lazy"
              decoding="async"
              draggable="false"
              className="plate absolute inset-0 h-full w-full object-cover [--plate-contrast:1.06] [--plate-saturate:0.94]"
              style={{ objectPosition: s.focus, height: '110%', top: '-5%' }}
            />
          </div>

          <div data-lift className="relative mt-8" style={HIDDEN}>
            {/* Same two-copy construction as the barrel: the whole
                title underneath, the lit fragment on top, cut by this
                stop's own opening. */}
            <div className="relative">
              <h2 className="t-chapter stop-unlit max-w-[17ch] text-bone">{s.title}</h2>
              <span
                aria-hidden="true"
                className="t-chapter stop-lit absolute inset-0 max-w-[17ch]"
                style={{ clipPath: `inset(0% ${damp(s.x)}% 0% ${damp(s.x)}%)` }}
              >
                {s.title}
              </span>
            </div>

            <p className="font-display italic-display mt-6 max-w-[26ch] text-[1.15rem] leading-[1.25] text-cove">
              {s.statement}
            </p>
            <p className="t-sub mt-5 max-w-[42ch] text-fog">{s.sub}</p>
            <p className="t-num mt-6 text-[0.72rem] leading-relaxed text-mist">
              {s.meta}
              <span className="mt-1 block text-ash">
                {s.tier} · {s.range} · f/{s.f}
              </span>
            </p>

            <Link
              to={`/solutions/${s.slug}`}
              className="focus-ring t-label mt-8 inline-flex items-center gap-3 text-bone transition-colors duration-500 hover:text-cove"
            >
              {lens.open}
              <Arrow />
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
