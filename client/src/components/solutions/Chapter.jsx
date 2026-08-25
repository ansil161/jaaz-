import { solutionsIndex } from '../../data/solutions'
import { Link } from '../chrome/PageTransition'
import Words from './Words'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   SOLUTIONS — ONE CHAPTER

   Nine of these make the page. Each owns a full screen and about
   two screens of scroll, and is composed like a spread rather
   than assembled like a card: an oversized numeral, one large
   photograph, a display heading, one italic line, a short
   paragraph.

   NOTHING DRAWS A LINE
   No rules, no ticks, no grid overlay, no scanlines. Chapters are
   told apart by composition, scale and light — the only elements
   on the stage that are neither photograph nor type are two soft
   radial gradients. That is the whole visual brief.

   FOUR COMPOSITIONS, CYCLED
   `full` (the photograph is the screen), `right` and `left` (a
   tall plate on one side, copy in the opposite column), `portal`
   (a narrow plate stood in the centre with the heading crossing
   it). Nine chapters over four layouts means no two neighbours
   are alike, and the first and last are both full bleed, which
   bookends the sequence.

   THE NUMERAL IS THE ONE CONSTANT
   It always sits directly above the heading, pulled up so the
   type crosses it. Fixing that anchor is what lets the four
   compositions vary as much as they do without the page reading
   as four unrelated designs — and it removes every chance of an
   absolutely-placed numeral colliding with a long title.

   GRID, NOT PERCENTAGES
   An earlier pass placed the plate with absolute percentage
   boxes. That looks precise and is not: the copy column has no
   idea where the plate is, so a three-line title at a short
   viewport walks straight into it. One twelve-column grid row
   with explicit column starts cannot collide by construction,
   and it collapses to document flow below the breakpoint for
   free.

   STICKY, NOT PINNED
   Nine GSAP pins would mean nine pin-spacers recalculated on
   every refresh. `position: sticky` holds the stage just as well,
   behaves under Lenis, and — the part that matters — lets the
   NEXT chapter scroll over this one, which is the overlap the
   sequence is built on. ScrollTrigger still drives every tween;
   it just does not have to own the layout too.

   MOTION BUDGET
   Two scrubbed timelines and nothing that runs on its own.
   Entrance resolves the composition as the chapter rises; dwell
   drifts the plate against the copy while it is held, then lets
   the stage sink and dim as the next arrives. Everything is
   transform and opacity except one clip-path wipe per chapter,
   which animates a single box. Below the breakpoint the stage
   stops sticking and the chapter becomes a tall block with one
   entrance — simplified, not reproduced.
   ============================================================ */

function Arrow({ size = 13, className = '' }) {
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

/* `copy: 'spread'` throws the heading and the paragraph into opposite
   bottom corners; `copy: 'stack'` keeps them in one column beside the
   plate. `wipe` uncovers the plate on entry — the full-bleed variant
   scales and fades instead, because a full-screen wipe nine times
   would be theatrical rather than cinematic.

   `exposure` is per composition rather than global, and the reason is
   the only thing that ever justifies dimming a photograph: type sitting
   on top of it. Where the copy is BESIDE the plate there is nothing to
   protect, so those chapters run the plate at full strength — several
   of these rooms are photographed nearly dark, and a blanket 0.74
   turned two of them into black rectangles. */
const VARIANTS = [
  {
    key: 'full',
    full: true,
    copy: 'spread',
    wipe: false,
    scrim: 'bleed',
    exposure: 0.82,
  },
  {
    key: 'right',
    media: 'lg:col-start-7 lg:col-span-6 lg:h-[78vh] lg:self-center',
    copyCol: 'lg:col-start-1 lg:col-span-5',
    copy: 'stack',
    wipe: true,
    scrim: null,
    exposure: 1,
  },
  {
    key: 'portal',
    media: 'lg:col-start-5 lg:col-span-4 lg:h-[84vh] lg:self-center',
    copy: 'spread',
    wipe: true,
    scrim: 'crossing',
    exposure: 0.9,
  },
  {
    key: 'left',
    media: 'lg:col-start-1 lg:col-span-6 lg:h-[78vh] lg:self-center',
    copyCol: 'lg:col-start-8 lg:col-span-5',
    copy: 'stack',
    wipe: true,
    scrim: null,
    exposure: 1,
  },
]

const variantFor = (i) => VARIANTS[i % VARIANTS.length]

const HIDDEN = { opacity: 0, visibility: 'hidden' }

export default function Chapter({ solution: s, index }) {
  const v = variantFor(index)
  const { chapters } = solutionsIndex
  const tint = chapters.tints[chapters.tint[s.slug]] ?? chapters.tints.ash
  const spread = v.copy === 'spread'

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const stage = q('[data-stage]')
    const mediaBox = q('[data-media]')
    const img = q('[data-img]')
    const numeral = q('[data-numeral]')
    const atmosphere = q('[data-atmosphere]')
    const copy = qa('[data-copy]')
    const words = qa('[data-word]')
    const lift = qa('[data-lift]')

    /* The markup ships hidden so the entrance has somewhere to come
       from, which means this branch has to put it back rather than
       simply decline to animate. */
    if (prefersReducedMotion()) {
      gsap.set([numeral, atmosphere, ...lift], { autoAlpha: 1, y: 0, yPercent: 0 })
      gsap.set(mediaBox, { autoAlpha: 1, clipPath: 'none' })
      gsap.set(words, { yPercent: 0 })
      return
    }

    const mm = gsap.matchMedia()

    /* ---------- Wide: the held chapter ---------- */
    mm.add('(min-width: 1024px)', () => {
      /* ENTRANCE. Runs while the chapter is still rising into frame and
         is finished by the moment it locks, so nothing is still
         arriving once the stage has stopped moving. */
      const enter = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          end: 'top top',
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      })

      enter
        .fromTo(atmosphere, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55 }, 0)
        .fromTo(img, { scale: 1.15, yPercent: 3 }, { scale: 1.05, yPercent: 0, duration: 1 }, 0)

      if (v.wipe) {
        enter.fromTo(
          mediaBox,
          { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.out' },
          0,
        )
      } else {
        enter.fromTo(mediaBox, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0)
      }

      enter
        .fromTo(
          numeral,
          { autoAlpha: 0, yPercent: 12 },
          { autoAlpha: 1, yPercent: 0, duration: 0.6 },
          0.12,
        )
        /* The heading resolves last and slowest. Everything before it is
           setting the stage; this is the line the chapter is about. */
        .fromTo(
          words,
          { yPercent: 108 },
          { yPercent: 0, duration: 0.55, stagger: 0.055, ease: 'power3.out' },
          0.3,
        )
        .fromTo(
          lift,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.07, ease: 'power2.out' },
          0.5,
        )

      /* DWELL. The plate settles the last of its scale while the copy
         travels the other way, so the two are never locked together —
         then the whole stage sinks and dims as the next chapter rises
         over it. That handover is the only "transition" on the page. */
      const dwell = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      })

      dwell
        .fromTo(img, { scale: 1.05, yPercent: 0 }, { scale: 1, yPercent: -3.5, duration: 1 }, 0)
        .fromTo(copy, { yPercent: 0 }, { yPercent: -6, duration: 1 }, 0)
        .to(stage, { scale: 0.955, autoAlpha: 0.28, duration: 0.24, ease: 'power2.in' }, 0.76)
    })

    /* ---------- Narrow: one entrance, no hold ---------- */
    mm.add('(max-width: 1023.98px)', () => {
      gsap.set(stage, { scale: 1, autoAlpha: 1 })

      gsap
        .timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: { trigger: el, start: 'top 76%', once: true },
        })
        .fromTo(atmosphere, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 0)
        .fromTo(
          numeral,
          { autoAlpha: 0, yPercent: 14 },
          { autoAlpha: 1, yPercent: 0, duration: 1 },
          0,
        )
        .fromTo(
          words,
          { yPercent: 108 },
          { yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out' },
          0.1,
        )
        .fromTo(
          mediaBox,
          { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'jaz-io' },
          0.25,
        )
        .fromTo(img, { scale: 1.13 }, { scale: 1, duration: 1.8, ease: 'jaz' }, 0.25)
        .fromTo(lift, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.5)

      /* The one continuous move on small screens: the plate keeps
         travelling inside its own frame for as long as it is on screen.
         Cheap, and it is what stops a stacked column reading as a
         slideshow. */
      gsap.fromTo(
        img,
        { yPercent: -3 },
        {
          yPercent: 3,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })

    return () => mm.revert()
  }, [])

  /* --- The three blocks. Placed by the grid below, never by hand. --- */

  const headBlock = (
    <div
      data-copy
      /* `col-start-1` is load-bearing, not decoration. In the `portal`
         composition the plate sits explicitly in columns 5-8, which
         leaves four free columns before it — not the seven this block
         spans. Auto-placement will not overlap an explicitly placed
         item, so it silently invents implicit columns past 12 and the
         whole row slides right. Pinning the start makes the overlap the
         intended one instead. */
      className="order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1"
    >
      <Link
        to="/contact"
        className="focus-ring group block"
        aria-label={`${s.title}`}
      >
        {/* Pulled up so the heading crosses it. At 7% it is ground, not
            a label — the eye reads it as depth behind the type. */}
        <span
          data-numeral
          aria-hidden="true"
          className="font-display pointer-events-none -mb-[0.24em] block leading-[0.7] tracking-[-0.045em] text-bone/[0.075] select-none"
          /* Height is part of the condition, exactly as it is for
             `.t-cinema` and `.t-chapter` in index.css. Sized off width
             alone this ran to 232px on a laptop and pushed the bottom of
             a three-line stack column clean off the stage. */
          style={{ ...HIDDEN, fontSize: 'clamp(4.5rem, min(16vw, 17vh), 16rem)' }}
        >
          {s.n}
        </span>

        <span data-lift className="t-label relative block text-mist" style={HIDDEN}>
          {s.tier}
        </span>

        {/* The affordance rides the last line of the heading rather than
            sitting in a labelled block of its own. A block one had to go
            somewhere, and in the stacked composition that somewhere was
            between the heading and the description — a call to action
            placed before the thing it is meant to follow. Inline, it has
            no ordering to get wrong, and the title stops needing a
            second element to explain that it is a link. */}
        <Words
          as="h2"
          text={s.title}
          className={`relative mt-5 text-bone ${spread ? 't-cinema' : 't-chapter'}`}
        >
          <Arrow
            size={spread ? 26 : 20}
            className="ml-5 inline-block translate-y-[-0.12em] text-mist transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2.5 group-hover:text-cove"
          />
        </Words>

        <span
          data-lift
          className="font-display italic-display relative mt-6 block max-w-[24ch] text-[clamp(1.1rem,1.6vw,1.7rem)] leading-[1.25] text-cove"
          style={HIDDEN}
        >
          {s.statement}
        </span>
      </Link>
    </div>
  )

  const mediaBlock = (
    <div
      data-media
      className={`relative order-2 aspect-[3/4] w-full overflow-hidden lg:order-none lg:row-start-1 lg:aspect-auto ${
        v.full ? 'lg:absolute lg:inset-0 lg:h-auto lg:w-auto' : v.media
      }`}
      style={HIDDEN}
    >
      <img
        data-img
        src={s.hero}
        alt={s.heroAlt}
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : 'auto'}
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-contrast:1.05] [--plate-saturate:0.94]"
        style={{ height: '112%', top: '-6%', '--plate-brightness': v.exposure }}
      />
    </div>
  )

  const proseBlock = (
    <div
      data-copy
      className={`order-3 lg:order-none ${spread ? 'lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:pb-3' : ''}`}
    >
      <p data-lift className="t-sub max-w-[36ch] text-fog" style={HIDDEN}>
        {s.sub}
      </p>
      <p data-lift className="t-num mt-7 text-[0.72rem] leading-relaxed text-mist" style={HIDDEN}>
        {s.meta}
      </p>
      <p data-lift className="t-num mt-1.5 text-[0.72rem] text-mist" style={HIDDEN}>
        {s.range}
      </p>
    </div>
  )

  return (
    <section ref={root} className="relative bg-ink lg:h-[205vh]" style={{ '--tint': tint }}>
      <div
        data-stage
        className="relative overflow-hidden py-20 sm:py-24 lg:sticky lg:top-0 lg:h-[var(--app-h)] lg:py-0"
      >
        {/* ---- Atmosphere. Two soft gradients, no geometry. ---- */}
        <div
          data-atmosphere
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            ...HIDDEN,
            background:
              'radial-gradient(118% 82% at 16% 6%, rgba(var(--tint), 0.14) 0%, rgba(var(--tint), 0.045) 38%, transparent 68%), radial-gradient(92% 72% at 90% 98%, rgba(var(--tint), 0.1) 0%, transparent 62%)',
          }}
        />

        {/* Full-bleed plates sit outside the shell so they reach the
            edges of the screen rather than the edges of the measure. */}
        {v.full && mediaBlock}

        {/* ---- A soft floor under the type, only where the heading
             actually sits over the photograph ---- */}
        {/* A scrim exists to protect type, so it is sized to the type it
            protects — never applied by habit. `bleed` covers a full-screen
            plate that has copy in both bottom corners. `crossing` is for
            the centred portal, where only the heading crosses the plate and
            the paragraph column clears it entirely: a floor deep enough for
            the heading and nothing more, because the same scrim tuned for a
            full bleed put two thirds of a standing plate in shadow. */}
        {v.scrim === 'bleed' && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[66%] lg:block"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.66) 32%, rgba(0,0,0,0.18) 66%, transparent 100%)',
              }}
            />
            {/* The paragraph column of a full bleed sits in the top-right of
                the frame, which the floor scrim never reaches. Without this
                it lands on whatever the photograph is doing there — on the
                flagship plate, the lit screen. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] lg:block"
              style={{
                background:
                  'linear-gradient(to left, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.34) 46%, transparent 100%)',
              }}
            />
          </>
        )}

        {v.scrim === 'crossing' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[50%] lg:block"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 38%, transparent 100%)',
            }}
          />
        )}

        {/* ============================================================
            One grid row. Explicit column starts, so the plate and the
            copy cannot walk into each other at any height.
            ============================================================ */}
        <div
          className={`shell-wide relative flex flex-col gap-10 lg:grid lg:h-full lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0 ${
            spread ? 'lg:items-end lg:pb-[9vh]' : 'lg:items-center'
          }`}
        >
          {spread ? (
            <>
              {!v.full && mediaBlock}
              {headBlock}
              {proseBlock}
            </>
          ) : (
            <>
              {mediaBlock}
              <div className={`contents lg:block lg:row-start-1 ${v.copyCol}`}>
                {headBlock}
                <div className="order-3 lg:order-none lg:mt-10">{proseBlock}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
