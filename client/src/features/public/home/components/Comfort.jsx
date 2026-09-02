import { comfort } from '@/features/public/data/site'
import { Lines, ScrubText, Figure, Drift } from '@/features/public/components/Motion'

/* ============================================================
   CH. 05 — STAY LONGER.

   The slow section. It is placed directly after Engineering and
   it is supposed to feel different in the body, not merely to
   read differently — Engineering is six measured facts in a
   tight column, and this is three photographs, a great deal of
   air and about ninety words.

   ------------------------------------------------------------
   THERE IS NOTHING HERE TO OPERATE, AND THAT IS DELIBERATE

   <Calibration> is driven by a chair you pick, <Transform> by a
   seam you drag, <Feeling> by a word you press. Three sections
   in a row that hand the visitor a control would make the page
   read as a demo reel of interactions. This one is looked at.

   The pacing is the argument. A section claiming you will stop
   noticing how long you have been sitting there cannot be the
   section that hurries you through itself, so every plate here
   runs a deeper parallax and a longer entrance than the site's
   defaults, and the copy beside them counter-moves.

   ------------------------------------------------------------
   THE PLATES ARE CHOSEN ON THE PIXELS

   `comfortRoom` is the flagship cinema at a tighter crop, so it
   carries SEATING. `fluted` is a lounge vignette with no screen
   in it — cushions, stone, textile — so it carries MATERIAL, and
   captioning it as seating would be captioning a photograph as
   something a visitor can see it is not. `terrace` closes on the
   hour after the film.

   `chair` is not used anywhere in here. Its id comment says
   sculptural lounge chair; it renders as a bar/lobby, and this
   is the one section on the site where that would be spotted
   instantly.

   Every plate runs at full brightness. Nothing is laid over
   these photographs — all copy is beside or below them — and
   several rooms in this set are exposed near black already, so
   dimming them produces a black rectangle rather than a mood.
   ============================================================ */

export default function Comfort() {
  const [seating, material] = comfort.beats

  return (
    <section id={comfort.id} className="relative bg-ink py-24 sm:py-32 lg:py-40">
      {/* ---- The claim ---- */}
      <header className="shell-wide">
        <span className="t-label flex items-center gap-3 text-fog">
          {comfort.chapter && (
            <>
              {comfort.chapter}
              <span className="block h-px w-10 bg-white/20" aria-hidden="true" />
            </>
          )}
          <span className="text-mist">{comfort.label}</span>
        </span>

        {/* TWO WORDS AND A SENTENCE, SIDE BY SIDE. Stacked, this
            opening left the right two thirds of a laptop screen
            empty for the whole height of the viewport — which is not
            the same thing as generous, because there is nothing over
            there for the space to be generous TO. Set against the
            statement it becomes an asymmetric spread: a very short
            headline holding one column, a long sentence holding the
            other, and both landing on the same baseline. */}
        <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <Lines
            as="h2"
            className="t-display max-w-[8ch] leading-[1.02] text-bone lg:col-span-5"
            stagger={0.12}
          >
            {comfort.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display text-cove">{line}</em> : line}
              </span>
            ))}
          </Lines>

          {/* The supporting idea, and the only place in the section
              that gets the scrubbed word-by-word treatment. It
              resolves slowly BECAUSE it is the sentence the
              photographs below are evidence for — reserved language,
              used once.

              `pb` on the large step only: the display face sits well
              above its own descenders, so a statement aligned to the
              raw box of the headline beside it reads as sitting
              slightly low. */}
          <ScrubText
            as="p"
            className="t-heading mt-10 max-w-[26ch] text-bone lg:col-span-6 lg:col-start-7 lg:mt-0 lg:pb-[0.18em]"
            dim={0.14}
            start="top 82%"
            end="top 42%"
          >
            {comfort.statement}
          </ScrubText>
        </div>
      </header>

      {/* ---- Beat one: the chairs ----
          Portrait plate on the right, copy in a narrow column on the
          left travelling at its own rate. The two are never locked
          together, which is most of what gives a spread this quiet
          any depth at all. */}
      <div className="shell-wide mt-20 grid grid-cols-1 gap-y-10 sm:mt-28 lg:mt-36 lg:grid-cols-12 lg:gap-x-12">
        <Drift
          y={5}
          className="order-2 lg:order-1 lg:col-span-5 lg:self-center"
        >
          <div className="max-w-[34ch]">
            <h3 className="t-heading text-pure">{seating.title}</h3>
            <p className="t-body mt-4 text-fog">{seating.body}</p>
          </div>

          <div className="mt-12 max-w-[34ch] lg:mt-16">
            <h3 className="t-heading text-pure">{seating.second.title}</h3>
            <p className="t-body mt-4 text-fog">{seating.second.body}</p>
          </div>
        </Drift>

        {/* `scaleFrom` and `parallax` both run above the site
            defaults. This is the section's whole tempo control: the
            picture is still settling when you have finished the
            paragraph beside it. */}
        <Figure
          src={seating.plate}
          alt={seating.alt}
          className="order-1 aspect-[4/5] w-full lg:order-2 lg:col-span-6 lg:col-start-7"
          imgClassName="object-cover [--plate-contrast:1.03] [--plate-saturate:0.97]"
          parallax={12}
          scaleFrom={1.3}
          start="top 92%"
        />
      </div>

      {/* ---- Beat two: what the room is made of ----
          A wide plate carrying the full measure of the shell, then
          the two remaining comforts underneath it in a pair of
          columns. Wide after tall, so the section's own rhythm
          changes rather than repeating the first spread mirrored. */}
      <div className="shell-wide mt-24 sm:mt-32 lg:mt-40">
        <Figure
          src={material.plate}
          alt={material.alt}
          className="aspect-[16/9] w-full"
          imgClassName="object-cover [--plate-contrast:1.03] [--plate-saturate:0.97]"
          parallax={10}
          scaleFrom={1.26}
          start="top 92%"
        />

        <div className="mt-12 grid grid-cols-1 gap-y-10 lg:mt-16 lg:grid-cols-12 lg:gap-x-12">
          <Drift y={3} className="lg:col-span-5">
            <h3 className="t-heading text-pure">{material.title}</h3>
            <p className="t-body mt-4 max-w-[38ch] text-fog">{material.body}</p>
          </Drift>

          <Drift y={3} className="lg:col-span-5 lg:col-start-8">
            <h3 className="t-heading text-pure">{material.second.title}</h3>
            <p className="t-body mt-4 max-w-[38ch] text-fog">{material.second.body}</p>
          </Drift>
        </div>
      </div>

      {/* ---- The close ----
          The comfort nobody writes into a specification, and then
          the hour after the film. The letterbox plate is the widest
          frame in the section and the last thing before the closing
          line, so the section exhales before it speaks. */}
      <div className="shell-wide mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-12">
          <h3 className="t-heading text-pure lg:col-span-4">{comfort.close.title}</h3>
          <Lines as="p" className="t-body max-w-[52ch] text-fog lg:col-span-7 lg:col-start-6">
            {comfort.close.body}
          </Lines>
        </div>

        <Figure
          src={comfort.close.plate}
          alt={comfort.close.alt}
          className="mt-14 aspect-[21/9] w-full lg:mt-20"
          imgClassName="object-cover [--plate-contrast:1.02] [--plate-saturate:0.96]"
          parallax={8}
          scaleFrom={1.22}
          start="top 94%"
        />

        <Lines
          as="p"
          className="t-display mt-14 max-w-[15ch] leading-[1.02] text-bone lg:mt-20"
          stagger={0.1}
        >
          {comfort.close.line.pre}
          <em className="italic-display text-cove">{comfort.close.line.turn}</em>
          {comfort.close.line.post}
        </Lines>
      </div>
    </section>
  )
}
