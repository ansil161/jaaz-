import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import { compare } from '@/features/public/data/experience'
import { Lines } from '@/features/public/components/Motion'
import GradedPlate from './GradedPlate'

/* ============================================================
   EXPERIENCE THE DIFFERENCE

   Two specifications of the same room, held against each other
   on one seam. The brief asks for cinematic transitions rather
   than dashboard UI, and the difference here is that the
   COMPARISON IS THE PICTURE: the ledger underneath annotates
   what you are already looking at instead of standing in for it.

   Reuses `.jaz-compare` — the same seam custom property, clip,
   handle and light-bleed the calibration compare on the homepage
   uses. One drag writes one CSS variable, so a drag is one style
   write per frame rather than a React render per frame.

   THE LEDGER MOVES WITH THE SEAM. Past the middle, the B column
   takes the emphasis and A recedes. That is the whole reason the
   rows are matched pairs: every line exists on both sides, so
   there is always something to hand the emphasis to. A
   comparison where one column has entries the other lacks is a
   feature list wearing a comparison's clothes.

   Note there is no `will-change` anywhere near the clipped
   layer. Promoting a clip-path layer makes Chrome intermittently
   fail to rasterise it — the frame draws and the picture inside
   stays black until something unrelated repaints.
   ============================================================ */

const START = 42

export default function Compare({ className = '' }) {
  const stage = useRef(null)
  const drag = useRef({ active: false, lastX: 0, lastT: 0 })
  const seam = useRef(START)
  const bleedTo = useRef(null)

  /* React state carries only what the ledger and ARIA need. The
     seam itself lives in a CSS variable, deliberately outside
     React, because it changes every frame of a drag. */
  const [pct, setPct] = useState(START)

  const applySeam = useCallback((next) => {
    const clamped = Math.min(100, Math.max(0, next))
    seam.current = clamped
    stage.current?.style.setProperty('--seam', `${clamped}%`)
    setPct(clamped)
  }, [])

  useEffect(() => {
    const el = stage.current
    if (!el) return
    el.style.setProperty('--seam', `${START}%`)

    if (prefersReducedMotion()) {
      bleedTo.current = () => {}
      return
    }

    /* The bleed is tweened rather than set, so a fast drag flares
       the join and a slow one barely lights it. */
    const bleed = { v: 0.18 }
    bleedTo.current = (v) =>
      gsap.to(bleed, {
        v,
        duration: 0.42,
        ease: 'power2.out',
        overwrite: true,
        onUpdate: () => el.style.setProperty('--bleed', String(bleed.v)),
      })

    return () => {
      bleedTo.current = null
    }
  }, [])

  const posFromEvent = (e) => {
    const r = stage.current.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * 100
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = { active: true, lastX: e.clientX, lastT: performance.now() }
    applySeam(posFromEvent(e))
  }

  const onPointerMove = (e) => {
    if (!drag.current.active) return
    const now = performance.now()
    const dt = Math.max(1, now - drag.current.lastT)
    const speed = Math.abs(e.clientX - drag.current.lastX) / dt
    drag.current.lastX = e.clientX
    drag.current.lastT = now
    applySeam(posFromEvent(e))
    bleedTo.current?.(Math.min(1, 0.18 + speed * 0.55))
  }

  const endDrag = (e) => {
    if (!drag.current.active) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    drag.current.active = false
    bleedTo.current?.(0.18)
  }

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 4
    const map = { ArrowLeft: -step, ArrowRight: step, ArrowDown: -step, ArrowUp: step }
    if (e.key in map) {
      e.preventDefault()
      applySeam(seam.current + map[e.key])
      bleedTo.current?.(0.45)
      window.setTimeout(() => bleedTo.current?.(0.18), 220)
    } else if (e.key === 'Home') {
      e.preventDefault()
      applySeam(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      applySeam(100)
    }
  }

  /* Which side the visitor is actually looking at. Used only for
     emphasis, so the threshold is the midpoint and nothing
     depends on it being exact. */
  const leaning = pct < 50 ? 'b' : 'a'

  return (
    <section
      id="compare"
      aria-label="Compare two systems"
      className={`relative scroll-mt-24 border-t border-white/10 bg-ink py-20 sm:py-28 ${className}`}
    >
      <div className="shell-wide">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Lines as="h2" className="t-display max-w-3xl text-pure" stagger={0.1}>
            {compare.heading.map((line, i) => (
              <span key={line} className="block">
                {i === compare.heading.length - 1 ? (
                  <>
                    {line.slice(0, line.lastIndexOf(' ') + 1)}
                    <em className="italic-display text-cove">
                      {line.slice(line.lastIndexOf(' ') + 1)}
                    </em>
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
          </Lines>
          <p className="t-body max-w-sm shrink-0 text-mist lg:pb-2">{compare.body}</p>
        </div>
      </div>

      {/* ---- The seam ---- */}
      <div className="shell-wide mt-12 sm:mt-14">
        <div
          ref={stage}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="jaz-compare relative aspect-[16/10] w-full touch-pan-y overflow-hidden bg-ink-3 select-none sm:aspect-[16/9]"
        >
          {/* B sits underneath and fills the frame. */}
          <GradedPlate
            slot={compare.b.slot}
            alt={`${compare.b.name} — ${compare.b.sub}`}
            grade={compare.b.grade}
          />

          {/* A is clipped to the left of the seam. */}
          <div data-before className="absolute inset-0">
            <GradedPlate
              slot={compare.a.slot}
              alt={`${compare.a.name} — ${compare.a.sub}`}
              grade={compare.a.grade}
            />
          </div>

          {/* NO SPEAKER OR SCREEN OVERLAY HERE, deliberately.
              Those marks are percentages of the THEATRE plate, and
              System A is the living room — drawn over it they put
              surrounds in the garden and a screen where the sofa
              is. Two rooms photographed from different positions
              cannot share one coordinate system, and an annotation
              that points at the wrong thing is worse than none.

              The ledger below carries every one of those facts in
              words instead, which is also the format that lets the
              two systems be compared line by line. */}

          <div data-bleed aria-hidden="true" />

          {/* Tags. Each dims when its side is the one being
              covered, so the labels report the state of the seam
              rather than sitting there as decoration. */}
          {/* Along the BOTTOM edge, not the top. The stage is
              taller than a laptop viewport, so its top spends a
              good part of the scroll underneath the fixed nav —
              and the right-hand tag was landing directly on the
              header's own button. The foot of the frame is never
              contested. */}
          <span
            className={`t-label absolute bottom-5 left-5 z-20 text-[0.55rem] transition-colors duration-500 sm:bottom-7 sm:left-7 ${
              leaning === 'a' ? 'text-pure' : 'text-fog/45'
            }`}
          >
            {compare.a.name} · {compare.a.sub}
          </span>
          <span
            className={`t-label absolute right-5 bottom-5 z-20 text-[0.55rem] transition-colors duration-500 sm:right-7 sm:bottom-7 ${
              leaning === 'b' ? 'text-pure' : 'text-fog/45'
            }`}
          >
            {compare.b.name} · {compare.b.sub}
          </span>

          <div
            data-handle
            role="slider"
            tabIndex={0}
            aria-label="Move between System A and System B"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${Math.round(pct)}% toward ${compare.b.name}`}
            onKeyDown={onKeyDown}
            className="focus-ring absolute inset-y-0 z-30 flex w-12 -translate-x-1/2 cursor-ew-resize items-center justify-center"
          >
            <span className="absolute inset-y-0 w-px bg-pure/70" aria-hidden="true" />
            <span
              className="jaz-grip relative flex h-11 w-11 items-center justify-center rounded-full border border-pure/55 bg-ink/35 backdrop-blur-sm"
              aria-hidden="true"
            >
              <svg
                width="18"
                height="10"
                viewBox="0 0 18 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="square"
                className="text-pure/85"
              >
                <path d="M4.5 1.5L1 5l3.5 3.5" />
                <path d="M13.5 1.5L17 5l-3.5 3.5" />
              </svg>
            </span>
          </div>
        </div>

        {/* ---- The ledger ---- */}
        <dl className="mt-10 divide-y divide-white/8 border-t border-white/10">
          {compare.rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] sm:gap-6"
            >
              <dt className="t-label text-[0.52rem] text-ash sm:pt-0.5">{row.label}</dt>
              <dd
                className={`text-[0.88rem] transition-colors duration-500 ${
                  leaning === 'a' ? 'text-pure' : 'text-mist'
                }`}
              >
                {row.a}
              </dd>
              <dd
                className={`text-[0.88rem] transition-colors duration-500 ${
                  leaning === 'b' ? 'text-pure' : 'text-mist'
                }`}
              >
                {row.b}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
