import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/useGsap'
import { scenes } from '../../data/experience'
import GradedPlate from './GradedPlate'

/* ============================================================
   ONE HOUSE, ONE GESTURE — automation you watch happen

   The brief's rule for this section is the whole design: show
   the automation rather than explain it. So pressing a scene
   does not reveal a paragraph about what the scene does — it
   RUNS. The channels light one at a time, in order, and the room
   behind them changes light as the sequence lands.

   That ordering is the content. "Movie Night" is not a mood, it
   is blackout, then house light down, then the projector, then
   the processor, then climate — five systems that have to happen
   in that order, and watching them tick past is the clearest
   possible argument that they are on one system.

   WHY NOT A TABLET MOCKUP. The brief asks for a "premium
   tablet-like interface", and the obvious reading is a drawn iPad
   bezel with a home indicator. That is a costume: it dates
   instantly, it competes with the room for attention, and it
   makes the control look like a photograph of software rather
   than like part of the house. What JAZ actually installs is a
   flush metal keypad, so the panel is drawn in THAT language —
   engraved legends, hairline rules, no visible fixings — and it
   belongs to the architecture instead of to a product shot.

   THE SEQUENCE IS INTERRUPTIBLE. Press another scene mid-run and
   the first one stops where it is. A queue that insisted on
   finishing would make the panel feel like it was ignoring you,
   which is the exact opposite of what a control system is
   selling.
   ============================================================ */

/* Slow enough to read one line, fast enough that the whole scene
   lands before attention moves on. Five steps at 620ms is just
   over three seconds. */
const STEP_MS = 620

export default function SceneDeck({ className = '' }) {
  /* Read once, at mount. The preference cannot change without a
     re-render anyway, and reading it here rather than inside an
     effect is what lets `step` be INITIALISED correctly instead
     of being corrected a frame later. */
  const [reduced] = useState(() => prefersReducedMotion())

  const [sceneId, setSceneId] = useState(scenes[0].id)
  const [step, setStep] = useState(() => (reduced ? scenes[0].steps.length : 0))
  const timer = useRef(null)

  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0]

  /* Choosing a scene resets its own progress, in the handler that
     caused it. The alternative — resetting inside the effect that
     starts the timer — writes state during render-commit and
     costs an extra pass to say something the click already knew. */
  const chooseScene = (next) => {
    setSceneId(next.id)
    setStep(reduced ? next.steps.length : 0)
  }

  /* The effect owns ONLY the interval, which is a genuine external
     system. Restarting on every change of scene is what makes
     interruption free: the cleanup clears the previous run's timer
     before the next one starts. */
  useEffect(() => {
    if (reduced) return undefined

    timer.current = window.setInterval(() => {
      setStep((s) => {
        if (s >= scene.steps.length) {
          window.clearInterval(timer.current)
          return s
        }
        return s + 1
      })
    }, STEP_MS)

    return () => window.clearInterval(timer.current)
  }, [scene, reduced])

  const done = step >= scene.steps.length

  return (
    <div className={`flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10 ${className}`}>
      {/* ---- The house, responding ---- */}
      <div className="relative min-w-0 flex-1 overflow-hidden bg-ink-3" style={{ aspectRatio: 16 / 10 }}>
        <GradedPlate
          key={scene.id}
          slot={scene.slot}
          alt={`${scene.label} — the house under this scene`}
          grade={scene.grade}
        />

        {/* The scene's name, over the room it just changed. Held
            to the corner so it annotates rather than captions. */}
        <p className="t-label absolute bottom-6 left-6 z-10 text-[0.55rem] text-pure/85">
          {scene.label}
          <span className="ml-3 text-cove">{done ? 'Set' : 'Running'}</span>
        </p>
      </div>

      {/* ---- The keypad ---- */}
      <div className="flex w-full shrink-0 flex-col border border-white/10 bg-ink-4/90 backdrop-blur-md lg:w-80">
        <h3 className="t-label border-b border-white/10 px-6 py-4 text-[0.55rem] text-ash">
          Scenes
        </h3>

        {/* Four scenes, one button each — the same four that would
            be engraved on the keypad at the door. */}
        <div className="grid grid-cols-2 divide-x divide-y divide-white/8 border-b border-white/10">
          {scenes.map((s) => {
            const on = s.id === sceneId
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={on}
                onClick={() => chooseScene(s)}
                className={`focus-ring relative px-5 py-6 text-left text-[0.86rem] transition-colors duration-500 ${
                  on ? 'text-pure' : 'text-mist hover:text-fog'
                }`}
              >
                {s.label}
                {/* The engraved legend lights when it is the live
                    scene — one hairline, from the left, the same
                    mark every selected control on this site uses. */}
                <span
                  className={`absolute bottom-0 left-0 h-px w-full origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    on ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </div>

        {/* ---- What is happening ----
            `aria-live` so the sequence is announced as it runs;
            without it a screen reader gets a silent panel and the
            entire demonstration is invisible. */}
        <ol className="flex-1 divide-y divide-white/6 px-6 py-2" aria-live="polite">
          {scene.steps.map((s, i) => {
            const lit = i < step
            return (
              <li
                key={`${scene.id}-${s.channel}`}
                className="flex items-baseline gap-4 py-3.5 transition-opacity duration-500"
                style={{ opacity: lit ? 1 : 0.28 }}
              >
                <span
                  className={`mt-1.5 h-1 w-1 shrink-0 rounded-full transition-colors duration-500 ${
                    lit ? 'bg-cove' : 'bg-ash/60'
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="t-label block text-[0.5rem] text-ash">{s.channel}</span>
                  <span
                    className={`mt-1 block text-[0.84rem] leading-snug transition-colors duration-500 ${
                      lit ? 'text-fog' : 'text-mist'
                    }`}
                  >
                    {s.action}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>

        {/* Progress as a hairline across the foot of the panel —
            the only moving thing on the control, and it stops
            when the house has finished responding. */}
        <div className="h-px w-full bg-white/8" aria-hidden="true">
          <div
            className="h-px origin-left bg-cove transition-transform duration-500 ease-linear"
            style={{ transform: `scaleX(${step / scene.steps.length})` }}
          />
        </div>
      </div>
    </div>
  )
}
