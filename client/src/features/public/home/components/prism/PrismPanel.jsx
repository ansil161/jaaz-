/* ============================================================
   THE READING PANEL

   What the room is doing, for the face you are on. It is the one
   block in the section allowed to be information rather than
   composition, and it is kept to three things: a line about the
   room, a sentence, and four axes.

   ------------------------------------------------------------
   THE PANEL DOES NOT NAME THE FACE, AND THAT IS THE POINT

   It used to open with "03 / 05" over "Listen" over "Two
   channels, nothing else" — a position, a name and a caption
   stacked in a column, which is a label above a heading above a
   subheading before a single fact arrives. The word LISTEN was
   already on the page twice: on its own marker beside the
   photograph, and in the index along the foot. A third setting of
   it, at the largest size of the three, made the panel the
   loudest thing in a composition whose subject is a room.

   So the ring names the face, the index places it, and the panel
   says what the room is doing. Each element does one job. The
   caption becomes the panel's opening voice — set in the display
   italic, because "Two channels, nothing else" is a phrase from a
   catalogue rather than a field label, and the italic is what
   says so.

   The screen reader still gets number, name and description
   together, out of the live region at the foot.

   ------------------------------------------------------------
   NO CARD, NO BOX, NO CONTAINER

   The name says panel and the markup deliberately does not build
   one. No background, no border around the group, no radius —
   only hairline rules BETWEEN the readout rows, which are
   separators rather than an enclosure. The moment this gains an
   outline it becomes the sidebar of a dashboard, and the whole
   section goes with it: a room photograph with a widget beside it
   is a product screenshot.

   ------------------------------------------------------------
   MONO MEANS MEASUREMENT

   The readout's KEY is mono, because it names an axis being
   measured. Its VALUE is the sans, because "Immersive" is a word.
   Setting both in mono — which the first build did — is the
   costume this site's engineering voice is most likely to reach
   for and least entitled to, and it turned the block into
   terminal output.
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
      <span className="mask-line block">
        <h3 data-swap className="prism-lede block text-pure">
          {mode.title}
        </h3>
      </span>

      {/* The rule is the panel's only ornament, and it is the same
          gesture the active face carries out in the ring — one
          line, extending. */}
      <span
        data-swap-soft
        className="mt-[clamp(0.75rem,1.8vh,1.125rem)] block h-px w-14 bg-cove/70"
      />

      <p className="t-body mt-[clamp(0.75rem,2vh,1.25rem)] max-w-[34ch] text-bone">
        <span className="mask-line block">
          <span data-swap className="block">
            {mode.line}
          </span>
        </span>
      </p>

      {/* The four axes, stated in English — see the note in
          data/prism.js on why this is not an AV specification.

          CAPPED ON A TABLET. Below `lg` this is a 2x2 grid in a
          column as wide as the page, and at 834px that puts
          "Ambience" and "Intimate" at opposite ends of a 380px
          rule with nothing between them — a row that has stopped
          being a pair and become two unrelated words. The cap is a
          reading measure, not a container. */}
      <dl
        data-swap-soft
        className="prism-short:hidden mt-[clamp(1rem,2.6vh,1.5rem)] grid max-w-[34rem] grid-cols-2 gap-x-8 lg:mt-[clamp(1.25rem,3.4vh,2.25rem)] lg:block lg:max-w-none"
      >
        {mode.readout.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-6 border-t border-white/[0.1] py-[clamp(0.375rem,1.1vh,0.5rem)]"
          >
            <dt className="prism-readout-k">{k}</dt>
            <dd className="prism-readout-v">{v}</dd>
          </div>
        ))}
      </dl>

      {/* The motion above is decorative and a screen reader never
          receives it, so the change is announced in words — and
          this is where the face's number and name still live for
          anyone not reading the composition. */}
      <span className="sr-only" aria-live="polite">
        {`${mode.n} of 0${total}. ${mode.word}. ${mode.title}. ${mode.line}`}
      </span>
    </div>
  )
}
