/* Presentation helpers for the document list. Display only — nothing here
 * decides anything. */

const UNITS = ['B', 'KB', 'MB', 'GB']

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    /* The year is noise for anything uploaded this year and essential for
     * anything that was not. */
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : '—'
}
