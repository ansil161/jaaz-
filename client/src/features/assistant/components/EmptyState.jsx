import { Sparkles } from 'lucide-react'

/* The opening screen of a new conversation.
 *
 * Two jobs. It says what the assistant can and cannot do — an assistant that
 * only answers from uploaded documents will refuse a great many reasonable
 * questions, and being told that first is much better than discovering it
 * through a refusal. And it offers a way in, because an empty box with a
 * cursor is the hardest possible prompt.
 *
 * The suggestions are openers, not canned answers: they are phrased to be
 * about the knowledge base itself, so they work whatever has been uploaded
 * rather than pretending to know what is in it. */

/* Openers, chosen from what the knowledge base can actually answer well.
 *
 * A suggestion the assistant then declines is worse than no suggestion at
 * all — it teaches, on the very first interaction, that the thing does not
 * work. Each of these was verified against the indexed corpus before being
 * put here, and they are spread across the four things people ask about:
 * which system, what it costs in time, how the work runs, and the terms. */
const SUGGESTIONS = [
  'What is included in a private home theatre?',
  'What would you recommend for a large living room?',
  'How long does a dedicated cinema take to build?',
  'How does a JAAZ project run from survey to handover?',
]

export default function EmptyState({ onPick, disabled }) {
  return (
    <div className="py-10">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center border border-[var(--rule-strong)]"
      >
        <Sparkles className="size-4 text-fog" strokeWidth={1.5} />
      </span>

      <h2 className="mt-5 font-display text-3xl leading-tight text-paper sm:text-4xl">
        Ask about the work
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-mist">
        Answers are built from JAAZ's own documents — the nine solutions, how a
        project runs, and the terms — and every one cites the passage it came
        from. Where the documents are silent, so is the assistant.
      </p>

      <div className="mt-8">
        <p className="font-mono text-[0.625rem] tracking-[0.16em] text-ash uppercase">
          Try asking
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(suggestion)}
                className="w-full border border-[var(--rule)] px-4 py-3 text-left text-sm leading-snug text-fog transition-colors hover:border-[var(--rule-strong)] hover:text-paper disabled:cursor-not-allowed disabled:text-ash disabled:hover:border-[var(--rule)]"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
