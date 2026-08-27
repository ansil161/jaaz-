import { forwardRef, useState } from 'react'
import { ChevronDown, FileText } from 'lucide-react'

/* Where an answer came from.
 *
 * Every card here corresponds to a passage that was actually retrieved and
 * actually put in the prompt. The backend builds them from the retrieval
 * result and strips any marker the model invented (rag/citations.py), so
 * nothing on this row is the model's word for it. That is the whole value of
 * a citation: it is checkable.
 *
 * The excerpt is collapsed by default. Expanded, it is the passage the model
 * was given — which is the only way for a reader to judge whether the answer
 * followed from it, and the difference between a citation and a decoration. */

function locationOf(source) {
  if (source.page) return `Page ${source.page}`
  if (source.pages?.length === 1) return `Page ${source.pages[0]}`
  if (source.pages?.length > 1) {
    return `Pages ${source.pages[0]}–${source.pages[source.pages.length - 1]}`
  }
  if (source.heading) return source.heading
  /* Falls back to the chunk's position. Less useful than a page number, but
     honest — and it is what makes a passage findable in the console. */
  return `Passage ${source.chunkIndex + 1}`
}

const SourceCard = forwardRef(function SourceCard({ source, highlighted }, ref) {
  const [open, setOpen] = useState(false)

  return (
    <li
      ref={ref}
      className={[
        'border transition-colors duration-200',
        highlighted ? 'border-cove/60 bg-ink-3' : 'border-[var(--rule)] bg-ink-2',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left"
      >
        <span
          aria-hidden="true"
          className="mt-px grid size-5 shrink-0 place-items-center rounded-[2px] border border-[var(--rule-strong)] font-mono text-[0.625rem] text-fog"
        >
          {source.citationNumber}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <FileText
              aria-hidden="true"
              className="size-3.5 shrink-0 text-ash"
              strokeWidth={1.5}
            />
            <span className="truncate text-sm text-paper">{source.documentName}</span>
          </span>
          <span className="mt-0.5 block font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase">
            {locationOf(source)}
          </span>
        </span>

        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 size-4 shrink-0 text-ash transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <div className="border-t border-[var(--rule)] px-3 py-3">
          <p className="font-mono text-[0.625rem] tracking-[0.14em] text-ash uppercase">
            Retrieved passage
          </p>
          {source.excerpt ? (
            <p className="mt-2 text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-mist">
              {source.excerpt}
            </p>
          ) : (
            /* Expected on a reopened conversation, not a failure. The passage
               text is shown while the answer is live but is deliberately not
               stored with the message — the reference is, so the passage can
               still be found in the knowledge base. */
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ash">
              The passage itself is not kept with the conversation. Open{' '}
              {source.documentName} in the knowledge base to read it.
            </p>
          )}
        </div>
      ) : null}
    </li>
  )
})

export default function SourceCards({ sources, highlightedChunkId, cardRefs }) {
  if (!sources?.length) return null

  return (
    <div className="mt-5">
      <p className="font-mono text-[0.625rem] tracking-[0.16em] text-ash uppercase">
        {sources.length === 1 ? '1 source' : `${sources.length} sources`}
      </p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <SourceCard
            key={source.chunkId}
            source={source}
            highlighted={source.chunkId === highlightedChunkId}
            ref={(node) => {
              if (!cardRefs) return
              if (node) cardRefs.current.set(source.chunkId, node)
              else cardRefs.current.delete(source.chunkId)
            }}
          />
        ))}
      </ul>
    </div>
  )
}
