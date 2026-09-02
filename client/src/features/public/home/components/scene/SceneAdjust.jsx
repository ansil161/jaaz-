import { scene } from '@/features/public/data/scene'

/* ============================================================
   THE MANUAL LAYER (§10)

   "Manual control should exist, but it should not compete with
   the main scene experience." So it is closed until asked for,
   it is quieter than everything above it, and it contains
   exactly the five controls the concept document lists: lights,
   climate, curtains, audio, seats.

   ------------------------------------------------------------
   NOT ONE PILL, TRACK-PAD, TOGGLE SWITCH OR VALUE CHIP

   The obvious build for five controls is five bordered widgets,
   and it is the build this site has been corrected on: rounded
   grey rectangles on a premium page read as a settings screen
   somebody pasted in. Every control here is made of the same
   three materials the rest of the section is made of — a figure
   in the display face, a hairline, and one warm mark.

     Lights   a figure over a hairline track with one warm dot.
              The track is a `<input type=range>` wearing the
              site's own line work; the accessibility, the
              keyboard and the drag are the platform's.

     Climate  minus, a figure at display size, plus. The figure
     Audio    is the loudest thing in the control, because the
              figure is the answer and the two operators are
              only how you change it.

     Curtains three words, the chosen one in paper over a warm
     Seats    rule. The same idiom as the scene selector above,
              one size down — which is what makes the two read
              as primary and secondary rather than as two
              different interfaces.

   ------------------------------------------------------------
   THREE OF THE FIVE WRITE BACK INTO THE READOUT

   Lights, climate and curtains have rows upstairs and change
   them the instant they move. That write-back is not a
   nicety — it is what stops the panel above being a decoration,
   and it is the whole of the document's "manual when you need
   it" made real rather than asserted. Audio volume and seats
   have no row: the readout states what the SCENE set, and those
   two are finer than a scene.

   ------------------------------------------------------------
   THE DRAWER IS CSS, AND IT IS ALWAYS IN THE DOM

   `grid-template-rows: 0fr -> 1fr` opens it with no measurement,
   no ResizeObserver and no height cached from a width that has
   since changed. Closed, the whole subtree is `inert`, so it is
   out of the accessibility tree and nothing inside it can be
   tabbed into — which is the failure mode of every drawer built
   with `overflow: hidden` alone.
   ============================================================ */

const A = scene.adjust

export default function SceneAdjust({ open, room, onChange }) {
  return (
    <div className={`scene-drawer ${open ? 'is-open' : ''}`}>
      {/* `inert={!open}` as a real boolean, not `''`. React 19
          reflects the attribute from the boolean; an empty string
          is the React 18 idiom and React 19 warns that it will be
          treated as FALSE — which would leave a closed drawer
          fully tabbable, silently. */}
      <div id="scene-adjust" inert={!open} className="scene-drawer-inner">
        <div className="scene-adjust">
          {/* ---- Lights ---- */}
          <Control label={A.lights.label}>
            <p className="scene-figure">{room.lights}%</p>
            <input
              type="range"
              className="scene-track focus-ring"
              min={A.lights.min}
              max={A.lights.max}
              step={A.lights.step}
              value={room.lights}
              aria-label="Lights level"
              aria-valuetext={`${room.lights} per cent`}
              onChange={(e) => onChange('lights', Number(e.target.value))}
              /* The fill is drawn from the value rather than from
                 a second element layered over the track: one
                 property, no second box to keep in register with
                 the thumb at every width. */
              style={{ '--fill': (room.lights - A.lights.min) / (A.lights.max - A.lights.min) }}
            />
          </Control>

          {/* ---- Climate ---- */}
          <Control label={A.climate.label}>
            <Stepper
              value={room.climate}
              suffix="°"
              min={A.climate.min}
              max={A.climate.max}
              step={A.climate.step}
              name="temperature"
              onChange={(v) => onChange('climate', v)}
            />
          </Control>

          {/* ---- Curtains ---- */}
          <Control label={A.curtain.label}>
            <Choice
              label={A.curtain.label}
              options={A.curtain.options}
              value={room.curtain}
              onChange={(v) => onChange('curtain', v)}
            />
          </Control>

          {/* ---- Audio ---- */}
          <Control label={A.volume.label}>
            <Stepper
              value={room.volume}
              min={A.volume.min}
              max={A.volume.max}
              step={A.volume.step}
              name="volume"
              onChange={(v) => onChange('volume', v)}
            />
          </Control>

          {/* ---- Seats ---- */}
          <Control label={A.seat.label}>
            <Choice
              label={A.seat.label}
              options={A.seat.options}
              value={room.seat}
              onChange={(v) => onChange('seat', v)}
            />
          </Control>
        </div>
      </div>
    </div>
  )
}

/* One lane: the mono name of the thing, and the control under
   it. The name is mono because it names something being
   measured; every value below is set in the sans or the display
   face, because a value in mono next to a name in mono is
   terminal output — the costume this site's engineering voice is
   most likely to reach for and least entitled to. */
function Control({ label, children }) {
  return (
    <div className="scene-ctrl">
      <span className="scene-ctrl-k">{label}</span>
      <div className="scene-ctrl-body">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------
   MINUS, FIGURE, PLUS

   A `role="group"` rather than a spinbutton. A spinbutton is a
   text field a screen reader offers to type into, and there is
   nothing to type here — two buttons and a number is exactly
   what this is, so that is what it announces itself as.

   The buttons disable at the ends rather than wrapping. A
   temperature that jumps from 28° to 18° because somebody
   pressed plus once too often is a control lying about what it
   is attached to.
   ------------------------------------------------------------ */
function Stepper({ value, suffix = '', min, max, step, name, onChange }) {
  const clamp = (v) => Math.min(max, Math.max(min, v))
  return (
    <div className="scene-stepper" role="group" aria-label={name}>
      <button
        type="button"
        className="scene-step focus-ring"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${name}`}
      >
        <span aria-hidden="true">−</span>
      </button>
      <p className="scene-figure">
        {value}
        {suffix}
      </p>
      <button
        type="button"
        className="scene-step focus-ring"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={`Increase ${name}`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------
   THREE WORDS, ONE CHOSEN

   A real radio group: arrow keys move between the options, the
   chosen one is the only tab stop, and the state is carried by
   `aria-checked` rather than by the colour of the text.

   No pill and no segmented track behind them. The chosen word is
   paper over a warm rule; the other two are ash. That is the
   scene selector's idiom one size down, which is what makes the
   two read as one interface at two levels rather than as two
   interfaces.
   ------------------------------------------------------------ */
function Choice({ label, options, value, onChange }) {
  const index = Math.max(
    0,
    options.findIndex(([v]) => v === value),
  )

  const onKeyDown = (e) => {
    const last = options.length - 1
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    onChange(options[next][0])
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="scene-choice">
      {options.map(([v, word]) => {
        const on = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(v)}
            className={`scene-opt focus-ring ${on ? 'is-on' : ''}`}
          >
            {word}
          </button>
        )
      })}
    </div>
  )
}
