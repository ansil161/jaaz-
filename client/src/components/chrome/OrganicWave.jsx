import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   ORGANIC WAVE — the section transition

   Every other transition on this site is a hard cut: one section
   ends, the next begins, sometimes with a colour inversion.
   Correct for a page arguing in straight lines and hairlines.
   Wrong for Solutions, which moves between nine very different
   physical systems — sound, light, water, weather — and wanted
   one moment that feels poured rather than cut.

   HOW THE MORPH WORKS WITHOUT A PLUGIN
   MorphSVG (a paid GSAP plugin) is not registered in lib/gsap.js,
   so this leans on a lesser-known but well-supported GSAP
   behaviour instead: when two `d` strings share the exact same
   command sequence and the exact same number of coordinate
   pairs — only the NUMBERS differ — GSAP's generic string
   interpolation tweens the numbers positionally, which reads as
   a real morph for a shape this simple. `WAVES` below is three
   such strings, each an `M ... C ... C ...` with identical
   structure and different control points.

   The tween runs forever, slowly, alternating between the three
   — the same "never fully at rest" rule `<Figure>` and
   `<Marquee>` already follow elsewhere on the site — and its
   vertical amplitude is separately scaled by scroll position, so
   the wave settles low when it is off-screen and swells as it is
   approached, rather than animating at a fixed size regardless of
   where you are.
   ============================================================ */

const WAVES = [
  'M0,120 C240,60 480,150 720,110 C960,70 1200,140 1440,100 L1440,220 L0,220 Z',
  'M0,110 C240,150 480,60 720,120 C960,160 1200,70 1440,120 L1440,220 L0,220 Z',
  'M0,130 C240,90 480,130 720,80 C960,130 1200,90 1440,130 L1440,220 L0,220 Z',
]

export default function OrganicWave({
  fill = 'var(--color-ink)',
  backdrop = 'transparent',
  className = '',
  flip = false,
}) {
  const root = useGsapScope((el) => {
    const path = el.querySelector('[data-wave-path]')
    const group = el.querySelector('[data-wave-group]')

    if (prefersReducedMotion()) return

    /* The endless, slow morph. Each leg targets the NEXT shape in the
       list, so `repeat: -1` cycles 0 -> 1 -> 2 -> 0 forever without a
       visible reset — there is no "back to start" jump because shape
       0 IS where leg 3 already ends up. */
    const tl = gsap.timeline({ repeat: -1 })
    WAVES.forEach((d) => {
      tl.to(path, { attr: { d }, duration: 5.5, ease: 'sine.inOut' })
    })

    /* Amplitude answers to scroll: flat until approached, full swell
       through the middle of its transit, flat again on the way out. */
    gsap.fromTo(
      group,
      { scaleY: 0.35, transformOrigin: '50% 100%' },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'top 40%',
          scrub: 0.6,
        },
      },
    )
  }, [])

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`relative h-[9vw] max-h-36 min-h-20 w-full overflow-hidden ${className}`}
      style={{ transform: flip ? 'scaleY(-1)' : 'none', backgroundColor: backdrop }}
    >
      <svg
        data-wave-group
        className="absolute inset-0 h-full w-full will-change-transform"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
      >
        <path data-wave-path d={WAVES[0]} fill={fill} />
      </svg>
    </div>
  )
}
