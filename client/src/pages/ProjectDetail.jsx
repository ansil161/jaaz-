import { useRoute } from '../lib/route'
import { projectBySlug, nextProject, projectsCta, projects } from '../data/projects'
import DetailHero from '../components/projects/DetailHero'
import DetailOverview from '../components/projects/DetailOverview'
import DetailGallery from '../components/projects/DetailGallery'
import DetailTechnology from '../components/projects/DetailTechnology'
import DetailNext from '../components/projects/DetailNext'
import ClosingCta from '../components/ui/ClosingCta'
import Footer from '../components/sections/Footer'

/* ============================================================
   ONE PROJECT

   HERO        the photograph, full screen, with the name on it.
   OVERVIEW    the statement, two paragraphs, the spec block.
   GALLERY     five plates at four different sizes.
   TECHNOLOGY  what was delivered, as a ruled schedule.
   NEXT        the closing full-screen frame, which is also the
               way onward.
   CLOSE       the consultation.

   The slug is read from the route here rather than passed down
   as a prop, because this codebase's router hands pages a path
   and nothing else — see components/chrome/PageTransition. App
   has already resolved the slug to a real project before
   choosing this component, so the guard below only ever fires
   if someone renders it directly; it renders the collection
   rather than an error, which is the only useful thing a
   portfolio can do with an address it does not recognise.
   ============================================================ */

export default function ProjectDetail() {
  const { path } = useRoute()
  const slug = path.split('/').filter(Boolean)[1]
  const project = projectBySlug(slug) ?? projects[0]
  const next = nextProject(project.slug)

  return (
    <>
      <DetailHero project={project} />
      <DetailOverview project={project} />
      <DetailGallery items={project.gallery} />
      <DetailTechnology items={project.technology} />
      <DetailNext project={next} />

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
