/* A labelled text input with its error message wired up.
 *
 * The wiring is the point. A red border says "wrong" to people who can see
 * it; `aria-invalid` says it to everyone else, and `aria-describedby`
 * pointing at the message is what makes a screen reader actually read the
 * reason out when focus lands on the field. */
export default function Field({
  id,
  label,
  error,
  hint,
  trailing,
  inputRef,
  ...inputProps
}) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ')

  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[0.6875rem] tracking-[0.18em] text-mist uppercase"
      >
        {label}
      </label>

      <div className="relative mt-2">
        <input
          {...inputProps}
          id={id}
          ref={inputRef}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy || undefined}
          className={[
            'w-full rounded-none border-b bg-transparent py-3 text-base text-bone',
            'placeholder:text-ash focus:outline-none',
            'transition-colors duration-200',
            /* The focus ring is suppressed here and replaced by the border
               colour, because a 2px outline around a bottom-ruled input
               reads as a box appearing out of nowhere. The state is still
               unmistakable, and it is still visible at high contrast. */
            trailing ? 'pr-12' : '',
            error
              ? 'border-signal focus:border-signal'
              : 'border-[var(--rule)] focus:border-bone',
          ].join(' ')}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="mt-2 text-sm text-ash">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-2 text-sm text-signal">
          {error}
        </p>
      ) : null}
    </div>
  )
}
