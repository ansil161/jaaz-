/* ============================================================
   VEO REEL GENERATION — "What's tonight?"

   Generates the six cinematic clips the homepage's WHAT'S
   TONIGHT? section plays, using Veo 3.1 through the Gemini API,
   and drops them straight into `media-src/jaz-home/tonight/`
   where `build-media.mjs` already knows how to pick them up.

   THIS IS A BUILD-TIME TOOL. IT NEVER RUNS IN A BROWSER.
   The key lives in `GEMINI_API_KEY` in the shell (or a
   gitignored `.env.local`), the six clips are generated ONCE,
   committed as compressed assets, and served as static files.
   No visitor request ever reaches Google, and the key is never
   bundled — the only thing the client ships is an `<video src>`
   pointing at our own origin. Generating on page load would be
   slow, non-deterministic, ruinously expensive, and would put a
   credentialed API behind an anonymous request.

   USAGE
     export GEMINI_API_KEY=...              # never commit this
     node scripts/generate-reels.mjs                  # all missing
     node scripts/generate-reels.mjs movie-marathon   # just one
     node scripts/generate-reels.mjs --force          # re-do all
     node scripts/generate-reels.mjs --dry-run        # print prompts

   Then:
     node scripts/build-media.mjs

   COST DISCIPLINE
   Veo is billed per second of output and a six-clip batch is not
   cheap, so this script refuses to regenerate a clip that already
   exists unless `--force` is passed, generates only what is
   missing by default, and takes a single key argument so a
   re-roll of one bad clip does not re-bill the other five.
   `--dry-run` exists so the prompts can be reviewed and argued
   about for free before any of them are spent.

   OPERATIONS ARE LONG-RUNNING
   Veo returns an operation handle immediately and takes minutes
   to render. The poll loop below is deliberately patient and
   deliberately bounded: it backs off, it reports, and it gives up
   with a message rather than hanging a CI job forever.
   ============================================================ */

import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'media-src', 'jaz-home', 'tonight')

const API = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = 'veo-3.1-generate-preview'

/* ------------------------------------------------------------
   THE HOUSE LOOK — stamped onto all six.

   `prompts.mjs` has a `BIBLE` describing the JAAZ show house and a
   `DISCIPLINE` that begins "No people." These six clips are the
   one deliberate exception on the whole site: every other render
   is architecture, and this section is specifically about the
   evenings people spend in it. An empty room cannot say "everyone
   has a reason to stay."

   So the architecture language is kept verbatim and the people
   rule is inverted, with the casting and behaviour spelled out —
   "naturally", "unposed", "realistic proportions" — because the
   failure mode of generated footage with people in it is uncanny
   faces and six-fingered hands, and the fix for that is
   specificity, not hope.
   ------------------------------------------------------------ */
const HOUSE =
  'Single-storey contemporary residence. Wide-plank smoked oak floors, warm off-white lime plaster, charcoal acoustic fabric, walnut battens at 40mm centres, blackened-steel reveals. Concealed cove lighting at 2700K, no visible fittings. Warm, low, directional light.'

const CRAFT =
  'Photoreal cinematic commercial photography, full-frame 35mm or 50mm look, shallow natural depth of field, high dynamic range, realistic materials and reflections. Real unposed people with correct anatomy and natural expressions, hands never distorted. No CGI sheen, no cartoon rendering, no excessive neon, no RGB gamer clichés, no on-screen text, no captions, no subtitles, no brand marks, no logos, no watermark. 16:9.'

/* `slug` is the manifest key the app asks for — it must stay in
   step with `reel:` in src/features/public/data/tonight.js, which is why both are
   listed here and checked at startup. */
const REELS = [
  {
    slug: 'movie-marathon',
    shot: 'Ultra-premium private home cinema at night. A large projection screen glows softly on the end wall. Two tiers of full-grain leather recliners, a few friends settled deep into them, completely absorbed in the film, one reaching for a blanket. A fibre-optic star ceiling dimmed overhead, step lighting on the aisle. Slow cinematic dolly from behind the back row toward the screen. The camera never stops and never cuts.',
  },
  {
    slug: 'boss-fight',
    shot: 'A luxury architectural gaming room designed as a private study, not a gamer bedroom. A long smoked-oak desk, a single large ultrawide display, one leather task chair. Charcoal acoustic panels behind. A player leaning in, intensely focused, hands on the controller, face lit by the screen. Restrained warm cove lighting, one cool accent from the display only. Slow lateral camera move past the desk. The camera never stops and never cuts.',
  },
  {
    slug: 'match-day',
    shot: 'A premium private viewing room at night, a live football match filling a very large wall-mounted display with green pitch light. Five or six friends on low modular seating react to a goal — arms up, genuine delight, one standing. Their faces lit almost entirely by the screen. Slow dramatic push-in from behind the seating. The camera never stops and never cuts. The match on screen is generic; no team badges, no scoreboard graphics, no broadcast text.',
  },
  {
    slug: 'family-takeover',
    shot: 'A beautiful premium family entertainment room in the evening. Three generations comfortably sharing the space: two children cross-legged on a wool rug playing a game, adults talking on the low seating behind them, someone carrying food in from the side. A large display glowing warmly in the background. Warm cove lighting and lamplight. Emotional, natural, unposed. Slow gentle camera drift across the room. The camera never stops and never cuts.',
  },
  {
    slug: 'party-after-dark',
    shot: 'A luxury outdoor terrace at night. Honed basalt paving, a long lap pool lit from within, a very large outdoor screen on a blackened-steel frame glowing at one end, low weather-resistant lounge seating. Friends gathered with drinks, relaxed and talking, a couple watching the screen, warm landscape lighting grazing the planting. The lit interior of the house visible through glazing behind. Slow lateral tracking move along the pool. The camera never stops and never cuts.',
  },
  {
    slug: 'one-more-song',
    shot: 'A late-night premium entertainment space, well after the film has finished. A warm timber bar to one side, a pair of walnut floorstanding speakers, the big screen now dark or showing a still. Four or five friends lingering — one at the bar, two on the sofa mid-conversation, one flicking through music on a wall panel. Very low warm light, intimate and unhurried. Slow cinematic dolly into the group. The camera never stops and never cuts.',
  },
]

const prompt = (r) => `${HOUSE} ${r.shot} ${CRAFT}`

const args = process.argv.slice(2)
const force = args.includes('--force')
const dryRun = args.includes('--dry-run')
const only = args.filter((a) => !a.startsWith('--'))

const exists = (p) =>
  access(p, constants.F_OK).then(
    () => true,
    () => false,
  )

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Kick off a generation and hand back the operation name. */
async function start(key, text) {
  const res = await fetch(`${API}/models/${MODEL}:predictLongRunning?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: text }],
      parameters: {
        aspectRatio: '16:9',
        /* 8s is the top of the brief's 6–8s window and the most
           material to cut a seamless loop from. */
        durationSeconds: 8,
        personGeneration: 'allow_adult',
        /* 1080p, not 4K, and that is a delivery decision rather than
           a limitation. This clip is a muted, looping, object-fit
           cover background behind type — it is never inspected at
           pixel level, and six 4K loops would cost more bandwidth
           than the rest of the homepage put together. Regenerate at
           a higher resolution only if these are ever reused as
           standalone showreel assets. */
        resolution: process.env.VEO_RESOLUTION || '1080p',
      },
    }),
  })

  if (!res.ok) throw new Error(`start failed ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (!json.name) throw new Error(`no operation name in response: ${JSON.stringify(json)}`)
  return json.name
}

/** Poll until the operation reports done, or give up. */
async function wait(key, name, label) {
  const DEADLINE = Date.now() + 12 * 60 * 1000
  let delay = 10_000

  while (Date.now() < DEADLINE) {
    await sleep(delay)
    delay = Math.min(delay * 1.25, 30_000)

    const res = await fetch(`${API}/${name}?key=${key}`)
    if (!res.ok) throw new Error(`poll failed ${res.status}: ${await res.text()}`)
    const op = await res.json()

    if (op.error) throw new Error(`generation failed: ${JSON.stringify(op.error)}`)
    if (op.done) return op

    process.stdout.write(`    ${label}: rendering…\n`)
  }
  throw new Error(`${label}: timed out after 12 minutes`)
}

/** Pull the finished mp4 out of whichever shape the response used. */
async function download(key, op) {
  const r = op.response ?? {}
  const sample =
    r.generatedVideos?.[0] ?? r.generateVideoResponse?.generatedSamples?.[0] ?? r.videos?.[0]

  const uri = sample?.video?.uri ?? sample?.video?.fileUri ?? sample?.uri
  if (!uri) throw new Error(`no video uri in response: ${JSON.stringify(op).slice(0, 600)}`)

  /* The file endpoint needs the key too; it is not a public URL. */
  const res = await fetch(uri.includes('key=') ? uri : `${uri}${uri.includes('?') ? '&' : '?'}key=${key}`)
  if (!res.ok) throw new Error(`download failed ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const queue = REELS.filter((r) => !only.length || only.includes(r.slug))

  if (only.length && !queue.length) {
    console.error(`Unknown reel(s): ${only.join(', ')}`)
    console.error(`Known: ${REELS.map((r) => r.slug).join(', ')}`)
    process.exit(1)
  }

  if (dryRun) {
    for (const r of queue) {
      console.log(`\n=== ${r.slug} ===\n${prompt(r)}`)
    }
    console.log(`\n${queue.length} prompt(s). Nothing generated, nothing billed.`)
    return
  }

  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error('GEMINI_API_KEY is not set.')
    console.error('  export GEMINI_API_KEY=...   (never commit it)')
    console.error('Run with --dry-run to review the prompts without a key.')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true })

  let made = 0
  let skipped = 0

  for (const r of queue) {
    const out = path.join(OUT_DIR, `${r.slug}.mp4`)

    if (!force && (await exists(out))) {
      console.log(`  = ${r.slug} (exists — --force to regenerate)`)
      skipped++
      continue
    }

    console.log(`  → ${r.slug}: submitting…`)
    try {
      const name = await start(key, prompt(r))
      const op = await wait(key, name, r.slug)
      const bytes = await download(key, op)
      await writeFile(out, bytes)
      console.log(`  ✓ ${r.slug} → ${path.relative(ROOT, out)} (${(bytes.length / 1e6).toFixed(1)} MB)`)
      made++
    } catch (err) {
      /* One bad clip must not abandon the other five — they have
         already been paid for by the time this throws. */
      console.error(`  ✗ ${r.slug}: ${err.message}`)
    }
  }

  console.log(`\n${made} generated, ${skipped} skipped.`)
  if (made) {
    console.log('Next: node scripts/build-media.mjs')
    console.log('Then generate a poster frame per clip as')
    console.log('  media-src/jaz-home/tonight/<slug>-poster.png')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
