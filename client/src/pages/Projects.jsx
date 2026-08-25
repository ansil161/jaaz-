import ProjectsHero from '../components/projects/ProjectsHero'
import ProjectIndex from '../components/projects/ProjectIndex'
import ClosingCta from '../components/ui/ClosingCta'
import Footer from '../components/sections/Footer'
import { projectsCta } from '../data/projects'

/* ============================================================
   PROJECTS — THE COLLECTION

   One dark world, top to bottom, read as a sequence of rooms
   rather than browsed as a set of thumbnails.

   HERO       one photograph, one word.
   INDEX      the filter, then six chapters, each given a full
              screen of photograph before a single fact about
              it. A margin folio tracks where you are.
   CLOSE      the consultation.

   NO DIVIDERS BETWEEN SECTIONS. Sections on this site hand over
   by being covered — the next stage scrolls over the last one
   while it sinks and dims — and the only thing that marks a
   change is the light behind it. Same rule as /solutions.
   ============================================================ */

export default function Projects() {
  return (
    <>
      <ProjectsHero />
      <ProjectIndex />

      <ClosingCta
        heading={projectsCta.heading}
        body={projectsCta.body}
        primary={{ label: projectsCta.action, to: '/contact' }}
        reassurance={projectsCta.reassurance}
      />

      <Footer />
    </>
  )
}
