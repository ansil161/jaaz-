import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import Spinner from '../../../../components/console/Spinner'
import { useDocumentDetail } from '../hooks/useDocumentDetail'
import { formatBytes, formatDateTime, formatNumber } from '../utils/format'
import StatusPill from './StatusPill'

/* Everything known about one document, and the three things you can do to it.
 *
 * A drawer rather than a page: the list is the context you came from, and
 * losing it to check why one document failed is worse than losing some width.
 *
 * The chunk preview is the reason this panel is worth building. "Ready" says
 * ingestion did not error; it does not say the document was split into
 * passages anyone would want retrieved. Seeing the first ten settles it. */

function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] py-2.5">
      <dt className="font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-sm text-fog">{children}</dd>
    </div>
  )
}

export default function DocumentDetailPanel({ documentId, actions, onClose, onChanged }) {
  const { loading, document, chunks, chunkMeta, error, reload } =
    useDocumentDetail(documentId)

  const [busy, setBusy] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const closeRef = useRef(null)

  /* Focus moves into the drawer when it opens, so a keyboard user is not
   * left tabbing through the list behind it. */
  useEffect(() => {
    closeRef.current?.focus()
  }, [documentId])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const previous = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.document.body.style.overflow = previous
    }
  }, [onClose])

  async function run(action, work) {
    setBusy(action)
    setActionError(null)
    try {
      await work()
      onChanged?.()
      if (action === 'delete') {
        onClose()
        return
      }
      await reload()
    } catch (failure) {
      setActionError(failure.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-ink/80 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Document details"
        className="relative flex h-full w-full max-w-lg flex-col border-l border-[var(--rule)] bg-ink-2 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--rule)] px-6 py-5">
          <div className="min-w-0">
            <p className="font-mono text-[0.625rem] tracking-[0.2em] text-mist uppercase">
              Document
            </p>
            <h2 className="mt-1 truncate font-display text-xl text-paper">
              {document?.name ?? 'Loading'}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="-mr-2 p-2 text-fog transition-colors hover:text-paper"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span className="sr-only">Close details</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <Spinner label="Loading document" />
          ) : error ? (
            <p role="alert" className="text-sm text-signal">
              {error.message}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <StatusPill status={document.status} label={document.statusLabel} />
                {document.isProcessing ? (
                  <span className="text-xs text-mist">This updates on its own.</span>
                ) : null}
              </div>

              {document.status === 'failed' && document.errorMessage ? (
                <p
                  role="alert"
                  className="mt-4 border-l-2 border-signal bg-ink-3 px-4 py-3 text-sm text-fog"
                >
                  {document.errorMessage}
                </p>
              ) : null}

              <dl className="mt-6">
                <Row label="File">{document.originalFilename}</Row>
                <Row label="Type">{document.type}</Row>
                <Row label="Size">{formatBytes(document.fileSize)}</Row>
                <Row label="Chunks">{formatNumber(document.chunkCount)}</Row>
                <Row label="Characters">{formatNumber(document.characterCount)}</Row>
                <Row label="Uploaded by">{document.uploadedBy ?? '—'}</Row>
                <Row label="Uploaded">{formatDateTime(document.createdAt)}</Row>
                <Row label="Processed">{formatDateTime(document.processedAt)}</Row>
                {document.processingAttempts > 1 ? (
                  <Row label="Attempts">{document.processingAttempts}</Row>
                ) : null}
              </dl>

              {chunks.length ? (
                <section className="mt-8">
                  <h3 className="font-mono text-[0.625rem] tracking-[0.18em] text-mist uppercase">
                    Chunk preview
                    {chunkMeta ? (
                      <span className="ml-2 text-ash">
                        {chunks.length} of {chunkMeta.totalCount}
                      </span>
                    ) : null}
                  </h3>
                  <ol className="mt-3 space-y-2">
                    {chunks.map((chunk) => (
                      <li
                        key={chunk.id}
                        className="border border-[var(--rule)] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 font-mono text-[0.625rem] tracking-[0.12em] text-ash uppercase">
                          <span>#{chunk.chunkIndex}</span>
                          <span className="tabular-nums">
                            ~{chunk.tokenCount} tokens
                            {chunk.metadata?.pages
                              ? ` · p${chunk.metadata.pages.join(', ')}`
                              : ''}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed whitespace-pre-wrap text-fog">
                          {chunk.contentPreview}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </>
          )}
        </div>

        {document ? (
          <footer className="border-t border-[var(--rule)] px-6 py-4">
            {actionError ? (
              <p role="alert" className="mb-3 text-sm text-signal">
                {actionError}
              </p>
            ) : null}

            {confirmingDelete ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-fog">
                  Delete permanently, with its chunks?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="border border-[var(--rule)] px-3 py-2 font-mono text-[0.625rem] tracking-[0.14em] text-fog uppercase transition-colors hover:border-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => run('delete', () => actions.remove(document.id))}
                    disabled={busy === 'delete'}
                    className="border border-signal px-3 py-2 font-mono text-[0.625rem] tracking-[0.14em] text-signal uppercase transition-colors hover:bg-signal hover:text-pure disabled:opacity-50"
                  >
                    {busy === 'delete' ? 'Deleting' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {document.canRetry ? (
                  <button
                    type="button"
                    onClick={() => run('retry', () => actions.retry(document.id))}
                    disabled={Boolean(busy)}
                    className="border border-bone bg-bone px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] text-ink uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {busy === 'retry' ? 'Retrying' : 'Retry processing'}
                  </button>
                ) : null}

                {!document.isProcessing && !document.canRetry ? (
                  <button
                    type="button"
                    onClick={() => run('reprocess', () => actions.reprocess(document.id))}
                    disabled={Boolean(busy)}
                    className="border border-[var(--rule-strong)] px-4 py-2 font-mono text-[0.625rem] tracking-[0.14em] text-bone uppercase transition-colors hover:border-bone disabled:opacity-50"
                  >
                    {busy === 'reprocess' ? 'Re-processing' : 'Re-process'}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={Boolean(busy)}
                  className="ml-auto px-3 py-2 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-signal disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}
          </footer>
        ) : null}
      </aside>
    </div>
  )
}
