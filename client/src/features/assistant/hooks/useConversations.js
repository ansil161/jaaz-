import { useCallback, useEffect, useState } from 'react'

import { chatApi } from '../api/chatApi'

/* The conversation list and the mutations that change it.
 *
 * Deliberately separate from useChat. This owns "which conversations exist";
 * useChat owns "what is in the open one". Merging them would mean every
 * streamed token re-rendered the sidebar, and every deletion had to reason
 * about a stream in flight.
 *
 * Titles are the server's. It derives one from the first question, which
 * means the sidebar label for a new conversation only becomes correct after
 * that first answer — hence `refresh` being exported and called then. */
export function useConversations() {
  const [state, setState] = useState({ loading: true, conversations: [], error: null })

  /* The previous error is left on screen until this resolves. Clearing it up
   * front would blank the message for the duration of the retry and then
   * bring it back, which reads as a flicker rather than as a retry. */
  const load = useCallback((signal) => {
    return chatApi
      .listConversations(signal)
      .then((payload) => {
        if (signal?.aborted) return
        setState({ loading: false, conversations: payload.results ?? [], error: null })
      })
      .catch((error) => {
        if (signal?.aborted || error?.name === 'AbortError') return
        setState((previous) => ({ ...previous, loading: false, error }))
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const refresh = useCallback(() => load(), [load])

  const create = useCallback(async () => {
    const payload = await chatApi.createConversation()
    const conversation = payload.conversation
    /* Prepended rather than refetched. The server sorts by recency and a new
     * conversation is by definition the most recent, so the local insert
     * agrees with what a refetch would return — without the round trip. */
    setState((previous) => ({
      ...previous,
      conversations: [conversation, ...previous.conversations],
    }))
    return conversation
  }, [])

  const remove = useCallback(async (id) => {
    /* Removed from the list first. The request is a formality that either
     * succeeds or is restored below; waiting for it leaves the row sitting
     * there after the click, which reads as a failure. */
    let removed = null
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.filter((conversation) => {
        if (conversation.id !== id) return true
        removed = conversation
        return false
      }),
    }))

    try {
      await chatApi.deleteConversation(id)
    } catch (error) {
      if (removed) {
        /* Put it back where it was. Sorting by the server's own key rather
         * than pushing to the end, so a failed delete does not silently
         * reorder the list. */
        setState((previous) => ({
          ...previous,
          conversations: [...previous.conversations, removed].sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
          ),
        }))
      }
      throw error
    }
  }, [])

  /* Called when a first answer lands and the server has derived a title. */
  const applyTitle = useCallback((id, title, updatedAt) => {
    setState((previous) => ({
      ...previous,
      conversations: previous.conversations.map((conversation) =>
        conversation.id === id
          ? { ...conversation, title, updatedAt: updatedAt ?? conversation.updatedAt }
          : conversation,
      ),
    }))
  }, [])

  return { ...state, refresh, create, remove, applyTitle }
}
