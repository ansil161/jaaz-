import { useMemo } from 'react'

/* ============================================================
   THE ROOM
   A one-point-perspective private cinema, drawn as vector so
   every light source is an addressable layer rather than a
   baked pixel. The hero timeline fades these layers up one at
   a time as you scroll — the room is assembled out of darkness.

   Geometry: viewBox 1600 x 900. The back wall opening is the
   rectangle [BX0..BX1] x [BY0..BY1]; the four surfaces are the
   quads between it and the frame edges. Because the room is a
   true one-point projection, any point on the ceiling or floor
   depends only on its DEPTH (p), which is what makes the
   generators below so short.
   ============================================================ */

/* The viewBox is deliberately 2:1. `slice` always crops the axis the
   viewport is short on, so a squarer room would lose its floor (and
   its seating) on every laptop. At 2:1 the worst case is roughly 10%
   off the top and bottom, which costs only empty ceiling and aisle. */
const W = 1600
const H = 800
const BX0 = 470
const BX1 = 1130
const BY0 = 200
const BY1 = 585

/* The screen, inside the back wall. 2.07:1 — cinemascope, masked. */
const SX = 520
const SY = 250
const SW = 560
const SH = 270

/* Depth 0 = at the camera, 1 = the back wall. Spacing compresses
   toward the vanishing point, which is what sells the perspective. */
const persp = (t) => Math.pow(t, 0.62)

const ceilY = (p) => BY0 * p
const floorY = (p) => H + (BY1 - H) * p
const leftX = (p) => BX0 * p
const rightX = (p) => W - (W - BX1) * p
const across = (p, u) => leftX(p) + (rightX(p) - leftX(p)) * u

/* Deterministic noise — the star field must be identical on every
   render, or React would reshuffle the sky on each re-render. */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function TheatreScene({ className = '' }) {
  const geo = useMemo(() => {
    /* --- Wall slats: fluted acoustic panelling, both side walls --- */
    const slats = []
    const SLATS = 26
    for (let i = 1; i <= SLATS; i++) {
      const p = persp(i / (SLATS + 1))
      slats.push({ p, x: leftX(p), top: ceilY(p), bot: floorY(p), side: 'l' })
      slats.push({ p, x: rightX(p), top: ceilY(p), bot: floorY(p), side: 'r' })
    }

    /* --- Ceiling coffers + floor joints: transverse lines --- */
    const coffers = []
    const COFFERS = 11
    for (let i = 1; i <= COFFERS; i++) {
      const p = persp(i / (COFFERS + 1))
      coffers.push({ p, y: ceilY(p), x0: leftX(p), x1: rightX(p) })
    }

    const floorLines = []
    for (let i = 1; i <= 7; i++) {
      const p = persp(i / 8)
      floorLines.push({ p, y: floorY(p), x0: leftX(p), x1: rightX(p) })
    }

    /* --- Star ceiling: fibre-optic points across the ceiling plane --- */
    const rnd = mulberry32(20260822)
    const stars = []
    for (let i = 0; i < 170; i++) {
      const p = 0.04 + rnd() * 0.94
      const u = rnd()
      const near = 1 - p // closer stars are larger and brighter
      stars.push({
        x: across(p, u),
        y: ceilY(p),
        r: 0.9 + near * 2.6 * rnd(),
        o: 0.25 + rnd() * 0.75,
        tw: rnd() < 0.42, // only some twinkle, or the sky reads as static
        delay: (rnd() * 6).toFixed(2),
        dur: (2.8 + rnd() * 4.5).toFixed(2),
      })
    }

    /* --- Seating: three receding rows of recliner silhouettes ---
       Depths are chosen so the rows sit ABOVE the frame's bottom
       crop on wide viewports; any closer and the front row becomes
       an unreadable black mass instead of a row of chairs. The
       lateral range stops short of the walls so the aisle lighting
       still has an aisle to light. */
    const AISLE = [0.2, 0.8]
    const rows = [
      { p: 0.38, seats: 7, riser: 0 },
      { p: 0.5, seats: 8, riser: 32 },
      { p: 0.62, seats: 9, riser: 58 },
    ]
    const seats = []
    rows.forEach((row, ri) => {
      const s = 1 - 1.02 * row.p // perspective size falloff
      /* Stadium risers. Without them the floor only recedes ~215 units
         across the whole room while a seat back is ~100 tall, so every
         row would land on top of the one in front and the auditorium
         would read as a single black bar. */
      const y = floorY(row.p) - row.riser
      for (let i = 0; i < row.seats; i++) {
        const t = (i + 0.5) / row.seats
        // Rows stagger laterally so a back seat is never hidden by a front one.
        const u = AISLE[0] + (AISLE[1] - AISLE[0]) * t + (ri % 2 ? 0.012 : -0.012)
        seats.push({ x: across(row.p, u), y, s, row: ri })
      }
    })

    return { slats, coffers, floorLines, stars, seats }
  }, [])

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Screen emission — hot centre, falling to nothing at the edge. */}
        <radialGradient id="jaz-screenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
        </radialGradient>

        {/* Light the screen throws back into the room. */}
        <radialGradient id="jaz-spill" cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.36" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Cove and step lighting fall off away from the source. */}
        <linearGradient id="jaz-coveL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="jaz-coveR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>

        {/* Grazing wash down the fluted walls — bright at the cove, dying at the floor. */}
        <linearGradient id="jaz-wallWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* The projection beam, seen through the room's haze. */}
        <linearGradient id="jaz-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>

        <filter id="jaz-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id="jaz-softer" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="42" />
        </filter>
        <filter id="jaz-tight" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        {/* Wall washes are clipped to their surface so light never leaks. */}
        <clipPath id="jaz-clipL">
          <polygon points={`0,0 ${BX0},${BY0} ${BX0},${BY1} 0,${H}`} />
        </clipPath>
        <clipPath id="jaz-clipR">
          <polygon points={`${W},0 ${BX1},${BY0} ${BX1},${BY1} ${W},${H}`} />
        </clipPath>
        <clipPath id="jaz-clipCeil">
          <polygon points={`0,0 ${W},0 ${BX1},${BY0} ${BX0},${BY0}`} />
        </clipPath>
        <clipPath id="jaz-clipFloor">
          <polygon points={`0,${H} ${W},${H} ${BX1},${BY1} ${BX0},${BY1}`} />
        </clipPath>
      </defs>

      {/* Room black. Never pure #000 in the corners — a real room has bounce. */}
      <rect width={W} height={H} fill="#000" />

      {/* ---------- 1. STRUCTURE: the faintest possible edge ---------- */}
      <g data-layer="structure" opacity="0">
        <g stroke="#ffffff" strokeOpacity="0.13" strokeWidth="1" fill="none">
          <polygon points={`0,0 ${BX0},${BY0} ${BX0},${BY1} 0,${H}`} />
          <polygon points={`${W},0 ${BX1},${BY0} ${BX1},${BY1} ${W},${H}`} />
          <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} />
        </g>
      </g>

      {/* ---------- 2. AISLE + STEP LIGHTING ---------- */}
      <g data-layer="steps" opacity="0">
        <g clipPath="url(#jaz-clipFloor)">
          {/* Pools of light on the floor, brightest at the wall base. */}
          <polygon
            points={`0,${H} ${BX0},${BY1} ${BX0 + 120},${BY1} 190,${H}`}
            fill="#ffffff"
            opacity="0.07"
            filter="url(#jaz-soft)"
          />
          <polygon
            points={`${W},${H} ${BX1},${BY1} ${BX1 - 120},${BY1} ${W - 190},${H}`}
            fill="#ffffff"
            opacity="0.07"
            filter="url(#jaz-soft)"
          />
        </g>
        {/* The strips themselves, at the wall/floor junction. */}
        <line x1="0" y1={H} x2={BX0} y2={BY1} stroke="url(#jaz-coveR)" strokeWidth="2.5" />
        <line x1={W} y1={H} x2={BX1} y2={BY1} stroke="url(#jaz-coveL)" strokeWidth="2.5" />
        <line
          x1={BX0}
          y1={BY1}
          x2={BX1}
          y2={BY1}
          stroke="#ffffff"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />
        {/* Floor joints, only visible once there is light to see them by. */}
        <g clipPath="url(#jaz-clipFloor)" stroke="#ffffff" fill="none">
          {geo.floorLines.map((l, i) => (
            <line
              key={i}
              x1={l.x0}
              y1={l.y}
              x2={l.x1}
              y2={l.y}
              strokeOpacity={0.035 + l.p * 0.05}
              strokeWidth="1"
            />
          ))}
        </g>
      </g>

      {/* ---------- 3. ACOUSTIC WALLS ---------- */}
      <g data-layer="walls" opacity="0">
        {['l', 'r'].map((side) => (
          <g key={side} clipPath={`url(#jaz-clip${side === 'l' ? 'L' : 'R'})`}>
            {/* The wash first, so the slats sit inside the light. */}
            <rect
              x={side === 'l' ? 0 : BX1}
              y="0"
              width={side === 'l' ? BX0 : W - BX1}
              height={H}
              fill="url(#jaz-wallWash)"
            />
            {geo.slats
              .filter((s) => s.side === side)
              .map((s, i) => (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.top}
                  x2={s.x}
                  y2={s.bot}
                  stroke="#ffffff"
                  /* Slats catch more light the deeper they are — they turn
                     toward the cove, and toward the screen. */
                  strokeOpacity={0.06 + s.p * 0.26}
                  strokeWidth={1.4 - s.p * 0.7}
                />
              ))}
          </g>
        ))}
        {/* Back wall panelling, framing the screen. */}
        <g stroke="#ffffff" strokeOpacity="0.14" fill="none">
          <rect x={BX0 + 22} y={BY0 + 22} width={BX1 - BX0 - 44} height={BY1 - BY0 - 44} />
        </g>
      </g>

      {/* ---------- 4. CEILING COVE ---------- */}
      <g data-layer="cove" opacity="0">
        {/* Coffer lines revealed by the cove wash. */}
        <g clipPath="url(#jaz-clipCeil)" stroke="#ffffff" fill="none">
          {geo.coffers.map((c, i) => (
            <line
              key={i}
              x1={c.x0}
              y1={c.y}
              x2={c.x1}
              y2={c.y}
              strokeOpacity={0.05 + c.p * 0.16}
              strokeWidth="1"
            />
          ))}
        </g>
        {/* The cove itself: the wall/ceiling junction, glowing. */}
        <g filter="url(#jaz-tight)">
          <line x1="0" y1="0" x2={BX0} y2={BY0} stroke="url(#jaz-coveR)" strokeWidth="3" />
          <line x1={W} y1="0" x2={BX1} y2={BY0} stroke="url(#jaz-coveL)" strokeWidth="3" />
          <line
            x1={BX0}
            y1={BY0}
            x2={BX1}
            y2={BY0}
            stroke="#ffffff"
            strokeOpacity="0.75"
            strokeWidth="2"
          />
        </g>
        {/* Soft bloom shed downward from the cove. */}
        <g clipPath="url(#jaz-clipCeil)" opacity="0.5">
          <polygon
            points={`0,0 ${BX0},${BY0} ${BX1},${BY0} ${W},0`}
            fill="#ffffff"
            opacity="0.05"
            filter="url(#jaz-softer)"
          />
        </g>
      </g>

      {/* ---------- 5. STAR CEILING ---------- */}
      <g data-layer="stars" opacity="0" clipPath="url(#jaz-clipCeil)">
        {geo.stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#ffffff"
            opacity={s.o}
            style={
              s.tw
                ? {
                    animation: `jaz-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                  }
                : undefined
            }
          />
        ))}
        {/* A few brighter anchor stars with a halo. */}
        {geo.stars.slice(0, 9).map((s, i) => (
          <circle
            key={`h${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r * 3.4}
            fill="#ffffff"
            opacity="0.16"
            filter="url(#jaz-tight)"
          />
        ))}
      </g>

      {/* ---------- 6. THE SCREEN ---------- */}
      <g data-layer="screen" opacity="0">
        {/* Spill onto the room before the screen itself, so the room
            appears to be lit BY the screen rather than beside it. */}
        <g data-layer="spill">
          <ellipse cx="800" cy={SY + SH / 2} rx="900" ry="560" fill="url(#jaz-spill)" />
        </g>
        <rect
          x={SX}
          y={SY}
          width={SW}
          height={SH}
          fill="url(#jaz-screenGlow)"
          filter="url(#jaz-soft)"
          opacity="0.55"
        />
        <rect x={SX} y={SY} width={SW} height={SH} fill="url(#jaz-screenGlow)" />
        {/* Masking frame — a real screen has a hard, dense edge. */}
        <rect
          x={SX}
          y={SY}
          width={SW}
          height={SH}
          fill="none"
          stroke="#000000"
          strokeOpacity="0.55"
          strokeWidth="7"
        />
      </g>

      {/* ---------- 7. PROJECTION BEAM ---------- */}
      <g data-layer="beam" opacity="0">
        {/* Haze in the air between the lens and the screen. Blurred
            hard, because a visible edge on a light shaft reads as a
            polygon rather than as atmosphere. */}
        <polygon
          points={`768,-200 832,-200 ${SX + SW},${SY + SH} ${SX},${SY + SH}`}
          fill="url(#jaz-beam)"
          filter="url(#jaz-soft)"
          opacity="0.75"
        />
      </g>

      {/* ---------- 8. SEATING ---------- */}
      <g data-layer="seats" opacity="0">
        {geo.seats.map((s, i) => {
          const w = 128 * s.s
          const h = 168 * s.s
          const hr = 36 * s.s // head-rest radius
          const x = s.x - w / 2
          const y = s.y - h
          return (
            <g key={i}>
              {/* Recliner silhouette: back, head-rest, arms. */}
              <path
                d={`M ${x} ${s.y}
                    L ${x} ${y + hr}
                    Q ${x} ${y} ${x + hr} ${y}
                    L ${x + w - hr} ${y}
                    Q ${x + w} ${y} ${x + w} ${y + hr}
                    L ${x + w} ${s.y} Z`}
                fill="#000000"
                fillOpacity="0.94"
              />
              {/* Rim light down the near edge — the only thing separating
                  a black chair from a black room. */}
              <path
                d={`M ${x} ${s.y} L ${x} ${y + hr} Q ${x} ${y} ${x + hr} ${y}`}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.22 - s.row * 0.05}
                strokeWidth={1.3 * s.s}
              />
              <path
                d={`M ${x + w} ${s.y} L ${x + w} ${y + hr} Q ${x + w} ${y} ${x + w - hr} ${y}`}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.13 - s.row * 0.03}
                strokeWidth={1.1 * s.s}
              />
            </g>
          )
        })}
      </g>

      {/* Vignette: keeps the eye at the screen, always on top. */}
      <radialGradient id="jaz-vig" cx="50%" cy="46%" r="72%">
        <stop offset="55%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
      </radialGradient>
      <rect width={W} height={H} fill="url(#jaz-vig)" pointerEvents="none" />
    </svg>
  )
}
