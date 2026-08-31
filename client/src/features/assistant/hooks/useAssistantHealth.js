import { useCallback, useEffect, useState } from 'react'

import { chatApi } from '@/features/assistant/services/chatApi'

/* Whether the assistant can answer right now.
 *
 * Django asks ai_service for readiness, which in turn depends on Qdrant and
 * the embedding model being up. Checking once when the screen opens lets the
 * composer say the assistant is unavailable *before* someone composes a
 * question, instead of after they have typed one and pressed send.
 *
 * Unknown is not the same as unavailable. If the health call itself fails
 * the answer is `null`, and the composer stays enabled — refusing to let
 * someone ask a question because a diagnostic endpoint was slow would be the
 * check causing the outage it is meant to report. */
export function useAssistantHealth() {
  const [available, setAvailable] = useState(null)

  const check = useCallback((signal) => {
    chatApi
      .health(signal)
      .then((payload) => {
        if (signal?.aborted) return
        setAvailable(Boolean(payload?.available))
      })
      .catch(() => {
        if (signal?.aborted) return
        setAvailable(null)
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    check(controller.signal)
    return () => controller.abort()
  }, [check])

  return { available, recheck: () => check() }
}
