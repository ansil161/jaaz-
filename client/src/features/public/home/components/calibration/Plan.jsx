import { calibration as D } from '@/features/public/data/site'
import { CHAIR, FIELD, FRAME, ROOM, SEATS, SPEAKERS, SPK, VB } from './model'

/* ============================================================
   THE PLAN

   One top-down CAD drawing of the calibrated room, in the room's
   own metres. The coordinate system is the viewBox: origin at the
   centre of the screen wall, +y running back into the room, so a
   chair cannot appear anywhere except where it was measured.

   IT IS A DRAWING, NOT AN ICON SET. Walls have thickness and are
   hatched at the boundary. Treatment zones carry the hatch their
   discipline actually uses — a fine rule for absorption, a
   toothed one for diffusion. Axes are dash-dot centrelines, the
   way every drawing since the drawing board has set an axis.
   Dimension runs terminate in a 45° oblique, not an arrowhead.
   The weights are a real drawing's weights, and that hierarchy is
   the whole reason a sheet this dense stays readable:

     grid      0.012 / 0.014   the ruled paper, barely there
     zones     0.016           what the walls are made of
     dimension 0.016           measurement, in line grey
     furniture 0.024           the objects in the room
     wall      0.022 + poché   the boundary, heaviest
     signal    0.028           the one chair being read

   NOTHING HERE IS TEXT. Every word on this drawing is HTML in the
   layer above it, positioned by `pctX`/`pctY` off this same
   viewBox. SVG text in a drawing that scales from 340px to 700px
   wide is either illegible at one end or oversized at the other,
   and no amount of `vector-effect` fixes it.

   WHAT THE ACTIVE SEAT EARNS, AND WHY NOT ALL SEVEN. Rays to the
   screen edges, the subtended arc, the centre-channel path and a
   measurement crosshair are drawn for ONE chair. Seven sets of
   them is the annotated-drawing failure — seven angles crossing
   each other over a 1.4 m seat pitch is a hatch, not a reading.
   The load sequence is the exception: it sends a wavefront to all
   seven once, because "every seat" is the claim being made, and
   then it settles.
   ============================================================ */

const HALF_W = ROOM.w / 2
const WALL = 0.16
const SCREEN_Y = 0.03
const SCREEN_FACE = SCREEN_Y + 0.13
const CENTRE = (SPEAKERS.find((s) => s.id === 'C') ?? SPEAKERS[1]).calibrated

/* The reference point the room is aimed at: the middle chair of
   the front row. Speakers toe in to it and the lateral axis runs
   through it, both of which are true of a real calibration. */
const REF = SEATS[1].calibrated

/* A CAD centreline. Long, dot, long — the pattern that means
   "this is an axis" and not "this is a hidden edge" (which is an
   even dash) or "this is a boundary" (which is a fine dash). */
const AXIS_DASH = '0.62 0.15 0.11 0.15'

const ROWS = [...new Set(SEATS.map((s) => s.calibrated.y))].sort((a, b) => a - b)

/* Grid ruling. Stepped with an integer counter rather than by
   accumulating a float, or the last line of a 21-line run lands a
   thousandth of a metre off and the ruling reads as untrue. */
const rule = (step) => {
  const nx = Math.floor((FRAME.x1 - FRAME.x0) / step)
  const ny = Math.floor((FRAME.y1 - FRAME.y0) / step)
  let d = ''
  for (let i = 0; i <= nx; i += 1) {
    const x = (FRAME.x0 + i * step).toFixed(3)
    d += `M${x} ${FRAME.y0}V${FRAME.y1}`
  }
  for (let j = 0; j <= ny; j += 1) {
    const y = (FRAME.y0 + j * step).toFixed(3)
    d += `M${FRAME.x0} ${y}H${FRAME.x1}`
  }
  return d
}
/* The minor ruling skips every second line, because the major
   ruling is already drawing it. Two paths stacked on the same
   coordinate double the ink and the composite reads heavier than
   either weight was set to. */
const MINOR = (() => {
  const step = 0.5
  const n = Math.floor((FRAME.x1 - FRAME.x0) / step)
  const m = Math.floor((FRAME.y1 - FRAME.y0) / step)
  let d = ''
  for (let i = 0; i <= n; i += 1) {
    const x = FRAME.x0 + i * step
    if (Math.abs(x - Math.round(x)) < 1e-6) continue
    d += `M${x.toFixed(3)} ${FRAME.y0}V${FRAME.y1}`
  }
  for (let j = 0; j <= m; j += 1) {
    const y = FRAME.y0 + j * step
    if (Math.abs(y - Math.round(y)) < 1e-6) continue
    d += `M${FRAME.x0} ${y.toFixed(3)}H${FRAME.x1}`
  }
  return d
})()
const MAJOR = rule(1)

/* A dimension run: the witness line, and a 45° oblique at each
   end. `v` swaps the axis. The figure itself is set in the HTML
   layer, over the middle of the run. */
const dim = (v, at, from, to) => {
  const t = 0.13
  return v
    ? `M${at} ${from}V${to}M${at - t} ${from + t}l${t * 2} ${-t * 2}M${at - t} ${to + t}l${t * 2} ${-t * 2}`
    : `M${from} ${at}H${to}M${from - t} ${at + t}l${t * 2} ${-t * 2}M${to - t} ${at + t}l${t * 2} ${-t * 2}`
}

/* Corner registration marks. A real sheet is cut to them. */
const REG = [
  [FRAME.x0, FRAME.y0, 1, 1],
  [FRAME.x1, FRAME.y0, -1, 1],
  [FRAME.x0, FRAME.y1, 1, -1],
  [FRAME.x1, FRAME.y1, -1, -1],
]
  .map(([x, y, sx, sy]) => `M${x} ${y + sy * 0.42}V${y}H${x + sx * 0.42}`)
  .join('')

/* The treatment schedule, drawn. Every zone is a real surface in
   a real build-up: first-reflection absorption down both side
   walls between the screen and the front row, diffusion across
   the rear wall behind the back row, and traps in all four
   corners where the room's own modes pile up. */
const T = 0.3
const ZONES = {
  absorption: [
    { x: -HALF_W, y: 1.15, w: T, h: 3.15 },
    { x: HALF_W - T, y: 1.15, w: T, h: 3.15 },
  ],
  diffusion: [{ x: -2.45, y: ROOM.d - T, w: 4.9, h: T }],
}
/* A trap is a quarter-round across the corner, which is what it
   is — a triangular column packed into the angle, not a box. */
const TRAP = 0.72
const TRAPS = [
  `M${-HALF_W} ${TRAP}A${TRAP} ${TRAP} 0 0 0 ${-HALF_W + TRAP} 0`,
  `M${HALF_W - TRAP} 0A${TRAP} ${TRAP} 0 0 0 ${HALF_W} ${TRAP}`,
  `M${-HALF_W} ${ROOM.d - TRAP}A${TRAP} ${TRAP} 0 0 1 ${-HALF_W + TRAP} ${ROOM.d}`,
  `M${HALF_W - TRAP} ${ROOM.d}A${TRAP} ${TRAP} 0 0 1 ${HALF_W} ${ROOM.d - TRAP}`,
].join('')

/* A wavefront: the forward 150° of a circle of unit radius, drawn
   AT the source in absolute coordinates and scaled about it.

   Absolute rather than translated-then-scaled on purpose. A group
   carrying both a translate and a tweened scale has to agree with
   whatever `transform-origin` and `transform-box` the browser
   resolves, and that is exactly the class of ambiguity that has
   already cost this codebase an afternoon on an SVG rotation.
   One transform, one explicit origin, no composition.

   `non-scaling-stroke` keeps it a hairline at every radius, which
   is what stops an expanding arc thickening into a band as it
   travels. */
const WAVE = `M${(CENTRE.x - 0.966).toFixed(3)} ${(CENTRE.y + 0.259).toFixed(3)}A1 1 0 0 1 ${(CENTRE.x + 0.966).toFixed(3)} ${(CENTRE.y + 0.259).toFixed(3)}`
const WAVE_COUNT = 4

/* The two overlays a selected chair earns. Both are geometry, not
   decoration: the rays are the actual angle the screen subtends
   from that chair, and the path is the actual centre-channel run
   whose length the readout prints in milliseconds. */
const viewOf = (p) => {
  const half = D.screenWidth / 2
  const a = Math.atan2(SCREEN_FACE - p.y, -half - p.x)
  const b = Math.atan2(SCREEN_FACE - p.y, half - p.x)
  const r = 1.15
  return {
    rays: `M${-half} ${SCREEN_FACE}L${p.x} ${p.y}L${half} ${SCREEN_FACE}`,
    fill: `M${p.x} ${p.y}L${-half} ${SCREEN_FACE}L${half} ${SCREEN_FACE}Z`,
    arc: `M${p.x + Math.cos(a) * r} ${p.y + Math.sin(a) * r}A${r} ${r} 0 0 1 ${p.x + Math.cos(b) * r} ${p.y + Math.sin(b) * r}`,
  }
}

export default function Plan({ uid = 'cal', activeSeat = 1, className = '' }) {
  const seat = SEATS[activeSeat] ?? SEATS[0]
  const p = seat.calibrated
  const view = viewOf(p)

  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className={`h-full w-full overflow-visible ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8c1b4" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#c8c1b4" stopOpacity="0.10" />
        </linearGradient>
        {/* Poché, at 45°, like a section cut. */}
        <pattern
          id={`${uid}-poche`}
          width="0.26"
          height="0.26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="0.26" stroke="#111111" strokeWidth="0.05" opacity="0.5" />
        </pattern>
        {/* Absorption: a fine close rule, the drawing convention
            for a soft porous fill. */}
        <pattern
          id={`${uid}-abs`}
          width="0.15"
          height="0.15"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="0.15"
            stroke="#77736b"
            strokeWidth="0.026"
            opacity="0.85"
          />
        </pattern>
        {/* Diffusion: a toothed rule, because a diffuser is a
            profiled surface and the hatch should say so. */}
        <pattern id={`${uid}-dif`} width="0.24" height="0.3" patternUnits="userSpaceOnUse">
          <path
            d="M0 0.3L0.12 0.06L0.24 0.3"
            fill="none"
            stroke="#77736b"
            strokeWidth="0.026"
            opacity="0.85"
          />
        </pattern>
        <clipPath id={`${uid}-room`}>
          <rect x={-HALF_W} y={0} width={ROOM.w} height={ROOM.d} />
        </clipPath>
      </defs>

      {/* ---------- 01 · The ruled sheet ---------- */}
      <g data-cal-grid stroke="#c8c1b4" fill="none">
        <path d={MINOR} strokeWidth="0.012" opacity="0.5" />
        <path d={MAJOR} strokeWidth="0.014" opacity="0.9" />
      </g>
      <path
        data-cal-reg
        d={REG}
        fill="none"
        stroke="#77736b"
        strokeWidth="0.02"
        opacity="0.75"
      />

      {/* ---------- 02 · The room ---------- */}
      <g data-cal-room>
        <rect
          data-cal-floor
          x={-HALF_W}
          y={0}
          width={ROOM.w}
          height={ROOM.d}
          fill={`url(#${uid}-floor)`}
        />
        {/* One continuous outline so it can DRAW itself as one
            stroke. Four separate wall rects cannot: DrawSVG runs a
            dash offset along a single path, and four paths give
            four independent runs starting at once, which reads as
            a box assembling rather than as a line being drawn. */}
        <rect
          data-cal-outline
          x={-HALF_W}
          y={0}
          width={ROOM.w}
          height={ROOM.d}
          fill="none"
          stroke="#111111"
          strokeWidth="0.03"
        />
        <g data-cal-walls>
          {[
            { x: -HALF_W - WALL, y: -WALL, w: ROOM.w + WALL * 2, h: WALL },
            { x: -HALF_W - WALL, y: ROOM.d, w: ROOM.w + WALL * 2, h: WALL },
            { x: -HALF_W - WALL, y: 0, w: WALL, h: ROOM.d },
            { x: HALF_W, y: 0, w: WALL, h: ROOM.d },
          ].map((r) => (
            <rect
              key={`${r.x}-${r.y}`}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill={`url(#${uid}-poche)`}
              stroke="#111111"
              strokeWidth="0.022"
            />
          ))}
        </g>
      </g>

      {/* ---------- 03 · Treatment ----------
          Inside the room clip, because a zone is a lining on the
          inner face and must not paint over the poché. */}
      <g data-cal-zones clipPath={`url(#${uid}-room)`}>
        {ZONES.absorption.map((z) => (
          <rect
            key={`abs-${z.x}`}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            fill={`url(#${uid}-abs)`}
            stroke="#77736b"
            strokeWidth="0.016"
            strokeDasharray="0.14 0.1"
            opacity="0.9"
          />
        ))}
        {ZONES.diffusion.map((z) => (
          <rect
            key={`dif-${z.x}`}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            fill={`url(#${uid}-dif)`}
            stroke="#77736b"
            strokeWidth="0.016"
            strokeDasharray="0.14 0.1"
            opacity="0.9"
          />
        ))}
        <path
          d={TRAPS}
          fill={`url(#${uid}-abs)`}
          stroke="#77736b"
          strokeWidth="0.016"
          strokeDasharray="0.14 0.1"
          opacity="0.9"
        />
      </g>

      {/* ---------- 04 · The acoustic field ----------
          Marching squares over the same `levelAt` that produces
          every figure in the panel, so the lines on the plan and
          the numbers in the margin cannot drift apart — they are
          two renderings of one function. The warmer pair is the
          ±1 dB reference window, drawn last and in signal, because
          it is the only contour a visitor has to read: after
          calibration every chair sits between them. */}
      <g data-cal-field clipPath={`url(#${uid}-room)`} fill="none" stroke="#b7af9f">
        <path d={FIELD.minor} strokeWidth="0.022" opacity="0.85" />
        <path d={FIELD.band} stroke="#c8924a" strokeWidth="0.032" opacity="0.7" />
      </g>

      {/* ---------- 05 · Axes ----------
          The optical axis runs the length of the sheet; the
          reference axis crosses it at the chair the room is aimed
          at. Where they meet IS the calibration origin. */}
      <g data-cal-axes stroke="#77736b" fill="none" strokeWidth="0.016" opacity="0.95">
        <path data-cal-axis-y d={`M0 ${FRAME.y0 + 0.5}V${FRAME.y1 - 0.5}`} strokeDasharray={AXIS_DASH} />
        <path
          data-cal-axis-x
          d={`M${FRAME.x0 + 0.5} ${REF.y}H${FRAME.x1 - 0.5}`}
          strokeDasharray={AXIS_DASH}
        />
        {/* The origin mark where they cross — a survey circle, the
            one place on the sheet that says "measure from here". */}
        <circle data-cal-origin cx="0" cy={REF.y} r="0.17" strokeWidth="0.02" />
      </g>

      {/* ---------- 05 · Dimensions ---------- */}
      <g data-cal-dims stroke="#77736b" strokeWidth="0.016" fill="none" opacity="0.95">
        <path data-cal-dim-run d={dim(false, ROOM.d + 0.68, -HALF_W, HALF_W)} />
        <path data-cal-dim-run d={dim(true, HALF_W + 0.82, 0, ROOM.d)} />
        <path data-cal-dim-run d={dim(false, -0.62, -D.screenWidth / 2, D.screenWidth / 2)} />
        <path data-cal-dim-run d={dim(true, -HALF_W - 0.82, SCREEN_FACE, ROWS[0])} />
        {/* Extension lines — the fine ticks that carry a dimension
            back to the thing it measures. Without them a run is a
            floating rule and the reader has to guess its ends. */}
        <path
          opacity="0.6"
          d={`M${-HALF_W} ${ROOM.d + WALL}v0.6M${HALF_W} ${ROOM.d + WALL}v0.6M${HALF_W + WALL} 0h0.6M${HALF_W + WALL} ${ROOM.d}h0.6M${-D.screenWidth / 2} ${SCREEN_Y}v-0.5M${D.screenWidth / 2} ${SCREEN_Y}v-0.5M${-HALF_W - WALL} ${SCREEN_FACE}h-0.6M${-HALF_W - WALL} ${ROWS[0]}h-0.6`}
        />
      </g>

      {/* ---------- 06 · The screen ---------- */}
      <g data-cal-screen>
        <rect
          x={-D.screenWidth / 2}
          y={SCREEN_Y}
          width={D.screenWidth}
          height={0.13}
          rx="0.03"
          fill="#111111"
        />
        <path
          d={`M${-D.screenWidth / 2} ${SCREEN_Y}v-0.16M${D.screenWidth / 2} ${SCREEN_Y}v-0.16`}
          stroke="#111111"
          strokeWidth="0.03"
        />
      </g>

      {/* ---------- 07 · Wavefronts ----------
          Parked at the source and scaled outward by the timeline.
          They live behind the furniture so they read as sound
          crossing the floor rather than as rings drawn over it. */}
      <g data-cal-waves clipPath={`url(#${uid}-room)`} opacity="0">
        {Array.from({ length: WAVE_COUNT }, (_, i) => (
          <g
            key={i}
            data-cal-wave={i}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${CENTRE.x}px ${CENTRE.y}px`,
              transform: 'scale(0.3)',
            }}
          >
            <path
              d={WAVE}
              fill="none"
              stroke="#c8924a"
              strokeWidth="1.1"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      {/* ---------- 08 · What the selected chair earns ----------
          React's to render, not the timeline's: selection is
          discrete, and a re-render on a click is what React is
          for. The transitions are in CSS so a change of seat
          eases rather than cuts. */}
      <g data-cal-read className="cal-fade">
        <path d={view.fill} fill="#c8924a" fillOpacity="0.06" />
        <path
          className="cal-morph"
          d={view.rays}
          fill="none"
          stroke="#c8924a"
          strokeWidth="0.018"
          strokeDasharray="0.17 0.12"
        />
        <path className="cal-morph" d={view.arc} fill="none" stroke="#c8924a" strokeWidth="0.026" />
        {/* The centre-channel run, whose length is the arrival
            figure in the panel. */}
        <line
          className="cal-path-line"
          x1={CENTRE.x}
          y1={CENTRE.y}
          x2={p.x}
          y2={p.y}
          stroke="#c8924a"
          strokeWidth="0.026"
          strokeLinecap="round"
        />
        {/* The measurement point. A survey crosshair in a circle,
            ON the chair coordinate — because the chair coordinate
            is exactly what `model.js` measures. Drawing this
            forward of the seat, where a head actually is, would be
            a nicer picture of a different measurement than the one
            the panel prints. */}
        <g className="cal-morph-move" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
          <circle r="0.15" fill="none" stroke="#c8924a" strokeWidth="0.024" />
          <path d="M-0.26 0h0.52M0 -0.26v0.52" stroke="#c8924a" strokeWidth="0.024" />
        </g>
      </g>

      {/* ---------- 09 · The three front channels ---------- */}
      <g data-cal-speakers>
        {SPEAKERS.map((sp, i) => (
          <g key={sp.id} data-cal-spk={i}>
            {/* Toe-in, drawn: the axis each cabinet is aimed down,
                which converges on the reference chair. This is the
                one line that explains why the speakers are not
                parallel to the wall. */}
            <line
              x1={sp.calibrated.x}
              y1={sp.calibrated.y}
              x2={REF.x}
              y2={REF.y}
              stroke="#77736b"
              strokeWidth="0.014"
              strokeDasharray="0.09 0.13"
              opacity="0.55"
            />
            <g style={{ transform: `translate(${sp.calibrated.x}px, ${sp.calibrated.y}px)` }}>
              <rect
                x={-SPK.w / 2}
                y={-SPK.d / 2}
                width={SPK.w}
                height={SPK.d}
                rx={SPK.r}
                fill="#111111"
              />
              <path d={`M0 ${SPK.d / 2}v0.16`} stroke="#111111" strokeWidth="0.024" opacity="0.55" />
            </g>
          </g>
        ))}
      </g>

      {/* ---------- 10 · The chairs ---------- */}
      <g data-cal-seats>
        {SEATS.map((s) => {
          const c = s.calibrated
          const on = s.i === activeSeat
          return (
            <g
              key={s.id}
              data-cal-seat={s.i}
              style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
            >
              {/* The locator that calls out the chair being read.
                  A drawing bracket, never a glow. */}
              <path
                d={`M${-CHAIR.w / 2 - 0.16} ${-CHAIR.d / 2 - 0.26}v-0.2h0.34M${CHAIR.w / 2 + 0.16} ${-CHAIR.d / 2 - 0.26}v-0.2h-0.34M${-CHAIR.w / 2 - 0.16} ${CHAIR.d / 2 + 0.46}v0.2h0.34M${CHAIR.w / 2 + 0.16} ${CHAIR.d / 2 + 0.46}v0.2h-0.34`}
                fill="none"
                stroke="#c8924a"
                strokeWidth="0.03"
                className="cal-fade"
                opacity={on ? 1 : 0}
              />
              <rect
                x={-CHAIR.w / 2}
                y={-CHAIR.d / 2}
                width={CHAIR.w}
                height={CHAIR.d}
                rx={CHAIR.r}
                fill={on ? 'rgba(200,146,74,0.20)' : 'rgba(17,17,17,0.07)'}
                stroke={on ? '#c8924a' : '#111111'}
                strokeWidth="0.024"
                className="cal-seat-pad"
              />
              <rect
                x={-CHAIR.w / 2}
                y={CHAIR.d / 2 - 0.02}
                width={CHAIR.w}
                height={CHAIR.rest}
                rx="0.07"
                fill={on ? 'rgba(200,146,74,0.20)' : 'rgba(17,17,17,0.07)'}
                stroke={on ? '#c8924a' : '#111111'}
                strokeWidth="0.024"
                className="cal-seat-pad"
              />
              <path
                d={`M${-CHAIR.w / 2 + 0.02} ${-CHAIR.d / 2 + 0.08}h-${CHAIR.arm}v${CHAIR.d - 0.1}h${CHAIR.arm}M${CHAIR.w / 2 - 0.02} ${-CHAIR.d / 2 + 0.08}h${CHAIR.arm}v${CHAIR.d - 0.1}h-${CHAIR.arm}`}
                fill="none"
                stroke={on ? '#c8924a' : '#111111'}
                strokeWidth="0.022"
                strokeLinejoin="round"
                className="cal-seat-pad"
              />
              {/* Every chair keeps its own measurement point at
                  drawing weight, so all seven survey positions are
                  on the sheet whether or not one is being read.
                  The selected chair's is drawn in signal above, so
                  this one clears to avoid two marks on one point. */}
              <path
                d="M-0.13 0h0.26M0 -0.13v0.26"
                stroke="#77736b"
                strokeWidth="0.018"
                opacity={on ? 0 : 0.75}
                className="cal-fade"
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export { ROWS, SCREEN_FACE }
