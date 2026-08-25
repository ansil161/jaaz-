import { journal } from '../../data/site'
import { Lines, Rule, Figure, Rise } from '../ui/Motion'

/* ============================================================
   JOURNAL — the last thing before the ask.

   Three pieces, and deliberately NOT three equal cards. The
   lead gets a plate, a standfirst and roughly twice the area;
   the other two get a line and a date. An editorial page that
   weights all its stories the same is a page with no editor,
   and this section's whole job is to suggest there is someone
   here with opinions worth the consultation fee.

   It sits immediately before the CTA because it is the softest
   possible close: it asks nothing, and it is the only section
   that offers something without a form attached.
   ============================================================ */

const [lead, ...rest] = journal.items

export default function Journal() {
  return (
    <section id="journal" className="relative bg-ink py-28 sm:py-36">
      <div className="shell-wide">
        <div className="flex items-center gap-5">
          <span className="t-label text-mist">{journal.label}</span>
          <Rule className="max-w-40 text-pure" />
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-8">
          <Lines as="h2" className="t-display max-w-2xl text-bone">
            {journal.heading}
          </Lines>
          <a href="#" className="link-underline t-label focus-ring text-fog">
            {journal.cta}
          </a>
        </div>

        <div className="mt-20 grid gap-14 lg:grid-cols-12 lg:gap-16">
          {/* ---- The lead ---- */}
          <article className="lg:col-span-7">
            <a href={lead.href} className="group focus-ring block">
              <Figure
                src={lead.image}
                alt={lead.title}
                parallax={8}
                className="aspect-[16/10] w-full"
              />
              <div className="mt-7 flex items-center gap-4">
                <span className="t-num text-xs text-ash">{lead.date}</span>
                <span className="h-px w-8 bg-white/20" aria-hidden="true" />
                <span className="t-label text-mist">{lead.kind}</span>
              </div>
              <h3 className="t-heading mt-5 max-w-xl text-bone transition-colors duration-500 group-hover:text-pure">
                {lead.title}
              </h3>
              <p className="t-body mt-5 max-w-xl text-mist">{lead.standfirst}</p>
              <span className="link-underline t-label mt-8 inline-block text-fog">
                Read the note
              </span>
            </a>
          </article>

          {/* ---- The other two ---- */}
          <Rise
            className="lg:col-span-4 lg:col-start-9"
            selector="[data-post]"
            stagger={0.12}
          >
            {rest.map((post) => (
              <article
                key={post.title}
                data-post
                className="border-t border-white/10 py-8 first:border-t-0 first:pt-0 last:pb-0"
              >
                <a href={post.href} className="group focus-ring flex items-start gap-5">
                  <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden bg-ink-3 sm:w-32">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      className="plate transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="t-num text-xs text-ash">{post.date}</div>
                    <h3 className="t-sub mt-2 text-bone transition-colors duration-500 group-hover:text-pure">
                      {post.title}
                    </h3>
                    <div className="t-label mt-3 text-ash">{post.kind}</div>
                  </div>
                </a>
              </article>
            ))}
          </Rise>
        </div>
      </div>
    </section>
  )
}
