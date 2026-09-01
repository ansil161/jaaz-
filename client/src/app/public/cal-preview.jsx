import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { useLenis } from '@/features/public/hooks/useLenis'
import Calibration from '@/features/public/home/components/Calibration'

/* ============================================================
   /cal.html — Calibration on its own

   One section, a screen of nothing either side of it so the pin
   has somewhere to start and somewhere to release into, and none
   of the rest of the homepage in the way. (The same harness
   `promise-preview.jsx` used before it was retired.)

   It earns its place beyond first review. The scene is four
   acts across three and a half viewports of scroll, and finding
   the two frames at the peak by scrolling past eleven other
   sections every time is how tuning stops happening. This entry
   is dev-only — `vite.config.js` lists three build inputs and
   this is not one of them, so it never ships.
   ============================================================ */

document.documentElement.classList.remove('no-js')

function Preview() {
  useViewportHeight()
  useLenis()
  return (
    <>
      <div className="shell-wide t-label flex h-screen items-end bg-ink pb-20 text-mist">
        scroll down
      </div>
      <Calibration />
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
