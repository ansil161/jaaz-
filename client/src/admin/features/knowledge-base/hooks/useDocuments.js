import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { knowledgeBaseApi } from '../api/knowledgeBaseApi'

/* The document list, its filters, and the polling that keeps it honest.
 *
 * Polling is here because ingestion is asynchronous by design: the upload
 * returns as soon as the file is stored, and the document reaches READY some
 * seconds later on a worker. Without a refresh the table would show
 * "Processing" until someone reloaded the page, and every upload would look
 * like it had hung.
 *
 * It polls only while something is actually in flight, and stops the moment
 * the queue is empty — an admin panel left open on a quiet knowledge base
 * should not be making a request every three seconds all day. */

const PENDING_STATUSES = new Set(['uploaded', 'processing', 'chunking', 'embedding'])
const POLL_INTERVAL_MS = 3000
const SEARCH_DEBOUNCE_MS = 300

export const DEFAULT_FILTERS = {
  search: '',
  statuses: [],
  ordering: '-createdAt',
  page: 1,
  pageSize: 20,
}

export function useDocuments() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [state, setState] = useState({
    loading: true,
    documents: [],
    meta: null,
    error: null,
  })

  /* Typing in the search box should not fire a request per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filters.search])

  const query = useMemo(
    () => ({
      search: debouncedSearch,
      status: filters.statuses,
      ordering: filters.ordering,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [debouncedSearch, filters.statuses, filters.ordering, filters.page, filters.pageSize],
  )

  /* Bumped to force a refetch after a mutation, and by the poll timer. */
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  /* A poll must not flip the table back to its skeleton — the rows are
   * already on screen and only their statuses are changing. */
  const isFirstLoad = useRef(true)

  useEffect(() => {
    const controller = new AbortController()

    if (isFirstLoad.current) {
      setState((previous) => ({ ...previous, loading: true }))
    }

    knowledgeBaseApi
      .listDocuments({ ...query, signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) return
        isFirstLoad.current = false
        setState({
          loading: false,
          documents: payload.results,
          meta: payload.meta,
          error: null,
        })
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        isFirstLoad.current = false
        setState((previous) => ({ ...previous, loading: false, error }))
      })

    return () => controller.abort()
  }, [query, revision])

  const hasPending = state.documents.some((document) =>
    PENDING_STATUSES.has(document.status),
  )

  useEffect(() => {
    if (!hasPending) return
    const timer = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [hasPending, refresh])

  const update = useCallback((changes) => {
    setFilters((previous) => ({
      ...previous,
      ...changes,
      /* Any change to what is being looked at returns to page one.
       * Otherwise a filter that narrows the result set leaves the viewer
       * on a page that no longer exists, looking at nothing. */
      page: 'page' in changes ? changes.page : 1,
    }))
  }, [])

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return {
    ...state,
    filters,
    setFilters: update,
    resetFilters: reset,
    refresh,
    isPolling: hasPending,
  }
}
