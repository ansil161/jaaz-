import { consultation } from '@/features/public/data/contact'
import { Lines, Figure } from '@/features/public/components/Motion'
import Wizard from './Wizard'

/* ============================================================
   CONTACT — HERO + WIZARD

   Matches the reference top to bottom: a rounded eyebrow pill,
   a two-line headline whose second line turns italic and warm,
   a sentence of sub copy beside a held photograph carrying its
   own small pill badge, and — the point of the page — the
   wizard panel sitting directly under the headline rather than
   scrolled to.

   On paper, not ink: the reference's whole contact page runs on
   a warm off-white, and this site's own `--color-paper` sits
   close enough to that same warmth that no new token was needed
   to match it — see the long note on `--color-cove` in
   ClosingCta.jsx for how deliberately that palette was already
   lifted from this exact reference.
   ============================================================ */

export default function ConsultationHero() {
  return (
    <section className="on-paper relative overflow-hidden bg-paper pt-32 pb-20 text-ink sm:pt-40 sm:pb-28">
      <div className="shell-wide">
        <span className="t-label inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-ink/60">
          <span className="h-1.5 w-1.5 rounded-full bg-ink/50" aria-hidden="true" />
          {consultation.eyebrow}
        </span>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Lines as="h1" className="t-hero text-ink" stagger={0.1}>
              {consultation.headline.map((l, i) => (
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
          </div>
          <div className="flex items-end lg:col-span-4 lg:col-start-9">
            <Lines as="p" className="t-sub text-ink/60">
              {consultation.sub}
            </Lines>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Wizard />
          </div>

          <div className="relative lg:col-span-5">
            <Figure
              src={consultation.photo.src}
              alt={consultation.photo.alt}
              className="aspect-[4/5] h-full w-full rounded-2xl"
              parallax={6}
            />
            <span className="t-label absolute top-5 right-5 rounded-full border border-white/25 bg-ink/50 px-3.5 py-2 text-pure backdrop-blur-md">
              {consultation.photo.badge}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
