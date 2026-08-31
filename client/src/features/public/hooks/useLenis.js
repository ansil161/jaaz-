import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/gsap'

/**
 * Lenis drives the scroll; GSAP's ticker drives Lenis. One rAF loop for the
 * whole page, and ScrollTrigger updates on every Lenis frame so pinned
 * sections can't lag a frame behind the content.
 */
export function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch feels better than an emulated one.
      syncTouch: false,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    window.__lenis = lenis

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      delete window.__lenis
    }
  }, [])
}

/** Anchor navigation that respects the smooth scroller. */
export function scrollToId(id, offset = 0) {
  const el = document.getElementById(id)
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset, duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}
