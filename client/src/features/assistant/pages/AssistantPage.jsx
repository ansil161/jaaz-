import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowDown, PanelLeft } from 'lucide-react'

import Spinner from '@/components/feedback/Spinner'
import Composer from '@/features/assistant/components/Composer'
import ConversationList from '@/features/assistant/components/ConversationList'
import EmptyState from '@/features/assistant/components/EmptyState'
import MessageBubble from '@/features/assistant/components/MessageBubble'
import { useAssistantHealth } from '@/features/assistant/hooks/useAssistantHealth'
import { useChat } from '@/features/assistant/hooks/useChat'
import { useConversations } from '@/features/assistant/hooks/useConversations'

/* The assistant screen.
 *
 * WHY THE PAGE SCROLLS RATHER THAN AN INNER PANE. The obvious layout for a
 * chat is a fixed-height frame with its own scrolling message list. Doing
 * that here means computing a height from the viewport minus the console
 * header — and `100svh` arithmetic is exactly what breaks on mobile browsers
 * whose toolbars grow and shrink as you scroll, which is the case this
 * layout most needs to survive. So the conversation scrolls the page, the
 * composer is `sticky bottom-0`, and the sidebar is `sticky` under the
 * header. No height is ever calculated, and it behaves correctly in every
 * browser without a media query.
 *
 * COMPOSITION, NOT COMPUTATION. Nothing here retrieves, ranks, prompts or
 * decides what may be read. Those live in ai_service behind Django's
 * authentication. This file arranges components and moves state between
 * them. */

/* How close to the bottom still counts as "following along". Generous enough
 * that a tall answer arriving in one frame does not break the follow, tight
 * enough that someone who scrolled up to re-read is left alone. */
const PINNED_THRESHOLD_PX = 120

export default function AssistantPage() {
  const conversations = useConversations()
  const health = useAssistantHealth()

  const [activeId, setActiveId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [prefill, setPrefill] = useState(0)

  const bottom = useRef(null)
  const [pinned, setPinned] = useState(true)

  /* A draft conversation becomes a real one only when a question is actually
   * asked. Creating it when "New chat" is pressed would litter the sidebar
   * with empty conversations every time someone opened the screen. */
  const ensureConversation = useCallback(async () => {
    const conversation = await conversations.create()
    setActiveId(conversation.id)
    return conversation
  }, [conversations])

  const onAnswered = useCallback(
    (conversationId) => {
      /* The title is derived server-side from the first question, so the
       * sidebar label for a new conversation is only correct once an answer
       * has landed. */
      conversations.refresh()
      if (conversationId) setActiveId(conversationId)
    },
    [conversations],
  )

  const chat = useChat({ conversationId: activeId, ensureConversation, onAnswered })

  /* -- following the answer ---------------------------------------------- */

  useEffect(() => {
    const onScroll = () => {
      const distance =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight
      setPinned(distance < PINNED_THRESHOLD_PX)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    /* Only while the reader is still at the bottom. Yanking the page down
     * while someone is reading an earlier part of the answer is the single
     * most irritating thing a streaming chat interface can do. */
    if (!pinned) return
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [chat.messages, pinned])

  const scrollToBottom = () =>
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

  /* -- actions ------------------------------------------------------------ */

  const openConversation = (conversation) => {
    if (chat.streaming) chat.stop()
    setActiveId(conversation.id)
    setDrawerOpen(false)
    setPinned(true)
  }

  const startNew = () => {
    if (chat.streaming) chat.stop()
    setActiveId(null)
    setDrawerOpen(false)
    setPrefill((value) => value + 1)
  }

  const removeConversation = async (conversation) => {
    if (conversation.id === activeId) {
      if (chat.streaming) chat.stop()
      setActiveId(null)
    }
    try {
      await conversations.remove(conversation.id)
    } catch {
      /* useConversations restores the row. Nothing further to say here —
       * the list going back to how it was is the message. */
    }
  }

  const unavailable = health.available === false
  const lastAssistantIndex = chat.messages.findLastIndex(
    (message) => message.role === 'assistant',
  )

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* -- conversations ------------------------------------------------ */}
      <div className="hidden lg:sticky lg:top-[5.5rem] lg:block lg:max-h-[calc(100svh-8rem)]">
        <ConversationList
          conversations={conversations.conversations}
          loading={conversations.loading}
          error={conversations.error}
          activeId={activeId}
          onOpen={openConversation}
          onNew={startNew}
          onDelete={removeConversation}
          onRetry={conversations.refresh}
        />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close conversations"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink/80 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <ConversationList
              conversations={conversations.conversations}
              loading={conversations.loading}
              error={conversations.error}
              activeId={activeId}
              onOpen={openConversation}
              onNew={startNew}
              onDelete={removeConversation}
              onRetry={conversations.refresh}
            />
          </div>
        </div>
      ) : null}

      {/* -- conversation -------------------------------------------------- */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 border border-[var(--rule-strong)] px-3 py-2 font-mono text-[0.625rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
          >
            <PanelLeft aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
            Conversations
          </button>
        </div>

        {unavailable ? (
          <div
            role="status"
            className="mb-6 flex items-start gap-2.5 border border-[var(--rule)] border-l-2 border-l-signal px-4 py-3 lg:mt-0"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-signal"
              strokeWidth={1.5}
            />
            <p className="text-sm leading-relaxed text-fog">
              The assistant is unavailable. Questions cannot be answered until
              the AI service is reachable again.{' '}
              <button
                type="button"
                onClick={health.recheck}
                className="underline decoration-mist underline-offset-2 transition-colors hover:decoration-bone"
              >
                Check again
              </button>
            </p>
          </div>
        ) : null}

        <div className="min-h-[50vh] flex-1">
          {chat.loading ? (
            <p className="flex items-center gap-3 py-16 text-sm text-mist">
              <Spinner label="Loading conversation" />
              <span aria-hidden="true">Loading…</span>
            </p>
          ) : chat.loadError ? (
            <div
              role="alert"
              className="border border-[var(--rule)] border-l-2 border-l-signal px-5 py-6"
            >
              <p className="text-sm leading-relaxed text-fog">{chat.loadError.message}</p>
            </div>
          ) : chat.messages.length === 0 ? (
            <EmptyState
              disabled={unavailable}
              onPick={(question) => chat.send(question)}
            />
          ) : (
            /* `feed` with `busy` is what tells a screen reader that entries
               are being added over time and that it should not try to
               announce a half-written answer word by word. */
            <div
              role="feed"
              aria-busy={chat.streaming || undefined}
              aria-label="Conversation"
              className="space-y-8 pt-2"
            >
              {chat.messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  streaming={chat.streaming && index === chat.messages.length - 1}
                  canRegenerate={
                    index === lastAssistantIndex && !chat.streaming && !chat.regenerating
                  }
                  onRegenerate={() => chat.retry(message)}
                />
              ))}

              {chat.regenerating ? (
                <p className="flex items-center gap-3 text-sm text-mist">
                  <Spinner label="Regenerating the answer" />
                  <span aria-hidden="true">Regenerating…</span>
                </p>
              ) : null}
            </div>
          )}

          <div ref={bottom} aria-hidden="true" className="h-px" />
        </div>

        {/* -- composer ---------------------------------------------------- */}
        <div className="sticky bottom-0 z-10 -mx-1 mt-6 px-1 pb-4">
          {/* A gradient rather than a hard edge, so text scrolling under the
              composer fades instead of being sliced across a line. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-ink to-transparent"
          />

          {!pinned && chat.messages.length > 0 ? (
            <div className="mb-2 flex justify-center">
              <button
                type="button"
                onClick={scrollToBottom}
                className="flex items-center gap-1.5 border border-[var(--rule-strong)] bg-ink-2 px-3 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-bone uppercase transition-colors hover:border-bone"
              >
                <ArrowDown aria-hidden="true" className="size-3" strokeWidth={2} />
                Latest
              </button>
            </div>
          ) : null}

          <div className="bg-ink">
            <Composer
              onSend={(question) => {
                setPinned(true)
                chat.send(question)
              }}
              onStop={chat.stop}
              streaming={chat.streaming}
              disabled={unavailable || chat.regenerating}
              disabledReason={
                unavailable ? 'The assistant is unavailable' : 'Regenerating…'
              }
              autoFocus={prefill > 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
