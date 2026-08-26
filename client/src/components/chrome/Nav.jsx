import { useEffect, useState } from 'react'
import { nav } from '../../data/site'
import { Link } from './PageTransition'
import { useRoute } from '../../lib/route'

/* ============================================================
   NAVIGATION
   Three tracks: mark, menu, action.

   The primary links are grouped onto one capsule on the centre
   line rather than spread across the bar. Three words spaced over
   a 1200px header read as three unrelated links; the same three
   held inside a shape read as a menu, and the bar resolves into
   three objects instead of five. The action beside it is a filled
   plate, so there is exactly one pressable-looking thing up here.

   The bar itself still has no background.

   The whole thing is mix-blend-mode: difference, so it reads
   white over the black sections and flips to black over the
   paper ones without a single conditional. That is why the bar
   can stay transparent all the way down a page that inverts
   three times — no scrim, no colour logic, no flicker.

   It does not move. The bar used to retract on scroll down and
   return on scroll up, which meant its position depended on the
   direction you were travelling — a menu that is somewhere else
   depending on how you arrived is a menu you have to look for.
   Fixed and always present costs one bar-height of the viewport
   and returns a fixed address for the whole site.

   Every item is a real link with a real href. Page links cross
   over behind the curtain; `/#section` links scroll, crossing
   pages first if they need to. The router decides which — the
   bar just hands it a URL.

   Solutions is a plain link like every other item — the nine
   solutions are browsed on their own page, not previewed from a
   dropdown. A menu that lists a catalogue the destination page
   is going to list again a moment later is not a shortcut, it's
   a second index to keep in sync.
   ============================================================ */

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { path } = useRoute()

  /* An open menu owns the scroll. */
  useEffect(() => {
    const lenis = window.__lenis
    if (open) lenis?.stop()
    else lenis?.start()
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  /* Escape closes it, and so does a browser back/forward gesture —
     without the second listener a back swipe out of a page leaves the
     overlay sitting open over whatever loaded behind it. Link clicks
     close it through `onNavigate` instead, at the moment of the click
     rather than a render later. */
  useEffect(() => {
    const close = () => setOpen(false)
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', close)
    }
  }, [])

  /* Only whole-page links get the current-page treatment. A `/#section`
     link is a destination on a page, not the page itself. */
  const isCurrent = (href) => !href.includes('#') && href === path

  return (
    <div>
      {/* No `will-change-transform`: nothing animates this element any
          more, and a standing compositing hint on a full-width fixed
          layer is a cost with nothing to pay for it. */}
      <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
        {/* THREE TRACKS, NOT `justify-between`. The capsule has to sit
            on the page's centre line, and space-between can only put
            it midway between the mark and the action — which is a
            different place, because those two are not the same width.
            A `1fr auto 1fr` grid centres the middle track against the
            viewport and lets the outer two grow unevenly around it. */}
        <div className="shell grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-4 sm:py-5">
          <Link
            to="/"
            className="focus-ring font-display justify-self-start text-2xl leading-none tracking-tight text-pure sm:text-[1.7rem]"
            aria-label="JAAZ — home"
          >
            JAAZ
          </Link>

          <nav className="nav-capsule hidden lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className="nav-chip t-label focus-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="col-start-3 flex items-center justify-end gap-5">
            {/* The action is a filled plate now, not a third underlined
                phrase. With the links grouped into the capsule, a bare
                text link out here would read as a stray fourth item;
                the fill is what makes it the one thing on the bar you
                are meant to press. `.btn-flat` already self-inverts
                under the blend — its off-white ground goes light over
                the dark sections and dark over the paper ones, and the
                ink label flips with it. The padding is tightened from
                the page-scale button to sit inside a 40px bar. */}
            <Link
              to="/contact"
              className="btn-flat focus-ring hidden px-5 py-3 sm:inline-flex"
            >
              Start a Project
            </Link>

            {/* Two rules that become an X. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="focus-ring relative z-10 flex h-8 w-8 flex-col items-end justify-center gap-[7px] lg:hidden"
            >
              <span
                className="block h-px w-7 bg-pure transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{ transform: open ? 'translateY(4px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-px w-7 bg-pure transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{ transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none' }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ---- Mobile overlay ---- */}
      <div
        className="fixed inset-0 z-40 bg-ink lg:hidden"
        aria-hidden={!open}
        style={{
          clipPath: open ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
          transition: 'clip-path 0.85s cubic-bezier(0.76, 0, 0.24, 1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className="shell flex h-full flex-col justify-between pt-28 pb-10">
          <nav aria-label="Mobile" className="flex flex-col overflow-y-auto">
            {nav.map((item, i) => (
              <Link
                key={item.href}
                to={item.href}
                onNavigate={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={`t-heading focus-ring border-b border-white/10 py-4 ${
                  isCurrent(item.href) ? 'text-pure' : 'text-bone'
                }`}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.6s ${0.18 + i * 0.06}s cubic-bezier(0.16,1,0.3,1), transform 0.8s ${0.18 + i * 0.06}s cubic-bezier(0.16,1,0.3,1)`,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="pt-8">
            <Link
              to="/contact"
              onNavigate={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="btn focus-ring w-full justify-center text-pure"
            >
              Start a Project
              <span className="btn-arrow" aria-hidden="true">
                &#8594;
              </span>
            </Link>
            <p className="t-label mt-8 text-ash">JAAZ — Private Cinema</p>
          </div>
        </div>
      </div>
    </div>
  )
}
