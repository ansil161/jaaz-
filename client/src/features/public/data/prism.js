import { img } from './site'

/* ============================================================
   THE PRISM — one room, five facets

   THE SECTION THIS REPLACES, AND WHY

   The slot held a cinematic "snap": a vector hand drawn into
   frame, a countdown to contact, two frames of blowout, a
   particle throw, and a masked wipe that carried a finished
   cinema in. Four acts across three and a half viewports of
   pinned scroll.

   It argued the point by STORYTELLING, and storytelling is the
   most expensive way to make a claim a composition can make
   instantly. A visitor had to sit through a sequence to reach
   the five states — and the five states are the actual content,
   arriving in the last 40% of a pin most people never finished.

   THE PRISM makes the same claim STRUCTURALLY. One room sits at
   the centre of the composition. Five modes surround it as
   faces of that one object. Nothing has to happen for the idea
   to land: the layout already says it, and scrolling only turns
   the object to a different face.

   "Prism" is the design principle, not the picture. There is no
   glass, no refraction and no spectrum anywhere in this section.
   There is one central object and five faces of it.

   ------------------------------------------------------------
   WHAT IS DELIBERATELY NOT HERE: A SECOND PHOTOGRAPH PER MODE

   The obvious build gives WATCH / PLAY / LISTEN / HOST / ESCAPE
   a picture each, and it is wrong twice over. It needs five
   renders that do not exist, and it disproves the headline in
   the act of illustrating it. So a mode carries no image. It
   carries a GRADE (how the room is lit), a WASH (where the light
   comes from and at what temperature), a VEIL (how much of the
   room the dark keeps) and a FACET (how the aperture around the
   photograph is cut). The plate underneath never moves.

   `plate` is left on the shape, unused and null, for the day
   JAAZ has genuine per-mode photography of a single room. It
   resolves through `hasStill()` like every other slot, so the
   section gets quietly better when those land and needs no
   component change — the same three-state honesty the reels in
   utils/media.js are built on.

   ------------------------------------------------------------
   THE READOUT IS IN ENGLISH, NOT IN UNITS

   The previous build set the readout in AV specifications —
   0.6 fL, 24p, +/-1.5 dB, 9 ms. They are real numbers and they
   were the wrong register for this slot: a visitor deciding
   whether a room is for them cannot price "+/-1.5 dB", and a
   number nobody can read is decoration wearing a lab coat. The
   engineering voice still runs the site — <Calibration> is the
   section that has earned units, and it keeps them. Here the
   same four axes are stated as EXPERIENCE (light, sound, screen,
   ambience) and every value is one plain word.
   ============================================================ */

export const prism = {
  /* The anchor stays `snap`, and so does the chapter mark. The
     interaction changed; the address did not, and a homepage id
     is a public surface. */
  id: 'snap',
  chapter: 'The Snap',

  /* TWO LINES, HARD-BROKEN, AND THE BREAK IS LOAD-BEARING TWICE.

     The eye reads "One room." as a finished sentence before it is
     told there is more than one of them. And the second line has
     to be LONG — long enough to run past the aperture's left edge
     and be cut by the photograph, which is the composition's one
     device (see the claim block in Prism.jsx). Broken into three
     lines, as it was, no line reaches the picture and the device
     silently does not happen. */
  heading: ['One room.', 'Different worlds.'],

  /* One supporting sentence, and only one. The composition is
     doing the arguing; a paragraph here would be the section
     explaining a picture that is already legible. */
  intro:
    'Five atmospheres. One space. Engineered to transform around the way you want to experience it.',

  /* Spoken once, under the index, so the rail is understood as
     something you can drive rather than something you watch. */
  hint: 'Scroll, or choose a face',

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
     one, which is the kind of contradiction a visitor feels
     without being able to name.

     `living/base` is the media lounge, and it can hold every
     face: a large screen with in-wall speakers, a deep modular
     sofa AND separate lounge chairs, a low table between them,
     cove light, and a full-height glass wall onto a lit terrace.
     WATCH and LISTEN are the screen and the speakers; HOST is the
     chairs and the terrace; PLAY is the same screen with the
     lights up; ESCAPE is all of it turned down to the lamp. It is
     also a JAAZ pipeline render rather than a stock interior,
     which is better provenance than the section had before.

     THE FALLBACK IS NOT THE SAME ROOM, and this is the one place
     on the site where that is worth saying out loud rather than
     quietly resolving. `living/base` is in the manifest, so
     `hasStill()` is true and the fallback below is unreachable
     today; it exists for the day the plate is regenerated or
     renamed. There is no stock frame of THIS room, so the choice
     is between a stand-in of the same kind — `livingAlt`, a dark
     media lounge whose sofa already faces a blank wall — and one
     that contradicts four of the five faces. The stand-in wins.

     Requested at 4:5 because the aperture is a portrait-leaning
     architectural cut, and asking the CDN for the crop the frame
     actually shows is the difference between a composed room and
     a 16:9 frame with both ends thrown away. */
  room: {
    still: 'living/base',
    photo: img('livingAlt', 2000, '4:5'),
    alt: 'A JAAZ media lounge: a large screen, a deep sofa and lounge chairs, opening onto a lit terrace',
  },

  /* ---- The five faces ----

     GRADE drives the registered `--plate-*` properties on the
     photograph itself. WASH is a radial light signature laid over
     it — `at` is where the light comes from, `tint` its colour
     temperature, `power` how much of the frame it owns. VEIL is
     flat dark, for the modes that are mostly dark. FACET is how
     the aperture is cut: four chamfers as percentages of the
     frame box, different for every mode, so the object visibly
     TURNS rather than merely re-lighting.

     Chamfers are kept between 3% and 13%. Past that the aperture
     stops reading as an architectural cut and starts reading as a
     gemstone, which is the one thing this section is named after
     and must never look like.

     ALL FIVE ARE TUNED AGAINST THIS PLATE, AND ONLY THIS PLATE.
     They were first written for `theatre/base`, a dedicated
     cinema exposed for the dark, where WATCH at brightness 0.96
     was already a black room. `living/base` is a media lounge
     with cove light, a lit terrace and a glass wall: at the same
     numbers WATCH read as a brightly lit living room captioned
     "the room disappears", which is the caption calling the
     photograph a liar. A grade is a relationship to one
     photograph and does not survive being carried to another.

     DARKNESS COMES FROM `brightness`, NOT FROM `veil`. Both make
     a picture darker and they are not equivalent: flat black over
     the top crushes the whole frame towards grey and takes the
     lit terrace down with everything else, where dropping the
     exposure keeps the contrast between the lamp, the screen and
     the dark around them — which is what a room at 0.6 fL
     actually looks like. The veil is left for the last few per
     cent on the two faces that genuinely go black.

     The range is wide on purpose: 0.46 at ESCAPE against 1.14 at
     HOST is nearly two and a half stops between the darkest and
     brightest face of the same room. A section whose entire claim
     is that one room becomes five worlds cannot make that claim
     inside a quarter of a stop. */
  modes: [
    {
      key: 'watch',
      n: '01',
      word: 'Watch',
      title: 'Reference cinema',
      line: 'The room disappears, and the picture is the only thing left in it.',
      readout: [
        ['Light', 'Focused'],
        ['Sound', 'Immersive'],
        ['Screen', 'Active'],
        ['Ambience', 'Dark'],
      ],
      grade: { brightness: 0.58, contrast: 1.26, saturate: 0.72 },
      wash: { at: '62% 40%', tint: '176, 190, 208', power: 0.26 },
      veil: 0.3,
      facet: { tl: 3, tr: 12, br: 4, bl: 9 },
      plate: null,
    },
    {
      key: 'play',
      n: '02',
      word: 'Play',
      title: 'Low latency, wide open',
      line: 'The picture gets faster than the room, and the room keeps up with it.',
      readout: [
        ['Light', 'Alert'],
        ['Sound', 'Reactive'],
        ['Screen', 'Fast'],
        ['Ambience', 'Charged'],
      ],
      grade: { brightness: 0.88, contrast: 1.24, saturate: 1.1 },
      wash: { at: '66% 46%', tint: '150, 178, 208', power: 0.36 },
      veil: 0.1,
      facet: { tl: 11, tr: 4, br: 11, bl: 3 },
      plate: null,
    },
    {
      key: 'listen',
      n: '03',
      word: 'Listen',
      title: 'Two channels, nothing else',
      line: 'The screen goes dark on purpose, and the room becomes an instrument.',
      readout: [
        ['Light', 'Low'],
        ['Sound', 'Precise'],
        ['Screen', 'Resting'],
        ['Ambience', 'Warm'],
      ],
      grade: { brightness: 0.7, contrast: 1.06, saturate: 0.74 },
      wash: { at: '24% 56%', tint: '214, 168, 116', power: 0.32 },
      veil: 0.2,
      facet: { tl: 5, tr: 10, br: 3, bl: 12 },
      plate: null,
    },
    {
      key: 'host',
      n: '04',
      word: 'Host',
      title: 'House lights, open room',
      line: 'Every seat becomes a good seat, and nobody is watching alone.',
      readout: [
        ['Light', 'Open'],
        ['Sound', 'Background'],
        ['Screen', 'Ambient'],
        ['Ambience', 'Social'],
      ],
      grade: { brightness: 1.14, contrast: 0.98, saturate: 1.04 },
      wash: { at: '50% 74%', tint: '236, 214, 178', power: 0.44 },
      veil: 0.0,
      facet: { tl: 9, tr: 3, br: 12, bl: 5 },
      plate: null,
    },
    {
      key: 'escape',
      n: '05',
      word: 'Escape',
      title: 'Late, lit by almost nothing',
      line: 'Everything drops to the lowest setting the room has, and stays there.',
      readout: [
        ['Light', 'Faint'],
        ['Sound', 'Enveloping'],
        ['Screen', 'Quiet'],
        ['Ambience', 'Intimate'],
      ],
      grade: { brightness: 0.46, contrast: 1.14, saturate: 0.52 },
      wash: { at: '78% 62%', tint: '196, 152, 104', power: 0.22 },
      veil: 0.34,
      facet: { tl: 3, tr: 13, br: 7, bl: 7 },
      plate: null,
    },
  ],
}

export const prismModes = prism.modes
export const prismModeCount = prismModes.length
