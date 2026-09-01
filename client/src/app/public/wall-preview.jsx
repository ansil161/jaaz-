import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { ScrollTrigger } from '@/lib/animation/gsap'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { useLenis } from '@/features/public/hooks/useLenis'
import Possibilities from '@/features/public/home/components/Possibilities'

/* ============================================================
   /wall.html — Possibilities on its own

   One section, a screen of nothing either side of it so the pin
   has somewhere to start and somewhere to release into, and none
   of the rest of the homepage in the way. Same shape as
   `snap-preview.jsx`.

   It earns its place because the wall is the section on this page
   most likely to be tuned by eye: how much photograph is left
   above the caption, whether the header panel clears the stage,
   and where the traverse should end are all judgements you make by
   looking, and reaching it means scrolling past four other
   sections every time.

   TWO THINGS THIS HARNESS DOES NOT SHOW, both of which have bitten
   this section's neighbours: the homepage `<header>` is a SOLID
   black bar down to y=86, and `<FloatingChatWidget>` is fixed over
   the bottom-right corner. The stage's `pt-24` and the furniture's
   `right-[14rem]` exist for those two, and neither is here — check
   the section on `/` as well, never only in this harness.

   Dev-only: `vite.config.js` lists the real build inputs and this
   is not one of them, so it never ships.
   ============================================================ */

document.documentElement.classList.remove('no-js')

/**
 * /wall.html?p=0.45 — park the orbit at a fixed progress and stop.
 *
 * The only way to LOOK at a mid-transition frame of a pinned section
 * through the browser MCP. Screenshotting puts the tab at
 * `visibilityState: hidden`, which stops rAF, which stops GSAP's
 * ticker: the scrub never advances, the pin never applies, and the
 * capture shows the stage sitting in normal flow at whatever
 * progress it was built at. Driving the timeline's playhead directly
 * needs no ticker at all, and with the ticker frozen there is
 * nothing left to overwrite it.
 *
 * Scroll first, then set the playhead: with the pin inert the stage
 * has to be brought to the top of the window by ordinary scrolling
 * for the frame to be worth looking at.
 *
 * Dev-only, like the rest of this file — `vite.config.js` lists the
 * real build inputs and /wall.html is not one of them.
 */
function useFrozenProgress() {
  useEffect(() => {
    const raw = new URLSearchParams(location.search).get('p')
    if (raw === null) return
    const p = Math.min(1, Math.max(0, parseFloat(raw) || 0))
    const id = setTimeout(() => {
      const st = ScrollTrigger.getAll().find((s) => s.pin)
      const anim = st?.animation
      if (!anim) return
      window.scrollTo(0, st.start)
      /* KILL THE TRIGGER BEFORE MOVING THE PLAYHEAD, not after.
         A scrubbed ScrollTrigger owns a tween that drags the
         timeline toward wherever the scroll actually is, and it
         re-asserts that on the next scroll event — so setting
         `progress()` on a live trigger visibly animates back to 0
         and leaves the stage parked at the first station with a few
         stray sub-percent clip values on it. `kill(false, true)`
         drops the trigger and its scrub while leaving the timeline
         alive to be positioned by hand. */
      st.kill(false, true)
      anim.progress(p)
    }, 700)
    return () => clearTimeout(id)
  }, [])
}

function Preview() {
  useViewportHeight()
  useLenis()
  useFrozenProgress()
  return (
    <>
      <div className="shell-wide t-label flex h-screen items-end bg-ink pb-20 text-mist">
        scroll down
      </div>
      <Possibilities />
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
