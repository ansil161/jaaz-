import { lazy, Suspense, useEffect, useState } from 'react'
import { useLenis } from './lib/useLenis'
import { useViewportHeight } from './lib/useViewportHeight'
import { ScrollTrigger } from './lib/gsap'

import { RouteProvider } from './components/chrome/PageTransition'
import { useRoute } from './lib/route'
import Nav from './components/chrome/Nav'
import BrandIntroReveal from './components/chrome/BrandIntroReveal'
import FloatingChatWidget from './components/chrome/FloatingChatWidget'

import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Solutions from './pages/Solutions'
import Rooms from './pages/Experience'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import SolutionDetail from './pages/SolutionDetail'
import { projectBySlug } from './data/projects'
import { getSolution } from './data/solutions'
/* The walkthrough carries three.js and its addons — roughly
   800KB before compression, which is more than the entire rest of
   the site put together. Imported statically it landed in the main
   bundle, so every visitor to the homepage downloaded a 3D engine
   for a page they may never open. Split out, it is fetched only
   when someone actually walks into the theatre. */
/* NOTE: `./pages/Cinema` — the frame-sequence Experience Centre —
   is still being written. It was wired into the route table here
   before the page existed, which took /experience and /theatre
   down completely: a lazy import of a missing module rejects, and
   nothing above it catches, so React unmounted the whole tree and
   served a blank document.

   Both routes point at the three.js walkthrough until that page
   lands. Put `Cinema` back on them the moment it does — the data
   it is being built against (data/tonight.js,
   data/frames-manifest.json, components/cinema/) is untouched. */
const House = lazy(() => import('./pages/House'))

/* Film grain, generated once as a data URI. A real grain plate would
   be another network request for something nobody consciously sees. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

/* One entry per page. `title` is applied on navigation, because a
   client-side route change does not update the tab on its own and a
   stale title is the fastest way to make a multi-page site feel like
   a single page pretending. */
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
  /* The Experience Centre IS the walkthrough. One continuous
     scroll from the approach, through the house, out to the
     terrace and back — not a page containing rooms. */
  '/experience': {
    component: House,
    title: 'The JAAZ Experience — Walk Through the House',
    description:
      'Scroll to walk through a luxury residence. The scroll is the camera: cinematic sequences of the living space, private cinema, terrace, gaming suite and listening room.',
  },

  /* The older section-based build, kept as a reference sheet for
     specifications rather than as a competing journey. It is not
     in the main navigation. */
  '/rooms': {
    component: Rooms,
    title: 'Rooms & Specifications — JAAZ',
    description:
      'Room-by-room detail for the JAAZ Experience Centre: configurations, products, materials and specifications.',
  },
  /* Kept as an alias. Both prototypes were shared under this URL
     and a link handed to someone should not start 404-ing because
     the work moved past it. */
  '/theatre': {
    component: House,
    title: 'The JAAZ Experience — Walk Through the House',
    description:
      'Scroll to walk through a luxury residence. The scroll is the camera.',
  },

  /* The superseded three.js build, reachable for comparison and
     absent from the navigation. */
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

/* Every project is a page, and there are six of them today and more
   later, so they are matched rather than listed. The title and
   description are built from the project's own data for the same
   reason the static table has them at all: a client-side route change
   does not update the tab or the meta description on its own, and six
   pages all reading "Projects — JAAZ" is the version of this that
   looks fine in the browser and wrong in a search result. */
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

/* Same reasoning as resolveProject, one catalogue over. The nine
   solutions each carry a full specification, a fit list and a
   gallery, and none of it had anywhere to live: /solutions/<slug>
   was never routed, so the index's only way onward was the contact
   form. A visitor who wants to know what is IN a solution before
   asking for a survey now has a page to read, and a place to link
   someone to. */
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

function resolveRoute(path) {
  if (ROUTES[path]) return ROUTES[path]

  const project = resolveProject(path)
  if (project) return project

  const solution = resolveSolution(path)
  if (solution) return solution

  /* An address under /solutions that names nothing lands on the
     catalogue, for the same reason an unknown project lands on the
     collection. */
  if (path.startsWith('/solutions/')) return ROUTES['/solutions']

  /* An unrecognised project address lands on the collection rather
     than the homepage — it is the nearest thing to what was asked
     for, and it is a page the visitor can act on. */
  if (path.startsWith('/projects/')) return ROUTES['/projects']

  /* Every other unknown path renders the homepage rather than a dead end. */
  return ROUTES['/']
}

function Page() {
  const { path } = useRoute()
  const route = resolveRoute(path)
  const View = route.component

  useEffect(() => {
    document.title = route.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', route.description)
  }, [route])

  /* Remeasuring after a route change is RouteProvider's job — it has to
     land on any anchor first, and a second refresh here would only
     measure the same tree again. */

  return (
    /* `key` forces a real unmount so every GSAP context from the
       outgoing page reverts — without it, ScrollTriggers from the old
       page survive and fight the new one's measurements. */
    <Suspense fallback={<div className="min-h-svh bg-ink" />}>
      <View key={path} />
    </Suspense>
  )
}

export default function App() {
  useViewportHeight()
  useLenis()

  /* The first-load reveal. State lives here, not inside the overlay,
     because App does not remount on a route change — so the sequence
     plays once per page load and a visitor moving between pages never
     sees it again. */
  const [intro, setIntro] = useState(true)

  /* Web fonts change line breaks, which changes every split-line
     measurement and every pin length on the page. Remeasure once
     they've actually landed. */
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <RouteProvider>
      <Nav />

      {/* tabIndex -1 so the router can move focus here after a route
          change without adding a tab stop for everyone else. */}
      <main id="main" tabIndex={-1} className="outline-none">
        <Page />
      </main>

      <FloatingChatWidget />

      <div className="grain-layer" style={{ backgroundImage: GRAIN }} aria-hidden="true" />

      {intro && (
        <BrandIntroReveal
          onComplete={() => {
            setIntro(false)
            /* The overlay held <html> at `overflow: hidden`, so while it
               was up the document had no scroll height and every pin on
               the page measured against something that could not move.
               Remeasure now that it can — this is the same debt the old
               <Preloader> settled on its way out. */
            ScrollTrigger.refresh()
          }}
        />
      )}
    </RouteProvider>
  )
}
