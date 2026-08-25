import Overture from '../components/solutions/Overture'
import Chapters from '../components/solutions/Chapters'
import SolutionsIndex from '../components/solutions/SolutionsIndex'
import ClosingCta from '../components/ui/ClosingCta'
import Footer from '../components/sections/Footer'
import { solutionsIndex } from '../data/solutions'

/* ============================================================
   SOLUTIONS — INDEX

   One dark world, top to bottom, read as a sequence of rooms.

   OVERTURE   one room, held, and the headline.
   CHAPTERS   the nine, in catalogue order, each given a screen
              of its own and about two screens of scroll. Each
              sticks, drifts, and is covered by the next.
   CLOSE      all nine at one size, then the consultation.

   NO SECTION DIVIDERS
   The previous build poured an <OrganicWave> between every
   change of material and inverted to paper in the middle. Both
   are gone. Sections here hand over by being covered — the next
   stage scrolls over the last one while it sinks and dims — and
   the only thing that marks a change is the light behind it.
   That is the whole point of the redesign: separation by
   composition and atmosphere, never by a drawn edge.
   ============================================================ */

export default function Solutions() {
  return (
    <>
      <Overture />
      <Chapters />
      <SolutionsIndex />

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
