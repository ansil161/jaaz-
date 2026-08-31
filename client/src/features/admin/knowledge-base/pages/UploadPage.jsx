import { useEffect, useState } from 'react'

import { knowledgeBaseApi } from '@/features/admin/knowledge-base/services/knowledgeBaseApi'
import UploadPanel from '@/features/admin/knowledge-base/components/UploadPanel'

/* The upload screen.
 *
 * The accepted extensions and the size limit are fetched rather than
 * hard-coded. The server already decides both — from
 * KNOWLEDGE_BASE['MAX_DOCUMENT_SIZE'] and the detection registry — and a
 * second copy in the frontend is a copy that will be wrong the first time
 * either changes. */

export default function UploadPage({ onNavigate, onUploaded }) {
  const [limits, setLimits] = useState(null)
  const [uploadedCount, setUploadedCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    knowledgeBaseApi
      .listDocuments({ pageSize: 1, signal: controller.signal })
      .then((payload) => {
        if (!controller.signal.aborted) setLimits(payload.meta.limits)
      })
      .catch(() => {
        /* The drop zone still works without limits — it loses the hint
         * line and the `accept` filter, and the server enforces both
         * regardless. Failing the page over a missing hint would be worse. */
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
          Upload documents
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-mist">
          Files are stored, then read, split into passages and indexed. That
          happens in the background — you can leave this page as soon as the
          upload finishes.
        </p>
      </header>

      <div className="mt-8">
        <UploadPanel
          limits={limits}
          onUploaded={(document) => {
            setUploadedCount((count) => count + 1)
            onUploaded?.(document)
          }}
        />
      </div>

      {uploadedCount > 0 ? (
        <div
          /* Polite, not assertive: the count changes as a queue drains and
             an assertive region would interrupt a screen reader on each. */
          aria-live="polite"
          className="mt-8 flex flex-wrap items-center gap-4 border-t border-[var(--rule)] pt-6"
        >
          <p className="text-sm text-fog">
            {uploadedCount} document{uploadedCount === 1 ? '' : 's'} uploaded.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('kb-documents')}
            className="border border-[var(--rule-strong)] px-4 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
          >
            View documents
          </button>
        </div>
      ) : null}
    </div>
  )
}
