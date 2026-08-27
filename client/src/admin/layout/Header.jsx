import { Menu } from 'lucide-react'

/* Header: which section you are in, and who you are.
 *
 * The identity is read straight off /api/auth/me. It is displayed, never
 * consulted — the console does not decide what to show you based on a string
 * it was handed; the server decides what it will answer. */
export default function Header({ title, user, onOpenNavigation }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[var(--rule)] bg-ink/90 px-5 backdrop-blur-sm sm:px-8">
      <button
        type="button"
        onClick={onOpenNavigation}
        className="-ml-2 p-2 text-fog transition-colors hover:text-paper lg:hidden"
        aria-label="Open navigation"
      >
        <Menu aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </button>

      <h1 className="flex-1 truncate font-mono text-[0.75rem] tracking-[0.2em] text-fog uppercase">
        {title}
      </h1>

      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0 text-right">
          <p className="truncate text-sm text-paper">{user.name}</p>
          <p className="truncate font-mono text-[0.625rem] tracking-[0.16em] text-mist uppercase">
            {user.role}
          </p>
        </div>
        {/* Decorative: the name is already right beside it in text, so
            announcing an initial again would just be noise. */}
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--rule-strong)] font-mono text-xs text-bone"
        >
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
      </div>
    </header>
  )
}
