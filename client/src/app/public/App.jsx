import { Suspense, useEffect, useState } from 'react'
import { useLenis } from '@/features/public/hooks/useLenis'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { ScrollTrigger } from '@/lib/animation/gsap'

import { RouteProvider } from '@/features/public/router/PageTransition'
import { useRoute } from '@/features/public/router/routeContext'
import Nav from '@/features/public/layouts/Nav'
import BrandIntroReveal from '@/features/public/components/BrandIntroReveal'
import FloatingChatWidget from '@/features/public/components/FloatingChatWidget'
import { resolveRoute } from './routes'

/* Film grain, generated once as a data URI. A real grain plate would
   be another network request for something nobody consciously sees. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")"

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
