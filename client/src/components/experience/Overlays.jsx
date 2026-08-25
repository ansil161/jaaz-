import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../../lib/useGsap'
import { speakerPoints } from '../../data/experience'

/* ============================================================
   OVERLAYS — the drawing laid over the photograph

   These are the two things that make a configurator choice
   VISIBLE without a second render: the screen you are choosing,
   drawn at its real proportion on the wall, and the speakers you
   are choosing, drawn where they would actually be mounted.

   They are deliberately drawn as SETTING-OUT MARKS rather than as
   simulated objects. A fake screen composited onto a photograph
   is a lie the eye catches in about a second — the perspective
   never matches and the black rectangle floats. A hairline
   rectangle with corner ticks does not pretend to be a screen; it
   is the architect's overlay ON the photograph, which is both
   honest and the language the rest of this site already speaks.

   Everything is positioned in percentages of the PLATE, inside
   the stage's transformed frame, so it stays welded to the room
   through a camera move.
   ============================================================ */

/* Where the screen wall sits in each room's plate. Read off the
   renders, not guessed — the theatre screen is dead centre and
   slightly low, the gaming display sits above a desk, the terrace
   display is off to one side of the pool. */
const SCREEN_ANCHORS = {
  theatre: { x: 50.5, y: 44 },
  gaming: { x: 50, y: 40 },
  outdoor: { x: 62, y: 38 },
  living: { x: 50, y: 44 },
}

/**
 * <ScreenOverlay> — the chosen display, drawn at its proportion.
 *
 * `screen` is `{ w, aspect }` from the configurator: width as a
 * percentage of the plate, and the shape. Together they are why
 * choosing "Cinema projection" visibly widens the rectangle on
 * the wall instead of only changing a word in a panel.
 */
export function ScreenOverlay({ screen, anchor = 'theatre', label }) {
  const root = useRef(null)

  /* The rectangle RESIZES between choices rather than fading out
     and in. The whole point of the control is that you watch the
     screen grow, and a cross-fade would hide the one moment the
     interaction exists to show. */
  useEffect(() => {
    const el = root.current
    if (!el || !screen) return
    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.to(el, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
      gsap.from(el.querySelectorAll('[data-tick]'), {
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power2.out',
      })
    }, el)
    return () => ctx.revert()
  }, [screen])

  if (!screen) return null
  const at = SCREEN_ANCHORS[anchor] ?? SCREEN_ANCHORS.theatre

  return (
    <div
      ref={root}
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${at.x}%`,
        top: `${at.y}%`,
        width: `${screen.w}%`,
        aspectRatio: screen.aspect,
        opacity: 0,
        /* The three properties that carry the change. Eased long,
           because a screen that snaps to its new size reads as a
           layout bug rather than as a specification. */
        transition:
          'width 900ms cubic-bezier(0.16, 1, 0.3, 1), aspect-ratio 900ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* The field. Barely there — enough to read as glass in a
          lit room, not enough to look like a black box pasted on
          a photograph. */}
      <div className="absolute inset-0 bg-ink/22" />

      {/* Corner ticks rather than a continuous border: a full
          rectangle outlines the screen, four ticks SET IT OUT. */}
      {[
        'left-0 top-0 border-l border-t',
        'right-0 top-0 border-r border-t',
        'left-0 bottom-0 border-l border-b',
        'right-0 bottom-0 border-r border-b',
      ].map((pos) => (
        <span
          key={pos}
          data-tick
          className={`absolute h-4 w-4 border-cove/70 ${pos}`}
        />
      ))}

      {/* A hairline across the full width, on the centreline. It
          is the eyeline the screen is calibrated to, and it is
          what stops the four ticks reading as an empty frame. */}
      <span className="absolute inset-x-4 top-1/2 h-px bg-cove/20" />

      {label && (
        <span className="t-label absolute -top-6 left-0 text-[0.55rem] whitespace-nowrap text-cove/90">
          {label}
        </span>
      )}
    </div>
  )
}

/* How each kind of speaker is drawn. A subwoofer is a heavier
   mark than a surround because it is a heavier thing in the room;
   a height channel is hollow because it fires down at you rather
   than across at you. The shapes carry the information, so the
   overlay stays readable with every label switched off. */
const MARKS = {
  main: 'h-2 w-2 bg-cove',
  surround: 'h-1.5 w-1.5 bg-pure/85',
  sub: 'h-2.5 w-2.5 border border-cove bg-cove/35',
  height: 'h-2 w-2 rounded-full border border-pure/80',
}

/**
 * <ArrayOverlay> — the chosen speaker layout, drawn in the room.
 *
 * `ids` are keys into `speakerPoints`. Points that persist
 * between two layouts are NOT re-animated: going from 5.1 to
 * 7.1 should look like two speakers arriving, not like the whole
 * array blinking. That is handled by keying each mark on its id
 * and only entering the ones React actually mounts.
 */
export function ArrayOverlay({ ids = [], showLabels = false }) {
  const root = useRef(null)
  const known = useRef(new Set())

  useEffect(() => {
    const el = root.current
    if (!el) return

    const fresh = ids.filter((id) => !known.current.has(id))
    ids.forEach((id) => known.current.add(id))
    /* Ids that left are dropped from the set, so returning to a
       layout you have already seen animates its marks in again —
       otherwise going 7.1 → 5.1 → 7.1 would silently pop the rear
       surrounds back with no entrance. */
    known.current = new Set(ids)

    if (!fresh.length) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const targets = fresh
        .map((id) => el.querySelector(`[data-spk="${id}"]`))
        .filter(Boolean)
      if (!targets.length) return
      gsap.from(targets, {
        autoAlpha: 0,
        scale: 0.4,
        duration: 0.55,
        stagger: 0.04,
        ease: 'back.out(2)',
      })
    }, el)
    return () => ctx.revert()
  }, [ids])

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {ids.map((id) => {
        const p = speakerPoints[id]
        if (!p) return null
        return (
          <span
            key={id}
            data-spk={id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className={`block ${MARKS[p.kind] ?? MARKS.surround}`} />
            {showLabels && (
              <span className="t-label absolute top-3 left-1/2 -translate-x-1/2 text-[0.5rem] whitespace-nowrap text-pure/55">
                {p.label}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

/**
 * <PointOverlay> — arbitrary marks on a plate, for the listening
 * room's speaker placements and for a product shown in space.
 *
 * Separate from <ArrayOverlay> because those points come from a
 * fixed schedule of named cinema channels, and these are free
 * coordinates that belong to whatever is being explained. Same
 * drawing language, different source of truth.
 */
export function PointOverlay({ points = [], tone = 'cove' }) {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll('[data-point]'), {
        autoAlpha: 0,
        scale: 0.35,
        duration: 0.6,
        stagger: 0.06,
        ease: 'back.out(2)',
      })
    }, el)
    return () => ctx.revert()
  }, [points])

  const ring = tone === 'cove' ? 'border-cove/60' : 'border-pure/50'
  const dot = tone === 'cove' ? 'bg-cove' : 'bg-pure'

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {points.map((p, i) => (
        <span
          key={`${p.x}-${p.y}-${i}`}
          data-point
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span className={`block h-1.5 w-1.5 rounded-full ${dot}`} />
          {/* One ring, held still. A pulsing marker is the reflex
              for "look here" and it is exactly what would make
              this read as a game rather than as a drawing. */}
          <span className={`absolute -inset-2 rounded-full border ${ring}`} />
        </span>
      ))}
    </div>
  )
}
