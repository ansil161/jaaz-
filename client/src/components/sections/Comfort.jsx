import { useCallback, useEffect, useRef, useState } from 'react'
import { comfort } from '../../data/site'
import MaterialBar from './comfort/MaterialBar'
import { Link } from '../chrome/PageTransition'
import { Lines, Figure, Rule } from '../ui/Motion'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   THE JAZ COMFORT SYSTEM — a sticky editorial diptych.

   WHAT THIS REPLACED, AND WHY
   The previous build pinned this section for 560% of viewport
   height and staged ONE photograph annotated three times, under
   a control pill, a telemetry strip, hover tooltips and a canvas
   waveform. Two things were wrong with it. The picture never
   changed while the claim did, so each pillar had to be taken on
   trust. And a page selling COMFORT asked for five and a half
   screenfuls of held scroll to say three things — the interface
   behaving like the opposite of the product.

   WHAT IT IS NOW
   A spread. The argument holds still on the left while the
   evidence moves past it on the right:

     · LEFT, sticky and vertically centred — the pillar currently
       in view, set large in the display face, with its body line
       and its three specifications. It EXCHANGES rather than
       animating in: the outgoing block leaves under a blur as the
       incoming one arrives. That exchange is the section's one
       authored moment; everything else is quiet.

     · RIGHT, scrolling — three real photographs, one per pillar,
       each of a room where that pillar is the thing you actually
       see. They sit desaturated and under-exposed until they take
       the reading line, then resolve to full colour, so colour
       lands with focus. Photography is the only colour on this
       site; spending it on the active plate is what makes the
       swap legible without a single piece of HUD chrome.

     · A hairline index at the foot of the sticky column doubles
       as the position read-out and as navigation — three numbered
       rows, ruled through as you pass them.

   The scroll cost is three screens instead of five and a half,
   and the reader can leave at any point with the argument intact.

   Below the diptych breakpoint it is a plain stack: plate, title,
   body, specifications, three times over. No sticky, no scroll
   driver, nothing to wait for. The material bar is content rather
   than chrome, so it ships in both branches.
   ============================================================ */

/* One breakpoint, shared by the React branch and the ScrollTrigger
   setup. They must agree: React decides which tree exists, GSAP reads
   the plates out of that tree, and a mismatch observes nothing. */
const WIDE = '(min-width: 1024px)'

/* The shared column grid. The masthead, the diptych and the close all
   sit on it, which is what makes three separately-composed bands read
   as one spread rather than three stacked sections. */
const COLS = 'lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-x-14 xl:gap-x-20'
const COL_2 = 'lg:pl-14 xl:pl-20'

export default function Comfort() {
  const [active, setActive] = useState(0)
  const [isWide, setIsWide] = useState(true)
  const [reduced] = useState(() => prefersReducedMotion())
  const lastActive = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const sync = () => setIsWide(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /* The reading line sits at 52% of the viewport, not at 50%. The
     sticky column is centred, and a plate whose own edge has only just
     crossed the middle has not yet visually taken over from the one
     leaving. Two percent of viewport is the difference between the
     exchange feeling early and feeling met. */
  const root = useGsapScope(
    (el) => {
      if (reduced) return
      const mm = gsap.matchMedia()

      mm.add(WIDE, () => {
        const plates = gsap.utils.toArray(el.querySelectorAll('[data-comfort-plate]'))
        if (!plates.length) return

        plates.forEach((plate, i) => {
          ScrollTrigger.create({
            trigger: plate,
            start: 'top 52%',
            end: 'bottom 52%',
            invalidateOnRefresh: true,
            onToggle: (self) => {
              /* Guard the setState: onToggle fires on both edges, and a
                 render per scroll tick for a value that changes three
                 times in the whole section is not free. */
              if (self.isActive && lastActive.current !== i) {
                lastActive.current = i
                setActive(i)
              }
            },
          })
        })
      })

      return () => mm.revert()
    },
    [reduced],
  )

  /* The index rows scroll their own plate to the reading line. Lenis
     owns the scroll when it is running, so ask it rather than the
     window — a native smooth scroll fights it and lands short. */
  const goToPillar = useCallback((index) => {
    const plate = document.querySelector(`[data-comfort-plate="${index}"]`)
    if (!plate) return
    if (window.__lenis) window.__lenis.scrollTo(plate, { duration: 1.1, offset: 1 })
    else plate.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /* ---------- Below the breakpoint: a plain stack ---------- */
  if (!isWide || reduced) {
    return (
      <section id="comfort" className="relative border-t border-white/10 bg-ink py-24 sm:py-28">
        <div className="shell-wide">
          <Masthead />

          <div className="mt-16 space-y-24">
            {comfort.layers.map((layer, i) => (
              <article key={layer.n}>
                <Figure
                  src={layer.plate}
                  alt={layer.plateAlt}
                  className="aspect-[4/3] w-full"
                  imgClassName="[--plate-contrast:1.04]"
                />
                <Caption layer={layer} />
                <h3 className="t-heading mt-7 text-pure">{layer.title}</h3>
                <p className="t-sub mt-4 max-w-md text-fog">{layer.body}</p>
                <SpecList points={layer.points} className="mt-8" />
                {i === 2 && <MaterialBar />}
              </article>
            ))}
          </div>

          <Close className="mt-24" />
        </div>
      </section>
    )
  }

  /* ---------- The diptych ---------- */
  return (
    <section
      ref={root}
      id="comfort"
      className="relative border-t border-white/10 bg-ink py-28 xl:py-36"
    >
      <div className="shell-wide">
        <Masthead />

        <div className={`mt-20 grid ${COLS}`}>
          {/* --- The argument, held still ---
              Height-aware padding, not a fixed step. This column has to
              hold a display title, a sentence, three specifications and
              the index inside ONE viewport, and a 1366x768 laptop gives
              it about 540px to do that in. A `py-24` that reads as
              generous at 900px tall clips the title off the top at 540. */}
          <div className="sticky top-0 flex h-svh flex-col justify-center py-[clamp(2rem,6svh,5rem)]">
            {/* One grid cell, three panels stacked into it: the column
                never changes height mid-exchange, so nothing below the
                copy shifts as the pillar swaps. */}
            <div className="grid">
              {comfort.layers.map((layer, i) => (
                <PillarCopy key={layer.n} layer={layer} on={active === i} />
              ))}
            </div>

            <Index active={active} onSelect={goToPillar} className="mt-[clamp(1.75rem,4svh,3.5rem)]" />
          </div>

          {/* --- The evidence, moving past it --- */}
          <div className={`border-l border-white/10 ${COL_2}`}>
            {comfort.layers.map((layer, i) => (
              <div
                key={layer.n}
                data-comfort-plate={i}
                className="flex min-h-svh flex-col justify-center py-16"
              >
                <Figure
                  src={layer.plate}
                  alt={layer.plateAlt}
                  className="h-[clamp(24rem,58svh,40rem)] w-full ring-1 ring-white/10 ring-inset"
                  imgStyle={{
                    /* `.plate` composes its filter out of these custom
                       properties, so changing them changes `filter` —
                       and `filter` is what actually transitions.

                       DESATURATE, DO NOT DIM. Every photograph in this
                       set is a dark room; crushing the exposure of an
                       out-of-focus plate takes it to solid black and the
                       column reads as three empty frames. Pulling the
                       colour out carries "not this one" on its own, and
                       the active plate answers it by gaining colour and
                       a little contrast rather than by being the only
                       one that is lit. */
                    '--plate-grayscale': active === i ? 0 : 0.9,
                    '--plate-brightness': active === i ? 1.06 : 0.95,
                    '--plate-contrast': active === i ? 1.06 : 0.98,
                    transition: 'filter 1.1s var(--ease-out-expo)',
                  }}
                />
                <Caption layer={layer} dim={active !== i} />
                {i === 2 && <MaterialBar />}
              </div>
            ))}
          </div>
        </div>

        <Close className="mt-10" />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   The masthead. The section's own name lives in the sticky index
   below rather than as a line floating above the heading, where
   it would be an eyebrow — down there it earns its place as a
   persistent wayfinder instead. So this band is the heading and
   the paragraph it answers to, set across the same two columns
   the diptych then uses: that is what establishes the grid
   before anything relies on it.
   ------------------------------------------------------------ */
function Masthead() {
  return (
    <header>
      <div className={`grid gap-y-8 ${COLS}`}>
        <Lines as="h2" className="t-display text-bone">
          {comfort.heading.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </Lines>
        <Lines as="p" className={`t-sub max-w-lg self-end text-mist ${COL_2}`}>
          {comfort.intro}
        </Lines>
      </div>
      <Rule className="mt-14 text-pure" />
    </header>
  )
}

/* One pillar's copy. The title is set a word per line in the display
   face — two short words at display scale is the whole reason the
   sticky column can hold type this large without crowding the specs
   beneath it. Off panels are hidden from assistive tech and taken out
   of the tab order rather than merely faded. */
function PillarCopy({ layer, on }) {
  return (
    <article
      aria-hidden={!on}
      inert={!on || undefined}
      className="[grid-area:1/1]"
      style={{
        opacity: on ? 1 : 0,
        transform: on ? 'translateY(0)' : 'translateY(26px)',
        filter: on ? 'blur(0px)' : 'blur(7px)',
        transition:
          'opacity .6s var(--ease-out-expo), transform .9s var(--ease-out-expo), filter .7s var(--ease-out-expo)',
        pointerEvents: on ? 'auto' : 'none',
      }}
    >
      {/* `t-chapter`, not `t-display`. This heading shares one viewport
          with a sentence, three specifications and the index, so its
          size has to be bounded by HEIGHT as well as width — which is
          exactly the step `t-chapter` exists for, and the same reason
          <EverySeat> uses it. `t-display` is sized off width alone and
          runs this column off the top of a 540px-tall laptop. */}
      <h3 className="t-chapter text-pure">
        {layer.title.split(' ').map((word) => (
          <span key={word} className="block">
            {word}
          </span>
        ))}
      </h3>
      <p className="t-sub mt-6 max-w-sm text-fog">{layer.body}</p>
      <SpecList points={layer.points} className="mt-7 max-w-sm" />
    </article>
  )
}

/* The specifications. Hairline-separated rows rather than bulleted
   text: these measurements ARE the substance of the sentence above
   them, so they get the weight of a table, not of a list. */
function SpecList({ points, className = '' }) {
  return (
    <ul className={`divide-y divide-white/10 border-y border-white/10 ${className}`}>
      {points.map((point) => (
        <li key={point} className="t-body py-2.5 text-mist">
          {point}
        </li>
      ))}
    </ul>
  )
}

/* The plate caption. Mono here is measurement, not costume — every
   value in it is one already named in the specifications beside it. */
function Caption({ layer, dim = false }) {
  return (
    <div
      className="mt-5 flex items-baseline justify-between gap-6 transition-opacity duration-700"
      style={{ opacity: dim ? 0.45 : 1 }}
    >
      <span className="t-label text-fog">{layer.title}</span>
      <span className="t-num text-xs text-mist">{layer.caption}</span>
    </div>
  )
}

/* The index. Position read-out and navigation in one: the rule fills
   across the pillars you have passed, the numeral states which of three
   you are in, and the row scrolls its own plate to the reading line.

   Three abreast rather than stacked. A stacked list of full titles cost
   about a hundred and ten pixels more than this column has to spare on
   a 1366x768 laptop — and read as a menu bolted under the copy, where
   three short rules read as one measure being filled.

   This is also where the section's name is carried. Kept out of the
   masthead deliberately: above the heading it would be an eyebrow, and
   down here it earns its place by labelling something — a <nav> the
   reader actually uses, present for the whole length of the section. */
function Index({ active, onSelect, className = '' }) {
  return (
    <nav aria-label={comfort.label} className={className}>
      <span className="t-label text-ash">{comfort.label}</span>
      <ul className="mt-4 grid grid-cols-3 gap-x-3">
        {comfort.layers.map((layer, i) => {
          const on = active === i
          return (
            <li key={layer.n}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={on ? 'true' : undefined}
                className="focus-ring group block w-full pt-3 text-left"
              >
                <span className="block h-px w-full bg-white/15" aria-hidden="true">
                  <span
                    className="block h-px origin-left bg-pure transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ transform: `scaleX(${active >= i ? 1 : 0})` }}
                  />
                </span>
                <span className="mt-3 flex items-baseline gap-2.5">
                  <span
                    className="t-num text-[0.7rem] transition-colors duration-700"
                    style={{ color: on ? '#ffffff' : '#8a8a91' }}
                  >
                    {layer.n}
                  </span>
                  <span
                    className="t-label transition-colors duration-700 group-hover:text-pure"
                    style={{ color: on ? '#ffffff' : '#b8b8bd' }}
                  >
                    {layer.title.split(' ')[0]}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* The close. The three pillars named once as a single sentence, and
   the only ask this section makes. */
function Close({ className = '' }) {
  return (
    <div className={`border-t border-white/10 pt-14 ${className}`}>
      <div className={`grid gap-y-8 ${COLS}`}>
        <Lines as="p" className="t-heading text-pure">
          {comfort.summary.lede}
        </Lines>
        <div className={COL_2}>
          <Lines as="p" className="t-sub max-w-md text-fog">
            {comfort.summary.body}
          </Lines>
          <Link to="/contact" className="btn focus-ring mt-9 text-pure">
            {comfort.summary.cta}
            <span className="btn-arrow" aria-hidden="true">
              &#8594;
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
