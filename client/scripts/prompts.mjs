/* ============================================================
   THE PROMPT PACK — generated, never hand-kept

   Writes media-src/PROMPTS.md: every render the Experience Centre
   asks for, with the prompt to generate it, marked with whether
   it already exists on disk.

   WHY THIS IS A SCRIPT AND NOT A DOCUMENT

   Two failures this prevents, both of which cost a generation
   quota to discover:

   1. A prompt pack maintained by hand drifts from the slots the
      code actually references. You generate forty images and the
      app still shows empty stages, because it wanted
      `theatre/seating-motorised` and the document said
      `theatre/recliner-motorised`.

   2. The house stops being one house. Every prompt below inherits
      the SAME opening paragraph — the house bible — because the
      brief's hardest requirement is that nine spaces read as one
      property, and that survives forty separate generations only
      if one description is literally the source of all of them.

   So the slot names here are the app's own, the bible is stamped
   onto every prompt, and the status column is read from the
   generated manifest rather than from memory.

   USAGE
     node scripts/prompts.mjs            # write media-src/PROMPTS.md
     node scripts/prompts.mjs --missing  # just list what is absent

   Run it again after every batch lands; the status column is the
   queue.
   ============================================================ */

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = path.join(ROOT, 'src', 'data', 'media-manifest.json')
const OUT = path.join(ROOT, 'media-src', 'PROMPTS.md')

/* --- The bible. Kept identical to `houseBible` in
   src/data/experience.js, which is the copy the app renders
   from. If you change one, change both. --- */
const BIBLE = [
  'Single-storey contemporary residence. Full-height glazing on the east elevation, slim blackened-steel frames, deep roof overhang, flat parapet roof.',
  'Wide-plank smoked oak floors throughout the interior; honed basalt on the terrace, laid in the same direction as the oak.',
  'Walls in warm off-white lime plaster, charcoal acoustic fabric, and walnut battens at 40mm centres, with blackened steel reveals.',
  'Concealed cove lighting at 2700K, no visible fittings; landscape lighting from below. Warm, low, directional.',
].join(' ')

const DISCIPLINE =
  'No people. No brand marks or logos. No on-screen text. No visible cabling or speaker boxes on stands. Photoreal architectural photography, full-frame 35mm or 50mm look, natural depth of field, no CGI sheen, no fisheye, no HDR halos.'

/* --- STILLS -------------------------------------------------
   `slot` is the manifest key the app asks for. Nothing here is
   decorative: every entry is referenced by src/data/experience.js
   and will appear as an empty stage or a disabled control until
   it exists. --- */
const STILLS = [
  ['master/exterior', 'The residence at dusk, seen from the approach across a shallow reflecting pool. Warm interior light behind the full-height glazing. Landscape lighting grazing the wall from below. Deep blue sky, last light. Wide establishing shot, camera at eye height.'],
  ['living/base', 'The living area at dusk, looking east toward the glazing and the terrace beyond. Low modular seating in wool, a long walnut console, a large display sitting flush in the plaster. Cove lighting washing the ceiling. Camera at seated eye height, one-point perspective.'],
  ['theatre/base', 'A private cinema. Two tiers of black full-grain leather recliners, ten seats. A large scope screen on the end wall. Walnut battens over charcoal acoustic fabric on the side walls. A fibre-optic star ceiling, dimmed. Step lighting on the aisle. Camera behind and above the back row, symmetrical.'],
  ['outdoor/base', 'The terrace at dusk. Honed basalt paving, a long lap pool lit from within, low weather-resistant lounge seating, a large outdoor display on a blackened-steel frame. Concealed speakers in the soffit. The lit interior visible through the glazing behind. Camera at standing height, looking along the pool.'],
  ['gaming/base', 'A restrained gaming suite built like a study. A long architectural desk in smoked oak, a 49-inch ultrawide display, a single leather task chair. Charcoal acoustic panels on the wall behind. Warm cove lighting only, no RGB, no coloured light. Camera slightly off-axis at desk height.'],
  ['listening/base', 'A dedicated listening room. One leather lounge chair on axis, a pair of walnut floorstanding speakers toed in toward it, walnut-batten acoustic panels, a basalt plinth. Wool rug on smoked oak. Warm low lighting from a concealed cove. Camera behind and slightly above the chair, symmetrical.'],
  ['gallery/base', 'A product gallery wall in the same house. Flush in-wall speakers, in-ceiling apertures and blackened-steel keypads set out on a warm off-white plaster wall, lit by a grazing wash from above. Museum-like, generously spaced. Camera square to the wall.'],
  ['materials/library', 'A materials library. Large samples of smoked oak, honed basalt, blackened steel, walnut, wool acoustic fabric and full-grain leather laid out on a long walnut table, raking warm light from one side. Camera above at 45 degrees.'],
  ['theatre/seating-reclining', 'The same private cinema as theatre/base, identical room, identical camera position, identical lighting. The only change: the seating is manual-recline lounge seating with integrated walnut consoles instead of the fixed-back recliners.'],
  ['theatre/seating-motorised', 'The same private cinema as theatre/base, identical room, identical camera position, identical lighting. The only change: the seating is premium motorised recliners, partially reclined, with powered headrests raised.'],
  ['gaming/racing', 'The same gaming suite as gaming/base, identical room and lighting. The only change: a direct-drive racing simulator rig in blackened steel and leather replaces the desk chair, facing a triple-display array.'],
  ['gaming/simulation', 'The same gaming suite as gaming/base, identical room and lighting. The only change: a full motion simulation platform with a yoke replaces the desk, facing a large projected image.'],
  ['products/in-wall-speaker', 'A single in-wall loudspeaker, flush in warm off-white plaster, magnetic grille half removed to show the cast alloy baffle behind. Grazing warm light. Tight product shot, square to the wall, shallow depth of field.'],
  ['products/in-ceiling-speaker', 'A single in-ceiling loudspeaker, flush in a warm off-white plaster ceiling, pivoting driver visible through the aperture. Warm light. Tight shot looking up at a slight angle.'],
  ['products/invisible-speaker', 'A composite invisible-speaker panel half-plastered into a wall build-up, one edge still exposed to show the panel and its fixings. Warm raking light. Tight shot, square.'],
  ['products/recliner', 'A single motorised cinema recliner in black full-grain leather with a walnut console, three-quarter view, on smoked oak, against charcoal acoustic fabric. Warm low light. Product shot, generous negative space.'],
  ['products/acoustic-panel', 'A single acoustic panel, charcoal wool over a concealed timber frame, one corner cut away to show the mineral wool core. Beside it a walnut-batten variant. Warm raking light. Square product shot.'],
  ['products/control-panel', 'A single flush blackened-steel keypad with four engraved legends, set in warm off-white plaster, backlit at 2700K. Very tight macro, square, shallow depth of field.'],
  ['materials/walnut', 'Macro of quarter-cut American black walnut with a hand-applied matt hardwax oil finish. Open grain readable, raking warm light across the surface. Fills the frame. No object, no context.'],
  ['materials/basalt', 'Macro of honed basalt, dead matt, fine even porosity, charcoal. Raking warm light. Fills the frame. No object, no context.'],
  ['materials/steel', 'Macro of chemically blackened hot-rolled mild steel, waxed, mill finish still visible. Raking warm light. Fills the frame. No object, no context.'],
  ['materials/wool', 'Macro of charcoal woven wool acoustic fabric, flat weave with a slight slub, open enough to read the weave. Raking warm light. Fills the frame. No object, no context.'],
  ['materials/leather', 'Macro of uncorrected full-grain black bull hide, aniline dyed, lightly waxed, natural grain and marks visible. Raking warm light. Fills the frame. No object, no context.'],
  ['materials/oak', 'Macro of wide-plank fumed smoked oak, brushed to lift the grain, matt hardwax oil. Raking warm light. Fills the frame. No object, no context.'],
]

/* --- REELS --------------------------------------------------
   The brief's twelve cinematic moments. `placement` says where it
   is wired; `reserve` means the clip is specified and queued but
   has no slot in the page yet, so generating it is optional until
   one is chosen.

   A reel's poster is a still slot named `<slot>-poster`, so a clip
   can be represented by a single frame before it is filmed. --- */
const REELS = [
  ['arrival/dusk', 'Threshold — the first viewport', 'Slow dolly-in toward the residence at dusk across the reflecting pool. Warm interior light behind full-height glazing. Landscape lighting grazing the wall. The camera never stops and never cuts. 10 seconds.'],
  ['living/walkthrough', 'Chapter 02 — Living Area', 'Slow steadicam walk through the living area toward the east glazing and the terrace beyond, at seated eye height. Cove lighting overhead. The camera never stops and never cuts. 10 seconds.'],
  ['theatre/entry', 'Chapter 03 — Home Theatre', 'Slow push through the theatre doorway into the room, revealing two tiers of leather recliners and the scope screen. Step lighting on the aisle. Star ceiling dimmed overhead. 10 seconds.'],
  ['theatre/screen-on', 'reserve', 'Static locked-off shot of the theatre from behind the back row. The room light dims over four seconds and the screen comes up from black to a soft neutral field. No image content on the screen. 8 seconds.'],
  ['listening/room', 'Chapter 06 — Premium Audio', 'Slow orbit around a pair of walnut floorstanding speakers in the listening room, warm low light, wool rug and smoked oak underfoot. 10 seconds.'],
  ['outdoor/transition', 'reserve', 'Continuous move from inside the living area, through the open glazing, out onto the terrace at dusk. One shot, no cut, camera at standing height. 10 seconds.'],
  ['outdoor/night', 'Chapter 04 — Outdoor Entertainment', 'Slow lateral track along the lit lap pool at night, terrace display glowing, landscape lighting low, the house dark behind. 10 seconds.'],
  ['gaming/reveal', 'Chapter 05 — Gaming Room', 'Slow reveal of the gaming suite from the doorway: architectural desk, ultrawide display, acoustic panels. Warm cove light only, no coloured light. 10 seconds.'],
  ['listening/detail', 'reserve', 'Extreme slow macro drift across a walnut speaker baffle and wool grille in warm raking light. 8 seconds.'],
  ['control/scenes', 'Chapter 07 — Smart Home', 'Locked-off shot of the living area. The lighting transitions through three scenes over ten seconds — bright day, warm evening, near-dark movie. Nothing else in the frame moves. 10 seconds.'],
  ['master/daynight', 'reserve', 'Locked-off exterior of the residence. A full day-to-night transition: afternoon, sunset, dusk, night with the interior lit. Nothing else in the frame moves. 12 seconds.'],
  ['lifestyle/finale', 'reserve', 'Slow crane down the east elevation at night, past the lit interior of each room in turn, ending on the terrace and the pool. One continuous move. 12 seconds.'],

  /* --- The homepage's WHAT'S TONIGHT? section ----------------
     These six are the one place on the site where the house rules
     above are deliberately broken: `DISCIPLINE` opens with "No
     people", and all six of these are ABOUT the people. An empty
     room cannot say "everyone has a reason to stay."

     They are therefore NOT generated from `shot()` below — they
     carry their own bible and their own craft line, and they have
     a dedicated generator that talks to Veo directly:

       node scripts/generate-reels.mjs --dry-run   # read them
       node scripts/generate-reels.mjs             # spend quota

     They are listed here anyway so that `--missing` reports one
     honest queue for the whole site rather than two half-queues
     that drift apart. --- */
  ['tonight/movie-marathon', 'Home — What’s tonight? 01', 'SEE scripts/generate-reels.mjs. Friends deep in leather recliners, absorbed in a film, screen glowing. 8 seconds.'],
  ['tonight/boss-fight', 'Home — What’s tonight? 02', 'SEE scripts/generate-reels.mjs. A player at an architectural desk, ultrawide display, restrained warm light. 8 seconds.'],
  ['tonight/match-day', 'Home — What’s tonight? 03', 'SEE scripts/generate-reels.mjs. Friends reacting to a goal, faces lit by the screen. 8 seconds.'],
  ['tonight/family-takeover', 'Home — What’s tonight? 04', 'SEE scripts/generate-reels.mjs. Three generations sharing the room, warm and unposed. 8 seconds.'],
  ['tonight/party-after-dark', 'Home — What’s tonight? 05', 'SEE scripts/generate-reels.mjs. Terrace at night, outdoor screen, friends around the pool. 8 seconds.'],
  ['tonight/one-more-song', 'Home — What’s tonight? 06', 'SEE scripts/generate-reels.mjs. Late-night lingering, bar, speakers, low warm light. 8 seconds.'],
]

const shot = (body) => `${BIBLE} ${body} ${DISCIPLINE}`

async function main() {
  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
  const kindOf = (slot) => manifest[slot]?.kind ?? null

  const missingStills = STILLS.filter(([slot]) => kindOf(slot) !== 'still')
  const missingReels = REELS.filter(([slot]) => kindOf(slot) !== 'video')

  if (process.argv.includes('--missing')) {
    console.log(`Stills missing (${missingStills.length}/${STILLS.length}):`)
    for (const [slot] of missingStills) console.log(`  ${slot}`)
    console.log(`\nReels missing (${missingReels.length}/${REELS.length}):`)
    for (const [slot, where] of missingReels) console.log(`  ${slot}  (${where})`)
    return
  }

  const lines = []
  lines.push('# JAAZ Experience Centre — render pack')
  lines.push('')
  lines.push('> GENERATED by `node scripts/prompts.mjs`. Do not edit by hand —')
  lines.push('> the slot names below are read by the app, and the status column is')
  lines.push('> read from the build manifest. Re-run after every batch lands.')
  lines.push('')
  lines.push('## How to use this')
  lines.push('')
  lines.push('1. Generate into the slot path shown, as PNG, at least 1376px wide.')
  lines.push('2. Save to `media-src/jaz-home/<slot>.png` (reels: `.mp4`, and/or `.webm`).')
  lines.push('3. Run `node scripts/build-media.mjs` — it writes the AVIF/WebP')
  lines.push('   derivatives and updates the manifest, and the app picks the render')
  lines.push('   up with no code change.')
  lines.push('4. Re-run this script to refresh the queue.')
  lines.push('')
  lines.push('**Generate the master renders first** — `master/exterior`, `theatre/base`,')
  lines.push('`living/base` — and confirm them before spending quota on variants. Every')
  lines.push('later image has to look like the same house as those three.')
  lines.push('')
  lines.push('## The house bible')
  lines.push('')
  lines.push('Stamped onto every prompt below. This paragraph is what makes nine spaces')
  lines.push('read as one property; do not paraphrase it per shot.')
  lines.push('')
  lines.push('> ' + BIBLE)
  lines.push('')
  lines.push('> ' + DISCIPLINE)
  lines.push('')
  lines.push(
    `## Stills — ${STILLS.length - missingStills.length}/${STILLS.length} generated`,
  )
  lines.push('')
  for (const [slot, body] of STILLS) {
    const done = kindOf(slot) === 'still'
    lines.push(`### ${done ? '[x]' : '[ ]'} \`${slot}\``)
    lines.push('')
    lines.push('```')
    lines.push(shot(body))
    lines.push('```')
    lines.push('')
  }

  lines.push(`## Reels — ${REELS.length - missingReels.length}/${REELS.length} generated`)
  lines.push('')
  lines.push('Google Flow / Veo. Slow camera movement, architectural cinematography,')
  lines.push('natural depth of field. No cuts inside a clip: each one is a single')
  lines.push('continuous move, because a cut in a 10-second loop reads as a glitch.')
  lines.push('')
  lines.push('Every reel also wants a poster still at `<slot>-poster` — one frame of')
  lines.push('the same shot. The poster paints first and is what reduced-motion')
  lines.push('visitors see permanently, so it is worth generating even for a clip you')
  lines.push('have not filmed yet.')
  lines.push('')
  for (const [slot, where, body] of REELS) {
    const done = kindOf(slot) === 'video'
    lines.push(`### ${done ? '[x]' : '[ ]'} \`${slot}\``)
    lines.push('')
    lines.push(`Placement: ${where === 'reserve' ? '_reserve — specified, not yet wired_' : where}`)
    lines.push('')
    lines.push('```')
    lines.push(shot(body))
    lines.push('```')
    lines.push('')
  }

  await writeFile(OUT, lines.join('\n'))
  console.log(`Wrote ${path.relative(ROOT, OUT)}`)
  console.log(
    `Stills ${STILLS.length - missingStills.length}/${STILLS.length} · Reels ${
      REELS.length - missingReels.length
    }/${REELS.length}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
