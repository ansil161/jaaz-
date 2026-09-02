import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { useLenis } from '@/features/public/hooks/useLenis'
import { gsap, ScrollTrigger } from '@/lib/animation/useGsap'
import Scene from '@/features/public/home/components/scene/Scene'

/* ============================================================
   /scene.html — the Scene Experience module on its own

   One section, a screen of nothing either side of it so the
   entrance has somewhere to start and somewhere to release into,
   and none of the rest of the homepage in the way.

   It earns its place beyond first review. The section has five
   scenes, five device states, a 1.5-second cascade and five
   manual controls behind a drawer — twenty-odd states that each
   have to be looked at, and reaching them by scrolling past six
   other sections every time is how looking at them stops
   happening.

   Dev-only: `vite.config.js` lists three build inputs and this is
   not one of them, so it never ships.

   ONE THING THIS HARNESS CANNOT SHOW YOU: the floating "Ask JAAZ
   AI" pill the site mounts at `fixed bottom-6 right-6 z-[80]`. It
   is not here, so a clearance regression looks fine in this
   preview and covers a control on the actual page.
   ============================================================ */

document.documentElement.classList.remove('no-js')

/* ------------------------------------------------------------
   THE HOOKS THIS HARNESS EXISTS TO PROVIDE

   Browser automation cannot watch this section run. Screenshotting
   puts the tab at `visibilityState: hidden`, which stops rAF,
   which stops GSAP's ticker — so a scene is chosen, the 1.5-second
   cascade never advances a frame, and the panel appears frozen
   halfway through a state it was never meant to hold.

   `?reduced=1` below is the honest way to screenshot the
   COMPOSITION: the reduced-motion branch sets every state at once
   and needs no ticker, and because this section is a composition
   with a cascade rather than a cascade with a composition, that
   branch shows the whole thing rather than a degraded version of
   it.

   `__ST` is for the arm-on-arrival trigger — set the scroll
   position, call `__ST.update()` by hand, and the section arms
   without waiting for a frame. `__gsap` is for driving a cascade
   at a chosen playhead rather than in real time.
   ------------------------------------------------------------ */
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
      <Scene />
      <div className="shell-wide t-label flex h-screen items-start bg-ink pt-20 text-mist">
        next section
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
   `react/only-export-components` flags, and this repo lints clean
   otherwise. Nothing imports this. */
export default Preview
