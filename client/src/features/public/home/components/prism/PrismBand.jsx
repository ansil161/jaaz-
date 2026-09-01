import Plate from '@/features/public/components/Plate'
import { hasStill } from '@/features/public/utils/media'
import { prism, prismModeCount } from '@/features/public/data/prism'
import PrismIcon from './prismIcons'

/* ============================================================
   ONE BAND

   A wide dark panel: the copy on the left, the room on the
   right. Five of these stack and slide over one another — the
   stacking itself lives in <Prism>; this file is one card.

   ------------------------------------------------------------
   THE CARD IS OPAQUE, AND THAT IS STRUCTURAL

   Every band carries a solid background across its full width,
   including behind the photograph. A stacked card with any
   transparency lets the card underneath show through at exactly
   the moment the two are overlapping, which is the moment the
   whole mechanism is being read — and the section stops looking
   like five things in a pile and starts looking like a rendering
   fault. If a future edit wants a translucent band, it wants a
   different mechanism.

   ------------------------------------------------------------
   ONE PHOTOGRAPH, FRAMED FIVE WAYS

   There is one `<img>` per band and it is the SAME FILE in all
   five. What differs is the grade (how the room is lit), the wash
   and veil over it, and the crop — `object-position` plus a
   scale, so each face frames the room where that face happens.
   See the note over `modes` in data/prism.js for why the crop
   exists at all: a stack of five identical pictures reads as a
   bug, and five different pictures would destroy the claim.

   The image is NOT lazy-loaded below the first band. All five
   sit inside a stack the visitor scrolls through continuously; a
   band that has to fetch its picture as it slides into place
   arrives as an empty rectangle over a full one, which is the
   worst frame this layout can produce. `fetchPriority="low"`
   keeps that honest — off the critical path, not deferred.
   ============================================================ */

export default function PrismBand({ mode, index, style }) {
  const rendered = hasStill(prism.room.still)

  /* The grade rides on the image as custom properties, never on a
     wrapper: `.plate` declares its own `--plate-*` defaults, and
     an element's own declaration beats an inherited one, so the
     same properties set on a parent are silently ignored. */
  const grade = {
    '--plate-brightness': mode.grade.brightness,
    '--plate-contrast': mode.grade.contrast,
    '--plate-saturate': mode.grade.saturate,
    objectPosition: mode.crop.pos,
    transform: `scale(${mode.crop.zoom})`,
  }

  return (
    <article
      data-band
      data-face={mode.key}
      aria-label={`${mode.n} of 0${prismModeCount}. ${mode.word}.`}
      style={style}
      className="prism-band"
    >
      {/* The card that actually moves. A separate element from the
          sticky positioner in <Prism> so the cover-and-recede
          transform composes with `position: sticky` instead of
          fighting it — a transform on the sticky element itself
          re-bases its containing block and the stick point drifts
          by however far it has been scaled. */}
      <div data-card className="prism-card">
        <div className="prism-card-grid">
          {/* ---- The copy ---- */}
          <div className="prism-copy">
            {/* THE FACE'S MARK, WHERE THE COUNTER USED TO BE.

                "01 / 05" was the most prominent thing in the copy
                block and the least useful: the stack itself says
                where you are — the pile under the card grows as
                you go — so the numeral was answering a question
                the layout had already answered, in the one
                typographic register (tabular mono) that reads as
                machine output.

                The glyph does what the numeral could not: it says
                what the face IS before a word is read. The number
                is not lost, it has moved to where it is actually
                needed — the band's accessible name and the live
                region, so a screen reader still gets "03 of 05". */}
            <div className="prism-mark">
              <PrismIcon name={mode.key} size={26} className="prism-mark-glyph" />
              <span className="prism-mark-word">{mode.word}</span>
            </div>

            {/* The lockup. Roman over italic, the site's display
                voice at the size the rest of the page uses it —
                not the shrunken step this section was reduced to
                while its headline lived in a sidebar. */}
            <h3 className="prism-lockup mt-[clamp(1.25rem,3.4vh,2.25rem)]">
              <span data-rise className="block text-pure">
                {mode.lockup[0]}
              </span>
              <span data-rise className="italic-display block text-cove">
                {mode.lockup[1]}
              </span>
            </h3>

            <p
              data-rise
              className="t-sub mt-[clamp(0.875rem,2.2vh,1.5rem)] max-w-[34ch] text-bone"
            >
              {mode.line}
            </p>

            {/* The four axes.

                NO RULE ABOVE EACH CELL. Four hairlines over four
                two-word cells is a table's ghost — it divides a
                row that was never in danger of being misread, and
                on a dark card at 12% white it is just visible
                enough to look like an artefact. Each cell is
                separated by its own glyph and by space, which is
                what separation is for.

                The VALUE leads and the axis name sits under it,
                which is the opposite of the first build. "Focused"
                is the interesting word; "Light" is the question it
                answers, and a question set larger than its answer
                is a form, not a specification. */}
            <dl
              data-rise
              className="prism-readout mt-[clamp(1.5rem,3.8vh,2.5rem)] grid max-w-[26rem] grid-cols-2 gap-x-7 gap-y-[clamp(0.875rem,2.4vh,1.375rem)] sm:max-w-none sm:grid-cols-4 sm:gap-x-5"
            >
              {mode.readout.map(([k, v, glyph]) => (
                /* TWO THINGS ARE LOAD-BEARING IN THIS SHAPE.

                   The glyph lives INSIDE the `dt`. A `div` inside
                   a `dl` may contain dt and dd elements and
                   nothing else, so an `<svg>` sitting beside them
                   — which is where it started — is invalid, and
                   it is the kind of invalid that no browser
                   complains about and every validator does. Inside
                   the term it is also simply correct: the mark is
                   a pictogram OF the axis, so it belongs to the
                   word it draws. It is positioned out of the flow
                   so it can sit beside both lines.

                   And `dt` comes BEFORE `dd`, reversed only in the
                   paint. A description list requires the term
                   first, and that is also the order it should be
                   read in — "Light: focused", not "focused:
                   light". The column reverses visually because the
                   VALUE is the interesting word and should lead
                   the eye; `column-reverse` gets that without
                   lying to a screen reader about which is which. */
                <div key={k} className="prism-axis">
                  <dt className="prism-readout-k">
                    <PrismIcon name={glyph} size={18} className="prism-axis-glyph" />
                    {k}
                  </dt>
                  <dd className="prism-readout-v">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ---- The room ---- */}
          <figure className="prism-shot">
            {rendered ? (
              <Plate
                slot={prism.room.still}
                alt={index === 0 ? prism.room.alt : ''}
                sizes="(min-width: 1024px) 55vw, 100vw"
                loading="eager"
                fetchPriority="low"
                style={grade}
                className="plate prism-plate"
              />
            ) : (
              <img
                src={prism.room.photo}
                alt={index === 0 ? prism.room.alt : ''}
                loading="eager"
                fetchPriority="low"
                decoding="async"
                draggable="false"
                style={grade}
                className="plate prism-plate"
              />
            )}

            {/* The light signature. Along with the grade on the
                photograph, the only thing separating the five
                faces. */}
            <span
              aria-hidden="true"
              style={{
                '--wash-at': mode.wash.at,
                '--wash-tint': mode.wash.tint,
                '--wash-power': mode.wash.power,
              }}
              className="prism-wash"
            />

            {/* Flat dark, for the two faces that genuinely go
                black. Everything else is done with exposure. */}
            <span aria-hidden="true" style={{ opacity: mode.veil }} className="prism-veil" />
          </figure>
        </div>
      </div>
    </article>
  )
}
