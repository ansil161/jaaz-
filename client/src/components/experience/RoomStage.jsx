import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../../lib/useGsap'
import { grades } from '../../data/experience'
import Plate from './Plate'

/* ============================================================
   ROOM STAGE — the compositor

   Everything the visitor looks at goes through here: the room
   plate, the cross-fade when the render changes, the LIGHTING
   GRADE when a scene changes, and the camera move when the story
   scrolls.

   WHY A FIXED-RATIO FRAME AND NOT A FULL-BLEED COVER

   Hotspots, speaker positions and screen geometry are all
   positioned as percentages of the PLATE. Under `object-fit:
   cover` the plate is cropped by an amount that depends on the
   viewport's aspect ratio, so those percentages would point at a
   different part of the image on every screen — the label reading
   "Screen" would drift onto a side wall on a tall window. A
   `contain`-style frame with a known ratio makes the mapping
   exact at every size, which is the only way an annotation can be
   trusted.

   It is also the better composition. The renders are 1376px wide;
   stretched edge-to-edge on a large display they soften exactly
   where the experience is meant to feel expensive.

   WHY THE CROSS-FADE STACKS WHOLE PLATES

   Layers whose geometry never moves between variants would be
   ideal. Image generation cannot deliver that reliably — ask for
   "the same room in tan leather" and you get a different room. So
   the stage does not assume registration: it stacks COMPLETE
   plates and dissolves between them, with a slight scale on the
   incoming one. Where two renders happen to register well this
   reads as the material changing under fixed light; where they
   drift it reads as a deliberate dissolve. Either way it never
   reads as a glitch.

   WHY THE GRADE IS CSS AND NOT A RENDER

   This is what lets the lighting scenes work today, on the
   renders that already exist, instead of waiting on four more
   generations per room. A grade is a filter on the plate plus a
   wash and a vignette over it — see `grades` in data/experience.
   The filter is TRANSITIONED rather than tweened because it is a
   single compositor property on one element, and handing it to
   GSAP would mean re-parsing a filter string sixty times a
   second for no visible gain.
   ============================================================ */

/* Long enough to feel considered, short enough not to feel slow.
   The incoming plate leads and the outgoing one is held
   underneath for the whole move, so no frame of empty stage is
   ever visible. */
const FADE = 0.9

/* The grade crossfade. Deliberately slower than the plate
   dissolve: light in a real room comes up on a dimmer curve, and
   a scene change that lands instantly reads as a switch being
   flicked rather than as a room being lit. */
const GRADE_MS = 1100

export default function RoomStage({
  slot,
  alt = '',
  ratio = 16 / 9,
  focus = { x: 50, y: 50 },
  scale = 1,
  grade = null,
  priority = false,
  children,
  className = '',
}) {
  /* The stack. Normally one plate; briefly two, mid-dissolve. */
  const [layers, setLayers] = useState(() => [{ key: 0, slot }])
  const frame = useRef(null)
  const counter = useRef(0)
  const current = useRef(slot)

  const g = (grade && grades[grade]) || null

  /* --- Render change: dissolve to the new plate --- */
  useEffect(() => {
    if (slot === current.current) return
    current.current = slot
    counter.current += 1
    const key = counter.current

    setLayers((prev) => [...prev, { key, slot }])

    /* Set up on the NEXT frame, after React has committed the new
       layer to the DOM — querying for it synchronously here would
       find nothing. */
    const id = requestAnimationFrame(() => {
      const el = frame.current?.querySelector(`[data-layer="${key}"]`)
      if (!el) return

      const settle = () => setLayers([{ key, slot }])

      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1, scale: 1 })
        settle()
        return
      }

      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: 1.035 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: FADE,
          ease: 'power2.inOut',
          /* Dropping the spent layers only once the incoming one is
             fully opaque is what keeps the dissolve clean — remove
             them a frame early and the room flashes through to the
             ink field underneath. */
          onComplete: settle,
        },
      )
    })

    return () => cancelAnimationFrame(id)
  }, [slot])

  /* --- Camera move: focus + push, driven by the story scroll --- */
  useEffect(() => {
    const el = frame.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { scale: 1, transformOrigin: '50% 50%' })
      return
    }

    gsap.to(el, {
      scale,
      transformOrigin: `${focus.x}% ${focus.y}%`,
      duration: 1.25,
      ease: 'power3.inOut',
      overwrite: 'auto',
    })
  }, [focus.x, focus.y, scale])

  return (
    <div
      className={`relative overflow-hidden bg-ink ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {/* The transformed frame. Overlays live INSIDE it so a point
          stays welded to the thing it annotates through a camera
          move, rather than sliding across a moving image. */}
      <div ref={frame} className="absolute inset-0 will-change-transform">
        {/* The graded stack. The filter sits on a wrapper rather
            than on each plate so a dissolve mid-scene does not
            re-apply the grade twice and darken the overlap. */}
        <div
          className="absolute inset-0"
          style={{
            filter: g?.filter ?? undefined,
            transition: `filter ${GRADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          {layers.map((layer, i) => (
            <div
              key={layer.key}
              data-layer={layer.key}
              className="absolute inset-0"
              /* Only the incoming layer starts hidden; the resident
                 one must paint immediately on first mount or the
                 stage opens on an empty frame. */
              style={i > 0 ? { opacity: 0, visibility: 'hidden' } : undefined}
            >
              <Plate
                slot={layer.slot}
                alt={i === layers.length - 1 ? alt : ''}
                priority={priority && i === 0}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* The wash. A colour laid over the graded plate — the warm
            2700K of the house's own cove lighting, or the cool of
            daylight through the east glazing. Separate from the
            filter because a filter cannot ADD a hue, only bend the
            one already there. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: g?.wash ?? 'transparent',
            opacity: g?.washAlpha ?? 0,
            transition: `opacity ${GRADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1), background-color ${GRADE_MS}ms linear`,
          }}
          aria-hidden="true"
        />

        {children}
      </div>

      {/* The vignette, so the plate sits INTO the ink field rather
          than ending at a hard rectangle, and so a dark scene
          closes down at the edges the way a dimmed room does.
          Non-interactive by definition — it covers every hotspot. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 50% 45%, transparent 42%, rgba(0,0,0,${
            0.28 * (g?.vignette ?? 1)
          }) 74%, rgba(0,0,0,${0.62 * (g?.vignette ?? 1)}) 100%)`,
          transition: `background ${GRADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
