/* ============================================================
   HOTSPOTS — point, line, label

   The brief's constraint is the whole design: extremely subtle,
   no large circles, no neon. A 6px point, a hairline leader and a
   mono label — the same annotation language an architect uses on
   a drawing, which is also why the leader draws horizontally
   rather than at a jaunty angle.

   The point does not pulse. A pulsing dot is the reflex for "look
   here" and it is exactly the thing that would make this read as a
   game: six of them breathing at once turns a still room into an
   arcade cabinet. They hold still and answer on hover, which is
   the more confident move and the one the brief's closing rule
   asks for.

   ACCESSIBILITY. Each hotspot is a real <button> with a real
   label, so the room is explorable by keyboard and readable by a
   screen reader in the same order it reads visually. The dot is
   decoration on top of a control, not a control made of a dot.
   ============================================================ */

function Hotspot({ spot, active, onSelect }) {
  const toLeft = spot.side === 'left'

  return (
    <button
      type="button"
      onClick={() => onSelect(active ? null : spot.id)}
      aria-pressed={active}
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
    >
      <span className="sr-only">{spot.panel.title}</span>

      {/* The row: on a left-side spot the label leads and the point
          trails, so the leader always draws INTO the plate rather
          than off its edge. */}
      <span
        className={`flex items-center gap-0 ${toLeft ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* The point */}
        <span
          className={`relative block h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            active ? 'scale-150 bg-cove' : 'bg-pure/80 group-hover:scale-150 group-focus-visible:scale-150'
          }`}
        >
          {/* The ring, drawn only when the spot is answering. Kept
              at 1px and low alpha so it reads as focus, not as a
              target reticle. */}
          <span
            className={`absolute -inset-2 rounded-full border transition-opacity duration-500 ${
              active
                ? 'border-cove/50 opacity-100'
                : 'border-pure/40 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }`}
          />
        </span>

        {/* The leader. Width animates rather than opacity so the
            label arrives by being DRAWN toward, the way a callout
            is added to a drawing. */}
        <span
          className={`block h-px bg-pure/45 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            active ? 'w-10' : 'w-6 group-hover:w-10 group-focus-visible:w-10'
          }`}
        />

        <span
          className={`t-label whitespace-nowrap text-[0.58rem] transition-colors duration-500 ${
            active ? 'text-cove' : 'text-pure/70 group-hover:text-pure group-focus-visible:text-pure'
          }`}
        >
          {spot.label}
        </span>
      </span>
    </button>
  )
}

/**
 * <Hotspots> — the annotation layer over a room plate.
 *
 * Rendered inside the stage's transformed frame so every point
 * stays welded to what it annotates. It is the CALLER's job not to
 * mount this during a camera move: these points are sized in
 * screen pixels and would scale with the frame.
 */
export default function Hotspots({ spots, activeId, onSelect }) {
  return (
    <div className="absolute inset-0">
      {spots.map((spot) => (
        <Hotspot
          key={spot.id}
          spot={spot}
          active={activeId === spot.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
