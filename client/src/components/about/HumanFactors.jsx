import { people } from '../../data/about'
import { Lines, Figure, Drift, Rule } from '../ui/Motion'
import { SectionLabel } from '../ui/Editorial'

/* ============================================================
   ABOUT 04 — DESIGNED AROUND PEOPLE

   Eyes, ears, body. Three columns, but deliberately not three
   equal tiles: each one starts lower than the last and travels
   at its own rate, so the triptych is never level and never
   locked.

   The staggered baseline is doing the argument's work. These are
   not three equal features in a grid — they are three systems
   that come into play one after another, and the layout reads
   in that order whether or not you read the copy.

   Each column now sits on a `panel-soft` surface with a
   `plate-soft` image: rounded, glass-hairlined, lifted off the
   black. That is a deliberate change of register from the rest
   of the page, which butts hard-edged photography into the grid.
   Here the three systems are being presented as a SET — three
   objects of the same make — and rounded, shadowed plates say
   that before any of the copy does.

   The title moved onto the plate rather than under it. It buys
   the column its full text measure back, and it is what makes
   each panel read as one object instead of a picture with a
   caption stack beneath it.
   ============================================================ */

/* Desktop-only vertical offsets. On a phone the column collapses to
   one measure and these would just be dead space. */
const OFFSET = ['lg:pt-0', 'lg:pt-28', 'lg:pt-56']
const DRIFT = [7, 4, 1.5]

export default function HumanFactors() {
  return (
    <section
      id="human-factors"
      className="relative overflow-hidden bg-ink py-28 sm:py-36"
    >
      {/* Two very low ambient washes — the warm one is the same cove
          hue every closing CTA glows with, so the section is lit
          rather than merely dark. Below the panels, above nothing. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background:radial-gradient(58rem_38rem_at_10%_-6%,rgba(201,173,124,0.07),transparent_62%),radial-gradient(52rem_38rem_at_94%_106%,rgba(255,255,255,0.055),transparent_66%)]"
      />

      <div className="shell-wide relative">
        <SectionLabel>{people.label}</SectionLabel>

        <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Lines as="h2" className="t-display max-w-[12ch] text-pure" stagger={0.11}>
            {people.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display">{line}</em> : line}
              </span>
            ))}
          </Lines>

          <Lines as="p" className="t-sub max-w-sm text-mist lg:pb-3">
            {people.intro}
          </Lines>
        </div>

        <Rule className="mt-16 text-pure" />

        <div className="mt-14 grid items-start gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-8">
          {people.parts.map((part, i) => (
            <Drift key={part.key} y={DRIFT[i]} className={OFFSET[i]}>
              <article className="group">
                <div className="panel-soft relative overflow-hidden p-3 sm:p-3.5">
                  {/* Sheen. Sits in the corner the eye enters from and
                      only resolves on hover, so the panel has somewhere
                      to go without anything moving. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-white/[0.07] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                  />

                  <div className="relative">
                    <Figure
                      src={part.image}
                      alt={part.imageAlt}
                      parallax={8}
                      className="plate-soft aspect-[4/3] w-full"
                      imgClassName="transition-[filter] duration-700 group-hover:[--plate-brightness:1.07]"
                    >
                      {/* Grounds the title without dimming the room:
                          opaque at the base, gone by two-fifths up. */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                      />

                      <span className="t-num absolute top-4 left-4 inline-flex items-center rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[0.625rem] text-pure backdrop-blur-md">
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      <h3 className="absolute bottom-4 left-5 font-display text-[clamp(2rem,3.6vw,2.85rem)] leading-none text-pure">
                        {part.title}
                      </h3>
                    </Figure>
                  </div>

                  <div className="relative flex flex-col px-2 pt-7 pb-3 sm:px-3">
                    <p className="t-sub text-bone">{part.lede}</p>
                    <p className="t-body mt-4 text-mist">{part.body}</p>

                    {/* The detail line was one interpunct-separated
                        string. Broken into chips it reads as a spec
                        rather than as a caption, which is what the
                        column is actually listing. */}
                    <ul className="mt-8 flex flex-wrap gap-2">
                      {part.detail.split('·').map((chip) => (
                        <li
                          key={chip}
                          className="t-label rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[0.6rem] tracking-[0.16em] text-fog"
                        >
                          {chip.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Drift>
          ))}
        </div>
      </div>
    </section>
  )
}
