import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import { RouteProvider } from '@/features/public/router/PageTransition'
import Footer from '@/features/public/layouts/Footer'
import { contactCta } from '@/features/public/data/contact'

/* ============================================================
   /footer.html — the footer on its own

   Half a screen of black above it so the seam has something to
   be a seam WITH, then the footer, then the same block again
   with the Contact page's CTA override — the two states that
   have to be checked together, because the override supplies a
   different photograph, a different headline length and a
   different second button label, and only one of them is ever
   visible on any real page.

   The footer is the last thing on every page on this site, which
   means reviewing a change to it costs a full scroll through
   whichever page you opened — past pinned sections that hold the
   scroll for three viewports each. That is how footer work stops
   happening.

   Dev-only: `vite.config.js` lists the shipped entries and this
   is not among them.
   ============================================================ */

document.documentElement.classList.remove('no-js')

/* Every photograph in the footer is `loading="lazy"`, which is right
   on a real page and useless here: reviewing this harness through the
   browser MCP puts the tab at `visibilityState: hidden`, and Chrome's
   lazy loader never fires the fetch for a background tab — the panels
   stay empty and the composition cannot be judged. Nothing is wrong
   with the footer when that happens.
   Local images are served fast enough to arrive anyway; the CDN plates
   are the ones that never start, so they are upgraded to eager here.
   Harness-only — the shipped footer keeps its lazy loading. */
function useEagerPlates() {
  useEffect(() => {
    for (const img of document.querySelectorAll('footer img[loading="lazy"]')) {
      img.loading = 'eager'
      // eslint-disable-next-line no-self-assign
      img.src = img.src
    }
  }, [])
}

/* No <useLenis> here on purpose. Lenis drives the scroll from a rAF
   loop, and rAF is exactly what stops in the hidden tab this harness
   is reviewed in — the wheel is swallowed and the page never moves,
   which looks like a broken build rather than a stopped ticker. The
   footer has nothing scroll-pinned in it, so native scrolling costs
   the review nothing and buys back the ability to scroll at all. */
function Preview({ bare = false }) {
  useEagerPlates()

  /* `bare` is what <Frame> loads: one footer, no spacers and no
     second copy. The spacers are sized in `vh`, and the frame is
     3200px tall to hold its whole document at once — so inside it a
     "half screen" of lead-in becomes 1760px of black, twice, and
     pushes everything worth looking at past the frame's own bottom
     edge. */
  if (bare) {
    return (
      <RouteProvider>
        <Footer />
      </RouteProvider>
    )
  }

  return (
    <RouteProvider>
      <div className="shell-wide t-label flex h-[55vh] items-end bg-ink pb-16 text-mist">
        the page above
      </div>
      <Footer />
      <div className="shell-wide t-label flex h-[55vh] items-end bg-ink pb-16 text-mist">
        the same block with the contact override
      </div>
      <Footer cta={contactCta} />
    </RouteProvider>
  )
}

/* /footer.html?w=390 — the same harness inside a narrow frame.

   `resize_window` is inert in this environment: it reports success
   on every call while `innerWidth` stays at the desktop size, so
   there is no way to make the window itself narrow and no way to
   see a breakpoint below `lg` by resizing. An iframe gets a real
   viewport — media queries and `vw` resolve against ITS width — so
   the frame is the only honest mobile check available here.

   It lives in the React tree rather than being injected from the
   console because a page injected element does not survive the HMR
   reload that follows every edit, and reviewing a layout means
   editing it.

   Any width works: `?w=390` is a phone, `?w=820` a tablet, and
   `?w=1000` the last width before the `lg` rules take over. */
function Frame({ width }) {
  /* Deliberately TALLER than the window rather than `100vh`. A
     frame the height of the viewport has its own scrollbar, and the
     wheel does not reach an inner document through the browser MCP —
     the frame is scrolled instead by scrolling the page it sits on,
     which only works if the whole footer is laid out inside it at
     once. 3200px clears the tallest state (the stacked card plus a
     single-column directory) with room to spare. */
  return (
    <div className="flex justify-center bg-smoke py-8">
      <iframe
        title={`Footer at ${width}px`}
        src="/footer.html?reduced=1&bare=1"
        width={width}
        height={3200}
        className="border-0 bg-ink"
        scrolling="no"
      />
    </div>
  )
}

const params = new URLSearchParams(location.search)
const width = Number(params.get('w')) || 0

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {width ? <Frame width={width} /> : <Preview bare={params.has('bare')} />}
  </StrictMode>,
)

/* Exported only to satisfy the fast-refresh rule — an entry file
   that renders a component it does not export is the one shape
   `react/only-export-components` flags, and this repo lints clean
   otherwise. Nothing imports this. */
export default Preview
