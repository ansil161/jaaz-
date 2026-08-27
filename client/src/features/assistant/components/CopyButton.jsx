import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/* Copy to clipboard, with the confirmation that makes it believable.
 *
 * Without the momentary "Copied", a copy button is a control that gives no
 * evidence it did anything — people press it twice and still do not know.
 *
 * The timer is cleared on unmount. A message can be removed while the
 * confirmation is still showing (a regenerate replaces it), and setting
 * state on a gone component is a warning in development and a leak in
 * principle.
 *
 * `navigator.clipboard` is unavailable on an insecure origin and can be
 * refused by permission policy. Both are reported as a failed state rather
 * than swallowed, because silence here is indistinguishable from success. */
export default function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className = '',
  iconOnly = false,
}) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(value ?? '')
      setState('copied')
    } catch {
      setState('failed')
    }
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  const copied = state === 'copied'
  const text = state === 'failed' ? 'Press Ctrl+C' : copied ? copiedLabel : label
  const Icon = copied ? Check : Copy

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={iconOnly ? text : undefined}
      className={[
        'inline-flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors',
        copied ? 'text-bone' : 'text-mist hover:text-paper',
        className,
      ].join(' ')}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.5} />
      {/* Announced either way. Hiding the label visually is a layout
          decision; hiding it from a screen reader would remove the only
          feedback the control gives. */}
      <span className={iconOnly ? 'sr-only' : undefined}>{text}</span>
    </button>
  )
}
