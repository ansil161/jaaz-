import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Lines } from '@/features/public/components/Motion'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   PROCESS TIMELINE — the shared mechanism

   Two sections run on this: the homepage's OUR PROCESS (the six
   delivery stages) and About's THE JAAZ METHOD (the five habits
   that have to hold inside every one of them). They are one
   component rather than two because the thing that makes this
   section work is not its copy — it is the measured curve, the
   scrubbed clip, the live card and the glow that tracks it, and
   a second hand-copied version of that would start identical and
   drift apart on the first change to either page.

   Everything that differs between the two is a prop: label,
   heading, intro, steps, finale. Everything else below is the
   same code running twice.

   A serpentine, connected timeline. Editorial cards, alternating
   left and right on a faint blueprint grid, threaded by one
   continuous curve, ending on a centred ink plate — the state the
   room is finally in rather than another stage it passes through.

   THE CURVE IS MEASURED, NOT DRAWN.
   Every card carries a small bezel node at its top edge. On mount
   and on resize, this component reads each node's actual screen
   position and builds one smooth SVG path through all seven — a chain
   of vertical-tangent Bezier segments, which is what keeps the curve
   flowing instead of kinking at every point. Authoring the path by
   hand (fixed pixel coordinates against a fixed section height) is
   the more common way to build this — it's also why that version
   breaks the moment a card's copy wraps a line differently or the
   viewport isn't the one it was tuned against. Measuring means the
   curve is always correct.

   PROGRESS IS A CLIP, NOT A REDRAW.
   Three copies of the same path are stacked: a faint dashed track
   (the whole route, always visible), a soft white halo, and a crisp
   ink line — the last two sitting inside a wrapper whose height is
   scrubbed from 0 to 100% as the section scrolls. Growing a clip
   reveals the curve without distorting its geometry.

   ONE SCROLLTRIGGER PER CARD decides which step is "live" as it
   crosses the reading line — the same technique Craft.jsx uses for
   its held plate. Only the CARD carries the active state: a solid
   fill in `--color-signal`, white type, a red glow, and its resting
   tilt straightened out. The node stays a neutral bezel throughout —
   a fixed architectural detail, not a progress indicator — which is
   what keeps the red reading as "you are here" rather than as
   decoration repeated six times.

   TWO MORE LAYERS SIT BEHIND ALL OF THAT, both tied to something
   real rather than added as texture for its own sake:
   - The grid drifts a few pixels on scroll, the same parallax
     `Figure`/`Drift` apply to every photograph on the site — it's
     what stops a static blueprint from reading as a static blueprint.
   - A blurred red glow tracks the Y position of whichever card is
     currently live, reusing the exact point the curve is measured
     from. It sits BELOW the grid layer, so the grid's hairlines still
     read over it and the only place it's actually visible is in the
     gaps between lines — light on a blueprint, not a coloured blob.
   ============================================================ */

/** Smooth curve through zigzag points via vertical-tangent Beziers —
 * the tangent at every point is vertical, so consecutive segments
 * meet with no kink even though x swings hard between points. */
function buildPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    const midY = (p0.y + p1.y) / 2
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`
  }
  return d
}

/** One card's resting lean. Alternating sign by side, with a little
 * per-step variance so six cards don't read as a single ±N stamp
 * repeated three times. */
function tiltFor(i) {
  const sign = i % 2 === 0 ? -1 : 1
  return sign * (2.5 + (i % 3) * 1.1)
}

/**
 * <ProcessTimeline>
 *
 * @param {string}   [id]     Section id, for in-page links.
 * @param {string}   label    Pill badge copy.
 * @param {string[]} heading  Display lines; line index 1 sets italic.
 * @param {string}   intro    The sentence beside the heading.
 * @param {object[]} steps    `{ n, title, body }` — one card each.
 * @param {object}   finale   `{ badge, lead, em, body }` for the closing
 *                            ink plate the curve runs into.
 */
export default function ProcessTimeline({ id, label, heading, intro, steps, finale }) {
  const stepCount = steps.length
  const [reduced] = useState(() => prefersReducedMotion())
  const [active, setActive] = useState(0)
  /* The finale is the last trigger in the same sequence as the cards,
     so "which step is live" stays a single piece of state. */
  const isFinale = !reduced && active === stepCount
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [pathD, setPathD] = useState('')
  const containerRef = useRef(null)
  const nodeRefs = useRef([])
  const glowRef = useRef(null)
  /* The last measured points, kept outside React state — the glow
     tracker below needs to look one up on every `active` change
     without re-measuring the DOM each time. */
  const pointsRef = useRef([])

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const box = container.getBoundingClientRect()
    if (!box.width || !box.height) return
    const points = nodeRefs.current
      .map((n) => {
        if (!n) return null
        const r = n.getBoundingClientRect()
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
      })
      .filter(Boolean)
    pointsRef.current = points
    setDims({ w: box.width, h: box.height })
    setPathD(buildPath(points))
  }, [])

  /* Runs before paint, so the curve is correct on the very first
     frame rather than snapping into place a tick after load. */
  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(() => {
      measure()
      ScrollTrigger.refresh()
    })
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    /* A late web font changes every card's rendered width, which
       moves every node this curve is measured from. */
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  /* The ambient glow follows whichever card is live — the same
     signal the card's own red fill carries, made ambient. It is
     positioned from the exact point the curve is measured from, so
     it is never a beat out of sync with the card it is lighting. */
  useEffect(() => {
    if (reduced) return
    const glow = glowRef.current
    const point = pointsRef.current[active]
    if (!glow || !point) return
    gsap.to(glow, { y: point.y, duration: 1, ease: 'jaz', overwrite: true })
  }, [active, reduced, dims])

  const root = useGsapScope((el) => {
    if (reduced) return

    /* The grid drifts a few pixels slower than the page — the same
       parallax `Figure`/`Drift` use everywhere else on the site,
       applied to the blueprint instead of a photograph. It's what
       keeps a static texture from reading as a static texture. */
    gsap.fromTo(
      el.querySelector('[data-grid-layer]'),
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )

    gsap.utils.toArray(el.querySelectorAll('[data-step]')).forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 62%',
        end: 'bottom 62%',
        onToggle: (self) => self.isActive && setActive(i),
      })
      /* Fade only — no `y`. This element's `transform` is owned by
         React (the rotate/scale below, driven by `active` state), and
         GSAP's `x`/`y`/`rotation`/`scale` tweens write through its own
         transform cache onto the same CSS property. `autoAlpha` only
         ever touches opacity/visibility, so it shares the element
         safely with React's inline transform. */
      gsap.from(step.querySelector('[data-step-body]'), {
        autoAlpha: 0,
        duration: 1.1,
        ease: 'jaz',
        scrollTrigger: { trigger: step, start: 'top 88%', once: true },
      })
    })

    gsap.fromTo(
      el.querySelector('[data-progress-wrap]'),
      { height: '0%' },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: el.querySelector('[data-steps]'),
          start: 'top 62%',
          end: 'bottom 78%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      },
    )
  }, [])

  return (
    <section
      ref={root}
      id={id}
      className="on-paper relative overflow-hidden bg-paper py-28 text-ink sm:py-36"
    >
      <div className="shell-wide">
        {/* --- Pill badge, matching the source's chip label --- */}
        <span className="t-label inline-flex items-center rounded-full border border-ink/15 bg-paper px-4 py-2 text-ink/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {label}
        </span>

        {/* Heading + supporting intro, side by side — the same
            heading/intro grid Technology and Craft already use, so
            this is the site's own established pattern for "big
            statement, quieter sentence beside it," not a one-off. */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
          <Lines as="h2" className="t-display col-span-12 text-ink lg:col-span-7" stagger={0.11}>
            {heading.map((l, i) => (
              <span key={l} className="block">
                {i === 1 ? <em className="italic-display">{l}</em> : l}
              </span>
            ))}
          </Lines>
          <Lines
            as="p"
            className="t-body col-span-12 max-w-md text-ink lg:col-span-4 lg:col-start-9"
          >
            {intro}
          </Lines>
        </div>
        <p className="t-num mt-6 text-xs text-ink/40">
          01 &mdash; {String(stepCount).padStart(2, '0')}
        </p>

        {/* --- The connected timeline --- */}
        <div
          data-steps
          ref={containerRef}
          /* The zigzag is only as tight as the column it swings inside.
             The shell around this section is `max-w-108rem` — wide by
             design for the heading grid above — and letting the cards
             justify against those two far edges pushed each step most
             of a screen away from the one before it: the curve read as
             a long horizontal sweep rather than a chain, and the eye
             lost the thread between every pair. Capping the timeline
             (and only the timeline) near the width of two cards keeps
             consecutive nodes close enough to read as connected. */
          className="relative mx-auto mt-16 w-full max-w-[58rem] sm:mt-20"
        >
          {/* Ambient glow, tracking whichever card is live. Sits below
              the grid so the grid's own hairlines still read over it —
              the transparent gaps between lines are the only place the
              glow is actually visible, which is what keeps this looking
              like light on a blueprint rather than a coloured blob. */}
          <div
            ref={glowRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[110px] will-change-transform"
            style={{ background: 'radial-gradient(circle, rgba(193,31,44,0.4), transparent 70%)' }}
          />

          {/* The blueprint grid, oversized and drifting a few pixels
              on scroll — see the parallax tween above. */}
          <div
            data-grid-layer
            aria-hidden="true"
            className="grid-blueprint pointer-events-none absolute -inset-24 z-0 will-change-transform"
          />

          {/* The curve. Three stacked copies of the same measured path:
              a faint permanent track, and a soft-halo + crisp pair
              revealed by a clip that grows as the section scrolls. */}
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${dims.w || 1} ${dims.h || 1}`}
              preserveAspectRatio="none"
            >
              <path
                d={pathD}
                fill="none"
                stroke="#000000"
                strokeOpacity="0.12"
                strokeWidth="2"
                strokeDasharray="8 10"
                strokeLinecap="round"
              />
            </svg>
            <div
              data-progress-wrap
              className="absolute inset-x-0 top-0 overflow-hidden"
              style={{ height: reduced ? '100%' : '0%' }}
            >
              <svg
                className="absolute inset-x-0 top-0 w-full"
                style={{ height: dims.h || 0 }}
                viewBox={`0 0 ${dims.w || 1} ${dims.h || 1}`}
                preserveAspectRatio="none"
              >
                {/* Soft halo first, so the crisp line sits inside it. */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="14"
                  strokeLinecap="round"
                  style={{ filter: 'blur(2px)' }}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#000000"
                  strokeOpacity="0.65"
                  strokeWidth="2"
                  strokeDasharray="8 10"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* --- The cards --- */}
          <div className="relative z-10 flex flex-col gap-1.5 sm:gap-2.5">
            {steps.map((s, i) => {
              const side = i % 2 === 0 ? 'left' : 'right'
              const isActive = reduced ? false : i === active
              const tilt = tiltFor(i)

              return (
                <div
                  key={s.n}
                  data-step
                  /* Card width alone (92% -> 80% -> 52% down the
                     breakpoints) plus this justify is what creates the
                     zigzag — no per-side padding needed on top of it.
                     An earlier version tried to add one via
                     `` `md:${side==='left'?'pr-[8%]':...}` ``, which is
                     exactly the dynamic-class-name trap Tailwind's
                     docs warn about: "md:" and "pr-[8%]" never appear
                     as one contiguous token anywhere in this file, so
                     the scanner can't see it and never generates the
                     rule — the class exists in the DOM and does
                     nothing. */
                  className={`flex ${side === 'left' ? 'justify-start' : 'justify-end'}`}
                >
                  <article
                    data-step-body
                    /* Fixed, narrow width — not a percentage of the
                       row — matching the reference exactly: its cards
                       are ~288-320px regardless of how wide the page
                       around them is. A narrow box holding the same
                       amount of copy wraps across more lines, which is
                       what actually produces the taller card; the old
                       `w-[92%]...lg:w-[52%]` scaled with this shell's
                       very wide `max-w-108rem` container and read as a
                       short, wide slab instead. `min-h` backs that up
                       for the shortest paragraph in the set. */
                    className="relative w-[280px] min-h-[260px] rounded-[1.75rem] border p-8 transition-[transform,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[320px] sm:min-h-[290px] lg:w-[360px]"
                    style={{
                      transform: `rotate(${isActive ? 0 : tilt}deg) scale(${isActive ? 1.03 : 1})`,
                      borderColor: isActive ? 'var(--color-signal)' : 'rgba(0,0,0,0.1)',
                      background: isActive ? 'var(--color-signal)' : 'var(--color-paper)',
                      boxShadow: isActive
                        ? '0 24px 60px -20px rgba(193,31,44,0.45)'
                        : '0 15px 40px -25px rgba(0,0,0,0.18)',
                    }}
                  >
                    {/* The bezel node. Always neutral, always centred on
                        the card's top edge — the exact point the curve
                        is measured from. */}
                    <span
                      ref={(n) => {
                        nodeRefs.current[i] = n
                      }}
                      aria-hidden="true"
                      className="absolute -top-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border"
                      style={{
                        background: 'linear-gradient(to bottom right, #d4d4d4, #f4f4f4)',
                        borderColor: 'rgba(0,0,0,0.15)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      <span className="block h-2 w-2 rounded-full bg-ink/20" />
                    </span>

                    <div className="flex items-baseline gap-5">
                      <span
                        className="t-num font-['Instrument_Serif'] text-xl italic transition-colors duration-500"
                        style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)' }}
                      >
                        {s.n}
                      </span>
                      <h3
                        className="t-heading transition-colors duration-500"
                        style={{ color: isActive ? '#ffffff' : 'var(--color-ink)' }}
                      >
                        {s.title}
                      </h3>
                    </div>
                    <p
                      className="t-body mt-4 max-w-lg transition-colors duration-500"
                      style={{ color: isActive ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.6)' }}
                    >
                      {s.body}
                    </p>
                  </article>
                </div>
              )
            })}
          </div>

          {/* --- The finale --- */}
          {/* Where the curve stops. The six above are stages the room
              is still passing through; this is the one state it ends
              in — so it is the only plate in the section that sits
              centred on the line instead of swinging off it, and the
              only one in ink instead of paper. Its bezel is the
              seventh point the curve is measured through, so the line
              runs INTO the plate rather than stopping short above it.
              It carries `data-step` too, which means it is simply the
              seventh trigger in the same sequence — the ambient glow
              and the progress clip follow it without a second
              mechanism. */}
          <div data-step className="mt-6 flex justify-center sm:mt-9">
            <article
              data-step-body
              className="relative w-[280px] rounded-[1.75rem] border border-white/12 bg-ink px-8 py-9 text-center transition-[transform,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[360px] sm:px-10 lg:w-[420px]"
              style={{
                transform: `scale(${isFinale ? 1.035 : 1})`,
                borderColor: isFinale ? 'rgba(193,31,44,0.8)' : 'rgba(255,255,255,0.12)',
                boxShadow: isFinale
                  ? '0 32px 90px -28px rgba(193,31,44,0.6), 0 0 0 1px rgba(193,31,44,0.28), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 24px 70px -34px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              {/* The warm wash the site's closing CTAs all carry, dropped
                  in from the top edge — the same "screen just switched
                  on" light, at the point in the timeline where the room
                  is finally switched on. `inset` + matching radius
                  rather than `overflow-hidden`, which would clip the
                  bezel sitting proud of the top edge. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[1.75rem] transition-opacity duration-700"
                style={{
                  background:
                    'radial-gradient(120% 90% at 50% 0%, rgba(201,173,124,0.20), transparent 62%)',
                  opacity: isFinale ? 1 : 0.55,
                }}
              />
              {/* A single lit hairline across the top edge — the detail
                  that reads as machined rather than drawn. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-10 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent)',
                }}
              />

              {/* The seventh bezel — same component detail as every card
                  above, same neutral finish, measured the same way. */}
              <span
                ref={(n) => {
                  nodeRefs.current[stepCount] = n
                }}
                aria-hidden="true"
                className="absolute -top-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border"
                style={{
                  background: 'linear-gradient(to bottom right, #d4d4d4, #f4f4f4)',
                  borderColor: 'rgba(0,0,0,0.15)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                <span className="block h-2 w-2 rounded-full bg-ink/20" />
              </span>

              <div className="relative">
                <span
                  className="t-label inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors duration-500"
                  style={{
                    borderColor: isFinale ? 'rgba(193,31,44,0.6)' : 'rgba(255,255,255,0.16)',
                    color: isFinale ? '#ffffff' : 'rgba(255,255,255,0.55)',
                    background: isFinale ? 'rgba(193,31,44,0.16)' : 'transparent',
                  }}
                >
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3"
                    fill="none"
                    stroke={isFinale ? 'var(--color-signal)' : 'currentColor'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1.6 6.3 4.5 9.2 10.4 3.3" />
                  </svg>
                  {finale.badge}
                </span>

                <h3 className="mt-6 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] tracking-[-0.01em] text-pure">
                  {finale.lead} <em className="italic-display text-cove">{finale.em}</em>.
                </h3>

                <p className="t-body mx-auto mt-4 max-w-[34ch] text-white/55">{finale.body}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
