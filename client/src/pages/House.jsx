import { Link } from '../components/chrome/PageTransition'
import HouseExperience from '../components/house/HouseExperience'

/* ============================================================
   THE EXPERIENCE CENTRE — the house itself

   Almost nothing but the walk. No hero, no introduction, no
   sections stacked above or below it: the journey starts on the
   approach at the first pixel of the page and ends on the terrace
   looking back at the lit house, and the only thing after it is
   the question the walk was making the case for.

   That emptiness is the point. If this needed a headline above it
   to explain itself, the walkthrough would not have worked.
   ============================================================ */

export default function House() {
  return (
    <>
      <HouseExperience />

      <section className="relative border-t border-white/10 bg-ink py-20 sm:py-28">
        <div className="shell-wide flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="t-display max-w-2xl text-pure">
              <span className="block">You have just walked</span>
              <span className="block">
                through your <em className="italic-display text-cove">house.</em>
              </span>
            </h2>
            <p className="t-body mt-6 max-w-md text-mist">
              Send us the room as it stands today — a photograph, a plan, or the dimensions on the
              back of an envelope. We will show you what it could hold.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <Link to="/contact#consultation" className="btn-flat focus-ring">
              Design your experience
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="square"
                aria-hidden="true"
                className="btn-flat-arrow shrink-0"
              >
                <path d="M2.5 8h10.5" />
                <path d="M9 4l4 4-4 4" />
              </svg>
            </Link>

            <Link to="/rooms" className="cta-footnote focus-ring">
              Room details and specifications
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
