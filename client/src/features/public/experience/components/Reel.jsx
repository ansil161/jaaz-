import { useEffect, useRef, useState } from 'react'
import { hasStill, reel as resolveReel } from '@/features/public/utils/media'
import { prefersReducedMotion } from '@/lib/animation/useGsap'
import Plate from '@/features/public/components/Plate'

/* ============================================================
   REEL — a cinematic moment, and its three honest fallbacks

   The brief asks for video at the major beats and stills
   everywhere else. This component is the "major beat", and it is
   built around the fact that a Veo clip arrives on a different
   schedule to a still: minutes and a rate limit, against seconds.

   So it resolves in layers, and every layer is a finished state
   rather than a degraded one:

     clip           plays, muted, looping, over its own poster
     poster only    a held frame — indistinguishable from a plate
     `still` prop   the room's ordinary render
     none           an empty stage of the right shape

   That is what lets the whole journey be reviewed today and get
   quietly better as clips land, with no component changing.

   THE STILL IS ALWAYS UNDERNEATH. Not swapped for — underneath.
   The <video> fades in on top once it can actually paint a frame,
   so there is no moment of black box, no layout shift, and a clip
   that fails to decode on some device simply never appears over a
   perfectly good photograph.

   REDUCED MOTION TAKES THE POSTER PATH DELIBERATELY. A looping
   camera move is exactly the kind of continuous motion the
   preference exists to stop, and the poster is a real frame of
   the same shot rather than an apology for it.

   AUTOPLAY RULES. Muted + playsInline + no controls is the only
   combination browsers will start on their own; `preload="none"`
   until the reel is near the viewport keeps twelve clips off the
   critical path.
   ============================================================ */

export default function Reel({
  slot,
  still = null,
  alt = '',
  ratio = 16 / 9,
  priority = false,
  /* `fill` hands sizing to the parent instead of reserving an
     aspect box. The hero is a full-viewport element whose height
     comes from `svh`, and an aspect-ratio on the media inside it
     would fight that at every window shape. */
  fill = false,
  className = '',
  children,
}) {
  const root = useRef(null)
  const video = useRef(null)
  const [near, setNear] = useState(priority)
  const [playing, setPlaying] = useState(false)

  const { clip, poster } = resolveReel(slot)
  /* Poster first, then the caller's still, then nothing. The
     caller's still is the room's own render, which is why a reel
     that has never been generated still shows the right room. */
  const base = poster ?? (hasStill(still) ? still : null)
  const reduced = prefersReducedMotion()
  const wantsClip = Boolean(clip) && !reduced

  /* Only load a clip once it is nearly on screen. `rootMargin`
     buys roughly one viewport of runway so the fade-in happens
     before the beat is reached rather than in front of the
     visitor. */
  useEffect(() => {
    if (near || !wantsClip) return
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near, wantsClip])

  /* Pause when off screen. Twelve looping clips all decoding at
     once is the single easiest way to make a page like this drop
     frames on a laptop, and nothing is lost by stopping a moment
     nobody is looking at. */
  useEffect(() => {
    const el = root.current
    const v = video.current
    if (!el || !v || !wantsClip) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) v.play().catch(() => {})
          else v.pause()
        }
      },
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [wantsClip, near])

  return (
    <div
      ref={root}
      className={`overflow-hidden bg-ink ${fill ? 'absolute inset-0 h-full w-full' : 'relative'} ${className}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {base ? (
        <Plate
          slot={base}
          alt={alt}
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-ink-3" aria-hidden="true" />
      )}

      {wantsClip && near && (
        <video
          ref={video}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          /* Decorative by construction: the plate underneath
             carries the alt text, so announcing the same room
             twice would only make the page longer to listen to. */
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setPlaying(true)}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: playing ? 1 : 0 }}
        >
          {clip.map((s) => (
            <source key={s.ext} src={s.src} type={`video/${s.ext}`} />
          ))}
        </video>
      )}

      {children}
    </div>
  )
}
