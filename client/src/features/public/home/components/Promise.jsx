import { useState } from 'react'
import { promise } from '@/features/public/data/site'
import { useGsapScope, gsap, SplitText, prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   02 — THE PROMISE

   Five statements, one at a time, centred on a black stage.

   WHY THIS SECTION IS TYPE AND NOTHING ELSE
   The page either side of it is loud on purpose: the hero is a
   scrubbed frame, <LightsDown> is a projector coming on, and
   Spaces and <Transform> carry their own sequences. If this
   section also had a picture in it, the first third of the site
   would be one continuous reveal and none of the reveals would
   land. So it has no image, no plate, no video and no colour
   until its last two words.

   WHY CENTRED
   Everything else on this site is set against the left rule —
   that column is the page's spine and it is what makes a long
   scroll feel engineered. This section leaves it, and it is the
   only section that does. A statement set on the axis has no
   column to belong to and nothing beside it to be measured
   against; it is simply the thing you are looking at. Used
   twice it would be a layout. Used once, on the one section
   that is nothing but its own argument, it is a title card.

   The composition is symmetrical top to bottom for the same
   reason: the label on the axis at the head, five chapter ticks
   on the axis at the foot, and the argument centred between
   them. Nothing in the frame is off-balance, which is most of
   the difference between quiet and empty.

   THE ARGUMENT, AS SCRUBBED POSITIONS

     .00  THE STATEMENT   luxury / without / comfort — and then
                          'is not' cuts across the sentence and
                          it resolves against itself.
     .30  PICTURE         a subject lands, holds, and is answered.
     .47  SOUND           the same shape. The repetition IS the
                          rhetoric: three of the same move is what
                          makes the fourth one a conclusion.
     .63  ROOM
     .81  THE TURN        everything else has gone. The denial,
                          then the answer, then the one line of
                          reasoning under it.

   THE MOTION IS A LENS, NOT A SLIDESHOW
   Every arrival on this stage resolves out of blur. That is not
   an effect picked for looking expensive — it is the one piece
   of behaviour a projector actually has, and this is the
   section that argues the brand starts before the equipment
   does. Words rise out of masks they cannot be seen above,
   their lines pull into focus, and each answer is already there
   at 7% before the light reaches it — its characters come up
   FROM THE CENTRE OUT, because the composition has a centre now
   and motion that ignores its own axis is what makes centred
   type look like a slide deck.

   The characters move no distance at all, only opacity. A
   per-character y offset on a centred block looks, at every
   frame except the last, like a sentence that has come apart —
   which is the one thing a brand statement cannot do.

   Nothing rotates, and no line of type parallaxes. The only
   scale on the words is a 1.5% settle, which reads as depth and
   never as a zoom.

   THE LIGHT BEHIND IT
   The stage is not a black backdrop that happens to hold five
   slides. There is a soft source behind the type that is
   re-aimed and re-lit for every act — see FIELD below — and it
   moves BEFORE each statement rather than with it, because in a
   real room the light arrives first and the thing it lights
   arrives second. A second, cooler source crosses it over the
   whole length of the pin and never stops, so a held frame is
   never a frozen one.

   Both are oversized, inset well past the frame, and moved with
   transform and opacity alone. Neither has an edge you can find.
   If you can point at the background of this section, it is
   wrong.

   GSAP, SPECIFICALLY
     · one scrubbed, pinned timeline — the section holds no state
     · SplitText chars with `stagger: { from: 'center' }`
     · `gsap.matchMedia` for the pin length, so a phone is not
       asked to scroll a desktop's distance
     · `autoSplit: false` on purpose — a re-split mid-scrub
       rebuilds a tween under a playhead already inside it and
       jumps. ScrollTrigger's own refresh covers the resize.

   THE CHAPTER TICKS
   A pin this long has to tell you it HAS a length and where in
   it you are, or the first held frame reads as a page that has
   stopped scrolling. Five ticks, one per act, lit one at a
   time. It is the only decoration in the section and it is
   doing a job.
   ============================================================ */

const D = promise

/* Act starts on the normalised (0 -> 1) scrub timeline. The three
   middle acts are identical in length on purpose: the reader learns
   the rhythm on PICTURE and can then trust it, which is what lets
   SOUND and ROOM be read rather than re-parsed.

   The spacing is not free. Each beat runs 0.125 and takes 0.035 to
   leave, so the next act cannot open before at + 0.16 without two
   statements dissolving through each other — which is exactly what
   it looks like. */
const ACT_AT = [0, 0.3, 0.465, 0.63, 0.81]
const BEAT_AT = [0.3, 0.465, 0.63]
const TURN_AT = 0.81

/* ---- The light behind the words ----
   One soft source, re-aimed and re-lit for every act, so the room the
   type is standing in changes with the argument instead of being a
   black backdrop that happens to hold five slides. It moves BEFORE
   each statement rather than with it — light first, then the thing it
   lights, which is the order it happens in a real room and the reason
   the section reads as lit rather than as animated.

   The states are aimed at the copy, not decorated around it:

     STATEMENT  high and tight — the sentence is the only thing here
     PICTURE    swings left, narrows. A picture is a place you look.
     SOUND      swings right and opens. Sound is the one of the three
                that fills a room rather than sitting in it.
     ROOM       centred and wide, the whole stage lit
     TURN       sinks and goes out, handing the frame to the cove —
                the only moment the section has warm light, on the
                only two words that have earned it.

   TRANSFORM AND OPACITY ONLY. The obvious way to build this is to
   tween the gradient's own `at X% Y%` position, and it is the wrong
   way: that repaints a full-viewport layer on every scroll frame.
   Painted once and moved on the compositor, the whole thing is free. */
const FIELD = [
  { xPercent: 0, yPercent: -11, scale: 0.88 },
  { xPercent: -8, yPercent: 2, scale: 0.74 },
  { xPercent: 8, yPercent: 2, scale: 0.9 },
  { xPercent: 0, yPercent: 7, scale: 1.02 },
  { xPercent: 0, yPercent: 20, scale: 1.14 },
]
const FIELD_LIGHT = [1, 0.95, 0.9, 0.85, 0]

/**
 * <Mask> — a word or a line that rises out of a box it cannot be seen
 * above. The `pb`/`-mb` pair is descender room: an `inline-block` with
 * `overflow: hidden` clips the tail of a 'y' and the overhang of an
 * italic serif otherwise, and the negative margin hands that room back
 * to the layout so the leading is unchanged.
 */
function Mask({ children, turn = false, className = '' }) {
  return (
    <span className="-mb-[0.14em] -mr-[0.08em] inline-block overflow-hidden pb-[0.14em] pr-[0.08em] align-bottom">
      <span data-rise data-turn={turn ? '' : undefined} className={`inline-block ${className}`}>
        {children}
      </span>
    </span>
  )
}

export default function Promise() {
  const [reduced] = useState(() => prefersReducedMotion())

  const root = useGsapScope(
    (el) => {
      if (reduced) return

      const q = (s) => el.querySelector(s)
      const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

      const statement = q('[data-act="statement"]')
      const statementType = q('[data-statement-type]')
      const words = qa('[data-act="statement"] [data-rise]')
      const beats = qa('[data-act="beat"]')
      const turn = q('[data-act="turn"]')
      const resolve = q('[data-resolve]')
      const glow = q('[data-glow]')
      const ticks = qa('[data-tick]')
      const field = q('[data-field]')
      const drift = q('[data-drift]')

      /* Split once, before any timeline exists, so the characters are
         real boxes by the time anything is asked to move them. */
      const splits = []
      const splitChars = (target) => {
        const s = SplitText.create(target, { type: 'chars', autoSplit: false })
        splits.push(s)
        return s.chars
      }

      const answers = beats.map((beat) => splitChars(beat.querySelector('[data-answer]')))
      const resolveChars = splitChars(resolve)

      const mm = gsap.matchMedia()

      mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767px)' }, (ctx) => {
        const { wide } = ctx.conditions

        /* The opening frame, written out in full rather than left to
           the markup: a refresh in the middle of the pin has to
           rebuild from a known state, not from wherever the playhead
           happened to leave things. */
        gsap.set([statement, ...beats, turn], { autoAlpha: 0, y: 0 })
        gsap.set(words, { yPercent: 112, xPercent: 0, autoAlpha: 1 })
        gsap.set(qa('[data-turn]'), { yPercent: 0, xPercent: -16, autoAlpha: 0 })
        gsap.set(qa('[data-subject] [data-rise], [data-lead] [data-rise]'), { yPercent: 112 })
        gsap.set(qa('[data-subject]'), { opacity: 1 })
        gsap.set(qa('[data-hair]'), { scaleX: 0, opacity: 0.25 })
        gsap.set(qa('[data-coda]'), { autoAlpha: 0, y: 14 })
        gsap.set([statementType, ...qa('[data-answer]'), resolve], { filter: 'blur(13px)' })
        gsap.set([...answers.flat(), ...resolveChars], { opacity: 0.07 })
        gsap.set(glow, { autoAlpha: 0 })
        gsap.set(ticks, { opacity: 0.14 })
        gsap.set(field, { ...FIELD[0], opacity: FIELD_LIGHT[0] })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            /* Absolute pixels from a function `end`, for the reason
               written down in <LightsDown>: a `+=N%` end resolves
               against the trigger's own height, which pinSpacing then
               grows by — so every refresh multiplies the pin again. */
            end: () => `+=${Math.round(window.innerHeight * (wide ? 3.6 : 2.8))}`,
            pin: '[data-stage]',
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        /* --- The chapter ticks, one lit at a time --------------- */
        ACT_AT.forEach((at, i) => {
          tl.to(ticks[i], { opacity: 0.85, duration: 0.02 }, at)
          if (i > 0) tl.to(ticks[i - 1], { opacity: 0.14, duration: 0.02 }, at)
        })

        /* --- The background, re-lit for every act --------------- */
        /* The second source never stops. It crosses the first one over
           the length of the whole pin, which is what stops five held
           frames on black from reading as five static slides — there
           is always something moving behind the words, and it is never
           the words. */
        tl.fromTo(
          drift,
          { xPercent: -12, yPercent: 12 },
          { xPercent: 12, yPercent: -9, duration: 1 },
          0,
        )

        /* Every step is written as a `fromTo` with the previous act's
           values spelled out. A chain of bare `to()`s re-reads its
           start from the live element on `invalidateOnRefresh`, and a
           refresh that lands mid-pin then records whatever frame the
           playhead was on as the beginning — after which the light
           never goes back. <LightsDown> carries the same note. */
        FIELD.forEach((state, i) => {
          if (i === 0) return
          const at = ACT_AT[i]
          const prev = FIELD[i - 1]

          tl.fromTo(field, { ...prev }, { ...state, duration: 0.1, ease: 'power2.inOut' }, at - 0.05)

          /* The dip. The light drops before it moves and comes back up
             on the new statement, which is a lighting cue rather than
             a cross-fade — the difference between a room changing and
             a slide changing. */
          tl.fromTo(
            field,
            { opacity: FIELD_LIGHT[i - 1] },
            { opacity: FIELD_LIGHT[i - 1] * 0.28, duration: 0.03, ease: 'power2.in' },
            at - 0.05,
          )
          tl.fromTo(
            field,
            { opacity: FIELD_LIGHT[i - 1] * 0.28 },
            { opacity: FIELD_LIGHT[i], duration: 0.06, ease: 'power2.out' },
            at - 0.02,
          )
        })

        /* --- ACT 01 · the statement builds ---------------------- */
        tl.to(statement, { autoAlpha: 1, duration: 0.02 }, 0)

        /* The lens finds the sentence while the sentence is still
           assembling — focus and build finish together rather than
           one waiting on the other. */
        tl.to(statementType, { filter: 'blur(0px)', duration: 0.2, ease: 'power2.out' }, 0.02)

        words.forEach((word, i) => {
          const at = 0.03 + i * 0.036
          /* The pivot arrives differently because it IS different: the
             sentence is running one way and these two words cut across
             it. Everything else rises; this one wipes in from the
             side, and it is the only italic on the stage. */
          if (word.dataset.turn !== undefined) {
            tl.to(word, { xPercent: 0, autoAlpha: 1, duration: 0.07, ease: 'power2.out' }, at)
          } else {
            tl.to(word, { yPercent: 0, duration: 0.055, ease: 'power3.out' }, at)
          }
        })

        /* Held, then gone. The exit is a fade and 40px — the statement
           does not need a second performance on its way out. */
        tl.to(statement, { autoAlpha: 0, y: -40, duration: 0.035, ease: 'power2.in' }, 0.245)

        /* --- ACTS 02-04 · picture, sound, room ------------------ */
        beats.forEach((beat, i) => {
          const at = BEAT_AT[i]
          const subject = beat.querySelector('[data-subject]')
          const subjectRise = beat.querySelector('[data-subject] [data-rise]')
          const hair = beat.querySelector('[data-hair]')
          const answer = beat.querySelector('[data-answer]')

          tl.to(beat, { autoAlpha: 1, duration: 0.02 }, at)
          tl.fromTo(beat, { scale: 0.985 }, { scale: 1, duration: 0.09, ease: 'power2.out' }, at)
          tl.to(subjectRise, { yPercent: 0, duration: 0.05, ease: 'power3.out' }, at)
          tl.to(hair, { scaleX: 1, duration: 0.06, ease: 'power2.out' }, at + 0.035)

          /* The gap between the two halves IS the beat. Land the
             subject, hold it for a scroll, and only then answer it.
             Close them up and the pair reads as one sentence that
             happens to be set in two sizes.

             The characters settle from the middle outward, so the
             answer grows along the same axis the composition is built
             on instead of sweeping across it. */
          tl.to(answer, { filter: 'blur(0px)', duration: 0.075, ease: 'power2.out' }, at + 0.055)
          tl.to(
            answers[i],
            {
              opacity: 1,
              duration: 0.06,
              stagger: { each: 0.0022, from: 'center' },
              ease: 'power3.out',
            },
            at + 0.055,
          )

          /* The setup steps back once it has been answered, so what
             you are left looking at is the payoff. */
          tl.to([subject, hair], { opacity: 0.3, duration: 0.035 }, at + 0.08)
          tl.to(beat, { autoAlpha: 0, y: -34, duration: 0.035, ease: 'power2.in' }, at + 0.125)
        })

        /* --- ACT 05 · the turn ---------------------------------- */
        tl.to(turn, { autoAlpha: 1, duration: 0.02 }, TURN_AT)
        tl.to(
          qa('[data-lead] [data-rise]'),
          { yPercent: 0, duration: 0.045, stagger: 0.022, ease: 'power3.out' },
          TURN_AT,
        )
        tl.to(
          resolve,
          { filter: 'blur(0px)', duration: 0.075, ease: 'power2.out' },
          TURN_AT + 0.045,
        )
        tl.to(
          resolveChars,
          {
            opacity: 1,
            duration: 0.065,
            stagger: { each: 0.0026, from: 'center' },
            ease: 'power3.out',
          },
          TURN_AT + 0.045,
        )

        /* The only colour in the section, arriving with the only two
           words that carry it. Slow, and never above a fifth of an
           opacity, so it reads as the room warming rather than as a
           light being switched on. */
        tl.to(glow, { autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, TURN_AT + 0.035)
        tl.to(qa('[data-coda]'), { autoAlpha: 1, y: 0, duration: 0.045 }, TURN_AT + 0.09)

        /* Nothing after 0.95. The last twentieth of the pin is a held
           frame on the finished statement — the pause before the page
           moves on, which is most of why it is pinned at all. */

        return () => tl.kill()
      })

      return () => {
        mm.revert()
        splits.forEach((s) => s.revert())
      }
    },
    [reduced],
  )

  /* ---------- Reduced motion: the same argument, standing still ----------
     The animated build stacks all five acts in one grid cell, which
     without a timeline to separate them is five statements printed on
     top of each other. So this branch is a different LAYOUT, not the
     same one with the tweens taken out. It keeps the centred axis,
     because that is a composition decision rather than a motion one. */
  if (reduced) {
    return (
      <section ref={root} id="promise" className="relative overflow-hidden bg-ink py-28 sm:py-36">
        {/* The same source, standing still. A section that is lit in
            one branch and flat black in the other is two sections. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[70%]"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 30%, rgba(255,247,236,0.06) 0%, rgba(255,247,236,0) 72%)',
          }}
        />
        <div className="shell-wide relative text-center">
          <span className="t-label text-mist">{D.label}</span>

          <h2 className="t-display mx-auto mt-14 max-w-[16ch] text-bone">
            {D.statement.map((line, i) => (
              <span key={i} className="block">
                {line.map((word) =>
                  word.turn ? (
                    <em key={word.w} className="italic-display text-pure">
                      {word.w}{' '}
                    </em>
                  ) : (
                    <span key={word.w}>{word.w} </span>
                  ),
                )}
              </span>
            ))}
          </h2>

          <ul className="mt-20 grid gap-x-10 gap-y-14 md:grid-cols-3">
            {D.beats.map((beat) => (
              <li key={beat.subject}>
                {/* An eye, an ear, a body. The three beats ARE the
                    three systems doing the experiencing — the ordinal
                    over each one was the only thing on this section
                    that did not say so. */}
                <Mark name={beat.icon} size={22} className="mx-auto text-ash" />
                <p className="t-heading italic-display mt-4 text-mist">{beat.subject}</p>
                <div className="mx-auto mt-6 h-px w-10 bg-pure opacity-20" aria-hidden="true" />
                <p className="t-heading mx-auto mt-6 max-w-[16ch] text-bone">
                  {beat.answer.join(' ')}
                </p>
              </li>
            ))}
          </ul>

          <p className="t-chapter italic-display mx-auto mt-24 max-w-[20ch] text-mist">
            {D.turn.lead.join(' ')}
          </p>
          <p className="t-chapter mx-auto mt-4 max-w-[18ch] text-bone">
            {D.turn.resolve[0]} <em className="italic-display text-cove">{D.turn.resolve[1]}</em>
          </p>
          <p className="t-sub mx-auto mt-8 max-w-[46ch] text-fog">{D.turn.coda}</p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={root}
      id="promise"
      aria-label="The promise"
      /* `isolate` so the pinned child keeps its own stacking context —
         without it Safari can paint it under the next section's
         background once the pin releases. */
      className="relative isolate bg-ink"
    >
      <div data-stage className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink">
        {/* ---- The room the type is standing in ----
            Two soft sources, both oversized and inset past the frame
            so their falloff is never a visible edge. Painted once,
            moved on the compositor: see the FIELD note above.

            `closest-side` rather than a percentage radius is what
            makes the gradient circular at every stage aspect — a
            two-value radius stretches into an ellipse the moment the
            window is not the shape it was designed on, and an ellipse
            of light reads as a shape rather than as light. */}
        <div
          data-field
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[22%] -inset-y-[22%]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(255,247,236,0.085) 0%, rgba(255,247,236,0.032) 40%, rgba(255,247,236,0) 72%)',
          }}
        />
        <div
          data-drift
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[18%] -inset-y-[18%]"
          style={{
            background:
              'radial-gradient(closest-side, rgba(222,228,240,0.05) 0%, rgba(222,228,240,0.018) 44%, rgba(222,228,240,0) 70%)',
          }}
        />

        {/* The warm light, held back until the last two words. On the
            axis, like everything else in the frame. */}
        <div
          data-glow
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              'radial-gradient(78% 52% at 50% 74%, rgba(201,173,124,0.19) 0%, rgba(201,173,124,0.06) 38%, rgba(0,0,0,0) 72%)',
          }}
        />

        {/* A vignette, at the strength where you would only notice it
            if it were removed. Centred type on flat black reads as a
            slide; centred type with the corners falling away reads as
            a frame. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 88% at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* The whole argument, for anything that reads the page rather
            than scrolls it. Every act below is hidden until the
            timeline reaches it, so this is what a section summary has
            to be built out of. */}
        <h2 className="sr-only">
          Luxury without comfort is not luxury. We don’t start with the technology. We start with
          you.
        </h2>

        <div className="relative flex h-full flex-col py-14 text-center sm:py-16">
          <header className="shell-wide shrink-0">
            <span className="t-label block text-mist">{D.label}</span>
          </header>

          {/* Every act occupies the same cell. They replace each other
              in place rather than scrolling past one another, which is
              what makes the section read as one voice changing its
              mind rather than as a list going by. */}
          <div className="shell-wide grid flex-1 content-center">
            {/* ---- ACT 01 · the statement ---- */}
            <div
              data-act="statement"
              className="self-center [grid-area:1/1]"
              style={{ visibility: 'hidden' }}
            >
              <p data-statement-type className="t-cinema mx-auto max-w-[16ch] text-bone">
                {D.statement.map((line, i) => (
                  <span key={i} className="block">
                    {line.map((word, j) => (
                      <span key={word.w}>
                        <Mask
                          turn={word.turn}
                          className={word.turn ? 'italic-display text-pure' : ''}
                        >
                          {word.w}
                        </Mask>
                        {j < line.length - 1 ? ' ' : null}
                      </span>
                    ))}
                  </span>
                ))}
              </p>
            </div>

            {/* ---- ACTS 02-04 · the three beats ---- */}
            {D.beats.map((beat) => (
              <div
                key={beat.subject}
                data-act="beat"
                className="self-center [grid-area:1/1]"
                style={{ visibility: 'hidden' }}
              >
                <Mark name={beat.icon} size={22} className="mx-auto text-ash" />
                <p data-subject className="t-heading italic-display mt-4 text-mist sm:mt-5">
                  <Mask>{beat.subject}</Mask>
                </p>
                {/* The one rule in the section, drawn from its own
                    middle. It is the joint the copy is split at, made
                    visible for as long as the split matters. */}
                <div
                  data-hair
                  aria-hidden="true"
                  className="mx-auto mt-6 h-px w-12 bg-pure sm:mt-8"
                />
                <p data-answer className="t-stop mx-auto mt-6 max-w-[18ch] text-bone sm:mt-8">
                  {beat.answer.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            ))}

            {/* ---- ACT 05 · the turn ---- */}
            <div
              data-act="turn"
              className="self-center [grid-area:1/1]"
              style={{ visibility: 'hidden' }}
            >
              <p
                data-lead
                /* Height-aware, unlike `t-heading`, because this act is
                   the tallest on the stage: lead, resolve and reasoning
                   all at once. Sized off width alone it runs the coda
                   into the chapter ticks on a short laptop. */
                className="font-display italic-display mx-auto max-w-[20ch] text-mist text-[clamp(1.3rem,min(3.1vw,5vh),2.9rem)] leading-[1.05] tracking-[-0.02em]"
              >
                {D.turn.lead.map((line) => (
                  <span key={line} className="block">
                    <Mask>{line}</Mask>
                  </span>
                ))}
              </p>
              <p data-resolve className="t-cinema mx-auto mt-5 max-w-[13ch] text-bone sm:mt-7">
                <span className="block">{D.turn.resolve[0]}</span>
                <span className="italic-display block text-cove">{D.turn.resolve[1]}</span>
              </p>
              <p data-coda className="t-body mx-auto mt-7 max-w-[42ch] text-fog sm:mt-9">
                {D.turn.coda}
              </p>
            </div>
          </div>

          {/* Five ticks, one per act, lit one at a time — where you are
              in the pin, and how much of it is left. */}
          <footer className="shell-wide flex shrink-0 items-center justify-center gap-2">
            {ACT_AT.map((at) => (
              <span key={at} data-tick className="block h-px w-6 bg-bone opacity-15" />
            ))}
          </footer>
        </div>
      </div>
    </section>
  )
}
