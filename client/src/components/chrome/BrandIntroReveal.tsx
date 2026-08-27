import { useId, useRef } from 'react'
import type { CSSProperties, MouseEventHandler } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

/* ============================================================
   BRAND INTRO REVEAL

   The first-load sequence. Fragments of the wordmark flicker in
   like a signal finding itself, the letters draw themselves in
   glowing outline, fill solid, catch a raking light, hold, and the
   whole overlay lifts off the site.

   THE MARK SITS ON BLACK AND NOTHING ELSE. An earlier cut faded a
   hero photograph in behind the wordmark for the last beat. It was
   removed on purpose: the reveal reads as a mark, not as a slide
   with a picture on it, and the homepage's own opening is the
   thing that should introduce the room.

   NO PAID GSAP PLUGINS. The stroke draw is the DrawSVG technique
   done by hand: measure each path with getTotalLength(), set
   strokeDasharray and strokeDashoffset to that length, then walk
   the offset back to zero. One tween per letter drives both the
   offset and a leading-edge spark placed with getPointAtLength()
   — which is what makes the light read as brightest where the
   line is actually being written, rather than as an even halo
   around a shape that is already finished.

   COLOUR IS TWO CUSTOM PROPERTIES, NOT LITERALS.
   `--brand-glow` (stroke, spark, halo) and `--brand-accent` (the
   solid letterform). Both are set on the overlay root from props
   and both fall back to a stylesheet value, so this is a one-line
   swap between the blue-neon reference and the site's own gold:

     <BrandIntroReveal glowColor="var(--color-cove)"
                       accentColor="var(--color-bone)" />
   ============================================================ */

/* useGSAP is registered like a plugin so an aggressive tree-shake
   cannot drop it. */
gsap.registerPlugin(useGSAP)

/* ------------------------------------------------------------
   THE WORDMARK

   Closed outlines, not skeletons. The same `d` is used twice —
   once stroked with no fill for the draw, once filled with no
   stroke for the solid state — and a single-stroke skeleton would
   fill as a mess. Drawn on a 100-unit cap height with the
   baseline at y=100 and an 18-unit stem, so the letters share a
   weight.

   `A` carries its counter as a second subpath and is filled
   even-odd, which is what punches the triangle out. It also means
   getTotalLength() spans both contours, so the outer shape draws
   and the counter closes after it — deliberate, and the reason
   that letter reads as assembling rather than appearing.
   ------------------------------------------------------------ */
type Glyph = { d: string; width: number }

const GLYPHS: Record<string, Glyph> = {
  J: {
    d: 'M50 0 H68 V70 C68 89 54 100 34 100 C14 100 0 89 0 70 V60 H18 V70 C18 80 24 86 34 86 C44 86 50 80 50 70 Z',
    width: 68,
  },
  A: {
    d: 'M41 0 H59 L100 100 H80 L71 76 H29 L20 100 H0 Z M50 26 L36 62 H64 Z',
    width: 100,
  },
  Z: {
    d: 'M0 0 H96 V16 L26 84 H96 V100 H0 V84 L70 16 H0 Z',
    width: 96,
  },
}

const CAP_HEIGHT = 100
const TRACKING = 22
/* Room for the stroke, the spark and the halo. The SVG is
   overflow-visible as well, because a drop-shadow filter is
   otherwise clipped by the viewport, and a glow cropped square is
   worse than no glow. */
const PAD = 18
const FRAGMENTS_PER_LETTER = 4
/* How far past each end of the wordmark the highlight starts and
   finishes. Enough to clear the skewed bar's own width and nothing
   more — travel wider than this is time the sweep spends off the
   letters, which is time the 0.6s is not being spent on the only
   part of it anyone sees. */
const SWEEP_MARGIN = 140
/* The longest the sequence will wait for a hidden document to become
   visible before playing anyway. See the hold below. */
const MAX_HIDDEN_HOLD = 5000
/* How many pieces each letter's outline breaks into while it draws.
   The contour is one closed path, so tracing it end to end reads as a
   pen going round a shape. Splitting the dash pattern into this many
   windows and growing every one of them from its own centre at the
   same time reads as the letter ASSEMBLING out of separate edges,
   which is what the reference actually does. */
const SEGMENTS = 7

type PlacedGlyph = Glyph & { char: string; x: number; key: string }

function layout(word: string): { glyphs: PlacedGlyph[]; width: number } {
  const glyphs: PlacedGlyph[] = []
  let x = 0

  for (const char of word.toUpperCase()) {
    const glyph = GLYPHS[char]
    /* An unmapped character advances and draws nothing rather than
       throwing — the wordmark is a prop, and a typo should cost a
       gap, not the whole first load. */
    if (!glyph) {
      x += 40 + TRACKING
      continue
    }
    glyphs.push({ ...glyph, char, x, key: `${char}-${glyphs.length}` })
    x += glyph.width + TRACKING
  }

  return { glyphs, width: Math.max(0, x - TRACKING) }
}

/* Deterministic jitter. The fragments have to scatter, but they
   have to scatter the same way on every load — a reveal that
   reassembles differently on each refresh reads as a bug to
   anyone who sees it twice. */
function jitter(seed: number): number {
  const n = Math.sin(seed * 127.1) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

export interface BrandIntroRevealProps {
  /** Fired once, after the overlay has faded. The parent is expected to unmount this component here. */
  onComplete?: () => void
  /** The letters to draw. J, A and Z have glyphs; anything else advances as a space. */
  word?: string
  /** Stroke, spark and halo. Any CSS colour; written to `--brand-glow`. */
  glowColor?: string
  /** The solid letterform. Any CSS colour; written to `--brand-accent`. Leave it some headroom — see the default. */
  accentColor?: string
  /** Skip the sequence entirely and hand off on the next frame. */
  skip?: boolean
  /** Click anywhere to fast-forward. Defaults to true. */
  clickToSkip?: boolean
  className?: string
}

export default function BrandIntroReveal({
  onComplete,
  word = 'JAAZ',
  glowColor,
  accentColor,
  skip = false,
  clickToSkip = true,
  className = '',
}: BrandIntroRevealProps) {
  const root = useRef<HTMLDivElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  /* One instance, one set of ids. Two of these on a page would
     otherwise share a clipPath and a gradient, and the second one
     would silently win. React's ids carry colons, which are legal
     in markup but hostile inside url(#…), so they are stripped. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const clipId = `bir-clip-${uid}`
  const sweepId = `bir-sweep-${uid}`

  const { glyphs, width } = layout(word)
  const viewBox = `${-PAD} ${-PAD} ${width + PAD * 2} ${CAP_HEIGHT + PAD * 2}`

  useGSAP(
    () => {
      const scope = root.current
      if (!scope) return

      const outline = scope.querySelector<SVGGElement>('[data-outline]')
      const solid = scope.querySelector<SVGGElement>('[data-solid]')
      const sweep = scope.querySelector<SVGGElement>('[data-sweep]')
      const bloom = scope.querySelector<HTMLElement>('[data-bloom]')
      const letters = Array.from(scope.querySelectorAll<SVGPathElement>('[data-letter]'))
      const fragments = Array.from(scope.querySelectorAll<SVGPathElement>('[data-fragment]'))

      /* Nothing should move under the overlay while it is up.

         `.intro-locked` is a class rather than an inline
         `style.overflow`, because <Nav> writes that exact inline
         property from a passive effect on mount — and passive effects
         run after this layout effect, so an inline lock set here was
         being cleared a moment later and the page scrolled behind the
         overlay. The rule lives in index.css. */
      const html = document.documentElement
      html.classList.add('intro-locked')

      let handedOff = false
      const finish = () => {
        if (handedOff) return
        handedOff = true
        html.classList.remove('intro-locked')
        onComplete?.()
      }

      /* Assigned once the timeline exists; a no-op on the reduced-motion
         path, which never builds one. */
      let stopWatchingVisibility = () => {}

      const restore = () => {
        /* Unmounted mid-sequence — a route change, a fast refresh —
           still has to give the page its scrollbar back. */
        stopWatchingVisibility()
        html.classList.remove('intro-locked')
        timeline.current = null
      }

      /* ---------- fragments: short chords lifted off each letter ----------
         Sampled from the letter's own geometry rather than authored
         by hand, so they sit ON the shape they are pretending to be
         pieces of — and so they keep doing that if a glyph is ever
         redrawn. */
      fragments.forEach((fragment) => {
        const index = Number(fragment.dataset.fragment)
        const owner = letters[Number(fragment.dataset.owner)]
        if (!owner) return

        const total = owner.getTotalLength()
        const at = ((index + 0.5) / FRAGMENTS_PER_LETTER) * total
        const a = owner.getPointAtLength(at)
        const b = owner.getPointAtLength(Math.min(total, at + total * 0.07))
        fragment.setAttribute('d', `M${a.x} ${a.y} L${b.x} ${b.y}`)
      })

      /* ---------- the draw: a repeating dash window per segment ----------
         The classic DrawSVG trick sets dasharray and dashoffset to the
         whole length and walks the offset to zero, which draws the
         contour as one travelling line. Here the pattern repeats every
         `total / SEGMENTS` instead, so the path carries SEGMENTS dashes
         at once and each grows from its own centre. Same primitive, and
         still no plugin, but it assembles rather than traces. */
      const segments = letters.map((letter) => {
        const seg = letter.getTotalLength() / SEGMENTS
        gsap.set(letter, { strokeDasharray: `0 ${seg}`, strokeDashoffset: 0 })
        return seg
      })

      /* Reduced motion, or an explicit skip: the final revealed
         state, instantly.

         `finish()` is called straight out, NOT from a delayedCall.
         Every GSAP callback rides the ticker, and the ticker rides
         requestAnimationFrame — which a browser suspends entirely in
         a background tab. A visitor who opens the site in a tab they
         have not looked at yet would have got an overlay that never
         hands off and, worse, an `overflow: hidden` on <html> that is
         never lifted: a page that cannot scroll when they finally
         arrive. This runs inside a layout effect, so the parent
         unmounts before the browser paints and the overlay is never
         seen at all. */
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (skip || reducedMotion) {
        gsap.set(outline, { opacity: 0 })
        gsap.set(solid, { opacity: 1 })
        gsap.set(bloom, { opacity: 0 })
        gsap.set(scope, { autoAlpha: 0 })
        finish()
        return restore
      }

      gsap.set(fragments, { opacity: 0 })
      gsap.set(solid, { opacity: 0 })
      gsap.set(bloom, { opacity: 0, scale: 0.55 })
      gsap.set(sweep, { x: -SWEEP_MARGIN })
      /* The halo starts wide and soft and tightens as the line
         settles — a filter, not a second stroke, so it costs one
         composite instead of a duplicated shape. */
      gsap.set(outline, { '--glow-blur': '20px' })

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: finish,
      })
      timeline.current = tl

      /* HOLD WHILE NOBODY IS LOOKING.
         A browser suspends requestAnimationFrame in a background tab,
         and `useLenis` turns GSAP's lag smoothing OFF for the whole
         page — so the first tick after the visitor finally switches to
         the tab carries the entire elapsed time at once and the
         timeline lands on its last frame. Someone who opens the site
         in a background tab would come back to a reveal that had
         already happened without them. Pausing while hidden means the
         sequence starts when there is someone to see it.

         THE HOLD IS CAPPED, AND THAT MATTERS MORE THAN THE HOLD.
         An uncapped wait trusts `document.hidden` to ever go false,
         and some contexts never report a visible document — an
         automation profile, an embedded or permanently-occluded view.
         There the visitor would sit behind an opaque black overlay,
         on a page frozen by `.intro-locked`, forever. Missing the
         reveal is a disappointment; a site that never appears is a
         broken site, so the timer wins the tie. */
      let holdTimer = 0
      const release = () => {
        window.clearTimeout(holdTimer)
        holdTimer = 0
      }
      const hold = () => {
        tl.pause()
        release()
        holdTimer = window.setTimeout(() => tl.play(), MAX_HIDDEN_HOLD)
      }
      const onVisibility = () => {
        if (document.hidden) hold()
        else {
          release()
          tl.play()
        }
      }
      document.addEventListener('visibilitychange', onVisibility)
      stopWatchingVisibility = () => {
        release()
        document.removeEventListener('visibilitychange', onVisibility)
      }
      if (document.hidden) hold()

      /* 1 — the first light. Fragments of the letters surface and sink
         before anything is legible. Eased rather than snapped: a hard
         flicker is the one thing in this sequence that could not be
         called smooth. */
      tl.to(fragments, {
        keyframes: [
          { opacity: 0.85, duration: 0.34, ease: 'power2.out' },
          { opacity: 0, duration: 0.5, ease: 'power2.in' },
        ],
        stagger: { each: 0.08, from: 'random' },
      })

      /* 2 — the draw. Every dash grows from its own centre until the
         gaps close and the outline is continuous. Slow, and eased at
         both ends, because gliding is the whole point of this beat:
         three quarters of a second on `power1.inOut` was a sketch of
         the idea rather than the idea. */
      const DRAW = 2.1
      const STAGGER = 0.2
      const drawStart = 0.55

      letters.forEach((letter, i) => {
        const seg = segments[i]
        const progress = { value: 0 }

        tl.to(
          progress,
          {
            value: 1,
            duration: DRAW,
            ease: 'power2.inOut',
            onUpdate: () => {
              const dash = seg * progress.value
              letter.style.strokeDasharray = `${dash} ${seg - dash}`
              /* Half a dash of offset is what centres each window on
                 its own segment. Without it every window grows in the
                 same direction from a boundary and the mark builds
                 lopsided. */
              letter.style.strokeDashoffset = String(dash / 2)
            },
          },
          drawStart + i * STAGGER,
        )
      })

      const drawEnd = drawStart + DRAW + (letters.length - 1) * STAGGER

      tl.to(outline, { '--glow-blur': '8px', duration: DRAW, ease: 'power2.inOut' }, drawStart)

      /* The bloom. In the reference the light is a soft wash sitting
         behind the whole mark and swelling as it assembles, not a halo
         traced around each letter. It settles back once the letters go
         solid, so what is left is the mark rather than the glow. */
      tl.to(bloom, { opacity: 0.5, scale: 1, duration: DRAW + 0.5, ease: 'power2.out' }, drawStart)
      tl.to(bloom, { opacity: 0.28, duration: 1.2, ease: 'power2.inOut' }, drawEnd)

      /* 3 — cross-fade to the solid letterform, unhurried. */
      tl.to(outline, { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, drawEnd)
      tl.to(solid, { opacity: 1, duration: 1.0, ease: 'power2.inOut' }, drawEnd)

      /* 4 — the sweep. Clipped to the letters and blended screen, so
         it is light moving across the mark rather than a bar moving
         over the page. */
      tl.to(
        sweep,
        { x: width + SWEEP_MARGIN, duration: 1.3, ease: 'power2.inOut' },
        drawEnd + 0.55,
      )

      /* 5 — hold on the finished mark, alone on black. The sweep lands
         at drawEnd+1.85, so this is a real beat of stillness rather than
         the gap between two moves. */

      /* 6 — the overlay lifts off the site, and takes its time. */
      tl.to(bloom, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, drawEnd + 2.7)
      tl.to(scope, { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' }, drawEnd + 2.7)

      return restore
    },
    { scope: root, dependencies: [skip, word] },
  )

  /* Click anywhere to fast-forward. Ramping the timeline rather
     than seeking to the end keeps every callback firing in order,
     and the ramp still reads as a deliberate exit rather than a
     cut. */
  const handleSkip: MouseEventHandler<HTMLDivElement> = () => {
    if (!clickToSkip) return
    const tl = timeline.current
    if (!tl || tl.timeScale() > 1) return
    gsap.to(tl, { timeScale: 5, duration: 0.25, ease: 'power2.in' })
  }

  const tokens = {
    '--brand-glow': glowColor ?? 'var(--color-brand-glow, #5b8cff)',
    /* Deliberately NOT near-white. The sweep is screen-blended, so a
       letterform already at #fff has nothing left to brighten and the
       raking light lands invisible. This is bright enough to read as
       white against black and still leaves the highlight somewhere
       to go. */
    '--brand-accent': accentColor ?? 'var(--color-brand-accent, #c3d0f4)',
  } as CSSProperties

  return (
    <div
      ref={root}
      onClick={handleSkip}
      role="presentation"
      aria-hidden="true"
      style={tokens}
      className={`fixed inset-0 z-50 overflow-hidden bg-black ${
        clickToSkip ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="relative flex h-full w-full items-center justify-center px-[8vw]">
        {/* The wash of light behind the mark. Centred with auto margins
            rather than a translate, because GSAP owns this element's
            transform for the swell and a Tailwind `-translate-x-1/2`
            would be overwritten on the first frame. */}
        <div
          data-bloom
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 m-auto h-[42vmin] w-[86vmin] opacity-0"
          style={{
            background: 'radial-gradient(closest-side, var(--brand-glow), transparent 72%)',
          }}
        />

        <svg
          viewBox={viewBox}
          fill="none"
          className="w-[min(82vw,880px)] overflow-visible"
          aria-label={word}
        >
          <defs>
            {/* The sweep is clipped by the letters themselves. A <g>
                is not a legal clipPath child, so each path carries
                its own translate rather than inheriting one. */}
            <clipPath id={clipId}>
              {glyphs.map((glyph) => (
                <path key={glyph.key} d={glyph.d} transform={`translate(${glyph.x} 0)`} />
              ))}
            </clipPath>
            <linearGradient id={sweepId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="38%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="62%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* --- the outline and its fragments --- */}
          <g
            data-outline
            style={{
              filter:
                'drop-shadow(0 0 var(--glow-blur, 12px) var(--brand-glow)) drop-shadow(0 0 2px var(--brand-glow))',
            }}
          >
            {glyphs.map((glyph, i) => (
              <g key={glyph.key} transform={`translate(${glyph.x} 0)`}>
                {Array.from({ length: FRAGMENTS_PER_LETTER }, (_, k) => (
                  <path
                    key={k}
                    data-fragment={k}
                    data-owner={i}
                    stroke="var(--brand-glow)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0}
                    transform={`translate(${jitter(i * 7 + k) * 6} ${jitter(i * 13 + k) * 6})`}
                  />
                ))}
                <path
                  data-letter
                  d={glyph.d}
                  fillRule="evenodd"
                  stroke="var(--brand-glow)"
                  strokeWidth={1.7}
                  strokeLinejoin="round"
                />
              </g>
            ))}
          </g>

          {/* --- the solid state, stacked exactly on top --- */}
          <g
            data-solid
            opacity={0}
            style={{ filter: 'drop-shadow(0 0 22px var(--brand-glow))' }}
          >
            {glyphs.map((glyph) => (
              <path
                key={glyph.key}
                d={glyph.d}
                fillRule="evenodd"
                fill="var(--brand-accent)"
                transform={`translate(${glyph.x} 0)`}
              />
            ))}
          </g>

          {/* --- the raking light --- */}
          <g clipPath={`url(#${clipId})`} style={{ mixBlendMode: 'screen' }}>
            <g data-sweep>
              <rect
                x={-60}
                y={-60}
                width={120}
                height={CAP_HEIGHT + 120}
                fill={`url(#${sweepId})`}
                transform="skewX(-20)"
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )
}
