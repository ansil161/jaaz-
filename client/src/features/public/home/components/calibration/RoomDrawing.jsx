import { calibration as D } from '@/features/public/data/site'
import { CHAIR, FIELD, ROOM, SEATS, SPEAKERS, SPK, VB, seatFill } from './model'

/* ============================================================
   THE ROOM, DRAWN

   One architectural plan, in the room's own metres. Every layer
   the choreography needs to touch carries a `data-cal-*` hook and
   nothing else: the parent looks the nodes up once inside its
   GSAP context and writes to them, so this file stays a drawing
   and the timeline stays a timeline.

   IT IS AN INK DRAWING, NOT AN ICON SET. Walls have thickness and
   are hatched at the boundary; the screen is drawn as a screen
   rather than as a rectangle labelled one; a chair has a back and
   two arms. The weights are a real drawing's weights — the wall
   heaviest, the furniture next, the field lightest — which is
   what stops a technical plan reading as a wireframe.

   NOTHING HERE IS TEXT. Every label on this drawing is HTML in
   the layer above it, positioned by `pctX`/`pctY` off this same
   viewBox. Text in an SVG that scales from 320px to 700px wide is
   either illegible at one end or oversized at the other, and no
   amount of `vector-effect` fixes that — a percentage-positioned
   span in the layer above stays at a chosen size in px and stays
   crisp.

   `uid` namespaces the defs. SVG ids are global to the document,
   and this drawing is rendered twice on the page — once as the
   demonstration and once as the instrument.
   ============================================================ */

const HALF_W = ROOM.w / 2
const WALL = 0.16
/* The screen hangs on the inner face of the front wall, which is
   y = 0. Drawn outside it — as an earlier pass had it — the room's
   own screen reads as sitting in the corridor behind the room. */
const SCREEN_Y = 0.03
const SCREEN_FACE = SCREEN_Y + 0.13
const CENTRE = SPEAKERS.find((s) => s.id === 'C') ?? SPEAKERS[1]

/* The two overlays a selected chair earns, both derived from the
   same coordinates the chair is drawn at. They are geometry, not
   decoration: the cone is the actual angle the screen subtends
   from that seat, and the line is the actual centre-channel path
   whose length the readout prints in milliseconds. */
const coneOf = (p) => ({
  fillD: `M${p.x} ${p.y}L${-D.screenWidth / 2} ${SCREEN_FACE}L${D.screenWidth / 2} ${SCREEN_FACE}Z`,
  lineD: `M${-D.screenWidth / 2} ${SCREEN_FACE}L${p.x} ${p.y}L${D.screenWidth / 2} ${SCREEN_FACE}`,
})

export default function RoomDrawing({
  uid,
  variant = 'demo',
  activeSeat = null,
  interactive = false,
  className = '',
}) {
  const seat = activeSeat === null ? null : SEATS[activeSeat]
  const cone = coneOf(seat ? seat.calibrated : SEATS[0].calibrated)

  return (
    <svg
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      className={`h-full w-full ${className}`}
      aria-hidden="true"
      focusable="false"
      data-cal-svg={variant}
    >
      <defs>
        {/* The paper the plan is drawn on — a shade off the sheet
            so the room reads as a surface rather than as a hole. */}
        <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8c1b4" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#c8c1b4" stopOpacity="0.12" />
        </linearGradient>
        {/* Wall hatch, at 45° like a section poché. */}
        <pattern
          id={`${uid}-hatch`}
          width="0.26"
          height="0.26"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="0.26" stroke="#111111" strokeWidth="0.05" opacity="0.5" />
        </pattern>
        {/* The scan band. A gradient, not a rule — an analysis
            pass is a moving field, and a 1px line reads as a
            slider handle. */}
        <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8924a" stopOpacity="0" />
          <stop offset="62%" stopColor="#c8924a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c8924a" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}-room`}>
          <rect x={-HALF_W} y={0} width={ROOM.w} height={ROOM.d} />
        </clipPath>
      </defs>

      {/* ---------- Ground ---------- */}
      <g data-cal-room opacity={variant === 'demo' ? 0 : 1}>
        <rect
          x={-HALF_W}
          y={0}
          width={ROOM.w}
          height={ROOM.d}
          fill={`url(#${uid}-floor)`}
        />

        {/* Walls: hatched poché outside a crisp inner line. Drawn
            as four bands so the screen wall can be heavier than
            the other three, which is how a plan says "this is the
            wall the room is aimed at". */}
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
              fill={`url(#${uid}-hatch)`}
              stroke="#111111"
              strokeWidth="0.022"
            />
          ))}
        </g>

        {/* Dimension marks. Two runs, one per axis, with the tick
            style a drawing actually uses — a short oblique at each
            end, not an arrowhead. The figures are set in the HTML
            layer above. */}
        <g data-cal-dims stroke="#77736b" strokeWidth="0.018" fill="none">
          <path
            d={`M${-HALF_W} ${ROOM.d + 0.62}H${HALF_W}M${-HALF_W - 0.12} ${ROOM.d + 0.5}l0.24 0.24M${HALF_W - 0.12} ${ROOM.d + 0.5}l0.24 0.24`}
          />
          <path
            d={`M${HALF_W + 0.78} 0V${ROOM.d}M${HALF_W + 0.66} ${-0.12}l0.24 0.24M${HALF_W + 0.66} ${ROOM.d - 0.12}l0.24 0.24`}
          />
        </g>
      </g>

      {/* ---------- The field ----------
          Two renderings of one function. The conventional set is
          drawn first and faded out as the calibrated set draws in,
          because the two have different topology and cannot be
          morphed point to point — and a crossfade of two true
          fields is more honest than a tween between them. */}
      <g clipPath={`url(#${uid}-room)`}>
        {/* The instrument never shows the conventional field — it
            is a calibrated room being interrogated, and carrying a
            second full set of contours it will never reveal is
            four thousand path commands the browser rasterises for
            nothing. */}
        {!interactive && (
          <g
            data-cal-field="conventional"
            opacity="0"
            fill="none"
            stroke="#b7af9f"
            style={{ willChange: 'opacity' }}
          >
            <path d={FIELD.conventional.minor} strokeWidth="0.026" />
            <path
              data-cal-band
              d={FIELD.conventional.band}
              stroke="#c8924a"
              strokeWidth="0.04"
              opacity="0.75"
            />
          </g>
        )}
        <g
          data-cal-field="calibrated"
          opacity={interactive ? 1 : 0}
          fill="none"
          stroke="#b7af9f"
          style={{ willChange: 'opacity' }}
        >
          <path d={FIELD.calibrated.minor} strokeWidth="0.026" />
          <path
            data-cal-band
            d={FIELD.calibrated.band}
            stroke="#c8924a"
            strokeWidth="0.04"
            opacity="0.75"
          />
        </g>

        {/* The analysis pass. Parked above the room until the
            timeline moves it. */}
        <rect
          data-cal-scan
          x={-HALF_W}
          y={-1.1}
          width={ROOM.w}
          height={1.1}
          fill={`url(#${uid}-scan)`}
          opacity="0"
        />
        <line
          data-cal-scan-line
          x1={-HALF_W}
          y1={0}
          x2={HALF_W}
          y2={0}
          stroke="#c8924a"
          strokeWidth="0.03"
          opacity="0"
        />
      </g>

      {/* ---------- The screen ---------- */}
      <g data-cal-screen opacity={variant === 'demo' ? 0 : 1}>
        <rect
          x={-D.screenWidth / 2}
          y={SCREEN_Y}
          width={D.screenWidth}
          height={0.13}
          rx="0.03"
          fill="#111111"
        />
        {/* The two returns that carry it, drawn back to the wall. */}
        <path
          d={`M${-D.screenWidth / 2} ${SCREEN_Y}v-0.16M${D.screenWidth / 2} ${SCREEN_Y}v-0.16`}
          stroke="#111111"
          strokeWidth="0.03"
        />
      </g>

      {/* ---------- Viewing geometry and the centre-channel path
          ----------
          Drawn behind the furniture so they read as light on the
          floor rather than as a diagram laid over it. In the
          instrument they are React's to render — selection is
          discrete and a re-render on a click is what React is for.
          In the demonstration the timeline writes them, because
          there they are scrubbed. */}
      <g data-cal-cone opacity={interactive && seat ? 1 : 0} className="cal-fade">
        <path
          data-cal-cone-fill
          fill="#c8924a"
          fillOpacity="0.07"
          d={interactive && seat ? cone.fillD : ''}
        />
        <path
          data-cal-cone-line
          fill="none"
          stroke="#c8924a"
          strokeWidth="0.02"
          strokeDasharray="0.16 0.12"
          d={interactive && seat ? cone.lineD : ''}
        />
      </g>

      <g data-cal-path opacity={interactive && seat ? 1 : 0} className="cal-fade">
        <line
          data-cal-path-line
          stroke="#c8924a"
          strokeWidth="0.028"
          strokeLinecap="round"
          x1={CENTRE.calibrated.x}
          y1={CENTRE.calibrated.y}
          x2={seat ? seat.calibrated.x : CENTRE.calibrated.x}
          y2={seat ? seat.calibrated.y : CENTRE.calibrated.y}
          className="cal-path-line"
        />
      </g>

      {/* ---------- Ghost memory ----------
          Where a conventional layout puts each chair, kept as a
          dotted outline with a vector to where calibration puts
          it. It is a memory of the previous configuration, so it
          is drawn at the weight a pencil underlay would be. */}
      <g data-cal-ghosts opacity={interactive ? 1 : 0}>
        {SEATS.filter((s) => !interactive || s.i === activeSeat).map((s) => (
          <g key={`ghost-${s.id}`} data-cal-ghost={s.i}>
            <line
              data-cal-vector
              x1={s.conventional.x}
              y1={s.conventional.y}
              x2={s.calibrated.x}
              y2={s.calibrated.y}
              stroke="#77736b"
              strokeWidth="0.018"
              strokeDasharray="0.1 0.1"
            />
            <rect
              x={s.conventional.x - CHAIR.w / 2}
              y={s.conventional.y - CHAIR.d / 2}
              width={CHAIR.w}
              height={CHAIR.d}
              rx={CHAIR.r}
              fill="none"
              stroke="#77736b"
              strokeWidth="0.022"
              strokeDasharray="0.12 0.1"
            />
          </g>
        ))}
      </g>

      {/* ---------- The three front channels ---------- */}
      <g data-cal-speakers opacity={variant === 'demo' ? 0 : 1}>
        {SPEAKERS.map((sp, i) => (
          <g
            key={sp.id}
            data-cal-spk={i}
            style={{
              transform: `translate(${(variant === 'demo' ? sp.conventional : sp.calibrated).x}px, ${(variant === 'demo' ? sp.conventional : sp.calibrated).y}px)`,
            }}
          >
            <rect
              x={-SPK.w / 2}
              y={-SPK.d / 2}
              width={SPK.w}
              height={SPK.d}
              rx={SPK.r}
              fill="#111111"
            />
            {/* The axis it is aimed down — two ticks, not a beam. */}
            <path
              d={`M0 ${SPK.d / 2}v0.16`}
              stroke="#111111"
              strokeWidth="0.024"
              opacity="0.55"
            />
          </g>
        ))}
      </g>

      {/* ---------- The chairs ----------
          Outline always at full ink so a chair is always a chair;
          the FILL is the reading. See `seatFill` in model.js for
          why the density is the argument. */}
      <g data-cal-seats opacity={variant === 'demo' ? 0 : 1}>
        {SEATS.map((s) => {
          const p = variant === 'demo' ? s.conventional : s.calibrated
          return (
            <g
              key={s.id}
              data-cal-seat={s.i}
              style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
            >
              {/* The locator that marks the chair being read. A
                  bracket, the way a drawing calls out a detail —
                  never a glow. */}
              <path
                data-cal-locator
                d={`M${-CHAIR.w / 2 - 0.18} ${-CHAIR.d / 2 - 0.3}v-0.2h0.34M${CHAIR.w / 2 + 0.18} ${-CHAIR.d / 2 - 0.3}v-0.2h-0.34M${-CHAIR.w / 2 - 0.18} ${CHAIR.d / 2 + 0.42}v0.2h0.34M${CHAIR.w / 2 + 0.18} ${CHAIR.d / 2 + 0.42}v0.2h-0.34`}
                fill="none"
                stroke="#c8924a"
                strokeWidth="0.03"
                opacity={activeSeat === s.i ? 1 : 0}
              />
              <rect
                data-cal-pad
                x={-CHAIR.w / 2}
                y={-CHAIR.d / 2}
                width={CHAIR.w}
                height={CHAIR.d}
                rx={CHAIR.r}
                fill={seatFill(p.db)}
                stroke="#111111"
                strokeWidth="0.024"
              />
              {/* Back and arms, so the chair faces the screen. */}
              <rect
                data-cal-rest
                x={-CHAIR.w / 2}
                y={CHAIR.d / 2 - 0.02}
                width={CHAIR.w}
                height={CHAIR.rest}
                rx="0.07"
                fill={seatFill(p.db)}
                stroke="#111111"
                strokeWidth="0.024"
              />
              <path
                d={`M${-CHAIR.w / 2 + 0.02} ${-CHAIR.d / 2 + 0.08}h-${CHAIR.arm}v${CHAIR.d - 0.1}h${CHAIR.arm}M${CHAIR.w / 2 - 0.02} ${-CHAIR.d / 2 + 0.08}h${CHAIR.arm}v${CHAIR.d - 0.1}h-${CHAIR.arm}`}
                fill="none"
                stroke="#111111"
                strokeWidth="0.022"
                strokeLinejoin="round"
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
