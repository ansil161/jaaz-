import { feelings } from '@/features/public/data/site'
import FeelingIcon from './feelingIcons'

/* ============================================================
   ONE FEELING, AS A BAND

   An opaque fixed-height card carrying this section's content:
   the room-plan mark and the feeling's name, the lockup, the
   paragraph, the specification, and the room on the right.

   IT IS BUILT OUT OF THE `.band-*` SYSTEM in site.css rather than
   out of rules of its own. Those rules are a stacked-band LAYOUT
   — an opaque fixed-height card, a two-column grid inside it, a
   copy side with its own lift and a photograph side that bleeds —
   and none of it is specific to any one section's content.

   Those rules were called `.prism-*` until 2026-09-02, because
   <Prism> is where they were written and this section was the
   second to take them. Prism has since been replaced by <Scene>,
   so a forty-rule layout system was left named after a component
   that no longer exists; it was renamed in one pass and this file
   is now its only consumer. Nothing here changed but the strings.

   ------------------------------------------------------------
   WHAT THIS BAND DOES DIFFERENTLY, AND WHY

   ONE ROOM EACH, NOT ONE ROOM GRADED SIX WAYS. <Scene> at slot
   07 claims that a single room becomes five evenings, so it
   carries one photograph and changes the light on it. This
   section's claim is the opposite — six different feelings are
   six different rooms — so each band carries its own plate at the
   site's standard grade. There is no wash and no veil here
   because there is nothing to differentiate: the rooms already
   are different. (That is also why the wash and veil rules did
   not survive the `.band-*` rename.)

   THE SPECIFICATION IS NOT A FIXED-CHANNEL READOUT. <Scene> can
   set five named channels against five values, because its five
   evenings are the same room reported on the same five systems.
   These six are not comparable that way: "full blackout" and
   "distributed audio" do not answer the same question. So the
   band prints `meta` as it is authored — the two or three facts a
   room of that kind is specified by, split on its own middot — in
   the readout's position and at the readout's size. Inventing
   channel names to fill the shape would have been the section's
   first invented specification.
   ============================================================ */

const specs = (meta) =>
  meta
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))

export default function FeelingBand({ state, index, count }) {
  return (
    <article
      data-band
      data-face={state.key}
      aria-label={`${index + 1} of ${count}. ${state.word}.`}
      className="band"
    >
      {/* The card that actually moves. A separate element from the
          sticky positioner in <Feeling> so the cover-and-recede
          transform composes with `position: sticky` instead of
          fighting it — a transform on the sticky element itself
          re-bases its containing block and the stick point drifts
          by however far it has been scaled. */}
      <div data-card className="band-card">
        <div className="band-card-grid">
          {/* ---- The copy ---- */}
          <div className="band-copy">
            {/* The mark is a plan of the room this feeling asks
                for — see feelingIcons.jsx. It says what the answer
                IS before a word of it is read, which is the same
                job <Scene>'s channel glyphs do, and the reason
                there is no 01/06 counter here either: the pile
                under the card already says where you are. */}
            <div className="band-mark">
              <FeelingIcon name={state.key} size={26} className="band-mark-glyph" />
              <span className="band-mark-word">{state.word}</span>
            </div>

            <h3 className="band-lockup mt-[clamp(1.25rem,3.4vh,2.25rem)]">
              <span data-rise className="block text-pure">
                {state.lockup[0]}
              </span>
              <span data-rise className="italic-display block text-cove">
                {state.lockup[1]}
              </span>
            </h3>

            <p data-rise className="t-sub mt-[clamp(0.875rem,2.2vh,1.5rem)] max-w-[42ch] text-bone">
              {state.body}
            </p>

            <ul
              data-rise
              className="band-readout feeling-readout mt-[clamp(1.5rem,3.8vh,2.5rem)] grid max-w-[30rem] grid-cols-2 gap-x-7 gap-y-[clamp(0.75rem,2vh,1.125rem)] sm:max-w-none sm:grid-cols-3 sm:gap-x-5"
            >
              {specs(state.meta).map((fact) => (
                <li key={fact} className="band-readout-v">
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* ---- The room ---- */}
          <figure className="band-shot">
            <img
              src={state.plate}
              alt={state.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority="low"
              decoding="async"
              draggable="false"
              sizes="(min-width: 1024px) 55vw, 100vw"
              /* RUN AT FULL EXPOSURE. Nothing is laid over these
                  photographs except the credit on the bottom
                  rule, which carries its own scrim — and several
                  of the verified plates are exposed near black to
                  begin with, so a brightness under 1 turns half
                  this stack into black rectangles. */
              className="plate band-plate [--plate-brightness:1.04] [--plate-contrast:1.04] [--plate-saturate:0.96]"
            />

            {/* The reference mark, on the picture's own foot. Six
                stock interiors on a page selling rooms have to say
                so WHERE THE PICTURE IS, not only in a note above
                all six — a reader who lands mid-stack never sees
                that note. Two words, because the full sentence set
                across the foot of a lit interior is neither
                readable nor a caption; it is in the header. */}
            <figcaption className="feeling-credit">{feelings.stamp}</figcaption>
          </figure>
        </div>
      </div>
    </article>
  )
}
