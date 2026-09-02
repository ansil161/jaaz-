import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from './gsap'

/* ============================================================
   CUE AUDIO

   SOUND IS AN EVENT, NOT A SOUNDTRACK.

   This is deliberately not a player. There is no transport, no
   loop, no bed, no ducking graph — six short files, each fired
   at most once as the scroll crosses a mark, most of the section
   silent. Everything here exists to protect that idea from the
   four ways it normally falls apart:

   1. AUTOPLAY. Nothing is fetched or played until the visitor has
      genuinely interacted with the document. `preload` starts at
      `none`, so a page that is scrolled past costs zero bytes of
      audio; the first real gesture flips it to `auto` and warms
      the elements with a silent play/pause, which is what makes
      the FIRST intended cue audible instead of swallowed.

   2. RE-TRIGGERING. A scrubbed timeline reports progress on every
      frame. `if (p > 0.4) play()` fires sixty times a second. Cues
      are therefore edge-detected — armed, fired once on the upward
      crossing, and only re-armed after the scroll has fallen a
      clear margin BELOW the mark again (`HYSTERESIS`). Scrolling
      backwards is silent by design.

   3. PILE-UP. A flick-scroll crosses four marks in one frame's
      worth of progress. `minGap` drops anything arriving inside the
      cooldown, and a `solo` cue fades whatever is still ringing
      before it speaks, so the last hit of the section lands in
      silence rather than on top of a whoosh.

   4. LEAKS. Every element is paused, unsourced and dropped on
      `destroy()`, and every volume tween is killed with it — a
      route change must not leave a bass note decaying into the
      next page.

   Failure is always silent and never structural: if the browser
   refuses to play, `play()` resolves to nothing and the visuals
   are untouched.
   ============================================================ */

/** Where the six files live. Public dir, so these are real URLs in
    dev and in the build alike — no bundler indirection to get wrong. */
export const AUDIO_BASE = '/audio/'

/* How far below a mark the scroll has to fall before that cue will
   speak again. Without it, resting the pointer exactly on a mark and
   nudging the wheel a pixel either way machine-guns the sound. */
const HYSTERESIS = 0.035

/* The floor between any two cues.
   SIZED AGAINST THE MARKS, NOT PICKED. The tightest gap in the
   section's cue map is 0.05 of the timeline, and over a five-screen
   pin that is about 250px of scroll — which a brisk wheel covers in
   well under a fifth of a second. An earlier 380ms floor was
   therefore not catching flicks, it was silently swallowing the
   sub-bass and the calibration pulse during ORDINARY scrolling, and
   the only way that showed up was measuring the peak volume each
   file actually reached (five of six hit their mark; the sub-bass
   sat at zero).

   The flick case is now handled where it actually happens — in
   createCueTrack, which collapses a multi-mark crossing to its last
   cue — so this is left as a short guard against two updates landing
   back to back, and nothing more. */
const DEFAULT_MIN_GAP = 150

const SESSION_KEY = 'jaaz:sound'

/** Session-scoped, and deliberately not localStorage: a sound
    preference is a decision about THIS visit, not a setting. */
export function readSoundPreference(fallback = true) {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    return stored === null ? fallback : stored === 'on'
  } catch {
    /* Private mode, blocked storage. The preference just doesn't persist. */
    return fallback
  }
}

function writeSoundPreference(on) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

/**
 * @param {Record<string, {
 *   src: string,       // filename inside /public/audio
 *   volume: number,    // 0–1, the peak this cue is allowed to reach
 *   offset?: number,   // seconds into the file to start from
 *   duration?: number, // seconds to hold before fading out
 *   fadeIn?: number,   // seconds
 *   fadeOut?: number,  // seconds
 *   solo?: boolean,    // fade everything else out before speaking
 * }>} cues
 */
export function createAudioManager(cues, { minGap = DEFAULT_MIN_GAP } = {}) {
  /** One element per FILE, not per cue.
   *
   *  Three of the eight cues are the same sixteen-second pulse taken
   *  at three different offsets. Given an element each, the browser
   *  holds three decoders on a 2.9MB file and — on a cold cache, or
   *  behind a header that forbids caching — fetches it three times.
   *  Sharing is safe here because two cues on one file can never be
   *  sounding at once: the marks are a third of the timeline apart
   *  and each use stops itself well before the next is due.
   *
   *  @type {Map<string, HTMLAudioElement>} */
  const bySrc = new Map()
  /** @type {Map<string, HTMLAudioElement>} cue id -> its element */
  const els = new Map()
  let unlocked = false
  let enabled = false
  let dead = false
  let lastPlayed = 0

  for (const [id, cue] of Object.entries(cues)) {
    let el = bySrc.get(cue.src)
    if (!el) {
      el = new Audio()
      /* `none` until a gesture: a visitor who never reaches this
         section never downloads a byte of it. */
      el.preload = 'none'
      el.src = AUDIO_BASE + cue.src
      el.volume = 0
      /* Not music, and never the thing a media key should control. */
      el.loop = false
      bySrc.set(cue.src, el)
    }
    els.set(id, el)
  }

  const stop = (el) => {
    gsap.killTweensOf(el)
    el.pause()
    el.volume = 0
  }

  /** Fade a single element out and park it. */
  const fadeOut = (el, seconds = 0.35) => {
    gsap.killTweensOf(el)
    if (el.paused || el.volume === 0) return stop(el)
    gsap.to(el, {
      volume: 0,
      duration: seconds,
      ease: 'power1.out',
      overwrite: true,
      onComplete: () => {
        el.pause()
      },
    })
  }

  return {
    /** Warm the elements. Must be called from inside a user gesture. */
    unlock() {
      if (unlocked || dead) return
      unlocked = true
      for (const el of bySrc.values()) {
        el.preload = 'auto'
        /* A silent play/pause inside the gesture is what actually
           grants the element permission. Without it the first real
           cue is the one the browser blocks — i.e. exactly the one
           that mattered. */
        el.volume = 0
        const p = el.play()
        if (p && typeof p.then === 'function') {
          p.then(
            () => {
              el.pause()
              el.currentTime = 0
            },
            () => {
              /* Blocked. `enabled` still works if the visitor toggles
                 sound on later from a click, which is its own gesture. */
            },
          )
        } else {
          el.pause()
        }
        el.load()
      }
    },

    setEnabled(next) {
      enabled = next
      writeSoundPreference(next)
      if (!next) this.silence(0.25)
    },

    get enabled() {
      return enabled
    },

    get unlocked() {
      return unlocked
    },

    /** Fade everything currently sounding. */
    silence(seconds = 0.3) {
      for (const el of bySrc.values()) fadeOut(el, seconds)
    },

    play(id) {
      if (dead || !enabled || !unlocked) return
      /* A backgrounded tab still runs ScrollTrigger callbacks on some
         browsers when restored; never speak into a tab nobody is looking at. */
      if (typeof document !== 'undefined' && document.hidden) return

      const cue = cues[id]
      const el = els.get(id)
      if (!cue || !el) return

      const now = performance.now()
      if (!cue.solo && now - lastPlayed < minGap) return
      lastPlayed = now

      /* The final hit is asked to land in silence. Everything still
         ringing is faded fast enough to be gone before it speaks and
         slow enough not to click. */
      if (cue.solo) {
        /* Compared by ELEMENT, not by cue id: two cues can now share
           one element, and fading the thing we are about to play
           would leave the closing hit inaudible. */
        for (const other of bySrc.values()) {
          if (other !== el) fadeOut(other, 0.22)
        }
      }

      const peak = cue.volume ?? 0.12
      const fadeIn = cue.fadeIn ?? 0.08
      const fadeOutFor = cue.fadeOut ?? 0.6

      gsap.killTweensOf(el)
      try {
        el.currentTime = cue.offset ?? 0
      } catch {
        /* Not seekable yet — start wherever it is rather than throwing. */
      }
      el.volume = 0

      const started = el.play()
      const onPlaying = () => {
        gsap.to(el, { volume: peak, duration: fadeIn, ease: 'power1.out', overwrite: true })

        /* Several of these files run far longer than the moment they
           are marking — the pulse is sixteen seconds. `duration` is
           the window this section actually wants, trimmed with a fade
           rather than a cut so the tail never clicks. */
        if (cue.duration) {
          gsap.to(el, {
            volume: 0,
            duration: fadeOutFor,
            delay: Math.max(0, cue.duration - fadeOutFor),
            ease: 'power2.inOut',
            onComplete: () => {
              el.pause()
            },
          })
        }
      }

      if (started && typeof started.then === 'function') {
        started.then(onPlaying, () => {
          /* Blocked or interrupted. Silence is a correct outcome. */
        })
      } else {
        onPlaying()
      }
    },

    destroy() {
      dead = true
      for (const el of bySrc.values()) {
        gsap.killTweensOf(el)
        el.pause()
        /* Detach the source so an in-flight fetch is abandoned rather
           than finishing into an element nothing holds. */
        el.removeAttribute('src')
        el.load()
      }
      els.clear()
      bySrc.clear()
    },
  }
}

/**
 * Forward-only edge detector over a 0–1 scrub progress.
 *
 * `marks` is `[{ at, cue }]`. Call `update(progress)` as often as you
 * like — it fires each cue at most once per upward crossing, and only
 * re-arms once the scroll has fallen `HYSTERESIS` below the mark.
 */
export function createCueTrack(marks, onFire) {
  const state = marks.map((m) => ({ ...m, armed: true }))
  let prev = 0

  return {
    update(progress) {
      /* Collect first, fire after. A flick — or a jump from an anchor
         link — can cross four marks between two frames, and firing
         each of them is the pile-up this section cannot afford. All
         four are disarmed (they have genuinely been passed) but only
         the LAST speaks, which is also the musically correct answer:
         the sound you should hear is the one for where you have
         ended up, not a chord of everywhere you went through. */
      const crossed = []
      for (const m of state) {
        if (m.armed && prev <= m.at && progress > m.at) {
          m.armed = false
          crossed.push(m)
        } else if (!m.armed && progress < m.at - HYSTERESIS) {
          m.armed = true
        }
      }
      prev = progress

      const last = crossed[crossed.length - 1]
      if (last) onFire(last.cue, last)
    },
    reset() {
      for (const m of state) m.armed = true
      prev = 0
    },
  }
}

/**
 * React binding. Owns the manager for the life of the component,
 * unlocks it on the first genuine gesture, and exposes the on/off
 * state the section's control renders from.
 *
 * The manager itself is returned by ref, not by state, so nothing in
 * a scrubbed timeline ever has to touch React to make a sound.
 */
export function useCueAudio(cues, { enabled: startEnabled = true } = {}) {
  const managerRef = useRef(null)
  const reduced = useMemo(() => prefersReducedMotion(), [])

  /* Reduced motion means no scrubbed timeline, so no cues — and the
     preference explicitly starts OFF there rather than merely unused. */
  const [soundOn, setSoundOn] = useState(() =>
    reduced ? false : readSoundPreference(startEnabled),
  )

  /* Read once so the effect below never re-runs on a cue-object
     identity change from a parent re-render. */
  const cuesRef = useRef(cues)

  useEffect(() => {
    const manager = createAudioManager(cuesRef.current)
    managerRef.current = manager
    manager.setEnabled(reduced ? false : readSoundPreference(startEnabled))

    if (reduced) {
      return () => {
        managerRef.current = null
        manager.destroy()
      }
    }

    /* The unlock gesture. `wheel` and `touchmove` are included because
       on this site the first meaningful interaction genuinely IS a
       scroll — but a click, a key or a tap counts just as well. All of
       them are passive and all of them are removed after the first. */
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'touchmove', 'scroll']
    const onGesture = () => {
      manager.unlock()
      for (const e of events) window.removeEventListener(e, onGesture)
    }
    for (const e of events) window.addEventListener(e, onGesture, { passive: true, once: false })

    /* Leaving the tab mid-section should not leave a note ringing in
       the background. */
    const onVisibility = () => {
      if (document.hidden) manager.silence(0.2)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      for (const e of events) window.removeEventListener(e, onGesture)
      document.removeEventListener('visibilitychange', onVisibility)
      managerRef.current = null
      manager.destroy()
    }
  }, [reduced, startEnabled])

  const toggleSound = () => {
    setSoundOn((on) => {
      const next = !on
      const manager = managerRef.current
      if (manager) {
        /* The toggle is itself a gesture, so it can grant permission
           for a visitor whose scroll was never seen as one. */
        if (next) manager.unlock()
        manager.setEnabled(next)
      }
      return next
    })
  }

  return { managerRef, soundOn, toggleSound, reduced }
}
