import { useRef } from 'react'
import { calibration as D } from '@/features/public/data/site'
import { gsap, revealLines, useGsapScope } from '@/lib/animation/useGsap'
import RoomDrawing from './calibration/RoomDrawing'
import SeatExplorer from './calibration/SeatExplorer'
import {
  INSIDE,
  SEATS,
  SPEAKERS,
  VERDICT,
  fill,
  fmtDb,
  lerp,
  pctX,
  pctY,
  seatFill,
} from './calibration/model'

/* ============================================================
   CHAPTER 04 — CALIBRATION
   THE CALIBRATION INSTRUMENT

   The one section on this site that argues rather than shows, and
   the only one the visitor watches happen.

   WHAT THIS REPLACED, AND WHY.
   Four builds are buried under this one, and each failed the same
   test in a different way. A pinned scrub over a photograph read
   as an engineering drawing done badly. A photograph with the
   figures set on it never showed the plan being argued about. A
   paper report drew the plan but hid half the case behind a
   switch. A side-by-side pair showed both layouts and asked the
   visitor to work out the difference between two pictures.

   All four SHOWED a conclusion. None of them showed the work.

   This one runs the work: SCAN, DETECT, EXPOSE, CORRECT, COMPARE,
   VERIFY, and then hands the instrument over. One room, one
   pinned master timeline, and the visitor scrolls the engineering
   forward. Nobody has to be told the calibrated room is better —
   they watch it stop being the other one.

   ------------------------------------------------------------
   THE CHOREOGRAPHY

   ONE timeline, scrubbed by ONE pin. Every phase is a position on
   it, so the section can never be caught between two competing
   triggers and there is exactly one thing to tune. `PHASE` below
   is the score; changing a number there moves a phase and nothing
   else.

   Positions in the timeline are in arbitrary units that the scrub
   maps onto the pin's length, so the phases can be re-weighted
   against each other without touching the pin.

   The correction itself (phase 05) is driven by a single proxy
   `{ t }` whose `onUpdate` writes seven chair positions, three
   speaker positions, fourteen ink fills and the running variance
   figure. One interpolation, one write pass, no per-element
   tweens fighting over the same transform — and because `write()`
   is a pure function of `t`, no element can be left stranded
   mid-correction by a scrub that reverses.

   ------------------------------------------------------------
   WHAT REDUCED MOTION GETS

   Not a degraded version of this: the finished one. `matchMedia`
   builds the pin only where motion is welcome; everywhere else
   `settle()` writes the calibrated state, reveals the field, the
   ghosts and the verdict, and the section becomes a normal-height
   spread of the drawing and its figures. Nothing is behind an
   animation that never plays.

   ------------------------------------------------------------
   WHY THE SECTION IS ON PAPER

   The rest of the page is near-black. This is the one place the
   argument stops being cinematic and becomes a document, and the
   transition is authored: the statement lands in the dark, and
   the dark is then lifted off the sheet. `.cal-lab` in site.css
   carries the palette, scoped — it does NOT touch the global
   tokens, because the ink here is #111 on #E9E4D8 and the site's
   is #000 on #F4F2EE, and one of those is a drawing surface.
   ============================================================ */

const L = D.lab

/* The score. Units are relative; the scrub maps the total onto
   the pin. Keep them integers — a phase you cannot count is a
   phase you cannot tune. */
const PHASE = {
  curtain: 0,
  room: 6,
  scan: 16,
  expose: 34,
  correct: 46,
  ghost: 72,
  verify: 84,
  hold: 96,
  total: 104,
}

/* Where the scan crosses each chair, as a fraction of the scan
   phase. Derived from the chairs' own depths so the annotations
   fire when the band actually reaches them rather than on a
   hand-typed stagger. */
const SCAN_FROM = -0.6
const SCAN_TO = D.room.d + 0.4
const scanAt = (y) => (y - SCAN_FROM) / (SCAN_TO - SCAN_FROM)

/* The seven readings the scan prints, in the order it meets
   them. */
const SCAN_ORDER = [...SEATS].sort((a, b) => a.conventional.y - b.conventional.y)

const METRIC_VALUES = {
  variance: (k) => `${VERDICT.variance[k].toFixed(1)}`,
  arrival: (k) => `${VERDICT.arrival[k].toFixed(1)}`,
  view: (k) => `${VERDICT.view[k][0].toFixed(1)}–${VERDICT.view[k][1].toFixed(1)}`,
}

export default function Calibration() {
  const stageRef = useRef(null)
  const varianceRef = useRef(null)

  const root = useGsapScope((scope) => {
    revealLines(scope.querySelector('[data-cal-claim]'), { start: 'top 78%', stagger: 0.11 })
    revealLines(scope.querySelector('[data-cal-close]'), { start: 'top 82%' })

    const q = gsap.utils.selector(scope)
    const seats = q('[data-cal-svg="demo"] [data-cal-seat]')
    const pads = q('[data-cal-svg="demo"] [data-cal-pad], [data-cal-svg="demo"] [data-cal-rest]')
    const spks = q('[data-cal-svg="demo"] [data-cal-spk]')
    const variance = varianceRef.current

    /* The one write pass. `t` is 0 at the conventional layout and
       1 at the calibrated one, and everything printed or drawn in
       the demonstration is a pure function of it. */
    const write = (t) => {
      SEATS.forEach((s, i) => {
        const g = seats[i]
        if (g) {
          g.style.transform = `translate(${lerp(s.conventional.x, s.calibrated.x, t)}px, ${lerp(s.conventional.y, s.calibrated.y, t)}px)`
        }
        const ink = seatFill(lerp(s.conventional.db, s.calibrated.db, t))
        const pad = pads[i * 2]
        const rest = pads[i * 2 + 1]
        if (pad) pad.setAttribute('fill', ink)
        if (rest) rest.setAttribute('fill', ink)
      })
      SPEAKERS.forEach((sp, i) => {
        const g = spks[i]
        if (!g) return
        g.style.transform = `translate(${lerp(sp.conventional.x, sp.calibrated.x, t)}px, ${lerp(sp.conventional.y, sp.calibrated.y, t)}px)`
      })
      if (variance) {
        /* Not a counter. A measurement settling: the reading
           dithers while the solver is still moving chairs and the
           dither decays to nothing as it converges, which is what
           a live figure does and what an eased count-down does
           not. */
        const v = lerp(VERDICT.variance.from, VERDICT.variance.to, t)
        const jitter = t > 0 && t < 1 ? (Math.sin(t * 71.3) + Math.sin(t * 137.9)) * 0.06 * (1 - t) : 0
        variance.textContent = Math.max(0, v + jitter).toFixed(1)
      }
    }

    /* Everything the demonstration ends holding, written at once.
       Used by the reduced-motion branch and as the pin's safety
       net if a refresh lands mid-scrub. */
    const settle = () => {
      write(1)
      gsap.set(q('[data-cal-curtain]'), { autoAlpha: 0, yPercent: -100 })
      gsap.set(q('[data-cal-paper]'), { autoAlpha: 1 })
      gsap.set(
        q(
          '[data-cal-svg="demo"] [data-cal-room], [data-cal-svg="demo"] [data-cal-screen], [data-cal-svg="demo"] [data-cal-speakers], [data-cal-svg="demo"] [data-cal-seats]',
        ),
        { autoAlpha: 1 },
      )
      gsap.set(q('[data-cal-svg="demo"] [data-cal-field="calibrated"]'), { autoAlpha: 1 })
      gsap.set(q('[data-cal-svg="demo"] [data-cal-ghosts]'), { autoAlpha: 0.85 })
      gsap.set(q('[data-cal-dim]'), { autoAlpha: 1 })
      gsap.set(q('[data-cal-key]'), { autoAlpha: 1 })
      gsap.set(q('[data-cal-verdict]'), { autoAlpha: 1, y: 0 })
      gsap.set(q('[data-cal-phase]'), { autoAlpha: 0 })
      gsap.set(q('[data-cal-phase="verify"]'), { autoAlpha: 1 })
    }

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: reduce)', () => {
      settle()
    })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      write(0)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'top top',
          end: '+=440%',
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      /* --- 02 · the dark is lifted off the sheet --------------- */
      tl.to(q('[data-cal-curtain-type]'), { autoAlpha: 0, y: -28, duration: 3 }, PHASE.curtain)
        .to(q('[data-cal-curtain]'), { yPercent: -100, duration: 5, ease: 'power2.inOut' }, PHASE.curtain + 2)

      /* --- 02b · the room is drawn, in the order a plan is ----- */
      tl.fromTo(
        q('[data-cal-svg="demo"] [data-cal-room]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 3 },
        PHASE.room,
      )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-screen]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 2 },
          PHASE.room + 2,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-speakers]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 2 },
          PHASE.room + 3.5,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-seats]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 3 },
          PHASE.room + 4.5,
        )
        .fromTo(q('[data-cal-dim]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 2 }, PHASE.room + 6)
        .fromTo(
          q('[data-cal-phase="room"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5 },
          PHASE.room + 1,
        )
        .to(q('[data-cal-phase="room"]'), { autoAlpha: 0, duration: 1.5 }, PHASE.scan)

      /* --- 03 · the analysis pass ----------------------------- */
      const scanDur = PHASE.expose - PHASE.scan
      tl.fromTo(
        q('[data-cal-phase="scan"]'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.5 },
        PHASE.scan,
      )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-scan], [data-cal-svg="demo"] [data-cal-scan-line]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1 },
          PHASE.scan,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-scan]'),
          { y: SCAN_FROM },
          { y: SCAN_TO, duration: scanDur - 1 },
          PHASE.scan,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-scan-line]'),
          { y: SCAN_FROM },
          { y: SCAN_TO, duration: scanDur - 1 },
          PHASE.scan,
        )
        .to(
          q('[data-cal-svg="demo"] [data-cal-scan], [data-cal-svg="demo"] [data-cal-scan-line]'),
          { autoAlpha: 0, duration: 1 },
          PHASE.expose - 1,
        )

      /* Each chair's reading appears as the band reaches it and
         clears once it has passed. Times come from the geometry,
         not from a stagger. */
      SCAN_ORDER.forEach((s) => {
        const at = PHASE.scan + scanAt(s.conventional.y) * (scanDur - 1)
        tl.fromTo(
          q(`[data-cal-tag="${s.i}"]`),
          { autoAlpha: 0, x: -6 },
          { autoAlpha: 1, x: 0, duration: 1.2 },
          at,
        ).to(q(`[data-cal-tag="${s.i}"]`), { autoAlpha: 0.34, duration: 1.6 }, at + 3.6)
      })

      /* Every reading printed during the scan is a CONVENTIONAL
         reading. The moment the correction starts they stop being
         true, so they come off the plan rather than hanging around
         at a third of an opacity contradicting the chairs
         underneath them. */
      tl.to(q('[data-cal-tag]'), { autoAlpha: 0, duration: 2 }, PHASE.correct - 1)

      /* --- 04 · the problem, made visible --------------------- */
      tl.to(q('[data-cal-phase="scan"]'), { autoAlpha: 0, duration: 1.5 }, PHASE.expose)
        .fromTo(
          q('[data-cal-phase="expose"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5 },
          PHASE.expose + 1,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-field="conventional"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 5 },
          PHASE.expose,
        )
        .fromTo(
          q('[data-cal-variance]'),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 3 },
          PHASE.expose + 2,
        )
        .fromTo(q('[data-cal-key]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 3 }, PHASE.expose + 1)

      /* --- 05 · the correction -------------------------------- */
      const proxy = { t: 0 }
      tl.to(q('[data-cal-phase="expose"]'), { autoAlpha: 0, duration: 1.5 }, PHASE.correct)
        .fromTo(
          q('[data-cal-phase="correct"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5 },
          PHASE.correct,
        )
        .to(
          proxy,
          {
            t: 1,
            duration: PHASE.ghost - PHASE.correct - 2,
            ease: 'power2.inOut',
            onUpdate: () => write(proxy.t),
          },
          PHASE.correct + 1,
        )
        .to(
          q('[data-cal-svg="demo"] [data-cal-field="conventional"]'),
          { autoAlpha: 0, duration: 8 },
          PHASE.correct + 4,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-field="calibrated"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 10 },
          PHASE.correct + 6,
        )

      /* The instrument's running commentary. The five lines are
         already on the sheet — what moves is which one is INKED,
         so the block reads as a process log being worked through
         rather than as five labels taking turns to exist. A list
         that appears and disappears line by line is a slot
         machine; a list with a cursor moving down it is an
         instrument. */
      const steps = q('[data-cal-step]')
      const stepDur = (PHASE.ghost - PHASE.correct - 2) / Math.max(steps.length, 1)
      steps.forEach((el, i) => {
        tl.to(el, { opacity: 1, duration: stepDur * 0.3 }, PHASE.correct + 1 + i * stepDur).to(
          el,
          { opacity: 0.3, duration: stepDur * 0.3 },
          PHASE.correct + 1 + (i + 0.85) * stepDur,
        )
      })

      /* --- 06 · ghost memory ---------------------------------- */
      tl.to(q('[data-cal-phase="correct"]'), { autoAlpha: 0, duration: 1.5 }, PHASE.ghost)
        .fromTo(
          q('[data-cal-phase="ghost"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.5 },
          PHASE.ghost,
        )
        .fromTo(
          q('[data-cal-svg="demo"] [data-cal-ghosts]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 4 },
          PHASE.ghost + 1,
        )
        .to(
          q('[data-cal-svg="demo"] [data-cal-ghosts]'),
          { autoAlpha: 0.85, duration: 3 },
          PHASE.verify,
        )

      /* --- 07 · reference uniformity -------------------------- */
      tl.to(q('[data-cal-phase="ghost"]'), { autoAlpha: 0, duration: 1.5 }, PHASE.verify)
        .fromTo(
          q('[data-cal-phase="verify"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 2 },
          PHASE.verify,
        )
        .fromTo(
          q('[data-cal-verdict]'),
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 4, stagger: 1.2 },
          PHASE.verify + 1,
        )
        .to(q('[data-cal-variance]'), { autoAlpha: 0, duration: 2 }, PHASE.verify + 1)

      /* The hold. The last stretch of the pin does nothing on
         purpose: the drawing has just finished and the reader is
         given a beat with it before the pin lets go. */
      tl.to({}, { duration: PHASE.total - PHASE.hold }, PHASE.hold)

      return () => {
        write(1)
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={L.statement.flat().join(' ')}
      className="cal-lab relative bg-ink"
    >
      {/* ================= 01 · THE STATEMENT =================
          In the dark, where the rest of the page lives, so the
          sheet that follows arrives as a change of medium rather
          than as a change of background colour. */}
      <div className="shell-wide relative flex min-h-[86svh] flex-col justify-center py-28 sm:min-h-[92svh]">
        <span className="t-label flex items-center gap-3 text-mist">
          {L.chapter}
          <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
          {L.protocol}
        </span>
        <h2 data-cal-claim className="t-chapter mt-9 max-w-[19ch] text-balance sm:mt-12">
          <span className="block text-fog">{L.statement[0].join(' ')}</span>
          <span className="block text-pure">{L.statement[1].join(' ')}</span>
        </h2>
        <p className="t-sub mt-9 max-w-[52ch] text-fog">{L.statementNote}</p>
      </div>

      {/* ================= 02-07 · THE INSTRUMENT =================
          One pinned stage. The paper is underneath from the start
          and the dark is lifted off it, which is why the join
          never shows a seam. */}
      <div ref={stageRef} className="relative h-[100svh] overflow-hidden">
        <div data-cal-paper className="cal-paper absolute inset-0" />

        {/* A DRAWING SHEET, NOT A HERO WITH A SIDEBAR. Three zones
            at `lg`: what the instrument is doing on the left, the
            plan in the middle, what it has found on the right —
            which is where a real sheet puts its notes and its
            title block, and the only composition that uses a
            1366x600 stage instead of leaving a third of it empty.

            Below `lg` the three zones stack and each one shows
            less: a phone gets the state, the plan, and one figure
            at a time. Shrinking a three-column drawing sheet to
            390px is how this becomes unreadable; giving each zone
            its own small composition is how it stays an
            instrument. */}
        <div className="shell-wide relative flex h-full flex-col gap-3 py-5 sm:py-7 lg:grid lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,15rem)] lg:items-stretch lg:gap-x-8 lg:py-8 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,17rem)] xl:gap-x-12">
          {/* ---------- Zone 1 · what the instrument is doing ---------- */}
          <aside className="relative order-1 h-[1.4rem] shrink-0 lg:h-auto lg:pt-2 lg:pb-1">
            {Object.entries(L.phases).map(([key, phase]) => (
              <div
                key={key}
                data-cal-phase={key}
                className="absolute inset-x-0 top-0 flex items-baseline gap-3 lg:block"
                style={{ opacity: 0 }}
              >
                <p className="cal-state">{phase.code}</p>
                <ul className="mt-2 hidden space-y-1 lg:block">
                  {phase.lines.map((line) => (
                    <li
                      key={line}
                      {...(key === 'correct' ? { 'data-cal-step': '' } : {})}
                      className="cal-micro"
                      style={key === 'correct' ? { opacity: 0.3 } : undefined}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="cal-micro truncate lg:hidden">{phase.lines[0]}</p>
              </div>
            ))}

            {/* THE ONE LEGEND ON THE SHEET, and it is here because
                two unexplained warm lines on a technical drawing
                are worse than a two-word key. It arrives with the
                field and stays. Below `lg` there is no room for
                it, and `contourNote` on the paper below carries
                the same two sentences in prose. */}
            <div
              data-cal-key
              className="absolute bottom-0 left-0 hidden lg:block"
              style={{ opacity: 0 }}
            >
              {[
                { label: L.fieldLabel, colour: '#b7af9f' },
                { label: L.bandLabel, colour: 'var(--lab-signal)' },
              ].map((k) => (
                <p key={k.label} className="cal-micro flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55em] block h-px w-5 shrink-0"
                    style={{ background: k.colour }}
                  />
                  {k.label}
                </p>
              ))}
            </div>
          </aside>

          {/* ---------- Zone 2 · the plan ---------- */}
          <div className="relative order-2 min-h-0 flex-1">
            <div
              className="relative mx-auto h-full max-w-full"
              style={{ aspectRatio: '8.9 / 11.15' }}
            >
              <RoomDrawing uid="cal-demo" variant="demo" />

              {/* ---------- The annotation layer ----------
                  Every word on the plan is HTML, positioned off the
                  drawing's own coordinate system. See RoomDrawing
                  for why none of it is SVG text. */}
              <div className="pointer-events-none absolute inset-0">
                {SPEAKERS.map((sp) => (
                  <span
                    key={sp.id}
                    data-cal-dim
                    className="cal-tick absolute -translate-x-1/2"
                    style={{
                      left: `${pctX(sp.calibrated.x)}%`,
                      top: `${pctY(sp.calibrated.y + 0.6)}%`,
                      opacity: 0,
                    }}
                  >
                    {sp.id}
                  </span>
                ))}

                <span
                  data-cal-dim
                  className="cal-tick absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: '50%', top: `${pctY(-0.72)}%`, opacity: 0 }}
                >
                  Screen · {D.screenWidth.toFixed(2)} m
                </span>
                <span
                  data-cal-dim
                  className="cal-tick absolute -translate-x-1/2 translate-y-1 whitespace-nowrap"
                  style={{ left: '50%', top: `${pctY(D.room.d + 0.72)}%`, opacity: 0 }}
                >
                  {D.room.w.toFixed(2)} m
                </span>
                <span
                  data-cal-dim
                  className="cal-tick absolute origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap"
                  style={{ left: `${pctX(D.room.w / 2 + 1.1)}%`, top: '46%', opacity: 0 }}
                >
                  {D.room.d.toFixed(2)} m
                </span>

                {/* Seven readings, printed where the scan finds
                    them.

                    SHORT, BECAUSE THREE CHAIRS SHARE A ROW. The
                    first pass printed balance, arrival and viewing
                    angle beside every chair; at 1.4 m of spacing
                    those three tags overlapped into one unreadable
                    band of type, which is the failure mode of every
                    annotated drawing there has ever been. What a
                    chair carries here is its number and the single
                    figure this section is about. The full reading
                    for any chair is a scroll away, in the
                    instrument. */}
                {SEATS.map((s) => (
                  <span
                    key={s.id}
                    data-cal-tag={s.i}
                    className="cal-tag absolute -translate-x-1/2 whitespace-nowrap"
                    style={{
                      left: `${pctX(s.conventional.x)}%`,
                      top: `${pctY(s.conventional.y - 0.8)}%`,
                      opacity: 0,
                    }}
                  >
                    <b className="hidden sm:inline">{s.id}</b>
                    {fmtDb(s.conventional.db)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ---------- Zone 3 · what it has found ----------
              The running figure while the room is being solved,
              and the sheet's title block once it is. They never
              share the stage: the verdict's first line IS the
              variance, and printing it twice would read as two
              different measurements. */}
          <aside className="relative order-3 h-[3.6rem] shrink-0 lg:flex lg:h-auto lg:flex-col lg:justify-between lg:pt-2">
            {/* The running figure and the title block occupy the
                SAME strip below `lg` and only one of them is ever
                up: the variance while the room is being solved,
                the verdict once it is. Stacked in flow on a phone
                they would take a third of the stage away from the
                drawing, and a calibration instrument whose
                instrument is small is not one. */}
            <div
              data-cal-variance
              className="absolute inset-x-0 bottom-0 flex items-baseline gap-3 lg:static lg:block"
              style={{ opacity: 0 }}
            >
              <p className="cal-micro shrink-0">{L.varianceLabel}</p>
              <p className="cal-figure-xl tabular-nums lg:mt-1">
                <span ref={varianceRef}>{VERDICT.variance.from.toFixed(1)}</span>
                <span className="cal-unit">dB</span>
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-x-3 lg:static lg:mt-auto lg:block">
              {L.metrics.map((m) => (
                <div
                  key={m.key}
                  data-cal-verdict
                  className="border-t border-[var(--lab-grid)] pt-1.5 lg:py-3"
                  style={{ opacity: 0 }}
                >
                  <p className="cal-micro truncate">
                    <span className="lg:hidden">{m.short}</span>
                    <span className="hidden lg:inline">{m.label}</span>
                  </p>
                  <p className="cal-figure-lg mt-0.5 tabular-nums">
                    {m.pm ? '±' : ''}
                    {METRIC_VALUES[m.key]('to')}
                    <span className="cal-unit">{m.unit}</span>
                    <span className="cal-was hidden lg:inline">
                      {m.pm ? '±' : ''}
                      {METRIC_VALUES[m.key]('from')}
                      {m.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* The dark, lifted. It carries only the protocol mark —
            the statement above has already been read, and repeating
            it here would make the pin open on a title card. */}
        <div
          data-cal-curtain
          className="absolute inset-0 z-20 flex items-end bg-ink will-change-transform"
        >
          <div data-cal-curtain-type className="shell-wide pb-[14vh]">
            <p className="t-label text-mist">{L.phases.room.code}</p>
            <p className="t-sub mt-4 max-w-[46ch] text-fog">{L.contourNote}</p>
          </div>
        </div>
      </div>

      {/* ================= THE INSTRUMENT, HANDED OVER ============= */}
      <div className="cal-paper relative">
        <div className="shell-wide py-20 sm:py-28 lg:py-32">
          <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2 border-b border-[var(--lab-grid)] pb-5">
            <h3 className="cal-label">{L.verdictTitle}</h3>
            <p className="cal-note max-w-[62ch]">
              {fill(L.insideNote, { from: INSIDE.band.from, to: INSIDE.band.to })}
            </p>
          </div>

          <div className="mt-14 sm:mt-20">
            <SeatExplorer />
          </div>

          <p className="cal-note mt-14 max-w-[68ch] sm:mt-20">{L.contourNote}</p>
        </div>
      </div>

      {/* ================= THE CLOSE ================= */}
      <div className="cal-paper relative">
        <div className="shell-wide border-t border-[var(--lab-grid)] py-20 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20">
            <p data-cal-close className="t-chapter text-[var(--lab-ink)]">
              {D.resolve.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="t-sub max-w-[46ch] text-[var(--lab-ink-2)] lg:pb-2">{D.creed}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
