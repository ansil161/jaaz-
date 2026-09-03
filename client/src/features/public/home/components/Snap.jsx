import { snap as D } from '@/features/public/data/site'
import { useGsapScope, gsap, revealLines, revealBlock, prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   CHAPTER 02 — THE SNAP

   One room, shown as four. Nothing hidden, nothing performed.

   ------------------------------------------------------------
   WHAT THIS REPLACED, TWICE, ON THE SAME DAY.

   This section has been built as a film twice. The first version
   ran 3.4 viewports of pinned scroll with a drawn hand, a
   countdown to contact and a masked wipe, and put the pay-off in
   the last 40% of a pin most visitors never finished. The second
   was a scrubbed frame sequence with a one-frame blowout at the
   snap — measurably better, and still the wrong register: ansil
   ruled the whole thing out before it shipped.

   Their definition, in their own terms, of what is not allowed
   here: pinned or scroll-jacked sections, near-black screens and
   heavy shadow, film-style motion (beams, flashes, wipes,
   blowouts, scrubbed sequences), and huge display-serif
   statements filling a screen with nothing else on it.

   So there is NO PIN in this file, no canvas, no frame sequence,
   no flash, and the heading shares its row with a paragraph. The
   ground is paper, not black. What is left is the claim itself,
   photographed.

   ------------------------------------------------------------
   WHY THE SET IS SHOWN ALL AT ONCE

   The same reason <Calibration> shows both layouts side by side
   rather than behind a switch: a comparison you have to operate
   is a comparison you have to remember. Four states of one room,
   all on the page, is the whole argument delivered in one look.

   It is also what keeps this section distinct from <Scene>
   immediately below it. Scene is the CHOOSER — "choose the moment"
   — and it earns an interaction. This one only has to be true,
   so it has nothing to click.

   ------------------------------------------------------------
   THE LAYOUT IS EDITORIAL, NOT A CARD GRID.

   Four equal tiles of image-heading-text in a row is the default
   this brief is trying to escape; it reads as a feature grid on a
   SaaS page. The set is laid out as a spread instead — a wide
   frame, then two uprights offset against it, then a wide frame
   again — so the eye moves through the four in an order rather
   than scanning a row. The captions are plain type under each
   frame, with nothing drawn around them.

   ------------------------------------------------------------
   THE PHOTOGRAPHS ARE THE SECTION, AND THEY ARE NOT HERE YET.

   Four frames of the SAME room is the one thing the verified
   stock pool cannot supply — every plate in it is a different
   property, and four different rooms under a heading that says
   "one room" would make the section lie. `render` in the data
   names the asset each slot is waiting for; the interim plates
   are disclosed as reference under the set, in the same size
   type as the captions, for exactly as long as they are
   stand-ins. Delete `snap.note` when the renders land.
   ============================================================ */

/* The spread. `span` is the column count at `lg`, `lift` pulls a
   frame up against its neighbour so the row does not read as a
   row, and `ratio` is the frame's own aspect — mixed on purpose,
   because four identical crops is the card grid by another name. */
const SPREAD = [
  { span: 'lg:col-span-7', lift: '', ratio: '4 / 3' },
  { span: 'lg:col-span-5', lift: 'lg:mt-24', ratio: '4 / 5' },
  { span: 'lg:col-span-5', lift: '', ratio: '4 / 5' },
  { span: 'lg:col-span-7', lift: 'lg:-mt-24', ratio: '4 / 3' },
]

export default function Snap() {
  const root = useGsapScope((scope) => {
    revealLines(scope.querySelector('[data-title]'), { start: 'top 84%' })
    revealBlock(scope.querySelector('[data-rise="lead"]'), { start: 'top 84%', y: 20 })
    revealBlock(scope.querySelector('[data-rise="note"]'), { start: 'top 92%', y: 16 })

    /* The only motion in the section, and it is a REVEAL, not a
       scrub: each frame rises once as it arrives and is then left
       alone. No pin, no scroll-linked playback, nothing the
       visitor has to scroll through before they can continue.

       Each frame triggers on ITSELF rather than on the set — the
       spread is two screens tall on a laptop, and one trigger for
       all four would play the last two off the top of the
       viewport before anyone reached them. */
    if (prefersReducedMotion()) {
      gsap.set(scope.querySelectorAll('[data-world]'), { autoAlpha: 1, y: 0 })
      return
    }
    scope.querySelectorAll('[data-world]').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 30,
        duration: 1.05,
        ease: 'jaz',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    })
  }, [])

  return (
    <section
      ref={root}
      id={D.id}
      aria-label={D.heading.join(' ')}
      className="sheet on-paper py-24 text-ink sm:py-32 lg:py-40"
    >
      <div className="shell-wide">
        {/* The masthead, and the chapter mark that runs across the
            whole page. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--rule)] pb-5">
          <span className="t-label flex items-center gap-3 text-ink/60">
            {D.chapter}
            <span className="block h-px w-8 bg-ink/25" aria-hidden="true" />
            {D.label}
          </span>
          <span className="text-[0.8125rem] tabular-nums text-ink/60">
            {D.worlds.length} states · one room
          </span>
        </div>

        {/* The heading shares its row with the paragraph rather
            than owning a screen of its own — see the note at the
            top of this file about display-serif drama. */}
        <div className="mt-10 grid gap-7 sm:mt-14 lg:grid-cols-[1.22fr_1fr] lg:items-end lg:gap-20">
          <h2 data-title className="t-chapter text-balance">
            <span className="block text-ink/50">{D.heading[0]}</span>
            <span className="block text-ink">{D.heading[1]}</span>
          </h2>
          <p data-rise="lead" className="t-sub max-w-[46ch] text-ink/70 lg:pb-2">
            {D.intro}
          </p>
        </div>

        {/* ---------- The spread ---------- */}
        <div className="mt-14 grid gap-x-10 gap-y-14 sm:mt-20 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-20 xl:gap-x-20">
          {D.worlds.map((w, i) => (
            <figure key={w.n} data-world className={`${SPREAD[i].span} ${SPREAD[i].lift}`}>
              <div
                className="w-full overflow-hidden bg-bone"
                style={{ aspectRatio: SPREAD[i].ratio }}
              >
                <img
                  src={w.image}
                  alt={w.alt}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  /* Run at full brightness. Copy sits BESIDE these
                     frames, never on top of them, so there is
                     nothing to dim the photograph for — and several
                     plates in this pool are near-black already. */
                  className="plate h-full w-full object-cover"
                />
              </div>

              {/* Plain type under the frame. No box, no rule, no
                  hover card — the caption belongs to the picture,
                  not to a container drawn around both. */}
              <figcaption className="mt-5 flex items-start gap-4">
                <Mark name={w.icon} size={20} className="mt-0.5 shrink-0 text-ink/45" />
                <span>
                  <span className="block font-display text-[clamp(1.35rem,2vw,1.85rem)] leading-none text-ink">
                    {w.name}
                  </span>
                  <span className="mt-2.5 block max-w-[32ch] text-[0.9375rem] leading-relaxed text-ink/70">
                    {w.line}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* The disclosure. It goes when the renders land. */}
        {D.note && (
          <p
            data-rise="note"
            className="mt-14 max-w-[52ch] text-[0.8125rem] leading-relaxed text-ink/60 sm:mt-20"
          >
            {D.note}
          </p>
        )}
      </div>
    </section>
  )
}
