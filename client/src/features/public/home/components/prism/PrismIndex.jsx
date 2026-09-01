import { useRef } from 'react'

/* ============================================================
   THE INDEX

   Five names along one continuous rule, and a small marker that
   travels under them. An exhibition index — the printed strip at
   the foot of a wall that tells you which of the five rooms you
   are standing in — rather than tabs, a carousel or a transport.

   The difference is where the emphasis lives. Tabs put a shape
   around the selected one. A player puts a shape around the
   control. This puts NOTHING around anything: one hairline runs
   the full width, unbroken, and the only thing that moves is a
   3px marker. The names change weight and colour and nothing
   else. That is the whole design, and it is the reason it does
   not read as UI.

   ------------------------------------------------------------
   THE MARKER IS DRIVEN BY ONE PROPERTY, WRITTEN ONCE A FRAME

   <Prism> writes `--prism-marker` on this element — a 0-1
   position along the rail — and the marker positions itself from
   it in CSS. One `setProperty` per scroll frame, no React render,
   and no per-cell bookkeeping.

   The five cells are equal, so their centres are at 10%, 30%,
   50%, 70% and 90%, and `markerAt()` in prismGeometry.js maps
   the pin into exactly that range. The marker is therefore
   genuinely under the active word at every face rather than
   approximately under it, and the fact that it arrives at the
   word at the same moment the word lights is what makes the two
   read as one instrument.

   ------------------------------------------------------------
   CLICKING SCROLLS THE PAGE, IT DOES NOT SET STATE

   This is the part that keeps a scrubbed scene and a clickable
   control from fighting. The obvious build sets an index on
   click, and the next scroll frame overwrites it from the
   playhead — so the control appears broken for exactly as long
   as the visitor is not touching the wheel.

   Selecting a face instead SCROLLS to the point in the pin where
   that face lives, and the playhead does what it always does.
   One source of truth, nothing to reconcile, and it works
   identically for the keyboard.

   ------------------------------------------------------------
   ARIA

   A tablist with a roving tabindex. Arrows and Home/End come
   free and correct, and the group is ONE tab stop rather than
   five on a page this long. This is the section's only
   keyboard-reachable control — the ring of faces around the room
   is a pointer affordance and says so (see <PrismFacets>).
   ============================================================ */

export default function PrismIndex({
  modes,
  index,
  onSelect,
  tabId,
  panelId,
  label,
  className = '',
}) {
  const listRef = useRef(null)

  /* Focus follows selection inside the group — what makes five
     controls read as one instrument rather than as five. */
  const move = (to) => {
    const wrapped = (to + modes.length) % modes.length
    onSelect(wrapped)
    listRef.current?.querySelectorAll('[role="tab"]')[wrapped]?.focus()
  }

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        move(index - 1)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        move(index + 1)
        break
      case 'Home':
        e.preventDefault()
        move(0)
        break
      case 'End':
        e.preventDefault()
        move(modes.length - 1)
        break
      default:
    }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`prism-index relative ${className}`}
    >
      <div className="grid grid-cols-5">
        {modes.map((mode, i) => {
          const active = i === index
          return (
            <button
              key={mode.key}
              type="button"
              role="tab"
              id={`${tabId}-${mode.key}`}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(i)}
              data-active={active || undefined}
              className="focus-ring group flex items-baseline justify-center gap-2 pb-[clamp(0.625rem,1.6vh,0.875rem)] text-center"
            >
              <span
                className={`t-num text-[0.5625rem] transition-colors duration-700 ${
                  active ? 'text-cove' : 'text-mist group-hover:text-fog'
                }`}
              >
                {mode.n}
              </span>
              {/* THE NAME IS THE DISPLAY SERIF HERE TOO, for the
                  same reason it is on the markers around the room:
                  this rail is an index of five rooms, and an index
                  sets names in the voice the names are written in.
                  Mono tracked at 0.24em also does not fit — five
                  cells across a 390px screen leave about 66px
                  each, and "ESCAPE" tracked that far measures more
                  than that, so the two longest labels wrapped on
                  the narrowest phones only, which is the kind of
                  break that ships. The serif fits at every width
                  without being tuned to survive. */}
              <span
                className={`prism-index-w ${
                  active ? 'text-pure' : 'text-fog group-hover:text-bone'
                }`}
              >
                {mode.word}
              </span>
            </button>
          )
        })}
      </div>

      {/* One rule, unbroken, under all five — not five rules, and
          not a rule per cell that fills. A continuous line is what
          makes the row an index of one thing; five segments make
          it a progress bar with chapters. */}
      <span aria-hidden="true" className="prism-index-rail" />
      <span aria-hidden="true" className="prism-index-marker" />
    </div>
  )
}
