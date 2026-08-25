/* ============================================================
   ANNOTATION — a mark welded to a point in the room

   The marker is positioned by the render loop, not by React: its
   node is handed up through `nodeRef` and the loop writes a
   `translate3d` onto it every frame from the projected world
   position. That is the whole trick — the label does not sit ON
   the screen, it sits ON THE OBJECT, and stays there while the
   camera walks past.

   Deliberately NOT a pulsing circle. A breathing dot is the
   reflex for "look here" and it is exactly what would make a
   luxury room read as a game HUD. It is a 6px point, a hairline
   leader and a mono label — the same annotation language the
   rest of this site uses on drawings.

   `translate3d` rather than `left`/`top`: a transform is
   composited, so sixty of these a second cost no layout. Writing
   `left` here would reflow the overlay on every frame of every
   camera move.
   ============================================================ */

export default function Annotation({ spot, nodeRef, onOpen, open }) {
  return (
    <div
      ref={nodeRef}
      /* Starts hidden. The loop reveals it once it has a real
         projected position — without this, every marker paints
         one frame at the top-left corner before the first
         projection lands. */
      style={{ opacity: 0, transform: 'translate3d(-100px, -100px, 0)' }}
      className="absolute top-0 left-0 z-20 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 will-change-transform"
    >
      <button
        type="button"
        onClick={() => onOpen?.(open ? null : spot.id)}
        aria-pressed={open}
        className="group pointer-events-auto flex -translate-x-1/2 -translate-y-1/2 items-center gap-0 focus:outline-none"
      >
        <span className="sr-only">{spot.panel.title}</span>

        <span
          className={`relative block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'scale-150 bg-cove' : 'bg-white/90 group-hover:scale-150'
          }`}
        >
          <span
            className={`absolute -inset-2 rounded-full border transition-opacity duration-500 ${
              open ? 'border-cove/60 opacity-100' : 'border-white/45 opacity-0 group-hover:opacity-100'
            }`}
          />
        </span>

        <span
          className={`block h-px bg-white/50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'w-9' : 'w-6 group-hover:w-9'
          }`}
        />

        <span
          className={`t-label whitespace-nowrap text-[0.55rem] transition-colors duration-500 ${
            open ? 'text-cove' : 'text-white/80 group-hover:text-white'
          }`}
          style={{ textShadow: '0 1px 12px rgba(0,0,0,0.9)' }}
        >
          {spot.label}
        </span>
      </button>
    </div>
  )
}

/**
 * <SpotPanel> — the specification, docked.
 *
 * Docked to the edge rather than floated beside the marker, and
 * for a reason the brief states directly: the room has to stay
 * visible behind the information. A panel that follows its point
 * around the screen covers a different part of the room every
 * frame and needs collision logic that detaches it from the point
 * anyway. Docked, it occupies one considered position, the marker
 * stays lit, and the connection is carried by STATE rather than
 * by proximity.
 */
export function SpotPanel({ spot, onClose }) {
  return (
    <aside
      aria-label={spot.panel.title}
      className="pointer-events-auto absolute right-5 bottom-24 z-30 w-[min(21rem,calc(100vw-2.5rem))] border border-white/12 bg-black/72 p-6 backdrop-blur-md sm:right-8 sm:bottom-28"
    >
      <div className="flex items-start justify-between gap-5">
        <h3 className="t-heading text-[1.35rem] leading-tight text-pure">{spot.panel.title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="focus-ring -m-2 shrink-0 p-2 text-mist transition-colors duration-300 hover:text-pure"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      <p className="italic-display mt-2 text-[0.9rem] text-cove">{spot.panel.lede}</p>

      <dl className="mt-5 space-y-2.5 border-t border-white/12 pt-5">
        {spot.panel.facts.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
            <dt className="t-label text-[0.48rem] text-ash">{k}</dt>
            <dd className="text-[0.8rem] leading-snug text-fog">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
