import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calibration as D } from '@/features/public/data/site'
import {
  useGsapScope,
  gsap,
  revealLines,
  revealBlock,
  prefersReducedMotion,
} from '@/lib/animation/useGsap'

/* ============================================================
   CHAPTER 03 — CALIBRATION

   The one section on this site that argues rather than shows,
   and the only one printed on paper.

   WHAT THIS REPLACED, AND WHY.
   The previous build laid the argument over a photograph of the
   room: seven figures set on the plate, a pool of light on the
   chair being read, the controls in type underneath. It was a
   real improvement on the pinned engineering drawing before it,
   and it still had two faults that no amount of tuning fixed.

     1. A private cinema photographed with the house lights down
        is the darkest ground on the site, and this is the one
        section whose job is to be READ. Every figure on it needed
        a veil under it to survive, and a veil over a room this
        expensive is a tax paid on the photography.
     2. THE PLAN WAS NEVER VISIBLE. The section's whole claim is
        that one seating layout measures better than another — and
        the visitor was shown neither layout. They were shown a
        photograph of a third room and asked to take the geometry
        on trust. The argument had no evidence in it.

   So the photograph is gone and the PLAN IS DRAWN. `data/site.js`
   holds two layouts as metres in one coordinate system whose
   origin is the centre of the screen wall, and the drawing's
   viewBox IS that system — a chair cannot appear anywhere except
   where it was measured, because there is no second set of
   coordinates to drift. Throwing the switch moves the room: seven
   chairs slide, the front three speakers pull in, every figure
   recounts, and the verdict rewrites itself.

   IT IS SET ON PAPER. One warm sheet inset into the black page. A
   measurement report is a document, and the tonal break is the
   point — the page stops being a film for the length of one
   section and hands the evidence over. See `.cal-paper` in
   site.css for why the sheet is a material rather than a card.

   THE NUMBERS ARE UNCHANGED AND STILL COMPUTED. `measure()` runs
   one identical model over both layouts:

     level    direct field, three front channels power-summed at
              inverse square, expressed against the mean of all
              seven chairs — the room's own average, which is what
              a calibration targets
     arrival  centre-channel path length at 343 m/s, in ms
     picture  horizontal viewing angle at the chair, against the
              30-40 degree window the trade already works to

   Nothing is typed by hand, the figures in the prose included.

   INK DENSITY IS THE ARGUMENT, WHICH IS WHY IT IS NOT A CHART.
   A chair's pad is printed at a weight set by how close it sits
   to the room average: off the average it is a faint impression,
   on it the ink is fully laid down. Seven pale chairs going solid
   together as they slide into place makes the case before a
   figure has been read, and it costs no axis, no legend and no
   linework. The FIGURES never fade with it — each one holds a
   readable weight in the list beside the plan, so nothing here is
   encoded in contrast alone.

   VALUES ARE WRITTEN TO THE DOM, NOT HELD IN STATE. Crossing
   between layouts animates seven positions, three speakers, seven
   readings, three figures in a sentence and the verdict together;
   driving that through React state would re-render the subtree
   sixty times a second for nothing. `blend` is the single source
   of truth — 0 is the conventional layout, 1 is ours — and
   `apply()` is a pure function of it, so no value can be left
   stranded mid-cross by an interrupted tween.

   THE PLAN IS NOT THE KEYBOARD ROUTE. Pointing at a drawing is
   the natural way to pick a chair and a poor way to reach one
   without a pointer, so the seven real buttons are the value list
   under it — where the figures already are, where focus is
   visible, and where the accessible name has somewhere to live.
   ============================================================ */

const RAD = 180 / Math.PI
const MINUS = '−'

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const lerp = (a, b, t) => a + (b - a) * t

/* Direct-field level at a listening position: the three front
   channels power-summed, each falling off at inverse square. A
   first-order model, and the right one for this argument — what
   separates a good chair from a bad one at this scale is path
   length, not the fifth decimal of a transfer function. */
const levelAt = (speakers, seat) =>
  10 * Math.log10(speakers.reduce((sum, sp) => sum + 1 / dist(sp, seat) ** 2, 0))

/* One layout in, seven measured chairs out.

   Level is quoted against the MEAN of the room rather than
   against a chosen reference seat. A calibration targets the
   room, and quoting every chair against one favoured chair is
   exactly the sleight of hand this section exists to refuse. */
const measure = ({ speakers, seats }) => {
  const level = seats.map((seat) => levelAt(speakers, seat))
  const mean = level.reduce((a, b) => a + b, 0) / level.length
  const centre = speakers.find((sp) => sp.id === 'C') ?? speakers[1]
  return seats.map((seat, i) => ({
    ...seat,
    n: String(i + 1).padStart(2, '0'),
    db: level[i] - mean,
    ms: (dist(centre, seat) / D.speedOfSound) * 1000,
    view: 2 * Math.atan(D.screenWidth / 2 / seat.y) * RAD,
  }))
}

const FOUND = measure(D.asFound)
const BUILT = measure(D.asBuilt)
const SEATS = BUILT.length

const spreadOf = (m) => Math.max(...m.map((s) => s.db)) - Math.min(...m.map((s) => s.db))
const worstOf = (m) => Math.max(...m.map((s) => Math.abs(s.db)))

const SPREAD = { found: spreadOf(FOUND), built: spreadOf(BUILT) }

const fill = (tpl, v) => tpl.replace(/\{(\w)\}/g, (_, k) => v[k])
const SPREAD_NOTE = {
  found: fill(D.spreadNote.found, { b: worstOf(FOUND).toFixed(1) }),
  built: fill(D.spreadNote.built, { b: worstOf(BUILT).toFixed(1) }),
}
const SCALE_NOTE = fill(D.planScale, {
  w: D.room.w.toFixed(2),
  d: D.room.d.toFixed(2),
  s: D.screenWidth.toFixed(2),
})

/* Which row a chair is in, and the chairs in each row.

   Derived from the JAAZ layout rather than written down twice:
   its two rows are the only two distinct depths in `asBuilt`. The
   conventional layout splits three and four the same way, so one
   grouping serves both — and if a future layout did not, this is
   the line that would have to say so, rather than a hand-typed
   list quietly disagreeing with the drawing. */
const DEPTHS = [...new Set(BUILT.map((s) => s.y))].sort((a, b) => a - b)
const ROW = BUILT.map((s) => DEPTHS.indexOf(s.y))
const ROWS = DEPTHS.map((_, r) => BUILT.map((_, i) => i).filter((i) => ROW[i] === r))

/* A signed decibel, tabular. Exactly zero prints as a plus-minus
   rather than a bare 0.0 — it is a tolerance, not a nothing. */
const fmtDb = (v) => {
  const r = Math.round(v * 10) / 10
  if (r === 0) return '±0.0'
  return `${r > 0 ? '+' : MINUS}${Math.abs(r).toFixed(1)}`
}

/* How fully a chair is inked. 1 is on the room average, 0 is
   2.4 dB or worse off it — a hair beyond the worst chair in
   either layout, so the faintest pad on the sheet is faint and
   never absent. */
const density = (db) => gsap.utils.clamp(0, 1, 1 - Math.abs(db) / 2.4)

/* The pad's ink, and the figure's. The pad has the full range to
   play with because it carries no text; the figure is floored at
   an alpha that clears 4.5:1 on this stock, because a measurement
   nobody can read is not a measurement. */
const padInk = (db) => `rgba(19, 19, 22, ${(0.15 + 0.7 * density(db)).toFixed(3)})`
const figureInk = (db) => `rgba(0, 0, 0, ${(0.58 + 0.34 * density(db)).toFixed(3)})`

const inWindow = (deg) => deg >= D.viewWindow[0] && deg <= D.viewWindow[1]

/* ---------- The drawing's coordinate system ----------
   The viewBox IS the room's own plan in metres, origin at the
   centre of the screen wall, +y running back into the room. The
   margins are the only invented numbers here: a little air in
   front of the screen wall for the screen itself, a little behind
   the back wall so the sheet does not clip the room. */
const VB = { x: -3.5, y: -0.34, w: 7, h: 9.02 }
const FLOOR = { x: -D.room.w / 2, y: 0, width: D.room.w, height: D.room.d }

/* A chair pad, in metres. Deep enough to read as something you
   sit in, shallow enough that the JAAZ layout's two rows — 0.95 m
   apart, which is tight and real — do not touch on the page. */
const PAD = { w: 1.04, h: 0.68, r: 0.15 }
const SPK = { w: 0.38, h: 0.26, r: 0.07 }

/* Which chair a point in the plan belongs to. A true plan is a
   map, so plain nearest-mark is the right test — unlike over the
   photograph, where the chairs ran diagonally through the middle
   third of the frame and the vertical term had to be squashed
   before a tap meant anything. */
const nearest = (pos, x, y) => {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < SEATS; i += 1) {
    const d = (pos[i].x - x) ** 2 + (pos[i].y - y) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/* The sentence, pre-split once. `{ms}`, `{db}` and `{view}` are
   set at display size inline; `{window}` is prose. Keeping the
   copy whole in `data/site.js` rather than as four fragments is
   the difference between a sentence someone can edit and a
   template only this file understands. */
const FIGURES = { '{ms}': 'ms', '{db}': 'db', '{view}': 'view' }
const SENTENCE = D.seatSentence.split(/(\{\w+\})/)

/* The chair the section opens on: middle of the front row, which
   is the seat anyone imagines themselves in. Its conventional-
   layout figures are printed as the markup's own children so the
   sentence is whole in the HTML and never flashes an empty line
   while the first effect runs. React leaves them alone after
   that: the JSX children never change, so reconciliation never
   overwrites what `apply` has written into the same nodes. */
const OPENS_ON = 1
const FIRST = {
  ms: FOUND[OPENS_ON].ms.toFixed(1),
  db: fmtDb(FOUND[OPENS_ON].db),
  view: FOUND[OPENS_ON].view.toFixed(0),
  window: inWindow(FOUND[OPENS_ON].view) ? D.viewIn : D.viewOut,
}

export default function Calibration() {
  const [reduced] = useState(() => prefersReducedMotion())
  const [layout, setLayout] = useState(D.layouts[0].key)
  const [seat, setSeat] = useState(OPENS_ON)
  const [hover, setHover] = useState(null)

  /* What is being read right now: a hover is a preview and never
     outlives the pointer, a click or a focus commits. */
  const active = hover ?? seat
  const activeSeat = BUILT[active]
  const layoutIdx = D.layouts.findIndex((l) => l.key === layout)

  const planRef = useRef(null)
  const seatRefs = useRef([])
  const padRefs = useRef([])
  const restRefs = useRef([])
  const spkRefs = useRef([])
  const valRefs = useRef([])
  const figRefs = useRef({})
  const spreadRef = useRef(null)
  const spreadNoteRef = useRef(null)

  /* 0 = the conventional layout, 1 = ours. Everything drawn and
     everything printed is a pure function of this and `active`. */
  const blend = useRef(0)

  /* Where the seven chairs are RIGHT NOW, in plan metres. Kept as
     a ref rather than recomputed on every pointer move so that
     hit-testing mid-cross hits the chair the visitor can see, not
     the one the layout is on its way to. */
  const live = useRef(D.asFound.seats.map((s) => ({ x: s.x, y: s.y })))

  const readAt = useCallback((i) => {
    const t = blend.current
    return {
      db: lerp(FOUND[i].db, BUILT[i].db, t),
      ms: lerp(FOUND[i].ms, BUILT[i].ms, t),
      view: lerp(FOUND[i].view, BUILT[i].view, t),
    }
  }, [])

  const apply = useCallback(() => {
    const t = blend.current

    for (let i = 0; i < SEATS; i += 1) {
      const x = lerp(FOUND[i].x, BUILT[i].x, t)
      const y = lerp(FOUND[i].y, BUILT[i].y, t)
      live.current[i].x = x
      live.current[i].y = y

      const g = seatRefs.current[i]
      if (g) g.style.transform = `translate(${x}px, ${y}px)`

      const { db } = readAt(i)
      const ink = padInk(db)
      if (padRefs.current[i]) padRefs.current[i].setAttribute('fill', ink)
      if (restRefs.current[i]) restRefs.current[i].setAttribute('fill', ink)

      const val = valRefs.current[i]
      if (val) {
        val.textContent = fmtDb(db)
        val.style.color = i === active ? 'var(--color-ink)' : figureInk(db)
      }
    }

    for (let i = 0; i < spkRefs.current.length; i += 1) {
      const g = spkRefs.current[i]
      if (!g) continue
      const a = D.asFound.speakers[i]
      const b = D.asBuilt.speakers[i]
      g.style.transform = `translate(${lerp(a.x, b.x, t)}px, ${lerp(a.y, b.y, t)}px)`
    }

    const v = readAt(active)
    const f = figRefs.current
    if (f.ms) f.ms.textContent = v.ms.toFixed(1)
    if (f.db) f.db.textContent = fmtDb(v.db)
    if (f.view) f.view.textContent = v.view.toFixed(0)
    if (f.window) f.window.textContent = inWindow(v.view) ? D.viewIn : D.viewOut

    const spread = lerp(SPREAD.found, SPREAD.built, t)
    if (spreadRef.current) spreadRef.current.textContent = spread.toFixed(1)
    if (spreadNoteRef.current) {
      spreadNoteRef.current.textContent = t >= 0.5 ? SPREAD_NOTE.built : SPREAD_NOTE.found
    }
  }, [active, readAt])

  /* `apply` changes identity with the chair being read, so the
     crossing tween reads it through a ref: restarting a one-second
     interpolation every time the pointer moves to the next chair
     would stall the cross halfway and leave the room drawn in a
     layout that is no longer selected. */
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
    apply()
  }, [apply])

  /* THE ONE AUTHORED MOMENT. Seven chairs, three speakers, seven
     readings, three figures in a sentence and the verdict all
     cross together, eased in and out so the room reads as SETTLING
     rather than as a spreadsheet recalculating. */
  useEffect(() => {
    const to = layout === 'built' ? 1 : 0
    if (reduced) {
      blend.current = to
      applyRef.current()
      return undefined
    }
    const proxy = { v: blend.current }
    const tween = gsap.to(proxy, {
      v: to,
      duration: 1.05,
      ease: 'power3.inOut',
      onUpdate: () => {
        blend.current = proxy.v
        applyRef.current()
      },
    })
    return () => tween.kill()
  }, [layout, reduced])

  /* ---------- Pointing at the room ----------
     The whole plan is the target, not seven small pads. A mouse
     previews on move and commits on press; a finger only ever
     commits, because a touch "hover" is a tap that has not
     finished and previewing it makes the reading flicker under
     the thumb. */
  const seatFromEvent = useCallback((e) => {
    const box = planRef.current
    if (!box) return 0
    const r = box.getBoundingClientRect()
    return nearest(
      live.current,
      VB.x + ((e.clientX - r.left) / r.width) * VB.w,
      VB.y + ((e.clientY - r.top) / r.height) * VB.h,
    )
  }, [])

  const onMove = useCallback(
    (e) => {
      if (e.pointerType !== 'mouse') return
      setHover(seatFromEvent(e))
    },
    [seatFromEvent],
  )

  const onDown = useCallback(
    (e) => {
      setSeat(seatFromEvent(e))
      setHover(null)
    },
    [seatFromEvent],
  )

  const onLeave = useCallback(() => setHover(null), [])

  /* Left and right walk the room. Seven tab stops is already more
     than a keyboard user should have to spend on one figure, and
     arrowing between chairs is what the list looks like it does. */
  const onKey = useCallback((e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const i = Number(e.currentTarget.dataset.seat)
    const next = (i + step + SEATS) % SEATS
    setSeat(next)
    valRefs.current[next]?.closest('button')?.focus()
  }, [])

  /* Each block is triggered by ITSELF. One `revealBlock` over every
     [data-rise] in the section would hand all of them the first one
     as their trigger, and the closing statement would have played
     out two screens before anyone reached it. */
  const root = useGsapScope((scope) => {
    revealBlock(scope.querySelector('[data-panel]'), { start: 'top 92%', y: 40 })
    revealLines(scope.querySelector('[data-title]'), { start: 'top 86%' })
    revealLines(scope.querySelector('[data-close]'), { start: 'top 84%' })
    revealBlock(scope.querySelector('[data-rise="lead"]'), { start: 'top 86%', y: 20 })
    revealBlock(scope.querySelector('[data-rise="close"]'), { start: 'top 84%', y: 20 })

    /* The room is DRAWN, once, from the screen wall backwards —
       the order a plan is actually read in. It is the only
       entrance in the section that is not the site's standard
       rise, because the thing arriving is not a block of type.
       GSAP writes the INNER group of each chair; `apply` writes
       the outer one, so the two never touch the same transform. */
    if (prefersReducedMotion()) return
    const inner = (g) => g?.firstChild
    const marks = [
      ...spkRefs.current.filter(Boolean).map(inner),
      ...seatRefs.current.filter(Boolean).map(inner),
    ].filter(Boolean)
    gsap.from(marks, {
      opacity: 0,
      scale: 0.7,
      transformOrigin: 'center',
      duration: 0.85,
      stagger: 0.055,
      ease: 'jaz',
      scrollTrigger: { trigger: scope.querySelector('[data-plan]'), start: 'top 84%', once: true },
    })
  }, [])

  const sentence = useMemo(
    () =>
      SENTENCE.map((part, i) => {
        if (part === '{window}') {
          return (
            <span
              key={`w${i}`}
              ref={(el) => {
                figRefs.current.window = el
              }}
            >
              {FIRST.window}
            </span>
          )
        }
        const key = FIGURES[part]
        if (key) {
          return (
            <span
              key={`f${i}`}
              className="cal-figure"
              ref={(el) => {
                figRefs.current[key] = el
              }}
            >
              {FIRST[key]}
            </span>
          )
        }
        return <span key={`t${i}`}>{part}</span>
      }),
    [],
  )

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.titleTurn.join(' ')}
      className="relative bg-ink py-20 sm:py-28 lg:py-32"
    >
      {/* The bounce. A sheet this size on a black page throws light
          back onto it, and the section reads as lit rather than as
          pasted on once it does. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[10%] bottom-[10%]"
        style={{
          background:
            'radial-gradient(54% 50% at 50% 50%, rgba(201,173,124,0.11) 0%, rgba(201,173,124,0.032) 46%, rgba(0,0,0,0) 76%)',
        }}
      />

      <div className="shell-wide relative">
        <div
          data-panel
          className="cal-paper on-paper px-[clamp(1.35rem,3.6vw,4.5rem)] py-[clamp(2.25rem,4vw,4.25rem)] text-ink"
        >
          {/* ---------- The masthead ----------
              A report says what it is and what it measured before
              it says anything else. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--rule)] pb-5">
            <span className="t-label flex items-center gap-3 text-ink/60">
              {D.chapter}
              <span className="block h-px w-8 bg-ink/25" aria-hidden="true" />
              {D.label}
            </span>
            <span className="text-[0.8125rem] tabular-nums text-ink/60">{SCALE_NOTE}</span>
          </div>

          <div className="mt-9 grid gap-7 sm:mt-12 lg:grid-cols-[1.22fr_1fr] lg:items-end lg:gap-20">
            <h2 data-title className="t-chapter text-balance">
              <span className="block text-ink/50">{D.title.join(' ')}</span>
              <span className="block text-ink">{D.titleTurn.join(' ')}</span>
            </h2>
            <p data-rise="lead" className="t-sub max-w-[44ch] text-ink/70 lg:pb-2">
              {D.lead}
            </p>
          </div>

          {/* ---------- The evidence ----------
              Left: the control, and the room it moves. Right: the
              chair being read, then all seven, then the verdict.
              That is the order the argument is made in. */}
          <div className="mt-12 grid gap-x-16 gap-y-14 sm:mt-16 lg:mt-20 lg:grid-cols-[minmax(16rem,0.6fr)_minmax(0,1fr)] xl:gap-x-24">
            <div>
              {/* THE SWITCH IS TWO WORDS. A segmented pill is the
                  right control in a settings panel and the wrong
                  one on a page set in Instrument Serif: it arrives
                  with its own visual language and wins. Two names,
                  the live one in full ink over a warm rule that
                  slides between them, is the same control in this
                  page's voice. */}
              <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
                {D.layouts.map((l, i) => (
                  <button
                    key={l.key}
                    type="button"
                    aria-pressed={i === layoutIdx}
                    onClick={() => setLayout(l.key)}
                    className={`relative cursor-pointer pb-2.5 text-[0.9375rem] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink sm:text-base ${
                      i === layoutIdx ? 'text-ink' : 'text-ink/55 hover:text-ink/85'
                    }`}
                  >
                    {l.name}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                        i === layoutIdx ? 'scale-x-100' : 'scale-x-0'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-5 max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink/70">
                {D.layouts[layoutIdx].note}
              </p>

              {/* ---------- The plan ----------
                  Nothing here is a hairline. The room is an
                  impression pressed into the sheet, the screen is a
                  solid bar with the light it throws falling back
                  down the room, and a chair is a shape with a
                  weight — never an outline with a number on a
                  leader line. */}
              <p className="mt-11 text-[0.8125rem] text-ink/60">{D.planScreen}</p>
              <div
                data-plan
                ref={planRef}
                onPointerMove={onMove}
                onPointerDown={onDown}
                onPointerLeave={onLeave}
                className="relative mt-3 w-full max-w-[23rem] cursor-pointer touch-manipulation select-none lg:max-w-none"
                style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
              >
                <svg
                  viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                  focusable="false"
                >
                  <defs>
                    <linearGradient id="cal-floor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(24,24,28)" stopOpacity="0.075" />
                      <stop offset="100%" stopColor="rgb(24,24,28)" stopOpacity="0.022" />
                    </linearGradient>
                    <radialGradient id="cal-throw" cx="0.5" cy="0" r="0.86">
                      <stop offset="0%" stopColor="#c9ad7c" stopOpacity="0.36" />
                      <stop offset="52%" stopColor="#c9ad7c" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#c9ad7c" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="cal-pool" cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor="#c9ad7c" stopOpacity="0.55" />
                      <stop offset="55%" stopColor="#c9ad7c" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#c9ad7c" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* The room, as an impression in the stock, and
                      the light off the screen falling into it. */}
                  <rect {...FLOOR} fill="url(#cal-floor)" />
                  <rect {...FLOOR} fill="url(#cal-throw)" />

                  <rect
                    x={-D.screenWidth / 2}
                    y={-0.19}
                    width={D.screenWidth}
                    height={0.17}
                    rx={0.05}
                    fill="#141418"
                  />

                  {/* The three front channels. They move too — the
                      JAAZ layout pulls them in, and a drawing that
                      claimed only the chairs had changed would be
                      showing less than was measured. */}
                  {D.asFound.speakers.map((sp, i) => (
                    <g
                      key={sp.id}
                      ref={(el) => {
                        spkRefs.current[i] = el
                      }}
                      style={{ transform: `translate(${sp.x}px, ${sp.y}px)` }}
                    >
                      <g>
                        <rect
                          x={-SPK.w / 2}
                          y={-SPK.h / 2}
                          width={SPK.w}
                          height={SPK.h}
                          rx={SPK.r}
                          fill="rgba(19,19,22,0.82)"
                        />
                      </g>
                    </g>
                  ))}

                  {/* The chairs. The outer group is POSITION and is
                      written every frame by `apply`; the inner one
                      is the entrance, so GSAP and the blend tween
                      never write the same transform. */}
                  {BUILT.map((s, i) => (
                    <g
                      key={s.n}
                      ref={(el) => {
                        seatRefs.current[i] = el
                      }}
                      style={{ transform: `translate(${FOUND[i].x}px, ${FOUND[i].y}px)` }}
                    >
                      <g>
                        <ellipse
                          className="cal-seat-pool"
                          cx={0}
                          cy={0.06}
                          rx={1.18}
                          ry={0.94}
                          fill="url(#cal-pool)"
                          opacity={i === active ? 1 : 0}
                        />
                        <rect
                          ref={(el) => {
                            padRefs.current[i] = el
                          }}
                          x={-PAD.w / 2}
                          y={-PAD.h / 2}
                          width={PAD.w}
                          height={PAD.h}
                          rx={PAD.r}
                          fill={padInk(FOUND[i].db)}
                        />
                        <rect
                          ref={(el) => {
                            restRefs.current[i] = el
                          }}
                          x={-PAD.w / 2}
                          y={PAD.h / 2 - 0.03}
                          width={PAD.w}
                          height={0.2}
                          rx={0.09}
                          fill={padInk(FOUND[i].db)}
                        />
                        {/* The chair being read is the one the
                            room's own light is on. Opacity is the
                            only thing selection changes, which is
                            what lets it be a transition rather than
                            another value the tween has to write. */}
                        <rect
                          className="cal-seat-warm"
                          x={-PAD.w / 2}
                          y={-PAD.h / 2}
                          width={PAD.w}
                          height={PAD.h + 0.17}
                          rx={PAD.r}
                          fill="#c9ad7c"
                          opacity={i === active ? 1 : 0}
                        />
                      </g>
                    </g>
                  ))}
                </svg>
              </div>

              <p className="mt-6 max-w-[36ch] text-[0.8125rem] leading-relaxed text-ink/65">
                {D.planNote}
              </p>
            </div>

            {/* ---------- The reading ---------- */}
            <div>
              <p className="text-[0.8125rem] text-ink/60">
                {D.seatWord} {activeSeat.n} · {D.rows[ROW[active]]}
              </p>
              <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[2.15] text-ink/80 sm:text-[1.125rem]">
                {sentence}
              </p>

              {/* ---------- Every chair ----------
                  The seven real buttons. They sit where the seven
                  figures already are, laid out in the two rows the
                  plan is in, so the list and the drawing are one
                  object read two ways. */}
              <p className="mt-12 text-[0.8125rem] text-ink/60">{D.valuesLabel}</p>
              <div className="mt-3 border-t border-[var(--rule)]">
                {ROWS.map((row, r) => (
                  <div
                    key={D.rows[r]}
                    className="flex flex-wrap items-baseline gap-x-1 gap-y-1 border-b border-[var(--rule)] py-3"
                  >
                    <span className="w-[4.5rem] shrink-0 text-[0.8125rem] text-ink/60 sm:w-[5.25rem]">
                      {D.rows[r]}
                    </span>
                    {row.map((i) => (
                      <button
                        key={BUILT[i].n}
                        type="button"
                        data-seat={i}
                        aria-pressed={i === seat}
                        aria-label={`${D.seatWord} ${BUILT[i].n}, ${D.rows[r]}`}
                        onClick={() => setSeat(i)}
                        onFocus={() => setSeat(i)}
                        onKeyDown={onKey}
                        onPointerEnter={(e) => {
                          if (e.pointerType === 'mouse') setHover(i)
                        }}
                        onPointerLeave={onLeave}
                        className="relative cursor-pointer px-1.5 py-1 text-[0.9375rem] tabular-nums focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3 sm:text-base"
                      >
                        <span
                          ref={(el) => {
                            valRefs.current[i] = el
                          }}
                          style={{
                            color: i === active ? 'var(--color-ink)' : figureInk(FOUND[i].db),
                          }}
                        >
                          {fmtDb(FOUND[i].db)}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`absolute inset-x-1 bottom-0 h-[2px] origin-center bg-cove transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                            i === active ? 'scale-x-100' : 'scale-x-0'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[0.8125rem] text-ink/65">{D.pick}</p>

              {/* The verdict on the whole room, which is the only
                  figure that settles the argument. */}
              <p className="mt-12 text-[0.8125rem] text-ink/60 sm:mt-14">{D.spreadLabel}</p>
              <p className="mt-2 font-display text-[clamp(4rem,8vw,7.5rem)] leading-[0.82] tabular-nums text-ink">
                <span ref={spreadRef}>{SPREAD.found.toFixed(1)}</span>
                <span className="ml-3 align-baseline text-[0.22em] text-ink/60">dB</span>
              </p>
              <p
                ref={spreadNoteRef}
                className="mt-5 max-w-[36ch] text-[1rem] leading-relaxed text-ink/75"
              >
                {SPREAD_NOTE.found}
              </p>
            </div>
          </div>

          {/* ---------- The close ----------
              Inside the panel, not after it. The sheet is the
              document, and a document ends with its own conclusion;
              putting the resolve back on black would make the panel
              an illustration of a point made somewhere else. */}
          <div className="mt-16 grid gap-7 border-t border-[var(--rule)] pt-12 sm:mt-20 lg:grid-cols-[1.22fr_1fr] lg:items-end lg:gap-20 lg:pt-16">
            <p data-close className="t-chapter text-ink">
              {D.resolve.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p data-rise="close" className="t-sub max-w-[46ch] text-ink/70 lg:pb-2">
              {D.resolveSub}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
