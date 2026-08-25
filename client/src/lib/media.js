import manifest from '../data/media-manifest.json'

/* ============================================================
   MEDIA RESOLUTION

   One place that knows how a named slot ("theatre/base") becomes
   a set of files on disk. Everything else in the experience asks
   for slots by name and never builds a path.

   The manifest is GENERATED from what actually exists in
   media-src/ (see scripts/build-media.mjs), which is what makes
   `has()` meaningful: it answers "was this render ever produced",
   not "does this string look plausible". The experience is being
   built while its asset set is still being generated, so every
   consumer needs a real answer to that question — a configurator
   option whose render does not exist yet must render as
   unavailable, not as a broken image the visitor discovers.
   ============================================================ */

/** Every slot the pipeline has actually produced. */
export const slots = Object.keys(manifest)

/** Has this render been generated yet? */
export function has(slot) {
  return Boolean(slot && manifest[slot])
}

/* `has` answers "is there anything here"; `hasStill` further down
   answers "is it an image". Plate uses the second, because a video
   slot handed to an <img> is a broken image, not a video. */

/**
 * `srcSet('theatre/base', 'avif')` ->
 * "/media/jaz-home/theatre/base-640.avif 640w, ...".
 */
export function srcSet(slot, ext) {
  const entry = manifest[slot]
  if (!entry) return ''
  return entry.widths.map((w) => `${entry.base}-${w}.${ext} ${w}w`).join(', ')
}

/** The largest rendered file, for `<img src>` and for preloading. */
export function src(slot) {
  const entry = manifest[slot]
  if (!entry) return ''
  return `${entry.base}-${entry.widths[entry.widths.length - 1]}.webp`
}

/** Intrinsic aspect ratio, so a stage can reserve space before load. */
export function ratio(slot) {
  return manifest[slot]?.ratio ?? 16 / 9
}

/**
 * Warm the cache for a slot without rendering it.
 *
 * Used when a room becomes REACHABLE rather than when it becomes
 * visible — the point is that the plate is already decoded by the
 * time the transition to it starts, because a cinematic cross-fade
 * into a half-loaded image is worse than no cross-fade at all.
 * Resolves either way; a failed preload is not worth breaking a
 * navigation over.
 */
export function preload(slot) {
  return new Promise((resolve) => {
    if (!has(slot) || typeof Image === 'undefined') return resolve(false)
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.srcset = srcSet(slot, 'webp')
    img.src = src(slot)
    if (img.decode) img.decode().then(() => resolve(true)).catch(() => {})
  })
}

/* ============================================================
   REELS

   The cinematic moments of the experience are video, and video
   arrives on a different schedule to stills: a Veo clip is minutes
   of generation and a rate limit, where a still is seconds. So a
   reel resolves in THREE independent pieces — the clip, the poster
   and neither — and every one of those is a legitimate state the
   page has to render well rather than an error:

     clip + poster   the moment plays, poster paints first
     poster only     a held frame, indistinguishable from a plate
     neither         the caller's fallback still, or an empty stage

   That is what lets the whole experience be reviewed today and get
   quietly better as clips land, without a single component
   changing. It is also why `Reel` never assumes it will have a
   clip: under `prefers-reduced-motion` it deliberately renders the
   poster path even when the clip exists.
   ============================================================ */

/**
 * `reel('hero/arrival')` -> what exists for that moment.
 *
 * Always returns an object, never null — callers branch on
 * `clip`/`poster` rather than on the shape of the return value.
 */
export function reel(slot) {
  const entry = slot ? manifest[slot] : null
  const video = entry?.kind === 'video' ? entry : null

  /* The poster is a still slot resolved by convention, so it is
     subject to the same `has()` check as any other plate — a
     poster key that was never rendered is simply absent. */
  const posterSlot = video?.poster ?? (slot ? `${slot}-poster` : null)

  return {
    clip: video?.sources?.length ? video.sources : null,
    poster: hasStill(posterSlot) ? posterSlot : null,
    ratio: entry?.ratio ?? 16 / 9,
  }
}

/** Is there a playable clip for this slot? */
export function hasClip(slot) {
  return Boolean(reel(slot).clip)
}

/** Is this slot a rendered STILL, as opposed to a reel or nothing? */
export function hasStill(slot) {
  return manifest[slot]?.kind !== 'video' && Boolean(slot && manifest[slot])
}

/**
 * Can a configurator option change the room right now?
 *
 * It lives here, beside `hasStill`, because the answer is a
 * question about what exists on disk — and because both the
 * control that renders the option and the resolver that turns it
 * into a picture have to agree on it. Two copies of this rule is
 * how a panel ends up offering something the room cannot show.
 *
 * Most options need no asset at all: a `grade` relights the
 * plate, an `array` redraws the speakers, a `screen` redraws the
 * display at its real proportion. Only an option that needs a
 * genuinely different photograph waits on a render.
 */
export function optionReady(option) {
  if (!option) return false
  if (option.grade || option.array || option.screen) return true
  /* `slot: null` means the option IS the master render, which by
     definition exists. */
  if (option.slot === null) return true
  return hasStill(option.slot)
}
