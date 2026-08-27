import { ChevronLeft, ChevronRight } from 'lucide-react'

/* Previous / next with a position readout.
 *
 * No numbered page buttons: a knowledge base of a few hundred documents is
 * navigated by filtering and searching, not by paging to page 14. */
export default function Pagination({ meta, onChange }) {
  if (!meta || meta.totalPages <= 1) return null

  const { page, totalPages, totalCount, pageSize } = meta
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalCount)

  return (
    <nav
      aria-label="Document list pages"
      className="flex items-center justify-between gap-4 pt-5"
    >
      <p className="font-mono text-[0.625rem] tracking-[0.12em] text-mist uppercase tabular-nums">
        {first}–{last} of {totalCount}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange({ page: page - 1 })}
          disabled={page <= 1}
          className="flex size-9 items-center justify-center border border-[var(--rule)] text-fog transition-colors hover:border-mist hover:text-bone disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Previous page</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ page: page + 1 })}
          disabled={page >= totalPages}
          className="flex size-9 items-center justify-center border border-[var(--rule)] text-fog transition-colors hover:border-mist hover:text-bone disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Next page</span>
        </button>
      </div>
    </nav>
  )
}
