import { useCallback, useMemo, useState } from 'react'
import { hasStill, optionReady } from './media'

/* ============================================================
   HOW A SET OF CHOICES BECOMES A ROOM

   One function, used by every configured space, so that "what am
   I looking at" has exactly one answer no matter which room asks.

   A selection resolves into four independent facets, and the
   whole design of the experience rests on them being independent:

     slot     which photograph        (needs a render)
     grade    how it is lit           (computed)
     screen   the display drawn on it (computed)
     array    the speakers drawn on it(computed)

   Because only the FIRST needs an asset, choosing Atmos and
   Movie Night and Cinema Projection all visibly change the room
   on the renders that exist today. Only a change of furniture
   waits for a photograph.

   THE ONE HONEST LIMITATION. Two options that each want a
   different photograph cannot be combined — there is no render of
   "motorised seating AND the racing rig", and compositing two
   plates that do not register would show a room that was never
   designed. So the slot is LAST-CHANGED-WINS, and it is the only
   facet that behaves that way. Pick motorised seating and you see
   that render; pick the racing rig after it and you see that one.
   Every other facet accumulates properly.
   ============================================================ */

/**
 * Resolve a selection against a room.
 *
 * @param {Array}  channels    The configurator schedule.
 * @param {Object} selection   `{ channelId: optionId }`.
 * @param {Object} room        Supplies the fallback plate.
 * @param {string} lastChanged Which channel moved most recently.
 */
export function resolveRoom(channels, selection, room, lastChanged) {
  const chosen = channels
    .map((channel) => {
      const option = channel.options.find((o) => o.id === selection[channel.id])
      return option ? { channel, option } : null
    })
    .filter(Boolean)

  /* Facets that accumulate. Later channels win a tie, which is
     why the schedule is ordered the way it is: display, then
     audio, then the physical room, then light. Light is last
     because it is the one thing that should always be able to
     override how the room reads. */
  let grade = null
  let screen = null
  let array = null

  for (const { option } of chosen) {
    if (option.grade) grade = option.grade
    if (option.screen) screen = option.screen
    if (option.array) array = option.array
  }

  /* The plate. Only a genuinely different photograph counts, and
     only if it was actually generated — an option pointing at a
     render that does not exist falls back to the room's master
     rather than showing an empty stage in the middle of a
     working configurator. */
  let slot = room.slot
  const preferred = chosen.find(
    ({ channel, option }) =>
      channel.id === lastChanged && option.slot && hasStill(option.slot),
  )
  if (preferred) {
    slot = preferred.option.slot
  } else {
    const anyReady = chosen.filter(({ option }) => option.slot && hasStill(option.slot))
    if (anyReady.length) slot = anyReady[anyReady.length - 1].option.slot
  }

  /* The readout under the room. One line per channel, in the
     schedule's own order, so the visitor can read the system they
     have just built as a specification rather than having to
     remember which words they clicked. */
  const specs = chosen.map(({ channel, option }) => ({
    id: channel.id,
    label: channel.label,
    value: option.label,
    detail: option.spec ?? option.hint,
    pending: !optionReady(option),
  }))

  return { slot, grade, screen, array, specs }
}

/**
 * The same thing as state. Returns the resolved room plus the
 * handler the configurator needs, so a section that wants a
 * configured space is three lines rather than thirty.
 */
export function useRoomConfig(channels, defaults, room) {
  const [selection, setSelection] = useState(defaults)
  const [lastChanged, setLastChanged] = useState(null)

  const onChange = useCallback((channelId, optionId) => {
    setSelection((prev) => ({ ...prev, [channelId]: optionId }))
    setLastChanged(channelId)
  }, [])

  const resolved = useMemo(
    () => resolveRoom(channels, selection, room, lastChanged),
    [channels, selection, room, lastChanged],
  )

  return { selection, onChange, ...resolved }
}
