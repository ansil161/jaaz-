import manifest from '@/features/public/data/frames-manifest.json'

/* ============================================================
   FRAME SEQUENCES

   The sibling of utils/media.js, for the one kind of asset that
   file cannot describe: a numbered image sequence scrubbed
   frame-by-frame off the scroll position.

   WHY A SEQUENCE AND NOT A VIDEO. `useScrubVideo` already drives
   an ordinary clip from scroll, and where a clip works it is a
   fraction of the bytes. It works when the motion is CONTINUOUS.
   It stops working at the exact thing this site now needs: a
   gesture with a violent one-frame peak in the middle of it. An
   H.264 file seeks to its nearest keyframe, so the frame the
   whole sequence exists for is the one frame the browser is
   least likely to land on, and a `-g 1` re-encode that fixes
   that costs more than the numbered frames it was avoiding.

   THE RESOLVER RETURNS NULL AND THAT IS A FEATURE. Nothing in
   the manifest is a legitimate state, not an error — the same
   rule `reel()` follows. A consumer draws whatever it can draw
   without frames, so a scene is complete and reviewable before a
   single frame has been rendered, and swaps to the rendered
   sequence the moment one lands in the manifest with no
   component change at all.

   NOTHING IMPORTS THIS TODAY. The homepage section that was going
   to (a scrubbed hand gesture) has been replaced twice over,
   which is a composition and needs no sequence at all. The file
   stays for `theatre/walkthrough`, which is still a placeholder
   entry in the manifest and is the house walkthrough's asset, not
   the homepage's — see the note above the lazy <House> import in
   routes.js.

   `placeholder: true` on an entry means the frames on disk are
   standing in for the real render. It is carried through so a
   caller can choose to ignore a sequence it does not trust; the
   scene treats a placeholder as absent, because a stand-in
   gesture is worse than a drawn one.
   ============================================================ */

/** Every sequence the pipeline has actually produced. */
export const sequences = Object.keys(manifest)

/**
 * `sequence('theatre/walkthrough')` -> what exists for that sequence.
 *
 * Always returns an object, never null, so callers branch on
 * `urls` rather than on the shape of the return value.
 */
export function sequence(slot) {
  const entry = slot ? manifest[slot] : null
  if (!entry || entry.placeholder) return { urls: null, count: 0, ratio: 16 / 9 }

  const { base, count, ext = 'webp', pad = 4 } = entry
  return {
    urls: Array.from(
      { length: count },
      (_, i) => `${base}/${String(i).padStart(pad, '0')}.${ext}`,
    ),
    count,
    ratio: entry.ratio ?? 16 / 9,
  }
}

/** Is there a real, non-placeholder sequence for this slot? */
export function hasSequence(slot) {
  return Boolean(sequence(slot).urls)
}

/**
 * Decode a whole sequence into `<img>` elements, in order.
 *
 * Resolves with the array once every frame that CAN load has,
 * and never rejects: a sequence that is missing three frames in
 * the middle still scrubs, it just repeats its neighbours. A
 * scene that throws away 177 good frames because three 404'd is
 * a scene that is offline for a broken deploy it could have
 * survived.
 *
 * `onProgress(loaded, total)` fires as they arrive, so a caller
 * can hold the scene at its first frame until enough of the
 * sequence is decodable to scrub without tearing.
 */
export function loadSequence(urls, { onProgress, signal } = {}) {
  let loaded = 0
  const total = urls.length

  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const image = new Image()
          const done = (ok) => {
            loaded += 1
            onProgress?.(loaded, total)
            resolve(ok ? image : null)
          }
          image.onload = () => done(true)
          image.onerror = () => done(false)
          image.decoding = 'async'
          image.src = url
        }),
    ),
  ).then((frames) => {
    if (signal?.aborted) return []
    /* Holes are filled from the last good frame so the caller can
       index the array blindly at any progress. */
    let last = frames.find(Boolean) ?? null
    return frames.map((f) => (f ? (last = f) : last))
  })
}
