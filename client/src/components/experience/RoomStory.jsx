/* ============================================================
   DISCOVER THE ROOM — six beats, one camera

   The configurator answers "what could this be". This answers
   "what am I actually looking at", which is a different question
   and needs a different control: not options, but a route through
   the room that stops at the six things worth stopping at.

   It is a CAMERA, not a gallery. Each beat is a focus point and a
   push expressed as two numbers, handed to the stage that is
   already on screen — so the room never cuts, it moves. Six
   separate detail renders would have been the obvious build and
   would have cost six generations to say something the same
   photograph already contains.

   The state lives with the caller because the stage does too;
   this component only names the beats and reports which one was
   chosen.
   ============================================================ */

export default function RoomStory({ beats, activeId, onSelect, className = '' }) {
  const active = beats.find((b) => b.id === activeId) ?? beats[0]

  return (
    <div className={className}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
        <ol className="flex flex-wrap gap-x-6 gap-y-3">
          {beats.map((beat) => {
            const on = beat.id === active.id
            return (
              <li key={beat.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(beat.id)}
                  className={`focus-ring group relative flex items-baseline gap-2 pb-1 transition-colors duration-500 ${
                    on ? 'text-pure' : 'text-mist hover:text-fog'
                  }`}
                >
                  <span
                    className={`t-label text-[0.5rem] transition-colors duration-500 ${
                      on ? 'text-cove' : 'text-ash'
                    }`}
                  >
                    {beat.index}
                  </span>
                  <span className="text-[0.88rem]">{beat.title}</span>
                  <span
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      on ? 'scale-x-100' : 'scale-x-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>
            )
          })}
        </ol>

        {/* Keyed so the line replays on every beat. Without it the
            text changes silently under a static block and the
            camera move reads as the only thing that happened. */}
        <p
          key={active.id}
          className="t-body max-w-sm shrink-0 animate-[fade-plate_700ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.92rem] text-mist sm:text-right"
        >
          {active.body}
        </p>
      </div>
    </div>
  )
}
