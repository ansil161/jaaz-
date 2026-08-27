import { technology } from '../../data/site'
import { Lines, Rule, Marquee } from '../ui/Motion'

/* ============================================================
   07 — TECHNOLOGY & BRANDS
   Credibility, stated quietly — and now entirely in motion.

   The nine categories run as an endless rail in display type,
   so the breadth is felt rather than counted. The partner
   brands below used to sit still, in a hairline grid — a
   held, static credential list directly under a section whose
   whole other half was already sliding. Now they run as two
   more rails, travelling opposite directions, so the section
   reads as one continuous drift rather than a rail stacked on
   top of a static block. Still no logo files, no mismatched
   sizes, no colour creeping into a black-and-white page — the
   wordmarks are exactly what the grid used to hold, just never
   at rest.
   ============================================================ */

/** Split a flat list into two roughly even halves — one rail each. */
function splitInHalf(list) {
  const mid = Math.ceil(list.length / 2)
  return [list.slice(0, mid), list.slice(mid)]
}

export default function Technology() {
  return (
    <section id="technology" className="relative overflow-hidden bg-ink py-28 sm:py-36">
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{technology.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-heading col-span-12 text-bone lg:col-span-7">
            {technology.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display text-pure">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines as="p" className="t-body col-span-12 max-w-md text-mist lg:col-span-4 lg:col-start-9">
            {technology.intro}
          </Lines>
        </div>
      </div>

      {/* ---- Categories, on an endless rail ---- */}
      <div className="mt-20 border-y border-white/10 py-8 sm:mt-24 sm:py-10">
        <Marquee duration={46}>
          {technology.categories.map((c) => (
            <span key={c} className="flex items-center whitespace-nowrap">
              <span className="t-heading px-6 text-bone/85 sm:px-9">{c}</span>
              <span
                className="h-1 w-1 shrink-0 rounded-full bg-ash"
                aria-hidden="true"
              />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ---- The brand wall, now two rails instead of a held grid ---- */}
      <div className="mt-20 sm:mt-24">
        <div className="shell-wide flex items-baseline justify-between gap-6">
          <span className="t-label text-ash">Selected partners</span>
          <span className="t-num text-xs text-ash">
            {String(technology.brands.length).padStart(2, '0')} of 40+
          </span>
        </div>

        {/* Two rails, opposite directions, so the eye reads the section
            as one continuous drift rather than a moving half stacked on
            a still one. Slower and quieter than the categories rail
            above it — `t-label` rather than `t-heading`, and a longer
            duration — because this is the credential list, not the
            headline; it should recede behind the categories, not
            compete with them. */}
        <div className="mt-8 flex flex-col gap-3 border-y border-white/10 py-7 sm:mt-10 sm:gap-4 sm:py-9">
          {splitInHalf(technology.brands).map((row, i) => (
            <Marquee key={i} duration={54} reverse={i === 1}>
              {row.map((b) => (
                <span key={b} className="flex items-center whitespace-nowrap">
                  <span className="t-label px-4 text-pure font-bold tracking-[0.2em] text-sm sm:px-6">
                    {b}
                  </span>
                  <span className="px-3 text-xs text-[#c9ad7c] opacity-80 sm:px-5" aria-hidden="true">✦</span>
                </span>
              ))}
            </Marquee>
          ))}
        </div>
      </div>
    </section>
  )
}
