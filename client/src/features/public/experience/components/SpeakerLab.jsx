import { useState } from 'react'
import { roomPlate, speakerDetailOrder, speakerTypes } from '@/features/public/data/experience'
import RoomStage from './RoomStage'
import { PointOverlay } from './Overlays'

/* ============================================================
   HEAR EVERY DETAIL — five ways to put sound in a room

   The decision a visitor is actually making in a listening room
   is not "which model" but "where does the sound come from, and
   what do I have to look at". So choosing a speaker type does
   not swap the photograph — it MOVES THE POINTS. Floorstanding
   sit forward on the floor; in-ceiling appear overhead;
   invisible disappear into the wall line. The room stays the
   same room, which is the honest way to show a choice that only
   changes where things are.

   THE FOUR-WAY EXPLORATION is a tab set, and it is the one place
   in this experience where tabs are right: four aspects of ONE
   thing, only one of which is relevant at a time, with no order
   between them. The alternative — all four stacked — buries the
   room under a page of specification, which is exactly what the
   brief's "do not make the visitor read" rule is aimed at.
   ============================================================ */

export default function SpeakerLab({ room, className = '' }) {
  const [typeId, setTypeId] = useState(speakerTypes[0].id)
  const [facet, setFacet] = useState(speakerDetailOrder[0].id)
  const type = speakerTypes.find((t) => t.id === typeId) ?? speakerTypes[0]
  const plate = roomPlate(room)

  return (
    <div className={className}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <RoomStage slot={plate.slot} alt={plate.alt} grade="relax" ratio={16 / 9}>
            {/* Keyed on the type so the marks remount and play
                their entrance — the movement between placements
                is the whole answer to "where would they go". */}
            <PointOverlay key={type.id} points={type.points} />
          </RoomStage>

          <p className="italic-display mt-5 text-[0.95rem] text-cove">{type.lede}</p>
        </div>

        {/* ---- The choice ---- */}
        <div className="w-full shrink-0 lg:w-72">
          <fieldset>
            <legend className="t-label mb-4 text-[0.55rem] text-ash">Speaker</legend>
            <ul className="space-y-2.5">
              {speakerTypes.map((t) => {
                const on = t.id === typeId
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTypeId(t.id)}
                      className={`focus-ring relative w-full pb-1 text-left text-[0.92rem] transition-colors duration-500 ${
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
                  </li>
                )
              })}
            </ul>
          </fieldset>

          {/* ---- The exploration ---- */}
          <div className="mt-10 border-t border-white/10 pt-7">
            <div role="tablist" aria-label="Explore this speaker" className="flex flex-wrap gap-x-4 gap-y-2">
              {speakerDetailOrder.map((f) => {
                const on = f.id === facet
                return (
                  <button
                    key={f.id}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    onClick={() => setFacet(f.id)}
                    className={`t-label focus-ring text-[0.52rem] transition-colors duration-400 ${
                      on ? 'text-cove' : 'text-ash hover:text-mist'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            {/* Keyed on both, so switching either the speaker or
                the facet replays the entrance rather than swapping
                text underneath a static block. */}
            <p
              key={`${type.id}-${facet}`}
              role="tabpanel"
              className="t-body mt-5 animate-[fade-plate_600ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.92rem] leading-relaxed text-fog"
            >
              {type.detail[facet]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
