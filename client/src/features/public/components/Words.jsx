import { Fragment } from 'react'

/* ============================================================
   WORDS — a heading that can be revealed word by word.

   The site already has a masked LINE reveal (`revealLines`, built
   on SplitText). This is the word-level sibling, and it exists for
   one specific reason: SplitText re-splits on resize, which
   rebuilds the elements a timeline is holding references to. That
   is fine for a fire-once entrance and wrong for a heading whose
   reveal is scrubbed by a pinned section's own timeline — the
   references go stale mid-scroll and the heading is left hanging
   behind its mask.

   Splitting on a space in JSX gives permanent DOM that no resize
   can invalidate, so the timeline built against it stays valid for
   the life of the component. Each word gets `.mask-word`, an
   inline overflow clip, so the heading still wraps naturally at
   every width.
   ============================================================ */

export default function Words({
  as: Tag = 'h2',
  text,
  className = '',
  wordClassName = '',
  attr = 'data-word',
  children,
}) {
  const words = String(text).split(' ')

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="mask-word">
            <span {...{ [attr]: '' }} className={`inline-block ${wordClassName}`}>
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
      {/* Anything that has to sit on the last line WITH the words — an
          affordance arrow, a footnote mark — rather than on a line of
          its own underneath a block heading. */}
      {children}
    </Tag>
  )
}
