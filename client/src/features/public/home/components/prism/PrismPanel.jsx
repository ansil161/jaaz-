/* ============================================================
   THE READING PANEL

   What the room is doing, for the face you are on. It is the one
   block in the section that is allowed to be information rather
   than composition, and it is kept to four things: a position, a
   name, a description, and four axes.

   ------------------------------------------------------------
   NO CARD, NO PANEL, NO BOX

   The name says panel and the markup deliberately does not build
   one. There is no background, no border around the group and no
   radius — only hairline rules BETWEEN the readout rows, which
   are separators rather than a container. The moment this gains
   an outline it becomes the sidebar of a dashboard, and the
   whole section goes with it: a room photograph with a widget
   beside it is a product screenshot.

   ------------------------------------------------------------
   THE SWAP IS PER FACE, NOT PER FRAME

   Everything here is keyed on the mode and re-rendered five
   times across the whole pin, never on a scroll frame. The
   entrance is run by <Prism> against `[data-swap]` rather than
   by a transition here, so the panel, the room and the index all
   change on one timeline and cannot fall out of step.
   ============================================================ */

export default function PrismPanel({ mode, total, panelId, tabId, className = '' }) {
  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={`${tabId}-${mode.key}`}
      tabIndex={0}
      className={`focus-ring ${className}`}
    >
      {/* Position first, and set as a fraction rather than as a
          bare number: "03" alone is a label, "03 / 05" is a place
          in something, which is the only thing the reader needs
          before the name. */}
      <span className="t-num hidden text-[0.6875rem] text-mist lg:block">
        <span data-swap-soft className="inline-block text-cove">{mode.n}</span>
        <span className="text-fog/40"> / 0{total}</span>
      </span>

      <div className="lg:mt-[clamp(1.25rem,3vh,2.25rem)]">
        <span className="mask-line block">
          <h3 data-swap className="prism-word block text-pure">
            {mode.word}
          </h3>
        </span>
        {/* The rule under the name is the panel's only ornament,
            and it is the same gesture the active face carries out
            in the ring — one line, extending. */}
        <span data-swap-soft className="mt-3 block h-px w-16 bg-cove/70" />
      </div>

      <p className="mt-[clamp(0.875rem,2vh,1.25rem)]">
        <span className="mask-line block">
          <span data-swap className="t-label block text-fog">
            {mode.title}
          </span>
        </span>
      </p>

      <p className="t-body mt-[clamp(0.875rem,2vh,1.375rem)] max-w-[30ch] text-bone">
        <span className="mask-line block">
          <span data-swap className="block">
            {mode.line}
          </span>
        </span>
      </p>

      {/* The four axes. Stated in English — see the note in
          data/prism.js on why this is not an AV specification. */}
      <dl data-swap-soft className="mt-[clamp(0.875rem,2.4vh,1.25rem)] grid grid-cols-2 gap-x-8 lg:mt-[clamp(1.5rem,4vh,2.5rem)] lg:block">
        {mode.readout.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-6 border-t border-white/[0.1] py-[clamp(0.4rem,1.1vh,0.625rem)]"
          >
            <dt className="t-label text-[0.5625rem] text-mist">{k}</dt>
            <dd className="t-label text-[0.5625rem] text-bone">{v}</dd>
          </div>
        ))}
      </dl>

      {/* The motion above is decorative and a screen reader never
          receives it, so the change is announced in words. */}
      <span className="sr-only" aria-live="polite">
        {`${mode.n} of 0${total}. ${mode.word}. ${mode.title}. ${mode.line}`}
      </span>
    </div>
  )
}
