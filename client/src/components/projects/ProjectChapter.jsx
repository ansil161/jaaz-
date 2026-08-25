import ProjectFrame from './ProjectFrame'
import Words from '../solutions/Words'
import { Link } from '../chrome/PageTransition'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   PROJECT CHAPTER — one project's moment on the index.

   Six of these, in catalogue order, and they are the same
   component six times. That is the point of the whole build: a
   seventh project is a seventh object in data/projects.js and
   nothing else. Every project having its own bespoke layout is
   how a portfolio ends up looking assembled instead of designed.

   THE SHAPE, AND WHY IT IS NOT A GRID
   A grid of six shows all six at the same size and therefore
   says all six are worth the same glance. This gives each room
   a full screen of photograph before it gives you a single
   fact about it — which is the order an architectural monograph
   uses, and it is the order the visitor's own attention wants:
   look, then read.

     ACT ONE   the opening plate, held at almost full height,
               clipped open by the scroll. The number, the title
               and the one-line caption resolve over it.
     ACT TWO   the read. A running head that STICKS while two
               further plates travel past it, so the project's
               name is still on screen when you are three
               photographs into it.

   ALTERNATING, NOT MIRRORED
   Odd chapters put the running head on the right. Not for
   variety's sake — it is what stops six consecutive projects
   reading as one long left-hand column with pictures glued to
   it. The rhythm is the layout's, not each project's, which is
   why it comes from the index and not from the data.

   STICKY, NOT PINNED
   The running head is CSS `position: sticky`, gated on a
   viewport tall enough to hold it. GSAP's pin would do the same
   job by inserting a spacer and taking the element out of flow,
   which on a page with six of them means six pin spacers whose
   measurements all have to survive every image load, filter
   change and font swap. Sticky costs nothing, cannot desync from
   Lenis, and degrades to "it just scrolls" on a short window
   instead of degrading to a broken measurement.
   ============================================================ */

/** The affordance on a project's opening plate. Drawn, not a glyph —
 *  same stroke weight as every other arrow in the system. */
function Arrow({ size = 12, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d="M2.5 8h10.5" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  )
}

export default function ProjectChapter({ project, index, total }) {
  const { slug, title, flatTitle, location, category, year, summary, services, story } = project
  const flip = index % 2 === 1

  /* The number is the project's POSITION IN WHAT IS ON SCREEN, not its
     catalogue id. Filter to Outdoor and the one result is 01 of 01 —
     using the stored `n` there would fold out a chapter marked 06 / 01,
     which is the kind of detail that quietly tells a visitor the page
     is generated rather than made. With no filter on, the two are the
     same number anyway. */
  const num = String(index + 1).padStart(2, '0')
  const to = `/projects/${slug}`

  const open = story.find((s) => s.kind === 'open') ?? story[0]
  const rest = story.filter((s) => s !== open)
  const portrait = rest.find((s) => s.kind === 'portrait')
  const wide = rest.find((s) => s.kind === 'wide')

  const root = useGsapScope((el) => {
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const rise = qa('[data-rise]')
    const words = qa('[data-word]')
    const numeral = el.querySelector('[data-numeral]')

    if (prefersReducedMotion()) {
      gsap.set(rise, { autoAlpha: 1, y: 0 })
      gsap.set(words, { yPercent: 0 })
      return
    }

    const mm = gsap.matchMedia(el)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      /* The title is scrubbed rather than fired, so scrolling back up
         puts it away again. On a page you can travel in both
         directions, a one-shot entrance means every project after the
         first is already fully arrived by the time you reach it on the
         way back — which is exactly when the composition matters most. */
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el.querySelector('[data-open]'),
            start: 'top 72%',
            end: 'top 18%',
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(words, { yPercent: 106 }, { yPercent: 0, duration: 0.6, stagger: 0.08 }, 0)
        .fromTo(rise, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.15)

      /* The numeral travels against the plate it sits on. It is the
         one element on the chapter that is never still while the
         chapter is on screen, and it is what makes the number read as
         a mark ON the photograph rather than a caption beside it. */
      if (numeral) {
        gsap.fromTo(
          numeral,
          { yPercent: 26 },
          {
            yPercent: -26,
            ease: 'none',
            scrollTrigger: {
              trigger: el.querySelector('[data-open]'),
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        )
      }
    })
  }, [])

  return (
    <article
      ref={root}
      id={slug}
      data-chapter={num}
      aria-labelledby={`${slug}-title`}
      className="relative"
    >
      {/* ---------- ACT ONE — the opening plate ---------- */}
      <div data-open className="relative">
        <Link
          to={to}
          aria-label={`${flatTitle} — ${category}, ${location}`}
          className="group focus-ring block"
        >
          <ProjectFrame
            src={open.src}
            srcSet={open.srcSet}
            ratio={null}
            alt={open.alt}
            sizes="100vw"
            className="h-[76svh] min-h-[24rem] sm:h-[84svh]"
            imgClassName="[--plate-brightness:0.72] [--plate-contrast:1.06] transition-[filter] duration-700 group-hover:[--plate-brightness:0.84]"
            inset={12}
            radiusFrom={18}
            radius={0}
            drift={7}
            scaleFrom={1.1}
            start="top 92%"
            end="top 22%"
          >
            {/* Contrast for the type, weighted to the corner it lands
                in rather than poured evenly over the whole photograph. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.42) 26%, rgba(0,0,0,0) 58%)',
              }}
            />
          </ProjectFrame>
        </Link>

        {/* The numeral. Outside the clipped frame, so the clip never
            takes a bite out of it as the plate opens.

            CENTRED ON THE PLATE'S HEIGHT, and that is the only vertical
            position available to it. At the top it rides up under the
            navigation as the plate leaves — a 140px numeral drifting
            through the menu bar. At the bottom it lands on the fixed
            folio in the same corner. The middle of the plate is the one
            band nothing else on this page ever occupies, and it happens
            to be where a monograph would set a folio anyway.

            Two elements rather than one: the outer box does the
            centring in CSS, the inner span carries the drift. Sharing
            one element would mean GSAP writing `transform` over the
            centring translate — and `getComputedStyle` hands a
            percentage translate back as a resolved pixel matrix, so
            GSAP caches it as `y` and stacks the drift on top of it.
            The numeral would travel the right distance from twice the
            wrong place, and nothing would error. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-[var(--gutter)] flex items-center"
        >
          <span data-numeral className="t-mega block leading-none text-pure/12 select-none">
            {num}
          </span>
        </div>

        {/* The title block, over the plate. */}
        {/* THE TITLE DOES NOT ALTERNATE, and the plates do.

            It did at first, mirroring Act Two, and it was wrong in a
            way that only shows up on the page: the numeral is centred
            on the plate's right edge and the progress folio is fixed to
            the bottom-right corner, so every flipped chapter piled
            title, numeral and folio into the same quarter of the screen
            while the entire left half sat empty.

            Three marks, three corners, the same three every time —
            title bottom-left, numeral centre-right, folio bottom-right.
            A monograph does not move a project's name from side to side
            either; the rhythm belongs to the photographs. */}
        <div className="shell-wide pointer-events-none absolute inset-x-0 bottom-0 pb-[5vh]">
          <div>
            {/* The right padding is for the phone only, and it is for
                the fixed folio in that corner: at 430px the title block
                is the full column, and its metadata row ends about
                where `01 —— 06` begins. Nothing needs it once there is
                a real margin to spare. */}
            <div className="max-w-[36rem] pr-24 sm:pr-0">
              <span data-rise className="t-label block text-cove" style={{ opacity: 0 }}>
                {num} / {String(total).padStart(2, '0')}
              </span>

              {/* The line breaks come from the data, not from a width.
                  `title` is authored as the lines it should set on — "The
                  Long" / "Room" — and a project title is short enough
                  that where it breaks is a typographic decision rather
                  than a consequence of the column.

                  It also has to be a decision here, because a `ch`
                  max-width on this wrapper resolves against the
                  WRAPPER's font size (16px), not the 85px display face
                  inside it. That is how a title meant to set on two
                  lines was setting on three and running up into the
                  navigation. */}
              <h2 id={`${slug}-title`} className="t-display mt-5 text-bone">
                {title.map((line) => (
                  <Words key={line} as="span" text={line} className="block" />
                ))}
              </h2>

              <div
                data-rise
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
                style={{ opacity: 0 }}
              >
                <span className="t-label text-fog">{location}</span>
                <span className="h-px w-6 bg-white/25" aria-hidden="true" />
                <span className="t-label text-mist">{category}</span>
                <span className="t-num text-xs text-mist">{year}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- ACT TWO — the read ---------- */}
      <div className="shell-wide grid gap-y-14 py-[9vh] lg:grid-cols-12 lg:gap-x-10 lg:py-[11vh]">
        {/* The running head. Sticks only where there is genuinely room
            for it to stick — below 720px of viewport it would spend the
            whole chapter pinned to the top of a window it fills. */}
        <div
          className={`lg:col-span-4 ${
            flip ? 'lg:order-2 lg:col-start-9' : 'lg:order-1 lg:col-start-1'
          }`}
        >
          <div className="tall-lg:sticky tall-lg:top-[16vh]">
            <p className="t-body max-w-[34ch] text-fog">{summary}</p>

            <h3 className="t-label mt-12 text-ash">Scope</h3>
            <ul className="mt-4 space-y-1.5">
              {services.map((s) => (
                <li key={s} className="t-body text-mist">
                  {s}
                </li>
              ))}
            </ul>

            <Link
              to={to}
              className="group focus-ring mt-10 inline-flex items-center gap-3 border-b border-white/20 pb-2 transition-colors duration-500 hover:border-white/60"
            >
              <span className="t-label text-bone">View project</span>
              <Arrow
                size={11}
                className="text-bone transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* The plates. A tall one and a wide one, offset from each other
            so the column has a shape rather than a stack. */}
        <div
          className={`grid gap-y-10 sm:grid-cols-12 sm:gap-x-8 lg:col-span-7 ${
            flip ? 'lg:order-1 lg:col-start-1' : 'lg:order-2 lg:col-start-6'
          }`}
        >
          {/* The portrait is offset to the OUTSIDE edge of its column —
              away from the running head, not toward it. Centred in the
              column (or aligned to the inner edge) it left a third of
              the page empty on the far side while already having a wide
              gutter on the near side, so the chapter read as a narrow
              strip of pictures rather than as a spread. Pushed out, the
              indent lands between the two columns where it belongs and
              the photograph reaches the page edge. */}
          {portrait && (
            <ProjectFrame
              src={portrait.src}
              srcSet={portrait.srcSet}
              ratio={portrait.ratio}
              alt={portrait.alt}
              sizes="(min-width: 1024px) 38vw, (min-width: 640px) 62vw, 100vw"
              className={`sm:col-span-8 ${flip ? 'sm:col-start-1' : 'sm:col-start-5'}`}
              inset={9}
              drift={9}
              scaleFrom={1.14}
            />
          )}

          {wide && (
            <ProjectFrame
              src={wide.src}
              srcSet={wide.srcSet}
              ratio={wide.ratio}
              alt={wide.alt}
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="sm:col-span-12 sm:mt-[6vh]"
              inset={7}
              drift={6}
              scaleFrom={1.1}
            />
          )}
        </div>
      </div>
    </article>
  )
}
