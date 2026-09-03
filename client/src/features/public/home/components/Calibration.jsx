import { useCallback, useRef, useState } from 'react'
import { calibration as D } from '@/features/public/data/site'
import { gsap, prefersReducedMotion, useGsapScope } from '@/lib/animation/useGsap'
import Plan, { ROWS, SCREEN_FACE } from './calibration/Plan'
import { Mark } from '@/features/public/components/Mark'
import {
  CHAIR,
  INSIDE,
  SEATS,
  SEAT_COUNT,
  SPEAKERS,
  VB,
  fill,
  fmtDb,
  pctX,
  pctY,
} from './calibration/model'

/* ============================================================
   CHAPTER 04 — CALIBRATION

   A drawing sheet. One top-down plan of the finished theatre,
   printed on the house's paper, that draws itself once and can
   then be interrogated chair by chair.

   WHAT THIS REPLACED, AND WHY (2026-09-02)
   The pinned scroll-scrubbed demonstration — the same room drawn
   twice, conventional against calibrated, with ghost chairs and
   correction vectors — is gone. ansil's brief asked for a single
   room, a load sequence rather than a scrub, and a seat readout,
   and asked for the sheet to be "quiet, precise, technical,
   sophisticated and expensive". Given the fork explicitly, they
   chose to drop the comparison.

   The argument survives without the second drawing, because it
   was never really the second drawing that made it: all seven
   chairs land inside the same ±1 dB window and the same 30-40°
   picture window, and `insideNote` prints what a conventional
   layout manages instead. One room that holds every seat is the
   claim; two rooms was one way of showing it.

   NOT PINNED. A pin buys a scrub, and there is nothing here to
   scrub — the sheet has one authored moment (it draws itself) and
   then it is a document the visitor reads and points at. Pinning
   a document to make it take four screens is the opposite of the
   brief's "spacious".

   THE NUMERAL ON THE DRAWING IS THE CONTROL. Seats are numbered
   01-07 because a plan numbers its seats, and those numerals are
   the buttons — no second row of chips underneath restating the
   same seven choices. One tab stop with arrow keys between them,
   which is what a keyboard visitor expects from a list of
   alternatives; seven tab stops to read one figure is a toll.

   EVERY FIGURE IS DERIVED. `model.js` computes view angle, screen
   distance, arrival and response from the geometry in
   `data/site.js`; nothing in this file types a measurement. The
   status word is computed too — a chair that fell out of either
   window would print the other word.
   ============================================================ */

const L = D.lab
const S = D.sheet

/* The sheet opens on chair 01, and the reason is drawing, not
   preference. Chair 02 is the reference chair and the obvious
   choice — until you draw it: it sits ON the optical axis, so its
   centre-channel path lies exactly along the axis line and the
   two superimpose into one stroke that is neither. An off-axis
   chair separates them, and its view rays open asymmetrically,
   which is what makes the angle read as an angle. */
const OPENS_ON = 0

/* Coordinate markers. Three on each axis, not eleven: a survey
   grid is legible because it is labelled at intervals, and a
   number against every metre line is a ruler, not a drawing. */
const COORD_X = [-3, 0, 3]
const COORD_Y = [0, 4, 8]

export default function Calibration() {
  const [seat, setSeat] = useState(OPENS_ON)
  const [hover, setHover] = useState(null)
  const seatsRef = useRef(null)

  const active = hover ?? seat
  const s = SEATS[active]
  const p = s.calibrated
  const centre = (SPEAKERS.find((sp) => sp.id === 'C') ?? SPEAKERS[1]).calibrated

  const values = { view: p.view.toFixed(1), dist: p.dist.toFixed(2), ms: p.ms.toFixed(1), db: fmtDb(p.db) }

  const onKey = useCallback((e) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = (Number(e.currentTarget.dataset.calSeatBtn) + step + SEAT_COUNT) % SEAT_COUNT
    setSeat(next)
    seatsRef.current?.querySelector(`[data-cal-seat-btn="${next}"]`)?.focus()
  }, [])

  /* ---------- The one authored moment ----------
     The sheet draws itself in the order a sheet is drawn: paper,
     then the boundary, then what the room is made of, then what
     is in it, then what has been measured about it. Seven beats,
     one timeline, once.

     FROM-STATES ARE SET HERE, NOT IN THE MARKUP. `useGsapScope`
     runs in `useLayoutEffect`, so these land before the first
     paint and there is no flash of the finished drawing — and
     with JS off or reduced motion on, nothing was ever hidden, so
     nothing can be stranded. That is the failure mode of parking
     `opacity: 0` in the JSX and it has bitten this codebase. */
  const root = useGsapScope((el) => {
    const q = gsap.utils.selector(el)
    const enter = [
      '[data-cal-grid]',
      '[data-cal-reg]',
      '[data-cal-floor]',
      '[data-cal-walls] rect',
      '[data-cal-zones] > *',
      '[data-cal-screen]',
      '[data-cal-spk]',
      '[data-cal-origin]',
      '[data-cal-seat]',
      '[data-cal-read]',
      '[data-cal-mark]',
      '[data-cal-value]',
      '[data-cal-stage]',
      '[data-cal-state]',
    ].flatMap((sel) => q(sel))

    if (prefersReducedMotion()) return

    const lines = q('[data-cal-outline], [data-cal-axis-y], [data-cal-axis-x], [data-cal-dim-run]')

    gsap.set(enter, { autoAlpha: 0 })
    gsap.set(lines, { drawSVG: '50% 50%' })
    gsap.set('[data-cal-screen]', { scaleX: 0.72, transformOrigin: 'center center' })
    gsap.set('[data-cal-origin]', { scale: 0, transformOrigin: 'center center' })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger: el, start: 'top 58%', once: true },
    })

    /* 1 · the ruled paper */
    tl.to(q('[data-cal-grid]'), { autoAlpha: 1, duration: 1.1 })
      .to(q('[data-cal-reg]'), { autoAlpha: 1, duration: 0.6 }, '<0.2')

      /* 2 · the room draws itself, then gains its thickness */
      .to(q('[data-cal-outline]'), { drawSVG: '0% 100%', duration: 1.25, ease: 'power2.inOut' }, '-=0.5')
      .to(q('[data-cal-floor]'), { autoAlpha: 1, duration: 0.9 }, '-=0.55')
      .to(q('[data-cal-walls] rect'), { autoAlpha: 1, duration: 0.7, stagger: 0.07 }, '-=0.7')
      .to(q('[data-cal-zones] > *'), { autoAlpha: 1, duration: 0.7, stagger: 0.09 }, '-=0.3')

      /* 3 · the screen and the three front channels */
      .to(q('[data-cal-screen]'), { autoAlpha: 1, scaleX: 1, duration: 0.85 }, '-=0.35')
      .to(q('[data-cal-spk]'), { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, '-=0.45')

      /* 4 · the axes converge on the chair the room is aimed at */
      .to(q('[data-cal-axis-y]'), { drawSVG: '0% 100%', duration: 0.9 }, '-=0.3')
      .to(q('[data-cal-axis-x]'), { drawSVG: '0% 100%', duration: 0.9 }, '-=0.7')
      .to(q('[data-cal-origin]'), { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, '-=0.25')

      /* 5 · the seats */
      .to(q('[data-cal-seat]'), { autoAlpha: 1, duration: 0.55, stagger: 0.06 }, '-=0.35')
      .to(q('[data-cal-mark]'), { autoAlpha: 1, duration: 0.45, stagger: 0.05 }, '-=0.45')

      /* 6 · measurement runs out from the room */
      .to(q('[data-cal-dim-run]'), { drawSVG: '0% 100%', duration: 0.8, stagger: 0.09 }, '-=0.2')

      .addLabel('wave', '-=0.35')

    /* 7 · sound reaches every chair. Four fronts, offset, running
       once across the room — the claim of the section, animated
       exactly once rather than looped, because a loop turns an
       engineering statement into a screensaver. */
    tl.to(q('[data-cal-waves]'), { opacity: 1, duration: 0.25 }, 'wave')
    q('[data-cal-wave]').forEach((w, i) => {
      tl.fromTo(
        w,
        { scale: 0.28, opacity: 0.85 },
        { scale: 7.6, opacity: 0, duration: 2.1, ease: 'none' },
        `wave+=${i * 0.34}`,
      )
    })
    tl.set(q('[data-cal-waves]'), { opacity: 0 }, 'wave+=3.4')

    /* 8 · and the readings appear */
    tl.to(q('[data-cal-read]'), { autoAlpha: 1, duration: 0.7 }, 'wave+=1.5')
      .to(q('[data-cal-value]'), { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, '-=0.4')
      .to(q('[data-cal-stage]'), { autoAlpha: 1, duration: 0.5, stagger: 0.14 }, '-=0.3')
      .to(q('[data-cal-state]'), { autoAlpha: 1, duration: 0.6 }, '-=0.1')
  }, [])

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={`${S.title}. ${S.standfirst}`}
      className="cal-lab cal-paper relative"
    >
      <div className="shell-wide py-24 sm:py-32 lg:py-40">
        {/* ================= THE TITLE BLOCK =================
            A sheet carries its number, its subject and its state
            along the top edge. That is a drawing convention, not a
            kicker over a heading — which is why it sits on its own
            rule with the full band of white a real sheet leaves
            before the title, rather than tucked above it. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2 border-b border-[var(--lab-grid)] pb-4">
          <p className="cal-micro">
            {L.chapter} · {L.protocol}
          </p>
          <p className="cal-micro flex flex-wrap items-baseline gap-x-4">
            <span>{S.room}</span>
            <span aria-hidden="true" className="text-[var(--lab-grid)]">
              /
            </span>
            <span>{S.discipline}</span>
            <span aria-hidden="true" className="text-[var(--lab-grid)]">
              /
            </span>
            <span>{S.scale}</span>
          </p>
        </div>

        {/* ================= THE TITLE ================= */}
        <div className="mt-20 grid gap-x-8 gap-y-8 sm:mt-28 lg:grid-cols-12 lg:items-end">
          <h2 className="cal-title lg:col-span-6">{S.title}</h2>
          <p className="cal-standfirst max-w-[34ch] lg:col-span-5 lg:col-start-8 lg:pb-2">
            {S.standfirst}
          </p>
        </div>

        {/* ================= THE SHEET =================
            Notes in the left margin, the drawing in the middle,
            the schedule on the right — which is where a real sheet
            puts its notes and its title block, and the only
            composition that gives the plan the whole centre.

            Below `lg` they REORDER rather than simply stacking:
            plan, then the reading, then the notes. Source order is
            the desktop composition — notes in the left margin — and
            a phone that respects it spends five hundred pixels on a
            legend and an honesty note before the drawing they
            explain appears. The blueprint has to be the first thing
            on a phone too, and a margin note read after the thing it
            annotates is still a margin note. */}
        <div className="mt-16 grid gap-x-12 gap-y-16 sm:mt-24 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_minmax(0,17rem)] lg:items-start xl:gap-x-16">
          {/* ---------- Margin · the general notes ---------- */}
          <aside className="order-3 lg:order-1 lg:pt-2">
            <p className="cal-micro">{S.noteLabel}</p>
            <p className="cal-margin-note mt-5">
              {S.note.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            {/* The one legend on the sheet. Three hatches nobody
                can be expected to know by sight is worse than
                three words; four unexplained textures on a
                technical drawing is decoration. */}
            <dl className="mt-10 border-t border-[var(--lab-grid)] pt-5">
              <dt className="cal-micro">{S.marks.treatment}</dt>
              {[
                { key: 'abs', label: S.marks.absorption },
                { key: 'dif', label: S.marks.diffusion },
                { key: 'trap', label: S.marks.trap },
                { key: 'point', label: S.marks.point },
              ].map((k) => (
                <dd key={k.key} className="cal-key mt-3 flex items-start gap-2.5">
                  <span aria-hidden="true" className={`cal-swatch cal-swatch-${k.key}`} />
                  {k.label}
                </dd>
              ))}
            </dl>

            {/* The honesty note. Same size as everything near it,
                because a drawing this confident has to be plain
                about what it is. */}
            <p className="cal-note mt-10 border-t border-[var(--lab-grid)] pt-5">{L.contourNote}</p>
          </aside>

          {/* ---------- The plan ---------- */}
          <div className="relative order-1 lg:order-2">
            <div
              ref={seatsRef}
              className="relative mx-auto w-full max-w-[27rem] lg:max-w-none"
              style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
            >
              <Plan uid="cal-plan" activeSeat={active} />

              {/* ---------- The annotation layer ----------
                  Every word on the drawing is here, positioned off
                  the drawing's own coordinate system. See Plan.jsx
                  for why none of it is SVG text. */}
              <div className="absolute inset-0">
                {/* --- Coordinate markers. Hidden below lg: a
                        390px sheet has no room for a survey grid's
                        labels and the drawing needs the air more
                        than the reader needs the numbers. --- */}
                {COORD_X.map((x) => (
                  <span
                    key={`cx${x}`}
                    data-cal-mark
                    className="cal-coord absolute hidden -translate-x-1/2 lg:block"
                    style={{ left: `${pctX(x)}%`, top: `${pctY(-1.02)}%` }}
                  >
                    {x > 0 ? `+${x}` : x}
                  </span>
                ))}
                {COORD_Y.map((y) => (
                  <span
                    key={`cy${y}`}
                    data-cal-mark
                    className="cal-coord absolute hidden -translate-y-1/2 lg:block"
                    style={{ left: `${pctX(-4.24)}%`, top: `${pctY(y)}%` }}
                  >
                    {y}
                  </span>
                ))}

                {/* --- The axes name themselves ---
                    The optical axis is labelled in the clear band
                    between the speakers and the front row, set
                    BESIDE its own line rather than on it. Its
                    first position ran the label straight down
                    through the screen and the centre channel,
                    which is the one place on this plan a vertical
                    word cannot go. --- */}
                <span
                  data-cal-mark
                  className="cal-tick absolute origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap"
                  style={{ left: `${pctX(0.42)}%`, top: `${pctY(3.5)}%` }}
                >
                  {S.marks.optical}
                </span>
                {/* The reference axis is NOT labelled on the plan.
                    Its own margin note is headed `Reference axis`
                    three columns to the left, and the drawing has
                    nowhere to put a second copy: the lane along
                    that axis between the left wall and chair 01 is
                    1.19 m, and the words are wider than the lane.
                    A label that has to sit on top of a wall to fit
                    is a label the drawing did not have room for. */}

                {/* --- Treatment, named where the zone can carry
                        the word. Absorption reads vertically up
                        its own wall; diffusion is set OUTSIDE the
                        rear wall, because a horizontal word laid
                        along a toothed diffuser hatch is
                        illegible — the two rules interleave. --- */}
                <span
                  data-cal-mark
                  className="cal-tick absolute hidden origin-center -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap sm:block"
                  style={{ left: `${pctX(-2.72)}%`, top: `${pctY(2.7)}%` }}
                >
                  {S.marks.absorption}
                </span>
                <span
                  data-cal-mark
                  className="cal-tick absolute hidden -translate-x-1/2 -translate-y-1/2 whitespace-nowrap sm:block"
                  style={{ left: `${pctX(-1.55)}%`, top: `${pctY(D.room.d + 0.46)}%` }}
                >
                  {S.marks.diffusion}
                </span>

                {/* --- Dimension figures. Set over the middle of
                        the run they measure, on the paper halo, the
                        way a drawing breaks its own line to let a
                        figure through. --- */}
                <span
                  data-cal-value
                  className="cal-dim absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                  style={{ left: '50%', top: `${pctY(-0.62)}%` }}
                >
                  {S.marks.screen} {D.screenWidth.toFixed(2)}
                </span>
                <span
                  data-cal-value
                  className="cal-dim absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: `${pctY(D.room.d + 0.68)}%` }}
                >
                  {D.room.w.toFixed(2)}
                </span>
                <span
                  data-cal-value
                  className="cal-dim absolute origin-center -translate-x-1/2 -translate-y-1/2 rotate-90"
                  style={{ left: `${pctX(D.room.w / 2 + 0.82)}%`, top: `${pctY(D.room.d / 2)}%` }}
                >
                  {D.room.d.toFixed(2)}
                </span>
                <span
                  data-cal-value
                  className="cal-dim absolute origin-center -translate-x-1/2 -translate-y-1/2 rotate-90"
                  style={{
                    left: `${pctX(-D.room.w / 2 - 0.82)}%`,
                    top: `${pctY((SCREEN_FACE + ROWS[0]) / 2)}%`,
                  }}
                >
                  {(ROWS[0] - SCREEN_FACE).toFixed(2)}
                </span>

                {/* --- The three front channels --- */}
                {SPEAKERS.map((sp) => (
                  <span
                    key={sp.id}
                    data-cal-mark
                    className="cal-tick absolute -translate-x-1/2"
                    style={{
                      left: `${pctX(sp.calibrated.x)}%`,
                      top: `${pctY(sp.calibrated.y + 0.34)}%`,
                    }}
                  >
                    {sp.id}
                  </span>
                ))}

                {/* --- The seven, which are also the control ---
                    THE CHAIR IS THE TARGET, THE NUMERAL IS THE
                    LABEL. The button is a box the size of the
                    chair — pointing at a chair on a plan is what a
                    visitor will try — and the numeral hangs
                    outside it, which is where a seating plan
                    prints a seat number. A second strip of chips
                    below the drawing would be the same seven
                    choices twice.

                    Front row labels ABOVE, back row BELOW. Both
                    rows labelled on the same side puts row B's
                    numerals inside row A's chairs: the rows are
                    0.95 m apart and a chair is 0.87 m deep, so
                    there is no lane between them. Labelling
                    outward uses the two lanes there are.

                    Roving tabindex: one tab stop for the room, the
                    arrows move between chairs. Seven tab stops to
                    read one figure is a toll, not accessibility. */}
                {SEATS.map((row) => {
                  const on = row.i === active
                  const above = row.row === 0
                  return (
                    <button
                      key={row.id}
                      type="button"
                      data-cal-seat-btn={row.i}
                      tabIndex={row.i === seat ? 0 : -1}
                      aria-pressed={row.i === seat}
                      aria-label={`${row.label}, ${row.rowName}. Viewing angle ${row.calibrated.view.toFixed(1)} degrees, ${row.calibrated.dist.toFixed(2)} metres from the screen, arrival ${row.calibrated.ms.toFixed(1)} milliseconds, response ${fmtDb(row.calibrated.db)} decibels.`}
                      onClick={() => setSeat(row.i)}
                      onFocus={() => setSeat(row.i)}
                      onKeyDown={onKey}
                      onPointerEnter={(e) => {
                        if (e.pointerType === 'mouse') setHover(row.i)
                      }}
                      onPointerLeave={() => setHover(null)}
                      className={`cal-seat-btn absolute ${on ? 'is-on' : ''}`}
                      style={{
                        left: `${pctX(row.calibrated.x - CHAIR.w / 2 - 0.08)}%`,
                        top: `${pctY(row.calibrated.y - CHAIR.d / 2 - 0.08)}%`,
                        width: `${((CHAIR.w + 0.16) / VB.w) * 100}%`,
                        height: `${((CHAIR.d + CHAIR.rest + 0.16) / VB.h) * 100}%`,
                      }}
                    >
                      <span
                        data-cal-mark
                        aria-hidden="true"
                        className="cal-seat-n"
                        style={above ? { bottom: '100%' } : { top: '100%' }}
                      >
                        {row.id}
                      </span>
                    </button>
                  )
                })}

                {/* --- What the selected chair reads, printed
                        where it is measured. TWO readings, each
                        named, not five: the schedule carries the
                        full set, and five tags over a 1.4 m seat
                        pitch is the annotated-drawing failure this
                        section already found once. The arrival
                        figure needs no name — it sits on the path
                        whose length it is, in milliseconds. --- */}
                <span
                  data-cal-read
                  className="cal-tag absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                  style={{
                    left: `${pctX((centre.x + p.x) / 2 + 0.44)}%`,
                    top: `${pctY((centre.y + p.y) / 2)}%`,
                  }}
                >
                  {values.ms} ms
                </span>
                <span
                  data-cal-read
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center whitespace-nowrap"
                  style={{ left: `${pctX(p.x)}%`, top: `${pctY(p.y - 1.62)}%` }}
                >
                  <span className="cal-tick block">{S.marks.view}</span>
                  <span className="cal-tag mt-1 block">{values.view}°</span>
                </span>
              </div>
            </div>
          </div>

          {/* ---------- The schedule ----------
              A drawing's schedule: label, figure, unit, one row per
              line, ruled. Not a card and not a panel floating on
              the drawing — a tinted box with a hairline round it on
              a sheet like this is a chip, and this section has been
              rebuilt away from that once already. */}
          <aside className="order-2 lg:order-3 lg:pt-2">
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--lab-ink)] pb-3">
              <h3 className="cal-seat-title">{s.label}</h3>
              <p className="cal-micro">{s.rowName}</p>
            </div>

            <dl>
              {S.readout.map((r) => (
                <div
                  key={r.key}
                  className="flex items-baseline justify-between gap-5 border-b border-[var(--lab-grid)] py-4"
                >
                  <dt className="cal-micro">{r.label}</dt>
                  <dd className="cal-figure-lg shrink-0 tabular-nums">
                    {values[r.key]}
                    <span className="cal-unit">{r.unit}</span>
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-5 border-b border-[var(--lab-grid)] py-4">
                <dt className="cal-micro">{S.statusLabel}</dt>
                <dd className={`cal-status shrink-0 ${s.ok ? 'is-ok' : ''}`}>
                  {s.ok ? S.statusOk : S.statusNear}
                </dd>
              </div>
            </dl>

            <p className="cal-micro mt-5">{S.readoutHint}</p>

            {/* Why all seven read the same word. Without this the
                constant status looks like a field that does not
                work; with it, the constant IS the finding. */}
            <p className="cal-note mt-8">
              {fill(L.insideNote, { from: INSIDE.band.from, to: INSIDE.band.to })}
            </p>
          </aside>
        </div>

        {/* ================= THE PROTOCOL =================
            Four stages, in order, because the order IS the
            protocol — a room that has not been scanned cannot have
            its angles optimised. The sheet's own state is printed
            at the end of the run, which is the last thing the load
            sequence does. */}
        <div className="mt-24 border-t border-[var(--lab-ink)] pt-8 sm:mt-32">
          <ol className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {S.stages.map((stage) => (
              <li key={stage.name} data-cal-stage className="cal-stage">
                <Mark name={stage.icon} size={17} className="cal-stage-n" />
                <span aria-hidden="true" className="cal-stage-rule" />
                <span className="cal-stage-name">{stage.name}</span>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4">
            <p data-cal-state className="cal-state">
              {S.state}
            </p>
            <p className="cal-margin-note max-w-[42ch] text-right">{D.creed}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
