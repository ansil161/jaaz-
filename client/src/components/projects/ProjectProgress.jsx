import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   PROJECT PROGRESS — where you are in the collection.

   A margin mark, not a UI control. It answers one question the
   visitor genuinely has on a page six full-height chapters long
   — "how much more of this is there" — and it answers it in the
   two places a printed monograph would: the current folio, and a
   rule showing how far down the spine you are.

   ONE TRIGGER PER CHAPTER, NOT ONE PER FRAME.
   Six standalone ScrollTriggers with no animation attached,
   each doing nothing but flipping a number. That is the cheap
   way to do this and the reason it stays cheap when the
   collection is twenty projects rather than six. The alternative
   — an `onUpdate` on the page reading positions every frame —
   costs a layout read per frame to compute something that
   changes six times in total.

   The rule between the numbers is scaled directly by a scrub
   rather than by React state, because a number that re-renders
   sixty times a second is a number that re-renders the whole
   subtree sixty times a second.

   It hides itself outside the index. Over the hero it would be
   reporting on a section that has not started; past the last
   chapter it would be reporting on one that has finished.
   ============================================================ */

export default function ProjectProgress({ scopeRef, total, resetKey }) {
  const [active, setActive] = useState(1)
  const shell = useRef(null)
  const fill = useRef(null)

  /* `resetKey` is the filter selection. The chapters are remounted when
     it changes, so every trigger below is holding a dead element and has
     to be rebuilt against the new list — and the count itself changes,
     which is most of what makes the filter feel like it did something. */
  useLayoutEffect(() => {
    const scope = scopeRef.current
    const bar = shell.current
    if (!scope || !bar) return

    const ctx = gsap.context(() => {
      const chapters = gsap.utils.toArray(scope.querySelectorAll('[data-chapter]'))
      if (!chapters.length) return

      setActive(1)

      chapters.forEach((chapter, i) => {
        ScrollTrigger.create({
          trigger: chapter,
          /* Halfway up the viewport: the chapter you are LOOKING at,
             not the one whose first pixel has appeared at the bottom. */
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setActive(i + 1),
          onEnterBack: () => setActive(i + 1),
        })
      })

      /* Visible only while the collection is. */
      gsap.set(bar, { autoAlpha: 0 })
      ScrollTrigger.create({
        trigger: scope,
        start: 'top 60%',
        end: 'bottom 85%',
        onToggle: (self) =>
          gsap.to(bar, {
            autoAlpha: self.isActive ? 1 : 0,
            duration: 0.5,
            ease: 'jaz',
            overwrite: true,
          }),
      })

      if (fill.current && !prefersReducedMotion()) {
        gsap.fromTo(
          fill.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            transformOrigin: 'left',
            scrollTrigger: {
              trigger: scope,
              start: 'top center',
              end: 'bottom bottom',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        )
      }
    }, scope)

    return () => ctx.revert()
  }, [scopeRef, resetKey, total])

  /* Announce the change once it has settled rather than on every
     chapter boundary crossed during a fast flick. */
  const [announced, setAnnounced] = useState(1)
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(active), 400)
    return () => clearTimeout(t)
  }, [active])

  const pad = (v) => String(v).padStart(2, '0')

  return (
    <>
      {/* BOTTOM RIGHT, and that corner is a decision rather than a
          default. The left margin is where a monograph would put a
          folio, but this layout has no left margin to put it in: the
          content shell runs to the gutter at every width below 1728px,
          so a fixed mark there sits ON the filter row, the running head
          and the chapter titles rather than beside them. Bottom-left is
          worse still — it is exactly where every chapter's title block
          lands. Bottom-right is the one corner nothing else occupies at
          any breakpoint: the numeral is top-right, the title is
          bottom-left, and the nav owns the top. */}
      <div
        ref={shell}
        aria-hidden="true"
        className="pointer-events-none fixed right-[var(--gutter)] bottom-[max(var(--gutter),1.5rem)] z-40 flex items-center gap-3 select-none"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <span className="font-display text-lg leading-none text-bone tabular-nums sm:text-xl">
          {pad(active)}
        </span>
        <span className="relative block h-px w-10 overflow-hidden bg-white/20 sm:w-14">
          <span ref={fill} className="absolute inset-0 block origin-left bg-cove" />
        </span>
        <span className="t-num text-[0.6875rem] text-mist">{pad(total)}</span>
      </div>

      {/* The same information, once it has settled, for anyone who is
          not looking at the margin. */}
      <p className="sr-only" aria-live="polite">
        Project {announced} of {total}
      </p>
    </>
  )
}
