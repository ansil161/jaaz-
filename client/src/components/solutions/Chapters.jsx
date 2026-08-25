import { solutions } from '../../data/solutions'
import Chapter from './Chapter'
import { useGsapScope, gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   SOLUTIONS — THE SEQUENCE

   Nine chapters, in catalogue order, each built by <Chapter>.
   This wrapper owns exactly one thing the chapters cannot own
   individually: the velocity blur.

   WHY IT LIVES HERE AND NOT IN EACH CHAPTER
   Nine ScrollTriggers all asking `getVelocity()` on the same
   scroll would do the same arithmetic nine times a frame and
   then fight over the same result. One trigger writes one custom
   property on this element, `.plate` reads it through `var()`,
   and every photograph inside inherits the value for free — see
   the note on `--plate-blur` in index.css.

   THE DEAD ZONE IS THE POINT
   Below roughly a brisk flick, the blur stays at zero. A blur
   that responds to ordinary reading scroll is a smear, not a
   camera; this should only ever appear when someone throws the
   page, and it should be gone again within half a second of them
   stopping. Ceiling is 2px. Desktop only, because a phone's
   compositor has better things to do and the effect is invisible
   at that size anyway.
   ============================================================ */

/* px/sec of scroll before any blur appears at all. */
const FLICK = 1400
/* px/sec above the dead zone that reaches the ceiling. */
const RANGE = 2600
const CEILING = 2

export default function Chapters() {
  const root = useGsapScope((el) => {
    if (prefersReducedMotion()) return

    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      const state = { blur: 0 }
      const write = () => el.style.setProperty('--plate-blur', `${state.blur.toFixed(2)}px`)

      /* quickTo rather than a fresh tween per frame: one reusable tween
         whose target value is overwritten, which is the difference
         between a smooth decay and a queue of competing animations. */
      const blurTo = gsap.quickTo(state, 'blur', {
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: write,
      })

      const trigger = ScrollTrigger.create({
        onUpdate: (self) => {
          const raw = self.getVelocity()
          /* `getVelocity()` can hand back a non-finite value around
             programmatic jumps, and NaN in a filter silently blanks the
             image rather than throwing. */
          const v = Number.isFinite(raw) ? Math.abs(raw) : 0
          blurTo(gsap.utils.clamp(0, CEILING, ((v - FLICK) / RANGE) * CEILING))
        },
      })

      return () => {
        trigger.kill()
        el.style.removeProperty('--plate-blur')
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="relative bg-ink">
      {solutions.map((s, i) => (
        <Chapter key={s.slug} solution={s} index={i} />
      ))}
    </div>
  )
}
