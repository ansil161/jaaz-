import { ArrowDown, ArrowUp } from 'lucide-react'

import { formatBytes, formatDate, formatNumber } from '../utils/format'
import StatusPill from './StatusPill'

/* The document list.
 *
 * A real <table> with real <th scope="col">, not a grid of divs — a screen
 * reader announces the column when it reads a cell, and that is the only
 * thing that makes a data table navigable without sight.
 *
 * Sortable headers are buttons inside the header cell, carrying aria-sort on
 * the cell itself. Whole rows are not clickable: the row's action is "open
 * details", and a button that says so is reachable from the keyboard, which
 * an onClick on a <tr> is not. */

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true, className: 'w-2/5' },
  { key: 'type', label: 'Type', sortable: false, className: 'hidden sm:table-cell' },
  { key: 'status', label: 'Status', sortable: true },
  {
    key: 'chunkCount',
    label: 'Chunks',
    sortable: true,
    className: 'hidden lg:table-cell text-right',
  },
  {
    key: 'fileSize',
    label: 'Size',
    sortable: true,
    className: 'hidden lg:table-cell text-right',
  },
  { key: 'updatedAt', label: 'Updated', sortable: true, className: 'text-right' },
]

function ariaSort(columnKey, ordering) {
  if (ordering === columnKey) return 'ascending'
  if (ordering === `-${columnKey}`) return 'descending'
  return 'none'
}

function SortableHeader({ column, ordering, onSort }) {
  const direction = ariaSort(column.key, ordering)
  const Icon = direction === 'descending' ? ArrowDown : ArrowUp

  return (
    <button
      type="button"
      onClick={() =>
        onSort(direction === 'ascending' ? `-${column.key}` : column.key)
      }
      className="inline-flex items-center gap-1.5 text-inherit transition-colors hover:text-bone"
    >
      {column.label}
      <Icon
        aria-hidden="true"
        className={`size-3 transition-opacity ${
          direction === 'none' ? 'opacity-0' : 'opacity-100'
        }`}
        strokeWidth={2}
      />
    </button>
  )
}

export default function DocumentTable({ documents, ordering, onSort, onOpen }) {
  return (
    /* The table scrolls inside its own container rather than pushing the
       page sideways. */
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <caption className="sr-only">
          Knowledge base documents, with processing status
        </caption>
        <thead>
          <tr className="border-b border-[var(--rule)]">
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={column.sortable ? ariaSort(column.key, ordering) : undefined}
                className={`py-3 font-mono text-[0.625rem] font-normal tracking-[0.16em] text-mist uppercase ${column.className ?? ''}`}
              >
                {column.sortable ? (
                  <SortableHeader column={column} ordering={ordering} onSort={onSort} />
                ) : (
                  column.label
                )}
              </th>
            ))}
            <th scope="col" className="py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {documents.map((document) => (
            <tr
              key={document.id}
              className="border-b border-[var(--rule)] transition-colors hover:bg-ink-2"
            >
              <th scope="row" className="py-4 pr-4 font-normal">
                <span className="block truncate text-sm text-paper">
                  {document.name}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[0.625rem] text-ash">
                  {document.originalFilename}
                </span>
              </th>

              <td className="hidden py-4 pr-4 font-mono text-[0.6875rem] tracking-[0.1em] text-fog uppercase sm:table-cell">
                {document.type}
              </td>

              <td className="py-4 pr-4">
                <StatusPill status={document.status} label={document.statusLabel} />
                {document.status === 'failed' && document.errorMessage ? (
                  <span className="mt-1.5 block max-w-[22rem] text-xs text-mist">
                    {document.errorMessage}
                  </span>
                ) : null}
              </td>

              <td className="hidden py-4 pr-4 text-right text-sm text-fog tabular-nums lg:table-cell">
                {document.status === 'ready' ? formatNumber(document.chunkCount) : '—'}
              </td>

              <td className="hidden py-4 pr-4 text-right text-sm text-fog tabular-nums lg:table-cell">
                {formatBytes(document.fileSize)}
              </td>

              <td className="py-4 pr-4 text-right text-sm text-fog tabular-nums">
                {formatDate(document.updatedAt)}
              </td>

              <td className="py-4 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(document)}
                  className="font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-bone"
                >
                  Details
                  <span className="sr-only"> for {document.name}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
