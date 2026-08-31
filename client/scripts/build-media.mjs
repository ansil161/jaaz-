/* ============================================================
   JAAZ EXPERIENCE — MEDIA PIPELINE

   Turns the raw generated renders in `media-src/` into the
   responsive AVIF + WebP derivatives the app actually ships from
   `public/media/`.

   WHY TWO FOLDERS. A 2MB PNG dropped straight into `public/` is
   served verbatim — Vite copies that directory as-is, with no
   processing — so the experience would ship ~80MB of source
   renders. `media-src/` sits outside `public/`, which means the
   masters are versioned and re-processable but never served, and
   the only files a visitor can reach are the compressed ones.

   WHY BOTH FORMATS. AVIF is roughly 30-50% smaller than WebP at
   matched quality and is dramatically better on exactly this
   content — large smooth gradients in dark interiors, which is
   where WebP starts banding. WebP is the fallback for older
   Safari. `<picture>` picks; see `Plate` in the app.

   USAGE
     node scripts/build-media.mjs           # only what changed
     node scripts/build-media.mjs --force   # rebuild everything

   Re-running is cheap: an output newer than its source is
   skipped, so this is safe to run after every new render lands.
   ============================================================ */

import { copyFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'media-src')
const OUT = path.join(ROOT, 'public', 'media')

/* The rendered widths. 1376 is the native output of the image
   model — upscaling past the source buys file size and no detail,
   so it is the ceiling rather than an arbitrary "2560 for retina".
   640 and 960 carry phones and tablets. */
const WIDTHS = [640, 960, 1376]

/* Quality is set per format at the point where a dark interior
   with a warm cove gradient stops showing banding, judged on the
   theatre master rather than on a synthetic test image. */
const AVIF = { quality: 58, effort: 6 }
const WEBP = { quality: 82 }

const force = process.argv.includes('--force')

/** Every source file under media-src matching `test`, relative to it. */
async function sources(test, dir = SRC, base = '') {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...(await sources(test, path.join(dir, entry.name), rel)))
    else if (test.test(entry.name)) out.push(rel)
  }
  return out
}

const STILLS = /\.(png|jpe?g)$/i
const REELS = /\.(mp4|webm)$/i

/** Skip work whose output is already newer than its source. */
async function isStale(srcPath, outPath) {
  if (force || !existsSync(outPath)) return true
  const [s, o] = await Promise.all([stat(srcPath), stat(outPath)])
  return s.mtimeMs > o.mtimeMs
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`No media-src/ at ${SRC}`)
    process.exit(1)
  }

  const files = await sources(STILLS)
  const reels = await sources(REELS)
  if (!files.length && !reels.length) {
    console.log('media-src/ is empty — nothing to build.')
    return
  }

  /* The manifest is written from what actually EXISTS on disk
     rather than maintained by hand, so a render that was never
     generated cannot be referenced by the app as though it were:
     a missing slot is a missing key, caught at import time, not a
     404 the visitor discovers. */
  const manifest = {}
  let built = 0

  for (const rel of files) {
    const srcPath = path.join(SRC, rel)
    const dir = path.dirname(rel)
    const name = path.basename(rel).replace(/\.[^.]+$/, '')
    const outDir = path.join(OUT, dir)
    await mkdir(outDir, { recursive: true })

    const image = sharp(srcPath)
    const { width: srcW, height: srcH } = await image.metadata()
    const widths = WIDTHS.filter((w) => w <= srcW)
    if (!widths.length) widths.push(srcW)

    for (const w of widths) {
      for (const [ext, opts] of [
        ['avif', AVIF],
        ['webp', WEBP],
      ]) {
        const outPath = path.join(outDir, `${name}-${w}.${ext}`)
        if (!(await isStale(srcPath, outPath))) continue
        await sharp(srcPath).resize({ width: w }).toFormat(ext, opts).toFile(outPath)
        built++
      }
    }

    const key = dir === '.' ? name : `${dir}/${name}`.replace(/^jaz-home\//, '')
    manifest[key] = {
      kind: 'still',
      base: `/media/${dir}/${name}`.replace(/\\/g, '/'),
      widths,
      ratio: Number((srcW / srcH).toFixed(4)),
    }
  }

  /* ---- Reels -------------------------------------------------
     Video is COPIED rather than transcoded. Encoding is not sharp's
     job, and adding ffmpeg would turn `npm i` into a video-toolchain
     install for everyone who only ever touches copy. The clips
     arrive already encoded from Flow/Veo and are exported at
     delivery size. media-src stays the single master folder for
     both kinds, so there is exactly one place a new render lands.

     A reel's POSTER is a still slot by convention: the reel
     `hero/arrival` looks for the image slot `hero/arrival-poster`.
     That keeps the poster on the same responsive AVIF/WebP path as
     every other plate instead of shipping a second full-size JPEG,
     and it means a reel whose clip has not been produced yet can
     still show a frame. Clip and poster resolve independently —
     see `reel()` in lib/media.js. */
  for (const rel of reels) {
    const dir = path.dirname(rel)
    await mkdir(path.join(OUT, dir), { recursive: true })

    const srcPath = path.join(SRC, rel)
    const outPath = path.join(OUT, rel)
    if (await isStale(srcPath, outPath)) {
      await copyFile(srcPath, outPath)
      built++
    }

    const ext = path.extname(rel).slice(1).toLowerCase()
    const name = path.basename(rel).replace(/\.[^.]+$/, '')
    const key = `${dir}/${name}`.replace(/^jaz-home\//, '')

    /* One key can carry both an mp4 and a webm — the same clip in
       two containers — so sources ACCUMULATE onto the existing
       entry rather than the second format overwriting the first.
       webm is sorted first because <video> takes the first source
       it can play and it is the smaller file where supported. */
    const entry = manifest[key] ?? { kind: 'video', sources: [] }
    entry.kind = 'video'
    entry.poster = `${key}-poster`
    entry.sources = [...(entry.sources ?? []), { ext, src: `/media/${dir}/${name}.${ext}` }].sort(
      (a, b) => (a.ext === b.ext ? 0 : a.ext === 'webm' ? -1 : 1),
    )
    manifest[key] = entry
  }

  const manifestPath = path.join(ROOT, 'src', 'features', 'public', 'data', 'media-manifest.json')
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  console.log(`${files.length} still(s) + ${reels.length} reel(s) -> ${built} file(s) written.`)
  console.log(`Manifest: ${path.relative(ROOT, manifestPath)} (${Object.keys(manifest).length} slots)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
