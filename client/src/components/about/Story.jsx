import { story } from '../../data/about'
import { Lines, Figure, ScrubText, Drift } from '../ui/Motion'
import { SectionLabel, ConfirmNote } from '../ui/Editorial'

/* ============================================================
   ABOUT 03 — OUR STORY

   The page inverts to paper. After two black sections the switch
   reads as stepping out of the room and into the studio.

   The structure is a magazine feature, not a timeline: copy runs
   down the left, a tall plate hangs on the right and sits LOWER
   than the text it belongs to, and a full-width pull quote cuts
   the column in half. That break is what stops six paragraphs of
   company history from reading as an About-page obligation.

   There is no founding date and no founder biography here,
   because JAZ has not supplied one. The gap is marked rather
   than filled.
   ============================================================ */

export default function Story() {
  return (
    <section id="story" className="on-paper relative bg-paper py-28 text-ink sm:py-36">
      <div className="shell-wide">
        <SectionLabel tone="paper">{story.label}</SectionLabel>

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* --- The argument --- */}
          <div className="lg:col-span-6">
            <Lines as="h2" className="t-display text-ink" stagger={0.11}>
              {story.heading.map((line, i) => (
                <span key={line} className="block">
                  {i === 1 ? <em className="italic-display">{line}</em> : line}
                </span>
              ))}
            </Lines>

            <div className="mt-10 max-w-xl space-y-6">
              {story.body.slice(0, 2).map((para) => (
                <Lines key={para} as="p" className="t-body text-ink/65">
                  {para}
                </Lines>
              ))}
            </div>
          </div>

          {/* --- The plate. Deliberately dropped below the heading it
                  sits beside, so the two columns never line up. --- */}
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-24">
            <Drift y={4}>
              <Figure
                src={story.image}
                alt={story.imageAlt}
                parallax={10}
                placeholder="bg-ink/8"
                className="aspect-[4/5] w-full"
              />
            </Drift>
            <p className="t-label mt-4 text-ink/40">{story.imageAlt}</p>
          </div>
        </div>

        {/* --- The break. Full width, and the only place on this page
                where a sentence resolves word by word as you scroll. --- */}
        <div className="mt-24 border-y border-ink/15 py-16 sm:mt-28 sm:py-20">
          <ScrubText
            as="blockquote"
            className="t-display max-w-[16ch] text-ink"
            start="top 88%"
            end="bottom 62%"
            dim={0.14}
          >
            {story.pull}
          </ScrubText>
        </div>

        {/* --- The remainder, set narrow and offset right so the section
                closes at a different measure than it opened. --- */}
        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-6">
            {story.body.slice(2).map((para) => (
              <Lines key={para} as="p" className="t-body max-w-xl text-ink/65">
                {para}
              </Lines>
            ))}

            <div className="mt-12">
              <h3 className="t-label text-ink/45">{story.founding.heading}</h3>
              <ConfirmNote tone="paper" className="mt-4">
                {story.founding.note}
              </ConfirmNote>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
