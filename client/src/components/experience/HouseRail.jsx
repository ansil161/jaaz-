import { rooms } from '../../data/experience'

/* ============================================================
   WHERE YOU ARE IN THE HOUSE

   Nine chapters is a long way to travel, and a visitor two rooms
   deep has no way of knowing whether that is most of the house or
   a tenth of it. The plan answers that at the top of the page and
   then scrolls away; this keeps the answer available.

   It is a SCHEDULE WITH A TRAVELLING RULE, the same device the
   plan uses to key a number to a room. The rule moves by whole
   rows with a transform rather than by re-rendering a marker into
   a different <li>, so the eye follows one line moving instead of
   noticing that something vanished here and reappeared there.

   WIDE desktop only, and the breakpoint is measured rather than
   chosen. The content column is ~1240px; at 1366 the rail landed
   on top of the plan's preview panel, because there was simply no
   gutter left to sit in. It appears at 1536, which is the first
   width where the page has margin to give it. Below that the plan
   at the top plus ordinary scrolling already answer the same
   question, so nothing is lost.
   ============================================================ */

export default function HouseRail({ activeId, onSelect, visible }) {
  const index = Math.max(
    0,
    rooms.findIndex((r) => r.id === activeId),
  )

  return (
    <nav
      aria-label="Rooms"
      /* `mix-blend-difference` for the same reason the main nav
         uses it: the rail crosses ink and near-ink sections and
         has to stay legible over both without a scrim or a single
         conditional. */
      /* Hidden until the visitor is actually inside the house.
         Over the hero it had nothing to report — every room was
         still ahead — and it collided with the scroll cue in the
         same corner. It fades in with the plan, which is the
         moment the nine rooms first exist. */
      aria-hidden={!visible}
      className={`pointer-events-none fixed top-1/2 right-8 z-40 hidden -translate-y-1/2 mix-blend-difference transition-opacity duration-700 2xl:block ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`flex gap-4 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <ul className="space-y-2.5 text-right">
          {rooms.map((room) => {
            const on = room.id === activeId
            return (
              <li key={room.id}>
                <button
                  type="button"
                  tabIndex={visible ? 0 : -1}
                  onClick={() => onSelect(room.id)}
                  aria-current={on ? 'true' : undefined}
                  className={`t-label focus-ring text-right text-[0.5rem] transition-colors duration-500 ${
                    on ? 'text-pure' : 'text-pure/35 hover:text-pure/70'
                  }`}
                >
                  {room.nav}
                </button>
              </li>
            )
          })}
        </ul>

        {/* One track, one mark, sized to a single row. */}
        <div className="relative w-px shrink-0 bg-white/20" aria-hidden="true">
          <span
            className="absolute left-0 w-px bg-pure transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              height: `calc(100% / ${rooms.length})`,
              transform: `translateY(${index * 100}%)`,
            }}
          />
        </div>
      </div>
    </nav>
  )
}
