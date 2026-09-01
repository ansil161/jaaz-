import { useCallback, useEffect, useRef, useState } from 'react'
import { calibration as D } from '@/features/public/data/site'
import { useGsapScope, gsap, SplitText, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   CHAPTER 03 — CALIBRATION

   Invisible precision. The one section on this site that argues
   rather than shows, and the only place the visitor is handed
   proof instead of atmosphere.

   THE ONE IDEA
   "You may never see the difference. But you will always feel
   it." The section spends its whole length earning the second
   sentence — on a photograph of a real room, in the dark, with
   the house lights down. A wash travels the frame; as it reaches
   each chair a pool of warm light lands ON THAT CHAIR and the
   level measured there prints just above it. The pools come up
   visibly uneven. Then the layout is solved against the
   measurement, and they even out together.

   IT IS A PHOTOGRAPH, NOT A DIAGRAM, AND THAT IS THE DIRECTION.
   An earlier build drew this as a hairline plan — grid, room
   outline, chair glyphs, a measurement sheet in a column of its
   own — and it read as an engineering dashboard dropped into a
   luxury site: three floating columns of technical furniture with
   black between them. The argument is about chairs people sit in,
   so the argument is made ON the chairs: light landing on real
   leather, a number set beside the seat it belongs to, and no
   grid, no axes and no room outline anywhere in the frame.

   THE NUMBERS ARE STILL REAL. `data/site.js` holds two plans in
   metres. `measure()` runs one identical model over both:

     level    direct field, three front channels power-summed at
              inverse square, expressed against the mean of all
              seven chairs — the room's own average, which is
              what a calibration targets
     arrival  centre-channel path length at 343 m/s, in ms
     picture  horizontal viewing angle at the chair, against the
              30-40 degree window the trade already works to

   Nothing is typed by hand, the two figures in prose included.

   THE PHOTOGRAPH NEVER CHANGES, SO THE NUMBERS ARE LABELLED. The
   plate is always the JAAZ room. The first set of values is what
   the CONVENTIONAL layout of the same brief measures, and the
   standing label under the frame says so in two words before a
   single number lands. Comparing two layouts on one picture is
   honest; doing it silently would not be.

   TWO COORDINATE SYSTEMS, JOINED BY `fitBox`. The acoustics live
   in metres; the light lives in percentages of the photograph.
   Those only agree if we know exactly where the photograph ended
   up inside its box — and neither `cover` nor `contain` says. So
   the fit is reproduced by hand. Get it wrong and every pool of
   light sits beside its chair rather than on it.

   THE SEQUENCE, as scrubbed positions on one timeline:

     .00  TITLE      the card, then its turn. The room is behind
                     it at a third of its exposure — present, not
                     yet looked at.
     .11  SILENCE    "A room can look perfect." The house lights
                     come up far enough to prove it.
     .16  QUESTION   full exposure, and the question over it.
     .25  MEASURE    a wash crosses the frame once. Chair by
                     chair a pool of light lands and its level
                     prints above it — brighter where the room is
                     hot, dimmer where it is not.
     .49  AS FOUND   seven chairs lit, and no two the same.
     .55  THE LAYOUT the room is laid out against what was
                     measured. Every value crosses, and the light
                     evens out with it.
     .73  BALANCE    the statement, then a quiet tail: the probe
                     arms, and the visitor can read any chair in
                     the room for themselves.

   THE NUMBERS ARE A PURE FUNCTION OF THE PLAYHEAD, in `readAt`.
   A tween per seat mutating a proxy re-records its start value on
   every `invalidateOnRefresh`, so chairs intermittently came up
   already showing their final value, or froze at zero, depending
   on when the fonts finished loading. Deriving from the playhead
   makes all of that unreachable.
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

const fill = (tpl, v) => tpl.replace(/\{(\w)\}/g, (_, k) => v[k])
const FOUND_FIGURE = fill(D.foundFigure, { a: spreadOf(FOUND).toFixed(1) })
const BUILT_FIGURE = fill(D.builtFigure, {
  a: spreadOf(BUILT).toFixed(1),
  b: worstOf(BUILT).toFixed(1),
})

/* A signed decibel, tabular. Exactly zero prints as a plus-minus
   rather than a bare 0.0 — it is a tolerance, not a nothing. */
const fmtDb = (v) => {
  if (v === null) return '—'
  const r = Math.round(v * 10) / 10
  if (r === 0) return '±0.0'
  return `${r > 0 ? '+' : MINUS}${Math.abs(r).toFixed(1)}`
}

/* How bright the pool on a chair is, derived from what that chair
   measures. ONE function, both layouts, no rescaling in between —
   a light that renormalised as the numbers improved would be
   flattering them. A hot chair catches more light, a quiet one
   less, and once the two stop differing by much, neither does the
   light. */
const poolAlpha = (db) => gsap.utils.clamp(0.16, 0.9, 0.5 + db * 0.16)

/* ---------- Where each beat sits on the timeline ---------- */
const T = {
  title: 0.006,
  turn: 0.05,
  cardOut: 0.1,
  silence: 0.108,
  silenceOut: 0.152,
  room: 0.163,
  question: 0.196,
  measureIn: 0.252,
  pass: 0.25,
  passSpan: 0.225,
  found: 0.49,
  layout: 0.555,
  converge: 0.595,
  convergeSpan: 0.115,
  balance: 0.728,
  statement: 0.79,
  armed: 0.84,
}
const SEAT_WIN = T.passSpan / SEATS

/* What chair `i` reads at playhead `p`, or null before the pass
   has reached it. Three regimes: counting up to what the
   conventional layout measures, holding there, then crossing to
   what the built room measures. */
const readAt = (p, i) => {
  const t0 = T.pass + i * SEAT_WIN
  if (p < t0) return null
  const ramp = SEAT_WIN * 0.55
  if (p < t0 + ramp) return FOUND[i].db * ((p - t0) / ramp)
  if (p <= T.converge) return FOUND[i].db
  if (p < T.converge + T.convergeSpan) {
    const k = (p - T.converge) / T.convergeSpan
    /* Eased, not linear. Seven numbers sliding at a constant rate
       read as a spreadsheet recalculating; eased, they read as
       something settling. */
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
    return FOUND[i].db + (BUILT[i].db - FOUND[i].db) * e
  }
  return BUILT[i].db
}

const stageAt = (p) => (p < T.room ? 0 : p < T.pass ? 1 : p < T.layout ? 2 : p < T.balance ? 3 : 4)

/* The photograph's aspect, and the geometry the browser applies
   without telling anyone.

   COVER ON A LANDSCAPE BOX, CONTAIN ON ANYTHING TALLER. On a
   desktop the box and the plate are within a few per cent of the
   same aspect, so `cover` crops almost nothing and the room fills
   the screen — which is what this section is for. On a phone the
   same crop throws the two chairs at the right of the frame clean
   off the side of the screen, and a section that measures seven
   chairs cannot show five. Below the threshold the plate is
   contained instead: the whole room, smaller, with the section's
   own black around it. */
const AR = 16 / 9
const COVER_ABOVE = 1.2
const fitBox = (w, h) => {
  const letterbox = { left: 0, top: (h - w / AR) / 2, width: w, height: w / AR }
  const pillarbox = { left: (w - h * AR) / 2, top: 0, width: h * AR, height: h }
  if (w / h < COVER_ABOVE) return letterbox
  return w / h > AR ? letterbox : pillarbox
}

/* Pool footprint, as a percentage of the photograph, before the
   per-chair `s` in the data scales it for depth. */
const POOL = { w: 13.4, h: 6.6 }

const inWindow = (deg) => deg >= D.viewWindow[0] && deg <= D.viewWindow[1]

export default function Calibration() {
  const [reduced] = useState(() => prefersReducedMotion())
  const [stage, setStage] = useState(reduced ? 4 : 0)
  const [done, setDone] = useState(reduced ? SEATS : 0)
  const [armed, setArmed] = useState(reduced)
  const [probe, setProbe] = useState(null)

  const lastStage = useRef(reduced ? 4 : 0)
  const lastDone = useRef(reduced ? SEATS : 0)
  const armedRef = useRef(reduced)

  const boxRef = useRef(null)
  const plateRef = useRef(null)

  /* Keep every layer that reads the photograph's percentages glued
     to the photograph's own fit box. Its own observer rather than a
     ScrollTrigger refresh: the box depends only on the container's
     size, and it has to be right on the very first frame, before
     any trigger has measured anything. */
  useEffect(() => {
    const box = boxRef.current
    const plate = plateRef.current
    if (!box || !plate) return
    const layers = box.querySelectorAll('[data-fit]')
    const apply = () => {
      const { width, height } = box.getBoundingClientRect()
      if (!width || !height) return
      const b = fitBox(width, height)
      layers.forEach((layer) => {
        layer.style.left = `${b.left}px`
        layer.style.top = `${b.top}px`
        layer.style.width = `${b.width}px`
        layer.style.height = `${b.height}px`
      })
      plate.style.objectFit = width / height >= COVER_ABOVE ? 'cover' : 'contain'
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  /* ---------- The probe ----------
     Live once the room has been measured. Not decoration: the
     section has spent its whole length saying every chair was
     measured, and this is where the visitor checks one. */
  const hideProbe = useCallback(() => setProbe(null), [])

  const showProbe = useCallback((i) => {
    /* The card opens to the left of the chair on the right-hand
       side of the frame rather than being clipped by the stage. */
    setProbe({ i, flip: BUILT[i].mark.x > 60 })
  }, [])

  const onPointer = useCallback(
    (e) => {
      if (!armedRef.current) return
      const layer = boxRef.current?.querySelector('[data-fit]')
      if (!layer) return
      const box = layer.getBoundingClientRect()
      if (!box.width) return
      const x = ((e.clientX - box.left) / box.width) * 100
      const y = ((e.clientY - box.top) / box.height) * 100
      let best = -1
      let bestD = Infinity
      BUILT.forEach((seat, i) => {
        /* Distance in the photograph's own units, with the vertical
           axis weighted: the chairs are spread across the frame and
           stacked close together up it, so an unweighted circle
           picks the row behind. */
        const d = Math.hypot(seat.mark.x - x, (seat.mark.y - y) * 2.2)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      if (bestD > 7) return hideProbe()
      showProbe(best)
    },
    [hideProbe, showProbe],
  )

  const root = useGsapScope(
    (el) => {
      const q = (s) => el.querySelector(s)
      const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

      const card = q('[data-card]')
      const title = q('[data-title]')
      const turn = q('[data-turn]')
      const silence = q('[data-silence]')
      const question = q('[data-question]')
      const layoutHead = q('[data-layout-head]')
      const resolveHead = q('[data-resolve]')
      const measureLine = q('[data-measure]')
      const foundLine = q('[data-found]')
      const layoutSub = q('[data-layout-sub]')
      const resolveSub = q('[data-resolve-sub]')
      const foundFig = q('[data-found-fig]')
      const builtFig = q('[data-built-fig]')
      const labelFound = q('[data-label-found]')
      const labelBuilt = q('[data-label-built]')
      const unit = q('[data-unit]')
      const hint = q('[data-hint]')

      const plate = q('[data-plate]')
      const wash = q('[data-wash]')
      const pools = qa('[data-pool]')
      const levels = qa('[data-level]')
      const tags = qa('[data-tag]')

      /* One painter for every value on the picture, driven by the
         timeline's own playhead below. Each cell keeps the last
         string and the last alpha it was handed, so a frame in
         which nothing changed costs seven comparisons rather than
         fourteen DOM writes. */
      const cells = tags.map((tag, i) => {
        const valEl = tag.querySelector('[data-val]')
        const levelEl = levels[i]
        let lastText = null
        let lastAlpha = null
        return (p) => {
          const v = readAt(p, i)
          const text = fmtDb(v)
          if (text !== lastText) {
            valEl.textContent = text
            lastText = text
          }
          const a = v === null ? 0 : Math.round(poolAlpha(v) * 1000) / 1000
          if (a !== lastAlpha) {
            levelEl.style.opacity = String(a)
            lastAlpha = a
          }
        }
      })
      const paintAll = (p) => cells.forEach((c) => c(p))

      /* ---------- Reduced motion: the room lit, and measured ---------- */
      if (reduced) {
        gsap.set(plate, { '--plate-brightness': 1 })
        gsap.set([...pools, ...tags], { autoAlpha: 1, scale: 1, y: 0 })
        gsap.set(wash, { autoAlpha: 0 })
        gsap.set([question, layoutHead, measureLine, foundLine, layoutSub, foundFig, labelFound], {
          autoAlpha: 0,
        })
        gsap.set([title, turn, resolveHead, resolveSub, builtFig, labelBuilt, unit, hint], {
          autoAlpha: 1,
          y: 0,
        })
        paintAll(1)
        return
      }

      const split = (target) =>
        SplitText.create(target, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: false,
        })
      const sTitle = split(title)
      const sTurn = split(turn)
      const sQuestion = split(question)
      const sLayout = split(layoutHead)
      const sResolve = split(resolveHead)
      const splits = [sTitle, sTurn, sQuestion, sLayout, sResolve]

      /* NO RESPONSIVE MEDIA CONTEXT HERE, deliberately. The only
         thing that differs between a phone and a desktop is how
         much scroll the pin is given, and the `end` function below
         already recomputes that on every resize through
         `invalidateOnRefresh`. Wrapping the build in a
         gsap.matchMedia context bought nothing and cost real
         fragility: it tears the whole timeline down and rebuilds
         it every time the viewport crosses the breakpoint, and a
         teardown that lands while the tab is in the background can
         leave the section unpinned with nothing left to rebuild
         it. */

      /* Opening frame, set here rather than in markup so a refresh
         mid-section rebuilds from a known state instead of from
         wherever the last playhead left things. */
      gsap.set(plate, { '--plate-brightness': 0.28, scale: 1.06 })
      gsap.set(pools, { autoAlpha: 0, scale: 0.4, transformOrigin: 'center' })
      gsap.set(tags, { autoAlpha: 0, y: 7 })
      gsap.set(wash, { autoAlpha: 0, xPercent: -55 })
      gsap.set(card, { autoAlpha: 1 })
      splits.forEach((s) => gsap.set(s.lines, { yPercent: 110 }))
      gsap.set([title, turn, question, layoutHead, resolveHead], { autoAlpha: 1 })
      gsap.set(
        [
          silence,
          measureLine,
          foundLine,
          layoutSub,
          resolveSub,
          foundFig,
          builtFig,
          labelFound,
          labelBuilt,
          unit,
          hint,
        ],
        { autoAlpha: 0, y: 12 },
      )
      paintAll(0)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        /* Off the TIMELINE, not off the ScrollTrigger: `scrub`
           means the playhead lags the scroll position, and a
           number that ran ahead of the light arriving at its chair
           would be reporting a measurement nobody has taken yet.

           `this.time()`, not `this.progress()` — the positions
           `readAt` compares against are timeline POSITIONS, and
           the two only agree because the last tween on this
           timeline is made to land on exactly 1.00 (see the tail,
           at the bottom of the build). A plain method rather than
           an arrow, so `this` is the timeline GSAP hands back. */
        onUpdate() {
          paintAll(this.time())
        },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          /* Absolute pixels from a function `end`. A `+=N%` string
             returned from a function resolves against the
             trigger's own height — which pinSpacing then grows by,
             so every refresh compounds the pin. */
          end: () =>
            `+=${Math.round(window.innerHeight * (window.innerWidth >= 1024 ? 5.2 : 4.1))}`,
          pin: '[data-stage]',
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress
            const s = stageAt(p)
            if (s !== lastStage.current) {
              lastStage.current = s
              setStage(s)
            }
            /* The counter reads off the same window arithmetic the
               timeline uses, so it can never disagree with the
               room beside it. */
            const n = gsap.utils.clamp(0, SEATS, Math.floor((p - T.pass) / SEAT_WIN) + 1)
            if (n !== lastDone.current) {
              lastDone.current = n
              setDone(n)
            }
            const on = p >= T.armed
            if (on !== armedRef.current) {
              armedRef.current = on
              setArmed(on)
              if (!on) hideProbe()
            }
          },
        },
      })

      /* --- TITLE ---------------------------------------------- */
      tl.to(sTitle.lines, { yPercent: 0, duration: 0.03, stagger: 0.014 }, T.title)
      tl.to(sTitle.lines, { yPercent: -110, duration: 0.022, stagger: 0.01 }, T.turn)
      tl.to(sTurn.lines, { yPercent: 0, duration: 0.03, stagger: 0.014 }, T.turn + 0.012)

      /* The push-in runs the entire pin. A held frame that is also
         perfectly still is the one thing that makes a pin read as a
         page that has stopped responding. */
      tl.to(plate, { scale: 1, duration: 1 }, 0)

      /* --- SILENCE -------------------------------------------- */
      tl.to(sTurn.lines, { yPercent: -110, duration: 0.02, stagger: 0.008 }, T.cardOut)
      tl.to(silence, { autoAlpha: 1, y: 0, duration: 0.022 }, T.silence)
      /* The house lights come up UNDER the line that says a room
         can look perfect, so the sentence is answered by the
         picture rather than illustrated by it. */
      tl.to(plate, { '--plate-brightness': 0.72, duration: 0.05 }, T.silence)
      tl.to(silence, { autoAlpha: 0, y: -10, duration: 0.02 }, T.silenceOut)
      tl.to(card, { autoAlpha: 0, duration: 0.024 }, T.silenceOut + 0.004)

      /* --- QUESTION ------------------------------------------- */
      tl.to(plate, { '--plate-brightness': 1, duration: 0.05 }, T.room)
      /* THE QUESTION STANDS FOR THE WHOLE MEASUREMENT. It used to
         leave before the wash did, which left the copy column
         headless for a third of the pin — a hole where the
         section's loudest type had been. It is also better
         drama: the question is asked, the room is measured
         under it, and the layout headline is what answers it. */
      tl.to(sQuestion.lines, { yPercent: 0, duration: 0.028, stagger: 0.014 }, T.question)
      tl.to(sQuestion.lines, { yPercent: -110, duration: 0.02, stagger: 0.01 }, T.layout - 0.026)

      /* --- THE PASS ------------------------------------------- */
      tl.to(measureLine, { autoAlpha: 1, y: 0, duration: 0.025 }, T.measureIn)
      tl.to([labelFound, unit], { autoAlpha: 1, y: 0, duration: 0.025 }, T.pass - 0.02)

      /* ONE wash for all seven chairs, crossing the frame once.
         Seven separate flashes read as an effect firing repeatedly;
         a single traverse reads as somebody walking a microphone
         through the room, which is what is being described. */
      tl.to(wash, { autoAlpha: 1, duration: 0.04 }, T.pass - 0.03)
      tl.to(wash, { xPercent: 135, duration: T.passSpan + 0.07 }, T.pass - 0.03)
      tl.to(wash, { autoAlpha: 0, duration: 0.05 }, T.pass + T.passSpan - 0.02)

      FOUND.forEach((_, i) => {
        const t0 = T.pass + i * SEAT_WIN
        tl.to(pools[i], { autoAlpha: 1, scale: 1, duration: 0.05, ease: 'power2.out' }, t0)
        tl.to(tags[i], { autoAlpha: 1, y: 0, duration: 0.035, ease: 'power2.out' }, t0 + 0.008)
      })

      /* --- AS FOUND ------------------------------------------- */
      tl.to(measureLine, { autoAlpha: 0, y: -10, duration: 0.018 }, T.found - 0.012)
      tl.to(foundLine, { autoAlpha: 1, y: 0, duration: 0.025 }, T.found)
      tl.to(foundFig, { autoAlpha: 1, y: 0, duration: 0.025 }, T.found + 0.016)

      /* --- THE LAYOUT ----------------------------------------- */
      tl.to([foundLine, foundFig], { autoAlpha: 0, y: -10, duration: 0.018 }, T.layout - 0.008)
      tl.to(sLayout.lines, { yPercent: 0, duration: 0.026, stagger: 0.013 }, T.layout)
      tl.to(layoutSub, { autoAlpha: 1, y: 0, duration: 0.024 }, T.layout + 0.018)

      /* The label turns over with the numbers. Both sets belong to
         the same photograph, and these two words are the only
         thing that says which layout is being read. */
      tl.to(labelFound, { autoAlpha: 0, y: -8, duration: 0.02 }, T.converge + 0.012)
      tl.to(labelBuilt, { autoAlpha: 1, y: 0, duration: 0.026 }, T.converge + 0.034)

      /* A breath on the pools as they settle. The values are
         already crossing — this is the light agreeing with them. */
      tl.to(pools, { scale: 1.1, duration: 0.03, stagger: 0.004 }, T.converge + T.convergeSpan - 0.05)
      tl.to(pools, { scale: 1, duration: 0.045, stagger: 0.004 }, T.converge + T.convergeSpan - 0.016)

      /* --- BALANCE -------------------------------------------- */
      tl.to(sLayout.lines, { yPercent: -110, duration: 0.02, stagger: 0.01 }, T.balance - 0.024)
      tl.to(layoutSub, { autoAlpha: 0, y: -10, duration: 0.018 }, T.balance - 0.024)
      tl.to(sResolve.lines, { yPercent: 0, duration: 0.03, stagger: 0.015 }, T.balance)
      tl.to(builtFig, { autoAlpha: 1, y: 0, duration: 0.025 }, T.balance + 0.026)
      tl.to(resolveSub, { autoAlpha: 1, y: 0, duration: 0.03 }, T.statement)

      /* THE LAST TWEEN LANDS ON EXACTLY 1.00, and that is a
         requirement rather than a taste call. `readAt` compares
         against timeline POSITIONS, while the header, the seat
         counter and the probe all read the trigger's PROGRESS —
         and the two only mean the same thing if the timeline ends
         at 1. Left short, every reading sits ahead of the room it
         is describing: two lines of copy on screen at once, and a
         wash still crossing a room that has already resolved. */
      tl.to(hint, { autoAlpha: 1, y: 0, duration: 1 - T.armed }, T.armed)

      return () => {
        tl.kill()
        splits.forEach((s) => s.revert())
      }
    },
    [reduced, hideProbe],
  )

  const seatFor = probe === null ? null : BUILT[probe.i]

  /* ---------- The copy ----------
     Two stacked boxes, each sized by its tallest occupant, so the
     argument changes its mind IN PLACE rather than shuffling the
     layout under the reader. Whichever line is tallest sits in
     flow and sizes the box; the rest are laid over it. */
  const copy = (
    <div className="max-w-[32rem]">
      <div className="relative min-h-[4.4rem] sm:min-h-[6.2rem]">
        <h2 data-question className="t-chapter absolute inset-x-0 bottom-0 text-pure">
          {D.question.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <p data-layout-head className="t-chapter absolute inset-x-0 bottom-0 text-pure">
          {D.change.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p data-resolve className="t-chapter text-pure">
          {D.resolve.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>

      <div className="relative mt-4 min-h-[5.6rem] sm:mt-5 sm:min-h-[4.8rem]">
        <p data-measure className="t-sub absolute inset-x-0 top-0 text-fog">
          {D.measure}
        </p>
        <p data-found className="t-sub absolute inset-x-0 top-0 text-fog">
          {D.found}
        </p>
        <p data-layout-sub className="t-sub absolute inset-x-0 top-0 text-fog">
          {D.changeSub}
        </p>
        <p data-resolve-sub className="t-sub text-bone">
          {D.resolveSub}
        </p>
      </div>
    </div>
  )

  /* The standing label: which layout the values on the picture
     belong to, the unit they are in, and the one figure that
     summarises them. Two words, and they are what stops a
     comparison between two layouts on one photograph from being a
     sleight of hand. */
  const legend = (
    <div className="mt-6 w-full max-w-[32rem] border-t border-white/15 pt-3 sm:mt-7">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {/* Both labels share one fixed slot, wide enough for the
            longer of the two and set to never wrap: the shorter one
            replacing the longer must not move the unit beside it, and
            a label that breaks to a second line prints straight
            through the figure underneath. */}
        <span className="relative block h-4 w-[13.5rem] shrink-0">
          <span
            data-label-found
            className="t-label absolute inset-x-0 top-0 whitespace-nowrap text-cove"
          >
            {D.layoutFound}
          </span>
          <span
            data-label-built
            className="t-label absolute inset-x-0 top-0 whitespace-nowrap text-cove"
          >
            {D.layoutBuilt}
          </span>
        </span>
        <span data-unit className="t-num block text-[0.5625rem] text-mist">
          {D.unit}
        </span>
      </div>
      <div className="relative mt-2.5 min-h-[2.2rem]">
        <p
          data-found-fig
          className="t-num absolute inset-x-0 top-0 text-[0.6875rem] leading-relaxed text-mist"
        >
          {FOUND_FIGURE}
        </p>
        <p data-built-fig className="t-num text-[0.6875rem] leading-relaxed text-bone">
          {BUILT_FIGURE}
        </p>
      </div>
    </div>
  )

  /* The room: the plate, the light lying on it, and the two scrims
     that keep type legible over a photograph without turning the
     photograph into a poster. */
  const room = (
    <div ref={boxRef} className="relative min-h-0 w-full flex-1 self-stretch overflow-hidden">
      <img
        ref={plateRef}
        data-plate
        src={D.plate}
        alt={D.plateAlt}
        loading="lazy"
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-contrast:1.05] [--plate-saturate:0.94] will-change-transform"
      />

      {/* The light, pinned to the photograph's own fit box by the
          observer above rather than to the container — a pool of
          light two chairs away from its chair is worse than no pool
          at all. Decorative: every figure in it is also set in
          prose in the legend. */}
      <div data-fit className="pointer-events-none absolute" aria-hidden="true">
        {BUILT.map((seat, i) => (
          <Chair key={seat.n} seat={seat} active={probe?.i === i} />
        ))}

        {/* The pass. One soft column of light crossing the room
            once, over the whole sequence. */}
        <div
          data-wash
          className="absolute inset-y-0 left-0 w-[42%] mix-blend-screen will-change-transform"
          style={{
            background:
              'linear-gradient(to right, rgba(255,232,198,0) 0%, rgba(255,234,202,0.08) 38%, rgba(255,240,214,0.14) 52%, rgba(255,234,202,0.05) 66%, rgba(255,232,198,0) 100%)',
          }}
        />
      </div>

      {/* Type floor. The chairs sit centre-right in this frame and
          the left third is dark panelling, so the scrim only has to
          earn its opacity down the reading edge and along the
          bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(103deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 22%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 76%)',
        }}
      />
      {/* The floor and the head of the frame. Written out rather
          than composed from `from-`/`via-`/`to-` utilities because
          the band the copy and the legend sit in needs to be nearly
          solid while the middle of the room stays almost untouched,
          and three stops cannot hold both. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.82) 15%, rgba(0,0,0,0.3) 32%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* The probe's own layer, on the same fit box so the card
          opens beside the chair it is describing. */}
      <div data-fit className="pointer-events-none absolute">
        {seatFor && (
          <div
            className={`absolute z-20 w-[10.5rem] border border-white/15 bg-ink/85 p-3 backdrop-blur-sm ${
              probe.flip ? '-translate-x-[calc(100%+16px)]' : 'translate-x-4'
            }`}
            style={{ left: `${seatFor.mark.x}%`, top: `${seatFor.mark.y}%` }}
          >
            <span className="t-label block text-bone">Seat {seatFor.n}</span>
            <dl className="mt-2.5 space-y-1.5">
              <Readout label={D.probe[0]} value={`${seatFor.ms.toFixed(1)} ms`} />
              <Readout label={D.probe[1]} value={`${fmtDb(seatFor.db)} dB`} />
              <Readout
                label={D.probe[2]}
                value={`${seatFor.view.toFixed(1)}°`}
                note={inWindow(seatFor.view) ? D.viewIn : D.viewOut}
              />
            </dl>
          </div>
        )}
      </div>
    </div>
  )

  /* The keyboard route into the probe, and the only control in the
     section. Seven numerals under the hint: hovering the room is
     the discoverable way in, and this is the one that works
     without a pointer. */
  const chairs = (
    <ul className="flex items-center gap-2.5 sm:gap-3">
      {BUILT.map((seat, i) => (
        <li key={seat.n}>
          <button
            type="button"
            className={`t-num pointer-events-auto px-0.5 text-[0.625rem] transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-bone ${
              probe?.i === i ? 'text-bone' : 'text-ash hover:text-fog'
            }`}
            onFocus={() => showProbe(i)}
            onBlur={hideProbe}
            onMouseEnter={() => armedRef.current && showProbe(i)}
            onClick={() => showProbe(i)}
          >
            <span className="sr-only">Read seat </span>
            {seat.n}
          </button>
        </li>
      ))}
    </ul>
  )

  /* ---------- Reduced motion: the room lit, and measured ---------- */
  if (reduced) {
    return (
      <section ref={root} id={D.id} className="relative bg-ink py-24">
        <div className="shell-wide">
          <span className="t-label flex items-center gap-3 text-fog">
            {D.chapter}
            <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
            {D.label}
          </span>
          {/* Both halves of the sentence, in full. The pinned build
              turns the first into the second; with the pin gone
              there is nothing to turn, so the reader gets the whole
              thing at once. */}
          <p data-title className="t-display mt-6 max-w-3xl text-fog">
            {D.title.join(' ')}
          </p>
          <p data-turn className="t-display max-w-3xl text-pure">
            {D.titleTurn.join(' ')}
          </p>
        </div>

        <div
          className="mt-12 flex aspect-[16/9] w-full"
          onPointerMove={onPointer}
          onPointerLeave={hideProbe}
        >
          {room}
        </div>

        <div className="shell-wide mt-10">
          {copy}
          {legend}

          <div className="mt-6 flex items-center justify-between gap-6">
            <p data-hint className="t-label flex items-center gap-3 text-mist">
              <span className="block h-px w-6 bg-white/25" aria-hidden="true" />
              {D.hint}
            </p>
            {chairs}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.titleTurn.join(' ')}
      className="relative isolate bg-ink"
    >
      <div
        data-stage
        className={`relative flex h-[var(--app-h)] w-full flex-col overflow-hidden bg-ink ${
          armed ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={hideProbe}
      >
        {room}

        {/* Everything set sits over the photograph, anchored to the
            STAGE rather than to the picture: the fit box moves with
            the viewport's aspect, and type that moved with it would
            never settle. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col pb-8 pt-12 sm:pb-10 sm:pt-14">
          <header className="shell-wide flex items-start justify-between gap-8">
            <span className="t-label flex items-center gap-3 text-fog">
              {D.chapter}
              <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
              <span className="hidden sm:inline">{D.label}</span>
            </span>

            <span className="flex shrink-0 items-baseline gap-4 border-t border-white/15 pt-2">
              {stage === 2 && done > 0 && (
                <span className="t-num text-[0.6875rem] text-fog">
                  {String(done).padStart(2, '0')} / {String(SEATS).padStart(2, '0')}
                </span>
              )}
              <span className="t-label text-mist">{D.stages[stage]}</span>
            </span>
          </header>

          {/* ONE COLUMN, NOT FOUR CORNERS. Everything set except the
              running head lives in a single block against the frame's
              dark edge. Copy in one corner, a legend in another and a
              control strip in a third is the shape of an instrument
              panel; a photograph with a column of type beside it is
              the shape of a page. It also keeps every word off the lit
              carpet on the right of this frame, which no scrim can
              darken without taking the room down with it. */}
          <div className="shell-wide mt-auto">
            {copy}
            {legend}

            <div className="mt-5 flex items-center justify-between gap-6">
              <p data-hint className="t-label flex items-center gap-3 text-mist">
                <span className="block h-px w-6 bg-white/25" aria-hidden="true" />
                {D.hint}
              </p>
              {armed && chairs}
            </div>
          </div>
        </div>

        {/* --- the title card ---------------------------------- */}
        <div
          data-card
          className="pointer-events-none absolute inset-0 z-10 flex items-center bg-ink/78"
        >
          <div className="shell-wide">
            <div className="relative max-w-3xl">
              <p data-title className="t-display absolute inset-x-0 top-0 text-pure">
                {D.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p data-turn className="t-display text-pure">
                {D.titleTurn.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <p data-silence className="t-label mt-10 text-mist">
              {D.silence}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* One chair: the pool of light lying on it, and the level measured
   at it, set just above.

   TWO ELEMENTS FOR THE POOL, AND THE OUTER ONE IS NOT NEGOTIABLE.
   The outer div does the centring; the inner one is what GSAP
   scales. Putting both on one element looks fine and is wrong:
   GSAP writes the whole `transform` property when it animates
   `scale`, so a Tailwind `-translate-x-1/2` on the same element is
   silently discarded on the first frame and every pool jumps to
   sit with its CORNER on the mark — about 5% of the frame, half a
   chair to the right, and consistent enough across all seven to
   look like deliberate placement rather than a bug.

   A THIRD ELEMENT CARRIES THE LEVEL, because the entrance animates
   the pool's opacity and the measurement animates its brightness.
   One element cannot hold both without the second overwriting the
   first mid-pass. */
function Chair({ seat, active }) {
  const { mark } = seat
  const w = POOL.w * mark.s
  const h = POOL.h * mark.s
  return (
    <>
      <div
        className="absolute"
        style={{
          left: `${mark.x}%`,
          top: `${mark.y}%`,
          width: `${w}%`,
          height: `${h}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div data-pool className="relative h-full w-full mix-blend-screen will-change-transform">
          <div
            data-level
            className="absolute inset-0"
            style={{
              opacity: 0,
              background:
                'radial-gradient(ellipse at center, rgba(255,244,225,1) 0%, rgba(255,235,204,0.62) 28%, rgba(255,228,192,0.24) 52%, rgba(255,224,184,0.06) 72%, rgba(255,224,184,0) 88%)',
            }}
          />
          <span
            className="absolute left-1/2 top-1/2 block h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: '#fff6e8', boxShadow: '0 0 12px 4px rgba(255,231,196,0.5)' }}
          />
        </div>
      </div>

      {/* The value, set above the chair it belongs to with a
          hairline dropping onto it. Centred on the chair's own
          axis, so seven of them read as annotation on a room
          rather than as seven floating captions. */}
      <div
        data-tag
        className={`absolute -translate-x-1/2 text-center transition-colors duration-300 ${
          active ? 'text-pure' : 'text-bone'
        }`}
        style={{ left: `${mark.x}%`, top: `${mark.y - h * 0.5 - 8.2}%` }}
      >
        <span className="t-num block text-[0.5rem] leading-none text-ash">{seat.n}</span>
        <span className="t-num mt-1 block whitespace-nowrap text-[0.75rem] leading-none">
          <span data-val>—</span>
        </span>
        <span className="mx-auto mt-2 block h-5 w-px bg-gradient-to-b from-white/55 to-transparent" />
      </div>
    </>
  )
}

function Readout({ label, value, note }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="t-num text-[0.5625rem] uppercase tracking-[0.18em] text-mist">{label}</dt>
      <dd className="t-num text-right text-[0.6875rem] text-bone">
        {value}
        {note && <span className="mt-0.5 block text-[0.5rem] text-mist">{note}</span>}
      </dd>
    </div>
  )
}
