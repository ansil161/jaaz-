import { useCallback, useEffect, useRef, useState } from 'react'
import { feelings } from '@/features/public/data/site'
import { Lines } from '@/features/public/components/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   CH. 06 — WHAT DO YOU WANT TO FEEL?

   The one section on the page that starts from the visitor
   rather than from the room. Press a feeling; the room that
   answers it appears.

   ------------------------------------------------------------
   THE CONTROL IS SIX WORDS AT DISPLAY SIZE

   That is the entire interface, and it is a deliberate refusal
   of the four things a section like this normally grows: a
   segmented pill, a row of thumbnails, an 01/06 counter and a
   strip of ticks under the picture. Each of those is app chrome
   parked on somebody's photograph, and this site has ruled all
   of them out by name.

   What is left is type. The chosen word is white with a warm
   rule that SLIDES to it from wherever it was; the other five
   sit quiet. Nothing at all is laid over the photograph — the
   line, the paragraph and the specification all live in the
   column with the words, so the picture is only ever a picture.

   ------------------------------------------------------------
   WHY THIS IS NOT A SECOND PRISM

   <Prism> shows one room becoming five atmospheres. It is about
   the room, it is driven by scroll, and its faces stack.

   This is about the VISITOR: the question is in the second
   person, the answer names the kind of room that delivers it,
   and it is driven by a press. Same subject matter, opposite
   direction of travel — and it is the last thing before the
   testimonials for that reason. It is where somebody who has
   read the whole page finally puts themselves in one.

   ------------------------------------------------------------
   THE PICTURES ARE LOADED THREE AT A TIME

   All six are 1500px portrait plates and all six are in the
   viewport at once, so rendering every <img> on mount would
   fetch the lot — `loading="lazy"` does nothing for an element
   that is already on screen. `seen` holds the indices that have
   been asked for: the opening state, its neighbour, and then
   each selection's neighbours as they are chosen. A visitor who
   presses one word downloads two more pictures, not five.

   ------------------------------------------------------------
   ACCESSIBILITY

   A real tablist: roving tabindex, arrow keys, Home and End,
   and a labelled panel. The inactive plates are hidden from the
   accessibility tree rather than left as six alt texts stacked
   on top of each other, and only the visible one carries its
   description.
   ============================================================ */

const STATES = feelings.states

/* Which plates to hold in the DOM for a given selection. Its
   neighbours, because the next thing a visitor does after pressing
   one word is almost always press the one above or below it. */
const around = (i) => [i - 1, i, i + 1].filter((n) => n >= 0 && n < STATES.length)

export default function Feeling() {
  const [active, setActive] = useState(0)
  const [seen, setSeen] = useState(() => new Set(around(0)))

  const listRef = useRef(null)
  const railRef = useRef(null)
  const btnRefs = useRef([])
  const stageRef = useRef(null)

  const choose = useCallback((i) => {
    setActive(i)
    setSeen((prev) => {
      const next = new Set(prev)
      around(i).forEach((n) => next.add(n))
      /* A Set mutated in place is the same object, so React would
         skip the render. Always hand back a new one. */
      return next
    })
  }, [])

  /* ---- The rule that slides ----
     Measured from the chosen button rather than computed from an
     index: the words are different lengths and they re-wrap at
     every breakpoint, so the only reliable width is the one the
     browser just laid out. */
  const placeRail = useCallback((animate) => {
    const rail = railRef.current
    const btn = btnRefs.current[active]
    if (!rail || !btn) return

    const to = {
      x: btn.offsetLeft,
      y: btn.offsetTop + btn.offsetHeight - 2,
      width: btn.offsetWidth,
    }

    if (!animate || prefersReducedMotion()) {
      gsap.set(rail, { ...to, autoAlpha: 1 })
      return
    }
    gsap.to(rail, { ...to, autoAlpha: 1, duration: 0.62, ease: 'jaz', overwrite: true })
  }, [active])

  useEffect(() => {
    placeRail(true)
  }, [placeRail])

  /* Re-measure on anything that can change a word's box: a resize,
     a rotation, and the web font landing — Instrument Serif replaces
     a fallback whose metrics are nothing like it, and a rule measured
     against Times is a rule in the wrong place. */
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const settle = () => placeRail(false)
    const ro = new ResizeObserver(settle)
    ro.observe(list)
    document.fonts?.ready.then(settle)

    return () => ro.disconnect()
  }, [placeRail])

  /* ---- The crossfade ----
     Opacity and a small scale, composited normally. No clip-path and
     no mask: a promoted clip-path layer on this site has a standing
     habit of rasterising as a black rectangle, and a crossfade
     between two dark interiors does not need one to read.

     A PLAIN EFFECT, NOT A GSAP CONTEXT. A context keyed on `active`
     reverts on every change, and reverting strips the inline styles
     the last tween wrote — so the outgoing plate would snap to the
     stylesheet's `opacity: 0` a frame before the incoming one
     started fading up, and the swap would flash black. The tweens
     here overwrite each other by target instead, which is what a
     state machine wants.

     The plates start hidden in CSS (`.feel-plate`), so a picture
     added to `seen` mid-session fades in from zero like every other
     one rather than appearing at full strength. */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const plates = gsap.utils.toArray(stage.querySelectorAll('[data-feel-plate]'))
    plates.forEach((plate) => {
      const on = Number(plate.dataset.index) === active
      if (prefersReducedMotion()) {
        gsap.set(plate, { autoAlpha: on ? 1 : 0, scale: 1 })
        return
      }
      gsap.to(plate, {
        autoAlpha: on ? 1 : 0,
        /* The arriving picture settles the last few per cent of a
           push-in; the leaving one drifts on past. Both are moving at
           the moment of the swap, which is what stops it reading as
           two slides being switched. */
        scale: on ? 1 : 1.035,
        duration: on ? 1.1 : 0.75,
        ease: 'jaz',
        overwrite: 'auto',
      })
    })

    return () => gsap.killTweensOf(plates)
  }, [active, seen])

  /* ---- Keyboard ----
     Arrow keys move the selection, which is the expected behaviour
     for a tablist with automatic activation, and focus follows so
     the rule and the panel stay in agreement with the caret. */
  const onKeyDown = (e) => {
    const last = STATES.length - 1
    let next = null

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = active === last ? 0 : active + 1
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = active === 0 ? last : active - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return

    e.preventDefault()
    choose(next)
    btnRefs.current[next]?.focus()
  }

  const state = STATES[active]

  return (
    <section id={feelings.id} className="relative bg-ink py-24 sm:py-32 lg:py-40">
      <div className="shell-wide">
        {/* ---- The question ---- */}
        <header className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            <span className="t-label flex items-center gap-3 text-fog">
              {feelings.chapter}
              <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
              <span className="text-mist">{feelings.label}</span>
            </span>

            <Lines
              as="h2"
              className="t-display mt-8 max-w-[12ch] leading-[1.02] text-bone lg:mt-10"
              stagger={0.11}
            >
              {feelings.heading.map((line, i) => (
                <span key={line} className="block">
                  {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
                </span>
              ))}
            </Lines>
          </div>

          <div className="lg:col-span-5 lg:self-end lg:pb-[0.5em]">
            <Lines as="p" className="t-body mt-8 max-w-[42ch] text-fog lg:mt-0">
              {feelings.intro}
            </Lines>

            {/* THE DISCLOSURE SITS ABOVE THE PHOTOGRAPHS, not under
                them — the same rule <Possibilities> follows. A note
                about what these pictures are is only doing its job if
                it is read before they are looked at. */}
            <p className="t-num mt-6 flex items-start gap-2.5 text-[0.6875rem] leading-[1.6] text-mist">
              <span
                aria-hidden="true"
                className="mt-[0.5em] inline-block h-1 w-1 shrink-0 rounded-full bg-cove"
              />
              {feelings.note}
            </p>
          </div>
        </header>

        {/* ---- The control, the stage and the answer ----
            Two rows on the left (words, then the answer to them) and
            one tall picture on the right spanning both. The picture is
            second in the DOM so that a phone reads words, picture,
            answer — the control stays next to the thing it changes. */}
        <div className="mt-16 grid grid-cols-1 gap-y-12 sm:mt-20 lg:mt-24 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-14">
          {/* --- The six words --- */}
          <div className="lg:col-span-5 lg:row-start-1">
            <span className="t-label block text-mist">{feelings.cue}</span>

            <div
              ref={listRef}
              role="tablist"
              aria-orientation="vertical"
              aria-label="Choose what you want the room to feel like"
              onKeyDown={onKeyDown}
              className="relative mt-6 flex flex-col items-start lg:mt-8"
            >
              {/* The warm rule. One element for all six words: it is
                  the thing that makes the selection read as a move
                  from one word to another rather than as two separate
                  states being toggled. Starts invisible because its
                  first position is measured, not guessed. */}
              <span
                ref={railRef}
                aria-hidden="true"
                className="feel-rail pointer-events-none absolute top-0 left-0 bg-cove opacity-0"
              />

              {STATES.map((s, i) => {
                const on = i === active
                return (
                  <button
                    key={s.key}
                    ref={(el) => {
                      btnRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`feel-tab-${s.key}`}
                    aria-selected={on}
                    aria-controls="feel-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(i)}
                    className={`feel-word focus-ring ${on ? 'text-pure' : 'text-ash hover:text-fog'}`}
                  >
                    {s.word}
                  </button>
                )
              })}
            </div>
          </div>

          {/* --- The room --- */}
          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            {/* The bloom. The picture sits IN warm light rather than
                on flat black, which is the difference between a
                photograph placed on a page and one lit on it. Behind
                the frame, never over it. */}
            <div className="relative">
              <span aria-hidden="true" className="feel-bloom" />

              <div
                ref={stageRef}
                className="relative aspect-[4/5] w-full overflow-hidden bg-ink-3 sm:aspect-[3/2] lg:aspect-[4/5]"
              >
                {STATES.map((s, i) =>
                  seen.has(i) ? (
                    <img
                      key={s.key}
                      data-feel-plate
                      data-index={i}
                      src={s.plate}
                      alt={i === active ? s.alt : ''}
                      aria-hidden={i === active ? undefined : 'true'}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable="false"
                      sizes="(min-width: 1024px) 56vw, 100vw"
                      className="plate feel-plate absolute inset-0 h-full w-full object-cover [--plate-contrast:1.04] [--plate-saturate:0.97]"
                      /* Tailwind's preflight caps every image at
                         `max-width: 100%`, which silently clamps a
                         plate the moment it is scaled. Opacity is
                         NOT set here — the crossfade effect owns it,
                         and a React-written opacity would beat the
                         tween to the target on every selection. */
                      style={{ maxWidth: 'none' }}
                    />
                  ) : null,
                )}
              </div>
            </div>
          </div>

          {/* --- The answer ---
              Under the words, in the same column, so the thing that
              changed and the thing that changed it are read together.
              `key` on the inner block is what re-runs the entrance on
              every selection — without it React would patch the text
              in place and the answer would simply be different, with
              no moment of arriving. */}
          <div
            id="feel-panel"
            role="tabpanel"
            aria-labelledby={`feel-tab-${state.key}`}
            tabIndex={-1}
            className="lg:col-span-5 lg:row-start-2"
          >
            <FeelingAnswer key={state.key} state={state} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* The copy for the chosen feeling. Split out so it can be remounted
   by key — three lines that rise as a group, which is the smallest
   amount of motion that still says "this is the answer to what you
   just pressed". */
function FeelingAnswer({ state }) {
  const ref = useGsapScope((el) => {
    const parts = el.children
    if (prefersReducedMotion()) {
      gsap.set(parts, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.from(parts, {
      autoAlpha: 0,
      y: 18,
      duration: 0.8,
      stagger: 0.07,
      ease: 'jaz',
    })
  }, [])

  return (
    <div ref={ref}>
      <p className="t-heading text-pure">{state.line}</p>
      <p className="t-body mt-5 max-w-[42ch] text-fog">{state.body}</p>
      <p className="t-num mt-6 text-[0.6875rem] tracking-[0.06em] text-mist">{state.meta}</p>
    </div>
  )
}
