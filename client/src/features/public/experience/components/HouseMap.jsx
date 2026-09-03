import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '@/lib/animation/useGsap'
import { plan, roomPlate, rooms } from '@/features/public/data/experience'
import Plate from '@/features/public/components/Plate'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   THE HOUSE — an architectural drawing you can walk into

   The brief's instruction was to avoid "a boring technical floor
   plan" and to avoid a grid of cards. Those two failures have the
   same cause: a plan drawn as a diagram. So this is drawn as a
   DRAWING —

     walls are line segments broken at every door, so the house
       reads as circulable rather than as nine sealed boxes;
     the east elevation is drawn in its own weight, because a
       glass wall rendered like a masonry wall loses the whole
       reason the terrace and the living area are one space;
     the pool is drawn, because it is what makes the right-hand
       strip legible as outdoors instead of as a corridor;
     rooms are named in the plan, at the scale a plan names them.

   THE AUTHORED MOMENT. The walls DRAW THEMSELVES on arrival —
   outer envelope first, then partitions, then glazing, then the
   pool — which is the order an architect would actually draw
   them in. It is the one place in the journey where the motion is
   the content rather than a delivery mechanism for it, and it is
   why this section can carry the weight of being the navigation.

   Everything scales from the drawing's own 1200x700 grid, so a
   wall, a door opening and a label anchor are all set in the same
   coordinate space and stay welded together at every viewport.
   ============================================================ */

/* The pool sits under the terrace's centroid, so the terrace
   label would land on the water. Nudged to the head of the strip
   instead — a drawing-specific fix, which is why it lives with
   the drawing rather than in the data. */
const LABEL_NUDGE = { outdoor: { y: -240 } }

function centroid(room) {
  const nudge = LABEL_NUDGE[room.id] ?? {}
  return {
    x: room.plan.x + room.plan.w / 2 + (nudge.x ?? 0),
    y: room.plan.y + room.plan.h / 2 + (nudge.y ?? 0),
  }
}

export default function HouseMap({ activeId, onSelect, className = '' }) {
  const root = useRef(null)
  /* Hover previews the room; it does not select it. Selection is
     a navigation and belongs to a click, but the visitor should
     be able to read the house by moving across it. */
  const [hovered, setHovered] = useState(null)
  const shown = rooms.find((r) => r.id === (hovered ?? activeId)) ?? rooms[0]
  /* Through the resolver, so the key shows the same plate the
     room's own chapter will — a preview that differs from what
     the visitor lands on is worse than no preview. */
  const preview = roomPlate(shown)

  useEffect(() => {
    const el = root.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el.querySelectorAll('[data-draw]'), { drawSVG: '100%' })
      gsap.set(el.querySelectorAll('[data-fade]'), { autoAlpha: 1 })
      return
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })

      /* Order matters: envelope, partitions, glazing, then the
         labels. Drawing the labels before the walls that contain
         them would read as text arriving on an empty page. */
      tl.fromTo(
        el.querySelectorAll('[data-draw="outer"]'),
        { drawSVG: '0%' },
        { drawSVG: '100%', duration: 1.5, stagger: 0.12, ease: 'power2.inOut' },
      )
        .fromTo(
          el.querySelectorAll('[data-draw="inner"]'),
          { drawSVG: '0%' },
          { drawSVG: '100%', duration: 0.9, stagger: 0.05, ease: 'power2.out' },
          '-=0.6',
        )
        .fromTo(
          el.querySelectorAll('[data-draw="glazing"]'),
          { drawSVG: '0%' },
          { drawSVG: '100%', duration: 1.1, stagger: 0.1, ease: 'power2.out' },
          '-=0.5',
        )
        .fromTo(
          el.querySelectorAll('[data-fade="pool"]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.9, ease: 'power2.out' },
          '-=0.7',
        )
        .fromTo(
          el.querySelectorAll('[data-fade="label"]'),
          { autoAlpha: 0, y: 6 },
          { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.045, ease: 'power3.out' },
          '-=0.6',
        )
    }, el)

    /* The drawing is tall and the labels are sized in user units,
       so a resize changes what the trigger measured. */
    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      ctx.revert()
    }
  }, [])

  return (
    <div className={`flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 ${className}`}>
      {/* ---- The drawing ---- */}
      <div ref={root} className="min-w-0 flex-1">
        <svg
          viewBox={plan.viewBox}
          className="w-full"
          role="group"
          aria-label="Plan of the house. Select a room to enter it."
        >
          {/* Hit areas and their wash, under the linework so a
              highlighted room never covers the walls that define
              it. Each is a real button for keyboard and screen
              reader; the <rect> is only its shape. */}
          {rooms.map((room) => {
            const on = room.id === (hovered ?? activeId)
            return (
              <g key={room.id}>
                <rect
                  x={room.plan.x}
                  y={room.plan.y}
                  width={room.plan.w}
                  height={room.plan.h}
                  className="cursor-pointer transition-[fill] duration-500"
                  fill={on ? 'rgba(201,173,124,0.10)' : 'rgba(255,255,255,0)'}
                  onMouseEnter={() => setHovered(room.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(room.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${room.label} — enter this room`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(room.id)
                    }
                  }}
                  onFocus={() => setHovered(room.id)}
                  onBlur={() => setHovered(null)}
                />
              </g>
            )
          })}

          {/* Terrace water. Drawn as a filled figure with its own
              hairline so it reads as a pool rather than as another
              room. */}
          <rect
            data-fade="pool"
            x={plan.pool.x}
            y={plan.pool.y}
            width={plan.pool.w}
            height={plan.pool.h}
            fill="rgba(201,173,124,0.07)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
            style={{ opacity: 0 }}
          />

          {/* Named, because an unlabelled rectangle inside the
              terrace reads as one more room. One word is cheaper
              than any amount of drawn water. */}
          <text
            data-fade="pool"
            x={plan.pool.x + plan.pool.w / 2}
            y={plan.pool.y + plan.pool.h / 2}
            textAnchor="middle"
            className="pointer-events-none font-mono"
            fill="rgba(255,255,255,0.34)"
            fontSize="14"
            letterSpacing="3"
            style={{ opacity: 0 }}
          >
            POOL
          </text>

          {/* Partitions — the lightest weight on the sheet. */}
          {plan.inner.map(([x1, y1, x2, y2], i) => (
            <line
              key={`i${i}`}
              data-draw="inner"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />
          ))}

          {/* The east elevation, drawn as two hairlines a pane
              apart — the notation for glazing, and the reason this
              wall reads as something you can see through. */}
          {plan.glazing.map(([x1, y1, x2, y2], i) => (
            <g key={`g${i}`}>
              <line
                data-draw="glazing"
                x1={x1 - 3}
                y1={y1}
                x2={x2 - 3}
                y2={y2}
                stroke="rgba(201,173,124,0.55)"
                strokeWidth="1.5"
              />
              <line
                data-draw="glazing"
                x1={x1 + 3}
                y1={y1}
                x2={x2 + 3}
                y2={y2}
                stroke="rgba(201,173,124,0.55)"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* Structural envelope — the heaviest weight. */}
          {plan.outer.map(([x1, y1, x2, y2], i) => (
            <line
              key={`o${i}`}
              data-draw="outer"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.62)"
              strokeWidth="4"
            />
          ))}

          {/* Room names, set in the plan the way a plan sets
              them. Non-interactive: the hit area underneath is the
              control, and a label that swallowed the click would
              leave the rest of the room dead. */}
          {rooms.map((room) => {
            const c = centroid(room)
            const on = room.id === (hovered ?? activeId)
            return (
              <g
                key={room.id}
                data-fade="label"
                className="pointer-events-none"
                style={{ opacity: 0 }}
              >
                {/* The room's mark, where the plan number was. An
                    architect's drawing carries a key because a plan
                    is read at a glance and a numeral has to be looked
                    up; a speaker, a chair, a controller does not.

                    A nested <svg> is valid inside an <svg>, so the
                    mark is dropped in under a translate and takes its
                    stroke from `color` on the group. */}
                <g
                  transform={`translate(${c.x - 13}, ${c.y - 40})`}
                  style={{ color: on ? '#c9ad7c' : 'rgba(255,255,255,0.5)' }}
                  className="transition-[color] duration-500"
                >
                  <Mark name={room.icon} size={26} strokeWidth={1} />
                </g>
                <text
                  x={c.x}
                  y={c.y + 18}
                  textAnchor="middle"
                  className="font-sans transition-[fill] duration-500"
                  fill={on ? '#ffffff' : 'rgba(255,255,255,0.68)'}
                  fontSize="17"
                  letterSpacing="1.5"
                >
                  {(room.planLabel ?? room.label).toUpperCase()}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* ---- The key: what you are pointing at ---- */}
      <aside className="w-full shrink-0 lg:w-72">
        <div className="relative overflow-hidden bg-ink-3" style={{ aspectRatio: 16 / 9 }}>
          {/* Keyed on the room so the plate remounts and the
              cross-fade is a real change of picture rather than a
              src swap under a static frame. */}
          <Plate
            key={shown.id}
            slot={preview.slot}
            alt={preview.alt}
            sizes="(min-width: 1024px) 18rem, 100vw"
            className="h-full w-full animate-[fade-plate_700ms_cubic-bezier(0.16,1,0.3,1)_both] object-cover"
          />
        </div>

        <p className="t-label mt-5 flex items-center text-[0.55rem] text-ash">
          <Mark name={shown.icon} size={16} className="text-cove" />
          <span className="mx-3 inline-block h-px w-6 bg-white/20" />
          {shown.label}
        </p>

        <p className="t-body mt-3 text-[0.9rem] text-mist">{shown.body}</p>

        <button
          type="button"
          onClick={() => onSelect(shown.id)}
          className="btn-flat focus-ring mt-6"
        >
          Enter this room
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
            aria-hidden="true"
            className="btn-flat-arrow shrink-0"
          >
            <path d="M2.5 8h10.5" />
            <path d="M9 4l4 4-4 4" />
          </svg>
        </button>
      </aside>
    </div>
  )
}
