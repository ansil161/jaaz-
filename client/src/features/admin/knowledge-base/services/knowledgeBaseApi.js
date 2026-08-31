/* Every knowledge-base call the console makes, in one place.
 *
 * This is the whole of the frontend's knowledge of the backend. Nothing in
 * this feature chunks text, counts a token, decides what a supported file
 * type is, or judges whether someone may upload — those are answers the
 * server gives, and duplicating any of them here would create a second
 * version of the truth that drifts. */

import { apiFetch, apiUpload } from '@/services/api/client'

const BASE = '/api/admin/knowledge-base'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    /* Repeatable parameters — status, mainly — arrive as arrays and have to
     * be appended one at a time rather than joined, because that is the
     * shape Django's getlist() reads. */
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
    } else {
      query.append(key, value)
    }
  }
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

export const knowledgeBaseApi = {
  listDocuments: ({ signal, ...params } = {}) =>
    apiFetch(withQuery(`${BASE}/documents/`, params), { signal }),

  getDocument: (id, signal) => apiFetch(`${BASE}/documents/${id}/`, { signal }),

  listChunks: (id, { signal, ...params } = {}) =>
    apiFetch(withQuery(`${BASE}/documents/${id}/chunks/`, params), { signal }),

  /* onProgress receives a 0–1 fraction. The server is the only thing that
   * validates size or type; this just moves the bytes. */
  uploadDocument: ({ file, name, onProgress, signal }) =>
    apiUpload(`${BASE}/documents/`, {
      file,
      fields: { name },
      onProgress,
      signal,
    }),

  deleteDocument: (id) => apiFetch(`${BASE}/documents/${id}/`, { method: 'DELETE' }),

  retryDocument: (id) =>
    apiFetch(`${BASE}/documents/${id}/retry/`, { method: 'POST' }),

  reprocessDocument: (id) =>
    apiFetch(`${BASE}/documents/${id}/reprocess/`, { method: 'POST' }),

  search: ({ query, topK, documentIds, signal }) =>
    apiFetch(`${BASE}/search/`, {
      method: 'POST',
      body: { query, topK, documentIds },
      signal,
    }),
}
