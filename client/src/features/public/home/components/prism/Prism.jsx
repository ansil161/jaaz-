import { prism, prismModes } from '@/features/public/data/prism'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import PrismBand from './PrismBand'

/* ============================================================
   THE PRISM

   One room. Different worlds.

   Five wide bands, one per atmosphere, that STACK: each sticks
   under the header while the next slides up and covers it. The
   band you are leaving is still there, directly beneath the one
   arriving, for the whole length of the transition — which is
   why this mechanism suits this claim and a carousel would not.
   A section arguing that one room becomes five things should put
   two of them edge to edge and let you look.

   ------------------------------------------------------------
   THE STACK IS CSS. THE SCRIPT ONLY ADDS DEPTH.

   `position: sticky` on every card, at the same `top`, inside
   slots taller than the cards, is the entire mechanism. It works
   with no JavaScript at all, it survives a failed bundle, and it
   needs no pin, no scrub and no measured height — which is why
   this section is now a fraction of the code the pinned build
   was.

   GSAP does one thing on top of it: as a card is covered it
   recedes, scaling down a couple of per cent and dimming, so the
   pile reads as physical rather than as a stack of decals.
   Delete every ScrollTrigger below and the section still works
   correctly; it just goes flat.

   ------------------------------------------------------------
   TWO ELEMENTS PER CARD, AND THE REASON IS `sticky`

   The slot is the sticky positioner and `[data-card]` is what
   moves. They cannot be the same element: a transform on a
   `position: sticky` box re-bases the containing block it sticks
   within, so the stick point drifts by however far the card has
   been scaled and the whole pile slides out of register. Two
   elements, one job each, and the transform composes.

   ------------------------------------------------------------
   REDUCED MOTION GETS THE SAME SECTION, UNSTACKED

   No sticky, no recede: five bands in a column, read one after
   another. Nothing is hidden and nothing is explained away — the
   stack is a way of presenting five things that are already in
   the document in the right order, so taking it away costs the
   presentation and none of the content.
   ============================================================ */

/* How much taller each slot is than the card inside it. At 1 a
   card would be covered the instant it finished arriving, so
   there would be no frame where a face is simply on screen being
   itself; much past 1.4 and the section outstays five short
   sentences. This is the section's pacing dial, and the only
   number in this file that is a taste decision rather than a
   measurement. */
const DWELL = 1.18

export default function Prism() {
  const root = useGsapScope((el) => {
    if (prefersReducedMotion()) return

    const slots = gsap.utils.toArray(el.querySelectorAll('[data-slot]'))
    const cards = slots.map((s) => s.querySelector('[data-card]'))

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      /* THE LAST CARD NEVER RECEDES. Nothing covers it, so
         animating it would dim the face the section ends on for
         no reason a visitor could see the cause of. */
      const tweens = slots.slice(0, -1).map((slot, i) =>
        gsap.fromTo(
          cards[i],
          { scale: 1, opacity: 1 },
          {
            scale: 0.94,
            opacity: 0.45,
            ease: 'none',
            scrollTrigger: {
              /* Driven by the NEXT slot, not by this one. What
                 happens to this card is entirely a function of how
                 far the card above it has travelled; tying it to
                 anything else puts the recede out of step with the
                 thing causing it. */
              trigger: slots[i + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: 0.4,
            },
          },
        ),
      )

      return () => tweens.forEach((t) => t.kill())
    })

    /* The copy arrives once, as its band does. `once` rather than
       a scrub: a line that re-animates every time its card is
       uncovered on the way back up is a line that never settles. */
    const reveals = slots
      .map((slot) => {
        const lines = slot.querySelectorAll('[data-rise]')
        if (!lines.length) return null
        return gsap.from(lines, {
          autoAlpha: 0,
          y: 24,
          duration: 1,
          stagger: 0.08,
          ease: 'jaz',
          scrollTrigger: { trigger: slot, start: 'top 72%', once: true },
        })
      })
      .filter(Boolean)

    return () => {
      mm.revert()
      reveals.forEach((r) => r.kill())
    }
  }, [])

  return (
    <section
      ref={root}
      id={prism.id}
      aria-label="One room, different worlds"
      /* `isolate` so the stack keeps its own stacking context —
         without it the sticky cards can be painted under the next
         section's background the moment the stack releases. */
      className="prism-scene relative isolate bg-ink"
    >
      {/* ---- The claim, once, above the stack ----
          THE TOP PADDING CLEARS THE NAV. The site's bar is `py-4`
          around an `h-9` mark on a phone (68px) and measures
          85.5px above `sm`. This section no longer pins, so the
          header only has to clear it on arrival rather than for
          the whole scroll — but the cards below stick UNDER that
          bar, which is what `--prism-top` in site.css is for. */}
      <header className="shell-wide pt-[clamp(4.5rem,12vh,8rem)] pb-[clamp(2rem,5vh,3.5rem)]">
        <span className="t-label flex items-center gap-3 text-fog">
          {prism.chapter}
          <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
        </span>

        <div className="mt-[clamp(1.5rem,4vh,2.75rem)] flex flex-col gap-[clamp(1rem,3vh,2rem)] lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <h2 className="prism-claim text-pure">
            {prism.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
              </span>
            ))}
          </h2>
          <p className="t-body max-w-[38ch] text-fog lg:pb-[0.6em]">{prism.intro}</p>
        </div>
      </header>

      {/* ---- The stack ----
          One slot per face. The slot carries the scroll distance;
          the card inside it sticks. See the header for why they
          have to be two elements.

          `zIndex` ASCENDS WITH THE INDEX and is not decoration:
          sticky elements paint in DOM order, so without it a
          later card would slide UNDER the one it is supposed to
          be covering — which looks like the stack running
          backwards. */}
      <div className="prism-stack">
        {prismModes.map((mode, i) => (
          <div
            key={mode.key}
            data-slot
            style={{ '--dwell': DWELL, zIndex: i + 1 }}
            className="prism-slot"
          >
            <PrismBand mode={mode} index={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
