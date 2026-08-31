import { aboutHero } from '@/features/public/data/about'
import { useGsapScope, gsap, splitLines, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   ABOUT 01 — HERO

   The homepage hero draws a cinema out of the dark, one lighting
   circuit at a time. Repeating that here would make the About
   page read as a second homepage, so this one is the opposite
   gesture: the photograph is already there when you arrive, held
   wide and still, and only the type assembles.

   An editorial cover rather than a sequence.
   ============================================================ */

export default function AboutHero() {
  const root = useGsapScope((el) => {
    const image = el.querySelector('[data-plate]')
    const lines = el.querySelectorAll('[data-line]')
    const meta = el.querySelectorAll('[data-meta]')
    const sweep = el.querySelector('[data-sweep]')

    if (prefersReducedMotion()) {
      gsap.set([lines, meta], { autoAlpha: 1 })
      return
    }

    /* Entrance. The page has just arrived from behind the curtain,
       so this starts immediately rather than on a scroll trigger. */
    const tl = gsap.timeline({ delay: 0.1 })

    tl.fromTo(
      image,
      { scale: 1.16, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 2.4, ease: 'jaz' },
    )

    /* Split per line rather than across the whole heading, so an
       autoSplit re-split on resize rebuilds only the line that
       actually rewrapped instead of restarting the entrance. */
    gsap.set(lines, { autoAlpha: 1 })
    lines.forEach((line, i) => {
      splitLines(line, (self) =>
        gsap.from(self.lines, {
          yPercent: 108,
          duration: 1.25,
          delay: 0.55 + i * 0.11,
          ease: 'jaz',
        }),
      )
    })

    /* One pass of light across the frame, the same signal-language
       the homepage opens with — enough to tie the two together
       without replaying the whole sequence. */
    tl.fromTo(
      sweep,
      { xPercent: -130, opacity: 0 },
      { xPercent: 130, opacity: 1, duration: 1.9, ease: 'jaz-io' },
      0.5,
    ).fromTo(meta, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 1.1)

    /* Scroll-linked: the frame keeps travelling while the type leaves
       faster, so the two separate as you go. */
    gsap.to(image, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to(el.querySelector('[data-copy]'), {
      yPercent: -22,
      autoAlpha: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    })
  }, [])

  return (
    <section
      ref={root}
      id="about-hero"
      className="relative flex h-[var(--app-h)] min-h-[560px] items-end overflow-hidden bg-ink"
    >
      <img
        data-plate
        src={aboutHero.image}
        alt={aboutHero.imageAlt}
        fetchPriority="high"
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-brightness:1.04] will-change-transform"
        style={{ height: '124%', top: '-12%' }}
      />

      {/* Two scrims, not one: a floor under the type and a light lift
          off the top edge so the navigation never sits on a hard join. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/25"
      />

      <div
        data-sweep
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 will-change-transform"
        style={{
          background:
            'linear-gradient(100deg, transparent, rgba(255,244,224,0.10) 45%, rgba(255,244,224,0.16) 55%, transparent)',
        }}
      />

      <div data-copy className="relative w-full pb-16 sm:pb-20">
        <div className="shell-wide">
          <span data-meta className="t-label block text-mist" style={{ visibility: 'hidden' }}>
            {aboutHero.label}
          </span>

          <h1 className="t-hero mt-7 max-w-[19ch] text-pure">
            {aboutHero.headline.map((line, i) => (
              <span key={line} className="mask-line">
                <span data-line className="block" style={{ visibility: 'hidden' }}>
                  {i === 2 ? <em className="italic-display">{line}</em> : line}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-meta
            className="t-sub mt-9 max-w-md text-fog"
            style={{ visibility: 'hidden' }}
          >
            {aboutHero.sub}
          </p>
        </div>
      </div>
    </section>
  )
}
