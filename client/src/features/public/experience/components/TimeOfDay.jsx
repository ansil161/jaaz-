import { useState } from 'react'
import { outdoorTimes, roomPlate } from '@/features/public/data/experience'
import RoomStage from './RoomStage'

/* ============================================================
   DAY → EVENING → NIGHT

   One terrace, three times of day, and nothing swapped but the
   light. That is the argument the section exists to make: the
   outdoor system is not a summer-afternoon product, it is the
   same house behaving differently at three points in an evening.

   Which is also why this is a THREE-STATE control and not a
   slider. A slider implies the interesting states are the ones
   between, and there is nothing between evening and night worth
   stopping on — the three named scenes are what the control
   system actually stores and what a client actually asks for.

   The whole change is a grade. No second render is involved,
   which is what lets it be honest: the geometry is identical
   because it is literally the same photograph, so the only
   variable is the one being demonstrated.
   ============================================================ */

export default function TimeOfDay({ room, className = '' }) {
  const [id, setId] = useState(outdoorTimes[1].id)
  const time = outdoorTimes.find((t) => t.id === id) ?? outdoorTimes[0]
  const plate = roomPlate(room)

  return (
    <div className={className}>
      <RoomStage
        slot={time.slot ?? plate.slot}
        alt={`${room.label} — ${time.label.toLowerCase()}`}
        grade={time.grade}
        ratio={16 / 9}
      />

      <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* The three scenes, as one run of type with a travelling
            rule — the same mark the configurator uses, so the
            visitor already knows what a lit hairline means. */}
        <fieldset className="shrink-0">
          <legend className="t-label mb-3 text-[0.55rem] text-ash">Time</legend>
          <div className="flex gap-6">
            {outdoorTimes.map((t) => {
              const on = t.id === id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setId(t.id)}
                  className={`focus-ring relative pb-1 text-[0.95rem] transition-colors duration-500 ${
                    on ? 'text-pure' : 'text-mist hover:text-fog'
                  }`}
                >
                  {t.label}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      on ? 'scale-x-100' : 'scale-x-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* What changed, in one line. Keyed so it replays rather
            than swapping text under a static block — the note is
            the only thing on screen that can confirm the grade
            did what it said it would. */}
        <p
          key={time.id}
          className="t-body max-w-sm animate-[fade-plate_700ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.92rem] text-mist sm:text-right"
        >
          {time.note}
        </p>
      </div>
    </div>
  )
}
