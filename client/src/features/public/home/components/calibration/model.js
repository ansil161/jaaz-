import { calibration as D } from '@/features/public/data/site'

/* ============================================================
   CALIBRATION — THE MODEL

   Everything the instrument draws and every figure it prints is
   derived here, once, at module load. The components below this
   file hold no numbers of their own: a component that could
   invent a measurement is a component that will eventually
   disagree with the drawing beside it.

   `data/site.js` holds the only authored geometry — two seating
   layouts as metres in one coordinate system whose origin is the
   centre of the screen wall, with +y running back into the room.
   That system IS the drawing's viewBox, so a chair cannot appear
   anywhere except where it was measured.

   WHAT IS MODELLED, AND HOW HONESTLY.

     level    the direct field of the three front channels,
              power-summed at inverse square, expressed against
              the MEAN of all seven chairs — the room's own
              average, which is what a calibration targets.
              Quoting every chair against one favoured chair is
              the sleight of hand this section exists to refuse.
     arrival  centre-channel path length at 343 m/s, in ms.
     picture  horizontal viewing angle at the chair, against the
              30-40 degree window the trade already works to.

   It is a first-order model and it is the right one for this
   argument: what separates a good chair from a bad one at this
   scale is path length, not the fifth decimal of a transfer
   function. The section says "modelled", never "measured in this
   room", and `contourNote` in the copy says so on the sheet.

   THE CONTOUR FIELD IS THE SAME MODEL, DRAWN. `isoPaths()` runs
   marching squares over the identical `levelAt` used for the
   chairs, so the lines on the plan and the numbers in the margin
   cannot drift apart — they are two renderings of one function.
   The field is sampled ONCE per layout onto a grid and every
   level is then traced from that grid; sampling per level was
   thirteen times the work for the same picture.
   ============================================================ */

const RAD = 180 / Math.PI
const MINUS = '−'

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
export const lerp = (a, b, t) => a + (b - a) * t

/* A floor under the distance term. Without it the field goes to
   infinity at the three source points and the innermost contours
   collapse into a knot of arcs around a mathematical singularity
   — which is not what a speaker does and not what a field map
   looks like. 0.35 m is roughly the radius of the cabinet. */
const NEAR = 0.35

const levelAt = (speakers, p) =>
  10 * Math.log10(speakers.reduce((sum, s) => sum + 1 / Math.max(dist(s, p), NEAR) ** 2, 0))

/* One layout in, seven measured chairs out, plus the mean the
   whole layout is quoted against. */
const measure = ({ speakers, seats }) => {
  const level = seats.map((seat) => levelAt(speakers, seat))
  const mean = level.reduce((a, b) => a + b, 0) / level.length
  const centre = speakers.find((sp) => sp.id === 'C') ?? speakers[1]
  return {
    mean,
    speakers,
    seats: seats.map((seat, i) => ({
      x: seat.x,
      y: seat.y,
      db: level[i] - mean,
      ms: (dist(centre, seat) / D.speedOfSound) * 1000,
      view: 2 * Math.atan(D.screenWidth / 2 / seat.y) * RAD,
      /* Straight-line distance from the chair to the CENTRE of the
         screen, which is what "screen distance" means for a chair
         that is not on the axis. The screen hangs on the front
         wall, so that point is the origin. */
      dist: Math.hypot(seat.x, seat.y),
    })),
  }
}

const FOUND = measure(D.asFound)
const BUILT = measure(D.asBuilt)

export const SEAT_COUNT = BUILT.seats.length

/* Which row a chair is in. Derived from the calibrated layout
   rather than written down twice: its two rows are the only two
   distinct depths in `asBuilt`, and the conventional layout
   splits three and four the same way. */
const DEPTHS = [...new Set(BUILT.seats.map((s) => s.y))].sort((a, b) => a - b)
const ROW = BUILT.seats.map((s) => DEPTHS.indexOf(s.y))

/* ---------- Formatting ----------
   Exactly zero prints as a plus-minus rather than a bare 0.0 —
   it is a tolerance, not a nothing. */
export const fmtDb = (v) => {
  const r = Math.round(v * 10) / 10
  if (r === 0) return '±0.0'
  return `${r > 0 ? '+' : MINUS}${Math.abs(r).toFixed(1)}`
}
const fmtAbs = (v) => Math.abs(v).toFixed(1)
export const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k])

/* ---------- The seat model ----------
   One row per chair, carrying both of its lives. Nothing in the
   components indexes into `asFound`/`asBuilt` directly; they read
   this. */
/* A chair passes when it lands inside BOTH windows the section
   claims to hold every chair to: the ±1 dB reference band and the
   trade's own 30-40° picture window. It is computed, never
   asserted — a chair that fell out of either one would print the
   other word, and the sheet would be right to say so. */
const holds = (s) => Math.abs(s.db) <= D.lab.band && s.view >= D.viewWindow[0] && s.view <= D.viewWindow[1]

export const SEATS = BUILT.seats.map((b, i) => {
  const a = FOUND.seats[i]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const id = String(i + 1).padStart(2, '0')
  return {
    i,
    id,
    label: `${D.lab.seatWord} ${id}`,
    row: ROW[i],
    rowName: D.lab.rows[ROW[i]],
    ok: holds(b),
    conventional: { x: a.x, y: a.y, db: a.db, ms: a.ms, view: a.view, dist: a.dist },
    calibrated: { x: b.x, y: b.y, db: b.db, ms: b.ms, view: b.view, dist: b.dist },
    correction: { dx, dy, move: Math.hypot(dx, dy) },
    explain: fill(D.lab.explain, {
      n: id,
      a: fmtAbs(a.db),
      b: fmtAbs(b.db),
      d: Math.hypot(dx, dy).toFixed(2),
      v: b.view.toFixed(1),
    }),
  }
})

export const SPEAKERS = D.asBuilt.speakers.map((b, i) => ({
  id: b.id,
  conventional: D.asFound.speakers[i],
  calibrated: b,
}))

/* How many chairs land inside the trade's own picture window, and
   inside the ±1 dB reference band the drawing shades. Computed,
   not claimed. */
const inWindow = (v) => v >= D.viewWindow[0] && v <= D.viewWindow[1]
export const INSIDE = {
  view: {
    from: FOUND.seats.filter((s) => inWindow(s.view)).length,
    to: BUILT.seats.filter((s) => inWindow(s.view)).length,
  },
  band: {
    from: FOUND.seats.filter((s) => Math.abs(s.db) <= D.lab.band).length,
    to: BUILT.seats.filter((s) => Math.abs(s.db) <= D.lab.band).length,
  },
}

/* ---------- The field, drawn ----------
   Marching squares. Segments are stitched into polylines before
   they are written out so each contour is one continuous stroke
   rather than a few hundred two-point subpaths — which matters
   for line joins, for `stroke-dasharray` draw-on, and for the
   size of the `d` attribute. */
const REGION = { x0: -D.room.w / 2, x1: D.room.w / 2, y0: 0, y1: D.room.d, nx: 54, ny: 72 }

/* Marching squares emits one vertex per cell edge it crosses, and
   a contour that crosses forty cells is forty vertices describing
   what the eye reads as one smooth arc. Dropping the vertices
   that sit within `EPS` metres of the straight line between their
   neighbours cuts the path data by about two thirds and changes
   the drawing by less than a tenth of a pixel at any size this
   is rendered at.

   This is not premature. The field is drawn twice on the page,
   each set is animated by opacity, and an unsimplified set put
   the pinned stage into repaint stalls long enough for the
   renderer to stop answering. */
/* 0.012 m at a drawing scale of roughly 50 px/m is a quarter of a
   pixel — under the rasteriser's own resolution, so the curve it
   produces is the curve. An earlier pass ran this at 0.035 on a
   coarser grid: three times cheaper and the contours came out
   faceted into visible chevrons, which reads as a wireframe
   rather than as a field and is the one thing this drawing must
   not do. */
const EPS = 0.012
const simplify = (line) => {
  if (line.length < 3) return line
  const out = [line[0]]
  for (let i = 1; i < line.length - 1; i += 1) {
    const a = out[out.length - 1]
    const b = line[i]
    const c = line[i + 1]
    const ax = c[0] - a[0]
    const ay = c[1] - a[1]
    const len = Math.hypot(ax, ay)
    const dev = len === 0 ? 0 : Math.abs(ax * (a[1] - b[1]) - ay * (a[0] - b[0])) / len
    if (dev > EPS) out.push(b)
  }
  out.push(line[line.length - 1])
  return out
}

const sampleField = (layout) => {
  const { x0, x1, y0, y1, nx, ny } = REGION
  const dx = (x1 - x0) / nx
  const dy = (y1 - y0) / ny
  const g = []
  for (let j = 0; j <= ny; j += 1) {
    const row = new Float64Array(nx + 1)
    for (let i = 0; i <= nx; i += 1) {
      row[i] = levelAt(layout.speakers, { x: x0 + i * dx, y: y0 + j * dy }) - layout.mean
    }
    g.push(row)
  }
  return g
}

/* Edge index → the two corners it spans, and the case table.
   Corners run 0..3 anticlockwise from the cell's top-left in plan
   coordinates; edges 0..3 are the sides between them. */
const CASES = {
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  5: [[3, 0], [1, 2]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[2, 0]],
  10: [[0, 1], [2, 3]],
  11: [[2, 1]],
  12: [[1, 3]],
  13: [[1, 0]],
  14: [[0, 3]],
}

const traceLevel = (grid, level) => {
  const { x0, y0, x1, y1, nx, ny } = REGION
  const dx = (x1 - x0) / nx
  const dy = (y1 - y0) / ny
  const segs = []

  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const v = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]]
      let idx = 0
      for (let k = 0; k < 4; k += 1) if (v[k] > level) idx |= 1 << k
      if (idx === 0 || idx === 15) continue

      const px = x0 + i * dx
      const py = y0 + j * dy
      const corner = [
        [px, py],
        [px + dx, py],
        [px + dx, py + dy],
        [px, py + dy],
      ]
      const edge = (e) => {
        const a = corner[e]
        const b = corner[(e + 1) % 4]
        const t = (level - v[e]) / (v[(e + 1) % 4] - v[e])
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      }
      for (const [a, b] of CASES[idx]) segs.push([edge(a), edge(b)])
    }
  }

  /* Stitch. Endpoints are matched on a rounded key, which is safe
     because every segment endpoint is produced by the same
     interpolation on a shared cell edge — two cells meeting at an
     edge compute bit-identical values. */
  const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`
  const starts = new Map()
  segs.forEach((s, n) => {
    const k = key(s[0])
    if (!starts.has(k)) starts.set(k, [])
    starts.get(k).push(n)
  })

  const used = new Uint8Array(segs.length)
  const lines = []
  for (let n = 0; n < segs.length; n += 1) {
    if (used[n]) continue
    used[n] = 1
    const line = [segs[n][0], segs[n][1]]
    for (let guard = 0; guard < segs.length; guard += 1) {
      const next = (starts.get(key(line[line.length - 1])) ?? []).find((m) => !used[m])
      if (next === undefined) break
      used[next] = 1
      line.push(segs[next][1])
      if (key(line[0]) === key(line[line.length - 1])) break
    }
    if (line.length > 3) lines.push(line)
  }
  return lines
}

const toPath = (lines) =>
  lines
    .map(simplify)
    .map((l) => `M${l.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}`)
    .join('')

const isoPaths = (layout) => {
  const grid = sampleField(layout)
  return {
    minor: toPath(D.lab.levels.flatMap((lv) => traceLevel(grid, lv))),
    /* The reference band's own two lines, kept separate so they
       can be drawn in the signal colour and drawn LAST. They are
       the only contour on the sheet a visitor has to read: after
       calibration every chair sits between them. */
    band: toPath([-D.lab.band, D.lab.band].flatMap((lv) => traceLevel(grid, lv))),
  }
}

/* ONE field, not two. The sheet used to draw the conventional set
   as well and crossfade to this one; the 2026-09-02 redesign
   prints a single calibrated room, so the second set was four
   thousand path commands and a full marching-squares pass at
   module load for a layer nothing would ever reveal. */
export const FIELD = isoPaths(BUILT)

/* ---------- The drawing's frame ----------
   The room in metres plus the margin the dimension marks and the
   screen need. Exported so the SVG and the HTML annotation layer
   over it share one coordinate system: a percentage in that layer
   IS a position in this box. */
export const ROOM = { w: D.room.w, d: D.room.d }
/* Widened for the 2026-09-02 sheet: the plan now carries four
   dimension runs rather than two, and the left-hand run (screen to
   the reference row) needs the same clear margin the right-hand
   one always had. */
export const VB = { x: -4.75, y: -1.5, w: 9.5, h: 11.6 }
/* The drawn sheet inside the viewBox — where the blueprint grid is
   ruled and where the corner registration marks sit. Inset from
   the viewBox so the dimension figures in the HTML layer above
   have air outside the frame rather than colliding with it. */
export const FRAME = { x0: -4.32, x1: 4.32, y0: -1.1, y1: 9.4 }
export const pctX = (x) => ((x - VB.x) / VB.w) * 100
export const pctY = (y) => ((y - VB.y) / VB.h) * 100

/* A chair in plan. Deep enough to read as something you sit in,
   shallow enough that the calibrated layout's two rows — 0.95 m
   apart, which is tight and real — never touch on the page. */
export const CHAIR = { w: 1.02, d: 0.7, r: 0.13, rest: 0.19, arm: 0.13 }
export const SPK = { w: 0.4, d: 0.28, r: 0.06 }
