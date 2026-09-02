import { possibilities } from '@/features/public/data/site'
import { Lines, Rise } from '@/features/public/components/Motion'
import { Link } from '@/features/public/router/PageTransition'

/* ============================================================
   POSSIBILITIES

   The homepage slot that used to hold a portfolio rail. It holds a
   proposal instead, and the reason is in data/site.js beside
   `possibilities`: JAAZ has no photography of its own work yet, and
   a portfolio built out of stock interiors is a portfolio that is
   lying at the exact point a visitor is deciding whether to trust
   the claim above it.

   So the section is built to be READ AS DIRECTION, not as proof.
   Three things carry that, and none of them is a layout decision:

   1. THE DISCLOSURE IS ABOVE THE PHOTOGRAPHS. `note` sits directly
      under the heading, so it is read before the pictures are. A
      disclosure placed after the evidence was written for the wrong
      reader.
   2. AND IT IS ON EVERY CARD. `badge` is printed in the caption row
      of each plate, because the header note is read once and a card
      is the thing that gets screenshotted, linked and scrolled back
      to. It is driven by `item.reference` rather than hard-coded —
      see the note in site.js. A card that is not marked is a bug,
      not a styling choice.
   3. NOTHING IS CAPTIONED AS A JOB. No city, no client, no sign-off
      date anywhere in the data — the checklist under each card is
      that room's `meta`, which is the two or three facts a room of
      this KIND is specified by, split on its own separator.

   ------------------------------------------------------------
   THE CHECKLIST IS NOT WRITTEN HERE

   Every bullet is one segment of `item.meta`. That is deliberate,
   and it is the whole reason this section can carry a checklist at
   all: a feature list under a photograph is exactly the shape that
   invites invented specification, and every line in these lists is
   copy that already existed and was already true.

   If this ever needs five bullets a card instead of three, the two
   extra lines have to come from the client. Padding the list is the
   one change to this file that would make the section dishonest.

   ------------------------------------------------------------
   FIVE OF EIGHT, ONE PER KIND

   `possibilities.items` holds eight environments across five kinds
   of room. This section shows FIVE — one card per kind — so that
   every card on the page is a different sort of space rather than
   two views of the same one. That is the section's claim ("five
   kinds of room") made literal in the grid.

   The data is deliberately left whole. Restoring any of the other
   three is a one-line change to `SHOWN`, and deleting them from
   site.js would throw away copy nobody should have to write twice.

   ------------------------------------------------------------
   THE GRID IS 3 + 2, AND EVERY CARD IS THE SAME CARD

   An earlier pass widened the last two cards to three of six
   columns so the second row would fill. It filled, and it also
   made two of the five rooms look more important than the other
   three — which in a set whose whole point is "five kinds, no
   ranking" is the one thing the layout must not say. Five equal
   cards in a 3-across grid leave a gap in the second row, and
   that gap is the honest shape. Do not fill it by promoting a
   room.
   ============================================================ */

/* Which environments appear, and in what order. Room numbers rather
   than indexes, so reordering `possibilities.items` can never
   silently change which rooms the homepage shows. */
const SHOWN = ['01', '03', '05', '07', '08']

const CARDS = SHOWN.map((n) => possibilities.items.find((i) => i.n === n)).filter(Boolean)

/* `meta` is authored as one line with a middot separator, which is
   the right shape for a caption and the wrong one for a list. Split
   on the separator and sentence-case each part — presentation only.
   No segment is added, dropped or reworded. */
const specs = (meta) =>
  meta
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))

/* Drawn, not typed. A tick set as a character inherits whatever the
   body face has for U+2713, which lands at a different weight and
   baseline from everything around it. */
function Check() {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex size-[1.125rem] shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]"
    >
      <svg viewBox="0 0 12 12" className="size-[0.625rem]" fill="none">
        <path
          d="M2.5 6.2 4.7 8.4 9.5 3.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function Possibilities() {
  return (
    <section id="possibilities" className="relative bg-ink py-24 sm:py-32 lg:py-40">
      <div className="shell-wide">
        {/* The heading runs at the page's own display step. Every
            other section on this homepage sets its headline in
            `t-display`, and a section that quietly drops a step below
            its neighbours is the one that reads as unfinished.

            The leading is opened up from the face's own 0.94: two
            display lines set that tight read as a single stacked
            block, and this heading is a question in two parts. */}
        <div className="grid gap-7 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-20">
          <Lines as="h2" className="t-display max-w-[13ch] leading-[1.14] text-bone" stagger={0.11}>
            {possibilities.heading.map((l, i) => (
              <span key={l} className="block">
                {/* The page's universal pivot — every Instrument Serif
                    headline on this site turns one word warm. */}
                {i === 1 ? <em className="italic-display text-cove">{l}</em> : l}
              </span>
            ))}
          </Lines>

          {/* ONE paragraph, and it is the disclosure. A section
              that opens with a sentence describing itself and then
              a second sentence qualifying its photographs has said
              nothing twice; the heading already asks the question
              and the pictures already answer it. What a reader
              cannot get from either is whose rooms these are. */}
          <p className="t-sub max-w-[48ch] text-fog lg:pb-2">{possibilities.note}</p>
        </div>

        <Rise
          /* Three across from 768, not from 640. At the `sm`
              breakpoint three cards are ~170px wide and the
              photographs stop being photographs. Below that they
              stack full width, which is the better phone layout
              anyway. */
          className="mt-14 grid grid-cols-1 gap-x-5 gap-y-14 md:grid-cols-3 md:gap-y-16 lg:mt-16"
          selector="article"
          stagger={0.1}
          y={34}
        >
          {CARDS.map((item) => (
            <article key={item.n}>
              {/* A plain `.plate` inside a rounded, clipped div — NOT
                  <Figure>. Figure finishes its entrance holding an
                  inline square `clip-path`, which beats `border-radius`
                  and cuts these corners back to right angles; it also
                  writes the image's transform from the page scroll,
                  which would silently beat the hover. */}
              <div className="group relative aspect-16/10 w-full overflow-hidden rounded-xl bg-ink-3">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  sizes="(min-width: 768px) 31vw, 100vw"
                  /* Graded, never dimmed. Several of these rooms are
                     exposed near black to begin with, and nothing is
                     laid over them here — every caption is below the
                     picture — so brightness stays at 1 and the grading
                     is a contrast lift only.

                     `maxWidth: none` is not optional: Tailwind's
                     preflight sets `img { max-width: 100% }`, which
                     clamps a scaled plate back to its frame without a
                     trace. */
                  className="plate absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-quint)] group-hover:scale-[1.04] [--plate-contrast:1.04] [--plate-saturate:0.96]"
                  style={{ maxWidth: 'none' }}
                />
              </div>

              {/* THE CAPTION ROW. What kind of room this is on the
                  left, what the picture actually is on the right —
                  the two things a plate in an editorial spread is
                  captioned with, on one rule under the photograph.
                  The disclosure lives here rather than on the image
                  because a mark laid over a room this expensive is
                  the app-chrome failure, and because a caption is
                  where a reader already looks for provenance. */}
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[var(--rule)] pt-3">
                <span className="t-label text-fog">{item.label}</span>
                {item.reference && (
                  <span className="t-num inline-flex items-center gap-2 text-[0.6875rem] whitespace-nowrap text-mist">
                    <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-cove" />
                    {possibilities.badge}
                  </span>
                )}
              </div>

              {/* The line the room is FOR, which is the sentence the
                  section was briefed on. It replaced `item.title`
                  here: a card carrying both a name and a claim makes
                  the reader choose which one is the headline, and on
                  a page selling rooms it is always the claim. */}
              <h3 className="mt-4 font-display text-[clamp(1.35rem,1.9vw,1.75rem)] leading-[1.15] tracking-[-0.018em] text-pure">
                {item.line}
              </h3>

              <ul className="mt-5 space-y-3">
                {specs(item.meta).map((s) => (
                  <li key={s} className="flex items-start gap-3 text-fog">
                    <Check />
                    <span className="text-[0.8125rem] leading-[1.45]">{s}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Rise>

        {/* The way out. Navigation, not an ask — the homepage carries
            no closing CTA on purpose (see HomePage.jsx), so this is a
            route to the catalogue. */}
        <div className="mt-16 lg:mt-20">
          <Link
            to={possibilities.link.to}
            className="link-underline t-label focus-ring inline-block text-fog"
          >
            {possibilities.link.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
