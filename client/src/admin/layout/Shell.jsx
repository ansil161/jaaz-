import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import Header from './Header'
import Sidebar from './Sidebar'

/* The dashboard frame: a fixed column beside a scrolling region.
 *
 * Below `lg` the column becomes a drawer. The drawer closes on Escape and on
 * navigation, and while it is open the page behind it does not scroll —
 * small things, but their absence is what makes a mobile admin panel feel
 * like a desktop one that was shrunk. */
export default function Shell({ current, onNavigate, user, onSignOut, signingOut, title, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!drawerOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [drawerOpen])

  const navigate = (id) => {
    onNavigate(id)
    setDrawerOpen(false)
  }

  return (
    <div className="min-h-svh bg-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-[var(--rule)] lg:sticky lg:top-0 lg:block lg:h-svh">
        <Sidebar
          current={current}
          onNavigate={navigate}
          onSignOut={onSignOut}
          signingOut={signingOut}
        />
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink/80 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-[var(--rule)] shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute top-5 right-4 z-10 p-2 text-fog transition-colors hover:text-paper"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
            <Sidebar
              current={current}
              onNavigate={navigate}
              onSignOut={onSignOut}
              signingOut={signingOut}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Header title={title} user={user} onOpenNavigation={() => setDrawerOpen(true)} />
        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  )
}
