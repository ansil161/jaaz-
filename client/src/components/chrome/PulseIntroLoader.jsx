import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap'

/* ============================================================
   PULSE INTRO LOADER

   The first-load sequence. An ECG line draws itself, sparks at
   the peak, four letters arrive around it on a compass, collapse
   into the wordmark, and the whole overlay lifts off the site.

   ORANGE IS FOR THE PULSE, NEVER FOR A LETTER.
   `#ff7a2e` appears on exactly two things: the ECG stroke and
   the spark at its peak. Every letter — the four compass letters
   AND all four characters of the wordmark, both `A`s included —
   is `--bone`. This is a constraint, not an oversight: the mark
   reads as one word in one colour with a living line behind it,
   and accenting a character would turn it into a logo with a
   highlight. Do not "improve" it by tinting a letter.

   IT REPLACES <Preloader>, SO IT INHERITS ITS CONTRACT.
   The old shutter did four things on the way out that the rest
   of the site depends on, and none of them are optional:
     - unlocks `documentElement.overflow`, which it locked on mount
     - sets `window.__jazReady`
     - dispatches `jaz:ready`  (the nav holds its entrance for this)
     - refreshes ScrollTrigger (the hero pinned against a locked,
       scroll-height-less page and has to remeasure)
   `finish()` below does all four before it calls `onComplete`.

   THE SITE CONTENT IS HIDDEN BY THIS COMPONENT, NOT BY A CLASS.
   Do not also put `opacity-0` on the content element. The final
   step clears the inline properties so the end state comes from
   the stylesheet — if a class were holding it at zero, clearing
   would put it straight back to invisible.
   ============================================================ */

/* useGSAP is registered like a plugin so a build that tree-shakes
   aggressively cannot drop it. */
gsap.registerPlugin(useGSAP)

/* A real trace: baseline, P-wave, the tall R spike, the S trough,
   back to baseline. The spark sits on the spike at (41, 6). */
const ECG = 'M0 30 H28 l4 -6 l4 12 l5 -30 l6 46 l5 -22 h48'
const PEAK = { x: 41, y: 6 }

/* Top, right, bottom, left. The stagger runs in this order, so the
   letters arrive clockwise from the top. */
const COMPASS = [
  { char: 'J', at: 'left-1/2 top-0 -translate-x-1/2' },
  { char: 'A', at: 'right-0 top-1/2 -translate-y-1/2' },
  { char: 'A', at: 'left-1/2 bottom-0 -translate-x-1/2' },
  { char: 'Z', at: 'left-0 top-1/2 -translate-y-1/2' },
]

export default function PulseIntroLoader({ onComplete, contentSelector = '#main' }) {
  const root = useRef(null)
  const trace = useRef(null)

  useGSAP(
    () => {
      const path = trace.current

      /* `document.querySelector`, NOT a selector string.
         useGSAP scopes every selector string it is handed to `scope`,
         so `'#main'` would be looked up INSIDE this overlay — where it
         is not. Nothing throws; the tween is simply built against
         nothing and the site never fades in. */
      const content = document.querySelector(contentSelector)

      /* Nothing should move under the overlay while it is up. */
      document.documentElement.style.overflow = 'hidden'

      const finish = () => {
        document.documentElement.style.overflow = ''

        /* Handed back to the stylesheet. useGSAP reverts everything it
           created when this component unmounts, and the parent is
           expected to unmount it from `onComplete` — so the reveal has
           to survive that revert rather than depend on an inline style
           the revert is about to remove. */
        if (content) gsap.set(content, { clearProps: 'opacity,visibility,transform' })

        window.__jazReady = true
        window.dispatchEvent(new Event('jaz:ready'))
        /* The hero pinned against a page that had no scroll height. */
        requestAnimationFrame(() => ScrollTrigger.refresh())

        onComplete?.()
      }

      /* From-states are set here rather than as Tailwind classes so
         there is one place that knows what "before" looks like. */
      const length = path.getTotalLength()
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
      gsap.set('[data-spark]', { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' })
      gsap.set('[data-letter]', { scale: 0.7, autoAlpha: 0 })
      gsap.set('[data-wordmark]', { autoAlpha: 0, y: 18 })
      if (content) gsap.set(content, { autoAlpha: 0, y: 26 })

      /* Reduced motion gets the destination, not a slower journey. */
      if (prefersReducedMotion()) {
        gsap.set(root.current, { autoAlpha: 0, pointerEvents: 'none' })
        finish()
        return
      }

      const tl = gsap.timeline({ onComplete: finish })

      /* 1 — the line draws itself. */
      tl.to(path, { strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut' })

        /* 2 — the spark, timed to land as the stroke crosses the peak.
             The spike sits about 40% along the path's LENGTH, not 41%
             along its width, which is why this is an absolute position
             rather than a relative one. */
        .to('[data-spark]', { scale: 1, autoAlpha: 1, duration: 0.42, ease: 'back.out(3)' }, 0.58)

        /* 3 — the compass letters, clockwise from the top. */
        .to(
          '[data-letter]',
          { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(2)' },
          '>-0.12',
        )

        /* 4 — hold, so it is readable rather than merely seen. */
        .to({}, { duration: 0.35 })

        /* 5 — the four collapse into the one. */
        .to('[data-letter]', { autoAlpha: 0, scale: 0.86, duration: 0.4, ease: 'power2.in' })
        .to('[data-wordmark]', { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '<0.12')

        /* 6 — hold on the wordmark. */
        .to({}, { duration: 0.5 })

        /* 7 — the overlay lifts. `pointerEvents` goes with it, so a
             parent that forgets to unmount cannot leave an invisible
             sheet over the whole site. */
        .to(root.current, {
          autoAlpha: 0,
          pointerEvents: 'none',
          duration: 0.5,
          ease: 'power2.inOut',
        })

      /* 8 — and the site arrives underneath, overlapping the fade so
           the two read as one movement. */
      if (content) {
        tl.to(content, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '<0.2')
      }
    },
    { scope: root, dependencies: [] },
  )

  return (
    <div
      ref={root}
      aria-hidden="true"
      /* z-[70], not the z-50 an overlay would normally take: <Nav> on
         this site is `fixed top-0 z-50` and is rendered AFTER this in
         App, so at an equal z-index the bar paints straight over the
         intro. 70 is the stacking level the shutter this replaced used,
         for the same reason. */
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#07080a]"
    >
      {/* The compass stage. Square, so top/right/bottom/left put the
          four letters at equal distances from the centre. */}
      <div className="relative flex size-[clamp(13rem,44vw,19rem)] items-center justify-center">
        <svg
          viewBox="0 0 100 60"
          fill="none"
          role="presentation"
          className="w-[clamp(8rem,27vw,12rem)] overflow-visible drop-shadow-[0_0_14px_rgba(255,122,46,0.55)]"
        >
          <path
            ref={trace}
            d={ECG}
            stroke="#ff7a2e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            data-spark
            cx={PEAK.x}
            cy={PEAK.y}
            r="3.4"
            fill="#ff7a2e"
            className="drop-shadow-[0_0_10px_rgba(255,122,46,0.95)]"
          />
        </svg>

        {/* The Tailwind centring translate lives on the WRAPPER and the
            animation runs on the child. GSAP writes `transform`, so a
            scale tween on the same element that carries
            `-translate-x-1/2` overwrites the centring and the letter
            jumps half its width on the first frame. */}
        {COMPASS.map((letter, i) => (
          <span key={`${letter.char}-${i}`} className={`absolute ${letter.at}`}>
            <span
              data-letter
              /* `text-indent` matched to the tracking. Letter-spacing
                 adds its space AFTER the glyph, so a single tracked
                 character sits half a track left of its own box; the
                 indent puts the same space back on the left. */
              className="block font-mono text-[clamp(0.95rem,3.2vw,1.35rem)] font-medium tracking-[0.3em] text-bone [text-indent:0.3em]"
            >
              {letter.char}
            </span>
          </span>
        ))}
      </div>

      {/* The wordmark, below the icon. Neutral — both `A`s included. */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 mt-[clamp(7rem,23vw,10rem)] flex justify-center">
        <span
          data-wordmark
          className="block font-mono text-[clamp(1.5rem,6vw,2.6rem)] font-bold tracking-[0.42em] text-bone [text-indent:0.42em]"
        >
          JAAZ
        </span>
      </div>
    </div>
  )
}
