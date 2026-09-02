import { useCallback, useRef, useState } from 'react'
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
   Three builds are buried under this one. The first ran the
   argument as a pinned scrub over a photograph and read as an
   engineering drawing. The second kept the photograph and set the
   figures on it — better, but the plan being argued about was
   never actually visible, so the visitor had to take the geometry
   on trust. The third drew the plan and put it on paper, and
   still hid half the case behind a switch: one layout at a time,
   with the other held in the reader's head.

   THIS BUILD HIDES NOTHING. Both rooms are drawn side by side,
   both verdicts are on the page at once, and there is no control
   to work out — the comparison is simply there. The only thing
   left to operate is WHICH CHAIR, and a chair is read in both
   rooms at the same time. That is the whole interface: point at a
   chair, or pick it from the list, and every figure about it
   appears twice.

   The measurements are unchanged and still computed. `measure()`
   runs one identical model over both layouts:

     level    direct field, three front channels power-summed at
              inverse square, expressed against the mean of all
              seven chairs — the room's own average, which is what
              a calibration targets
     arrival  centre-channel path length at 343 m/s, in ms
     picture  horizontal viewing angle at the chair, against the
              30-40 degree window the trade already works to

   Nothing is typed by hand, the figures in the prose included —
   and because BOTH layouts print the same sentence with different
   numbers in it, the two readings can be compared word for word.
   That parallel is the argument; it is why the reading is two
   sentences and not a stats table.

   INK DENSITY IS THE ARGUMENT, WHICH IS WHY IT IS NOT A CHART.
   A chair's pad is printed at a weight set by how close it sits
   to the room average: off the average it is a faint impression,
   on it the ink is fully laid down. With both plans on the page
   the left one reads patchy and the right one solid before a
   single figure has been read, and it costs no axis, no legend
   and no linework. The FIGURES never fade with it — every value
   holds a readable weight in the comparison list, so nothing here
   is encoded in contrast alone.

   THE ONE AUTHORED MOMENT IS THE CORRECTION ITSELF. On first
   scroll-in the JAAZ drawing is holding the conventional
   arrangement, and it resolves: seven chairs slide, the front
   three speakers pull in, the ink comes up and the verdict counts
   down. It plays once, needs no interaction, and it is the reason
   the two drawings read as one room decided twice rather than as
   two unrelated pictures. The markup renders the TRUE positions,
   and the tween drives them back to the conventional ones before
   running forward — so with no JavaScript, or under reduced
   motion, the right-hand plan is simply correct.
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

const fill = (tpl, v) => tpl.replace(/\{(\w)\}/g, (_, k) => v[k])

/* The two rooms, assembled once from the copy and the geometry so
   that everything on the page — both columns, both sets of
   figures, both verdicts and both sentences — is rendered by
   mapping over ONE array. A third layout would need no new
   markup, which is the test of whether a comparison is built as a
   comparison or as two hard-coded halves. */
const LAYOUTS = D.layouts.map((l, i) => {
  const src = i === 0 ? D.asFound : D.asBuilt
  const seats = i === 0 ? FOUND : BUILT
  return {
    ...l,
    speakers: src.speakers,
    seats,
    spread: spreadOf(seats),
    verdict: fill(D.spreadNote[l.key], { b: worstOf(seats).toFixed(1) }),
  }
})

const SCALE_NOTE = fill(D.planScale, {
  w: D.room.w.toFixed(2),
  d: D.room.d.toFixed(2),
  s: D.screenWidth.toFixed(2),
})

/* Which row a chair is in. Derived from the JAAZ layout rather
   than written down twice: its two rows are the only two distinct
   depths in `asBuilt`, and the conventional layout splits three
   and four the same way, so one grouping serves both. */
const DEPTHS = [...new Set(BUILT.map((s) => s.y))].sort((a, b) => a - b)
const ROW = BUILT.map((s) => DEPTHS.indexOf(s.y))

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

/* ---------- The drawings' coordinate system ----------
   The viewBox IS the room's own plan in metres, origin at the
   centre of the screen wall, +y running back into the room. Both
   drawings use it unchanged, which is what makes them comparable:
   a chair two metres further back is two metres further back on
   the page, in both. The margins are the only invented numbers —
   a little air in front of the screen wall for the screen itself,
   a little behind the back wall so the sheet does not clip it. */
const VB = { x: -3.5, y: -0.34, w: 7, h: 9.02 }
const FLOOR = { x: -D.room.w / 2, y: 0, width: D.room.w, height: D.room.d }

/* A chair pad, in metres. Deep enough to read as something you
   sit in, shallow enough that the JAAZ layout's two rows — 0.95 m
   apart, which is tight and real — do not touch on the page. */
const PAD = { w: 1.04, h: 0.68, r: 0.15 }
const SPK = { w: 0.38, h: 0.26, r: 0.07 }

/* Which chair a point in a plan belongs to. A true plan is a map,
   so plain nearest-mark is the right test here. */
const nearest = (seats, x, y) => {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < SEATS; i += 1) {
    const d = (seats[i].x - x) ** 2 + (seats[i].y - y) ** 2
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
   template only this file understands — and it is the same
   sentence in both columns, which is the point.

   Rendered straight from React rather than written into the DOM
   by hand: with the switch gone there is no sixty-frames-a-second
   interpolation to keep out of the reconciler, and a re-render on
   a click is exactly what React is for. */
const FIGURES = { '{ms}': 'ms', '{db}': 'db', '{view}': 'view' }
const SENTENCE = D.seatSentence.split(/(\{\w+\})/)

function Reading({ seat }) {
  const v = { ms: seat.ms.toFixed(1), db: fmtDb(seat.db), view: seat.view.toFixed(0) }
  return SENTENCE.map((part, i) => {
    if (part === '{window}') {
      return <span key={`w${i}`}>{inWindow(seat.view) ? D.viewIn : D.viewOut}</span>
    }
    const key = FIGURES[part]
    if (key) {
      return (
        <span key={`f${i}`} className="cal-figure">
          {v[key]}
        </span>
      )
    }
    return <span key={`t${i}`}>{part}</span>
  })
}

/* ---------- One room, drawn ----------
   Nothing here is a hairline. The room is an impression pressed
   into the sheet, the screen is a solid bar with the light it
   throws falling back down it, and a chair is a shape with a
   weight — never an outline with a number on a leader line.

   `uid` namespaces the gradients. SVG `<defs>` ids are global to
   the document, so two plans sharing one id would silently make
   the second drawing paint with the first one's fills. */
function RoomPlan({
  uid,
  seats,
  speakers,
  active,
  boxRef,
  onPointerMove,
  onPointerDown,
  onPointerLeave,
  setSeatRef,
  setPadRef,
  setRestRef,
  setSpkRef,
}) {
  return (
    <div
      data-plan
      ref={boxRef}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      className="relative w-full cursor-pointer touch-manipulation select-none"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
    >
      <svg
        viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${uid}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(24,24,28)" stopOpacity="0.075" />
            <stop offset="100%" stopColor="rgb(24,24,28)" stopOpacity="0.022" />
          </linearGradient>
          <radialGradient id={`${uid}-throw`} cx="0.5" cy="0" r="0.86">
            <stop offset="0%" stopColor="#c9ad7c" stopOpacity="0.36" />
            <stop offset="52%" stopColor="#c9ad7c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#c9ad7c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-pool`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#c9ad7c" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#c9ad7c" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#c9ad7c" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect {...FLOOR} fill={`url(#${uid}-floor)`} />
        <rect {...FLOOR} fill={`url(#${uid}-throw)`} />

        <rect
          x={-D.screenWidth / 2}
          y={-0.19}
          width={D.screenWidth}
          height={0.17}
          rx={0.05}
          fill="#141418"
        />

        {/* The three front channels. They move between the layouts
            too — a drawing that claimed only the chairs had changed
            would be showing less than was measured. */}
        {speakers.map((sp, i) => (
          <g
            key={sp.id}
            ref={setSpkRef ? (el) => setSpkRef(i, el) : undefined}
            style={{ transform: `translate(${sp.x}px, ${sp.y}px)` }}
          >
            <rect
              x={-SPK.w / 2}
              y={-SPK.h / 2}
              width={SPK.w}
              height={SPK.h}
              rx={SPK.r}
              fill="rgba(19,19,22,0.82)"
            />
          </g>
        ))}

        {seats.map((s, i) => (
          <g
            key={s.n}
            ref={setSeatRef ? (el) => setSeatRef(i, el) : undefined}
            style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
          >
            <ellipse
              className="cal-seat-pool"
              cx={0}
              cy={0.06}
              rx={1.18}
              ry={0.94}
              fill={`url(#${uid}-pool)`}
              opacity={i === active ? 1 : 0}
            />
            <rect
              ref={setPadRef ? (el) => setPadRef(i, el) : undefined}
              x={-PAD.w / 2}
              y={-PAD.h / 2}
              width={PAD.w}
              height={PAD.h}
              rx={PAD.r}
              fill={padInk(s.db)}
            />
            <rect
              ref={setRestRef ? (el) => setRestRef(i, el) : undefined}
              x={-PAD.w / 2}
              y={PAD.h / 2 - 0.03}
              width={PAD.w}
              height={0.2}
              rx={0.09}
              fill={padInk(s.db)}
            />
            {/* The chair being read is the one the room's own light
                is on. Opacity is the only thing selection changes,
                which is what lets it be a transition rather than
                another value a tween has to write. */}
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
        ))}
      </svg>
    </div>
  )
}

export default function Calibration() {
  const [seat, setSeat] = useState(1)
  const [hover, setHover] = useState(null)

  /* What is being read right now: a hover is a preview and never
     outlives the pointer, a click or a focus commits. */
  const active = hover ?? seat

  const planBoxes = useRef([])

  /* Only the JAAZ drawing is written to. The conventional one is
     already showing the arrangement everything resolves FROM, so
     it never moves. */
  const jaazSeats = useRef([])
  const jaazPads = useRef([])
  const jaazRests = useRef([])
  const jaazSpk = useRef([])
  const jaazSpread = useRef(null)

  /* ---------- Pointing at a room ----------
     The whole drawing is the target, not seven small pads. A mouse
     previews on move and commits on press; a finger only ever
     commits, because a touch "hover" is a tap that has not
     finished and previewing it makes the reading flicker under the
     thumb. */
  const seatFromEvent = useCallback((e, which) => {
    const box = planBoxes.current[which]
    if (!box) return 0
    const r = box.getBoundingClientRect()
    return nearest(
      LAYOUTS[which].seats,
      VB.x + ((e.clientX - r.left) / r.width) * VB.w,
      VB.y + ((e.clientY - r.top) / r.height) * VB.h,
    )
  }, [])

  const onLeave = useCallback(() => setHover(null), [])

  /* Up and down walk the room, because the list they walk is
     vertical. ONE tab stop, not seven: the chair being read is the
     only tabbable row and the arrows move between them, which is
     the pattern a radio group already uses and the one a keyboard
     visitor expects from a list of alternatives. */
  const onKey = useCallback((e) => {
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = (Number(e.currentTarget.dataset.seat) + step + SEATS) % SEATS
    setSeat(next)
    e.currentTarget.parentElement?.querySelector(`[data-seat="${next}"]`)?.focus()
  }, [])

  const root = useGsapScope((scope) => {
    revealLines(scope.querySelector('[data-title]'), { start: 'top 84%' })
    revealLines(scope.querySelector('[data-close]'), { start: 'top 84%' })
    revealBlock(scope.querySelector('[data-rise="lead"]'), { start: 'top 84%', y: 20 })
    revealBlock(scope.querySelectorAll('[data-rise="room"]'), {
      start: 'top 88%',
      y: 34,
      stagger: 0.12,
      trigger: scope.querySelector('[data-rooms]'),
    })
    revealBlock(scope.querySelector('[data-rise="list"]'), { start: 'top 88%', y: 24 })
    revealBlock(scope.querySelector('[data-rise="read"]'), { start: 'top 88%', y: 24 })
    revealBlock(scope.querySelector('[data-rise="close"]'), { start: 'top 84%', y: 20 })

    /* THE CORRECTION. The JAAZ room resolves out of the
       conventional arrangement, once, on arrival: chairs travel,
       speakers pull in, ink comes up, verdict counts down. The
       markup already holds the finished state, so this drives it
       back to `t = 0` and then runs forward — which is why there
       is nothing to undo when JavaScript never arrives. */
    if (prefersReducedMotion()) return
    const write = (t) => {
      for (let i = 0; i < SEATS; i += 1) {
        const g = jaazSeats.current[i]
        if (g) {
          const x = lerp(FOUND[i].x, BUILT[i].x, t)
          const y = lerp(FOUND[i].y, BUILT[i].y, t)
          g.style.transform = `translate(${x}px, ${y}px)`
        }
        const ink = padInk(lerp(FOUND[i].db, BUILT[i].db, t))
        jaazPads.current[i]?.setAttribute('fill', ink)
        jaazRests.current[i]?.setAttribute('fill', ink)
      }
      for (let i = 0; i < jaazSpk.current.length; i += 1) {
        const g = jaazSpk.current[i]
        if (!g) continue
        const a = D.asFound.speakers[i]
        const b = D.asBuilt.speakers[i]
        g.style.transform = `translate(${lerp(a.x, b.x, t)}px, ${lerp(a.y, b.y, t)}px)`
      }
      if (jaazSpread.current) {
        jaazSpread.current.textContent = lerp(LAYOUTS[0].spread, LAYOUTS[1].spread, t).toFixed(1)
      }
    }
    write(0)
    const proxy = { t: 0 }
    gsap.to(proxy, {
      t: 1,
      duration: 1.4,
      delay: 0.3,
      ease: 'power3.inOut',
      onUpdate: () => write(proxy.t),
      scrollTrigger: { trigger: scope.querySelector('[data-rooms]'), start: 'top 74%', once: true },
    })
  }, [])

  /* The rule between the two columns, and the gutter it sits in.

     The gutter is PADDING ON BOTH COLUMNS rather than a grid gap,
     and that is not a style preference. With `gap-x` plus padding
     on the second column only, the two tracks are equal but the
     two CONTENT boxes are not — the right-hand drawing came out
     17px narrower than the left one at 390px, which in a
     comparison of two scaled plans is not a cosmetic difference,
     it is a false one. Equal padding either side of the rule
     keeps both rooms drawn at exactly the same scale.

     The rule runs at every width for the drawings, and only from
     `lg` for the two sentences — see the note on the pair. */
  const roomRule = (li) =>
    li === 0
      ? 'pr-4 sm:pr-7 lg:pr-12 xl:pr-20'
      : 'border-l border-[var(--rule)] pl-4 sm:pl-7 lg:pl-12 xl:pl-20'
  const readRule = (li) =>
    li === 0
      ? 'lg:pr-12 xl:pr-20'
      : 'lg:border-l lg:border-[var(--rule)] lg:pl-12 xl:pl-20'

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.titleTurn.join(' ')}
      className="sheet on-paper py-24 text-ink sm:py-32 lg:py-40"
    >
      <div className="shell-wide">
        {/* ---------- The masthead ----------
            A report says what it is and what it measured before it
            says anything else. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--rule)] pb-5">
          <span className="t-label flex items-center gap-3 text-ink/60">
            {D.chapter}
            <span className="block h-px w-8 bg-ink/25" aria-hidden="true" />
            {D.label}
          </span>
          <span className="text-[0.8125rem] tabular-nums text-ink/60">{SCALE_NOTE}</span>
        </div>

        <div className="mt-10 grid gap-7 sm:mt-14 lg:grid-cols-[1.22fr_1fr] lg:items-end lg:gap-20">
          <h2 data-title className="t-chapter text-balance">
            <span className="block text-ink/50">{D.title.join(' ')}</span>
            <span className="block text-ink">{D.titleTurn.join(' ')}</span>
          </h2>
          <p data-rise="lead" className="t-sub max-w-[46ch] text-ink/70 lg:pb-2">
            {D.lead}
          </p>
        </div>

        {/* ---------- The two rooms ----------
            No switch, no tabs, no before-and-after handle. Both
            drawings are simply on the page, at the same scale, with
            their verdicts under them — so the comparison costs the
            visitor nothing at all.

            THE PAIR NEVER STACKS. `grid-cols-2` carries no
            breakpoint, because a phone that puts one room above the
            other has not made the layout responsive, it has deleted
            the design: a comparison you have to scroll between is a
            comparison you have to remember. Everything inside the
            column steps down instead — the name, the note, the
            verdict — so that at 390px the two drawings are 160px
            wide and still say the only thing they have to say, that
            one room is scattered and pale and the other is tight
            and solid. The two SENTENCES do stack, because a
            sentence at 160px is not a sentence.

            The columns are equal in weight because the reader is
            being asked to judge, not to be steered: the JAAZ room
            wins on the figures printed under it, or it does not
            win. */}
        <div
          data-rooms
          className="mt-14 grid grid-cols-2 sm:mt-20"
        >
          {LAYOUTS.map((l, li) => (
            <div key={l.key} data-rise="room" className={roomRule(li)}>
              <h3 className="font-display text-[1.0625rem] leading-[1.1] text-ink sm:text-[1.45rem] lg:text-[clamp(1.5rem,2.2vw,2.1rem)] lg:leading-none">
                {l.name}
              </h3>
              {/* Two lines' worth of room whether the sentence
                  needs them or not. Without it the shorter note
                  pulls its drawing 24px higher than the one beside
                  it, and two plans that do not share a baseline
                  stop being a comparison. */}
              <p className="mt-2.5 max-w-[34ch] text-[0.8125rem] leading-relaxed text-ink/70 sm:text-[0.9375rem] lg:min-h-[3.05rem]">
                {l.note}
              </p>

              <div className="mt-5 w-full max-w-[24rem] sm:mt-8 lg:mt-10">
                <RoomPlan
                  uid={`cal-${l.key}`}
                  seats={l.seats}
                  speakers={l.speakers}
                  active={active}
                  boxRef={(el) => {
                    planBoxes.current[li] = el
                  }}
                  onPointerMove={(e) => {
                    if (e.pointerType === 'mouse') setHover(seatFromEvent(e, li))
                  }}
                  onPointerDown={(e) => {
                    setSeat(seatFromEvent(e, li))
                    setHover(null)
                  }}
                  onPointerLeave={onLeave}
                  setSeatRef={
                    li === 1
                      ? (i, el) => {
                          jaazSeats.current[i] = el
                        }
                      : undefined
                  }
                  setPadRef={
                    li === 1
                      ? (i, el) => {
                          jaazPads.current[i] = el
                        }
                      : undefined
                  }
                  setRestRef={
                    li === 1
                      ? (i, el) => {
                          jaazRests.current[i] = el
                        }
                      : undefined
                  }
                  setSpkRef={
                    li === 1
                      ? (i, el) => {
                          jaazSpk.current[i] = el
                        }
                      : undefined
                  }
                />
              </div>

              {/* The verdict on this room. It is the only figure
                  that settles the argument, so it is the biggest
                  thing in the column, and the two of them sit on
                  the same baseline across the pair. */}
              <p className="mt-6 text-[0.75rem] text-ink/60 sm:mt-9 sm:text-[0.8125rem]">
                {D.spreadLabel}
              </p>
              <p className="mt-1.5 font-display text-[clamp(2.75rem,11vw,6rem)] leading-[0.84] tabular-nums text-ink sm:mt-2">
                <span ref={li === 1 ? jaazSpread : undefined}>{l.spread.toFixed(1)}</span>
                <span className="ml-2 align-baseline text-[0.22em] text-ink/60 sm:ml-3">dB</span>
              </p>
              <p className="mt-3 max-w-[34ch] text-[0.8125rem] leading-relaxed text-ink/75 sm:mt-4 sm:text-[1rem]">
                {l.verdict}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-[64ch] text-[0.8125rem] leading-relaxed text-ink/65 sm:mt-12">
          {D.planNote}
        </p>

        {/* ---------- Every chair, twice ----------
            The comparison list. It is the evidence and the control
            at the same time: seven rows, each one a chair, each one
            carrying what that chair gets in BOTH rooms, and picking
            one lights it in both drawings above.

            Rows rather than two separate lists because the question
            a visitor actually has is "what happens to MY chair",
            and on one line that question has one answer. */}
        <div data-rise="list" className="mt-16 max-w-[64rem] sm:mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
            <p className="text-[0.8125rem] text-ink/60">{D.valuesLabel}</p>
            <p className="text-[0.8125rem] text-ink/60">{D.pick}</p>
          </div>

          <div className="mt-5 border-t border-[var(--rule)]">
            <div
              aria-hidden="true"
              className="grid grid-cols-[1fr_5rem_5rem] gap-x-3 border-b border-[var(--rule)] py-2.5 text-[0.75rem] text-ink/60 sm:grid-cols-[1fr_8rem_8rem] sm:gap-x-4"
            >
              <span />
              {LAYOUTS.map((l) => (
                <span key={l.key} className="pr-2 text-right">
                  {l.short}
                </span>
              ))}
            </div>
            {BUILT.map((s, i) => (
              <button
                key={s.n}
                type="button"
                data-seat={i}
                tabIndex={i === seat ? 0 : -1}
                aria-pressed={i === seat}
                aria-label={`${D.seatWord} ${s.n}, ${D.rows[ROW[i]]}. ${LAYOUTS[0].short} ${fmtDb(FOUND[i].db)} dB, ${LAYOUTS[1].short} ${fmtDb(BUILT[i].db)} dB.`}
                onClick={() => setSeat(i)}
                onFocus={() => setSeat(i)}
                onKeyDown={onKey}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setHover(i)
                }}
                onPointerLeave={onLeave}
                className={`grid w-full cursor-pointer grid-cols-[1fr_5rem_5rem] items-baseline gap-x-3 border-b border-[var(--rule)] py-3 text-left transition-colors duration-200 focus-visible:outline focus-visible:-outline-offset-1 focus-visible:outline-ink sm:grid-cols-[1fr_8rem_8rem] sm:gap-x-4 ${
                  i === active ? 'bg-ink/[0.045]' : 'hover:bg-ink/[0.022]'
                }`}
              >
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pl-2 text-[0.9375rem]">
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 shrink-0 self-center rounded-full transition-colors duration-200 ${
                      i === active ? 'bg-cove' : 'bg-transparent'
                    }`}
                  />
                  <span className={i === active ? 'text-ink' : 'text-ink/75'}>
                    {D.seatWord} {s.n}
                  </span>
                  <span className="text-[0.8125rem] text-ink/60">{D.rows[ROW[i]]}</span>
                </span>
                <span
                  className="pr-2 text-right text-[0.9375rem] tabular-nums sm:text-base"
                  style={{ color: figureInk(FOUND[i].db) }}
                >
                  {fmtDb(FOUND[i].db)}
                </span>
                <span
                  className="pr-2 text-right text-[0.9375rem] tabular-nums sm:text-base"
                  style={{ color: figureInk(BUILT[i].db) }}
                >
                  {fmtDb(BUILT[i].db)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- The same chair, in both rooms ----------
            One sentence per room, and it is the SAME sentence. Only
            the numbers inside it differ, so the two can be read
            against each other word for word — which is a thing a
            table of figures cannot do, and the reason this is not
            one. */}
        <div data-rise="read" className="mt-16 sm:mt-20">
          <p className="text-[0.8125rem] text-ink/60">
            {D.seatReadLabel} — {D.seatWord} {BUILT[active].n} · {D.rows[ROW[active]]}
          </p>
          <div className="mt-6 grid gap-y-10 lg:grid-cols-2">
            {LAYOUTS.map((l, li) => (
              <div key={l.key} className={readRule(li)}>
                <p className="text-[0.8125rem] text-ink/60">{l.name}</p>
                <p
                  className={`mt-4 max-w-[46ch] text-[1.0625rem] leading-[2.15] sm:text-[1.125rem] ${
                    li === 1 ? 'text-ink/85' : 'text-ink/70'
                  }`}
                >
                  <Reading seat={l.seats[active]} />
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- The close ---------- */}
        <div className="mt-20 grid gap-7 border-t border-[var(--rule)] pt-14 sm:mt-28 lg:grid-cols-[1.22fr_1fr] lg:items-end lg:gap-20 lg:pt-20">
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
    </section>
  )
}
