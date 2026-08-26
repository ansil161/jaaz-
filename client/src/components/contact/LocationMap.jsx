import { mapPanel } from '../../data/contact'
import { Icon } from './icons'

/* ============================================================
   MAP — the studio location, on ink.

   A plain Google Maps embed (the `output=embed` URL form needs
   no API key) rather than a static plate — the reference runs a
   real, pannable map here too, and a screenshot of one would be
   the one place on this page that looks like it is pretending.
   ============================================================ */

export default function LocationMap() {
  return (
    <section className="relative border-t border-white/10 bg-ink">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        <iframe
          title="JAAZ Experience Centre — Marine Drive, Kochi"
          src={mapPanel.embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full grayscale invert-[0.92] contrast-[0.9]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"
        />

        <a
          href={mapPanel.mapsHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring absolute bottom-6 left-6 inline-flex items-center gap-2.5 border border-white/20 bg-ink/70 px-5 py-3 text-pure backdrop-blur-md transition-colors duration-400 hover:bg-ink sm:bottom-9 sm:left-9"
        >
          <Icon name="pin" size={15} />
          <span className="t-label">Open in Google Maps</span>
        </a>
      </div>
    </section>
  )
}
