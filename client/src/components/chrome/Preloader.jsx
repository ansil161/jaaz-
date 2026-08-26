import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap'

/* ============================================================
   PRELOADER
   The house lights going down.

   Not decoration: the hero opens on a black frame, and without
   this the first thing a visitor sees is an empty screen they
   might read as a broken page. The counter says "this is
   deliberate, keep watching" — then the shutter lifts straight
   into the dark room and the scroll sequence takes over.
   ============================================================ */

export default function Preloader() {
  const [done, setDone] = useState(false)
  const rootRef = useRef(null)
  const numRef = useRef(null)
  const barRef = useRef(null)

  useEffect(() => {
    /* Nothing should move under the shutter while it is up. */
    document.documentElement.style.overflow = 'hidden'

    const finish = () => {
      document.documentElement.style.overflow = ''
      setDone(true)
      /* The nav holds its entrance until the shutter is off the screen.
         The flag is for anything that mounts after this fires and would
         otherwise wait for an event that has already gone past. */
      window.__jazReady = true
      window.dispatchEvent(new Event('jaz:ready'))
      /* The hero's pin was measured against a locked page — remeasure
         now that the real scroll height exists. */
      requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    if (prefersReducedMotion()) {
      finish()
      return
    }

    const count = { v: 0 }
    const tl = gsap.timeline({ onComplete: finish })

    tl.to(count, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (numRef.current) {
          numRef.current.textContent = String(Math.round(count.v)).padStart(3, '0')
        }
      },
    })
      .to(barRef.current, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to('[data-preload-copy]', { autoAlpha: 0, duration: 0.45, ease: 'jaz' }, '>-0.15')
      /* The shutter lifts. Same easing as every other reveal on the
         site, so the page starts as it means to continue. */
      .to(
        rootRef.current,
        { yPercent: -100, duration: 1.15, ease: 'jaz-io' },
        '>-0.1',
      )

    return () => {
      tl.kill()
      document.documentElement.style.overflow = ''
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[70] flex flex-col justify-between bg-ink will-change-transform"
      aria-hidden="true"
    >
      <div data-preload-copy className="shell flex items-start justify-between pt-6 sm:pt-8">
        <span className="font-display text-2xl leading-none text-pure sm:text-[1.7rem]">JAAZ</span>
        <span className="t-label text-ash">Private Cinema</span>
      </div>

      <div data-preload-copy className="shell pb-6 sm:pb-8">
        <div className="flex items-end justify-between gap-6">
          <span className="t-label text-ash">Dimming the room</span>
          <span ref={numRef} className="t-num text-5xl leading-none text-pure sm:text-7xl">
            000
          </span>
        </div>
        <div className="mt-6 h-px w-full bg-white/12">
          <div ref={barRef} className="h-full origin-left scale-x-0 bg-pure" />
        </div>
      </div>
    </div>
  )
}
