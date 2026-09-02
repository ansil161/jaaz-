import { useEffect, useRef, useState } from 'react'
import { snap as D } from '@/features/public/data/site'
import { sequence, loadSequence } from '@/features/public/utils/frames'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   CHAPTER 02 — THE SNAP

   The page's one FILMED moment. Everything else here argues in
   stills, set type or drawings; this section shows a room change
   in one unbroken shot, scrubbed off the scroll.

   ------------------------------------------------------------
   THIS SECTION FAILED ONCE, AND THE FIX IS IN THE NUMBERS.

   The first build of this idea ran 3.4 viewports of pinned
   scroll with a drawn hand, a countdown to contact and a masked
   wipe, and it put the pay-off — the room actually changing — in
   the last 40% of the pin. Most visitors never got there. It was
   replaced by <Prism>, twice.

   Two numbers are the whole correction, and neither is a style
   choice:

     PIN is 1.9 viewports, not 3.4. A pinned section costs the
     visitor scroll they cannot skim, and this one now costs half
     what it did.

     `snap.peak` is 0.44. The change lands BEFORE the halfway
     point. One flick of the wheel and the visitor has already
     seen the thing the section exists for; everything after it
     is the room settling, which is a reward for continuing
     rather than a toll for arriving.

   ------------------------------------------------------------
   IT WORKS WITH NO FOOTAGE, AND THAT IS THE DESIGN.

   `sequence()` returns no urls for a slot that is missing from
   the manifest or still flagged `placeholder`. Both branches
   below drive the SAME scroll progress:

     WITH FRAMES   the progress indexes a decoded image array and
                   the current frame is painted to a <canvas>.
     WITHOUT       the progress grades the still — the room goes
                   from cold and shut down to warm and lit, with
                   a one-frame blowout at the peak.

   So the scene is complete, reviewable and shippable before a
   frame has been rendered, and the day 120-180 frames land in
   `frames-manifest.json` under this slot the section swaps to
   them with no code change at all. See utils/frames.js.

   WHY FRAMES AND NOT AN MP4. An ordinarily-encoded H.264 seeks
   to its nearest keyframe, and the one frame this section is
   built around — the blowout at contact — is precisely the frame
   a browser would refuse to land on. Numbered stills have no
   keyframes to miss.

   ------------------------------------------------------------
   THE CANVAS IS SIZED IN CSS PIXELS TIMES DPR, ONCE PER RESIZE.
   Painting a 1920-wide frame into a backing store sized by
   `clientWidth` alone is a soft image on every retina display,
   and re-reading the bounding box inside the scrub callback is a
   forced layout on every frame of a pinned scroll. Both are
   measured in `fit()`, which runs on resize and nowhere else.
   ============================================================ */

/* How much scroll the pin costs, in viewports. See the note
   above — this used to be 3.4. */
const PIN = 1.9

/* The blowout at contact, as a fraction of the pin either side of
   `peak`. Deliberately tiny: a flash you can watch is not a snap,
   it is a fade. */
const FLASH = 0.018

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/* The still's grade, as a function of progress. Before the snap
   the room is cold, dark and low-contrast — a room with the
   working lights on. After it, warm and open. The curve is not
   linear: nothing much happens until the approach, then it moves
   almost all at once, because that is what a snap is. */
const gradeAt = (t) => {
  const e = clamp01((t - D.peak + 0.1) / 0.16)
  const k = e * e * (3 - 2 * e) // smoothstep
  return {
    brightness: 0.52 + 0.53 * k,
    saturate: 0.42 + 0.66 * k,
    contrast: 1.16 - 0.13 * k,
    warm: k,
  }
}

export default function Snap() {
  const [reduced] = useState(() => prefersReducedMotion())

  /* Resolved once at module scope would be wrong: the manifest is
     static, but keeping it in state lets the no-frames branch
     render on the server-shaped first paint and the canvas branch
     take over only once the frames have actually decoded. */
  const [frames, setFrames] = useState(null)

  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const plateRef = useRef(null)
  const flashRef = useRef(null)
  const warmRef = useRef(null)
  const beforeRef = useRef(null)
  const afterRef = useRef(null)

  /* Kept off React state — written every frame of the scrub. */
  const framesRef = useRef(null)
  const fitRef = useRef({ w: 0, h: 0, dpr: 1 })

  /* ---------- Decode the sequence, if there is one ----------
     `loadSequence` never rejects and fills holes from the last
     good frame, so a sequence missing three frames in the middle
     still scrubs. A section that goes blank because a deploy
     dropped one image is a section that is offline for a fault it
     could have survived. */
  useEffect(() => {
    if (reduced) return undefined
    const { urls } = sequence(D.sequence)
    if (!urls) return undefined

    const ctl = new AbortController()
    loadSequence(urls, { signal: ctl.signal }).then((decoded) => {
      if (ctl.signal.aborted || !decoded.length) return
      framesRef.current = decoded
      setFrames(decoded.length)
      /* The pin was measured against a still; a canvas of a
         different aspect changes the page's height. */
      ScrollTrigger.refresh()
    })
    return () => ctl.abort()
  }, [reduced])

  const root = useGsapScope(
    (scope) => {
      const stage = stageRef.current
      if (!stage) return

      /* ---------- Painting ---------- */
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d', { alpha: false }) ?? null

      const fit = () => {
        if (!canvas) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (!w || !h) return
        fitRef.current = { w, h, dpr }
        canvas.width = Math.round(w * dpr)
        canvas.height = Math.round(h * dpr)
      }

      /* Cover-fit, computed from the measurements `fit()` cached —
         never from a fresh `getBoundingClientRect` inside the
         scrub, which would force layout on every frame. */
      const paint = (t) => {
        const list = framesRef.current
        if (!ctx || !list) return
        const img = list[Math.min(list.length - 1, Math.round(t * (list.length - 1)))]
        if (!img) return
        const { w, h, dpr } = fitRef.current
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
        const dw = img.naturalWidth * scale
        const dh = img.naturalHeight * scale
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      }

      /* ---------- One progress, two renderers ---------- */
      const render = (t) => {
        if (framesRef.current) {
          paint(t)
        } else if (plateRef.current) {
          const g = gradeAt(t)
          const st = plateRef.current.style
          st.setProperty('--plate-brightness', g.brightness.toFixed(3))
          st.setProperty('--plate-saturate', g.saturate.toFixed(3))
          st.setProperty('--plate-contrast', g.contrast.toFixed(3))
          if (warmRef.current) warmRef.current.style.opacity = (g.warm * 0.5).toFixed(3)
        }

        /* The blowout. It belongs to both branches: a filmed snap
           still wants the screen to throw light into the room the
           page is sitting in. */
        if (flashRef.current) {
          const d = Math.abs(t - D.peak)
          flashRef.current.style.opacity = d > FLASH ? '0' : (1 - d / FLASH).toFixed(3)
        }

        /* The captions cross AT the snap, so the line under the
           frame always describes the room being looked at. */
        const after = t >= D.peak ? 1 : 0
        if (beforeRef.current) beforeRef.current.style.opacity = String(1 - after)
        if (afterRef.current) afterRef.current.style.opacity = String(after)
      }

      fit()
      render(0)

      if (reduced) {
        /* No pin, no scrub. The room is shown already changed —
           the section's claim is that it DOES change, and the
           finished state is the honest still to leave a
           reduced-motion visitor looking at. */
        render(1)
        if (flashRef.current) flashRef.current.style.opacity = '0'
        return
      }

      const trigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: () => `+=${window.innerHeight * PIN}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress),
        onRefresh: () => {
          fit()
          render(trigger?.progress ?? 0)
        },
      })

      /* The heading is released by the pin rather than by its own
         trigger: it belongs to the moment, not to the scroll
         position it happens to occupy. */
      gsap.from(scope.querySelectorAll('[data-snap-line]'), {
        yPercent: 108,
        duration: 1.1,
        stagger: 0.09,
        ease: 'jaz',
        scrollTrigger: { trigger: stage, start: 'top 70%', once: true },
      })
    },
    [reduced, frames],
  )

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.heading.join(' ')}
      className="relative bg-ink"
    >
      <div ref={stageRef} className="relative h-[var(--app-h)] w-full overflow-hidden">
        {/* THE ROOM. Canvas when there are frames, the still when
            there are not — never both, so a decoded sequence does
            not sit on top of a plate it has already replaced. */}
        {frames ? (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        ) : (
          <img
            ref={plateRef}
            src={D.poster}
            alt={D.posterAlt}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="plate absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* The warmth the room gains. A wash rather than a filter,
            because a filter on the plate cannot spill past its
            edges and light does. */}
        <div
          ref={warmRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
          style={{
            background:
              'radial-gradient(72% 58% at 50% 38%, rgba(201,173,124,0.34) 0%, rgba(201,173,124,0.08) 52%, rgba(0,0,0,0) 80%)',
          }}
        />

        {/* Legibility for the type, and nothing more. Weighted to
            the top and the foot, where the words are. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.72) 100%)',
          }}
        />

        {/* THE BLOWOUT. One frame wide by construction — see FLASH. */}
        <div
          ref={flashRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-paper opacity-0"
        />

        {/* ---------- The type ---------- */}
        <div className="shell-wide absolute inset-x-0 top-0 pt-24 sm:pt-28 lg:pt-32">
          <span className="t-label flex items-center gap-3 text-fog">
            {D.chapter}
            <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
            {D.label}
          </span>
          <h2 className="t-cinema mt-6 text-pure">
            {D.heading.map((line) => (
              <span key={line} className="mask-line">
                <span data-snap-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h2>
        </div>

        <div className="shell-wide absolute inset-x-0 bottom-0 pb-14 sm:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <p className="t-sub max-w-[44ch] text-fog">{D.intro}</p>

            {/* One caption slot, two captions, stacked in the same
                box so the crossing is a swap and not a reflow. */}
            <p className="relative min-h-[3.2em] w-[22ch] text-[0.9375rem] leading-relaxed">
              {[
                [D.before, beforeRef],
                [D.after, afterRef],
              ].map(([c, ref], i) => (
                <span
                  key={c.label}
                  ref={ref}
                  className={`absolute inset-x-0 bottom-0 block transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                    i === 0 ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="block text-mist">{c.label}</span>
                  <span className="mt-1 block text-bone">{c.line}</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
