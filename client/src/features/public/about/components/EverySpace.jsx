import { everySpace } from '@/features/public/data/about'
import { Lines, Figure, Drift } from '@/features/public/components/Motion'
import { SectionLabel, ConfirmNote } from '@/features/public/components/Editorial'

/* ============================================================
   ABOUT 05 — ONE BRAND. EVERY ENTERTAINMENT SPACE.

   The homepage browses these rooms one at a time, cinematically.
   Here the job is the opposite: show the whole range at once, so
   the claim in the heading is answered by the layout before it is
   answered by any copy.

   So this is an INDEX — six portrait plates read as a contact
   sheet, each one drifting at its own rate, numbered rather than
   captioned. It is the same six rooms in a completely different
   register.

   The plates are rounded and lifted (`plate-soft`, shared with
   Human Factors above) and carry their own label rather than
   handing it to a caption row underneath. Six images each with
   a two-line caption block below them made the grid read as a
   product listing; putting the name on the plate returns it to
   what it is meant to be — a set of rooms.

   The room name is always visible. Only the one-line note is
   held back until hover, and only on pointer devices: a hover
   reveal that hides real copy from touch is a bug, so the
   `[@media(hover:none)]` clause pins it open there.
   ============================================================ */

/* Column-alternating drift. Neighbouring plates never travel at the
   same rate, which is what keeps a six-up grid from reading as a
   static block of tiles. */
const DRIFT = [6, 2.5, 5, 3, 6.5, 2]

export default function EverySpace() {
  return (
    <section
      id="every-space"
      className="relative overflow-hidden bg-ink-2 py-28 sm:py-36"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(56rem_36rem_at_88%_-4%,rgba(201,173,124,0.06),transparent_62%),radial-gradient(48rem_34rem_at_4%_92%,rgba(255,255,255,0.05),transparent_68%)]"
      />

      <div className="shell-wide relative">
        <SectionLabel>{everySpace.label}</SectionLabel>

        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Lines as="h2" className="t-display max-w-[14ch] text-pure" stagger={0.11}>
            {everySpace.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display">{line}</em> : line}
              </span>
            ))}
          </Lines>

          <Lines as="p" className="t-sub max-w-sm text-mist lg:pb-3">
            {everySpace.intro}
          </Lines>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
          {everySpace.items.map((item, i) => (
            <li key={item.title}>
              {/* Every second plate hangs lower, so the rows never
                  resolve into a hard horizontal band. */}
              <Drift y={DRIFT[i]} className={i % 2 === 1 ? 'lg:pt-16' : ''}>
                <article className="group relative">
                  <Figure
                    src={item.image}
                    alt={`${item.title} — a JAAZ entertainment space`}
                    parallax={9}
                    className="plate-soft aspect-[3/4] w-full"
                    imgClassName="transition-[filter] duration-700 group-hover:[--plate-brightness:1.08]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                    />

                    <span className="t-num absolute top-3.5 left-3.5 inline-flex items-center rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[0.6rem] text-pure backdrop-blur-md sm:top-4 sm:left-4 sm:px-3 sm:py-1.5">
                      {item.n}
                    </span>

                    {/* The corner mark. Nothing here is a link yet, so
                        it is decorative and hidden from the reader —
                        it exists to give the hover somewhere to land. */}
                    <span
                      aria-hidden="true"
                      className="absolute top-3.5 right-3.5 hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 text-pure opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100 sm:top-4 sm:right-4 sm:flex"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-px group-hover:-translate-y-px"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      >
                        <path d="M4 12 12 4M6 4h6v6" />
                      </svg>
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <h3 className="font-display text-[clamp(1.1rem,2.1vw,1.9rem)] leading-none text-pure">
                        {item.title}
                      </h3>
                      <p className="t-label mt-2.5 max-w-[22ch] leading-[1.7] text-fog/80 normal-case tracking-[0.12em] opacity-0 transition-all duration-500 group-hover:opacity-100 sm:translate-y-1 sm:group-hover:translate-y-0 [@media(hover:none)]:opacity-100">
                        {item.note}
                      </p>
                    </div>
                  </Figure>
                </article>
              </Drift>
            </li>
          ))}
        </ul>

        {everySpace.note && <ConfirmNote className="mt-14">{everySpace.note}</ConfirmNote>}
      </div>
    </section>
  )
}
