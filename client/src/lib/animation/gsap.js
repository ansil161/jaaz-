import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { Observer } from 'gsap/Observer'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer, DrawSVGPlugin)

/* The house curves. Two of them, used everywhere, so every
   movement on the site reads as coming from the same hand. */
CustomEase.create('jaz', '0.16, 1, 0.3, 1') // exits and entrances
CustomEase.create('jaz-io', '0.76, 0, 0.24, 1') // state changes

gsap.defaults({ ease: 'jaz', duration: 1.1 })

/* Pins are position:fixed so they can't drift against Lenis. */
ScrollTrigger.config({ ignoreMobileResize: true })

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger, SplitText, Observer, DrawSVGPlugin }
