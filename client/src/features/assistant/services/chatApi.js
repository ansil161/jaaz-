/* Every call the assistant makes, in one place.
 *
 * The browser talks to Django and nothing else. It has never heard of
 * ai_service, Qdrant, Gemini or Hugging Face, and holds no credential for
 * any of them — Django authenticates the session, attaches the user's
 * identity, and forwards the question across the trust boundary.
 *
 * Nothing here decides anything. It does not judge which knowledge base a
 * person may read, trim history, or choose a model. Those are answers the
 * server gives; a second opinion in the client would only be a version of
 * the truth that drifts. */

import { apiFetch, apiStream } from '@/services/api/client'

const BASE = '/api/chat'

export const chatApi = {
  /* Whether the assistant can answer at all, so the composer can say so
   * before someone types a question rather than after. */
  health: (signal) => apiFetch(`${BASE}/health/`, { signal }),

  listConversations: (signal) => apiFetch(`${BASE}/conversations/`, { signal }),

  /* Title is optional: the server derives one from the first question, which
   * is a better label than anything anyone would type up front. */
  createConversation: (title) =>
    apiFetch(`${BASE}/conversations/`, { method: 'POST', body: { title } }),

  getConversation: (id, signal) =>
    apiFetch(`${BASE}/conversations/${id}/`, { signal }),

  deleteConversation: (id) =>
    apiFetch(`${BASE}/conversations/${id}/`, { method: 'DELETE' }),

  /* The streamed answer. `onEvent` receives the protocol's frames in order:
   * message_start, sources, token…, message_complete — or error.
   *
   * Aborting `signal` closes the connection. Django reads that as a client
   * disconnect and stops relaying, which stops the answer being generated
   * and paid for with nobody reading it. */
  streamAsk: (id, { message, documentIds, signal, onEvent }) =>
    apiStream(`${BASE}/conversations/${id}/messages/stream/`, {
      body: { message, documentIds },
      signal,
      onEvent,
    }),

  /* The non-streaming path. Used for retry and regenerate, where the server
   * discards the previous answer and produces a new one for the same
   * question — see the note in useChat. */
  regenerate: (id) =>
    apiFetch(`${BASE}/conversations/${id}/regenerate/`, { method: 'POST' }),
}
