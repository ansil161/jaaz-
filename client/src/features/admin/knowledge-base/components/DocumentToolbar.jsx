import { Search, X } from 'lucide-react'

/* Search and status filtering.
 *
 * The status filters double as the count summary — showing "Failed 3" as a
 * filter button rather than as a separate statistics row means the number
 * and the way to act on it are the same control. */

const STATUS_FILTERS = [
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
]

/* Queued and the two intermediate stages all read as "in progress" to
 * someone looking at the list, so one button covers them. */
const PROCESSING_GROUP = ['uploaded', 'processing', 'chunking', 'embedding']

function countFor(counts, value) {
  if (!counts) return null
  if (value === 'processing') {
    return PROCESSING_GROUP.reduce((total, key) => total + (counts[key] ?? 0), 0)
  }
  return counts[value] ?? 0
}

export default function DocumentToolbar({ filters, counts, onChange, onReset }) {
  const active = new Set(filters.statuses)

  const toggle = (value) => {
    const group = value === 'processing' ? PROCESSING_GROUP : [value]
    const isActive = group.every((item) => active.has(item))
    const next = new Set(active)
    group.forEach((item) => (isActive ? next.delete(item) : next.add(item)))
    onChange({ statuses: [...next] })
  }

  const isActive = (value) =>
    (value === 'processing' ? PROCESSING_GROUP : [value]).every((item) =>
      active.has(item),
    )

  const filtered = filters.search || filters.statuses.length > 0

  return (
    <div className="flex flex-col gap-4 border-b border-[var(--rule)] pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 text-ash"
          strokeWidth={1.5}
        />
        <label htmlFor="kb-search" className="sr-only">
          Search documents
        </label>
        <input
          id="kb-search"
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder="Search documents"
          className="w-full border-b border-[var(--rule)] bg-transparent py-2.5 pl-7 text-sm text-bone transition-colors placeholder:text-ash focus:border-bone focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map(({ value, label }) => {
          const count = countFor(counts, value)
          const on = isActive(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
              aria-pressed={on}
              className={[
                'border px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors',
                on
                  ? 'border-bone bg-bone text-ink'
                  : 'border-[var(--rule)] text-fog hover:border-mist hover:text-bone',
              ].join(' ')}
            >
              {label}
              {count === null ? null : (
                <span className="ml-2 tabular-nums opacity-60">{count}</span>
              )}
            </button>
          )
        })}

        {filtered ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-bone"
          >
            <X aria-hidden="true" className="size-3" strokeWidth={2} />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}
