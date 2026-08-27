import { useCallback, useEffect, useRef, useState } from 'react'

import { NetworkError } from '../../../lib/api'
import { chatApi } from '../api/chatApi'

/* The open conversation, and the streaming state machine that drives it.
 *
 * WHAT THE SERVER OWNS. Everything durable. Django persists the question
 * before generation starts and persists the answer from its own view of the
 * stream, not from anything the browser reports. So this hook is a view onto
 * that, not a second copy of it: whenever the two could disagree, it refetches
 * rather than patching.
 *
 * WHY TOKENS ARE BUFFERED. A fast provider emits tokens faster than a screen
 * refreshes. Calling setState per token means a React render per token — the
 * work is quadratic in answer length once re-parsing the Markdown is counted,
 * and it shows up as stutter long before a long answer finishes. Tokens
 * accumulate in a ref and flush on an animation frame, which caps rendering
 * at the display's rate and makes the cost linear.
 *
 * WHY STOPPING IS NOT AN ERROR. Aborting the fetch closes the connection;
 * Django sees a client disconnect, stops relaying, and — because it never
 * received the terminal frame — persists nothing. The partial answer stays
 * on screen because it is worth reading, and is labelled as not saved,
 * because it is not. Reloading the conversation makes it disappear, and that
 * is the truth rather than a bug. */

let localCounter = 0
const localId = (prefix) => `${prefix}-${(localCounter += 1)}`

const GENERIC_FAILURE = 'The answer could not be generated. Please try again.'

export function useChat({ conversationId, ensureConversation, onAnswered }) {
  const [messages, setMessages] = useState([])
  /* True from the moment a conversation that must be fetched becomes the
   * open one — decided where that decision is made, below, rather than in
   * the effect. Setting it inside the effect would render the empty pane
   * once without a loading state before the spinner appeared. */
  const [loading, setLoading] = useState(Boolean(conversationId))
  const [loadError, setLoadError] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const abort = useRef(null)
  const buffer = useRef('')
  const frame = useRef(null)

  /* -- loading ---------------------------------------------------------- */

  /* The conversation this hook created out of a draft and already holds the
   * messages for. Without it, the moment the draft becomes a real
   * conversation the load effect would fire and replace the answer currently
   * streaming into it with a refetch.
   *
   * State rather than a ref, and a single id rather than a set. Cleared as
   * soon as the open conversation changes, so coming back to it later
   * refetches — by then the server, not this hook, is the one holding the
   * messages. */
  const [ownedId, setOwnedId] = useState(null)

  /* Switching conversations empties the pane during render rather than in an
   * effect. An effect would paint the previous conversation's messages once
   * under the new one before clearing them — a visible flash of the wrong
   * content, and a wasted render. This is React's documented
   * adjust-state-when-a-prop-changes pattern. */
  const [renderedId, setRenderedId] = useState(conversationId)
  if (renderedId !== conversationId) {
    setRenderedId(conversationId)
    setLoadError(null)
    if (conversationId !== ownedId) {
      setMessages([])
      setOwnedId(null)
      setLoading(Boolean(conversationId))
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    /* A draft has nothing to load, and a conversation this hook just created
     * is already in hand. */
    if (!conversationId || conversationId === ownedId) return undefined

    const controller = new AbortController()

    chatApi
      .getConversation(conversationId, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return
        setMessages(payload.conversation?.messages ?? [])
        setLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === 'AbortError') return
        setLoading(false)
        setLoadError(error)
      })

    return () => controller.abort()
  }, [conversationId, ownedId])

  /* -- token buffering --------------------------------------------------- */

  const flush = useCallback((targetId) => {
    frame.current = null
    const text = buffer.current
    if (!text) return
    buffer.current = ''
    setMessages((previous) =>
      previous.map((message) =>
        message.id === targetId
          ? { ...message, content: message.content + text }
          : message,
      ),
    )
  }, [])

  const schedule = useCallback(
    (targetId) => {
      if (frame.current !== null) return
      frame.current = requestAnimationFrame(() => flush(targetId))
    },
    [flush],
  )

  const cancelFrame = useCallback(() => {
    if (frame.current === null) return
    cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])

  const patch = useCallback((targetId, changes) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === targetId ? { ...message, ...changes } : message,
      ),
    )
  }, [])

  /* -- asking ------------------------------------------------------------ */

  const send = useCallback(
    async (question) => {
      let id = conversationId

      if (!id) {
        try {
          const conversation = await ensureConversation()
          id = conversation.id
          /* Claimed before the messages are appended, so the render that
           * sees the new conversationId also sees that this hook owns it and
           * leaves the pane alone. */
          setOwnedId(id)
        } catch (error) {
          setLoadError(error)
          return
        }
      }

      const assistantId = localId('assistant')

      setMessages((previous) => [
        ...previous,
        {
          id: localId('user'),
          role: 'user',
          content: question,
          createdAt: new Date().toISOString(),
        },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          sources: [],
          metadata: null,
          createdAt: new Date().toISOString(),
        },
      ])

      const controller = new AbortController()
      abort.current = controller
      buffer.current = ''
      setStreaming(true)

      try {
        await chatApi.streamAsk(id, {
          message: question,
          signal: controller.signal,
          onEvent: ({ event, data }) => {
            switch (event) {
              case 'sources':
                /* Arrives before the first token, so the cards render while
                 * the model is still starting. */
                patch(assistantId, { sources: data.sources ?? [] })
                break

              case 'token':
                buffer.current += data.delta ?? ''
                schedule(assistantId)
                break

              case 'message_complete':
                cancelFrame()
                buffer.current = ''
                /* The server's `answer` replaces the accumulated tokens
                 * rather than being appended to them. It is the same text
                 * with citation markers the model invented removed — see
                 * rag/citations.py — so trusting the stream here would leave
                 * markers on screen pointing at sources that do not exist. */
                patch(assistantId, {
                  content: data.answer ?? '',
                  sources: data.sources ?? [],
                  metadata: data.metadata ?? null,
                })
                break

              case 'error':
                cancelFrame()
                flush(assistantId)
                patch(assistantId, {
                  error: data.error?.message ?? GENERIC_FAILURE,
                  retry: { mode: 'regenerate' },
                })
                break

              default:
                /* message_start, and anything a future version adds. */
                break
            }
          },
        })

        cancelFrame()
        flush(assistantId)
        onAnswered?.(id)
      } catch (error) {
        cancelFrame()
        flush(assistantId)

        if (error?.name === 'AbortError') {
          patch(assistantId, { stopped: true })
        } else {
          patch(assistantId, {
            error: error?.message ?? GENERIC_FAILURE,
            /* A NetworkError means the request may never have reached
             * Django, so the question may not be persisted — regenerating
             * would answer the *previous* turn. Resending is the only safe
             * retry. Anything else came back from Django, which persists the
             * question before it generates. */
            retry: {
              mode: error instanceof NetworkError ? 'resend' : 'regenerate',
              question,
            },
          })
        }
      } finally {
        abort.current = null
        setStreaming(false)
      }
    },
    [conversationId, ensureConversation, onAnswered, patch, schedule, flush, cancelFrame],
  )

  const stop = useCallback(() => abort.current?.abort(), [])

  /* -- retrying and regenerating ----------------------------------------- */

  /* Regeneration is the server's operation, not a resend. It drops the
   * previous answer and everything after it, then answers the same stored
   * question — so the conversation ends up with one answer per turn instead
   * of two, and the model cannot see its own previous attempt.
   *
   * It is not streamed. The endpoint returns a complete answer, and adding a
   * second streaming path to save a few seconds on an uncommon action would
   * be a second protocol implementation to keep in step. */
  const regenerate = useCallback(async () => {
    if (!conversationId || streaming || regenerating) return

    setRegenerating(true)
    try {
      await chatApi.regenerate(conversationId)
      const payload = await chatApi.getConversation(conversationId)
      setMessages(payload.conversation?.messages ?? [])
      onAnswered?.(conversationId)
    } catch (error) {
      /* Attached to the last assistant message rather than raised, so the
       * failure appears where the answer would have been. */
      setMessages((previous) => {
        const index = previous.findLastIndex((message) => message.role === 'assistant')
        if (index === -1) return previous
        const next = [...previous]
        next[index] = {
          ...next[index],
          error: error?.message ?? GENERIC_FAILURE,
          retry: { mode: 'regenerate' },
        }
        return next
      })
    } finally {
      setRegenerating(false)
    }
  }, [conversationId, streaming, regenerating, onAnswered])

  const retry = useCallback(
    (message) => {
      if (message?.retry?.mode === 'resend' && message.retry.question) {
        /* Drop the failed turn first — the question is going back on screen
         * as a new one, and leaving the old pair there would show it twice. */
        setMessages((previous) => {
          const index = previous.findIndex((item) => item.id === message.id)
          return index === -1 ? previous : previous.slice(0, Math.max(0, index - 1))
        })
        return send(message.retry.question)
      }
      return regenerate()
    },
    [send, regenerate],
  )

  /* Abort on unmount, so navigating away from the assistant stops the answer
   * being generated rather than leaving it running for nobody. */
  useEffect(
    () => () => {
      abort.current?.abort()
      cancelFrame()
    },
    [cancelFrame],
  )

  return {
    messages,
    loading,
    loadError,
    streaming,
    regenerating,
    send,
    stop,
    retry,
  }
}
