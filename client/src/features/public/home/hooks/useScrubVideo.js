import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/animation/gsap'

/* ============================================================
   SCRUBBED VIDEO

   Footage driven by scroll position instead of by a clock: the
   page writes `currentTime` every frame and the browser decodes
   to match. It is the technique behind every "product assembles
   itself as you scroll" hero, and the reason those builds
   usually ship a folder of 400 numbered JPEGs is that a normal
   H.264 file can only seek to its nearest keyframe — so the
   scrub advances in visible blocks.

   A clip encoded with a keyframe on every frame (`-g 1`) seeks
   cleanly and costs a fraction of the bytes. That requirement is
   documented next to `heroMedia` in data/site.js, because a clip
   encoded the ordinary way will look broken here and the reason
   is invisible from the markup.

   The hook is deliberately pessimistic. It reports `ready` only
   once it has a finite duration AND enough buffered to seek, so
   a missing file, an unsupported codec, a still-loading clip or
   a reduced-motion preference all resolve the same way: `ready`
   stays false and the caller keeps whatever it was already
   showing. Nothing here can leave a blank frame on the page.
   ============================================================ */

export function useScrubVideo(src, { enabled = true } = {}) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = ref.current
    /* Reduced motion opts out at the source rather than in the
       caller — a scrubbed video IS the motion, so there is no
       version of this worth loading if the user has asked for less. */
    if (!video || !src || !enabled || prefersReducedMotion()) return

    let cancelled = false

    const check = () => {
      if (cancelled || !Number.isFinite(video.duration) || video.duration <= 0) return
      /* `readyState` rather than `buffered`: a range covering the
         whole clip is the ideal, but Safari reports partial ranges
         indefinitely for a file it is perfectly able to seek. */
      if (video.readyState >= video.HAVE_FUTURE_DATA) setReady(true)
    }

    const fail = () => {
      if (!cancelled) setReady(false)
    }

    video.addEventListener('loadedmetadata', check)
    video.addEventListener('canplay', check)
    video.addEventListener('canplaythrough', check)
    video.addEventListener('error', fail)
    video.addEventListener('stalled', fail)

    /* iOS will not seek a video that has never been handed to the
       decoder, so prime it with a muted play and immediately stop.
       Muted + playsInline means this needs no user gesture; the
       catch is required because a rejected play() is an unhandled
       rejection, not a no-op. */
    const primed = video.play()
    if (primed?.then) primed.then(() => video.pause()).catch(() => {})

    check()

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', check)
      video.removeEventListener('canplay', check)
      video.removeEventListener('canplaythrough', check)
      video.removeEventListener('error', fail)
      video.removeEventListener('stalled', fail)
    }
  }, [src, enabled])

  return { ref, ready }
}

/**
 * Props every scrubbed video needs, in one place so no caller can
 * forget one. `muted` and `playsInline` are what make autoplay
 * priming legal; `preload="auto"` is what makes seeking usable.
 *
 * Not spread blindly — `poster` is passed per call, since a hero and
 * an interstitial want different first frames.
 */
export const scrubVideoProps = {
  muted: true,
  playsInline: true,
  preload: 'auto',
  disablePictureInPicture: true,
  'aria-hidden': true,
  tabIndex: -1,
}
