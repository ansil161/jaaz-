/* ============================================================
   THE FILTER — a line of words, and a rule under one of them.

   No pills, no chips, no boxes. A filter is a sentence the
   visitor is completing ("show me … outdoor"), and on a page
   this quiet, seven filled capsules across the top would be the
   loudest object on the screen — louder than any of the rooms
   they filter, which inverts the whole page.

   The active state is the only thing that needs a container, so
   it is the only thing that gets one: a hairline under the word,
   drawn in warm light. Every other item is set in the same
   weight, one step down in value.

   `aria-pressed` rather than a tab set: these are toggles over
   one list, not tabs over separate panels, and calling them tabs
   in the accessibility tree would promise arrow-key navigation
   between panels that do not exist.
   ============================================================ */

export default function ProjectFilter({ filters, active, onSelect, shown, total }) {
  return (
    <div className="shell-wide">
      <div className="flex flex-col gap-6 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        {/* -mx-1 pulls the first word back onto the gutter line: the
            per-item padding that makes each one a comfortable touch
            target would otherwise indent the row against everything
            else on the page. */}
        <div className="-mx-1 flex flex-wrap items-center gap-x-1 gap-y-1">
          {filters.map((f) => {
            const on = f.id === active
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelect(f.id)}
                aria-pressed={on}
                className={`focus-ring relative px-1 py-2.5 transition-colors duration-500 ${
                  on ? 'text-pure' : 'text-ash hover:text-fog'
                }`}
              >
                <span className="t-label">{f.label}</span>
                {/* Under the WORD, not down on the section rule. Seven
                    labels wrap to three rows on a phone, and a mark
                    positioned against the rule would be drawn straight
                    through whichever row happened to be underneath the
                    active one. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-1 bottom-1.5 block h-px origin-left bg-cove transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    on ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* The filter reports its own result. Tabular, so the number
            changing does not shift the rule beside it. */}
        <span className="t-num shrink-0 text-xs text-ash">
          {String(shown).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
