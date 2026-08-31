import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/animation/useGsap'
import {
  audioSets,
  beats,
  gamingDesigns,
  hotspots,
  outdoorDesigns,
  rail,
  railFor,
  theatreDesigns,
} from '@/features/public/data/house'
import { createStage } from '@/features/public/house/three/houseStage'
import Hud from './Hud'
import Annotation, { SpotPanel } from './Annotation'

/* ============================================================
   THE HOUSE — one continuous walk

   One canvas, pinned for the length of the journey, with scroll
   wired straight to the camera. There are no sections: the page
   height exists only to give the camera somewhere to travel.

   WHAT LIVES WHERE. React owns what changes RARELY — which beat
   you are on, and therefore two lines of text and a counter.
   That is sixty-odd updates across the whole house. The render
   loop owns what changes EVERY FRAME — the camera and the pixel
   position of each annotation — and none of that goes through
   React.

   THE SCROLL IS NOT HIJACKED. The page scrolls normally; it is
   simply tall, and the canvas is `position: sticky` inside it. The
   scrollbar stays honest, keyboard scrolling and find-on-page
   still work, and no wheel handler fights the visitor for control
   of their own input device.

   THE CANVAS IS CREATED HERE rather than rendered by React. A
   <canvas> only ever hands out ONE WebGL context, and React
   mounts this effect twice in development — with a React-owned
   canvas the second renderer inherits the context the first just
   disposed, and the picture freezes on a dead frame while a live
   camera moves invisibly behind it.
   ============================================================ */

/* Roughly four tenths of a viewport per beat across sixty-two
   beats. Long enough that a room is arrived at rather than
   flicked past; short enough that the house does not outstay
   itself. */
const SCROLL_VH = 2600

/** How many schemes the current zone offers, so the counter can
 *  report "02 / 04" without the HUD knowing about zones. */
function schemesFor(beat) {
  if (beat.design === undefined) return { count: 0, index: 0 }
  const table =
    beat.zone === 'theatre'
      ? theatreDesigns
      : beat.zone === 'gaming'
        ? gamingDesigns
        : beat.zone === 'terrace'
          ? outdoorDesigns
          : beat.zone === 'audio'
            ? audioSets
            : null
  if (!table) return { count: 0, index: 0 }
  /* Only counts while the chapter is actually presenting the set.
     During the walk in, the room is showing scheme 01 because it
     has to show something — not because a sequence is running. */
  const presenting = /\d\s*\/\s*\d/.test(beat.chapter)
  return presenting ? { count: table.length, index: beat.design } : { count: 0, index: 0 }
}

export default function HouseExperience() {
  const wrap = useRef(null)
  const holder = useRef(null)
  const stage = useRef(null)
  const spotRefs = useRef({})

  const [beatIndex, setBeatIndex] = useState(0)
  const [reduced] = useState(() => prefersReducedMotion())
  const [openSpot, setOpenSpot] = useState(null)
  const [dismissed, setDismissed] = useState(null)

  const beat = beats[beatIndex] ?? beats[0]
  const { count, index } = schemesFor(beat)

  /* Which annotation the walk is standing in front of. Derived
     from the beat, because the beat is the only thing that
     changes it. */
  const inWindow = hotspots.find((h) => beat.p >= h.show[0] && beat.p <= h.show[1]) ?? null
  const windowId = inWindow?.id ?? null
  const [prevWindowId, setPrevWindowId] = useState(null)
  if (prevWindowId !== windowId) {
    /* Adjusted during render rather than in an effect: an effect
       would paint one frame with the previous panel still docked
       over the new room. */
    setPrevWindowId(windowId)
    setDismissed(null)
    setOpenSpot(windowId)
  }
  const shownSpot = openSpot && openSpot !== dismissed ? hotspots.find((h) => h.id === openSpot) : null

  useEffect(() => {
    const mount = holder.current
    if (!mount) return

    const el = document.createElement('canvas')
    el.className = 'block h-full w-full'
    mount.appendChild(el)

    let raf = 0
    let alive = true
    const s = createStage(el, { onBeat: (i) => setBeatIndex(i) })
    stage.current = s
    if (import.meta.env.DEV) window.__stage = s

    const size = () => {
      const w = mount.clientWidth || window.innerWidth
      const h = mount.clientHeight || window.innerHeight
      s.resize(w, h)
      return { w, h }
    }
    /* Scroll geometry is cached, not measured per frame: reading
       `getBoundingClientRect` inside the render loop forces a
       layout every frame and is itself a source of judder. */
    const metrics = () => {
      const top = wrap.current ? wrap.current.getBoundingClientRect().top + window.scrollY : 0
      const range = wrap.current ? wrap.current.offsetHeight - window.innerHeight : 1
      return { top, range: Math.max(1, range) }
    }
    let dims = size()
    let geo = metrics()
    const ro = new ResizeObserver(() => {
      dims = size()
      geo = metrics()
    })
    ro.observe(mount)
    const onResize = () => {
      geo = metrics()
    }
    window.addEventListener('resize', onResize)

    s.setProgress(0, { snap: true })

    /* One loop for the house AND its annotations, because they
       have to agree: a label read from last frame's camera sits
       visibly behind the object it names during a fast move. */
    const tick = () => {
      if (!alive) return

      /* THE SCROLL IS READ HERE, not pushed in from a ScrollTrigger
         callback. Two independent rAF loops — GSAP's ticker driving
         Lenis, and this one driving the render — fire in an order
         nobody controls, so the camera was being drawn from
         whatever scroll value happened to have landed most
         recently. Sometimes that was this frame's, sometimes last
         frame's, and the inconsistency is exactly what reads as
         stutter even at a high frame rate.

         Reading `scrollY` at the top of the render frame removes
         the ordering question entirely: the camera is always drawn
         from the scroll position that is true right now. Lenis has
         already smoothed that value, which is why the damping
         below no longer needs to do much. */
      if (!reduced) {
        const p = (window.scrollY - geo.top) / geo.range
        s.setProgress(Math.max(0, Math.min(1, p)))
      }

      s.frame()
      const p = s.progress
      for (const spot of hotspots) {
        const node = spotRefs.current[spot.id]
        if (!node) continue
        if (p < spot.show[0] || p > spot.show[1]) {
          node.style.opacity = '0'
          node.style.pointerEvents = 'none'
          continue
        }
        const pt = s.project(spot.at, spot.zone, dims.w, dims.h)
        if (!pt.visible) {
          node.style.opacity = '0'
          continue
        }
        node.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0)`
        node.style.opacity = '1'
        node.style.pointerEvents = 'auto'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      s.dispose()
      el.remove()
      stage.current = null
      if (import.meta.env.DEV && window.__stage === s) delete window.__stage
    }
  }, [reduced])

  /** Jump to a point in the walk. Scrolls the page rather than
   *  moving the camera directly, so the scrollbar never disagrees
   *  with what is on screen. */
  const jumpTo = (p) => {
    if (reduced) {
      stage.current?.setProgress(p, { snap: true })
      return
    }
    const el = wrap.current
    if (!el) return
    const y = el.offsetTop + (el.offsetHeight - window.innerHeight) * p
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.6 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  return (
    <section
      ref={wrap}
      aria-label="Walk through the house"
      className="relative bg-black"
      style={reduced ? undefined : { height: `${SCROLL_VH}vh` }}
    >
      <div
        className={
          reduced ? 'relative h-[78svh] w-full overflow-hidden' : 'sticky top-0 h-svh w-full overflow-hidden'
        }
      >
        <div ref={holder} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-0">
          {hotspots.map((spot) => (
            <Annotation
              key={spot.id}
              spot={spot}
              open={shownSpot?.id === spot.id}
              onOpen={(id) => {
                setOpenSpot(id)
                setDismissed(id ? null : spot.id)
              }}
              nodeRef={(n) => {
                spotRefs.current[spot.id] = n
              }}
            />
          ))}

          {shownSpot && (
            <SpotPanel key={shownSpot.id} spot={shownSpot} onClose={() => setDismissed(shownSpot.id)} />
          )}

          <Hud
            beat={beat}
            rail={rail}
            activeRail={railFor(beat.chapter)}
            count={count}
            index={index}
            onJump={jumpTo}
            progress={beat.p}
            reduced={reduced}
          />
        </div>
      </div>

      {reduced && (
        <div className="shell-wide py-10">
          <p className="t-label mb-4 text-[0.55rem] text-ash">
            Motion is reduced — step through the house
          </p>
          <ol className="flex flex-wrap gap-x-5 gap-y-2">
            {beats.map((b, i) => (
              <li key={`${b.chapter}-${b.title}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    stage.current?.setProgress(b.p, { snap: true })
                    setBeatIndex(i)
                  }}
                  aria-current={i === beatIndex ? 'true' : undefined}
                  className={`focus-ring relative pb-1 text-[0.82rem] transition-colors duration-300 ${
                    i === beatIndex ? 'text-pure' : 'text-mist hover:text-fog'
                  }`}
                >
                  {b.title}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-300 ${
                      i === beatIndex ? 'scale-x-100' : 'scale-x-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
