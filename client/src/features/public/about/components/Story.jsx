import { story } from '@/features/public/data/about'
import { Lines, Figure, ScrubText, Drift, Rise, Rule } from '@/features/public/components/Motion'
import { SectionLabel } from '@/features/public/components/Editorial'

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
   because JAAZ has not supplied one. The gap is left EMPTY on the
   page rather than filled — and, since this section shipped, rather
   than papered over with a visible "to confirm" note. That note is a
   marker for the team, and a client reading the About page should not
   be shown the studio's own to-do list. The data still carries it;
   `story.founding.confirm` is what keeps it off the page, and
   clearing that flag publishes the real thing the moment there is
   one.

   The section now closes on the five disciplines instead. The
   paragraph above it claims they sit under a single roof; the strip
   is that claim, made legible, and it gives the close a beat of its
   own rather than trailing off where the placeholder used to be.
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

            {/* Only ever rendered once JAAZ has supplied a real
                founding story. Until then this is nothing at all —
                not a placeholder addressed to the visitor. */}
            {!story.founding.confirm && story.founding.body && (
              <div className="mt-12">
                <h3 className="t-label text-ink/45">{story.founding.heading}</h3>
                <div className="mt-4 space-y-6">
                  {story.founding.body.map((para) => (
                    <Lines key={para} as="p" className="t-body max-w-xl text-ink/65">
                      {para}
                    </Lines>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- The close. Full width again, so the section ends at a
                wider measure than the column that leads into it. The
                hairline draws itself across, then the disciplines
                arrive one after another; each carries its own rule
                that runs out under the word on hover, so the strip
                keeps something in reserve for anyone who touches it. --- */}
        <div className="mt-24 sm:mt-32">
          <p className="t-label text-ink/45">{story.roof.label}</p>
          <Rule className="mt-6 text-ink" />

          <Rise
            as="ul"
            className="mt-10 grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
            stagger={0.12}
            y={26}
          >
            {story.roof.items.map((item, i) => (
              <li key={item} className="group">
                <span className="t-label block text-ink/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="t-body mt-3 block text-ink">{item}</span>
                <span
                  className="mt-3 block h-px w-full origin-left scale-x-0 bg-ink/40 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  aria-hidden="true"
                />
              </li>
            ))}
          </Rise>
        </div>
      </div>
    </section>
  )
}
