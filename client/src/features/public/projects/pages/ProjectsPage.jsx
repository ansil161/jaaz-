import ProjectsHero from '@/features/public/projects/components/ProjectsHero'
import ProjectIndex from '@/features/public/projects/components/ProjectIndex'
import ClosingCta from '@/features/public/components/ClosingCta'
import Footer from '@/features/public/layouts/Footer'
import { projectsCta } from '@/features/public/data/projects'

/* ============================================================
   PROJECTS — THE COLLECTION

   One dark world, top to bottom, built on a single contrast:
   one project at full size, everything else at card size.

   HERO       one photograph, one word.
   INDEX      the filter, then the lead project — a full screen
              of photograph, a sticky running head and three
              screens of scroll — and under it the rest of the
              work as photograph-led cards in a dropped two-
              column stagger.
   CLOSE      the consultation.

   The fixed `01 / 06` margin folio that used to ride this page
   is gone with the six equal chapters it was reporting on.
   There is one chapter now, and a grid underneath it has no
   single "where am I" to report — two cards sit side by side.
   The count in the filter row carries what is left of that job.

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
