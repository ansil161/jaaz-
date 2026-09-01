/* The route table for the public site.
 *
 * Lifted out of App.jsx so that the component file describes the shell —
 * navigation, grain, intro overlay — and this one answers the single
 * question "what does this address render?". Nothing about the routing
 * changed in the move.
 *
 * `title` is applied on navigation, because a client-side route change does
 * not update the tab on its own and a stale title is the fastest way to make
 * a multi-page site feel like a single page pretending. */

import { lazy } from 'react'

import Home from '@/features/public/home/pages/HomePage'
import About from '@/features/public/about/pages/AboutPage'
import Contact from '@/features/public/contact/pages/ContactPage'
import Solutions from '@/features/public/solutions/pages/SolutionsPage'
import Rooms from '@/features/public/experience/pages/ExperiencePage'
import Projects from '@/features/public/projects/pages/ProjectsPage'
import ProjectDetail from '@/features/public/projects/pages/ProjectDetailPage'
import SolutionDetail from '@/features/public/solutions/pages/SolutionDetailPage'

import { projectBySlug } from '@/features/public/data/projects'
import { getSolution } from '@/features/public/data/solutions'

/* The walkthrough carries three.js and its addons — roughly 800KB before
   compression, which is more than the entire rest of the site put together.
   Imported statically it landed in the main bundle, so every visitor to the
   homepage downloaded a 3D engine for a page they may never open. Split out,
   it is fetched only when someone actually walks into the theatre. */
/* NOTE: the frame-sequence Experience Centre page is still being written. It
   was wired into the route table before the page existed, which took
   /experience and /theatre down completely: a lazy import of a missing module
   rejects, and nothing above it catches, so React unmounted the whole tree
   and served a blank document.

   Both routes point at the three.js walkthrough until that page lands. Put
   the new page back on them the moment it does — the data it is being built
   against (data/frames-manifest.json, now read through utils/frames.js) is
   untouched.

   `data/tonight.js` is GONE, and anything half-written against it has to be
   repointed: the homepage section it fed was replaced by <Snap>, whose
   content lives in data/snap.js. */
const House = lazy(() => import('@/features/public/house/pages/HousePage'))

const ROUTES = {
  '/': {
    component: Home,
    title: 'JAAZ — Private Home Entertainment',
    description:
      'JAAZ designs private cinemas and luxury home entertainment spaces where picture, sound and seating are engineered around one idea: comfort.',
  },
  '/about': {
    component: About,
    title: 'About — JAAZ',
    description:
      'JAAZ designs how entertainment spaces feel. One accountable team across design, acoustics, joinery, electronics and calibration.',
  },
  '/contact': {
    component: Contact,
    title: 'Contact — JAAZ',
    description:
      'Send JAAZ the room, the budget band and how you want to use it. One reply within a working day, from the person who would run the project.',
  },
  /* The Experience Centre IS the walkthrough. One continuous scroll from the
     approach, through the house, out to the terrace and back — not a page
     containing rooms. */
  '/experience': {
    component: House,
    title: 'The JAAZ Experience — Walk Through the House',
    description:
      'Scroll to walk through a luxury residence. The scroll is the camera: cinematic sequences of the living space, private cinema, terrace, gaming suite and listening room.',
  },

  /* The older section-based build, kept as a reference sheet for
     specifications rather than as a competing journey. It is not in the main
     navigation. */
  '/rooms': {
    component: Rooms,
    title: 'Rooms & Specifications — JAAZ',
    description:
      'Room-by-room detail for the JAAZ Experience Centre: configurations, products, materials and specifications.',
  },
  /* Kept as an alias. Both prototypes were shared under this URL and a link
     handed to someone should not start 404-ing because the work moved past
     it. */
  '/theatre': {
    component: House,
    title: 'The JAAZ Experience — Walk Through the House',
    description: 'Scroll to walk through a luxury residence. The scroll is the camera.',
  },

  /* The superseded three.js build, reachable for comparison and absent from
     the navigation. */
  '/walkthrough-3d': {
    component: House,
    title: 'Walkthrough (3D) — JAAZ',
    description: 'The earlier real-time 3D walkthrough of the residence, kept for comparison.',
  },
  '/solutions': {
    component: Solutions,
    title: 'Solutions — JAAZ',
    description:
      'Nine ways to build the room you want, from a full dedicated cinema to a living room upgrade — quoted, engineered and signed off on its own.',
  },
  '/projects': {
    component: Projects,
    title: 'Projects — JAAZ',
    description:
      'Rooms JAAZ has finished and handed over: private theatres, gaming rooms, bars, living-room systems and terrace cinemas, photographed as built.',
  },
}

/* Every project is a page, and there are six of them today and more later, so
   they are matched rather than listed. The title and description are built
   from the project's own data for the same reason the static table has them
   at all: a client-side route change does not update the tab or the meta
   description on its own, and six pages all reading "Projects — JAAZ" is the
   version of this that looks fine in the browser and wrong in a search
   result. */
function resolveProject(path) {
  const [, section, slug, ...rest] = path.split('/')
  if (section !== 'projects' || !slug || rest.length) return null

  const project = projectBySlug(slug)
  if (!project) return null

  return {
    component: ProjectDetail,
    title: `${project.flatTitle} — ${project.category}, ${project.location} — JAAZ`,
    description: project.summary,
  }
}

/* Same reasoning as resolveProject, one catalogue over. The nine solutions
   each carry a full specification, a fit list and a gallery, and none of it
   had anywhere to live: /solutions/<slug> was never routed, so the index's
   only way onward was the contact form. A visitor who wants to know what is
   IN a solution before asking for a survey now has a page to read, and a
   place to link someone to. */
function resolveSolution(path) {
  const [, section, slug, ...rest] = path.split('/')
  if (section !== 'solutions' || !slug || rest.length) return null

  const solution = getSolution(slug)
  if (!solution) return null

  return {
    component: SolutionDetail,
    title: `${solution.title} — Solutions — JAAZ`,
    description: solution.sub,
  }
}

export function resolveRoute(path) {
  if (ROUTES[path]) return ROUTES[path]

  const project = resolveProject(path)
  if (project) return project

  const solution = resolveSolution(path)
  if (solution) return solution

  /* An address under /solutions that names nothing lands on the catalogue,
     for the same reason an unknown project lands on the collection. */
  if (path.startsWith('/solutions/')) return ROUTES['/solutions']

  /* An unrecognised project address lands on the collection rather than the
     homepage — it is the nearest thing to what was asked for, and it is a
     page the visitor can act on. */
  if (path.startsWith('/projects/')) return ROUTES['/projects']

  /* Every other unknown path renders the homepage rather than a dead end. */
  return ROUTES['/']
}
