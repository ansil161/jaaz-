import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import CopyButton from './CopyButton'
import Markdown from './Markdown'
import SourceCards from './SourceCards'

/* One turn of the conversation.
 *
 * The two roles are laid out differently on purpose. A question is short,
 * belongs to the person who asked it, and is set in a contained block on the
 * right. An answer is long, is the thing being read, and runs full width as
 * body text — putting it in a bubble would make a page of prose fight a
 * container for no reason.
 *
 * The caret while streaming is deliberately part of the text flow rather
 * than an absolutely-positioned overlay: it has to sit after the last
 * character wherever that lands, including mid-word. */

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="console-spinner ml-0.5 inline-block h-[1em] w-[0.4em] translate-y-[0.12em] bg-bone align-baseline"
    />
  )
}

function MetadataLine({ metadata, stopped }) {
  if (!metadata && !stopped) return null

  const parts = []
  if (stopped) parts.push('Stopped — not saved')
  if (metadata?.provider) parts.push(metadata.provider)
  if (metadata?.grounded === false) parts.push('No matching passages')
  if (metadata?.queryRewritten) parts.push('Question expanded from context')
  if (metadata?.totalMs) parts.push(`${(metadata.totalMs / 1000).toFixed(1)}s`)

  if (!parts.length) return null

  return (
    <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ash uppercase">
      {parts.join(' · ')}
    </p>
  )
}

export default function MessageBubble({
  message,
  streaming,
  onRegenerate,
  canRegenerate,
  showSources = true,
}) {
  const [highlighted, setHighlighted] = useState(null)
  const cardRefs = useRef(new Map())

  /* Clicking a marker in the text scrolls to its card and marks it. Without
   * the scroll, a citation on a long answer points at something below the
   * fold and the link does nothing visible. */
  const onCite = useCallback((source) => {
    setHighlighted(source.chunkId)
    cardRefs.current.get(source.chunkId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }, [])

  if (message.role === 'user') {
    return (
      <article className="flex justify-end">
        <div className="max-w-[85%] border border-[var(--rule)] bg-ink-3 px-4 py-3 sm:max-w-[70%]">
          <h3 className="sr-only">You asked</h3>
          <p className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-paper">
            {message.content}
          </p>
        </div>
      </article>
    )
  }

  const failed = Boolean(message.error)
  const empty = !message.content && !failed

  return (
    <article className="max-w-none">
      <h3 className="sr-only">Assistant answered</h3>

      {failed ? (
        <div
          role="alert"
          className="border border-[var(--rule)] border-l-2 border-l-signal px-4 py-3"
        >
          <p className="flex items-start gap-2.5 text-sm text-fog">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-signal"
              strokeWidth={1.5}
            />
            <span>{message.error}</span>
          </p>
          {message.content ? (
            <div className="mt-3 border-t border-[var(--rule)] pt-3">
              <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ash uppercase">
                Partial answer
              </p>
              <div className="mt-2">
                <Markdown text={message.content} sources={message.sources} onCite={onCite} />
              </div>
            </div>
          ) : null}
        </div>
      ) : empty ? (
        /* Retrieval is running and no token has arrived. Saying which stage
           it is in beats a bare spinner — the wait before the first token is
           the longest part of a RAG answer and the least self-explanatory. */
        <p className="flex items-center gap-3 text-sm text-mist">
          <span
            aria-hidden="true"
            className="console-spinner block size-3.5 rounded-full border border-mist/40 border-t-bone"
          />
          {message.sources?.length ? 'Reading the sources…' : 'Searching the knowledge base…'}
        </p>
      ) : (
        <>
          <Markdown text={message.content} sources={message.sources} onCite={onCite} />
          {streaming ? <Caret /> : null}
        </>
      )}

      {showSources && (
        <SourceCards
          sources={message.sources}
          highlightedChunkId={highlighted}
          cardRefs={cardRefs}
        />
      )}

      {/* Controls appear only once the answer is finished. A copy button
          beside a half-written answer copies half an answer. */}
      {!streaming && (message.content || failed) ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {message.content ? <CopyButton value={message.content} label="Copy" /> : null}

          {canRegenerate ? (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-paper"
            >
              <RefreshCw aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
              {failed ? 'Try again' : 'Regenerate'}
            </button>
          ) : null}

          <MetadataLine metadata={message.metadata} stopped={message.stopped} />
        </div>
      ) : null}
    </article>
  )
}
