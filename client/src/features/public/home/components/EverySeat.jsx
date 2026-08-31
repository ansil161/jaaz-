import { useEffect, useRef, useState } from 'react'
import { everySeat as D } from '@/features/public/data/site'
import { useGsapScope, gsap, SplitText, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   CHAPTER 03 — EVERY SEAT

   Precision -> sound -> immersion -> perfection.

   THE ONE IDEA
   The room comes up one seat at a time. The section opens on a
   JAAZ cinema with the house lights down, and as it scrolls a
   pass of light travels through the room; each chair it reaches
   lights, and the arrival error measured at that chair prints.
   At the end every error resolves to zero together.

   IT IS A PHOTOGRAPH, NOT A DIAGRAM. An earlier build drew this
   as a hairline plan — screen, speakers, chairs, traced paths —
   and that was the wrong instrument. The argument is about
   chairs people sit in, and a plan view of chairs is a drawing
   OF the argument rather than the argument. Everything here is
   light on a real room: soft pools that lie in the frame, a wash
   that moves through it, and type. No strokes, no rings, no
   plan.

   THE NUMBERS ARE STILL REAL. Every figure is derived, at module
   load, from the metre coordinates in data/site.js:

     path length      euclidean distance, speaker to chair
     arrival spread   (longest - shortest) / 343 m/s, in ms
     level spread     20 log10(longest / shortest), in dB

   Nothing is typed in, which is the whole claim: a section
   arguing "measured, not eyeballed" that ships hand-written
   numbers argues against itself.

   TWO COORDINATE SYSTEMS, JOINED BY `coverBox`
   The acoustics live in metres; the light lives in percentages
   of the photograph. Those only agree if we know exactly where
   the photograph ended up inside the stage — and `object-cover`
   does not say. So the cover crop is reproduced by hand into a
   box the pools are positioned inside. Get it wrong and every
   pool of light sits beside its chair rather than on it.

   THE SEQUENCE, as scrubbed positions on one timeline:

     .00  HOUSE LIGHTS DOWN   the room at a third of its
                              exposure. Headline, then the line
                              under it.
     .12  SEAT BY SEAT        seven windows. One wash crosses the
                              frame across all of them, so the
                              pass reads as a single movement
                              rather than seven flashes; each
                              chair lights as it is reached and
                              its column of the sheet fills in.
                              The room's exposure lifts the whole
                              way — it is brought up on a dimmer,
                              not switched on at the end.
     .84  RESOLUTION          every column counts to 0.00 at
                              once, and the type turns over:
                              MEASURED, NOT EYEBALLED.
   ============================================================ */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/* Where the seat sequence sits inside the timeline, and how much of
   it each seat gets. Every other position is an offset from these. */
const START = 0.12
const WINDOW = 0.72 / D.seats.length
const END = START + WINDOW * D.seats.length

const COUNT_IN = 0.012
const COUNT_FOR = 0.03
const RESOLVE_AT = END + 0.015
const RESOLVE_FOR = 0.06

/* ---------- The measurement, done once at module load ---------- */
/* Per seat: the three front-channel path lengths, and the spread
   between the longest and the shortest. That spread IS the error —
   it is what makes an off-centre seat sound off-centre, and what a
   per-seat delay and level trim exists to remove. */
const MEASURED = D.seats.map((seat) => {
  const lengths = D.speakers.map((sp) => dist(sp, seat))
  const near = Math.min(...lengths)
  const far = Math.max(...lengths)
  return {
    ...seat,
    ms: ((far - near) / D.speedOfSound) * 1000,
    db: 20 * Math.log10(far / near),
  }
})

/* What seat `i` should read at timeline position `p`, or `null`
   before its window opens.

   A PURE FUNCTION OF THE PLAYHEAD, and that is the point. The
   obvious build — one tween per seat mutating a proxy object, with
   the text written from `onUpdate` — is subtly wrong here: a tween
   records its start value the first time it renders and re-records
   it on every `invalidateOnRefresh`, and a `fromTo` in a timeline
   stamps its from-state at build time unless told not to. Between
   them, seats intermittently came up already showing their final
   error before their own window had opened, or froze at 0.00 and
   never counted, depending on when the fonts finished loading.
   Deriving the number from the playhead makes all of that
   unreachable. */
const readAt = (p, i, v) => {
  const t0 = START + i * WINDOW + COUNT_IN
  if (p < t0) return null
  if (p < t0 + COUNT_FOR) return v * ((p - t0) / COUNT_FOR)
  if (p <= RESOLVE_AT) return v
  if (p < RESOLVE_AT + RESOLVE_FOR) return v * (1 - (p - RESOLVE_AT) / RESOLVE_FOR)
  return 0
}

/* The photograph's aspect, and the geometry `object-cover` applies
   without telling anyone. Reproducing it by hand is what lets a
   percentage in the data mean a chair on the screen. */
const AR = 16 / 9
const coverBox = (w, h) =>
  w / h > AR
    ? { left: 0, top: (h - w / AR) / 2, width: w, height: w / AR }
    : { left: (w - h * AR) / 2, top: 0, width: h * AR, height: h }

/* Pool size, per row, as a percentage of the photograph. A chair
   further from the camera catches a smaller pool; one size for all
   seven reads as an overlay stuck to the glass rather than as light
   lying in the room. */
const POOL = [
  { w: 10.6, h: 5.5 },
  { w: 8.4, h: 4.4 },
  { w: 6.8, h: 3.6 },
]

export default function EverySeat() {
  const [done, setDone] = useState(0)
  const [reduced] = useState(() => prefersReducedMotion())
  const lastDone = useRef(0)
  const stageRef = useRef(null)
  const frameRef = useRef(null)

  /* Keep the light layer glued to the photograph's cover crop. Its
     own observer rather than a ScrollTrigger refresh: the box depends
     only on the stage's size, and it has to be right on the very
     first frame — before any trigger has measured anything. */
  useEffect(() => {
    const stage = stageRef.current
    const frame = frameRef.current
    if (!stage || !frame) return
    const apply = () => {
      const { width, height } = stage.getBoundingClientRect()
      if (!width || !height) return
      const b = coverBox(width, height)
      frame.style.left = `${b.left}px`
      frame.style.top = `${b.top}px`
      frame.style.width = `${b.width}px`
      frame.style.height = `${b.height}px`
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [])

  const root = useGsapScope(
    (el) => {
      const q = (s) => el.querySelector(s)
      const qa = (s) => gsap.utils.toArray(el.querySelectorAll(s))

      const plate = q('[data-plate]')
      const wash = q('[data-wash]')
      const heading = q('[data-heading]')
      const resolve = q('[data-resolve]')
      const resolveSub = q('[data-resolve-sub]')
      const intro = q('[data-intro]')
      const settled = q('[data-settled]')
      const caption = q('[data-caption]')
      const pools = qa('[data-pool]')
      const columns = qa('[data-col]')

      /* One painter for the whole sheet, driven by the timeline's own
         playhead below. Each cell keeps the last string it was given,
         so a frame in which nothing changed costs seven comparisons
         rather than seven DOM writes. */
      const cells = columns.map((col, i) => {
        const vEl = col.querySelector('[data-ms]')
        let last = null
        return (p) => {
          const v = readAt(p, i, MEASURED[i].ms)
          const next = v === null ? '—' : v.toFixed(2)
          if (next !== last) {
            vEl.textContent = next
            last = next
          }
        }
      })
      const paintAll = (p) => cells.forEach((c) => c(p))

      /* ---------- Reduced motion: the room up, and settled ---------- */
      if (reduced) {
        gsap.set(plate, { filter: 'brightness(0.95)', scale: 1 })
        gsap.set(pools, { autoAlpha: 1, scale: 1 })
        gsap.set(wash, { autoAlpha: 0 })
        gsap.set([heading, intro], { autoAlpha: 0 })
        gsap.set([resolve, resolveSub, settled, caption], { autoAlpha: 1, y: 0 })
        gsap.set(columns, { autoAlpha: 1 })
        paintAll(1)
        return
      }

      const splitHead = SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: false,
      })
      const splitResolve = SplitText.create(resolve, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: false,
      })

      const mm = gsap.matchMedia()

      mm.add({ wide: '(min-width: 768px)', narrow: '(max-width: 767px)' }, (ctx) => {
        const { wide } = ctx.conditions

        /* Opening frame, set here rather than in markup so a refresh
           mid-section rebuilds from a known state instead of from
           wherever the last playhead left things. */
        gsap.set(plate, { filter: 'brightness(0.34)', scale: 1.1 })
        gsap.set(pools, { autoAlpha: 0, scale: 0.35, transformOrigin: 'center' })
        gsap.set(wash, { autoAlpha: 0, xPercent: -45 })
        gsap.set(columns, { autoAlpha: 0.22 })
        gsap.set(splitHead.lines, { yPercent: 108 })
        gsap.set(splitResolve.lines, { yPercent: 108 })
        gsap.set([heading, resolve], { autoAlpha: 1 })
        gsap.set([intro, settled, caption, resolveSub], { autoAlpha: 0, y: 16 })
        paintAll(0)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          /* Off the TIMELINE, not off the ScrollTrigger: `scrub` means
             the playhead lags the scroll position, and numbers that
             ran ahead of the light arriving at their chair would be
             reporting a measurement nobody has taken yet.

             `this.time()`, not `this.progress()` — the positions
             `readAt` compares against are timeline POSITIONS, and this
             timeline does not end at exactly 1.00, so progress and
             time differ by about a percent. A plain method rather than
             an arrow, so `this` is the timeline GSAP hands back and
             the callback never closes over a `const` that is still
             being declared. */
          onUpdate() {
            paintAll(this.time())
          },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            /* Absolute pixels from a function `end`. A `+=N%` string
               returned from a function resolves against the trigger's
               own height — which pinSpacing then grows by, so every
               refresh compounds the pin. Same note as Spaces.jsx. */
            end: () => `+=${Math.round(window.innerHeight * (wide ? 4.2 : 3.1))}`,
            pin: '[data-stage]',
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              /* The counter reads off the same window arithmetic the
                 timeline uses, so the number can never disagree with
                 the room beside it. */
              const n = gsap.utils.clamp(
                0,
                MEASURED.length,
                Math.floor((self.progress - START) / WINDOW) + 1,
              )
              if (n !== lastDone.current) {
                lastDone.current = n
                setDone(n)
              }
            },
          },
        })

        /* --- HOUSE LIGHTS DOWN ---------------------------------- */
        tl.to(splitHead.lines, { yPercent: 0, duration: 0.05, stagger: 0.02 }, 0.015)
        tl.to(intro, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.055)

        /* The push-in runs the entire pin. A held frame that is also
           perfectly still is the one thing that makes a pin read as a
           page that has stopped responding. */
        tl.to(plate, { scale: 1, duration: 1 }, 0)

        /* --- THE PASS ------------------------------------------- */
        /* ONE wash for all seven seats, crossing the frame once. Seven
           separate flashes read as an effect firing repeatedly; a
           single traverse reads as somebody walking a microphone
           through the room, which is what is being described. */
        tl.to(wash, { autoAlpha: 1, duration: 0.04 }, START - 0.03)
        tl.to(wash, { xPercent: 125, duration: END - START + 0.06 }, START - 0.03)
        tl.to(wash, { autoAlpha: 0, duration: 0.05 }, END - 0.02)

        /* The room comes up across the whole pass, on a dimmer. */
        tl.to(plate, { filter: 'brightness(0.9)', duration: END - START }, START)

        MEASURED.forEach((seat, i) => {
          const t0 = START + i * WINDOW + COUNT_IN
          tl.to(pools[i], { autoAlpha: 1, scale: 1, duration: 0.05, ease: 'power2.out' }, t0)
          tl.to(columns[i], { autoAlpha: 1, duration: 0.03 }, t0)
        })

        /* --- RESOLUTION ----------------------------------------- */
        tl.to(splitHead.lines, { yPercent: -108, duration: 0.03, stagger: 0.015 }, END)
        tl.to(intro, { autoAlpha: 0, y: -12, duration: 0.025 }, END)

        /* Seven columns count to zero together — that countdown is
           `readAt`'s last two branches, not a tween. The whole argument
           in one gesture: the error was different at every chair, and
           afterwards it is the same at all of them. */
        tl.to(plate, { filter: 'brightness(1)', duration: 0.05 }, RESOLVE_AT)
        tl.to(pools, { scale: 1.16, duration: 0.03, stagger: 0.006 }, RESOLVE_AT + 0.005)
        tl.to(pools, { scale: 1, duration: 0.04, stagger: 0.006 }, RESOLVE_AT + 0.035)

        tl.to(splitResolve.lines, { yPercent: 0, duration: 0.045, stagger: 0.02 }, RESOLVE_AT + 0.02)
        tl.to(resolveSub, { autoAlpha: 1, y: 0, duration: 0.03 }, RESOLVE_AT + 0.055)
        tl.to(settled, { autoAlpha: 1, y: 0, duration: 0.03 }, RESOLVE_AT + 0.07)
        tl.to(caption, { autoAlpha: 1, y: 0, duration: 0.03 }, RESOLVE_AT + 0.085)

        return () => tl.kill()
      })

      return () => {
        mm.revert()
        splitHead.revert()
        splitResolve.revert()
      }
    },
    [reduced],
  )

  /* The measurement sheet. Seven columns of type — the simultaneity
     is the point, and it belongs here rather than on the photograph,
     where seven floating readouts would be seven pieces of chrome
     over the thing they describe. */
  const sheet = (
    <div className="mt-7 max-w-md">
      <span className="t-label block border-t border-white/12 pt-3 text-mist">
        {D.sheet} &middot; ms
      </span>
      <div className="mt-3 flex items-start justify-between gap-2">
        {MEASURED.map((seat) => (
          <div key={seat.n} data-col>
            <span className="t-num block text-[0.5625rem] text-mist">{seat.n}</span>
            <span className="t-num mt-1 block whitespace-nowrap text-[0.6875rem] text-bone">
              <span data-ms>—</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const lights = (
    <div ref={frameRef} className="pointer-events-none absolute" aria-hidden="true">
      {MEASURED.map((seat) => (
        <Pool key={seat.n} seat={seat} />
      ))}

      {/* The pass. One soft column of light crossing the room once,
          over the whole sequence. */}
      <div
        data-wash
        className="absolute inset-y-0 left-0 w-[40%] mix-blend-screen will-change-transform"
        style={{
          background:
            'linear-gradient(to right, rgba(255,232,198,0) 0%, rgba(255,234,202,0.09) 38%, rgba(255,240,214,0.15) 52%, rgba(255,234,202,0.06) 66%, rgba(255,232,198,0) 100%)',
        }}
      />
    </div>
  )

  /* ---------- Reduced motion: the room up, and settled ---------- */
  if (reduced) {
    return (
      <section ref={root} id={D.id} className="relative bg-ink py-24">
        <div className="shell-wide">
          <span className="t-label text-fog">{D.label}</span>
          <h2 data-heading className="sr-only">
            {D.heading}
          </h2>
          <p data-intro className="sr-only">
            {D.intro}
          </p>
          <p data-resolve className="t-chapter mt-4 max-w-2xl text-pure">
            {D.resolve}
          </p>
          <p data-resolve-sub className="t-sub mt-5 max-w-md text-bone">
            {D.resolveSub}
          </p>
        </div>

        <div ref={stageRef} className="relative mt-12 aspect-[16/9] w-full overflow-hidden">
          <img
            data-plate
            src={D.plate}
            alt={D.plateAlt}
            loading="lazy"
            decoding="async"
            className="plate absolute inset-0"
          />
          {lights}
        </div>

        <div className="shell-wide">
          {sheet}
          <p data-settled className="t-label mt-6 text-fog">
            {D.settled}
          </p>
          <p data-caption className="t-label mt-3 text-mist">
            {D.caption}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section ref={root} id={D.id} aria-label={D.resolve} className="relative isolate bg-ink">
      <div
        ref={stageRef}
        data-stage
        className="relative h-[var(--app-h)] w-full overflow-hidden bg-ink"
      >
        <img
          data-plate
          src={D.plate}
          alt={D.plateAlt}
          loading="lazy"
          decoding="async"
          draggable="false"
          className="plate absolute inset-0 [--plate-contrast:1.04] [--plate-saturate:0.92] will-change-transform"
        />

        {/* The light layer is pinned to the photograph's cover crop by
            the observer above, not to the stage — a pool of light two
            chairs away from its chair is worse than no pool at all. */}
        {lights}

        {/* Type floor. The chairs sit centre-right in this frame and
            the left third is dark panelling, so the scrim only has to
            earn its opacity down the reading edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.82) 26%, rgba(0,0,0,0.34) 52%, rgba(0,0,0,0.12) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-ink/62"
        />

        <div className="relative flex h-full flex-col pb-9 pt-14 sm:pb-12 sm:pt-16">
          <header className="shell-wide flex items-start justify-between gap-8">
            <span className="t-label flex items-center gap-3 text-fog">
              {D.chapter}
              <span className="block h-px w-8 bg-white/25" aria-hidden="true" />
              <span className="hidden sm:inline">{D.label}</span>
            </span>

            <span className="t-num shrink-0 border-t border-white/12 pt-2 text-[0.6875rem] text-fog">
              {String(done).padStart(2, '0')} / {String(MEASURED.length).padStart(2, '0')}
              <span className="t-label ml-3 text-mist">measured</span>
            </span>
          </header>

          <div className="shell-wide flex min-h-0 flex-1 flex-col justify-center">
            <div className="max-w-xl">
              {/* Both headlines share one box: the resolve sits in flow
                  and sizes it, the opening line is laid over the top,
                  so the turn reads as one headline changing its mind
                  rather than as two blocks trading places. */}
              <div className="relative">
                <p data-resolve className="t-chapter text-pure">
                  {D.resolve}
                </p>
                <h2 data-heading className="t-chapter absolute inset-x-0 top-0 text-pure">
                  {D.heading}
                </h2>
              </div>

              {/* Same stack, same rule: whichever line is TALLER sits in
                  flow and sizes the box. */}
              <div className="relative mt-5">
                <p data-intro className="t-sub max-w-sm text-fog">
                  {D.intro}
                </p>
                <p data-resolve-sub className="t-sub absolute inset-x-0 top-0 max-w-sm text-bone">
                  {D.resolveSub}
                </p>
              </div>

              {sheet}

              {/* Two lines, stacked in flow. They were absolutely
                  positioned on top of one another to save the vertical
                  space — and since both arrive at the end, they simply
                  printed over each other. The space is reserved
                  instead; the column is centred, so nothing moves when
                  they land. */}
              <div className="mt-6 space-y-2">
                <p data-settled className="t-label text-fog">
                  {D.settled}
                </p>
                <p data-caption className="t-label text-mist">
                  {D.caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* One pool of light, lying on one chair.

   A soft ellipse, `screen`-blended, with a small warm core — light
   ADDED to the photograph rather than a marker drawn over it. No
   ring, no stroke, no outline: the moment this has an edge it stops
   being light in the room and becomes a pin on a map.

   TWO ELEMENTS, AND THE OUTER ONE IS NOT NEGOTIABLE. The outer div
   does the centring; the inner one is what GSAP scales. Putting both
   on one element looks fine and is wrong: GSAP writes the whole
   `transform` property when it animates `scale`, so a Tailwind
   `-translate-x-1/2` on the same element is silently discarded on the
   first frame and every pool jumps to sit with its CORNER on the
   mark. At these sizes that is about 5% of the frame — half a chair
   to the right, and consistent enough across all seven to look like
   deliberate placement rather than a bug. */
function Pool({ seat }) {
  const size = POOL[seat.row] ?? POOL[0]
  return (
    <div
      className="absolute"
      style={{
        left: `${seat.mark.x}%`,
        top: `${seat.mark.y}%`,
        width: `${size.w}%`,
        height: `${size.h}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        data-pool
        className="relative h-full w-full mix-blend-screen will-change-transform"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,241,219,0.62) 0%, rgba(255,231,197,0.28) 32%, rgba(255,226,188,0.09) 58%, rgba(255,224,184,0) 78%)',
        }}
      >
        <span
          className="absolute left-1/2 top-1/2 block h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: '#fff6e8', boxShadow: '0 0 12px 4px rgba(255,231,196,0.75)' }}
        />
      </div>
    </div>
  )
}
