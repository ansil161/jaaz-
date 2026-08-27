import Catalogue from '../components/solutions/Catalogue'
import ClosingCta from '../components/ui/ClosingCta'
import Footer from '../components/sections/Footer'
import { solutionsIndex } from '../data/solutions'

/* ============================================================
   SOLUTIONS — THE CATALOGUE

   CATALOGUE  the headline, then all nine as cards: a
              photograph, what it touches, what band it costs
              in, and a way into its own page.
   CTA        the consultation, which is what the page is for.

   The closing "all nine in one place" list that used to sit at
   the bottom has gone with the lens it was closing. It existed
   because the lens showed one solution at a time, and someone
   thirteen screens down should not have had to scroll back up
   to reach the room they liked. A page that already shows all
   nine at once does not owe anyone a second list of them.

   `components/solutions/Lens.jsx` and `LensStack.jsx` are still
   on disk and no longer routed. They are the pinned-aperture
   build this replaced, kept rather than deleted only because
   they are not in git yet.
   ============================================================ */

export default function Solutions() {
  return (
    <>
      <Catalogue />

      <ClosingCta
        heading={solutionsIndex.cta.heading}
        body={solutionsIndex.cta.body}
        primary={{ label: solutionsIndex.cta.action, to: '/contact' }}
        reassurance={solutionsIndex.cta.reassurance}
      />

      <Footer />
    </>
  )
}
