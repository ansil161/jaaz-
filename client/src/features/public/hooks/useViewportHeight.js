import { useEffect } from 'react'
import { ScrollTrigger } from '@/lib/animation/gsap'

/**
 * Publishes the real viewport height as `--app-h`.
 *
 * Neither CSS unit works for a pinned, full-bleed stage:
 *   - `100vh`/`100dvh` change every time a mobile URL bar collapses,
 *     which resizes a pinned section mid-scroll and makes it jump.
 *   - `100svh` is stable, but under-reports on desktop Chrome in some
 *     window configurations, leaving a strip of the next section
 *     visible below a hero that is supposed to fill the screen.
 *
 * So we measure once and only re-measure when the viewport WIDTH
 * changes — a genuine layout change (rotation, window resize) rather
 * than browser chrome sliding away under the user's thumb.
 */
export function useViewportHeight() {
  useEffect(() => {
    let lastWidth = window.innerWidth
    let applied = 0

    /* A minimised window, and some background/occluded tab states,
       report innerHeight 0. Writing that through would collapse every
       full-bleed stage to nothing — and because we only re-measure on
       width change, it would STAY collapsed after the window came back.
       So: never publish a non-positive height, and treat recovering
       from one as a reason to re-measure even if the width never moved. */
    const apply = () => {
      const h = window.innerHeight
      if (h <= 0) return false
      document.documentElement.style.setProperty('--app-h', `${h}px`)
      applied = h
      return true
    }

    const onResize = () => {
      const widthChanged = window.innerWidth !== lastWidth
      const recovering = applied === 0
      if (!widthChanged && !recovering) return
      lastWidth = window.innerWidth
      if (apply()) ScrollTrigger.refresh()
    }

    apply()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    document.addEventListener('visibilitychange', onResize)
    window.addEventListener('pageshow', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      document.removeEventListener('visibilitychange', onResize)
      window.removeEventListener('pageshow', onResize)
    }
  }, [])
}
