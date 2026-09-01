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

  /* Three lines, hard-broken, and the break is the point: the eye
     reads "One room." as a finished sentence before it is told
     there is more than one of them. */
  heading: ['One room.', 'Different', 'worlds.'],

  /* One supporting sentence, and only one. The composition is
     doing the arguing; a paragraph here would be the section
     explaining a picture that is already legible. */
  intro:
    'Five atmospheres. One space. Engineered to transform around the way you want to experience it.',

  /* Spoken once, under the index, so the rail is understood as
     something you can drive rather than something you watch. */
  hint: 'Scroll, or choose a face',

  /* ---- The room ----

     THE STILL AND THE FALLBACK ARE THE SAME ROOM, and on this
     section that is not tidiness, it is the headline. Everywhere
     else on the site a `<Plate>` slot and its stock fallback are
     allowed to be two different pictures of the same IDEA,
     because nothing is claiming they are one place. Here the
     entire argument is "one room", so a fallback that showed a
     different lounge would make the section false for every
     visitor who ever saw it before the render landed — and that
     is the state the site has shipped in for months.

     `theatre/base` is the pipeline's own plate. `theatre` in
     site.js is the photograph it was built from: tiered
     recliners, a screen wall, warm cove light. Dark, exposed for
     the dark, and therefore able to survive being re-lit five
     ways — which a daylit interior cannot, at any grade.

     Requested at 4:5 because the aperture is a portrait-leaning
     architectural cut, and asking the CDN for the crop the frame
     actually shows is the difference between a composed room and
     a 16:9 frame with both ends thrown away. */
  room: {
    still: 'theatre/base',
    photo: img('theatre', 2000, '4:5'),
    alt: 'A JAAZ private entertainment room, seating facing the screen wall under low warm light',
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
     and must never look like. */
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
      grade: { brightness: 0.96, contrast: 1.16, saturate: 0.88 },
      wash: { at: '50% 30%', tint: '198, 176, 138', power: 0.3 },
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
      grade: { brightness: 1.06, contrast: 1.2, saturate: 1.04 },
      wash: { at: '68% 44%', tint: '150, 178, 208', power: 0.4 },
      veil: 0.12,
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
      grade: { brightness: 0.92, contrast: 1.04, saturate: 0.72 },
      wash: { at: '26% 60%', tint: '214, 168, 116', power: 0.32 },
      veil: 0.24,
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
      grade: { brightness: 1.12, contrast: 1.0, saturate: 1.0 },
      wash: { at: '50% 76%', tint: '236, 214, 178', power: 0.48 },
      veil: 0.04,
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
      grade: { brightness: 0.86, contrast: 1.08, saturate: 0.6 },
      wash: { at: '80% 66%', tint: '186, 146, 104', power: 0.22 },
      veil: 0.4,
      facet: { tl: 3, tr: 13, br: 7, bl: 7 },
      plate: null,
    },
  ],
}

export const prismModes = prism.modes
export const prismModeCount = prismModes.length
