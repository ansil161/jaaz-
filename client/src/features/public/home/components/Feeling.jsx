import { feelings } from '@/features/public/data/site'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import FeelingBand from './feeling/FeelingBand'

/* ============================================================
   CH. 07 — THE BRIEF
   What do you want to feel?

   The one section on the page that starts from the visitor rather
   than from the room. Six feelings, and the kind of room that
   answers each.

   ------------------------------------------------------------
   IT IS A STACK, AT ANSIL'S INSTRUCTION, AND IT IS NOW THE ONLY
   ONE

   This was a press-driven selector: six words at display size
   with a warm rule sliding between them, and one photograph
   swapping underneath. It was rebuilt as a stack of bands to
   match <Prism>, which held slot 07 at the time — one stacking
   mechanism used twice reads as a system, where two different
   ones read as two people having worked on the page.

   PRISM HAS SINCE COME OFF (2026-09-02, replaced by <Scene>), so
   the pairing that motivated the change no longer exists and this
   section inherited the whole band system. The rules were renamed
   `.prism-*` -> `.band-*` in one pass at the same time; see the
   header over them in site.css. Nothing about the section's
   appearance changed with either event, which is the point of a
   layout system having its own name.

   Whether a lone stack still earns the six viewports it costs is
   now a live question rather than a settled one, and it is
   ansil's to answer. The argument for keeping it is in the next
   paragraph; the argument against is that it is the page's only
   remaining scroll-driven presentation of a list.

   WHAT THE STACK COSTS, NAMED. A stack is scrolled, not pressed,
   so the visitor does not choose which feeling to see — they are
   shown all six in a fixed order. The order in `states` is what
   pays that back: it runs from the most enclosed room to the most
   open, so scrolling the section is itself the argument that
   these are one range and not six products.

   The homepage no longer loses a pressable control by this being
   a stack: <Scene> at slot 07 is driven entirely by presses, and
   Chapter 04's seat matrix is the other.

   ------------------------------------------------------------
   THE STACK IS CSS. THE SCRIPT ONLY ADDS DEPTH.

   `position: sticky` on every card at the same `top`, inside
   slots taller than the cards, is the whole mechanism. It works with no JavaScript, it
   survives a failed bundle, and it needs no pin, no scrub and no
   measured height.

   GSAP does one thing on top of it: as a card is covered it
   recedes, scaling down a couple of per cent and dimming, so the
   pile reads as physical rather than as a stack of decals. Delete
   every ScrollTrigger below and the section still works; it just
   goes flat.

   TWO ELEMENTS PER CARD, AND THE REASON IS `sticky`. The slot is
   the sticky positioner and `[data-card]` is what moves. They
   cannot be the same element: a transform on a `position: sticky`
   box re-bases the containing block it sticks within, so the
   stick point drifts by however far the card has been scaled and
   the pile slides out of register.

   REDUCED MOTION GETS THE SAME SECTION, UNSTACKED. No sticky, no
   recede: six bands in a column, read one after another. The
   stack is a way of presenting six things that are already in the
   document in the right order, so taking it away costs the
   presentation and none of the content.
   ============================================================ */

/* How much taller each slot is than the card inside it. At 1 a
   card would be covered the instant it finished arriving, so
   there would be no frame where a face is simply on screen being
   itself; much past 1.4 and six short sentences outstay their
   welcome.

   1.1 rather than 1.18, which is the number the band system was
   written with: this section has SIX faces, and it was set low
   while a five-face stack ran on the same homepage. That stack
   (<Prism>) is gone, so there is now room to raise it if the
   section reads as rushed — it is the section's pacing dial and
   the only number in this file that is a taste decision rather
   than a measurement. */
const DWELL = 1.1

export default function Feeling() {
  const root = useGsapScope((el) => {
    if (prefersReducedMotion()) return

    const slots = gsap.utils.toArray(el.querySelectorAll('[data-slot]'))
    const cards = slots.map((s) => s.querySelector('[data-card]'))

    const mm = gsap.matchMedia()

    mm.add('(min-width: 768px)', () => {
      /* THE LAST CARD NEVER RECEDES. Nothing covers it, so
         animating it would dim the face the section ends on for no
         reason a visitor could see the cause of. */
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
                 far the card above it has travelled. */
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

    /* The copy arrives once, as its band does. `once` rather than a
       scrub: a line that re-animates every time its card is
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
      id={feelings.id}
      aria-label={feelings.heading.join(' ')}
      /* `isolate` so the stack keeps its own stacking context —
         without it the sticky cards can be painted under the next
         section's background the moment the stack releases. */
      className="band-section relative isolate bg-ink"
    >
      <header className="shell-wide pt-[clamp(4.5rem,12vh,8rem)] pb-[clamp(2rem,5vh,3.5rem)]">
        <span className="t-label flex items-center gap-3 text-fog">
          {feelings.chapter}
          <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
          {feelings.label}
        </span>

        <div className="mt-[clamp(1.5rem,4vh,2.75rem)] flex flex-col gap-[clamp(1rem,3vh,2rem)] lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <h2 className="band-claim text-pure">
            {feelings.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
              </span>
            ))}
          </h2>
          <div className="lg:pb-[0.6em]">
            <p className="t-body max-w-[38ch] text-fog">{feelings.intro}</p>
            <p className="mt-3 max-w-[42ch] text-[0.8125rem] leading-relaxed text-mist">
              {feelings.note}
            </p>
          </div>
        </div>
      </header>

      {/* One slot per feeling. The slot carries the scroll distance;
          the card inside it sticks.

          `zIndex` ASCENDS WITH THE INDEX and is not decoration:
          sticky elements paint in DOM order, so without it a later
          card would slide UNDER the one it is supposed to be
          covering — which looks like the stack running backwards. */}
      <div className="band-stack">
        {feelings.states.map((state, i) => (
          <div
            key={state.key}
            data-slot
            style={{ '--dwell': DWELL, zIndex: i + 1 }}
            className="band-slot"
          >
            <FeelingBand state={state} index={i} count={feelings.states.length} />
          </div>
        ))}
      </div>
    </section>
  )
}
