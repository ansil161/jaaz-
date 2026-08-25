import { promise } from '../../data/site'
import { Lines, Rule, ScrubText, Drift } from '../ui/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   02 — THE PROMISE
   A held breath after the hero. One sentence, enormous, with a
   single word drifting behind it at the size of the building.
   No image, no card, no ornament: the restraint here is what
   makes the sections around it feel expensive.
   ============================================================ */

export default function Promise() {
  const root = useGsapScope((el) => {
    if (prefersReducedMotion()) return

    /* The watermark tracks scroll rather than time — it belongs to
       the page's depth, not to a loop. */
    gsap.fromTo(
      el.querySelector('[data-watermark]'),
      { xPercent: -6 },
      {
        xPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
  }, [])

  return (
    <section
      ref={root}
      id="promise"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink py-32 sm:py-40"
    >
      {/* The word behind the wall. Barely there, deliberately. */}
      <span
        data-watermark
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display leading-none text-pure/[0.028]"
        style={{ fontSize: 'clamp(9rem, 34vw, 34rem)', letterSpacing: '-0.04em' }}
      >
        {promise.watermark}
      </span>

      <div className="shell-wide relative w-full">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{promise.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-16 grid gap-14 sm:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* The one sentence the section exists for, so it gets the
              one treatment that ties reading pace to scroll pace. */}
          <ScrubText
            as="h2"
            className="t-display col-span-12 text-bone lg:col-span-8"
            start="top 78%"
            end="bottom 55%"
          >
            {promise.statement.map((line, i) => (
              <span key={line} className="block">
                {/* The turn of the sentence gets the italic — one
                    emphasis, in the one place it means something. */}
                {i === promise.statement.length - 1 ? (
                  <em className="italic-display text-pure">{line}</em>
                ) : (
                  line
                )}
              </span>
            ))}
          </ScrubText>

          <Drift y={9} className="col-span-12 lg:col-span-4 lg:col-start-9 lg:pt-4">
            <Lines as="p" className="t-body max-w-md text-mist" start="top 88%">
              {promise.body}
            </Lines>
          </Drift>
        </div>
      </div>
    </section>
  )
}
