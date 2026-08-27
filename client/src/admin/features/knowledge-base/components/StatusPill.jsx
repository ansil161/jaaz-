/* A document's processing state, at a glance.
 *
 * Colour is not the only signal. The label is always written out, because
 * "Ready" and "Failed" as two shades of grey-green-red is exactly the
 * distinction a colour-blind viewer cannot make — and it is the most
 * important one on the page.
 *
 * The in-progress states also animate, which is what tells someone the row
 * is going to change on its own and they do not need to reload. */

const STYLES = {
  uploaded: { label: 'Queued', className: 'text-mist border-mist/30' },
  processing: { label: 'Processing', className: 'text-cove border-cove/40', busy: true },
  chunking: { label: 'Chunking', className: 'text-cove border-cove/40', busy: true },
  embedding: { label: 'Embedding', className: 'text-cove border-cove/40', busy: true },
  ready: { label: 'Ready', className: 'text-bone border-bone/40' },
  failed: { label: 'Failed', className: 'text-signal border-signal/50' },
}

const FALLBACK = { label: 'Unknown', className: 'text-ash border-ash/30' }

export default function StatusPill({ status, label }) {
  const style = STYLES[status] ?? FALLBACK

  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase ${style.className}`}
    >
      {style.busy ? (
        <span
          aria-hidden="true"
          className="console-spinner block size-2.5 rounded-full border border-current border-t-transparent"
        />
      ) : null}
      {label || style.label}
    </span>
  )
}
