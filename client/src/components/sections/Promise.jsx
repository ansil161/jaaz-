import { promise } from '../../data/site'
import { Lines, Rule, ScrubText } from '../ui/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   02 — THE PROMISE

   The held breath after the hero, given its argument back.

   WHAT CHANGED, AND WHY IT IS NOT JUST "BIGGER"
   The four sentences under the statement used to be one grey
   paragraph in a narrow right-hand column, set at body size in
   `--mist`. Read closely, they are not a paragraph at all:

     A great picture you have to squint at is not a great picture.
     Sound that fatigues you is not great sound.
     A room you leave early was never worth building.
     JAAZ starts where most cinemas stop — with the body in the chair.

   Three parallel negations of exactly the same shape, and then
   the turn that answers them. And the three are the site's own
   comfort axes in order: PICTURE, SOUND, ROOM. Running them
   together as prose threw away a structure the copy already
   had.

   So they are set as the triad they are — three columns, three
   rules, drawn in sequence — and the turn is given the width
   and the weight of a conclusion. No labels were added over the
   columns: the sentences name their own subjects in their first
   four words, and captioning them PICTURE / SOUND / ROOM would
   be writing new copy onto a page to explain copy that is
   already clear.

   ON RESTRAINT
   The note that used to sit here said the restraint in this
   section is what makes the sections around it feel expensive,
   and that is still true of the STATEMENT — it is alone on its
   own line, and nothing was added beside it. What follows it is
   louder now because it was asked to be. The one thing held
   back is colour: a single cove phrase at the very end, on the
   five words the whole page turns on.
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

        {/* The one sentence the section exists for, alone on its line
            and still getting the one treatment that ties reading pace
            to scroll pace. */}
        <ScrubText
          as="h2"
          className="t-display mt-16 max-w-[15ch] text-bone sm:mt-24"
          start="top 82%"
          end="bottom 60%"
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

        {/* ---- The triad ----
            Three columns, and the rule above each is what makes them
            read as three of a kind rather than as a list that happens
            to wrap. `Rule` draws itself in from the left on arrival,
            so they land in sequence as the eye travels across. */}
        <ul className="mt-20 grid gap-x-8 gap-y-12 sm:mt-24 md:grid-cols-3">
          {promise.denials.map((denial, i) => (
            <li key={denial}>
              <Rule className="text-pure" start={`top ${90 - i * 3}%`} />
              <Lines
                as="p"
                className="t-sub mt-7 max-w-[26ch] text-fog"
                start="top 88%"
                delay={i * 0.12}
              >
                {denial}
              </Lines>
            </li>
          ))}
        </ul>

        {/* ---- The turn ----
            Given the width and the weight of a conclusion, because it
            is one. The cove phrase is the only colour in the section
            and it lands on the five words the page is actually about. */}
        <Lines
          as="p"
          className="t-chapter mt-20 max-w-[24ch] text-bone sm:mt-28"
          start="top 88%"
          stagger={0.1}
        >
          <span className="block">{promise.turn[0]}</span>
          <span className="block">
            <em className="italic-display text-cove">{promise.turn[1]}</em>
          </span>
        </Lines>
      </div>
    </section>
  )
}
