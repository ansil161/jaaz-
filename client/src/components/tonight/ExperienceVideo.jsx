import { useEffect, useRef, useState } from 'react'
import Plate from '../experience/Plate'
import { hasStill, reel } from '../../lib/media'
import { gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   EXPERIENCE VIDEO — the stage

   WHY THIS IS A STACK OF LAYERS AND NOT ONE <video>

   The brief asks for a crossfade, and a crossfade is impossible
   with a single element: changing `src` tears the old frame down
   before the new one has decoded, so the "transition" is a black
   flash whatever you animate around it. Two things therefore have
   to exist at once, which means each night gets its own LAYER —
   its own poster and its own video element — and the transition
   is one layer fading over another.

   A stack rather than a fixed A/B pair because a visitor clicking
   04 then 06 before the first fade lands would, with two buffers,
   overwrite the buffer that is currently animating and swap the
   picture instantly under its own fade. Pushing a new layer on top
   cannot do that. Layers below the top are pruned the moment the
   fade completes, so the stack is one element deep at rest and
   never grows without bound.

   POSTER FIRST, ALWAYS
   Every layer paints its still immediately and lets the video fade
   in OVER it once it can actually play. That single rule is what
   makes all three asset states — clip, poster only, neither — look
   deliberate rather than broken, and it is why this section could
   be designed and reviewed before any Veo footage existed.

   REDUCED MOTION TAKES THE POSTER PATH
   Not "the same thing, faster". `prefers-reduced-motion` renders
   the still and never attaches a video at all — a looping clip is
   exactly the sustained movement that setting is asking us not to
   play, and lib/media.js documents this as the house behaviour for
   reels.
   ============================================================ */

/** A layer's still: a rendered house plate if the pipeline has one,
 *  otherwise the verified photograph the data file guarantees. */
function Still({ night, priority }) {
  if (hasStill(night.still)) {
    return (
      <Plate
        slot={night.still}
        alt={night.alt}
        priority={priority}
        sizes="(min-width: 1024px) 62vw, 100vw"
        className="absolute inset-0"
      />
    )
  }
  return (
    <img
      src={night.photo}
      alt={night.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable="false"
      className="plate absolute inset-0 [--plate-contrast:1.04] [--plate-saturate:0.96]"
    />
  )
}

/** One night, rendered whole: still underneath, clip over it. */
function Layer({ night, priority, reduced, onReady }) {
  const clip = reduced ? null : reel(night.reel).clip
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    /* `canplay` rather than `loadeddata`: the first is the browser
       saying it can start without stalling, which is the actual
       condition for fading a moving picture in. */
    const ready = () => {
      v.play().catch(() => {})
      onReady?.()
      gsap.to(v, { autoAlpha: 1, duration: 0.9, ease: 'jaz' })
    }

    if (v.readyState >= 3) ready()
    else v.addEventListener('canplay', ready, { once: true })

    return () => {
      v.removeEventListener('canplay', ready)
      /* Stopping playback matters here: layers are pruned constantly,
         and a clip left decoding behind an opacity of 0 is the
         difference between a smooth page and a hot laptop.

         `pause()` and nothing else, deliberately. The usual teardown
         incantation is `removeAttribute('src'); load()`, and it is
         actively wrong for this element: the sources are <source>
         CHILDREN, so there is no `src` attribute to remove and
         `load()` would re-run resource selection and start fetching
         the clip again — the exact opposite of releasing it. Emptying
         the children instead would mean mutating nodes React is in
         the middle of unmounting. Pausing, then letting React detach
         the element, releases the decoder without either hazard. */
      v.pause()
    }
  }, [onReady])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Still night={night} priority={priority} />

      {clip && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          muted
          loop
          playsInline
          autoPlay
          preload={priority ? 'auto' : 'metadata'}
          aria-hidden="true"
          tabIndex={-1}
        >
          {clip.map((s) => (
            <source key={s.ext} src={s.src} type={`video/${s.ext}`} />
          ))}
        </video>
      )}
    </div>
  )
}

export default function ExperienceVideo({ nights, index, nextIndex, labelledBy, panelId }) {
  const reduced = prefersReducedMotion()

  /* The stack. `seq` only ever increases, so React keys are stable
     even when the same night is re-selected. */
  const seq = useRef(0)
  const [layers, setLayers] = useState(() => [{ key: 0, index }])
  const stage = useRef(null)

  useEffect(() => {
    if (layers[layers.length - 1].index === index) return

    seq.current += 1
    const entry = { key: seq.current, index }
    setLayers((prev) => [...prev, entry])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  /* Fade whichever layer arrived last, then drop everything under
     it. Runs after the layer has mounted, so there is a painted
     poster to fade rather than an empty box. */
  useEffect(() => {
    if (layers.length < 2) return
    const el = stage.current?.lastElementChild
    if (!el) return

    const prune = () => setLayers((prev) => prev.slice(-1))

    if (reduced) {
      gsap.set(el, { autoAlpha: 1, scale: 1 })
      prune()
      return
    }

    /* Everything BUT the arriving layer. Darkening the newcomer too
       would put two tweens on one `filter` for the first tenth of a
       second, and the loser of that fight is decided by creation
       order rather than by intent. */
    const outgoing = Array.from(stage.current.children).slice(0, -1)

    const tl = gsap.timeline({ onComplete: prune })
    /* The outgoing night darkens rather than simply vanishing — the
       brief's first transition beat, and the thing that stops a
       crossfade reading as a dissolve between two photographs. */
    tl.to(outgoing, { filter: 'brightness(0.55)', duration: 0.42, ease: 'power2.in' }, 0)
      .fromTo(
        el,
        { autoAlpha: 0, scale: 1.055, filter: 'brightness(0.55)' },
        { autoAlpha: 1, scale: 1, filter: 'brightness(1)', duration: 0.82, ease: 'jaz' },
        0.1,
      )

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.length, reduced])

  const upcoming = nights[nextIndex]
  const upcomingClip = reduced ? null : reel(upcoming?.reel ?? '').clip

  return (
    <div
      ref={stage}
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      /* A tabpanel whose only content is decorative media has nothing
         focusable inside it, and the ARIA practices put `tabindex=0`
         on exactly that case so a keyboard can still reach and scroll
         the panel it just switched to. */
      tabIndex={0}
      className="focus-ring relative h-full w-full overflow-hidden bg-ink-3"
    >
      {layers.map((layer, i) => (
        <div
          key={layer.key}
          className="absolute inset-0"
          style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}
        >
          <Layer night={nights[layer.index]} priority={layer.key === 0} reduced={reduced} />
        </div>
      ))}

      {/* Warm the NEXT night's clip only — never all six. One hidden
          element at a time, replaced as the selection moves, so the
          section costs at most two clips of bandwidth rather than
          six. `preload="auto"` because the point is to have it
          decodable before the fade starts; metadata alone would still
          stall on the first frame. */}
      {upcomingClip && (
        <video
          key={upcoming.key}
          className="pointer-events-none absolute h-px w-px opacity-0"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          {upcomingClip.map((s) => (
            <source key={s.ext} src={s.src} type={`video/${s.ext}`} />
          ))}
        </video>
      )}
    </div>
  )
}
