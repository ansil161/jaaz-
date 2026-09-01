import { useEffect, useRef, useState } from 'react'
import { possibilities } from '@/features/public/data/site'
import { Lines } from '@/features/public/components/Motion'
import { Link } from '@/features/public/router/PageTransition'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   POSSIBILITIES — THE INVISIBLE ORBIT

   The homepage slot that used to hold a portfolio rail, and then a
   horizontal wall. It holds a proposal, and the reason is in
   data/site.js beside `possibilities`: JAAZ has no photography of
   its own work yet, and a portfolio built out of stock interiors is
   a portfolio that is lying at the exact point a visitor is
   deciding whether to trust the claim above it.

   So the section is built to be READ AS DIRECTION, not as proof.
   Two things carry that, and both survived the redesign:

   1. THE DISCLOSURE NEVER LEAVES THE SCREEN. `badge` is pinned to
      the stage, not to a card, so it is on screen for the whole
      traverse. A disclosure that scrolls away was written for the
      wrong reader.
   2. NOTHING IS CAPTIONED AS A JOB. No city, no seat count, no
      sign-off date anywhere in the data — `meta` is the two or
      three facts a room of this KIND is specified by.

   ------------------------------------------------------------
   WHY AN ORBIT

   The wall this replaces was a horizontal traverse: eight frames
   you walked past. It worked, but it is the single most-copied
   scroll idiom on the web, and a section whose job is to say "this
   is what your room could become" should not arrive in the one
   format the reader has already scrolled through on nine other
   sites this month.

   The environments now ride a circular path whose centre sits just
   off the LEFT edge of the stage and whose radius is very nearly
   the stage's own width. Two consequences, and they are the whole
   idea:

   - THE CIRCLE IS NEVER DRAWN AND NEVER VISIBLE. At any moment the
     arc on screen is a single shallow C bulging to the right. You
     read the curve off the marks travelling it, never off a guide.
     Nothing in this file or its CSS draws a circle, an ellipse or
     a ring.
   - THE STATIONS ARE NOT EVENLY SPACED ON SCREEN. Their angle runs
     through `tanh`, so the two either side of the active one open
     out across the composition while the distant six compress
     toward the top and bottom edges and fade to almost nothing.
     That is a horizon, not a carousel: the far side of the
     mechanism recedes instead of queueing.

   The result is a set surveyed from a fixed point rather than a
   sequence got through — the same argument the wall was making,
   made by a mechanism instead of by a rail.

   ------------------------------------------------------------
   ONE TIMELINE, FOUR LAYERS

   There is exactly one ScrollTrigger. It scrubs a single driver
   value `p` (the orbit's position, in stations) and one `render(p)`
   writes every element in the stage from it. No two triggers can
   disagree about where the mechanism is, and there is nothing to
   fight over the pin.

   Depth comes from the layers reading that ONE value at different
   rates, which is what separates choreography from float:

     1  the markers ride the path at p
     2  each marker's TYPE trails it along the same path by an
        amount taken from how fast the driver is moving, so the
        labels stream out behind their markers while you scroll and
        close onto them when you stop
     3  the column rules and the offset frame line counter-drift
        across the whole traverse, an order of magnitude slower
     4  the gallery itself moves against all of it, ~18px in total

   `p` is also shaped with a mild detent (`shape()`), so the
   mechanism settles as it arrives at a station and picks up again
   as it leaves. Nothing here is linear, and nothing here is
   random.

   ------------------------------------------------------------
   ONE TRANSITION SYSTEM

   Everything that changes at a station crossing is the same move:
   a masked wipe travelling UPWARD, in the direction the orbit
   travels, on the same eased fraction.

     the picture   incoming plate uncovered from its bottom edge,
                   outgoing plate drifting up and dimming under it,
                   with a hairline at the front of the wipe
     the title     complementary halves — the outgoing keeps the
                   top, the incoming takes the bottom, and they
                   pass through each other rather than cross-fade
     the number    a barrel: a column of all eight values moved by
                   the same p (the /solutions lens idiom)

   One move, three registers. Nothing fades into nothing.

   ------------------------------------------------------------
   GATES

     >= 1024 x 540, motion allowed    the orbit, pinned
     below that, motion allowed       the stack
     reduced motion, or no JS         the run

   Less motion never means less content: all eight environments are
   complete in all three, and the disclosure is in all three.

   ------------------------------------------------------------
   TWO RULES THIS FILE MUST KEEP

   NOTHING IN THE GALLERY MAY EVER GET `will-change`. Its layers
   are clip-path layers, and a promoted clip-path layer is the one
   thing Chrome intermittently fails to rasterise on this site —
   the frame draws and the photograph inside stays black.

   NOTHING IN `render()` MAY TOUCH A LAYOUT PROPERTY. Every
   per-frame write is a transform, an opacity or a custom property.
   The marker ticks scale rather than resize for exactly this
   reason.
   ============================================================ */

const ITEMS = possibilities.items
const N = ITEMS.length
const TOTAL = String(N).padStart(2, '0')

/* The orbit's floor, and BOTH halves of it were measured rather
   than chosen — each is the size at which something on the stage
   stops fitting.

   HEIGHT. 560 is where the left column stops fitting between the
   header clearance (96px) and the chat-widget clearance (80px),
   with the supporting sentence already stood down by `stage-tall`.

   WIDTH. 1152 is a consequence of the height. The column's width
   decides how many lines the room description takes, and the
   description is the tallest block in the stack — at 1024px the
   column is down to 272px, the description runs to five lines, and
   the column overflows the stage by 37px on a short window even
   though nothing about the width itself looked wrong. Below 1152
   the three zones this composition needs — argument, gallery, and
   the corridor the orbit swings through — do not fit side by side
   anyway, and the stack is the better page.

   THE HEIGHT MUST STAY WELL BELOW 599. A maximised 1366x768 laptop, which
   is the display this site is designed and reviewed on, reports
   `innerHeight` of about 599 once Windows' chrome is taken off —
   so a 640 floor reads as perfectly reasonable and silently hands
   the primary reviewing machine the phone layout. */
const ORBIT_GATE = '(min-width: 1152px) and (min-height: 560px)'
const MOTION_GATE = '(prefers-reduced-motion: no-preference)'

/* ------------------------------------------------------------------
   THE PATH

   Fractions of the STAGE FIELD (the box inside the top and bottom
   clearances), not of the viewport — so the geometry holds at any
   window proportion and no mark can wander under the site header or
   the floating chat widget.

   `cx: -0.06` is the whole trick. The centre is just outside the
   left edge and the radius is very nearly the field's width, so the
   arc crossing the stage is the right-hand cheek of a circle whose
   top, bottom and far side are all somewhere else entirely.

   `arc` is an ASYMPTOTE, not a step: angle = phase + arc·tanh(d·spread),
   so no station ever reaches it and the distant ones pile up just
   short of it, at the edges. `pull` shortens the radius as they go,
   which stops the far six landing on top of one another and reads
   as the path leaning away from the viewer.

   `phase: 4` is the asymmetry, and four degrees is all it takes. At
   zero the composition is a symmetrical arch with the two
   neighbours at matching heights — exactly the diagram-like balance
   this section must not have. At four the incoming station sits low
   and centre and the outgoing one high and right.
   ------------------------------------------------------------------ */
const PATH = { cx: -0.06, cy: 0.44, rx: 0.96, ry: 0.6, arc: 74, spread: 0.78, phase: 4, pull: 0.1 }

const RAD = Math.PI / 180

/** Where station `d` sits, `d` being its distance from the active one. */
function station(d) {
  const t = Math.tanh(d * PATH.spread)
  const a = (PATH.phase + PATH.arc * t) * RAD
  const r = 1 - PATH.pull * Math.abs(t)
  return {
    x: PATH.cx + PATH.rx * r * Math.cos(a),
    y: PATH.cy + PATH.ry * r * Math.sin(a),
  }
}

/**
 * How present a station is: 1 at the active position, falling away
 * fast. The past side is weighted 1.16 so it fades QUICKER than the
 * future side — a mechanism should look like it is arriving at
 * something rather than leaving it.
 */
function presence(d) {
  const w = Math.abs(d < 0 ? d * 1.16 : d)
  return Math.exp(-Math.pow(w / 1.35, 1.9))
}

/**
 * The distance from the active station, taken the SHORT way round.
 *
 * The orbit is a real ring, so at the first station the last two are
 * behind you, not seven stations ahead — which is both what an orbit
 * means and what fills the composition at the two ends of the
 * traverse. Without it the set queues up on one side and the first
 * screen, the one most readers see, has an empty half.
 *
 * Only the PLACEMENT wraps. The picture, the title and the index all
 * run 01 to 08 and stop, because the set is a set and not a loop.
 */
function offset(i, p) {
  const d = i - p
  if (d > N / 2) return d - N
  if (d < -N / 2) return d + N
  return d
}

/**
 * The detent. Blends the raw scrub with a smoothstep inside each
 * station interval, so the orbit settles as it arrives and picks up
 * again as it leaves — the weight a machined object has and a
 * constant-rate scrub does not. Applied ONCE, to the driver, so
 * every layer inherits the same timing and they cannot drift.
 */
function shape(v) {
  const i = Math.floor(v)
  const f = v - i
  return i + f * 0.45 + 0.55 * (f * f * (3 - 2 * f))
}

/* ------------------------------------------------------------------
   PER-ROOM FRAMING

   Art direction, not content, so it lives here rather than in
   data/site.js — the two unpinned layouts use only `pos`.

   `x`/`y` are the aperture's inset in percent. The frame BOX never
   changes size (that would be a layout write on every scroll frame);
   the OPENING inside it does, so one room is a narrow standing panel
   and the next is a wide band while the composition around them
   stays put. `pos` is the object-position that keeps each room's
   subject inside the opening once it has been cropped — several of
   these photographs are composed off-centre, and a centred crop puts
   the interesting half outside the frame.
   ------------------------------------------------------------------ */
const FRAMING = {
  '01': { x: 0, y: 0, pos: '50% 46%' },
  '02': { x: 7, y: 0, pos: '56% 48%' },
  '03': { x: 0, y: 5.5, pos: '50% 44%' },
  '04': { x: 3.5, y: 2.5, pos: '46% 52%' },
  '05': { x: 6, y: 0, pos: '52% 46%' },
  '06': { x: 0, y: 6, pos: '50% 52%' },
  '07': { x: 4, y: 3, pos: '48% 46%' },
  '08': { x: 0, y: 0, pos: '50% 56%' },
}
const framing = (n) => FRAMING[n] ?? { x: 0, y: 0, pos: '50% 50%' }

/* ==================================================================
   SHARED PIECES
   ================================================================== */

/* The argument. `compact` is the pinned stage's column, which is
   ~24rem wide and cannot take `t-display` — that clamp is sized off
   the window's WIDTH alone and would set this heading at ~90px in a
   380px column, where "What could your" is a line and a half. */
function Header({ compact = false }) {
  return (
    <>
      <Lines
        as="h2"
        className={`${
          compact
            ? 'font-display text-[clamp(1.55rem,min(2.9vw,5.4vh),3rem)] leading-[1.02] tracking-[-0.022em]'
            : 't-display'
        } max-w-[13ch] text-bone`}
        stagger={0.11}
      >
        {possibilities.heading.map((l, i) => (
          <span key={l} className="block">
            {i === 1 ? <em className="italic-display">{l}</em> : l}
          </span>
        ))}
      </Lines>

      {/* On the stage this sentence is the one block that stands down
          on a short window — see `stage-tall` in site.css. It is the
          only thing in that column that is not load-bearing: the
          heading asks the question, the disclosure qualifies the
          pictures, and the eight rooms answer it. Everywhere else it
          is simply always there. */}
      <Lines
        as="p"
        className={
          compact
            ? 't-body mt-[clamp(0.75rem,2.5vh,1.25rem)] hidden max-w-[34ch] text-fog stage-tall:block'
            : 't-sub mt-6 max-w-[36ch] text-fog'
        }
      >
        {possibilities.intro}
      </Lines>
    </>
  )
}

/* The disclosure. Same mark in all three layouts. Short on purpose —
   it is set in mono at 11px, where a three-line sentence stops
   reading as a note and starts reading as small print somebody is
   hoping you will skip. */
function Badge({ className = '' }) {
  return (
    <span
      className={`t-num inline-flex items-center gap-2.5 border-t border-white/[0.14] pt-2.5 text-[0.6875rem] whitespace-nowrap text-mist ${className}`}
    >
      <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-cove" />
      {possibilities.badge}
    </span>
  )
}

/* The only way a room photograph enters this section.

   Graded, never dimmed. Several of these rooms are exposed near
   black to begin with, and there is no type sitting on top of any of
   them here — every caption is BESIDE the picture, not over it — so
   brightness stays at 1 and the grading is a contrast lift only.

   `maxWidth: none` is not optional: Tailwind's preflight sets
   `img { max-width: 100% }`, which clamps an absolutely positioned
   plate back to its frame without a trace. */
function Plate({ item, sizes, priority = false, className = '' }) {
  return (
    <img
      src={item.image}
      alt={item.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      sizes={sizes}
      className={`plate absolute inset-0 h-full w-full object-cover [--plate-contrast:1.05] [--plate-saturate:0.95] ${className}`}
      style={{ maxWidth: 'none', objectPosition: framing(item.n).pos }}
    />
  )
}

function Caption({ item, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-4">
        <span className="t-num text-[0.625rem] text-cove">
          {item.n} <span className="text-fog/40">/ {TOTAL}</span>
        </span>
        <span className="t-label text-[0.625rem] text-mist">{item.label}</span>
      </div>
      <h3 className="t-heading mt-4 text-pure">{item.title}</h3>
      <p className="t-sub mt-2 text-bone">{item.line}</p>
      <p className="t-body mt-3 max-w-[42ch] text-fog">{item.body}</p>
      <p className="t-num mt-4 text-[0.6875rem] leading-relaxed text-mist">{item.meta}</p>
    </div>
  )
}

/* ==================================================================
   THE ORBIT — >= 1024 x 640, motion allowed
   ================================================================== */

function Orbit() {
  /* The ONLY React state the scrub writes, and it changes eight times
     in the whole traverse. A component that re-renders on every
     scroll frame cannot hold 60fps with eight plates in it. */
  const [active, setActive] = useState(0)
  const trigger = useRef(null)

  const scope = useGsapScope((root) => {
    const field = root.querySelector('[data-field]')
    const stage = root.querySelector('[data-stage]')
    if (!field || !stage) return

    const marks = gsap.utils.toArray(root.querySelectorAll('[data-mark]'))
    const texts = marks.map((m) => m.querySelector('[data-mark-text]'))
    const ticks = marks.map((m) => m.querySelector('[data-mark-tick]'))
    const dots = marks.map((m) => m.querySelector('[data-mark-dot]'))
    const cats = marks.map((m) => m.querySelector('[data-mark-cat]'))

    const layers = gsap.utils.toArray(root.querySelectorAll('[data-layer]'))
    const plates = layers.map((l) => l.querySelector('img'))
    const titles = gsap.utils.toArray(root.querySelectorAll('[data-title]'))

    const aperture = root.querySelector('[data-aperture]')
    const gallery = root.querySelector('[data-gallery]')
    const frameline = root.querySelector('[data-frameline]')
    const front = root.querySelector('[data-front]')
    const rules = root.querySelector('[data-rules]')
    const roll = root.querySelector('[data-roll]')
    const rail = root.querySelector('[data-rail]')
    const hint = root.querySelector('[data-hint]')
    const light = root.querySelector('[data-light]')
    const quiet = root.querySelector('[data-quiet]')

    /* Measured, never assumed, and re-measured on every refresh —
       fonts, the CDN plates and a window resize all change it. */
    let box = { w: 1, h: 1 }
    const measure = () => {
      const r = field.getBoundingClientRect()
      box = { w: r.width || 1, h: r.height || 1 }
    }
    measure()

    const ease = gsap.parseEase('jaz-io')
    const hot = new Array(N).fill(null)
    let lastSeg = -1
    let lastActive = -1

    /* LAYER 2's state. `lag` is how far behind its own marker each
       label is riding, in stations, and it is derived from how fast
       the driver is actually moving rather than being a constant.

       A fixed offset was the first version and it is the wrong idea:
       it reads as the type being BOLTED to the armature a few degrees
       back, so a parked stage sits there with a permanent gap between
       every label and its marker that nothing explains. Driven by the
       rate instead, the labels stream out behind the markers while
       you are scrolling and close up onto them when you stop, which
       is what mass looks like. Signed, so it also works scrolling
       back up. */
    let lag = 0
    let lastP = null

    /* ---------------- one write pass, one value ---------------- */
    const render = (raw) => {
      const p = shape(gsap.utils.clamp(0, N - 1, raw))
      const through = p / (N - 1) // 0..1 across the whole traverse

      /* Rate is measured off the driver, not off ScrollTrigger's
         `getVelocity()` — the driver is already smoothed by the scrub,
         and `getVelocity()` is documented elsewhere in this codebase
         as able to hand back a non-finite value around programmatic
         jumps, which would poison every transform below it. */
      const rate = lastP === null ? 0 : p - lastP
      lastP = p
      lag += (gsap.utils.clamp(-0.08, 0.08, rate * 1.6) - lag) * 0.14

      /* LAYER 1 + 2 — the stations, and their trailing type. */
      for (let i = 0; i < N; i++) {
        const d = offset(i, p)
        const s = station(d)
        const pr = presence(d)

        marks[i].style.transform = `translate3d(${(s.x * box.w).toFixed(1)}px,${(
          s.y * box.h
        ).toFixed(1)}px,0) translate(-100%,-50%) scale(${(0.76 + 0.24 * pr).toFixed(3)})`
        /* No opacity floor. The far side of the ring compresses into
           a single point near the bottom-left corner, which is where
           the disclosure sits — five marks held at a "harmless" 0.05
           each stack to about 0.23 over that copy, which is not a
           horizon, it is dirt on the lens. Presence already falls to
           0.012 by the third station out; let it reach zero. */
        marks[i].style.opacity = pr.toFixed(3)

        /* And a mark you cannot see must not be a mark you can click.
           Written only on the crossing, because setting an identical
           value still dirties the element for style recalc. */
        const live = pr > 0.09
        if (live !== hot[i]) {
          hot[i] = live
          marks[i].style.pointerEvents = live ? 'auto' : 'none'
        }

        /* The label sits where its marker WAS, a fraction of a station
           back along the path. Same function, one argument different —
           so the drag is always tangent to the curve and can never
           drift off it the way a hand-tuned offset would. */
        const t = station(d + lag)
        texts[i].style.transform = `translate3d(${((t.x - s.x) * box.w).toFixed(2)}px,${(
          (t.y - s.y) *
          box.h
        ).toFixed(2)}px,0)`

        /* scaleX, not width. A width write is a layout write, and
           eight of them a frame inside a pin is how a section that
           looks finished ends up running at 34fps. */
        ticks[i].style.transform = `scaleX(${(0.26 + 0.74 * pr).toFixed(3)})`
        dots[i].style.opacity = (pr * pr * pr).toFixed(3)
        cats[i].style.opacity = (pr * pr).toFixed(3)

        /* THE TYPE IS CUT OFF ENTIRELY BEYOND THE SECOND STATION OUT,
           on a ramp rather than by the mark's own opacity.

           The far side of the ring compresses into the bottom-left
           corner of the field, and that corner is where the room's
           specification line is set. A station two out still carries
           enough presence (0.12) to put a legible pair of digits on
           top of that sentence — faint, but a faint number printed
           over a word is dirt, not depth. Below 0.16 the label is
           gone and only the marker and its tick remain, which is all
           the far side of a mechanism should show. */
        texts[i].style.opacity = gsap.utils.clamp(0, 1, (pr - 0.16) / 0.34).toFixed(3)
      }

      /* ---------------- the transition, one eased fraction ------- */
      const seg = Math.min(N - 2, Math.max(0, Math.floor(p)))
      const f = gsap.utils.clamp(0, 1, p - seg)
      /* The transition occupies the MIDDLE of each interval, not all
         of it. Run edge to edge, the stage is mid-wipe for half of
         every station and therefore never actually arrives anywhere —
         a section permanently in transit, which is the opposite of
         the settled, mechanical feel this is after. Holding the first
         and last 18% gives each room a moment of being simply itself
         before the next one starts to arrive. */
      const rev = ease(gsap.utils.clamp(0, 1, (f - 0.18) / 0.64))

      if (seg !== lastSeg) {
        /* Only two plates are ever rasterised. The rest are
           `visibility: hidden`, which keeps them inside the lazy
           loader's viewport (unlike `display: none`) while costing
           nothing to paint. */
        for (let k = 0; k < N; k++) {
          const on = k === seg || k === seg + 1
          layers[k].style.visibility = on ? 'visible' : 'hidden'
          titles[k].style.visibility = on ? 'visible' : 'hidden'
        }
        lastSeg = seg
      }

      layers[seg].style.clipPath = 'inset(0% 0% 0% 0%)'
      layers[seg].style.transform = `translate3d(0,${(-2.6 * rev).toFixed(2)}%,0)`
      layers[seg].style.opacity = (1 - 0.5 * rev).toFixed(3)
      layers[seg + 1].style.clipPath = `inset(${((1 - rev) * 100).toFixed(2)}% 0% 0% 0%)`
      layers[seg + 1].style.opacity = '1'
      layers[seg + 1].style.transform = 'translate3d(0,0,0)'

      /* The incoming plate travels the other way inside its own mask,
         so the picture is UNCOVERED rather than slid into place. */
      plates[seg + 1].style.transform = `translate3d(0,${(3.4 * (1 - rev)).toFixed(2)}%,0)`
      plates[seg].style.transform = 'translate3d(0,0,0)'

      /* The front of the wipe. One hairline, no glow, and present only
         while the wipe is actually crossing — a parked stage must not
         have a stray rule lying across the photograph.

         It is a FULL-HEIGHT box with its line drawn on the top border,
         not a 1px strip: a percentage translate resolves against the
         element's OWN height, so a 1px strip moved by 100% travels one
         pixel. This one travels the height of the aperture. */
      front.style.transform = `translate3d(0,${((1 - rev) * 100).toFixed(2)}%,0)`
      front.style.opacity = (Math.sin(rev * Math.PI) * 0.5).toFixed(3)

      /* The description steps out of the way for the crossing and back
         once it is done. `active` flips at exactly f = 0.5, which is
         where this is at zero — so the words are never seen changing. */
      const bell = Math.max(0, 1 - Math.abs(f - 0.5) * 2.9)
      quiet.style.opacity = (1 - bell).toFixed(3)
      quiet.style.transform = `translate3d(0,${(bell * 7).toFixed(2)}px,0)`

      /* The aperture, interpolated — so the opening is genuinely
         between two proportions mid-transition rather than snapping at
         the crossing. */
      const a = framing(ITEMS[seg].n)
      const b = framing(ITEMS[seg + 1].n)
      aperture.style.setProperty('--ap-x', `${(a.x + (b.x - a.x) * rev).toFixed(2)}%`)
      aperture.style.setProperty('--ap-y', `${(a.y + (b.y - a.y) * rev).toFixed(2)}%`)

      /* The title, in complementary halves. Type cannot cross-fade
         through type legibly, so the two are cut rather than mixed. */
      titles[seg].style.clipPath = `inset(0% 0% ${(rev * 100).toFixed(2)}% 0%)`
      titles[seg].style.transform = `translate3d(0,${(-14 * rev).toFixed(2)}px,0)`
      titles[seg + 1].style.clipPath = `inset(${((1 - rev) * 100).toFixed(2)}% 0% 0% 0%)`
      titles[seg + 1].style.transform = `translate3d(0,${(16 * (1 - rev)).toFixed(2)}px,0)`

      /* The barrel. The column is N rows tall and the window is one,
         so a percentage translate needs no measurement to survive a
         font swap or a resize. */
      roll.style.transform = `translate3d(0,${((-p / N) * 100).toFixed(3)}%,0)`

      /* LAYER 3 — the structure, moving an order of magnitude slower
         and against the marks. */
      rules.style.transform = `translate3d(${((0.5 - through) * 26).toFixed(2)}px,0,0)`
      frameline.style.transform = `translate3d(${((through - 0.5) * 14).toFixed(2)}px,${(
        (0.5 - through) *
        10
      ).toFixed(2)}px,0)`

      /* LAYER 4 — the gallery itself, against everything. */
      gallery.style.transform = `translate3d(${((0.5 - through) * 18).toFixed(2)}px,0,0)`

      rail.style.setProperty('--rp', through.toFixed(4))
      hint.style.opacity = gsap.utils.clamp(0, 1, 1 - p * 5).toFixed(3)

      const now = Math.round(p)
      if (now !== lastActive) {
        lastActive = now
        setActive(now)
      }
    }

    /* ---------------- the one timeline ---------------- */
    const drive = { p: 0 }
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        /* Measured off the window rather than fixed, so the traverse
           costs the same number of SCREENS on any display. 0.62 of a
           screen per station is the slowest this can run before the
           section reads as a hostage situation, and the fastest it can
           run before the detent stops registering. */
        end: () => '+=' + Math.round(window.innerHeight * (0.34 + (N - 1) * 0.62)),
        pin: stage,
        anticipatePin: 1,
        /* The scrub IS the momentum. A heavy mechanism does not stop
           when the wheel does; it arrives a beat later. */
        scrub: 1.05,
        invalidateOnRefresh: true,
        onRefresh: measure,
      },
    })
    tl.to(drive, { p: N - 1, ease: 'none', onUpdate: () => render(drive.p) })

    trigger.current = tl.scrollTrigger
    render(0)

    /* The pointer's light on the picture — smoothed through quickTo so
       it trails the cursor instead of snapping to it, and the only
       pointer-reactive thing on the stage. Eight marks chasing a
       cursor would be a toy; this is a gallery. */
    /* Tweened as plain NUMBERS on a proxy and written out as
       percentages, not tweened as the custom properties themselves —
       an unregistered custom property is an untyped string to the
       interpolator, and the pool would jump between pointer samples
       instead of following them. */
    const pointer = { x: 50, y: 40 }
    const applyLight = () => {
      light.style.setProperty('--lx', `${pointer.x.toFixed(2)}%`)
      light.style.setProperty('--ly', `${pointer.y.toFixed(2)}%`)
    }
    const lx = gsap.quickTo(pointer, 'x', { duration: 0.9, ease: 'jaz', onUpdate: applyLight })
    const ly = gsap.quickTo(pointer, 'y', { duration: 0.9, ease: 'jaz' })
    const onMove = (e) => {
      const r = gallery.getBoundingClientRect()
      lx(gsap.utils.clamp(-20, 120, ((e.clientX - r.left) / r.width) * 100))
      ly(gsap.utils.clamp(-20, 120, ((e.clientY - r.top) / r.height) * 100))
    }
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (fine) stage.addEventListener('pointermove', onMove)

    /* The plates come off a CDN and land after layout. The pin's range
       is a function of the window and does not depend on them, but the
       FIELD box does — a late arrival that reflows the column by a
       line leaves every mark placed against a stale measurement. */
    const imgs = root.querySelectorAll('img')
    const refresh = () => ScrollTrigger.refresh()
    imgs.forEach((im) => {
      if (!im.complete) im.addEventListener('load', refresh, { once: true })
    })

    return () => {
      if (fine) stage.removeEventListener('pointermove', onMove)
      imgs.forEach((im) => im.removeEventListener('load', refresh))
      trigger.current = null
    }
  }, [])

  /* Warm the plate two stations ahead. The transition is a wipe, and a
     wipe that uncovers a half-decoded picture is worse than no wipe. */
  useEffect(() => {
    const next = ITEMS[active + 2]
    if (!next) return
    const im = new Image()
    im.src = next.image
  }, [active])

  /* Every station is reachable without scrolling to it. The marks are
     the controls because they are the large, obvious targets; the
     index on the right is a readout and stays out of the tab order. */
  const goTo = (i) => {
    const st = trigger.current
    if (!st) return
    const y = st.start + ((st.end - st.start) * i) / (N - 1)
    if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.5 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const item = ITEMS[active]

  return (
    <section id="possibilities" ref={scope} className="relative bg-ink">
      <div data-stage className="relative h-[var(--app-h)] overflow-hidden bg-ink">
        {/* THE FIELD. Everything is positioned against this box, not
            against the viewport: its top clears the homepage header
            (a SOLID black bar down to y=86, not an overlay) and its
            bottom clears the floating chat widget, which is fixed
            over the bottom-right corner and silently swallows clicks
            on anything placed under it.

            BOTH FLOORS ARE MEASURED, NOT CHOSEN. The header is 86px,
            so the top floor is 96. The widget sits 24px off the
            bottom and is 46px tall, so the bottom floor is 80 — and
            it has to be a floor rather than a plain `8vh`, because
            8vh only clears 70px above a 875px window and the two
            quietly begin to overlap below that. Neither piece of
            chrome exists in the /wall.html harness, so a stage that
            looks correct there can still be wrong on `/`. */}
        <div
          data-field
          className="absolute inset-x-[var(--gutter)] top-[clamp(6rem,9vh,7rem)] bottom-[clamp(5rem,8vh,6.5rem)]"
          /* The column's width is published as a variable so the
             gallery can be positioned FROM it rather than at a
             percentage that happens to clear it. As a percentage the
             two converge as the window narrows — at 1152px a 30%
             gallery edge and a 304px column leave a 7px gutter — and
             the gap between the argument and the picture is not
             something that should quietly vanish at one width. */
          style={{ '--col': 'clamp(19rem,25vw,26rem)', '--col-gap': 'clamp(2rem,3.5vw,4.5rem)' }}
        >
          {/* LAYER 3 — the substrate. Column lines off a floor plan,
              and VERTICAL on purpose: the one thing this section must
              never do is hint at a circle. */}
          <div
            data-rules
            aria-hidden="true"
            className="orbit-rules pointer-events-none absolute -inset-x-[10%] -inset-y-[12%]"
          />

          {/* ---------------- the argument, left ---------------- */}
          <div className="absolute inset-y-0 left-0 flex w-[var(--col)] flex-col justify-between">
            {/* Every gap in this column is written against the WINDOW'S
                HEIGHT, not as a fixed step.

                The column carries nine blocks — label, heading, intro,
                index, title, line, description, disclosure, hint — into
                a field that is only 439px tall on a maximised 1366x768
                laptop, which is the display this site is reviewed on.
                At the site's normal `mt-5`/`mt-6` rhythm the stack came
                to 519px and the disclosure was quietly clipped off the
                bottom of the stage: present in the DOM, absent from the
                page, which for a legal disclosure is the worst of both.
                A taller window gets the normal rhythm back. */}
            <div>
              <span className="t-label text-mist">{possibilities.label}</span>
              <div className="mt-[clamp(0.875rem,3vh,1.5rem)]">
                <Header compact />
              </div>
              {/* The disclosure sits with the ARGUMENT, not at the foot
                  of the column, and that is a safety decision as much
                  as an editorial one.

                  Editorially it belongs here: the heading asks what a
                  room could become and this is the sentence that says
                  these pictures are not answers, so the qualifier
                  should be attached to the claim rather than parked
                  four blocks below it.

                  Structurally, whatever ends up last in a column that
                  is one long stack is the block a short window pushes
                  off the stage — and the one block that must never be
                  the casualty is the disclosure. Last position now
                  belongs to the room's description, where losing a
                  line is survivable. */}
              <Badge className="mt-[clamp(0.875rem,3vh,1.5rem)]" />
            </div>

            {/* THE READOUT, anchored by its BOTTOM edge — so the body
                copy changing length between rooms grows the block
                upward and never moves the disclosure under it. */}
            <div className="relative">
              {/* `items-center`, not `items-baseline`. The barrel is an
                  `overflow: hidden` block, whose baseline is synthesised
                  from its bottom margin edge rather than from the digit
                  inside it — so baseline alignment drops it half a line
                  below the `/ 08` beside it. */}
              <div className="flex items-center gap-4 border-t border-white/[0.12] pt-[clamp(0.625rem,2vh,1rem)]">
                <span
                  className="orbit-roll t-num block text-[0.75rem] text-cove"
                  style={{ '--roll-h': '1.15em' }}
                >
                  <span data-roll data-col className="block">
                    {ITEMS.map((it) => (
                      <span
                        key={it.n}
                        data-row
                        className="flex items-center leading-[1.15em] tabular-nums"
                      >
                        {it.n}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="t-num text-[0.75rem] text-fog/35">/ {TOTAL}</span>
                <span className="t-label ml-auto text-[0.5625rem] text-mist">{item.label}</span>
              </div>

              {/* All eight titles are stacked and only the two either
                  side of a crossing are visible — so the wipe has real
                  type to cut and never waits on a re-render. The
                  `min-h` reserves the tallest of them; the stack is
                  absolute and would otherwise collapse. */}
              <div className="relative mt-[clamp(0.75rem,2.5vh,1.25rem)] min-h-[clamp(3.5rem,10vh,5.75rem)]">
                {ITEMS.map((it) => (
                  <div key={it.n} data-title className="absolute inset-x-0 top-0">
                    <h3 className="font-display text-[clamp(1.35rem,min(1.95vw,3.4vh),2rem)] leading-[1.04] tracking-[-0.02em] text-pure">
                      {it.title}
                    </h3>
                    <p className="t-body mt-2 text-bone">{it.line}</p>
                  </div>
                ))}
              </div>

              {/* The description, quietly. It does not wipe: it steps
                  out of the way while the picture and the name are
                  changing and steps back once they have. Two sentences
                  cutting in half mid-crossing is noise, and the eye
                  should be on the photograph at that moment. */}
              <div data-quiet className="mt-[clamp(0.625rem,2.2vh,1rem)]">
                <p className="t-body max-w-[36ch] text-fog">{item.body}</p>
                <p className="t-num mt-[clamp(0.5rem,1.6vh,0.75rem)] text-[0.6875rem] leading-relaxed text-mist">
                  {item.meta}
                </p>
              </div>

              {/* The one instruction, and it removes itself the moment
                  the mechanism has been understood. */}
              <span
                data-hint
                aria-hidden="true"
                className="t-num absolute -right-1 -bottom-6 flex items-center gap-2 text-[0.5625rem] tracking-[0.18em] text-ash uppercase"
              >
                scroll
                <span className="relative block h-6 w-px overflow-hidden bg-white/15">
                  <span className="jaz-scroll-tick absolute inset-x-0 top-0 block h-2 bg-cove" />
                </span>
              </span>
            </div>
          </div>

          {/* ---------------- the gallery ---------------- */}
          {/* The gallery's box is set by the ORBIT, not by a preferred
              aspect ratio. Its top clears the outgoing station, which
              passes high at about 5% of the field, and its bottom
              clears the incoming one, which passes low at about 88%.
              Its right edge is set by the two live stations, which
              swing in to about 73% during a crossing: their MARKERS
              have to stay clear of the frame even though their labels
              deliberately do not.

              The left edge is the only one with any give, which is
              why the COPY COLUMN was narrowed rather than the
              picture. A frame taking a third of the stage reads as an
              illustration beside an argument, and in this section the
              picture IS the argument. */}
          <div
            data-gallery
            className="absolute top-[9%] right-[31%] bottom-[16%] left-[calc(var(--col)+var(--col-gap))] z-10"
          >
            {/* The offset frame: a drawn rectangle the picture does NOT
                sit inside. Two planes, a hairline and a photograph,
                held apart. That is the whole frame of this section —
                no radius, no shadow, no card. */}
            <div
              data-frameline
              aria-hidden="true"
              className="pointer-events-none absolute -top-[clamp(0.75rem,1.4vh,1.25rem)] -left-[clamp(0.75rem,1.1vw,1.25rem)] h-full w-full border border-white/[0.13]"
            />

            <div
              data-aperture
              className="orbit-clip relative h-full w-full overflow-hidden bg-ink-3"
              style={{ '--ap-x': '0%', '--ap-y': '0%' }}
            >
              {ITEMS.map((it, i) => (
                <div
                  key={it.n}
                  data-layer
                  className="absolute inset-0 overflow-hidden"
                  /* The first two are eager because they are the first
                     wipe, and a wipe that uncovers a half-decoded
                     picture is worse than no wipe. From there the
                     effect above warms two stations ahead, which is
                     roughly a screen and a half of scrolling — long
                     enough to decode on a slow connection, short
                     enough that a reader who never reaches the section
                     has downloaded two plates rather than eight. */
                  style={{ visibility: i < 2 ? 'visible' : 'hidden' }}
                >
                  <Plate item={it} priority={i < 2} sizes="(min-width: 1024px) 38vw, 100vw" />
                </div>
              ))}

              <div
                data-front
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 border-t border-white/70"
              />

              <div
                data-light
                aria-hidden="true"
                className="orbit-light pointer-events-none absolute inset-0"
                style={{ '--lx': '50%', '--ly': '40%' }}
              />
            </div>

            {/* NOTHING ELSE GOES ON THIS FRAME.

                Two versions of a specification label were tried here
                — one under the picture, one set vertically up its
                right edge — and both were struck through by a moving
                station, because the band below the frame and the
                margin beside it are not empty space. They are the
                orbit's corridor: the incoming station crosses directly
                under the picture at every whole number, and the two
                live stations swing through the margin beside it during
                every crossing. Neither collision is fixable with an
                offset, because both move with the window.

                The only reliably clear ground on this stage is the
                left column, which is where the specification went. A
                caption that reads perfectly on a parked stage and is
                cut in half by a moving one is worse than no caption.
                The frame carries its offset hairline and nothing
                else. */}
          </div>

          {/* ---------------- the orbit ----------------
              BELOW the gallery, and that is the load-bearing decision
              in this whole composition.

              Halfway through a crossing the two live stations swing to
              about 73% and 79% of the field's width, while their type
              is typeset ~15% leftwards from the marker — so the tail
              of the label lands on the outer edge of the photograph.
              Set above the picture it is mono type over a lit
              interior: sometimes legible, sometimes not, depending
              entirely on which room is on screen.

              Set beneath it, the label is simply OCCLUDED. Each
              station emerges from behind the picture's right edge,
              opens out across the margin and slides back behind it,
              which is what the path is actually doing — and no text on
              this stage is ever half-readable. The marker and its tick
              stay clear of the frame through the whole settled state
              and only graze it at the closest point of a crossing, so
              the mechanism itself never disappears — only its
              caption. */}
          <nav aria-label="Environments" className="pointer-events-none absolute inset-0 z-0">
            {ITEMS.map((it, i) => (
              <button
                key={it.n}
                data-mark
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === active ? 'true' : undefined}
                className="orbit-mark focus-ring pointer-events-auto flex items-center gap-3 whitespace-nowrap text-bone"
              >
                <span data-mark-text className="flex items-baseline gap-2.5">
                  <span className="t-num text-[0.6875rem]">{it.n}</span>
                  <span data-mark-cat className="t-label text-[0.5625rem] text-fog">
                    {it.label}
                  </span>
                </span>
                <span
                  data-mark-tick
                  aria-hidden="true"
                  className="block h-px w-[2.75rem] origin-right bg-white/45"
                />
                <span aria-hidden="true" className="relative block h-[5px] w-[5px]">
                  <span className="absolute inset-0 rounded-full bg-ash" />
                  <span data-mark-dot className="absolute inset-0 rounded-full bg-cove" />
                </span>
                <span className="sr-only">{it.title}</span>
              </button>
            ))}
          </nav>

          {/* ---------------- the index ----------------
              An exhibition index, not pagination: eight numbers held
              on a hairline with a lit segment reporting where in the
              set you are. No dots, no pills, nothing to click — the
              marks are the controls. */}
          <div
            data-rail
            aria-hidden="true"
            className="absolute top-[16%] right-0 bottom-[22%] flex w-10 flex-col justify-between"
            style={{ '--rp': 0 }}
          >
            <span className="pointer-events-none absolute top-0 bottom-0 left-0 w-px bg-white/[0.1]" />
            <span
              className="pointer-events-none absolute top-0 left-0 h-full w-px origin-top bg-cove/70"
              style={{ transform: 'scaleY(var(--rp))' }}
            />
            {ITEMS.map((it, i) => (
              <span
                key={it.n}
                className={`t-num pl-3 text-[0.5625rem] transition-colors duration-500 ${
                  i === active ? 'text-bone' : 'text-ash/70'
                }`}
              >
                {it.n}
              </span>
            ))}
          </div>

          {/* The way out. Navigation, not an ask — the homepage carries
              no closing CTA on purpose (see HomePage.jsx), so this is
              a route to the catalogue. Held clear of the right edge so
              it never lands under the chat widget. */}
          <div className="absolute right-14 bottom-0 text-right">
            <Link
              to={possibilities.link.to}
              className="link-underline focus-ring t-label inline-block text-fog"
            >
              {possibilities.link.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ==================================================================
   THE STACK — under 1024px, motion allowed

   Not the orbit squeezed. Below the orbit's floor there is no room
   for a path AND a picture AND a column of type, so the concept is
   carried by the part of it that survives the loss of width: the
   environments arrive from BELOW and settle over one another, each
   holding the screen while the next climbs into it, and the room
   still to come is named at the foot of every card — the orbit's
   "there is more of this, just off the edge" reduced to the one
   axis a phone has.

   Sticky, not pinned. A stack of `position: sticky` cards is the
   only full-viewport idiom on this site that needs no measurement,
   no pin spacer and no ticker, so it cannot strand a reader
   mid-section on a device this file cannot be tested on.
   ================================================================== */

function Stack() {
  return (
    <section id="possibilities" className="relative bg-ink">
      <header className="shell-wide pt-24 pb-14 sm:pt-28">
        <span className="t-label text-mist">{possibilities.label}</span>
        <div className="mt-4">
          <Header />
        </div>
        <p className="t-body mt-8 max-w-[44ch] border-t border-white/[0.1] pt-6 text-mist">
          {possibilities.note}
        </p>
        <Badge className="mt-8" />
      </header>

      <div className="relative">
        {ITEMS.map((item, i) => {
          const next = ITEMS[i + 1]
          return (
            <article
              key={item.n}
              className="sticky top-0 h-[var(--app-h)] overflow-hidden bg-ink"
              style={{ zIndex: i + 1 }}
            >
              {/* The card's own top rule is what makes the stack
                  legible — you watch the edge of each one arrive over
                  the last. */}
              <div className="absolute inset-x-0 top-0 h-px bg-white/[0.14]" />

              <div className="shell-wide flex h-full flex-col justify-center gap-6 py-16">
                <div className="flex items-baseline gap-4">
                  <span className="t-num text-[0.625rem] text-cove">
                    {item.n} <span className="text-fog/40">/ {TOTAL}</span>
                  </span>
                  <span className="t-label text-[0.5625rem] text-mist">{item.label}</span>
                </div>

                <div className="relative aspect-4/3 w-full overflow-hidden bg-ink-3 sm:aspect-16/10">
                  <Plate item={item} sizes="100vw" />
                </div>

                <div>
                  <h3 className="font-display text-[clamp(1.6rem,7vw,2.6rem)] leading-[1.03] tracking-[-0.022em] text-pure">
                    {item.title}
                  </h3>
                  <p className="t-body mt-2 text-bone">{item.line}</p>
                  <p className="t-body mt-3 max-w-[46ch] text-fog">{item.body}</p>
                  <p className="t-num mt-4 text-[0.6875rem] leading-relaxed text-mist">
                    {item.meta}
                  </p>
                </div>
              </div>

              {/* The index, and the room still to come. Held above the
                  floating chat widget's corner. */}
              <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-white/[0.12]">
                  <span
                    className="block h-px bg-cove"
                    style={{ width: `${((i + 1) / N) * 100}%` }}
                  />
                </span>
                {next && (
                  <span className="t-num shrink-0 text-[0.5625rem] tracking-[0.16em] text-ash uppercase">
                    next {next.n}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="shell-wide relative z-20 bg-ink pt-16 pb-4">
        <Link
          to={possibilities.link.to}
          className="link-underline t-label focus-ring inline-block text-fog"
        >
          {possibilities.link.label}
        </Link>
      </div>
    </section>
  )
}

/* ==================================================================
   THE RUN — reduced motion, and no JS

   Eight complete environments in the page's own axis, nothing behind
   a control and nothing waiting on a scroll position. Less motion
   must never mean less content.
   ================================================================== */

function Run() {
  return (
    <section id="possibilities" className="relative bg-ink py-24 sm:py-32">
      <header className="shell-wide">
        <span className="t-label text-mist">{possibilities.label}</span>
        <div className="mt-4">
          <Header />
        </div>
        <p className="t-body mt-8 max-w-[46ch] border-t border-white/[0.1] pt-6 text-mist">
          {possibilities.note}
        </p>
        <Badge className="mt-8" />
      </header>

      <div className="shell-wide mt-16 grid gap-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-20">
        {ITEMS.map((item) => (
          <article key={item.n}>
            <div className="relative aspect-16/9 w-full overflow-hidden bg-ink-3">
              <Plate item={item} sizes="(min-width: 640px) 46vw, 100vw" />
            </div>
            <Caption item={item} className="mt-6" />
          </article>
        ))}
      </div>

      <div className="shell-wide mt-20">
        <Link
          to={possibilities.link.to}
          className="link-underline t-label focus-ring inline-block text-fog"
        >
          {possibilities.link.label}
        </Link>
      </div>
    </section>
  )
}

/* ================================================================== */

export default function Possibilities() {
  /* Re-evaluated on change, not read once: these gates are a width, a
     height and a preference, and a reader who turns a tablet gets the
     layout that fits the screen they are actually holding. */
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'run'
    if (prefersReducedMotion()) return 'run'
    return window.matchMedia(ORBIT_GATE).matches ? 'orbit' : 'stack'
  })

  useEffect(() => {
    const orbit = window.matchMedia(ORBIT_GATE)
    const motion = window.matchMedia(MOTION_GATE)
    const read = () => setMode(!motion.matches ? 'run' : orbit.matches ? 'orbit' : 'stack')
    orbit.addEventListener('change', read)
    motion.addEventListener('change', read)
    read()
    return () => {
      orbit.removeEventListener('change', read)
      motion.removeEventListener('change', read)
    }
  }, [])

  if (mode === 'orbit') return <Orbit />
  if (mode === 'stack') return <Stack />
  return <Run />
}
