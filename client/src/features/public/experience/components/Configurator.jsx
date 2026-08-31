import { optionReady } from '@/features/public/utils/media'

/* ============================================================
   CONFIGURATOR — the control, and why it is only words

   "Minimal" here means the control is a SCHEDULE: channel name,
   then the options as words. No swatch chips, no thumbnails, no
   preview tiles. A material thumbnail 20px across tells you
   nothing a well-chosen word does not, and six of them turn a
   considered panel into a paint aisle. The ROOM is the preview —
   that is the entire point of the experience — so the control
   only has to name what is being chosen.

   WHAT MAKES AN OPTION AVAILABLE

   An option is ready when it can actually change the room. Most
   can, today, with no asset at all: a `grade` relights the plate,
   an `array` redraws the speakers, a `screen` redraws the display
   at its real proportion. Only an option that needs a genuinely
   different photograph — different furniture, a different rig —
   waits on a render.

   This is the difference between a configurator that works and
   one that is a promise. Light, layout and screen size are live
   from the first day; the two or three choices that move physical
   objects are marked as being prepared.

   UNAVAILABLE OPTIONS ARE SHOWN, NOT HIDDEN. Hiding them would
   quietly change the design on offer depending on what happened
   to be generated that day, and the panel would reshuffle under
   the visitor as renders land. They hold their place, disabled,
   with the reason on the control itself.
   ============================================================ */

function Option({ option, selected, onSelect, size }) {
  const ready = optionReady(option)

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={selected}
      title={ready ? option.hint : `${option.hint} — render in preparation`}
      onClick={() => onSelect(option.id)}
      className={`focus-ring relative pb-1 text-left transition-colors duration-500 ${size} ${
        selected
          ? 'text-pure'
          : ready
            ? 'text-mist hover:text-fog'
            : 'cursor-not-allowed text-ash/55'
      }`}
    >
      {option.label}

      {/* The selected rule. Scaled rather than toggled so the mark
          slides between options instead of blinking out and in. */}
      <span
        className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selected ? 'scale-x-100' : 'scale-x-0'
        }`}
        aria-hidden="true"
      />

      {/* Pending marker. A hairline dot, not the word "soon" — the
          panel should not start apologising in the middle of a
          room. The title attribute carries the reason. */}
      {!ready && (
        <span
          className="absolute -top-0.5 -right-2 h-1 w-1 rounded-full bg-ash/70"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

/**
 * <Configurator>
 *
 * @param {'panel'|'rail'} layout
 *   `panel` docks beside the stage on wide screens — the schedule
 *   read as a column. `rail` runs UNDER the stage as one line per
 *   channel, which is the right shape when the room is the full
 *   width of the page and there is no column to dock into.
 */
export default function Configurator({
  channels,
  selection,
  onChange,
  layout = 'panel',
  title = 'Your room',
  className = '',
}) {
  if (layout === 'rail') {
    return (
      <section
        aria-label={title}
        className={`grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}
      >
        {channels.map((channel) => (
          <fieldset key={channel.id} className="min-w-0">
            <legend className="t-label mb-3 text-[0.55rem] text-ash">{channel.label}</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {channel.options.map((option) => (
                <Option
                  key={option.id}
                  option={option}
                  size="text-[0.82rem]"
                  selected={selection[channel.id] === option.id}
                  onSelect={(id) => onChange(channel.id, id)}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label={title}
      className={`border border-white/10 bg-ink-4/90 backdrop-blur-md ${className}`}
    >
      <h3 className="t-label border-b border-white/10 px-6 py-4 text-[0.55rem] text-ash">
        {title}
      </h3>

      <div className="divide-y divide-white/8">
        {channels.map((channel) => (
          <fieldset key={channel.id} className="px-6 py-5">
            <legend className="t-label mb-3 text-[0.55rem] text-mist">{channel.label}</legend>

            <div className="flex flex-wrap gap-x-5 gap-y-2.5">
              {channel.options.map((option) => (
                <Option
                  key={option.id}
                  option={option}
                  size="text-[0.88rem]"
                  selected={selection[channel.id] === option.id}
                  onSelect={(id) => onChange(channel.id, id)}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  )
}
