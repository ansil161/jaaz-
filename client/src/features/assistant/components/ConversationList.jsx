import { useState } from 'react'
import { MessageSquarePlus, Trash2 } from 'lucide-react'

import Spinner from '@/components/feedback/Spinner'

/* Past conversations, newest first.
 *
 * Sorting is the server's — `-updated_at` — because a conversation's
 * usefulness is measured by its last turn and only the server knows when
 * that was. The list is not re-sorted here.
 *
 * Deleting asks first, inline. A conversation is not recoverable and the
 * button sits next to the one that opens it, which is the situation a
 * confirmation step is actually for. Inline rather than a modal: a dialog
 * for a one-line decision is heavier than the decision. */

function relativeTime(value) {
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return ''

  const seconds = Math.round((Date.now() - then.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Row({ conversation, active, onOpen, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <li className="border-l-2 border-l-signal bg-ink-3 px-3 py-2.5">
        <p className="text-[0.8125rem] text-fog">Delete this conversation?</p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirming(false)
              onDelete(conversation)
            }}
            className="font-mono text-[0.625rem] tracking-[0.14em] text-signal uppercase transition-opacity hover:opacity-75"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-paper"
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onOpen(conversation)}
        aria-current={active ? 'true' : undefined}
        className={[
          'flex w-full flex-col items-start gap-0.5 py-2.5 pr-10 pl-3 text-left transition-colors duration-150',
          active ? 'bg-ink-4 text-paper' : 'text-fog hover:bg-ink-3 hover:text-paper',
        ].join(' ')}
      >
        <span className="w-full truncate text-[0.8125rem] leading-snug">
          {conversation.title}
        </span>
        <span className="font-mono text-[0.5625rem] tracking-[0.14em] text-ash uppercase">
          {relativeTime(conversation.updatedAt)}
          {conversation.messageCount ? ` · ${conversation.messageCount} messages` : ''}
        </span>
      </button>

      {/* Revealed on hover, but always reachable from the keyboard — an
          action that only exists on hover does not exist for a keyboard or a
          touch screen. */}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="absolute top-2.5 right-2 p-1.5 text-ash opacity-0 transition-opacity group-hover:opacity-100 hover:text-signal focus-visible:opacity-100"
      >
        <Trash2 aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
        <span className="sr-only">Delete “{conversation.title}”</span>
      </button>
    </li>
  )
}

export default function ConversationList({
  conversations,
  loading,
  error,
  activeId,
  onOpen,
  onNew,
  onDelete,
  onRetry,
}) {
  return (
    <div className="flex h-full flex-col border border-[var(--rule)] bg-ink-2">
      <div className="border-b border-[var(--rule)] p-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2 border border-[var(--rule-strong)] px-3 py-2.5 font-mono text-[0.625rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
        >
          <MessageSquarePlus aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          New chat
        </button>
      </div>

      <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="flex items-center gap-3 px-3 py-6 text-[0.8125rem] text-mist">
            <Spinner label="Loading conversations" />
            <span aria-hidden="true">Loading…</span>
          </p>
        ) : error ? (
          <div role="alert" className="px-3 py-6">
            <p className="text-[0.8125rem] leading-relaxed text-fog">{error.message}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-paper"
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-6 text-[0.8125rem] leading-relaxed text-ash">
            Nothing yet. Ask a question and it will be saved here.
          </p>
        ) : (
          <ul className="py-1">
            {conversations.map((conversation) => (
              <Row
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onOpen={onOpen}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </nav>
    </div>
  )
}
