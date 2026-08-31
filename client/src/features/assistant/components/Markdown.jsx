import { Fragment, memo, useMemo } from 'react'

import { hasOpenFence, parseBlocks } from '@/features/assistant/utils/markdown'
import CopyButton from './CopyButton'

/* Answer text, rendered as React elements.
 *
 * Never dangerouslySetInnerHTML. The parser hands back data and this builds
 * elements from it, so every string ends up in a text node that React
 * escapes. An answer is model output shaped by retrieved documents, and a
 * document in the knowledge base is untrusted input like any other upload —
 * this is the boundary that makes "a PDF containing a script tag" a boring
 * event rather than an interesting one.
 *
 * Memoised on the text. Streaming re-renders this component on every token,
 * and re-parsing the whole answer per token is quadratic work — noticeable
 * as stutter well before a long answer finishes. */

function InlineTokens({ tokens, sources, onCite }) {
  return tokens.map((token, index) => {
    switch (token.type) {
      case 'code':
        return (
          <code
            key={index}
            className="rounded-[2px] border border-[var(--rule)] bg-ink-3 px-1.5 py-0.5 font-mono text-[0.8125em] text-bone"
          >
            {token.value}
          </code>
        )

      case 'strong':
        return (
          <strong key={index} className="font-medium text-paper">
            <InlineTokens tokens={token.tokens} sources={sources} onCite={onCite} />
          </strong>
        )

      case 'emphasis':
        return (
          <em key={index} className="italic">
            <InlineTokens tokens={token.tokens} sources={sources} onCite={onCite} />
          </em>
        )

      case 'link':
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            /* noreferrer as well as noopener: the first stops the new tab
               reaching back through window.opener, the second stops the
               destination learning where the link came from. A link in an
               answer was written by a model reading arbitrary documents. */
            rel="noopener noreferrer"
            className="text-bone underline decoration-mist underline-offset-2 transition-colors hover:decoration-bone"
          >
            <InlineTokens tokens={token.tokens} sources={sources} onCite={onCite} />
          </a>
        )

      case 'citation':
        return (
          <Citation
            key={index}
            number={token.number}
            source={sources?.[token.number - 1]}
            onCite={onCite}
          />
        )

      default:
        return <Fragment key={index}>{token.value}</Fragment>
    }
  })
}

/* A citation marker: [1] rendered as a chip that points at its source card.
 *
 * A marker with no matching source is rendered as plain text, not as a dead
 * chip. The backend already strips markers the model invented — see
 * rag/citations.py — so reaching this branch means a marker survived that
 * has nothing behind it, and dressing it up as a citation would be the
 * interface making a claim the system cannot support. */
function Citation({ number, source, onCite }) {
  if (!source) return <span>[{number}]</span>

  return (
    <button
      type="button"
      onClick={() => onCite?.(source, number)}
      title={source.documentName}
      className="mx-0.5 inline-flex min-w-[1.25rem] translate-y-[-0.1em] items-center justify-center rounded-[2px] border border-[var(--rule-strong)] px-1 align-baseline font-mono text-[0.625rem] leading-[1.35] text-fog transition-colors hover:border-bone hover:text-paper"
    >
      <span className="sr-only">Source {number}: </span>
      {number}
      <span className="sr-only">{source.documentName}</span>
    </button>
  )
}

function CodeBlock({ language, content }) {
  return (
    <div className="my-4 border border-[var(--rule)] bg-ink-2">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--rule)] px-3 py-1.5">
        <span className="font-mono text-[0.625rem] tracking-[0.14em] text-mist uppercase">
          {language || 'Code'}
        </span>
        <CopyButton value={content} iconOnly />
      </div>
      {/* The scroll container is the <pre>, not the page. A long line in a
          code block must never be the reason the whole console scrolls
          sideways. */}
      <pre className="overflow-x-auto px-3 py-3">
        <code className="font-mono text-[0.8125rem] leading-relaxed whitespace-pre text-bone">
          {content}
        </code>
      </pre>
    </div>
  )
}

const HEADING_CLASS = {
  1: 'mt-6 mb-3 font-display text-2xl text-paper',
  2: 'mt-6 mb-2 font-display text-xl text-paper',
  3: 'mt-5 mb-2 text-base font-medium text-paper',
  4: 'mt-4 mb-1.5 font-mono text-[0.6875rem] tracking-[0.16em] text-fog uppercase',
}

const ALIGN_CLASS = { left: 'text-left', right: 'text-right', center: 'text-center' }

function Block({ block, sources, onCite }) {
  const inline = <InlineTokens tokens={block.inline ?? []} sources={sources} onCite={onCite} />

  switch (block.type) {
    case 'heading': {
      const Tag = `h${Math.min(block.level + 2, 6)}`
      return <Tag className={HEADING_CLASS[block.level]}>{inline}</Tag>
    }

    case 'code':
      return <CodeBlock language={block.language} content={block.content} />

    case 'rule':
      return <hr className="my-6 border-0 border-t border-[var(--rule)]" />

    case 'quote':
      return (
        <blockquote className="my-4 border-l-2 border-[var(--rule-strong)] pl-4 text-mist">
          <Blocks blocks={block.blocks} sources={sources} onCite={onCite} />
        </blockquote>
      )

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag
          start={block.ordered ? block.start : undefined}
          className={[
            'my-3 space-y-1.5 pl-5',
            block.ordered ? 'list-decimal' : 'list-disc',
            'marker:text-ash',
          ].join(' ')}
        >
          {block.items.map((tokens, index) => (
            <li key={index} className="pl-1 leading-relaxed">
              <InlineTokens tokens={tokens} sources={sources} onCite={onCite} />
            </li>
          ))}
        </Tag>
      )
    }

    case 'table':
      return (
        /* Same rule as a code block: the table scrolls, the page does not. */
        <div className="my-4 overflow-x-auto border border-[var(--rule)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--rule)]">
                {block.header.map((tokens, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={`px-3 py-2 font-mono text-[0.625rem] tracking-[0.14em] whitespace-nowrap text-mist uppercase ${
                      ALIGN_CLASS[block.alignments[index]] ?? 'text-left'
                    }`}
                  >
                    <InlineTokens tokens={tokens} sources={sources} onCite={onCite} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[var(--rule)] last:border-0">
                  {row.map((tokens, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`px-3 py-2 align-top ${
                        ALIGN_CLASS[block.alignments[cellIndex]] ?? 'text-left'
                      }`}
                    >
                      <InlineTokens tokens={tokens} sources={sources} onCite={onCite} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return <p className="my-3 leading-relaxed first:mt-0 last:mb-0">{inline}</p>
  }
}

function Blocks({ blocks, sources, onCite }) {
  return blocks.map((block, index) => (
    <Block key={index} block={block} sources={sources} onCite={onCite} />
  ))
}

function Markdown({ text, sources, onCite }) {
  const blocks = useMemo(() => {
    /* Mid-stream, an opening fence has arrived and its closing one has not,
     * so everything after it would parse as one code block that grows and
     * then snaps back to prose when the fence lands. Closing it here keeps
     * the rendering stable while tokens arrive. */
    const source = hasOpenFence(text) ? `${text}\n\`\`\`` : text
    return parseBlocks(source)
  }, [text])

  return (
    <div className="text-[0.9375rem] text-fog">
      <Blocks blocks={blocks} sources={sources} onCite={onCite} />
    </div>
  )
}

export default memo(Markdown)
