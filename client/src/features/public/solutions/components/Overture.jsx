import { useState } from 'react'
import { solutionsIndex } from '@/features/public/data/solutions'
import { useGsapScope, gsap, SplitText, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   SOLUTIONS — THE OVERTURE

   The pinned opening. Three statements on one stage, each one
   spoken word by word by the scroll, the third of them on a
   sheet of paper that opens out of the black.

   WHAT THE MOTION IS
   A statement is WRITTEN by the scroll. Every word holds its
   final box from the first frame and starts at nothing, and
   scrolling brings them up left to right with a trail of three
   or four still mid-fade behind the head of the sentence — solid,
   then grey, then gone. That trail is the whole effect: one word
   at a time is a teleprompter, all of them at once is a fade-in,
   and a running edge with a falloff behind it is what a sentence
   looks like while it is being said. Scroll back up and it
   un-says itself, which is the difference between a scrubbed
   statement and a triggered one.

   Nothing is pre-drawn. See DIM below for why the dim-floor
   version of this — the whole sentence sitting there in grey,
   lighting up — is a different and worse effect.

   Nothing moves. No word rises, nothing parallaxes, nothing
   scales. <Promise> has the note on why per-word travel on
   centred type looks, at every frame but the last, like a
   sentence that has come apart — the same applies here and the
   fix is the same: opacity carries all of it.

   THE TURN IS TONAL, NOT KINETIC
   Acts one and two are bone on ink. Act three opens a sheet of
   the house paper stock — the same `.sheet` the Calibration
   section is printed on — and is set in ink on it. The page
   turns the lights up for the only line that corrects the
   reader, and that inversion is the only colour change in the
   section. The sheet opens on scaleY from its own centre, which
   is a screen coming down, not a card fading in.

   WHY THIS AND NOT THE OLD HERO
   The section it replaces was a headline, two paragraphs and a
   meta line on a soft wash — correct, and completely silent. It
   said "nine ways to build the room you want" and then asked
   you to take that on trust for nine cards. This says the same
   words and makes the reader assemble them, and it arrives at
   the grid having already answered the question the grid is
   there to answer.

   The long `statement` and the `meta` line did not go anywhere.
   They sit in the band the pin releases into, below.

   GSAP, SPECIFICALLY
     · one scrubbed, pinned timeline — the section holds no state
     · SplitText type:'words', `autoSplit: false` on purpose. A
       re-split mid-scrub rebuilds a tween under a playhead
       already inside it and jumps; words are inline-block spans
       and re-wrap on their own, so nothing is lost by it.
     · `gsap.matchMedia` for the pin length — a phone is not
       asked to scroll a desktop's distance
     · every step is a `fromTo` with its start spelled out, so an
       `invalidateOnRefresh` mid-pin rebuilds from a known frame
       rather than from whatever the playhead was sitting on
     · absolute pixels from a function `end`: a `+=N%` end
       resolves against the trigger's own height, which pinSpacing
       then grows by, so every refresh multiplies the pin
   ============================================================ */

const D = solutionsIndex.overture

/* Act positions on the normalised (0 -> 1) scrub timeline.

   `light` is the window the words are read in, `out` is where the
   statement clears. Act one gets a shorter read than act two because
   it is the one the reader has not learned the rhythm on yet and a
   long first sentence at an unfamiliar rate feels stuck; act three
   gets the longest and never clears, because the pin ends on it.

   The gap between an `out` and the next `light` is 0.06 — enough
   that two statements are never legible at once, which is the one
   thing that would make this read as a slideshow. */
const ACTS = [
  { light: [0.02, 0.26], out: 0.32 },
  { light: [0.38, 0.62], out: 0.68 },
  { light: [0.8, 0.97], out: null },
]

/* The sheet opens in the gap after act two, and is fully open before
   act three's first word lights. A word arriving on a surface that is
   still moving is the frame this section cannot have. */
const SHEET_AT = 0.66

/* An unread word is not there.

   The obvious build — and the first one written here — lays the whole
   sentence out at a dim floor and lights it up. It is the wrong
   effect, and the difference is the whole point: ghost text lets you
   read the end of the sentence before the beginning has been said, so
   the scroll is decorating something you have already finished. At
   zero, the statement is being WRITTEN, and the only thing you can
   read is the part that has arrived.

   The layout is still the finished sentence's — every word occupies
   its final box from the first frame, invisible. Nothing re-centres,
   nothing reflows, no line jumps when it gains a word. That is what
   separates this from a typewriter. */
const DIM = 0

/* How many words are mid-fade at any frame.

   This is the number that carries the effect, and it is high on
   purpose. At 1 the words tick on like a counter. At 4 there is a
   TRAIL: the head of the sentence is solid, and three or four words
   behind it fall away through grey to nothing — which is what a
   sentence looks like while it is being said, and which no amount of
   easing on a one-word-at-a-time reveal will produce.

   GSAP's total for a staggered tween is `duration + each * (n - 1)`.
   Pinning that to `span` and asking for OVERLAP words in flight:

     duration = OVERLAP * each
     span     = each * (OVERLAP + n - 1)

   so `each` falls out of the word count, and a four-word statement
   and a nine-word one read at the same rate over the same distance
   instead of the short one being over before you started. */
const OVERLAP = 4

function ramp(count, span) {
  const each = span / (count - 1 + OVERLAP)
  return { each, duration: each * OVERLAP }
}

export default function Overture() {
  const [reduced] = useState(() => prefersReducedMotion())

  const root = useGsapScope(
    (el) => {
      if (reduced) return

      const q = (s) => el.querySelector(s)
      const acts = gsap.utils.toArray(el.querySelectorAll('[data-act]'))
      const sheet = q('[data-sheet]')
      const field = q('[data-field]')

      /* Split before any timeline exists, so the words are real boxes
         by the time anything is asked to fade them. */
      const splits = acts.map((act) =>
        SplitText.create(act.querySelector('[data-line]'), { type: 'words', autoSplit: false }),
      )

      const mm = gsap.matchMedia()

      mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767px)' }, (ctx) => {
        const { wide } = ctx.conditions

        /* The opening frame, written out rather than left to the
           markup — see the refresh note at the top of the file. */
        gsap.set(acts, { autoAlpha: 0 })
        gsap.set(acts[0], { autoAlpha: 1 })
        splits.forEach((s) => gsap.set(s.words, { opacity: DIM }))
        gsap.set(sheet, { scaleY: 0, transformOrigin: '50% 50%' })
        gsap.set(field, { opacity: 0.55, xPercent: -6 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * (wide ? 3.2 : 2.6))}`,
            pin: '[data-stage]',
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        /* --- The light behind the words -------------------------
           One soft source, crossing the stage over the whole length
           of the pin and never stopping, so a held statement is
           never a frozen frame. Transform and opacity only: the
           gradient is painted once and moved on the compositor. */
        tl.fromTo(field, { xPercent: -6 }, { xPercent: 6, duration: 1 }, 0)

        /* --- The three statements ------------------------------- */
        ACTS.forEach((act, i) => {
          const words = splits[i].words
          const [from, to] = act.light
          const r = ramp(words.length, to - from)

          if (i > 0) {
            tl.fromTo(acts[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, from - 0.04)
          }

          tl.fromTo(
            words,
            { opacity: DIM },
            {
              opacity: 1,
              duration: r.duration,
              stagger: { each: r.each, ease: 'none' },
            },
            from,
          )

          if (act.out !== null) {
            tl.fromTo(
              acts[i],
              { autoAlpha: 1 },
              { autoAlpha: 0, duration: 0.045, ease: 'power2.in' },
              act.out,
            )
          }
        })

        /* --- The sheet ------------------------------------------
           A screen coming down: it opens from its own centre line,
           faster out than in, and the field behind it drops away as
           it arrives so the black around the paper reads as unlit
           rather than as a second colour. */
        tl.fromTo(
          sheet,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.1, ease: 'power3.inOut' },
          SHEET_AT,
        )
        tl.fromTo(field, { opacity: 0.55 }, { opacity: 0.16, duration: 0.1 }, SHEET_AT)

        return () => tl.kill()
      })

      return () => {
        mm.revert()
        splits.forEach((s) => s.revert())
      }
    },
    [reduced],
  )

  /* ---- No pin, no scrub, no stage. The three statements as three
       statements, the third still on its sheet, because the tonal
       turn is composition rather than motion and survives without
       any of this running. ---- */
  if (reduced) {
    return (
      <section id="overture" className="relative bg-ink pt-40 pb-24 sm:pt-48">
        <div className="shell-wide flex flex-col items-center text-center">
          <p className="t-label text-mist">{D.label}</p>
          <h1 className="t-cinema mt-12 max-w-[19ch] text-bone">{D.acts[0]}</h1>
          <p className="t-cinema mt-16 max-w-[19ch] text-bone">{D.acts[1]}</p>
          <div className="sheet mt-16 w-full max-w-[72rem] px-[8%] py-20">
            <p className="t-chapter mx-auto max-w-[20ch] text-ink">{D.acts[2]}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={root}
      id="overture"
      aria-label="Nine ways to build the room you want"
      /* `isolate` so the pinned child keeps its own stacking context —
         without it Safari can paint it under the next section's
         background once the pin releases. */
      className="relative isolate bg-ink"
    >
      <div data-stage className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink">
        {/* The room the type is standing in. Oversized and inset well
            past the frame so its falloff is never a findable edge, and
            `closest-side` rather than a percentage radius so it stays
            circular at every stage aspect — a two-value radius
            stretches into an ellipse the moment the window is not the
            shape it was designed on, and an ellipse of light reads as
            a shape rather than as light. */}
        <div
          data-field
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[24%] -inset-y-[24%]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(255,247,236,0.09) 0%, rgba(255,247,236,0.03) 42%, rgba(255,247,236,0) 72%)',
          }}
        />

        {/* A vignette at the strength you would only notice if it were
            removed. Centred type on flat black reads as a slide;
            centred type with the corners falling away reads as a
            frame. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(78% 62% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        <p className="t-label absolute inset-x-0 top-28 z-20 text-center text-mist sm:top-32">
          {D.label}
        </p>

        {/* Acts one and two share one centred cell. Both are in the
            DOM from the start and both are readable to a screen
            reader; only the lighting is scrubbed. */}
        <h1
          data-act
          className="absolute inset-0 z-10 grid place-items-center px-[var(--gutter)]"
        >
          <span data-line className="t-cinema block max-w-[19ch] text-center text-bone">
            {D.acts[0]}
          </span>
        </h1>

        <p data-act className="absolute inset-0 z-10 grid place-items-center px-[var(--gutter)]">
          <span data-line className="t-cinema block max-w-[19ch] text-center text-bone">
            {D.acts[1]}
          </span>
        </p>

        {/* The sheet. The paper is its own layer so the scaleY that
            opens it never touches the type standing on it — a panel
            that squashes its own words while it arrives is the tell
            that it is a div and not a screen. */}
        <div className="absolute inset-0 z-10 grid place-items-center px-[var(--gutter)]">
          <div className="relative h-[min(30rem,56vh)] w-full max-w-[72rem]">
            <div data-sheet aria-hidden="true" className="sheet absolute inset-0" />
            <p
              data-act
              className="absolute inset-0 grid place-items-center px-[7%] text-center"
            >
              <span data-line className="t-chapter block max-w-[20ch] text-ink">
                {D.acts[2]}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
