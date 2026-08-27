import { useCallback, useEffect, useState } from 'react'

import { knowledgeBaseApi } from '../api/knowledgeBaseApi'

/* One document plus the first page of its chunks.
 *
 * The chunk preview is the only way anyone can see what ingestion actually
 * produced. A document can reach "Ready" having been split into four hundred
 * useless fragments, and nothing in the status column would say so. */

const CHUNK_PREVIEW_PAGE_SIZE = 10

const EMPTY = { id: null, document: null, chunks: [], chunkMeta: null, error: null }

export function useDocumentDetail(documentId) {
  const [state, setState] = useState(EMPTY)

  const load = useCallback(
    (signal) => {
      if (!documentId) return Promise.resolve()

      return Promise.all([
        knowledgeBaseApi.getDocument(documentId, signal),
        knowledgeBaseApi
          .listChunks(documentId, { pageSize: CHUNK_PREVIEW_PAGE_SIZE, signal })
          /* A document that failed has no chunks, and a chunk listing that
           * errors should not hide the failure message the viewer opened
           * the panel to read. */
          .catch(() => ({ results: [], meta: null })),
      ])
        .then(([documentPayload, chunkPayload]) => {
          if (signal?.aborted) return
          setState({
            id: documentId,
            document: documentPayload.document,
            chunks: chunkPayload.results,
            chunkMeta: chunkPayload.meta,
            error: null,
          })
        })
        .catch((error) => {
          if (signal?.aborted || error?.name === 'AbortError') return
          setState({ ...EMPTY, id: documentId, error })
        })
    },
    [documentId],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  /* Derived rather than a `loading` flag set from inside the effect. While
   * the id in state is not the one being asked for, the fetch is still in
   * flight — and switching documents shows the new one's spinner without a
   * second render pass to clear the old one's data. */
  const loading = state.id !== documentId

  return {
    loading,
    document: loading ? null : state.document,
    chunks: loading ? [] : state.chunks,
    chunkMeta: loading ? null : state.chunkMeta,
    error: loading ? null : state.error,
    reload: () => load(),
  }
}
