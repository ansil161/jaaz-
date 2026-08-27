import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'

/* The question box.
 *
 * A textarea rather than an input, because questions to a knowledge base run
 * to several lines and a single-line field that scrolls sideways hides what
 * you typed. It grows with the content and stops at a ceiling, so a long
 * question never pushes the conversation off the screen.
 *
 * Enter sends; Shift+Enter opens a line. That is the convention every chat
 * interface has taught people, and inverting it here would be a novelty tax.
 * The hint is written on the control rather than left to be discovered. */

const MAX_HEIGHT_PX = 200

export default function Composer({
  onSend,
  onStop,
  streaming,
  disabled,
  disabledReason,
  maxCharacters = 4000,
  autoFocus = false,
}) {
  const [value, setValue] = useState('')
  const textarea = useRef(null)

  /* Layout effect, not effect: this measures and writes a height, and doing
   * it after paint makes the box visibly jump a frame on every keystroke. */
  useLayoutEffect(() => {
    const node = textarea.current
    if (!node) return
    /* Reset before measuring, or scrollHeight only ever grows — the box
     * would never shrink back when text is deleted. */
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_HEIGHT_PX)}px`
    node.style.overflowY = node.scrollHeight > MAX_HEIGHT_PX ? 'auto' : 'hidden'
  }, [value])

  useEffect(() => {
    if (autoFocus) textarea.current?.focus()
  }, [autoFocus])

  const send = useCallback(() => {
    const question = value.trim()
    if (!question || streaming || disabled) return
    /* Cleared immediately, not after the request resolves. The question is
     * already on screen as a message by then, and a box that still holds it
     * invites sending it twice. */
    setValue('')
    onSend(question)
  }, [value, streaming, disabled, onSend])

  function onKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return
    /* Never intercept Enter while an IME composition is open — in Japanese,
     * Chinese or Korean input that keystroke commits a candidate, and
     * sending on it truncates the word being typed. */
    if (event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  const overLimit = value.length > maxCharacters
  const nearLimit = value.length > maxCharacters * 0.9
  const canSend = value.trim().length > 0 && !overLimit && !disabled

  return (
    <div className="border border-[var(--rule)] bg-ink-2 focus-within:border-[var(--rule-strong)]">
      <div className="flex items-end gap-2 px-3 py-2.5">
        <label htmlFor="assistant-question" className="sr-only">
          Ask a question about the knowledge base
        </label>
        <textarea
          id="assistant-question"
          ref={textarea}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? (disabledReason ?? 'Unavailable') : 'Ask a question…'}
          aria-describedby="assistant-composer-hint"
          aria-invalid={overLimit || undefined}
          className="max-h-[200px] min-h-[1.5rem] flex-1 resize-none bg-transparent text-[0.9375rem] leading-relaxed text-paper placeholder:text-ash focus:outline-none disabled:cursor-not-allowed"
        />

        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="grid size-9 shrink-0 place-items-center border border-[var(--rule-strong)] text-bone transition-colors hover:border-bone"
          >
            <Square aria-hidden="true" className="size-3.5 fill-current" strokeWidth={0} />
            <span className="sr-only">Stop generating</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="grid size-9 shrink-0 place-items-center border border-bone bg-bone text-ink transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:bg-transparent disabled:text-ash disabled:opacity-100"
          >
            <ArrowUp aria-hidden="true" className="size-4" strokeWidth={2} />
            <span className="sr-only">Send question</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--rule)] px-3 py-1.5">
        <p
          id="assistant-composer-hint"
          className="font-mono text-[0.625rem] tracking-[0.14em] text-ash uppercase"
        >
          {disabled
            ? (disabledReason ?? 'Unavailable')
            : streaming
              ? 'Generating — Stop to interrupt'
              : 'Enter to send · Shift+Enter for a new line'}
        </p>

        {/* Silent until it is nearly relevant. A counter on an empty box is
            noise; one that appears at 90% is a warning. */}
        {nearLimit ? (
          <p
            aria-live="polite"
            className={`font-mono text-[0.625rem] tracking-[0.14em] uppercase ${
              overLimit ? 'text-signal' : 'text-mist'
            }`}
          >
            {value.length} / {maxCharacters}
          </p>
        ) : null}
      </div>
    </div>
  )
}
