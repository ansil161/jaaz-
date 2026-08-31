import { useCallback, useRef, useState } from 'react'
import { transform } from '@/features/public/data/site'
import { Lines, Rule } from '@/features/public/components/Motion'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   03b — BEFORE / AFTER

   The one section on this page that argues by letting you do
   it. Everything else describes the transformation; here you
   drag it yourself, and the claim proves itself in your hand.

   HOW IT MOVES
   The seam lives in a single CSS custom property, `--seam`, set
   imperatively. React never re-renders while you drag — the
   clip-path, the handle and the light bleed all read from that
   one variable, so a drag is one style write per frame instead
   of a render per frame.

   THE BLEED
   A narrow vertical glow sits on the seam and swells with drag
   VELOCITY, then eases back to a low ambient level. Moving the
   seam fast throws light across the join; letting go lets it
   settle. It is reacting to your hand, not to audio — there is
   no soundtrack on this page and autoplaying one to drive a
   visual effect would be a bad trade.

   ACCESS
   The handle is a real slider: role, min/max/now, arrow keys,
   Home/End. Keyboard and screen-reader users get the same
   control, and both captions are in the DOM either way.
   ============================================================ */

const START = 38 // opening seam position, %
const clamp = (v) => Math.max(0, Math.min(100, v))

export default function Transform() {
  const [pct, setPct] = useState(START) // mirrors --seam for a11y only
  const stageRef = useRef(null)
  const seam = useRef(START)
  const drag = useRef({ active: false, lastX: 0, lastT: 0 })
  const bleedTo = useRef(null)

  /* Single source of truth for the seam. Writes the variable, and only
     syncs React when the rounded value actually changes (for aria). */
  const applySeam = useCallback((next) => {
    const v = clamp(next)
    seam.current = v
    const el = stageRef.current
    if (el) el.style.setProperty('--seam', `${v}%`)
    setPct((prev) => (Math.round(prev) === Math.round(v) ? prev : v))
  }, [])

  const root = useGsapScope((el) => {
    const stage = el.querySelector('[data-stage]')
    stage.style.setProperty('--seam', `${START}%`)
    stage.style.setProperty('--bleed', '0.18')

    if (prefersReducedMotion()) return

    /* Velocity → glow, easing back to ambient. quickTo keeps this to a
       single reusable tween rather than one per pointermove. */
    const bleedState = { v: 0.18 }
    const setBleed = gsap.quickTo(bleedState, 'v', {
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => stage.style.setProperty('--bleed', String(bleedState.v)),
    })
    bleedTo.current = setBleed

    /* The seam sweeps open once as the section arrives, then hands
       control over. It shows the affordance without a tooltip. */
    const intro = { v: 0 }
    gsap.to(intro, {
      v: 1,
      duration: 1.4,
      ease: 'jaz-io',
      scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      onUpdate: () => {
        if (drag.current.active) return
        applySeam(6 + (START - 6) * intro.v)
      },
    })

    return () => setBleed(0.18)
  }, [])

  /* ---- Pointer ---- */
  const posFromEvent = (e) => {
    const r = stageRef.current.getBoundingClientRect()
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
    const speed = Math.abs(e.clientX - drag.current.lastX) / dt // px/ms
    drag.current.lastX = e.clientX
    drag.current.lastT = now
    applySeam(posFromEvent(e))
    // ~2 px/ms is a brisk drag; map that to a strong bleed.
    bleedTo.current?.(Math.min(1, 0.18 + speed * 0.55))
  }

  const endDrag = (e) => {
    if (!drag.current.active) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    drag.current.active = false
    bleedTo.current?.(0.18)
  }

  /* ---- Keyboard ---- */
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 4
    const map = {
      ArrowLeft: -step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowUp: step,
    }
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

  return (
    <section
      ref={root}
      id="transform"
      className="relative border-t border-white/10 bg-ink py-24 sm:py-32"
    >
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{transform.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-display col-span-12 text-bone lg:col-span-6">
            {transform.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display text-pure">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines
            as="p"
            className="t-body col-span-12 max-w-md text-mist lg:col-span-4 lg:col-start-9"
          >
            {transform.body}
          </Lines>
        </div>
      </div>

      {/* ---- The frame ---- */}
      <div className="shell-wide mt-14 sm:mt-16">
        <div
          ref={stageRef}
          data-stage
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="jaz-compare relative aspect-[16/10] w-full touch-pan-y overflow-hidden bg-ink-3 select-none sm:aspect-[16/9]"
        >
          {/* AFTER sits underneath and fills the frame. */}
          <img
            src={transform.after.src}
            alt={transform.after.alt}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="plate absolute inset-0 [--plate-brightness:1.05] [--plate-contrast:1.06] [--plate-saturate:0.9]"
          />

          {/* BEFORE is clipped to the left of the seam. Deliberately
              graded flat and cold — a handover shell has no warmth. */}
          <div data-before className="absolute inset-0">
            <img
              src={transform.before.src}
              alt={transform.before.alt}
              loading="lazy"
              decoding="async"
              draggable="false"
              className="plate absolute inset-0 [--plate-brightness:1.02] [--plate-contrast:0.92] [--plate-saturate:0.35]"
            />
            <div className="absolute inset-0 bg-[#0b0f14]/25" aria-hidden="true" />
          </div>

          {/* The light bleeding across the join. */}
          <div data-bleed aria-hidden="true" />

          {/* Tags */}
          <span className="t-label absolute top-5 left-5 z-20 text-fog/80 sm:top-7 sm:left-7">
            {transform.before.tag}
          </span>
          <span className="t-label absolute top-5 right-5 z-20 text-fog/80 sm:top-7 sm:right-7">
            {transform.after.tag}
          </span>

          {/* Handle — a real slider. */}
          <div
            data-handle
            role="slider"
            tabIndex={0}
            aria-label="Reveal the finished room"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${Math.round(pct)}% revealed`}
            onKeyDown={onKeyDown}
            className="focus-ring absolute inset-y-0 z-30 flex w-12 -translate-x-1/2 cursor-ew-resize items-center justify-center"
          >
            <span className="absolute inset-y-0 w-px bg-pure/70" aria-hidden="true" />
            <span className="jaz-grip relative flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-ink/45 backdrop-blur-sm">
              <span className="t-num text-[0.6rem] tracking-normal text-pure" aria-hidden="true">
                &#8596;
              </span>
            </span>
          </div>

          {/* Captions, bottom corners. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 bg-gradient-to-t from-ink/85 to-transparent p-5 sm:p-7">
            <span className="t-label text-fog/75">{transform.before.caption}</span>
            <span className="t-label hidden text-fog/75 sm:block">{transform.hint}</span>
            <span className="t-label text-fog/75">{transform.after.caption}</span>
          </div>
        </div>

        {transform.note && <p className="t-label mt-4 text-ash">{transform.note}</p>}
      </div>
    </section>
  )
}
