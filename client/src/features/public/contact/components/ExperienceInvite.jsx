import { experience } from '@/features/public/data/contact'
import { Lines, Rise, Drift, Figure } from '@/features/public/components/Motion'

/* ============================================================
   EXPERIENCE — the invitation to visit, on ink.

   Matches the reference's "Experience Glaze in person" panel:
   a dark section between the info strip and the FAQ, headline
   with its second line in the site's own cove-coloured italic,
   two photographs at different heights rather than a matched
   pair — the same "a tidy grid is the clearest tell of a
   template" instinct the rest of this site already follows.
   ============================================================ */

export default function ExperienceInvite() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-ink py-24 sm:py-32">
      <div className="shell-wide grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <Lines as="h2" className="t-display text-pure" stagger={0.11}>
            {experience.heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? (
                  <em className="italic-display" style={{ color: 'var(--color-cove)' }}>
                    {l}
                  </em>
                ) : (
                  l
                )}
              </span>
            ))}
          </Lines>

          <Lines as="p" className="t-body mt-6 max-w-sm text-fog">
            {experience.body}
          </Lines>

          <Rise className="mt-8" y={14}>
            <a href={experience.cta.href} className="link-underline t-label focus-ring text-pure">
              {experience.cta.label} →
            </a>
          </Rise>
        </div>

        <div className="relative grid grid-cols-2 gap-5 lg:col-span-6">
          <Figure
            src={experience.photos[0].src}
            alt={experience.photos[0].alt}
            className="aspect-[4/5] w-full"
            parallax={6}
          />
          <Drift y={5} className="mt-10">
            <Figure
              src={experience.photos[1].src}
              alt={experience.photos[1].alt}
              className="aspect-[3/4] w-full"
              parallax={8}
            />
          </Drift>
        </div>
      </div>
    </section>
  )
}
