import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   THE MOTES

   What the snap throws off. NOT a particle burst — the brief is
   explicit that this must be warm white and champagne rather
   than comic-book purple, and the difference between the two is
   almost entirely restraint rather than colour. A burst says
   "magic". What this section needs is the room's own dust
   catching the light for a moment, which is a physical event
   happening in an expensive room.

   So: no glow sprites, no additive blow-out, no trails. A few
   hundred sub-pixel motes at a maximum alpha of about a half,
   lifted from the contact point on a slow outward drift and
   allowed to fall. If you can point at it and call it a particle
   effect, it is turned up too far.

   ------------------------------------------------------------
   WHY THIS IS A CANVAS AND NOT DOM

   Two hundred absolutely-positioned divs is two hundred layers
   for the compositor and a style recalculation every frame; the
   same motes on one canvas are one element and one draw call's
   worth of work. On a page that is already pinning a section and
   scrubbing a mask, that is the difference between the snap
   landing on the frame it was aimed at and landing late.

   ------------------------------------------------------------
   WHY PROGRESS ARRIVES BY REF AND NOT BY PROP

   The scene's timeline updates on every scroll frame. Handing
   that down as a prop would re-render this component sixty times
   a second to change a number that React has no opinion about.
   The parent writes into `progress.current` instead and this
   loop reads it — the component renders exactly once.

   ------------------------------------------------------------
   THE LOOP IS NOT ALWAYS RUNNING

   It starts when the scene is on screen and the snap has
   actually happened, and it stops the moment either stops being
   true. A canvas quietly painting nothing at 60fps for the whole
   length of a long homepage is the kind of cost that never shows
   up in a profile as one bad frame — it shows up as a warm
   laptop and a fan, which is worse, because nobody files it as a
   bug.

   Reduced motion never starts it at all and renders nothing.
   ============================================================ */

/* Desktop, then phone. The mobile count is not a fraction of the
   desktop one for its own sake — the brief asks for simplified
   particles on mobile, and a phone showing a third of the motes
   at the same size reads as the same effect rather than as a
   thinner one. */
const COUNT = { wide: 190, narrow: 58 }

/** Champagne through warm white. Nothing on the blue side of neutral. */
const TINTS = [
  [255, 244, 226],
  [235, 214, 174],
  [201, 173, 124],
  [255, 250, 240],
]

export default function SnapMotes({ progress, origin, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || prefersReducedMotion()) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const narrow = window.matchMedia('(max-width: 767px)').matches
    const count = narrow ? COUNT.narrow : COUNT.wide

    let width = 0
    let height = 0
    /* Capped at 2. A 3x phone painting two hundred sub-pixel dots
       across nine times the area is spending its entire frame
       budget on motes nobody can resolve. */
    let dpr = 1

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return true
    }

    /* Each mote is fixed at birth and never reallocated — the
       array is built once and the loop only advances numbers, so
       there is no per-frame garbage for the collector to find at
       exactly the moment the scene needs a clean frame. */
    const motes = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      /* Biased toward the horizontal: light thrown off a gesture
         spreads across the room, it does not fountain. */
      const speed = 0.28 + Math.random() * 1.5
      return {
        a: angle,
        vx: Math.cos(angle) * speed * 1.5,
        vy: Math.sin(angle) * speed * 0.72,
        /* How far along the burst this one is released. Staggered
           birth is most of what stops a burst reading as a ring. */
        delay: Math.random() * 0.22,
        life: 0.55 + Math.random() * 0.45,
        r: 0.35 + Math.random() * 1.35,
        drift: (Math.random() - 0.5) * 0.5,
        fall: 0.12 + Math.random() * 0.5,
        tint: TINTS[(Math.random() * TINTS.length) | 0],
        twinkle: Math.random() * Math.PI * 2,
      }
    })

    let raf = 0
    let running = false
    let onScreen = false

    const draw = () => {
      raf = 0
      const p = progress.current ?? 0

      if (!width && !measure()) {
        raf = requestAnimationFrame(draw)
        return
      }

      ctx.clearRect(0, 0, width, height)

      /* `origin` is written by the scene from the hand's measured
         contact point, in fractions of this canvas. Falling back
         to the middle rather than to 0,0 means a missed
         measurement is invisible instead of a burst in the
         corner. */
      const ox = (origin.current?.x ?? 0.5) * width
      const oy = (origin.current?.y ?? 0.5) * height
      /* The scale of the throw follows the frame, so the burst
         covers the same proportion of a phone as of a desktop. */
      const reach = Math.max(width, height) * 0.5

      for (let i = 0; i < motes.length; i += 1) {
        const m = motes[i]
        /* `t` is this mote's own progress through its own life,
           driven entirely by the scroll. There is no clock in
           here: scroll back and the motes travel back, which is
           the whole reason the effect can live under a scrub. */
        const t = (p - m.delay) / m.life
        if (t <= 0 || t >= 1) continue

        /* Out fast, then coasting — an ease-out on distance is
           what makes it read as thrown rather than as expanding. */
        const eased = 1 - Math.pow(1 - t, 2.4)
        const x = ox + m.vx * reach * eased + m.drift * reach * eased * eased
        const y = oy + m.vy * reach * eased + m.fall * reach * eased * eased

        /* Alpha: a hard arrival, a long decay, and a slow twinkle
           on top so the field is never a flat sheet of dots. */
        const fade = t < 0.08 ? t / 0.08 : Math.pow(1 - (t - 0.08) / 0.92, 1.6)
        const shimmer = 0.72 + 0.28 * Math.sin(m.twinkle + t * 9)
        const alpha = fade * shimmer * 0.55
        if (alpha <= 0.004) continue

        const [r, g, b] = m.tint
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.arc(x, y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (running) raf = requestAnimationFrame(draw)
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(draw)
    }

    const stop = () => {
      running = false
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      if (width) ctx.clearRect(0, 0, width, height)
    }

    /* The scene tells us when it is worth painting by writing
       `progress`; the observer tells us when it is worth looking.
       Both have to be true. */
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) {
          measure()
          start()
        } else stop()
      },
      { threshold: 0 },
    )
    io.observe(canvas)

    const onResize = () => {
      if (onScreen) measure()
      else width = 0
    }
    window.addEventListener('resize', onResize)

    return () => {
      io.disconnect()
      window.removeEventListener('resize', onResize)
      stop()
    }
  }, [progress, origin])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  )
}
