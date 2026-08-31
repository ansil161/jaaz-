import ProjectFrame from './ProjectFrame'
import { Lines, Rule } from '@/features/public/components/Motion'

/* ============================================================
   TECHNOLOGY — what JAAZ actually delivered, in four lines.

   DELIBERATELY NOT FOUR CARDS.
   Four boxes each holding a thumbnail, a heading and a sentence
   is the single most predictable way to render this content, and
   it is predictable because it makes no decision: every item is
   given identical weight in an identical container, so the
   layout says nothing the list did not already say.

   Set as ruled rows instead — the way a specification schedule
   is set — the section reads as a document rather than as a
   feature grid, the four items are legibly ONE list rather than
   four objects, and the photographs are free to sit at different
   sizes on alternating sides.

   The plate is small on purpose. This section is the caption to
   the gallery above it, not a second gallery.
   ============================================================ */

export default function DetailTechnology({ items }) {
  return (
    <section className="relative bg-ink-2 py-[13vh]" aria-labelledby="tech-heading">
      <div className="shell-wide">
        <div className="flex items-center gap-6">
          <h2 id="tech-heading" className="t-label shrink-0 text-mist">
            Technology
          </h2>
          <Rule className="text-pure" />
        </div>

        <div className="mt-[6vh]">
          {items.map((item, i) => {
            const right = i % 2 === 1
            return (
              <div
                key={item.label}
                className="grid items-center gap-y-7 border-t border-white/10 py-10 sm:grid-cols-12 sm:gap-x-10 lg:py-12"
              >
                {/* Four columns for the plate, seven for the words, and
                    they meet in the middle of the row. At three the
                    plate read as a thumbnail with a dead column beside
                    it — the body copy is capped at a 54-character
                    measure whatever the grid says, so widening the TEXT
                    column would only have moved the empty space, not
                    closed it. The picture had to grow instead. */}
                <div
                  className={`sm:col-span-5 lg:col-span-4 ${
                    right ? 'sm:order-2 sm:col-start-8 lg:col-start-9' : 'sm:order-1'
                  }`}
                >
                  <ProjectFrame
                    src={item.src}
                    srcSet={item.srcSet}
                    ratio={item.ratio}
                    alt=""
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 40vw, 100vw"
                    inset={7}
                    drift={5}
                    scaleFrom={1.12}
                    imgClassName="[--plate-saturate:0.85]"
                  />
                </div>

                <div
                  className={`sm:col-span-7 ${
                    right ? 'sm:order-1 sm:col-start-1' : 'sm:order-2 sm:col-start-6'
                  }`}
                >
                  <Lines as="h3" className="t-heading text-bone">
                    {item.label}
                  </Lines>
                  <Lines as="p" className="t-body mt-4 max-w-[54ch] text-mist">
                    {item.body}
                  </Lines>
                </div>
              </div>
            )
          })}
          <div className="border-t border-white/10" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
