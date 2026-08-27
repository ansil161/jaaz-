/* A small Markdown subset, parsed into a tree of plain objects.
 *
 * WHY NOT A LIBRARY. The site's constraints forbid new heavy dependencies,
 * and the usual choice (marked, or react-markdown with remark) is a large
 * dependency whose output is an HTML string — which then has to be injected
 * with dangerouslySetInnerHTML and sanitised with a second dependency, or it
 * becomes a cross-site-scripting hole fed directly by model output. Model
 * output is untrusted for exactly the same reason retrieved documents are: a
 * document in the knowledge base can contain anything, and some of it comes
 * back out inside an answer.
 *
 * This module produces data, never markup. The renderer turns that data into
 * React elements, and React escapes text nodes by construction. There is no
 * path from an answer to executable HTML because no HTML is ever built.
 *
 * WHAT IS SUPPORTED. What a grounded answer over a document corpus actually
 * emits: paragraphs, headings, both kinds of list, fenced code, blockquotes,
 * pipe tables, rules, and inline code/bold/italic/links. Plus citation
 * markers — [1], [2] — which are not Markdown at all but are the whole point
 * of the citation contract, so they are lexed here rather than pattern-
 * matched a second time in the renderer.
 *
 * Pure: strings in, objects out, no React, no DOM. That is what makes the
 * parsing testable on its own. */

const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/
const HEADING = /^(#{1,4})\s+(.+?)\s*#*$/
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/
const BULLET = /^(\s*)[-*+]\s+(.*)$/
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/
const QUOTE = /^\s*>\s?(.*)$/
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

/** Split a document into block-level nodes. */
export function parseBlocks(markdown) {
  const lines = String(markdown ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')

  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = FENCE.exec(line)
    if (fence) {
      index = readFencedCode(lines, index, fence, blocks)
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        inline: parseInline(heading[2]),
      })
      index += 1
      continue
    }

    if (RULE.test(line.trim())) {
      blocks.push({ type: 'rule' })
      index += 1
      continue
    }

    if (QUOTE.test(line)) {
      index = readQuote(lines, index, blocks)
      continue
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      index = readList(lines, index, blocks)
      continue
    }

    /* A table only if the row after the header is a divider. Without that
     * check, any paragraph containing a pipe becomes one. */
    if (line.includes('|') && TABLE_DIVIDER.test(lines[index + 1] ?? '')) {
      index = readTable(lines, index, blocks)
      continue
    }

    index = readParagraph(lines, index, blocks)
  }

  return blocks
}

function readFencedCode(lines, start, fence, blocks) {
  const marker = fence[1]
  const body = []
  let index = start + 1

  while (index < lines.length) {
    const candidate = lines[index].trim()
    const closes =
      candidate.length >= marker.length &&
      candidate.split('').every((character) => character === marker[0])
    if (closes) {
      index += 1
      break
    }
    body.push(lines[index])
    index += 1
  }

  blocks.push({
    type: 'code',
    /* Empty when the fence carried no language. The renderer shows a label
     * only when there is one — an invented "text" label claims something the
     * answer did not say. */
    language: fence[2] || '',
    content: body.join('\n'),
  })
  return index
}

function readQuote(lines, start, blocks) {
  const body = []
  let index = start

  while (index < lines.length) {
    const quoted = QUOTE.exec(lines[index])
    if (!quoted) break
    body.push(quoted[1])
    index += 1
  }

  /* Recursive, so a quoted list or fence renders as one. A blockquote in an
   * answer is usually a passage lifted from a document, and passages have
   * structure. */
  blocks.push({ type: 'quote', blocks: parseBlocks(body.join('\n')) })
  return index
}

function readList(lines, start, blocks) {
  const first = ORDERED.exec(lines[start])
  const ordered = Boolean(first)
  const items = []
  let index = start
  let current = null

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      /* One blank line inside a list is a loose list, not the end of it.
       * Two ends it, and so does anything that is not another item. */
      const next = lines[index + 1]
      if (!next?.trim()) break
      if (!BULLET.test(next) && !ORDERED.test(next)) break
      index += 1
      continue
    }

    const bullet = BULLET.exec(line)
    const numbered = ORDERED.exec(line)

    if (ordered ? numbered : bullet) {
      current = [ordered ? numbered[3] : bullet[2]]
      items.push(current)
      index += 1
      continue
    }

    /* A list of the other kind starting here ends this one, so the two do
     * not merge into a single mislabelled list. */
    if (bullet || numbered) break

    /* An indented continuation line belongs to the item above it. */
    if (current && /^\s+\S/.test(line)) {
      current.push(line.trim())
      index += 1
      continue
    }

    break
  }

  blocks.push({
    type: 'list',
    ordered,
    start: ordered ? Number(first[2]) : 1,
    items: items.map((parts) => parseInline(parts.join(' '))),
  })
  return index
}

function readTable(lines, start, blocks) {
  const header = splitRow(lines[start])
  const alignments = splitRow(lines[start + 1]).map((cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    return 'left'
  })

  const rows = []
  let index = start + 2

  while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
    rows.push(splitRow(lines[index]).map(parseInline))
    index += 1
  }

  blocks.push({ type: 'table', header: header.map(parseInline), alignments, rows })
  return index
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function readParagraph(lines, start, blocks) {
  const body = []
  let index = start

  while (index < lines.length) {
    const line = lines[index]
    if (
      !line.trim() ||
      FENCE.test(line) ||
      HEADING.test(line) ||
      QUOTE.test(line) ||
      BULLET.test(line) ||
      ORDERED.test(line) ||
      RULE.test(line.trim())
    ) {
      break
    }
    body.push(line.trim())
    index += 1
  }

  blocks.push({ type: 'paragraph', inline: parseInline(body.join(' ')) })
  return index
}

/* Inline lexing.
 *
 * Order inside the alternation is the precedence. Code spans come first, so
 * that bold markers inside backticks stay literal; links come before
 * citations, so that [1](https://…) reads as a link rather than a citation
 * followed by stray text. */
const INLINE_PATTERN = [
  '(`+)([\\s\\S]*?)\\1', // 1,2  code span
  '\\[([^\\]]*)\\]\\(([^)\\s]+)\\)', // 3,4  link
  '\\[(\\d{1,3})\\]', // 5    citation marker
  '\\*\\*([\\s\\S]+?)\\*\\*', // 6    bold
  '__([\\s\\S]+?)__', // 7    bold
  '\\*([^*\\n]+?)\\*', // 8    italic
  '_([^_\\n]+?)_', // 9    italic
].join('|')

/* Only schemes that cannot execute. `javascript:` is the obvious one, but
 * `data:` is equally capable of carrying a document, and a model that has
 * read an untrusted PDF is perfectly able to emit either. Anything else
 * renders as plain text rather than as a link that quietly does nothing — a
 * dead link looks like a bug; visible text looks like what it is. */
const SAFE_URL = /^(?:https?:\/\/|mailto:|\/)/i

export function parseInline(text) {
  const source = String(text ?? '')
  const tokens = []
  let cursor = 0

  /* A fresh scanner per call, not a shared module-level one.
   *
   * This function recurses — the contents of a bold span are themselves
   * inline tokens — and a /g regex carries `lastIndex` as mutable state. A
   * shared instance would have the inner call reset that index to zero and
   * leave it there, so the outer loop would restart at the beginning of its
   * own string and never terminate. Constructing one per call is a few
   * microseconds; the alternative hangs the tab. */
  const scanner = new RegExp(INLINE_PATTERN, 'g')
  let match = scanner.exec(source)

  while (match !== null) {
    if (match.index > cursor) {
      tokens.push({ type: 'text', value: source.slice(cursor, match.index) })
    }

    if (match[2] !== undefined) {
      tokens.push({ type: 'code', value: match[2].trim() })
    } else if (match[4] !== undefined) {
      const href = match[4]
      if (SAFE_URL.test(href)) {
        tokens.push({ type: 'link', href, tokens: parseInline(match[3]) })
      } else {
        tokens.push({ type: 'text', value: match[0] })
      }
    } else if (match[5] !== undefined) {
      tokens.push({ type: 'citation', number: Number(match[5]) })
    } else if (match[6] !== undefined || match[7] !== undefined) {
      tokens.push({ type: 'strong', tokens: parseInline(match[6] ?? match[7]) })
    } else if (match[8] !== undefined || match[9] !== undefined) {
      tokens.push({ type: 'emphasis', tokens: parseInline(match[8] ?? match[9]) })
    }

    cursor = match.index + match[0].length
    match = scanner.exec(source)
  }

  if (cursor < source.length) {
    tokens.push({ type: 'text', value: source.slice(cursor) })
  }

  return tokens
}

/* Whether a partial answer currently ends inside an unclosed code fence.
 *
 * Mid-stream the opening fence has arrived and its closing one has not, and
 * a naive parse renders everything after it as one growing code block that
 * snaps back to prose when the fence finally lands. Knowing about it lets
 * the renderer close the block itself while tokens are still arriving. */
export function hasOpenFence(markdown) {
  let open = false
  for (const line of String(markdown ?? '').split('\n')) {
    if (FENCE.test(line)) open = !open
  }
  return open
}
