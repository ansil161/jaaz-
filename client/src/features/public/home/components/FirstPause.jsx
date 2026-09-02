import { firstPause } from '../../data/site'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'
import { useCueAudio, createCueTrack } from '../../lib/useCueAudio'

/* ============================================================
   02 — THE FIRST PAUSE

   The hero ends on a finished room. This is the cut to black
   immediately after it.

   THE ONE IDEA
   Everything on this site so far has been a room to look at.
   This section removes the room. No image, no video, no card,
   no gradient, no rule, no furniture of any kind — one sentence
   at a time on near-black, at a pace the visitor sets with their
   own scroll. It is the only section on the homepage that is
   entirely typography, and that is the argument: a brand that
   understands cinema knows when to stop showing you things.

   WHY THE STATEMENT IS THE HERO'S HEADLINE AGAIN
   Deliberate. In the hero the sentence is said over a lit room,
   which softens it into a caption. Here there is nothing to look
   at while it is said, so it has to be read. Same words, opposite
   effect — that is the whole reason this section exists rather
   than opening with new copy.

   THE SHAPE, as scrubbed positions on one timeline:

     .00  BLACK        nothing. A full fifth of the pin spent on
                       an empty frame, so the hero is genuinely
                       over before anything else begins.
     .20  FIRST LINE   `Entertainment without` resolves.
     .35  SECOND LINE  `comfort is just noise.` — `noise.` alone
                       carries the italic and the pure white.
     .45  THE PAUSE    everything leaves and the frame goes black
                       again, in silence. This gap is load-bearing:
                       it is what makes the six words that follow
                       read as a second movement rather than as
                       the next paragraph.
     .55  THE SIX      Picture / Sound / Acoustics / Comfort /
                       Control / Calibration, one at a time, each
                       landing in a different part of the frame.
                       Never two settled at once, never a grid.
     .96  THE PAYOFF   `Everything works as one.`, the largest type
                       in the section, held to the end of the pin.

   WHY ONE ABSOLUTE LAYER PER WORD
   The six words are stacked in the same stage, each in its own
   full-bleed flex layer with its own alignment. Placement is
   therefore flexbox, not percentage offsets — the word can never
   be pushed past a gutter and the section can never scroll
   sideways, at any width. The static vertical offset lives on the
   WRAPPER and the animated `y` on the inner span, so the two
   never fight over one transform.

   SOUND
   Eight marks across the pin, each firing once, on the way down
   only. The audio layer is in lib/useCueAudio.js and knows
   nothing about this section; this file knows nothing about
   autoplay policy. If sound never plays — blocked, declined, or
   switched off — not one frame of the above changes.
   ============================================================ */

const D = firstPause
const F = D.sound.files

/* ---- Pin length -------------------------------------------------
   Multiples of the viewport ON TOP of the one-screen stage, so the
   section occupies ~6x screen on desktop and ~4.6x on a phone. The
   spec asked for 500–700vh; the phone gets less because a thumb
   covers the same fraction of a timeline in far fewer gestures, and
   a pin that outlasts the visitor's patience is not a slow section,
   it is a stuck one. */
const PIN = { wide: 5, narrow: 3.6 }

/* ---- Where each of the six words lands --------------------------
   `j` is horizontal alignment from `md` up. Below that everything
   collapses to the left gutter: alternating alignment on a 390px
   screen reads as a layout fault, not as composition.

   `y` is a fraction of the stage height, applied to the wrapper as a
   static transform. Kept inside ±0.14 so no word can ever collide
   with the fixed nav or fall off the bottom edge.

   The 0.08em of right padding on the two right-aligned words is
   optical, not layout: every one of these ends in a full stop, and a
   period set flush to a gutter reads as a word that has been cut off
   rather than as one that has been aligned. */
const PLACE = {
  center: { j: 'md:justify-center', y: 0 },
  'right-high': { j: 'md:justify-end md:pr-[0.08em]', y: -0.13 },
  'left-low': { j: 'md:justify-start', y: 0.12 },
  'center-high': { j: 'md:justify-center', y: -0.08 },
  left: { j: 'md:justify-start', y: 0.02 },
  'right-low': { j: 'md:justify-end md:pr-[0.08em]', y: 0.1 },
}

/* ---- The six bands ----------------------------------------------
   Each word owns a slice of the back half of the timeline. Within a
   band: in over the first third, held through the middle, out across
   the last third — so the exit of one word IS the entrance of the
   next, and there is never a dead frame between them. The only true
   blackout in the section is the deliberate one at .45. */
const BANDS = [
  [0.55, 0.62],
  [0.62, 0.69],
  [0.69, 0.76],
  [0.76, 0.83],
  [0.83, 0.9],
  [0.9, 0.958],
]

/* ---- Sound -------------------------------------------------------
   Volumes are the peak each cue is allowed to reach, all of them low
   enough that the section is felt rather than heard. `offset` and
   `duration` trim the file to the moment it is marking: the pulse is
   sixteen seconds long and is used three times, so each use takes a
   different window out of it rather than replaying the same three
   seconds — which is what would make it read as a loop.

   `solo` on the closing hit fades everything still ringing before it
   speaks, because the last sound of the section has to arrive into
   silence to land at all. */
const CUES = {
  pulse: { src: F.pulse, volume: 0.11, offset: 0.4, duration: 3.4, fadeIn: 0.9, fadeOut: 1.4 },
  hit: { src: F.hit, volume: 0.19, fadeIn: 0.02, fadeOut: 0.35 },
  pulseLow: { src: F.pulse, volume: 0.085, offset: 5.2, duration: 3, fadeIn: 0.85, fadeOut: 1.3 },
  sub: { src: F.sub, volume: 0.13, offset: 0.04, duration: 2.4, fadeIn: 0.12, fadeOut: 1.1 },
  whoosh: { src: F.whoosh, volume: 0.1, duration: 2.8, fadeIn: 0.25, fadeOut: 0.9 },
  click: { src: F.click, volume: 0.13, fadeIn: 0.005, fadeOut: 0.2 },
  pulseFaint: { src: F.pulse, volume: 0.075, offset: 10, duration: 2.6, fadeIn: 0.9, fadeOut: 1.2 },
  resonance: {
    src: F.resonance,
    volume: 0.17,
    duration: 2.3,
    fadeIn: 0.04,
    fadeOut: 1,
    solo: true,
  },
}

/* Scroll positions, exactly as choreographed against the visual
   bands above. `hush` is not a file — it is the instruction that
   makes the .45 pause genuinely silent instead of merely quiet,
   by fading the bass hit's tail before the frame goes black. */
const MARKS = [
  { at: 0.25, cue: 'pulse' },
  { at: 0.4, cue: 'hit' },
  { at: 0.455, cue: 'hush' },
  { at: 0.58, cue: 'pulseLow' },
  { at: 0.65, cue: 'sub' },
  { at: 0.72, cue: 'whoosh' },
  { at: 0.86, cue: 'click' },
  { at: 0.93, cue: 'pulseFaint' },
  { at: 0.98, cue: 'resonance' },
]

/* Three display steps, all above `t-mega`, and the order is the
   argument: the six principles are set LARGER than the statement
   that introduced them, and the payoff larger again. Nothing else
   shares this stage, so type here can be sized the way a title card
   is rather than the way a heading is.

   MEASURED, NOT GUESSED. Instrument Serif runs about 0.34em per
   character — appreciably narrower than a text serif — which is why
   an earlier, more cautious scale left a 44px statement stranded in
   the middle of a phone. Each floor is the largest size at which the
   longest authored line in that role (`Entertainment without`,
   `Calibration.`, `Everything works`) still clears both gutters at
   360px, so nothing wraps that was not written to wrap.

   `min(Xvw, Yvh)` is the same guard `.t-cinema` and `.t-chapter`
   carry in index.css, and for the same reason: type sized off width
   alone runs a two-line payoff off the top and bottom of a short
   laptop window, and a pinned stage cannot scroll to rescue it. */
const TYPE = {
  statement: 'clamp(2.75rem, min(10vw, 15vh), 9.5rem)',
  principle: 'clamp(3.25rem, min(11.5vw, 17vh), 11rem)',
  payoff: 'clamp(3.6rem, min(14vw, 21vh), 13rem)',
}

export default function FirstPause() {
  const { managerRef, soundOn, toggleSound, reduced } = useCueAudio(CUES)

  const root = useGsapScope(
    (el) => {
      if (prefersReducedMotion()) return

      const q = (s) => el.querySelector(s)
      const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

      const eyebrow = q('[data-eyebrow]')
      const control = q('[data-control]')
      const statementLines = qa('[data-line]')
      const words = qa('[data-word]')
      const payoffLines = qa('[data-payoff-line]')
      const vignette = q('[data-vignette]')

      /* Forward-only edge detection. The scrubbed timeline reports
         progress on every frame; this turns that stream into nine
         discrete events. See createCueTrack for the hysteresis that
         stops a wheel resting on a mark from machine-gunning it, and
         for the collapse that turns a flick across the whole pin into
         one sound rather than eight. */
      const track = createCueTrack(MARKS, (cue) => {
        const manager = managerRef.current
        if (!manager) return
        if (cue === 'hush') manager.silence(0.4)
        else manager.play(cue)
      })

      const mm = gsap.matchMedia()

      mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767px)' }, (ctx) => {
        const { wide } = ctx.conditions

        /* Opening frame, written here rather than in markup so a
           refresh mid-pin rebuilds from a known state instead of from
           wherever the playhead happened to leave things. */
        gsap.set(eyebrow, { autoAlpha: 0, y: -8 })
        /* The control is the one thing here that is never hidden.
           `autoAlpha: 0` writes `visibility: hidden`, which takes an
           element out of the tab order and out of reach of a click —
           so an earlier cut of this had the mute switch unusable for
           the first fifth of the pin, which is precisely the stretch
           before the first cue where somebody would want it. It now
           rises to a dim resting state as the section pins and never
           drops below it. Eleven pixels of grey mono in a corner does
           not break a blackout; an unreachable mute switch does. */
        gsap.set(control, { autoAlpha: 0, y: -8 })
        gsap.set(statementLines, { autoAlpha: 0, y: 30 })
        gsap.set(words, { autoAlpha: 0, y: 34 })
        gsap.set(payoffLines, { autoAlpha: 0, y: 34 })
        gsap.set(vignette, { autoAlpha: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            /* Absolute pixels from a function. A function returning
               `+=N%` resolves against the trigger's own height, which
               pinSpacing then grows by — so every refresh multiplies
               the pin. Same fix as LightsDown and Spaces. */
            end: () => `+=${Math.round(window.innerHeight * (wide ? PIN.wide : PIN.narrow))}`,
            pin: '[data-stage]',
            /* A little scrub lag, not none: it is what stops a
               trackpad flick from reading as a jump cut. */
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => track.update(self.progress),
            /* Nothing rings on into the section above or below. */
            onLeave: () => managerRef.current?.silence(0.5),
            onLeaveBack: () => {
              managerRef.current?.silence(0.35)
              track.reset()
            },
          },
        })

        /* --- .00 BLACK -----------------------------------------
           No CONTENT is scheduled before .16 — the empty frame is the
           first thing the section says. The only thing on screen for
           that first fifth is the mute switch, at half strength, for
           the reason given above. */

        /* --- .01 the control, dim, and nothing else ------------- */
        tl.to(control, { autoAlpha: 0.5, y: 0, duration: 0.03 }, 0.01)

        /* --- .16 the section admits it exists ------------------- */
        tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.16)
        tl.to(control, { autoAlpha: 1, duration: 0.05 }, 0.175)
        tl.to(vignette, { autoAlpha: 1, duration: 0.12 }, 0.18)

        /* --- .20 / .35 the statement ---------------------------
           Two lines, two beats, slow. The second line waits for the
           first to have been READ, not merely to have arrived. */
        tl.to(statementLines[0], { autoAlpha: 1, y: 0, duration: 0.1 }, 0.2)
        tl.to(statementLines[1], { autoAlpha: 1, y: 0, duration: 0.1 }, 0.35)

        /* --- .45 THE PAUSE -------------------------------------
           Everything leaves upward and the frame is empty from ~.50
           to .55. The instruction is to do nothing here, and doing
           nothing has to be scheduled or the next movement eats it. */
        tl.to(
          statementLines,
          { autoAlpha: 0, y: -20, duration: 0.045, stagger: 0.012 },
          0.45,
        )
        tl.to([eyebrow, control], { autoAlpha: 0.45, duration: 0.04 }, 0.45)

        /* --- .55 → .958 THE SIX --------------------------------- */
        words.forEach((word, i) => {
          const [a, b] = BANDS[i]
          const span = b - a
          tl.to(word, { autoAlpha: 1, y: 0, duration: span * 0.34 }, a)
          tl.to(
            word,
            { autoAlpha: 0, y: -26, duration: span * 0.34, ease: 'power2.in' },
            a + span * 0.66,
          )
        })

        /* The eyebrow comes back up for the principles — it is the
           only thing telling you what this list IS — and goes out
           again before the payoff, which needs the frame to itself. */
        tl.to(control, { autoAlpha: 1, duration: 0.04 }, 0.55)
        tl.to(eyebrow, { autoAlpha: 1, duration: 0.04 }, 0.55)
        tl.to(eyebrow, { autoAlpha: 0, duration: 0.03 }, 0.94)

        /* --- .955 THE PAYOFF ------------------------------------
           Arrives as `Calibration.` leaves, settles by ~.99, and is
           held on screen for the remainder of the pin. That hold is
           what hands the page to the next section rather than
           dropping it. */
        tl.to(
          payoffLines,
          { autoAlpha: 1, y: 0, duration: 0.028, stagger: 0.012 },
          0.955,
        )
        tl.to(vignette, { autoAlpha: 0.55, duration: 0.03 }, 0.97)

        return () => tl.kill()
      })

      return () => mm.revert()
    },
    /* Rebuild if the visitor's motion preference is what decided the
       branch above — `reduced` is stable for the life of the page, so
       this is a correctness note rather than a live dependency. */
    [reduced],
  )

  /* ============================================================
     REDUCED MOTION
     No pin, no scrub, no audio, no control — the same words in the
     same order, as one quiet static column. Nothing is hidden and
     nothing has to move to be read.
     ============================================================ */
  if (reduced) {
    return (
      <section id={D.id} aria-label={D.eyebrow} className="relative bg-ink-2 py-32 sm:py-40">
        <div className="shell-wide">
          <span className="t-label text-mist">{D.eyebrow}</span>

          <h2
            className="font-display mt-14 text-bone"
            style={{ fontSize: TYPE.statement, lineHeight: 0.95, letterSpacing: '-0.03em' }}
          >
            {D.statement.map((line) => (
              <span key={line.text} className="block">
                {line.text}
                {line.emphasis && <em className="italic-display text-pure">{line.emphasis}</em>}
              </span>
            ))}
          </h2>

          <ul className="mt-20 space-y-4">
            {D.principles.map((p) => (
              <li
                key={p.word}
                className="font-display text-bone"
                style={{ fontSize: 'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight: 1.05 }}
              >
                {p.word}
              </li>
            ))}
          </ul>

          <p
            className="font-display mt-20 text-pure"
            style={{ fontSize: TYPE.statement, lineHeight: 0.95, letterSpacing: '-0.03em' }}
          >
            {D.payoff.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.eyebrow}
      /* `isolate` so the pinned child keeps its own stacking context —
         without it Safari can paint it under the next section's
         background the moment the pin releases. */
      className="relative isolate bg-ink-2"
    >
      <div
        data-stage
        className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink-2"
      >
        {/* The only non-typographic thing in the section: a vignette
            at a few percent, which does nothing you can point at and
            everything to stop a flat #050505 field reading as a dead
            <div>. Not a gradient anyone is meant to see. */}
        <div
          data-vignette
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 50%, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 38%, rgba(0,0,0,0) 72%)',
          }}
        />

        {/* ---- Head: the eyebrow, and the one control ----
            Pushed clear of the fixed nav rather than tucked under it.
            Both are `t-label` — at this size the section has exactly
            one voice above a whisper and it is the statement. */}
        {/* `z-10` and `pointer-events-none` are both load-bearing.
            Every layer below this one is `absolute inset-0` — they
            cover the whole stage, including this corner — so without
            the z-index the head is painted under them, and without
            the pass-through the statement layer swallows every click
            aimed at the mute switch. The button re-enables pointer
            events for itself and nothing else. */}
        <div
          className="shell-wide pointer-events-none absolute inset-x-0 z-10 flex items-start justify-between gap-8"
          style={{ top: 'clamp(6.5rem, 14vh, 9rem)' }}
        >
          <span data-eyebrow className="t-label text-mist">
            {D.eyebrow}
          </span>

          {/* SOUND ON / SOUND OFF. Two words and a 3px mark — no
              speaker, no player, no transport. The visible label is
              the STATE; the action is announced to screen readers,
              which is the only place the distinction costs anything. */}
          <button
            data-control
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="focus-ring group pointer-events-auto flex shrink-0 items-center gap-2.5 text-mist transition-colors duration-500 hover:text-pure"
          >
            <span
              aria-hidden="true"
              className={`block h-[3px] w-[3px] rounded-full transition-colors duration-500 ${
                soundOn ? 'bg-pure' : 'bg-smoke group-hover:bg-mist'
              }`}
            />
            <span className="t-label">{soundOn ? D.sound.on : D.sound.off}</span>
            <span className="sr-only">{D.sound.action}</span>
          </button>
        </div>

        {/* ---- The statement ----
            Centre-left on desktop, hard left on a phone. Not centred:
            a two-line sentence this size, optically centred in an
            empty frame, reads as a quote card. */}
        <div className="shell-wide pointer-events-none absolute inset-0 flex items-center">
          <h2
            /* `24ch` is a runaway guard, not a measure: both lines
               are authored and are meant to break exactly where they
               are written. A tighter cap re-wraps them at small
               sizes, which is how a two-line statement silently
               becomes a ragged four-line one. */
            className="font-display max-w-[24ch] text-bone md:ml-[6vw]"
            style={{
              fontSize: TYPE.statement,
              lineHeight: 0.94,
              letterSpacing: '-0.032em',
            }}
          >
            {D.statement.map((line) => (
              <span key={line.text} data-line className="block will-change-transform">
                {line.text}
                {/* One emphasis, on the one word the sentence turns
                    on. Italic and pure white against bone — no
                    gradient, no glow, no shadow. */}
                {line.emphasis && <em className="italic-display text-pure">{line.emphasis}</em>}
              </span>
            ))}
          </h2>
        </div>

        {/* ---- The six ----
            One full-bleed layer each, stacked. `aria-hidden` because
            the accessible version of this list is the <ul> below,
            which is in the document once and does not flicker in and
            out of the tree sixty times a second. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {D.principles.map((p) => {
            const place = PLACE[p.place] ?? PLACE.center
            return (
              <div
                key={p.word}
                className={`shell-wide absolute inset-0 flex items-center justify-start ${place.j}`}
                style={{ transform: `translateY(calc(var(--app-h) * ${place.y}))` }}
              >
                <span
                  data-word
                  className="font-display block text-bone will-change-transform"
                  style={{
                    fontSize: TYPE.principle,
                    lineHeight: 0.95,
                    letterSpacing: '-0.035em',
                  }}
                >
                  {p.word}
                </span>
              </div>
            )
          })}
        </div>

        {/* The six, once, for anything that reads the document rather
            than watches it. Visually hidden, never animated. */}
        <ul className="sr-only">
          {D.principles.map((p) => (
            <li key={p.word}>{p.word}</li>
          ))}
        </ul>

        {/* ---- The payoff ----
            The largest type in the section, and the only thing here
            that is genuinely centred — because it is the one line
            that is a conclusion rather than an argument. */}
        <div className="shell-wide pointer-events-none absolute inset-0 flex items-center justify-start md:justify-center">
          <p
            className="font-display text-pure md:text-center"
            style={{
              fontSize: TYPE.payoff,
              lineHeight: 0.9,
              letterSpacing: '-0.038em',
            }}
          >
            {D.payoff.map((line) => (
              <span key={line} data-payoff-line className="block will-change-transform">
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
