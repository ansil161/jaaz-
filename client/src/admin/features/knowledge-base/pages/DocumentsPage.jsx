import { useCallback, useState } from 'react'
import { Plus } from 'lucide-react'

import Spinner from '../../../../components/console/Spinner'
import { knowledgeBaseApi } from '../api/knowledgeBaseApi'
import DocumentDetailPanel from '../components/DocumentDetailPanel'
import DocumentTable from '../components/DocumentTable'
import DocumentToolbar from '../components/DocumentToolbar'
import Pagination from '../components/Pagination'
import { useDocuments } from '../hooks/useDocuments'

/* The knowledge base's main screen: what is in it, and what state it is in.
 *
 * This component composes; it does not compute. Filtering, sorting and paging
 * are all query parameters the server acts on — doing any of it here would
 * mean the page could only ever sort the twenty rows it happens to be
 * holding, which is the wrong answer as soon as there are twenty-one. */

/* The three mutations, in one object, so the detail panel receives a small
 * interface rather than the whole API module. */
const ACTIONS = {
  retry: (id) => knowledgeBaseApi.retryDocument(id),
  reprocess: (id) => knowledgeBaseApi.reprocessDocument(id),
  remove: (id) => knowledgeBaseApi.deleteDocument(id),
}

function EmptyState({ filtered, onReset, onUpload }) {
  if (filtered) {
    return (
      <div className="border border-[var(--rule)] px-6 py-16 text-center">
        <p className="text-sm text-fog">No documents match those filters.</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 border border-[var(--rule-strong)] px-4 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-[var(--rule-strong)] px-6 py-16 text-center">
      <h3 className="font-display text-2xl text-paper">The knowledge base is empty</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mist">
        Upload the documents you want the assistant to answer from — PDFs,
        Word documents, plain text or Markdown.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-6 border border-bone bg-bone px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-ink uppercase transition-opacity hover:opacity-85"
      >
        Upload a document
      </button>
    </div>
  )
}

export default function DocumentsPage({ onNavigate }) {
  const {
    loading,
    documents,
    meta,
    error,
    filters,
    setFilters,
    resetFilters,
    refresh,
  } = useDocuments()

  const [openDocumentId, setOpenDocumentId] = useState(null)

  const goToUpload = useCallback(() => onNavigate('kb-upload'), [onNavigate])
  const isFiltered = Boolean(filters.search) || filters.statuses.length > 0

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
            Knowledge Base
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-mist">
            Documents the assistant will answer from. Each one is split into
            passages and indexed after upload.
          </p>
        </div>

        <button
          type="button"
          onClick={goToUpload}
          className="flex items-center gap-2 border border-bone bg-bone px-4 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-ink uppercase transition-opacity hover:opacity-85"
        >
          <Plus aria-hidden="true" className="size-3.5" strokeWidth={2} />
          Upload document
        </button>
      </header>

      <div className="mt-8">
        <DocumentToolbar
          filters={filters}
          counts={meta?.counts}
          onChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      <div className="mt-2">
        {loading ? (
          <div className="flex items-center gap-3 px-1 py-16 text-sm text-mist">
            <Spinner label="Loading documents" />
            <span aria-hidden="true">Loading…</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="border border-[var(--rule)] border-l-2 border-l-signal px-5 py-6"
          >
            <p className="text-sm text-fog">{error.message}</p>
            <button
              type="button"
              onClick={refresh}
              className="mt-4 border border-[var(--rule-strong)] px-4 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
            >
              Try again
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className="pt-6">
            <EmptyState
              filtered={isFiltered}
              onReset={resetFilters}
              onUpload={goToUpload}
            />
          </div>
        ) : (
          <>
            <DocumentTable
              documents={documents}
              ordering={filters.ordering}
              onSort={(ordering) => setFilters({ ordering })}
              onOpen={(document) => setOpenDocumentId(document.id)}
            />
            <Pagination meta={meta} onChange={setFilters} />
          </>
        )}
      </div>

      {openDocumentId ? (
        <DocumentDetailPanel
          documentId={openDocumentId}
          actions={ACTIONS}
          onChanged={refresh}
          onClose={() => setOpenDocumentId(null)}
        />
      ) : null}
    </div>
  )
}
