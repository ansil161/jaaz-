import { LogOut } from 'lucide-react'

import { NAVIGATION, isGroupActive } from './navigation'

/* Sidebar: brand, sections, sign out.
 *
 * One component for both layouts. On a wide screen it is a static column; on
 * a narrow one the Shell renders the same markup inside a drawer. Two copies
 * would be two things to keep in step.
 *
 * Sub-sections are a nested <ul> inside their parent's <li>, which is how a
 * screen reader is told they belong to it — indentation alone conveys that
 * to sighted users only. */

function SubItem({ child, current, onNavigate }) {
  const active = child.id === current

  return (
    <li>
      <button
        type="button"
        disabled={!child.available}
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate(child.id)}
        className={[
          'flex w-full items-center py-2 pl-10 text-left text-sm transition-colors duration-150',
          active
            ? 'text-paper'
            : child.available
              ? 'text-mist hover:text-paper'
              : 'cursor-not-allowed text-ash',
        ].join(' ')}
      >
        {/* A rule that fills in on the active row: the indent alone is a
            weak signal once the list is more than two items long. */}
        <span
          aria-hidden="true"
          className={`mr-3 block h-px w-3 transition-colors ${
            active ? 'bg-paper' : 'bg-smoke'
          }`}
        />
        {child.label}
      </button>
    </li>
  )
}

export default function Sidebar({ current, onNavigate, onSignOut, signingOut }) {
  return (
    <div className="flex h-full flex-col bg-ink-2">
      <div className="px-6 py-7">
        <p className="font-mono text-[0.6875rem] tracking-[0.3em] text-mist uppercase">
          JAAZ
        </p>
        <p className="mt-1 font-display text-lg text-paper">Admin</p>
      </div>

      <nav aria-label="Console sections" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {NAVIGATION.map((item) => {
            const { id, label, icon: Icon, available, children, defaultChild } = item
            const active = available && isGroupActive(item, current)

            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!available}
                  aria-current={id === current ? 'page' : undefined}
                  onClick={() => onNavigate(defaultChild ?? id)}
                  className={[
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors duration-150',
                    active
                      ? 'bg-ink-4 text-paper'
                      : available
                        ? 'text-fog hover:bg-ink-3 hover:text-paper'
                        : 'cursor-not-allowed text-ash',
                  ].join(' ')}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="flex-1">{label}</span>
                  {!available ? (
                    <span className="font-mono text-[0.625rem] tracking-[0.14em] text-smoke uppercase">
                      Soon
                    </span>
                  ) : null}
                </button>

                {children && active ? (
                  <ul className="mt-0.5 mb-1">
                    {children.map((child) => (
                      <SubItem
                        key={child.id}
                        child={child}
                        current={current}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[var(--rule)] p-3">
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-fog transition-colors duration-150 hover:bg-ink-3 hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
