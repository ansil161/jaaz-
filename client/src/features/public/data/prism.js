import { img } from './site'

/* ============================================================
   THE PRISM — one room, five faces, stacked

   THE SECTION IN ONE SENTENCE

   Five wide dark bands, each carrying one atmosphere of the same
   room, that slide up over one another as you scroll — so the
   room is re-lit in front of you and the face you just left is
   still physically underneath the one covering it.

   ------------------------------------------------------------
   WHAT THIS REPLACED, TWICE, AND WHAT SURVIVED BOTH TIMES

   1. A cinematic "snap": a drawn hand, a countdown to contact,
      two frames of blowout, a mote throw and a masked wipe across
      3.4 viewports of pinned scroll. It argued by STORYTELLING,
      and put the five atmospheres — the actual content — in the
      last 40% of a pin most visitors never finished.

   2. A pinned composition: the room in a chamfered aperture with
      five markers around it and a reading panel beside it. It
      argued STRUCTURALLY and it worked, but it asked the visitor
      to read a diagram to reach five things that are, in the end,
      five things one after another.

   What survived both is the only part that was ever load-bearing:
   ONE ROOM, FIVE ATMOSPHERES, ONE PHOTOGRAPH. The mechanism has
   changed three times; that claim has not, and nothing in this
   file is allowed to make it false.

   ------------------------------------------------------------
   WHY A STACK IS THE RIGHT MECHANISM FOR THIS CLAIM

   Stacked bands do something no other layout does: the outgoing
   face is still there, directly under the incoming one, at the
   moment of the change. The visitor is not asked to remember what
   WATCH looked like while reading about HOST — the two are one on
   top of the other, edge to edge, for the whole transition. A
   claim about one room becoming five things is best made by an
   A/B comparison, and this is the only layout that gives one for
   free.

   ------------------------------------------------------------
   ONE PHOTOGRAPH, FRAMED FIVE WAYS

   A stack wants visual variety — five bands showing an identical
   picture reads as a bug rather than as an argument. Five
   different pictures would settle that and destroy the section.

   So every face carries a CROP as well as a GRADE. It is the same
   file, the same room and the same furniture; what changes is
   where the frame is put and how tight it is. WATCH pushes in on
   the screen wall. HOST pulls back to the whole room, because
   hosting is a question about how much room there is. LISTEN sits
   with the seating. ESCAPE goes to the far corner and the lamp.

   That is not a trick for disguising repetition — it is what a
   photographer does with one room across five moods, and it makes
   the variety honest instead of bought.

   ------------------------------------------------------------
   EVERY ROW AND EVERY FACE CARRIES A DRAWN MARK

   A readout of eight small words in two rows is a caption, and it
   read as one: the section's most concrete content was also its
   least present. So each face has a glyph and each of the four
   axes has a glyph, drawn in the site's own line work at stroke
   1.25 with square caps (see prismIcons.jsx for why they are
   authored rather than imported from the icon library this repo
   already ships).

   The third item on a readout row is that row's glyph key. It
   lives in the data rather than being mapped from the axis name
   in the component, because the axis name is copy and can be
   rewritten — "Ambience" could become "Mood" tomorrow — and copy
   that silently controls which picture appears is a trap.

   ------------------------------------------------------------
   THE READOUT IS IN ENGLISH, NOT IN UNITS

   An earlier build set it in AV specifications — 0.6 fL, 24p,
   +/-1.5 dB, 9 ms. Real numbers, wrong register: a visitor
   deciding whether a room is for them cannot price "+/-1.5 dB",
   and a number nobody can read is decoration wearing a lab coat.
   The engineering voice still runs the site — <Calibration> has
   earned units and keeps them. Here the same four axes are stated
   as EXPERIENCE, and every value is one plain word.
   ============================================================ */

export const prism = {
  /* The anchor stays `snap`, and so does the chapter mark. The
     interaction has changed three times; the address has not, and
     a homepage id is a public surface. */
  id: 'snap',
  chapter: 'The Snap',

  /* Two lines, hard-broken. The eye reads "One room." as a
     finished sentence before it is told there is more than one of
     them. */
  heading: ['One room.', 'Different worlds.'],

  /* One supporting sentence, and only one. The stack is doing the
     arguing; a paragraph here would be the section explaining a
     picture that is already legible. */
  intro:
    'Five atmospheres. One space. Engineered to transform around the way you want to experience it.',

  /* ---- The room ----

     THE PICTURE HAS TO BE ABLE TO DO ALL FIVE THINGS, and that is
     the whole of how it was chosen.

     This slot held `theatre/base` — the flagship dedicated
     cinema, and a genuinely beautiful plate. It was the wrong
     photograph for this section and no grade could have fixed it:
     it is four rows of FIXED TIERED RECLINERS facing a screen.
     That room can WATCH. It cannot host anybody, there is nowhere
     to play, and nobody is going to describe it as somewhere to
     escape to. So the headline said one room becomes five worlds
     and the evidence underneath it showed a room that can only be
     one — the kind of contradiction a visitor feels without being
     able to name it.

     `living/base` is the media lounge, and it holds every face: a
     large screen with in-wall speakers, a deep modular sofa AND
     separate lounge chairs, a low table between them, cove light,
     and a full-height glass wall onto a lit terrace. It is also a
     JAAZ pipeline render rather than a stock interior, which is
     better provenance than this section had before.

     THE FALLBACK IS NOT THE SAME ROOM, and this is the one place
     on the site worth saying that out loud rather than quietly
     resolving it. `living/base` is in the manifest, so
     `hasStill()` is true and the fallback is unreachable today;
     it exists for the day the plate is regenerated or renamed.
     There is no stock frame of THIS room, so the choice is
     between a stand-in of the same kind — `livingAlt`, a dark
     media lounge whose sofa already faces a blank wall — and one
     that contradicts four of the five faces. The stand-in wins.

     Requested at 3:2. Every band is a wide landscape half-panel,
     so asking the CDN for a portrait crop and throwing away the
     sides is the one thing that would waste bytes here. */
  room: {
    still: 'living/base',
    photo: img('livingAlt', 2200, '3:2'),
    alt: 'A JAAZ media lounge: a large screen, a deep sofa and lounge chairs, opening onto a lit terrace',
  },

  /* ---- The five faces ----

     LOCKUP is the band's headline: a roman line and an italic
     line. It is the site's display voice used the way the rest of
     the page uses it, rather than the shrunken version this
     section had while its claim was squeezed into a sidebar.

     GRADE drives the registered `--plate-*` properties on the
     photograph. WASH is a radial light signature laid over it —
     `at` is where the light comes from, `tint` its colour
     temperature, `power` how much of the frame it owns. VEIL is
     flat dark, for the two faces that genuinely go black. CROP is
     where this face frames the one photograph, and how tight.

     ALL FIVE ARE TUNED AGAINST THIS PLATE, AND ONLY THIS PLATE.
     They were first written for a dedicated cinema exposed for
     the dark, where WATCH at brightness 0.96 was already a black
     room; on a lit lounge the same numbers captioned a brightly
     lit living room "the room disappears", which is the caption
     calling the photograph a liar. A grade is a relationship to
     one photograph and does not survive being carried to another.

     DARKNESS COMES FROM `brightness`, NOT FROM `veil`. Both make
     a picture darker and they are not equivalent: flat black over
     the top crushes the whole frame towards grey and takes the
     lit terrace down with everything else, where dropping the
     exposure keeps the contrast between the lamp, the screen and
     the dark around them — which is what a room at 0.6 fL
     actually looks like.

     The range is wide on purpose. 0.46 at ESCAPE against 1.14 at
     HOST is nearly two and a half stops between the darkest and
     the brightest face of the same room. A section whose whole
     claim is that one room becomes five worlds cannot make it
     inside a quarter of a stop. */
  modes: [
    {
      key: 'watch',
      n: '01',
      word: 'Watch',
      lockup: ['Reference', 'cinema.'],
      line: 'The room disappears, and the picture is the only thing left in it.',
      readout: [
        ['Light', 'Focused', 'light'],
        ['Sound', 'Immersive', 'sound'],
        ['Screen', 'Active', 'screen'],
        ['Ambience', 'Dark', 'ambience'],
      ],
      grade: { brightness: 0.58, contrast: 1.26, saturate: 0.72 },
      wash: { at: '62% 40%', tint: '176, 190, 208', power: 0.26 },
      veil: 0.3,
      /* Pushed in on the screen wall. Watching is the one face
         where the rest of the room is meant to stop existing. */
      crop: { pos: '72% 46%', zoom: 1.2 },
      plate: null,
    },
    {
      key: 'play',
      n: '02',
      word: 'Play',
      lockup: ['Low-latency', 'play.'],
      line: 'The picture gets faster than the room, and the room keeps up with it.',
      readout: [
        ['Light', 'Alert', 'light'],
        ['Sound', 'Reactive', 'sound'],
        ['Screen', 'Fast', 'screen'],
        ['Ambience', 'Charged', 'ambience'],
      ],
      grade: { brightness: 0.88, contrast: 1.24, saturate: 1.1 },
      wash: { at: '66% 46%', tint: '150, 178, 208', power: 0.36 },
      veil: 0.1,
      crop: { pos: '64% 52%', zoom: 1.12 },
      plate: null,
    },
    {
      key: 'listen',
      n: '03',
      word: 'Listen',
      lockup: ['Two-channel', 'listening.'],
      line: 'The screen goes dark on purpose, and the room becomes an instrument.',
      readout: [
        ['Light', 'Low', 'light'],
        ['Sound', 'Precise', 'sound'],
        ['Screen', 'Resting', 'screen'],
        ['Ambience', 'Warm', 'ambience'],
      ],
      grade: { brightness: 0.7, contrast: 1.06, saturate: 0.74 },
      wash: { at: '24% 56%', tint: '214, 168, 116', power: 0.32 },
      veil: 0.2,
      /* With the seating, not the screen — the screen is off. */
      crop: { pos: '34% 58%', zoom: 1.14 },
      plate: null,
    },
    {
      key: 'host',
      n: '04',
      word: 'Host',
      lockup: ['House-lights', 'hosting.'],
      line: 'Every seat becomes a good seat, and nobody is watching alone.',
      readout: [
        ['Light', 'Open', 'light'],
        ['Sound', 'Background', 'sound'],
        ['Screen', 'Ambient', 'screen'],
        ['Ambience', 'Social', 'ambience'],
      ],
      grade: { brightness: 1.14, contrast: 0.98, saturate: 1.04 },
      wash: { at: '50% 74%', tint: '236, 214, 178', power: 0.44 },
      veil: 0.0,
      /* The widest frame in the set, and the only one at zoom 1.
         Hosting is a question about how much room there is, so
         this face answers it by showing all of it. */
      crop: { pos: '50% 50%', zoom: 1.0 },
      plate: null,
    },
    {
      key: 'escape',
      n: '05',
      word: 'Escape',
      lockup: ['Late-night', 'escape.'],
      line: 'Everything drops to the lowest setting the room has, and stays there.',
      readout: [
        ['Light', 'Faint', 'light'],
        ['Sound', 'Enveloping', 'sound'],
        ['Screen', 'Quiet', 'screen'],
        ['Ambience', 'Intimate', 'ambience'],
      ],
      grade: { brightness: 0.46, contrast: 1.14, saturate: 0.52 },
      wash: { at: '78% 62%', tint: '196, 152, 104', power: 0.22 },
      veil: 0.34,
      /* The tightest frame in the set, on the far corner and the
         one lamp still on. */
      crop: { pos: '80% 62%', zoom: 1.26 },
      plate: null,
    },
  ],
}

export const prismModes = prism.modes
export const prismModeCount = prismModes.length
