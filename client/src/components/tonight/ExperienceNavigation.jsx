import { useRef } from 'react'
import NightMark from './icons'

/* ============================================================
   EXPERIENCE NAVIGATION — the instrument rail

   Six cells on a hairline grid, each carrying a number, a mark
   and a name, with the active one drawn in a box. It reads as a
   row of channels on a piece of equipment rather than as a
   carousel's dots, which is the whole difference between "there
   are more slides" and "there are six of these, and you are on
   the first".

   THIS IS AN ARIA TABLIST, WHICH IS NOT A DETAIL
   Six controls that swap one panel without navigating IS the tabs
   pattern, and adopting it rather than inventing one buys the
   whole keyboard contract for free and correctly: arrow keys move
   between tabs, Home/End jump to the ends, and the browser
   announces "tab 3 of 6, selected" instead of "button, 03".

   It also fixes the thing a hand-rolled version always gets
   wrong. Six buttons in the tab order means six stops between the
   section and whatever follows it. A ROVING TABINDEX makes the
   group one stop: only the selected cell is focusable, arrows
   move within, Tab leaves. That is why `tabIndex` below is
   computed rather than omitted.

   THE ACTIVE BOX IS A SEPARATE ELEMENT
   Not a border on the cell. The cells are divided by a single
   hairline each (`border-l`), and switching that same border to
   the active colour would thicken one divider and leave the
   opposite edge of the cell open. An inset box drawn on top owns
   all four sides, cannot disturb the grid, and can fade rather
   than snap.

   PREV / NEXT ARE NOT TABS
   They sit in the leading cell, outside the tablist, deliberately.
   They are relative moves, not destinations, so giving them
   `role="tab"` would make a screen reader announce eight tabs for
   six nights.
   ============================================================ */

function Chevron({ dir = 'next' }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={dir === 'prev' ? 'rotate-180' : ''}
    >
      <path d="M2.5 8h10.5" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  )
}

export default function ExperienceNavigation({
  nights,
  index,
  onSelect,
  onPrev,
  onNext,
  labels,
  tabId,
  panelId,
}) {
  const listRef = useRef(null)

  /* Focus follows selection inside the group, which is what makes
     the roving tabindex feel like one control rather than six. */
  const move = (to) => {
    const wrapped = (to + nights.length) % nights.length
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
        move(nights.length - 1)
        break
      default:
    }
  }

  const round =
    'focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-mist transition-colors duration-400 hover:border-white/45 hover:text-pure'

  return (
    /* `rail-x` so a phone scrolls the cells rather than crushing six
       of them into illegibility. */
    <div className="rail-x flex overflow-x-auto border-t border-white/12">
      {/* ---- The leading cell: what these are, and how to step ---- */}
      <div className="flex shrink-0 flex-col justify-between gap-6 py-7 pr-8 pl-0 sm:pr-10">
        <div>
          <span className="t-label text-ash">{labels.group}</span>
          <div className="mt-3 h-px w-9 bg-white/20" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onPrev} className={round} aria-label={labels.prev}>
            <Chevron dir="prev" />
          </button>
          <button type="button" onClick={onNext} className={round} aria-label={labels.next}>
            <Chevron dir="next" />
          </button>
        </div>
      </div>

      {/* ---- The six ---- */}
      <div
        ref={listRef}
        role="tablist"
        aria-label="Choose an evening"
        onKeyDown={onKeyDown}
        className="flex flex-1"
      >
        {nights.map((night, i) => {
          const active = i === index
          return (
            <button
              key={night.key}
              type="button"
              role="tab"
              id={`${tabId}-${night.key}`}
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(i)}
              className="focus-ring group relative flex w-[9.5rem] shrink-0 flex-col justify-between gap-5 border-l border-white/10 py-7 pr-4 pl-6 text-left sm:w-auto sm:flex-1"
            >
              {/* The box. Drawn over the cell, never as its border. */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-1.5 border transition-colors duration-500 ${
                  active ? 'border-white/25' : 'border-transparent'
                }`}
              />

              <span
                className={`t-num relative text-xs tabular-nums transition-colors duration-500 ${
                  active ? 'text-pure' : 'text-ash group-hover:text-mist'
                }`}
              >
                {night.n}
              </span>

              <span
                className={`relative transition-colors duration-500 ${
                  active ? 'text-cove' : 'text-ash group-hover:text-mist'
                }`}
              >
                <NightMark name={night.key} />
              </span>

              <span
                className={`t-label relative transition-colors duration-500 ${
                  active ? 'text-pure' : 'text-mist group-hover:text-fog'
                }`}
              >
                {night.short}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
