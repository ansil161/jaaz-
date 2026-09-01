import { useRef } from 'react'

/* ============================================================
   THE STATE TRANSPORT

   Five states along the foot of the stage, and it is a TRANSPORT
   rather than a set of buttons — the row tells you where you are
   in the scene as well as letting you go somewhere else in it.
   Each cell carries a rule that fills as you scroll through that
   state's slice of the pin, so the row reads the way a film
   scrubber reads: five chapters, one of them running.

   That is the whole reason this is not the card rail the section
   it replaced used. Six cards with icons say "there are six of
   these". A filling transport says "you are 40% of the way
   through LISTEN, and there are two more after it" — which is
   the only honest thing to say about a row that scroll is
   already driving.

   ------------------------------------------------------------
   THE FILL IS COMPUTED IN CSS FROM ONE NUMBER

   The parent writes a single custom property on this element —
   `--states-p`, 0 to 1 across the whole states act — and each
   cell derives its own fill from it:

       scaleX(clamp(0, calc(var(--states-p) * var(--n) - var(--i)), 1))

   One `setProperty` per frame drives all five bars, and React
   never re-renders while you scroll. Writing five widths from JS
   instead would be five style writes and five layout reads a
   frame to say something arithmetic already knew.

   ------------------------------------------------------------
   CLICKING SCROLLS THE PAGE, IT DOES NOT SET STATE

   This is the part that keeps a scrubbed scene and a clickable
   control from fighting. The obvious build sets an index on
   click — and then the next scroll frame overwrites it from the
   playhead, so the control appears broken for exactly as long as
   the visitor is not touching the wheel.

   Selecting a state instead SCROLLS to the point in the pin
   where that state lives, and the playhead does what it always
   does. There is one source of truth (the scroll position) and
   the control is an instruction to move it. Nothing to
   reconcile, and it works identically for the keyboard.

   ------------------------------------------------------------
   ARIA

   A tablist with a roving tabindex, for the same reasons the
   whole pattern was right for the section this replaces: arrows
   and Home/End come free and correct, and the group is ONE tab
   stop rather than five on a page this long.
   ============================================================ */

export default function SnapStates({
  states,
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
    const wrapped = (to + states.length) % states.length
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
        move(states.length - 1)
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
      style={{ '--n': states.length }}
      className={`snap-transport grid grid-cols-5 gap-2 sm:gap-4 ${className}`}
    >
      {states.map((state, i) => {
        const active = i === index
        return (
          <button
            key={state.key}
            type="button"
            role="tab"
            id={`${tabId}-${state.key}`}
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(i)}
            style={{ '--i': i }}
            data-active={active || undefined}
            className="focus-ring group relative pt-3 text-left sm:pt-4"
          >
            {/* The track, and the fill that runs along it. Two
                absolutely-positioned hairlines rather than a
                border plus a pseudo-element, so the fill can be a
                transform and never a width — a width animation
                here would lay out five times a frame. */}
            <span aria-hidden="true" className="snap-track" />
            <span aria-hidden="true" className="snap-fill" />

            <span
              className={`t-num block text-[0.62rem] transition-colors duration-500 ${
                active ? 'text-cove' : 'text-mist group-hover:text-fog'
              }`}
            >
              {state.n}
            </span>
            {/* THE TRACKING COMES OFF ON A PHONE, and it is the
                only thing that makes five cells fit. `.t-label` sets
                0.24em, which is right everywhere else on this site
                and is what breaks here: five columns across a 430px
                screen leave about 71px a cell, and "ESCAPE" at
                0.6rem plus 0.24em of tracking measures almost
                exactly that — so the longest two labels wrap to a
                second line and only on the narrowest phones, which
                is the kind of break that ships. Tightened below
                `sm`, full house tracking above it. */}
            <span
              className={`t-label mt-1.5 block text-[0.55rem] tracking-[0.12em] transition-colors duration-500 sm:mt-2 sm:text-[0.65rem] sm:tracking-[0.24em] ${
                active ? 'text-pure' : 'text-fog group-hover:text-bone'
              }`}
            >
              {state.word}
            </span>
          </button>
        )
      })}
    </div>
  )
}
