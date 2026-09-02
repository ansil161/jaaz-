import { useCallback, useRef, useState } from 'react'
import { calibration as D } from '@/features/public/data/site'
import RoomDrawing from './RoomDrawing'
import { SEATS, SEAT_COUNT, VB, fmtDb, nearestSeat, trackPos } from './model'

/* ============================================================
   THE SEAT RESPONSE MATRIX

   What the visitor is left holding after the demonstration has
   run: the same room, now calibrated, and seven tracks that let
   them interrogate any chair in it.

   THE MATRIX IS THE MEASUREMENT, NOT A ROW OF BUTTONS. Each track
   is a number line whose middle is the room average. The hollow
   mark is where a conventional layout puts that chair's reading;
   the solid mark is where calibration puts it; the tie between
   them is the correction. Seven hollow marks scattered to the
   ends and seven solid marks closed on the centre is the entire
   argument of this section, made again in eleven lines of markup
   and no chart.

   It is also the control. A track is a button — one tab stop for
   the whole matrix with the arrows moving between chairs, which
   is the pattern a radio group already uses and the one a
   keyboard visitor expects from a list of alternatives. Seven tab
   stops to read one figure is not accessibility, it is a toll.

   POINTING AT THE PLAN DOES THE SAME THING. The drawing is a map,
   so the whole of it is the target and the nearest chair wins. A
   mouse previews on move and commits on press; a finger only ever
   commits, because a touch "hover" is a tap that has not finished
   and previewing it makes the reading flicker under the thumb.
   ============================================================ */

const CENTRE = D.asBuilt.speakers.find((s) => s.id === 'C') ?? D.asBuilt.speakers[1]

export default function SeatExplorer() {
  const [seat, setSeat] = useState(1)
  const [hover, setHover] = useState(null)
  const planRef = useRef(null)
  const listRef = useRef(null)

  const active = hover ?? seat
  const s = SEATS[active]

  const seatFromEvent = useCallback((e) => {
    const box = planRef.current
    if (!box) return 0
    const r = box.getBoundingClientRect()
    return nearestSeat(
      SEATS.map((it) => it.calibrated),
      VB.x + ((e.clientX - r.left) / r.width) * VB.w,
      VB.y + ((e.clientY - r.top) / r.height) * VB.h,
    )
  }, [])

  const onKey = useCallback((e) => {
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = (Number(e.currentTarget.dataset.seat) + step + SEAT_COUNT) % SEAT_COUNT
    setSeat(next)
    listRef.current?.querySelector(`[data-seat="${next}"]`)?.focus()
  }, [])

  const reads = [
    { label: D.lab.readLabels.arrival, value: s.calibrated.ms.toFixed(1), unit: 'ms' },
    { label: D.lab.readLabels.balance, value: fmtDb(s.calibrated.db), unit: 'dB' },
    { label: D.lab.readLabels.view, value: s.calibrated.view.toFixed(1), unit: '°' },
    { label: D.lab.readLabels.move, value: s.correction.move.toFixed(2), unit: 'm' },
  ]

  return (
    <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-x-20">
      {/* ---------- The instrument's own plan ---------- */}
      <div>
        <div
          ref={planRef}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse') setHover(seatFromEvent(e))
          }}
          onPointerDown={(e) => {
            setSeat(seatFromEvent(e))
            setHover(null)
          }}
          onPointerLeave={() => setHover(null)}
          className="relative mx-auto w-full max-w-[22rem] cursor-crosshair touch-manipulation select-none lg:max-w-none"
          style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
        >
          <RoomDrawing uid="cal-lab" variant="instrument" interactive activeSeat={active} />

          {/* The one figure that belongs ON the drawing, because it
              measures the line it sits beside. */}
          <span
            className="cal-tag pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((( CENTRE.x + s.calibrated.x) / 2 - VB.x) / VB.w) * 100}%`,
              top: `${((( CENTRE.y + s.calibrated.y) / 2 - VB.y) / VB.h) * 100}%`,
            }}
          >
            {s.calibrated.ms.toFixed(1)} ms
          </span>
        </div>
        <p className="cal-note mt-5 text-center lg:text-left">{D.lab.matrixNote}</p>
      </div>

      {/* ---------- The matrix, and what it is reading ---------- */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
          <h3 className="cal-label">{D.lab.matrixLabel}</h3>
          <p className="cal-micro">{D.lab.matrixHint}</p>
        </div>

        <div ref={listRef} className="mt-4 border-t border-[var(--lab-grid)]">
          {SEATS.map((row) => {
            const from = trackPos(row.conventional.db) * 100
            const to = trackPos(row.calibrated.db) * 100
            const on = row.i === active
            return (
              <button
                key={row.id}
                type="button"
                data-seat={row.i}
                tabIndex={row.i === seat ? 0 : -1}
                aria-pressed={row.i === seat}
                aria-label={`${row.label}, ${row.rowName}. Conventional ${fmtDb(row.conventional.db)} decibels, calibrated ${fmtDb(row.calibrated.db)} decibels.`}
                onClick={() => setSeat(row.i)}
                onFocus={() => setSeat(row.i)}
                onKeyDown={onKey}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setHover(row.i)
                }}
                onPointerLeave={() => setHover(null)}
                className={`cal-row grid w-full cursor-pointer grid-cols-[2.6rem_minmax(0,1fr)_3.6rem] items-center gap-x-3 border-b border-[var(--lab-grid)] py-3 text-left sm:grid-cols-[3.2rem_minmax(0,1fr)_4.5rem] sm:gap-x-5 ${
                  on ? 'is-on' : ''
                }`}
              >
                <span className="cal-num">{row.id}</span>

                {/* The track. Centre line is the room average; the
                    tie between the two marks is the correction. */}
                <span className="relative block h-6">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--lab-grid)]" />
                  <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-[var(--lab-ink-2)] opacity-60" />
                  <span
                    className="cal-tie absolute top-1/2 h-px -translate-y-1/2"
                    style={{ left: `${Math.min(from, to)}%`, width: `${Math.abs(to - from)}%` }}
                  />
                  <span className="cal-mark-ghost absolute top-1/2" style={{ left: `${from}%` }} />
                  <span className="cal-mark absolute top-1/2" style={{ left: `${to}%` }} />
                </span>

                <span className="cal-figure-sm text-right">{fmtDb(row.calibrated.db)}</span>
              </button>
            )
          })}
        </div>

        {/* ---------- The reading, in plain English ---------- */}
        <div className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="cal-label">
              {s.label} · {s.rowName}
            </p>
            <p className="cal-read mt-3 max-w-[46ch]">{s.explain}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-1 sm:gap-y-4">
            {reads.map((r) => (
              <div key={r.label}>
                <dt className="cal-micro">{r.label}</dt>
                <dd className="cal-figure-lg mt-0.5 tabular-nums">
                  {r.value}
                  <span className="cal-unit">{r.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
