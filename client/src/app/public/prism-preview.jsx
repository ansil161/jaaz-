import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { useViewportHeight } from '@/features/public/hooks/useViewportHeight'
import { useLenis } from '@/features/public/hooks/useLenis'
import Prism from '@/features/public/home/components/prism/Prism'

/* ============================================================
   /prism.html — the Prism on its own

   One section, a screen of nothing either side of it so the pin
   has somewhere to start and somewhere to release into, and none
   of the rest of the homepage in the way. (The same harness
   `promise-preview.jsx` used before it was retired.)

   It earns its place beyond first review. The composition places
   five markers, a reading panel and a cut aperture against one
   photograph, and every one of those positions is tuned against a
   window size — reaching it by scrolling past eleven other
   sections every time is how tuning stops happening. This entry
   is dev-only — `vite.config.js` lists three build inputs and
   this is not one of them, so it never ships.

   ONE THING THIS HARNESS CANNOT SHOW YOU: the floating "Ask JAAZ
   AI" pill the site mounts at `fixed bottom-6 right-6 z-[80]`.
   The index rail's bottom clearance is set to clear it, and it is
   not here, so a clearance regression looks fine in this preview
   and covers a control on the actual page.
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
      <Prism />
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
