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

   The wall is one scroll-coupled rail instead of a static grid
   of tiles. Two reasons: it stops sixteen names from reading as
   a ranked league table, and the rail only surges while you are
   moving, so the section stays quiet the moment you stop to read
   it — which is the right hierarchy for a page where the
   technology is explicitly not the hero.

   Names only. What JAAZ specifies — projectors, screens, speakers
   — is the homepage technology chapter's job, and the link at the
   foot of this section is how you get there.
   ============================================================ */

export default function Partners() {
  return (
    <section
      id="partners"
      /* Closes tighter than it opens. The footer draws its own
         hairline and carries its own top padding, so a full py-36
         here only widens a gap that is already generous. */
      className="relative bg-ink-2 pt-28 pb-20 sm:pt-36 sm:pb-24"
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

      {/* --- The names, and only the names. The product categories
              this used to open with (projectors, screens, speakers)
              belong to the homepage technology chapter, which the
              link below goes to; repeating them here made the
              section answer a question it had not been asked. --- */}
      <Rise className="mt-16 border-y border-white/10 py-7" y={18}>
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
