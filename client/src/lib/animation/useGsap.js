import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, prefersReducedMotion } from './gsap'

/**
 * Scoped GSAP context. Everything created inside `setup` is reverted on
 * unmount — tweens, ScrollTriggers, inline styles, SplitText DOM — so React
 * StrictMode's double-invoke and route changes can't leave orphans behind.
 *
 * `setup(scopeEl, ctx)` runs once the scope element exists.
 */
export function useGsapScope(setup, deps = []) {
  const scope = useRef(null)

  useLayoutEffect(() => {
    if (!scope.current) return
    const ctx = gsap.context((self) => setup(scope.current, self), scope)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}

/**
 * Split an element into masked lines and return the SplitText instance.
 * Re-splits on resize (line breaks change with width) and re-runs `onSplit`
 * so the animation is rebuilt against the new lines.
 */
export function splitLines(el, onSplit) {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit,
  })
}

/**
 * The site's default entrance: masked lines rise into place, staggered.
 * Used by every heading and paragraph so reading rhythm stays consistent.
 */
export function revealLines(el, { start = 'top 82%', stagger = 0.09, delay = 0, y = '105%' } = {}) {
  if (!el) return null
  if (prefersReducedMotion()) {
    gsap.set(el, { autoAlpha: 1 })
    return null
  }
  gsap.set(el, { autoAlpha: 1 })
  return splitLines(el, (self) =>
    gsap.from(self.lines, {
      yPercent: parseFloat(y),
      duration: 1.15,
      stagger,
      delay,
      ease: 'jaz',
      scrollTrigger: { trigger: el, start, once: true },
    }),
  )
}

/**
 * Generic fade-and-rise for non-text blocks (images, rules, buttons).
 */
export function revealBlock(targets, { start = 'top 85%', y = 28, stagger = 0.08, trigger } = {}) {
  if (!targets || (targets.length === 0 && !targets.nodeType)) return
  if (prefersReducedMotion()) {
    gsap.set(targets, { autoAlpha: 1, y: 0 })
    return
  }
  gsap.from(targets, {
    autoAlpha: 0,
    y,
    duration: 1.2,
    stagger,
    ease: 'jaz',
    scrollTrigger: { trigger: trigger || targets, start, once: true },
  })
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, prefersReducedMotion }
