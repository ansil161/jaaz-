import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { useLenis } from '@/features/public/hooks/useLenis'
import { gsap, ScrollTrigger } from '@/lib/animation/useGsap'
import Engineering from '@/features/public/home/components/Engineering'
import Comfort from '@/features/public/home/components/Comfort'
import Feeling from '@/features/public/home/components/Feeling'

/* ============================================================
   /chapters.html — the three new homepage chapters on their own

   Engineering, Comfort and Feeling, in the order they run on the
   page, with nothing else mounted.

   IT EXISTS BECAUSE THE HOMEPAGE CANNOT BE DRIVEN THROUGH THE
   BROWSER MCP. With the hero's scene, <Prism> and <Calibration>
   all mounted, `Runtime.evaluate` on `/` times out — with or
   without the section under review present, so it is the page
   and not the new code. A document carrying three unpinned
   sections answers instantly and measures correctly.

   `?reduced=1` (patched in chapters.html, ahead of every module)
   is what makes a screenshot honest. Screenshotting puts the tab
   at `visibilityState: hidden`, which stops rAF, which stops
   GSAP's ticker — so every `once: true` entrance stays at its
   from-state and three perfectly good sections photograph as
   empty black. None of these three is pinned or scrubbed, so the
   reduced-motion branch is the same composition with the
   entrances already resolved, which is exactly what wants
   looking at.

   WHAT THIS HARNESS CANNOT SHOW YOU, and both have caught
   regressions on this site before:
   - the site header, a SOLID black bar to y=86 that eats the top
     of any section arriving under it;
   - the floating "Ask JAAZ AI" pill at `fixed bottom-6 right-6
     z-[80]`, which silently swallows clicks on anything placed
     in that corner. <Feeling>'s control is in the left column
     partly for that reason, but check it on `/` as well.

   Dev-only. `vite.config.js` lists three build inputs and this
   is not one of them, so it never ships.
   ============================================================ */

document.documentElement.classList.remove('no-js')

/* The scrub handles, for the same reason prism-preview.jsx exposes
   them: setting a scroll position and calling `__ST.update()` by
   hand runs every trigger against the real playhead without needing
   a frame the hidden tab will not give us. */
window.__ST = ScrollTrigger
window.__gsap = gsap

function Preview() {
  useViewportHeight()
  useLenis()

  return (
    <>
      <div className="shell-wide t-label flex h-screen items-end bg-ink pb-20 text-mist">
        scroll down
      </div>
      <Engineering />
      <Comfort />
      <Feeling />
      <div className="shell-wide t-label flex h-screen items-start bg-ink pt-20 text-mist">
        testimonials
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)

/* Exported only to satisfy the fast-refresh rule — an entry file
   that renders a component it does not export is the one shape
   `react/only-export-components` flags. Nothing imports this. */
export default Preview
