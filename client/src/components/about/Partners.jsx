import { partners } from '../../data/about'
import { technology } from '../../data/site'
import { Lines, Marquee, Rise } from '../ui/Motion'
import { SectionLabel, ConfirmNote } from '../ui/Editorial'
import { Link } from '../chrome/PageTransition'

/* ============================================================
   ABOUT 10 — TECHNOLOGY PARTNERS

   A logo wall is a claim about a commercial relationship, so the
   list itself is marked for confirmation rather than presented
   as settled fact.

   The wall is set as scroll-coupled rails instead of a static
   grid of tiles. Two reasons: it stops nine or sixteen names
   from reading as a ranked league table, and the rails only
   surge while you are moving, so the section stays quiet the
   moment you stop to read it — which is the right hierarchy for
   a page where the technology is explicitly not the hero.
   ============================================================ */

export default function Partners() {
  return (
    <section
      id="partners"
      className="relative bg-ink-2 py-28 sm:py-36"
    >
      <div className="shell-wide">
        <SectionLabel>{partners.label}</SectionLabel>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <Lines
            as="h2"
            className="t-heading text-pure lg:col-span-6"
            stagger={0.11}
          >
            {partners.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display">{line}</em> : line}
              </span>
            ))}
          </Lines>

          <Lines as="p" className="t-body max-w-md text-mist lg:col-span-5 lg:col-start-8">
            {partners.intro}
          </Lines>
        </div>
      </div>

      {/* --- Categories. What we specify, before who makes it. --- */}
      <Rise className="mt-16" y={18}>
        <Marquee duration={54} className="py-2">
          {technology.categories.map((c) => (
            <span
              key={c}
              className="font-display px-8 text-[clamp(1.6rem,3vw,2.6rem)] leading-none text-bone/70 sm:px-12"
            >
              {c}
            </span>
          ))}
        </Marquee>
      </Rise>

      {/* --- The names, running the other way. --- */}
      <Rise className="mt-6 border-y border-white/10 py-7" y={18}>
        <Marquee duration={64} reverse>
          {technology.brands.map((b) => (
            <span key={b} className="t-label px-7 text-ash sm:px-10">
              {b}
            </span>
          ))}
        </Marquee>
      </Rise>

      <div className="shell-wide mt-14">
        <ConfirmNote>{partners.note}</ConfirmNote>

        {/* The technology chapter lives on the homepage, so this has to
            cross pages before it scrolls — `#technology` alone would
            find nothing here and quietly do nothing. */}
        <Link
          to="/#technology"
          className="link-underline t-label focus-ring mt-10 inline-block text-pure"
        >
          {partners.cta}
          <span aria-hidden="true"> &#8594;</span>
        </Link>
      </div>
    </section>
  )
}
