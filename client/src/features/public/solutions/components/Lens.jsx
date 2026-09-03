import { solutions, solutionsIndex } from '@/features/public/data/solutions'
import { Link } from '@/features/public/router/PageTransition'
import Words from '@/features/public/components/Words'
import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   SOLUTIONS — THE LENS

   The whole catalogue is ONE aperture that stops down.

   A single opening in the centre of a held stage is the only
   place photography exists on this page. Everything outside it
   is ink and type. Scroll does exactly one thing: it moves the
   barrel from stop to stop — and at each stop the opening takes
   the shape of the amount of space that solution actually
   touches. A dedicated cinema is the whole frame. Acoustic
   treatment happens inside a wall, so it is a standing column.
   A terrace has no room at all, so it is a horizon. A chair is
   a pin-spot.

   WHY NOT NINE SECTIONS
   Because a catalogue read as nine sections is a list, and a
   list cannot make the argument this business runs on: that
   these are nine DEPTHS of one intervention, and the visitor's
   real question is which depth is theirs. An axis answers that
   in a screen. Nine sections took thirteen.

   The market answer to "premium scroll page" is a pinned stage
   that scales a photograph UP as you descend — it is what every
   component library ships, and it is what the previous build
   here did. This one contracts. That is not contrarianism: a
   lens that only opens has no stops, and the stops are the
   content.

   THE TITLE IS LIT, NOT REVEALED
   Each stop's title is set twice, in the same place, from the
   same string. The lower copy is the real heading and is always
   whole. The upper copy is `aria-hidden` and is cut by the SAME
   opening the photography is cut by, so the only part of a
   title that is bright is the part the beam falls across. Stop
   down far enough and you are reading one lit word in the
   middle of a dim line. That is what happens in a theatre, and
   it is the one moment on this page that could not have been
   assembled out of a component.

   DETENTS, NOT A SMEAR
   Each stop owns one screen of scroll and the change occupies
   the middle third of it. Before and after, nothing moves. A
   mechanism that answered the wheel continuously would read as
   a smear; a barrel clicks. `TRANSIT_*` below is that click.

   ONE WRITE PER FRAME
   The opening is three numbers — half-inset x, half-inset y,
   corner radius — written to the stage as custom properties,
   which every `.lens-clip` layer inherits. So a frame costs
   three `setProperty` calls no matter how many things are being
   cut, and the interpolation happens on a plain object GSAP is
   tweening rather than on ten parsed `clip-path` strings.

   NO `will-change` ANYWHERE IN HERE. Promoting a clip-path
   layer is what makes Chrome intermittently rasterise the frame
   with no picture inside it.
   ============================================================ */

/* Where inside a stop's screen the barrel actually turns.
   Everything outside this window is hold. */
const TRANSIT_AT = 0.34
const TRANSIT_LEN = 0.34

/* The lead-in. The page arrives with the lens nearly shut — a wide
   slit on the flagship room, which is a cinema screen seen from the
   back of a dark house — and the first half-screen of scroll opens it
   to full bleed. It is the overture, and it is part of the mechanism
   rather than a screen standing in front of it. */
const LEAD = 0.6
const SHUT = { x: 30, y: 40, r: 0 }

const HIDDEN = { opacity: 0, visibility: 'hidden' }

/* How open the lens is at a stop, 0–1, as a fraction of the frame's
   AREA. The marks on the barrel are drawn from this, so the scale
   reports the real curve instead of nine equal ticks. */
const openness = (s) => ((100 - 2 * s.x) / 100) * ((100 - 2 * s.y) / 100)

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

export default function Lens() {
  const { headline, sub, meta, lens } = solutionsIndex
  const stops = solutions.map((s) => ({ ...s, ...lens.stops[s.slug] }))
  const N = stops.length

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const stage = q('[data-stage]')
    const settle = q('[data-settle]')
    const magnify = q('[data-magnify]')
    const plates = qa('[data-plate]')
    const washes = qa('[data-wash]')
    const metas = qa('[data-meta]')
    const rolls = qa('[data-roll]')
    const marks = qa('[data-mark]')
    const overture = q('[data-overture]')
    const words = qa('[data-word], [data-word-lit]')
    const lift = qa('[data-lift]')

    /* Both copies of a stop's title move together, so they are
       collected per stop rather than as one flat list. */
    const moves = stops.map((s) => qa(`[data-move="${s.slug}"]`))

    /* The opening, as three numbers. GSAP tweens this object; `write`
       is the only thing that ever touches the DOM for it. */
    const ap = { ...SHUT }
    const write = () => {
      stage.style.setProperty('--ap-x', `${ap.x.toFixed(3)}%`)
      stage.style.setProperty('--ap-y', `${ap.y.toFixed(3)}%`)
      stage.style.setProperty('--ap-r', `${ap.r.toFixed(3)}%`)
    }
    write()

    /* Reduced motion renders <LensStack> instead, so this branch is
       only reached if the barrel is ever mounted under it anyway. It
       has one job: leave the markup legible, wide open, fully lit. */
    if (prefersReducedMotion()) {
      Object.assign(ap, stops[0])
      write()
      gsap.set([overture, ...lift, ...moves.flat(), ...metas], {
        autoAlpha: 1,
        y: 0,
        yPercent: 0,
      })
      gsap.set([plates[0], washes[0]], { autoAlpha: 1 })
      return
    }

    /* ---------- The arrival ----------
       Not a scroll animation: this is already on screen when the page
       lands. The plate settles inside an opening that is already the
       right shape, so the first thing that moves is the picture and
       not the frame. `[data-settle]` is a separate wrapper from
       `[data-magnify]` deliberately — the scroll owns magnification
       for the whole page and must not be fighting a load tween over
       the same transform. */
    gsap
      .timeline({ defaults: { ease: 'jaz' } })
      .from(settle, { scale: 1.14, duration: 2.6 }, 0)
      .fromTo(
        words,
        { yPercent: 108 },
        { yPercent: 0, duration: 1.4, stagger: 0.06, ease: 'power3.out' },
        0.3,
      )
      .fromTo(
        lift,
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 },
        0.85,
      )

    /* ---------- The barrel ----------
       One scrubbed timeline whose unit of time is one stop. Position
       `LEAD + i` is stop i at rest; the turn from i to i+1 sits in the
       middle third of the screen that follows. */
    let current = -1

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.55,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          /* Which mark the barrel is on, written straight to the DOM
             rather than through React state. This fires on every frame
             of every scroll, and a component that re-rendered the
             whole stage nine times would be handing React the chance
             to put back the `opacity: 0` the markup ships with — on
             elements GSAP has since animated. */
          const t = self.progress * (LEAD + N - 1) - LEAD
          const i = gsap.utils.clamp(0, N - 1, Math.round(t))
          if (i === current) return
          current = i
          marks.forEach((m, j) => m.setAttribute('aria-current', j === i ? 'true' : 'false'))
        },
      },
    })

    /* Every frame of the timeline ends by pushing the opening down to
       the layers that are cut by it — three property writes, whatever
       else changed that frame. */
    tl.eventCallback('onUpdate', write)

    /* The lens opens, and the page's own headline hands over to the
       first stop's title inside the same move. */
    tl.to(ap, { ...stops[0], duration: LEAD, ease: 'jaz-io' }, 0)
      .to(
        overture,
        { autoAlpha: 0, yPercent: -22, duration: LEAD * 0.5, ease: 'power2.in' },
        LEAD * 0.4,
      )
      .to(lift, { autoAlpha: 0, duration: LEAD * 0.34, ease: 'none' }, 0)
      .fromTo(
        moves[0],
        { yPercent: 26, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: LEAD * 0.5, ease: 'power3.out' },
        LEAD * 0.5,
      )
      .fromTo(
        metas[0],
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: LEAD * 0.5, ease: 'power2.out' },
        LEAD * 0.55,
      )

    /* Stop to stop. */
    for (let i = 0; i < N - 1; i += 1) {
      const at = LEAD + i + TRANSIT_AT

      tl.to(ap, { ...stops[i + 1], duration: TRANSIT_LEN, ease: 'jaz-io' }, at)

        /* Stopping down is also a longer lens, so the picture inside
           the opening tightens a little over every turn. Nine of them
           add up to about ten percent, which is felt rather than seen
           — and it means the photograph is never dead still while the
           frame around it is moving. */
        .to(magnify, { scale: 1 + (i + 1) * 0.012, duration: TRANSIT_LEN, ease: 'jaz-io' }, at)

        /* The picture changes INSIDE the turn and never on either side
           of it, so a plate is never seen arriving into a shape that
           is still moving. */
        .to(plates[i], { autoAlpha: 0, duration: TRANSIT_LEN * 0.72 }, at + TRANSIT_LEN * 0.16)
        .to(plates[i + 1], { autoAlpha: 1, duration: TRANSIT_LEN * 0.72 }, at + TRANSIT_LEN * 0.16)
        .to(washes[i], { autoAlpha: 0, duration: TRANSIT_LEN }, at)
        .to(washes[i + 1], { autoAlpha: 1, duration: TRANSIT_LEN }, at)

        /* The outgoing title travels up through the beam and the
           incoming one rises into it. The beam does not move with them
           — it is welded to the stage — so the words pass through the
           light rather than carrying it along. */
        .to(
          moves[i],
          { yPercent: -30, autoAlpha: 0, duration: TRANSIT_LEN * 0.5, ease: 'power2.in' },
          at,
        )
        .fromTo(
          moves[i + 1],
          { yPercent: 30, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: TRANSIT_LEN * 0.58, ease: 'power3.out' },
          at + TRANSIT_LEN * 0.44,
        )

        .to(metas[i], { autoAlpha: 0, y: -12, duration: TRANSIT_LEN * 0.42 }, at)
        .fromTo(
          metas[i + 1],
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: TRANSIT_LEN * 0.5, ease: 'power2.out' },
          at + TRANSIT_LEN * 0.5,
        )

        /* The readouts roll. A barrel lets you see the next number
           arriving; a crossfade cannot.

           `yPercent` resolves against the element it is set on, and
           the element here is the whole nine-value COLUMN — so one
           value is `100 / N` percent of it, not 100. Sized off a
           single value instead, the column travels nine times too far
           and the window shows nothing at all. Percent rather than
           pixels because the two readouts are set at different sizes
           and share this one tween. */
        .to(rolls, { yPercent: (-(i + 1) * 100) / N, duration: TRANSIT_LEN, ease: 'jaz-io' }, at)
    }

    /* The ninth stop is entitled to the same hold as the other eight.
       Without this the timeline would end on the final turn, so the
       barrel would stop moving a third of a screen before the section
       does. An empty tween is the documented way to say how long a
       timeline is. */
    tl.to({}, { duration: LEAD + N - 1 }, 0)

    /* The marks are controls. Clicking one travels the page to that
       stop THROUGH Lenis — a raw `window.scrollTo` bypasses the smooth
       scroller and leaves ScrollTrigger reading a position the page is
       no longer at. */
    const st = tl.scrollTrigger
    const onMark = (e) => {
      const i = Number(e.currentTarget.dataset.mark)
      const p = (LEAD + i) / (LEAD + N - 1)
      const y = st.start + (st.end - st.start) * p
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.5 })
      else window.scrollTo({ top: y, behavior: 'smooth' })
    }
    marks.forEach((m) => m.addEventListener('click', onMark))

    return () => marks.forEach((m) => m.removeEventListener('click', onMark))
  }, [])

  return (
    <section
      ref={root}
      aria-label="The nine solutions"
      className="relative bg-ink"
      style={{ height: `calc(var(--app-h) * ${N + LEAD})` }}
    >
      <div
        data-stage
        className="sticky top-0 h-[var(--app-h)] overflow-hidden"
        style={{ '--ap-x': `${SHUT.x}%`, '--ap-y': `${SHUT.y}%`, '--ap-r': '0%' }}
      >
        {/* ---- Ambient. The light this opening spills into the room,
             in that stop's colour temperature and no wider than the
             opening itself. It sits OUTSIDE the aperture, so it is the
             glow around the frame rather than a wash over the picture.
             ---- */}
        {stops.map((s, i) => (
          <div
            key={`wash-${s.slug}`}
            data-wash
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              ...(i === 0 ? null : HIDDEN),
              background: `radial-gradient(${Math.round(46 + openness(s) * 54)}% ${Math.round(
                40 + openness(s) * 48,
              )}% at 50% 50%, rgba(${lens.tints[s.tint]}, 0.15) 0%, rgba(${lens.tints[s.tint]}, 0.045) 44%, transparent 72%)`,
            }}
          />
        ))}

        {/* ============================================================
            THE OPENING
            ============================================================ */}
        <div className="lens-clip absolute inset-0">
          <div data-magnify className="absolute inset-0">
            <div data-settle className="absolute inset-0">
              {stops.map((s, i) => (
                <img
                  key={s.slug}
                  data-plate
                  src={s.hero}
                  alt={s.heroAlt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable="false"
                  className="plate absolute inset-0 h-full w-full object-cover [--plate-contrast:1.06] [--plate-saturate:0.94]"
                  style={{
                    ...(i === 0 ? null : HIDDEN),
                    objectPosition: s.focus,
                    /* Exposure follows the WIDTH of the opening. The
                       title is a horizontal line, so a wide opening is
                       one with type lying across most of the picture;
                       where the aperture is a column or a pin-spot
                       there is almost nothing on the photograph to
                       protect. Several of these rooms are photographed
                       close to black, and a blanket dim turns those
                       into rectangles. */
                    '--plate-brightness': s.x < 12 ? 0.82 : 1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* The only scrims on the page, and they live INSIDE the
              opening — so they exist exactly where there is a
              photograph underneath type, and nowhere else. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: [
                /* the label row, which has to clear a lit ceiling */
                'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.36) 15%, transparent 32%)',
                /* a pool of shade under the title rather than a band
                   across the room — the title is a line, not a stripe */
                'radial-gradient(76% 27% at 50% 50%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.2) 58%, transparent 82%)',
                /* the readout row */
                'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 21%, rgba(0,0,0,0.32) 40%, transparent 60%)',
                /* the barrel, whose marks are hairlines and lose to any
                   lit surface behind them */
                'linear-gradient(to left, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.3) 9%, transparent 21%)',
              ].join(', '),
            }}
          />
        </div>

        {/* ============================================================
            THE TYPE

            Two layers per stop inside one stage-sized wrapper: the
            heading itself, and an `aria-hidden` copy of it cut by the
            opening. The wrapper has to stay `inset-0` and unmoved —
            the cut is in percentages of the box it is applied to, so
            the moment that box stops being the stage, the beam stops
            lining up with the photography.
            ============================================================ */}

        {/* The page's own headline, lit through the lens before it
            opens. Set on the three lines it was WRITTEN as rather than
            on a measure, so both copies break identically at every
            width — a wrapped copy and a clipped copy that disagreed by
            one word would show as a ghost beside the lit one. */}
        <div data-overture className="absolute inset-0">
          <div className="absolute inset-0 flex items-center justify-center px-[var(--gutter)]">
            <h1 className="t-stop stop-unlit text-center">
              {/* The trailing space is not decoration. Each authored line
                  is its own block span, and with nothing between them the
                  heading's text content reads "Nine ways tobuild theroom"
                  to a screen reader. A space inside the span collapses to
                  nothing visually and separates the words in the
                  accessibility tree. */}
              {headline.map((line, i) => (
                <Words key={line} as="span" text={line} className="block">
                  {i < headline.length - 1 ? ' ' : null}
                </Words>
              ))}
            </h1>
          </div>
          <div
            aria-hidden="true"
            className="lens-clip absolute inset-0 flex items-center justify-center px-[var(--gutter)]"
          >
            <p className="t-stop stop-lit text-center">
              {headline.map((line, i) => (
                <Words key={line} as="span" text={line} attr="data-word-lit" className="block">
                  {i < headline.length - 1 ? ' ' : null}
                </Words>
              ))}
            </p>
          </div>
        </div>

        {stops.map((s) => (
          <div key={`type-${s.slug}`} className="absolute inset-0">
            <div
              data-move={s.slug}
              className="absolute inset-0 flex items-center justify-center px-[var(--gutter)]"
              style={HIDDEN}
            >
              <h2 className="t-stop stop-unlit max-w-[24ch] text-center">{s.title}</h2>
            </div>
            <div
              aria-hidden="true"
              data-move={s.slug}
              className="lens-clip absolute inset-0 flex items-center justify-center px-[var(--gutter)]"
              style={HIDDEN}
            >
              <span className="t-stop stop-lit max-w-[24ch] text-center">{s.title}</span>
            </div>
          </div>
        ))}

        {/* ============================================================
            THE READOUT
            Everything the stage knows about the stop it is on, kept
            out of the middle so the middle stays a title card.
            ============================================================ */}
        {stops.map((s) => (
          <div
            key={`meta-${s.slug}`}
            data-meta
            className="shell-wide pointer-events-none absolute inset-0 flex flex-col justify-between pt-[clamp(5rem,13vh,7rem)] pb-[clamp(1.5rem,5.5vh,4rem)]"
            style={HIDDEN}
          >
            <p className="t-label max-w-[26ch] text-fog">{s.touches}</p>

            <div className="flex items-end justify-between gap-10 pr-24">
              <div className="max-w-[40ch]">
                <p className="font-display italic-display text-[clamp(1.05rem,1.55vw,1.6rem)] leading-[1.25] text-cove">
                  {s.statement}
                </p>
                <p className="t-sub mt-5 text-fog">{s.sub}</p>
                <Link
                  to={`/solutions/${s.slug}`}
                  className="focus-ring t-label pointer-events-auto mt-7 inline-flex items-center gap-3 text-bone transition-colors duration-500 hover:text-cove"
                >
                  {lens.open}
                  <Arrow size={12} />
                </Link>
              </div>

              <p className="t-num hidden max-w-[24ch] text-right text-[0.72rem] leading-relaxed text-fog xl:block">
                {s.meta}
                <span className="mt-1.5 block text-mist">
                  {s.tier} · {s.range}
                </span>
              </p>
            </div>
          </div>
        ))}

        {/* ============================================================
            THE BARREL

            Nine marks whose LENGTHS are how far open the lens is at
            each stop, so the profile of the whole page is readable at
            a glance and the mark you are on is where the lens actually
            is. Nine equal segments of a progress bar could not say
            either thing.
            ============================================================ */}
        <nav
          aria-label="Jump to a solution"
          className="absolute top-1/2 right-[max(1rem,calc(var(--gutter)*0.45))] hidden -translate-y-1/2 flex-col items-end gap-4 lg:flex"
        >
          <div className="mb-2 flex flex-col items-end gap-1.5">
            <span className="lens-roll t-num text-[1.25rem] text-cove" aria-hidden="true">
              <span data-roll>
                {stops.map((s) => (
                  <span key={`f-${s.slug}`}>f/{s.f}</span>
                ))}
              </span>
            </span>
            <span className="lens-roll t-num text-[0.64rem] text-ash" aria-hidden="true">
              <span data-roll>
                {stops.map((s) => (
                  <span key={`n-${s.slug}`}>
                    {s.n} / {String(N).padStart(2, '0')}
                  </span>
                ))}
              </span>
            </span>
          </div>

          {stops.map((s, i) => (
            <button
              key={`mark-${s.slug}`}
              type="button"
              data-mark={i}
              aria-current={i === 0 ? 'true' : 'false'}
              className="lens-mark focus-ring group flex cursor-pointer items-center justify-end gap-3"
            >
              {/* The stop's own mark, where its number was. The tick
                  beside it already says how far open the lens is at
                  this stop and the roll above says which of nine you
                  are on — so a second numeral on every mark was the
                  count printed three times. A theatre, a sofa, a
                  fader, a terrace: now the barrel is readable without
                  opening anything. */}
              <Mark name={s.icon} size={15} className="lens-n" />
              <span className="lens-tick" style={{ '--lens-tick': openness(s).toFixed(3) }} />
              <span className="sr-only">{s.title}</span>
            </button>
          ))}
        </nav>

        {/* The one instruction on the page, and it is gone as soon as
            the lens has moved. */}
        <p
          data-lift
          className="t-label absolute bottom-[clamp(1.5rem,5.5vh,4rem)] left-1/2 -translate-x-1/2 text-cove"
          style={HIDDEN}
        >
          {lens.hint}
        </p>

        {/* The standfirst is real content and belongs to the headline,
            but the opening screen is a title card and cannot carry a
            paragraph as well. It is read to anyone who is not looking
            at it, and it is on the page in full below the barrel. */}
        <p data-lift className="sr-only" style={HIDDEN}>
          {sub} {meta}
        </p>
      </div>
    </section>
  )
}
