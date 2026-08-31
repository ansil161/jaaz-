/* The console's only loading indicator, shared by both apps.
 *
 * `role="status"` with a visually-hidden label rather than a bare spinning
 * ring: a screen reader gets told the page is working on something, which a
 * rotating border does not convey. */
export default function Spinner({ label = 'Loading', className = '' }) {
  return (
    <span role="status" className={`inline-flex items-center gap-3 ${className}`}>
      <span
        aria-hidden="true"
        className="console-spinner block size-4 rounded-full border border-mist/40 border-t-bone"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
