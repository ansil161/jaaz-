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

   The one section on this site that argues rather than shows.

   WHAT THIS REPLACED, AND WHY.
   The previous build ran the argument as a three-and-a-half
   viewport pinned scrub: a wash crossed a photograph, seven
   monospace ticks counted up on hairline drop-lines, a legend
   sat under them in 11px caps and a row of seat numerals ran
   along the bottom of the frame. It was accurate and it read as
   an engineering drawing — precision expressed as LINEWORK. On a
   page selling rooms people sit in, the technical dashboard is
   the wrong register, and a reader who scrolls past the middle
   of it never sees the point being made.

   So the argument is now a CONTROL, not a film. There are two
   layouts, one switch, and the visitor works it. Seven chairs
   carry their own measured value on the photograph; throwing the
   switch moves all seven at once and the verdict under the
   picture rewrites itself. The whole case lands in one gesture,
   at any scroll position, on any device, in about a second.

   THE NUMBERS ARE UNCHANGED AND STILL COMPUTED. `data/site.js`
   holds two plans in metres. `measure()` runs one identical
   model over both:

     level    direct field, three front channels power-summed at
              inverse square, expressed against the mean of all
              seven chairs — the room's own average, which is
              what a calibration targets
     arrival  centre-channel path length at 343 m/s, in ms
     picture  horizontal viewing angle at the chair, against the
              30-40 degree window the trade already works to

   Nothing is typed by hand, the figures in the prose included.

   THE PHOTOGRAPH NEVER CHANGES, SO THE SWITCH IS LABELLED. The
   plate is always the JAAZ room. `plateNote` says as much under
   the picture in the same size type as everything near it.
   Comparing two layouts on one photograph is honest; doing it
   silently would not be.

   ONE FIT, NOT TWO COORDINATE SYSTEMS. The frame is locked to
   the plate's own 16:9 at every breakpoint, so a mark's `x`/`y`
   percentage IS its position in the box and the hand-rolled fit
   box the old build needed is gone with it. Change the frame's
   aspect and every chair moves off its chair — it is load
   bearing, not a style choice.

   VALUES ARE WRITTEN TO THE DOM, NOT HELD IN STATE. Crossing
   between layouts animates seven readings, three figures in a
   sentence and the verdict together; driving that through React
   state would re-render the subtree sixty times a second for
   nothing. `blend` is the single source of truth — 0 is the
   conventional layout, 1 is ours — and `apply()` is a pure
   function of it, so no value can be left stranded mid-cross by
   an interrupted tween.
   ============================================================ */

const RAD = 180 / Math.PI
const MINUS = '−'

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/* Direct-field level at a listening position: the three front
   channels power-summed, each falling off at inverse square. A
   first-order model, and the right one for this argument — what
   separates a good chair from a bad one at this scale is path
   length, not the fifth decimal of a transfer function. */
const levelAt = (speakers, seat) =>
  10 * Math.log10(speakers.reduce((sum, sp) => sum + 1 / dist(sp, seat) ** 2, 0))

/* One plan in, seven measured chairs out.

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

/* Which row a chair is in. Derived from the plan rather than
   written down twice: the two rows are the only two distinct
   depths in `asBuilt`. */
const DEPTHS = [...new Set(BUILT.map((s) => s.y))].sort((a, b) => a - b)
const ROW = BUILT.map((s) => DEPTHS.indexOf(s.y))

/* A signed decibel, tabular. Exactly zero prints as a plus-minus
   rather than a bare 0.0 — it is a tolerance, not a nothing. */
const fmtDb = (v) => {
  const r = Math.round(v * 10) / 10
  if (r === 0) return '±0.0'
  return `${r > 0 ? '+' : MINUS}${Math.abs(r).toFixed(1)}`
}

/* THE COLOUR IS THE ARGUMENT, WHICH IS WHY IT IS NOT A CHART.
   A chair's figure is tinted between fog and the site's warm cove
   by how close it sits to the room average — off the average
   reads cool and neutral, on it reads warm. Seven cool figures
   going warm together when the switch is thrown makes the case
   before a single figure has been read, and it costs no
   linework, no axis and no legend. Both ends clear 8:1 on ink,
   so the tint carries meaning without carrying legibility. */
const COOL = [0xb8, 0xb8, 0xbd]
const WARM = [0xc9, 0xad, 0x7c]
const warmth = (db) => gsap.utils.clamp(0, 1, 1 - Math.abs(db) / 2.2)
const toneAt = (db, a = 1) => {
  const w = warmth(db)
  const c = COOL.map((v, i) => Math.round(v + (WARM[i] - v) * w))
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`
}

/* Pool footprint, as a percentage of the photograph, before the
   per-chair `s` in the data scales it for depth. */
const POOL = { w: 12.6, h: 6.2 }

const inWindow = (deg) => deg >= D.viewWindow[0] && deg <= D.viewWindow[1]

/* Which chair a point in the frame belongs to.

   The chairs run diagonally across the middle third of a 16:9
   plate, so a strict nearest-mark test hands the floor and the
   ceiling to whichever chair happens to be closest in a straight
   line — and on a phone, where the whole picture is 210px tall,
   that is most of the taps. Squashing the vertical term instead
   turns the seven marks into seven full-height columns: a tap
   anywhere above or below a chair reads as that chair, which is
   what someone pointing at it means. */
const nearest = (px, py) => {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < SEATS; i += 1) {
    const m = BUILT[i].mark
    const dx = m.x - px
    const dy = (m.y - py) * 0.18
    const d = dx * dx + dy * dy
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

  const frameRef = useRef(null)
  const readRefs = useRef([])
  const valRefs = useRef([])
  const markRefs = useRef([])
  const figRefs = useRef({})
  const spreadRef = useRef(null)
  const spreadNoteRef = useRef(null)

  /* 0 = the conventional layout, 1 = ours. Everything printed in
     the section is a pure function of this and `active`. */
  const blend = useRef(0)

  const readAt = useCallback((i) => {
    const t = blend.current
    return {
      db: FOUND[i].db + (BUILT[i].db - FOUND[i].db) * t,
      ms: FOUND[i].ms + (BUILT[i].ms - FOUND[i].ms) * t,
      view: FOUND[i].view + (BUILT[i].view - FOUND[i].view) * t,
    }
  }, [])

  const apply = useCallback(() => {
    const t = blend.current

    for (let i = 0; i < SEATS; i += 1) {
      const { db } = readAt(i)
      const val = valRefs.current[i]
      const read = readRefs.current[i]
      if (val) val.textContent = fmtDb(db)
      /* The chair being read goes to the warm white the room's own
         practicals are lit in; the other six carry the tint that
         says how far off the average they sit. */
      if (read) read.style.color = i === active ? '#fff4e2' : toneAt(db)
    }

    const v = readAt(active)
    const f = figRefs.current
    if (f.ms) f.ms.textContent = v.ms.toFixed(1)
    if (f.db) f.db.textContent = fmtDb(v.db)
    if (f.view) f.view.textContent = v.view.toFixed(0)
    if (f.window) f.window.textContent = inWindow(v.view) ? D.viewIn : D.viewOut

    const spread = SPREAD.found + (SPREAD.built - SPREAD.found) * t
    if (spreadRef.current) {
      spreadRef.current.textContent = spread.toFixed(1)
      spreadRef.current.style.color = toneAt(spread * 0.55)
    }
    if (spreadNoteRef.current) {
      spreadNoteRef.current.textContent = t >= 0.5 ? SPREAD_NOTE.built : SPREAD_NOTE.found
    }
  }, [active, readAt])

  /* `apply` changes identity with the chair being read, so the
     crossing tween reads it through a ref: restarting a 0.9s
     interpolation every time the pointer moves to the next chair
     would stall the cross halfway and print values from a layout
     that is no longer selected. */
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
    apply()
  }, [apply])

  /* THE ONE AUTHORED MOMENT. Seven readings, three figures in a
     sentence and the verdict all cross together, eased in and
     out so the room reads as SETTLING rather than as a
     spreadsheet recalculating. */
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
      duration: 0.9,
      ease: 'power3.inOut',
      onUpdate: () => {
        blend.current = proxy.v
        applyRef.current()
      },
    })
    return () => tween.kill()
  }, [layout, reduced])

  /* ---------- Pointing at the room ----------
     The whole photograph is the target, not seven 20px dots. A
     mouse previews on move and commits on press; a finger only
     ever commits, because a touch "hover" is a tap that has not
     finished and previewing it makes the reading flicker under the
     thumb. */
  const seatFromEvent = useCallback((e) => {
    const box = frameRef.current
    if (!box) return 0
    const r = box.getBoundingClientRect()
    return nearest(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100)
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
     arrowing between chairs is what the picture looks like it
     does. */
  const onKey = useCallback((e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const i = Number(e.currentTarget.dataset.seat)
    const next = (i + step + SEATS) % SEATS
    setSeat(next)
    markRefs.current[next]?.focus()
  }, [])

  /* Each block is triggered by ITSELF. One `revealBlock` over every
     [data-rise] in the section would hand all four the first one as
     their trigger, and the closing statement would have played out
     three screens before anyone reached it. */
  const root = useGsapScope((scope) => {
    revealLines(scope.querySelector('[data-title]'))
    revealLines(scope.querySelector('[data-close]'), { start: 'top 80%' })
    revealBlock(scope.querySelector('[data-rise="lead"]'), { start: 'top 84%' })
    revealBlock(scope.querySelector('[data-frame]'), { start: 'top 88%', y: 44 })
    revealBlock(scope.querySelector('[data-rise="read"]'), { start: 'top 88%', y: 24 })
    revealBlock(scope.querySelector('[data-rise="close"]'), { start: 'top 85%' })

    /* The room does not fade in. It settles out of a slow push,
       so it reads as something that was already there before the
       page arrived at it — which, being the evidence, it was. */
    const plate = scope.querySelector('.plate')
    if (plate && !prefersReducedMotion()) {
      gsap.from(plate, {
        scale: 1.07,
        duration: 2,
        ease: 'jaz',
        scrollTrigger: { trigger: scope.querySelector('[data-frame]'), start: 'top 88%', once: true },
      })
    }
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
      className="relative bg-ink py-24 sm:py-32"
    >
      {/* One warm source behind the type, so the section has a light
          in it before the photograph loads and the claim is not set
          on flat black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[44rem]"
        style={{
          background:
            'radial-gradient(58% 52% at 20% 0%, rgba(201,173,124,0.11) 0%, rgba(201,173,124,0.035) 40%, rgba(0,0,0,0) 74%)',
        }}
      />

      <div className="shell-wide relative">
        <span className="t-label flex items-center gap-3 text-fog">
          {D.chapter}
          <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
          {D.label}
        </span>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <h2 data-title className="t-chapter">
            <span className="block text-fog">{D.title.join(' ')}</span>
            <span className="block text-pure">{D.titleTurn.join(' ')}</span>
          </h2>
          <p data-rise="lead" className="t-sub max-w-[44ch] text-fog lg:pb-3">
            {D.lead}
          </p>
        </div>
      </div>

      {/* ---------- The room ----------
          NOTHING IS DRAWN ON THE PHOTOGRAPH. An earlier build put
          the section's whole interface on it: seven bordered value
          chips, a segmented pill switch, a floating hint and a
          translucent panel across the foot of the frame. Every one
          of those is a competent piece of app furniture, and ten of
          them over a photograph of a room this expensive read as a
          product demo screenshotted onto somebody else's
          photography. On a page whose job is to be trusted with a
          room, that is not a small cost.

          What stays on the picture is what could have been lit in
          the room: a figure per chair in the display face, in the
          warm white of the room's own practicals, with no box, no
          rule and no border around it, and one pool of light on the
          chair being read. Everything the visitor OPERATES lives in
          type below the frame. */}
      <div className="shell-wide relative mt-12 sm:mt-16">
        <div
          data-frame
          ref={frameRef}
          onPointerMove={onMove}
          onPointerDown={onDown}
          onPointerLeave={onLeave}
          className="relative aspect-[16/9] w-full cursor-pointer overflow-hidden bg-ink-2"
        >
          <img
            src={D.plate}
            alt={D.plateAlt}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="plate absolute inset-0 h-full w-full object-cover [--plate-contrast:1.04] [--plate-saturate:0.97]"
          />

          {/* One veil, and only where the figures sit. The old build
              laid 78% black over the whole room to keep a column of
              type legible on it; with the type off the picture the
              room is allowed to be a room. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.16) 26%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.34) 100%)',
            }}
          />

          {/* The chair being read, marked by light landing on the
              leather rather than by a box drawn around it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute mix-blend-screen transition-[left,top,width,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{
              left: `${activeSeat.mark.x}%`,
              top: `${activeSeat.mark.y}%`,
              width: `${POOL.w * activeSeat.mark.s}%`,
              height: `${POOL.h * activeSeat.mark.s}%`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(ellipse at center, rgba(255,244,225,0.5) 0%, rgba(255,235,204,0.27) 32%, rgba(255,228,192,0.1) 58%, rgba(255,224,184,0) 84%)',
            }}
          />

          {/* One button per chair, and they are invisible. The real
              target is the whole frame; these carry the keyboard
              route and the accessible name and nothing else. A drawn
              dot on every chair is seven more marks on a photograph
              already carrying seven figures. */}
          {BUILT.map((s, i) => (
            <button
              key={s.n}
              type="button"
              data-seat={i}
              ref={(el) => {
                markRefs.current[i] = el
              }}
              onFocus={() => setSeat(i)}
              onKeyDown={onKey}
              aria-label={`${D.seatWord} ${s.n}, ${D.rows[ROW[i]]}`}
              className="absolute z-10 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-bone"
              style={{ left: `${s.mark.x}%`, top: `${s.mark.y}%` }}
            />
          ))}

          {/* The readings. Set, not drawn: the display face, tabular,
              a soft warm halo instead of a plate behind them. All
              seven above `lg`, where there is room between the marks
              for them; below it only the chair being read, and the
              other six are read one at a time. */}
          {BUILT.map((s, i) => (
            <span
              key={`read-${s.n}`}
              aria-hidden="true"
              ref={(el) => {
                readRefs.current[i] = el
              }}
              className={`pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display leading-none tabular-nums transition-opacity duration-300 ${
                i === active
                  ? 'text-[clamp(1.5rem,2.3vw,2.35rem)]'
                  : 'hidden text-[clamp(1rem,1.5vw,1.5rem)] opacity-80 lg:block'
              }`}
              style={{
                left: `${s.mark.x}%`,
                top: `calc(${s.mark.y}% - 2.5rem)`,
                textShadow:
                  '0 2px 20px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.7), 0 0 40px rgba(255,214,160,0.3)',
              }}
            >
              <span
                ref={(el) => {
                  valRefs.current[i] = el
                }}
              >
                {fmtDb(FOUND[i].db)}
              </span>
            </span>
          ))}
        </div>

        {/* The two lines the picture is not allowed to carry. */}
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2">
          <p className="max-w-[58ch] text-[0.8125rem] leading-relaxed text-mist">{D.plateNote}</p>
          <p className="text-[0.8125rem] text-mist">{D.pick}</p>
        </div>

        {/* ---------- The reading ----------
            No panel, no card, no glass. Type on black, with the
            space around it doing the work the border was doing. */}
        <div
          data-rise="read"
          className="mt-16 grid gap-x-16 gap-y-12 sm:mt-20 lg:grid-cols-2 lg:items-end"
        >
          <div>
            {/* THE SWITCH IS TWO WORDS. A segmented pill is the right
                control in a settings panel and the wrong one on a
                page set in Instrument Serif: it arrives with its own
                visual language and wins. Two names, the live one in
                white over a warm rule that slides between them, is
                the same control in this page's voice. */}
            <div className="relative flex flex-wrap items-baseline gap-x-9 gap-y-3">
              {D.layouts.map((l, i) => (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={i === layoutIdx}
                  onClick={() => setLayout(l.key)}
                  className={`relative cursor-pointer pb-2.5 text-[0.9375rem] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-bone sm:text-base ${
                    i === layoutIdx ? 'text-pure' : 'text-ash hover:text-fog'
                  }`}
                >
                  {l.name}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      i === layoutIdx ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-fog">
              {D.layouts[layoutIdx].note}
            </p>

            <p className="mt-12 text-[0.8125rem] text-mist sm:mt-14">{D.spreadLabel}</p>
            <p className="mt-2 font-display text-[clamp(4.5rem,10vw,8.5rem)] leading-[0.82] tabular-nums">
              <span ref={spreadRef}>{SPREAD.found.toFixed(1)}</span>
              <span className="ml-3 align-baseline text-[0.2em] text-mist">dB</span>
            </p>
            <p ref={spreadNoteRef} className="mt-5 max-w-[36ch] text-[1rem] leading-relaxed text-fog">
              {SPREAD_NOTE.found}
            </p>
          </div>

          <div className="lg:pb-2">
            <p className="text-[0.8125rem] text-mist">
              {D.seatWord} {activeSeat.n} · {D.rows[ROW[active]]}
            </p>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[2.15] text-fog sm:text-[1.125rem]">
              {sentence}
            </p>
          </div>
        </div>
      </div>

      {/* ---------- The close ---------- */}
      <div className="shell-wide mt-24 sm:mt-32">
        <p data-close className="t-chapter max-w-3xl text-pure">
          {D.resolve.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p data-rise="close" className="t-sub mt-7 max-w-[54ch] text-fog">
          {D.resolveSub}
        </p>
      </div>
    </section>
  )
}
