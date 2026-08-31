import { LogOut, Shield } from 'lucide-react'

/* The member area's one piece of chrome.
 *
 * There is no sidebar here, and deliberately so. The console has one because
 * it has sections; this area has a single screen — the assistant — and its
 * own conversation list already lives beside the messages. A navigation
 * column listing one destination would be furniture.
 *
 * `h-16` and `sticky top-0` match the console's header exactly. The assistant
 * pins its conversation column just below the header, and it computes that
 * offset from this height — two headers of different heights would make the
 * same component correct in one app and misaligned in the other.
 *
 * The link to the console appears only for staff. It is drawn from the role
 * the server reported, and it is a convenience, not a control: /admin checks
 * again, and so does every endpoint behind it. */
export default function AccountHeader({ user, onSignOut, signingOut }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[var(--rule)] bg-ink/90 px-5 backdrop-blur-sm sm:px-8">
      <div className="flex min-w-0 items-baseline gap-3">
        <p className="font-mono text-[0.6875rem] tracking-[0.3em] text-mist uppercase">
          JAAZ
        </p>
        <h1 className="truncate font-display text-lg text-paper">Assistant</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {user.role === 'admin' ? (
          <a
            href="/admin"
            className="hidden items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-paper sm:inline-flex"
          >
            <Shield aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            Console
          </a>
        ) : null}

        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm text-paper">{user.name}</p>
          <p className="truncate font-mono text-[0.625rem] tracking-[0.16em] text-mist uppercase">
            {user.role}
          </p>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-paper disabled:opacity-50"
        >
          <LogOut aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">
            {signingOut ? 'Signing out…' : 'Sign out'}
          </span>
          <span className="sr-only sm:hidden">
            {signingOut ? 'Signing out' : 'Sign out'}
          </span>
        </button>
      </div>
    </header>
  )
}
