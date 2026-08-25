import { hasStill } from '../lib/media'

/* ============================================================
   THE JAZ EXPERIENCE CENTRE — CONTENT SOURCE OF TRUTH

   One house, explored room by room. Every string, every asset
   slot and every coordinate the experience renders comes from
   here, so the journey can be re-sequenced without touching a
   component.

   ASSET SLOTS are manifest keys, never paths — see lib/media.js.
   A slot whose render has not been generated yet is NOT an error
   anywhere in this system: a room without a plate renders as an
   empty stage of the right shape, a configurator option without a
   render is shown but disabled, and a moment without a clip falls
   back to its poster and then to its still. That is deliberate.
   The centre is assembled while its renders are still being
   produced, and a build that only works once the last file lands
   is a build nobody can review.

   THE CONFIGURATORS DO NOT WAIT ON RENDERS. This is the most
   important decision in this file. A control panel where every
   option is greyed out pending an asset is a broken promise, so
   an option changes the room through whichever of these it
   declares — and most declare something that costs no asset at
   all:

     grade   a lighting grade applied to the plate (CSS filter)
     array   which speakers are drawn on the plate
     screen  the screen geometry drawn on the plate
     slot    a genuinely different render, when only that will do

   Light, sound layout and screen size are therefore live TODAY,
   on the six renders that already exist. Only the options that
   change physical furniture wait for an image.

   COPY VOICE is architectural annotation, not e-commerce. Short
   declaratives. Facts carry units or materials. No line is an
   adjective doing a specification's job.
   ============================================================ */

/* --- THE HOUSE BIBLE -------------------------------------------
   Not rendered. This is the paragraph every image prompt
   inherits, kept in code rather than in a loose document so it
   cannot drift from what the site actually shows. The brief's
   hardest requirement is that all nine spaces read as ONE
   property — same floor, same glazing, same 2700K light — and
   that only survives forty separate generations if a single
   description is the source of it.

   scripts/prompts.mjs writes media-src/PROMPTS.md from this. */
export const houseBible = {
  architecture:
    'Single-storey contemporary residence. Full-height glazing on the east elevation, slim blackened-steel frames, deep roof overhang, flat parapet roof.',
  floor:
    'Wide-plank smoked oak throughout the interior. Honed basalt on the terrace, laid in the same direction as the oak.',
  walls:
    'Warm off-white lime plaster, charcoal acoustic fabric, and walnut battens at 40mm centres. Blackened steel reveals.',
  light:
    'Concealed cove lighting at 2700K, no visible fittings. Landscape lighting from below. Warm, low, directional.',
  discipline:
    'No people. No brand marks or logos. No on-screen text. No visible cabling. Photoreal architectural photography, natural depth of field, no CGI sheen.',
}

/* --- 01 THRESHOLD ----------------------------------------------
   The first viewport. `reel` is the cinematic arrival; `slot` is
   what stands in until that clip exists, and what reduced-motion
   visitors get permanently. */
export const threshold = {
  headline: ['Experience the', 'extraordinary'],
  /* The word the display face italicises. Data rather than markup
     because the same device runs in the closing section, and two
     copies in two JSX files would drift. */
  accent: 'extraordinary',
  body: 'Step inside a home where technology, design and entertainment come together.',
  primary: { label: 'Enter the experience', to: 'theatre' },
  secondary: { label: 'Explore the house', to: 'plan' },
  reel: 'arrival/dusk',
  slot: 'master/exterior',
  alt: 'The residence at dusk — warm interior light behind full-height glazing, landscape lighting washing the approach',
}

/* --- 02 THE HOUSE ----------------------------------------------
   Nine spaces, in the order the journey visits them.

   `plan` is the room's footprint in the DRAWING's own coordinate
   space (viewBox 0 0 1200 700), which is why these read like
   millimetres rather than percentages: the plan is a drawing, and
   every wall, door opening and label anchor is set in one grid.
   HouseMap scales it; nothing else needs to know it exists.

   `n` is the number printed on the plan and repeated at the head
   of that room's chapter. It earns its place because the drawing
   and the chapter have to be keyed to each other — the visitor
   reads 03 on the plan and finds 03 on the room. */
export const rooms = [
  {
    id: 'entrance',
    n: '01',
    label: 'Entrance',
    nav: 'Entrance',
    plan: { x: 330, y: 500, w: 290, h: 160 },
    slot: 'master/exterior',
    reel: 'arrival/dusk',
    headline: ['The house', 'opens.'],
    body: 'One approach, one threshold, and a house that has already noticed you arrived.',
    alt: 'The entrance of the residence at dusk, warm light behind full-height glazing',
  },
  {
    id: 'living',
    n: '02',
    label: 'Living Area',
    nav: 'Living',
    plan: { x: 40, y: 300, w: 520, h: 200 },
    slot: 'living/base',
    reel: 'living/walkthrough',
    headline: ['A living room that', 'happens to be a cinema.'],
    body: 'Everything integrated, nothing on display. A home first, an entertainment space second.',
    alt: 'A premium living room with integrated audio-visual systems and architectural lighting',
  },
  {
    id: 'theatre',
    n: '03',
    label: 'Home Theatre',
    nav: 'Theatre',
    plan: { x: 40, y: 40, w: 340, h: 260 },
    slot: 'theatre/base',
    reel: 'theatre/entry',
    headline: ['Your private', 'cinema.'],
    body: 'A cinema designed around the way you watch, listen and experience entertainment.',
    alt: 'A private cinema with tiered black leather recliners, a fibre-optic star ceiling and walnut battens over charcoal acoustic fabric',
  },
  {
    id: 'outdoor',
    n: '04',
    label: 'Outdoor Entertainment',
    nav: 'Outdoor',
    /* The plan names a space; the chapter names the experience.
       "Outdoor Entertainment" set across a 260-unit terrace strip
       overran its own walls, and a label that crosses the wall it
       belongs to stops reading as a plan. Architects solve this
       the same way — the drawing says TERRACE. */
    planLabel: 'Terrace',
    plan: { x: 900, y: 40, w: 260, h: 620 },
    slot: 'outdoor/base',
    reel: 'outdoor/night',
    headline: ['Entertainment', 'without boundaries.'],
    body: 'The same system, carried outside. Weather-engineered, and silent until you want it.',
    alt: 'A luxury outdoor entertainment terrace beside a lit pool, with concealed speakers and a large display',
  },
  {
    id: 'gaming',
    n: '05',
    label: 'Gaming Room',
    nav: 'Gaming',
    plan: { x: 640, y: 40, w: 260, h: 260 },
    slot: 'gaming/base',
    reel: 'gaming/reveal',
    headline: ['Play without', 'limits.'],
    body: 'A gaming suite built like a study. Architectural desk, calibrated display, treated walls. No lightshow.',
    alt: 'A restrained luxury gaming suite with an architectural desk, ultrawide display and acoustically treated walls',
  },
  {
    id: 'listening',
    n: '06',
    label: 'Premium Audio',
    nav: 'Audio',
    plan: { x: 380, y: 40, w: 260, h: 260 },
    slot: 'listening/base',
    /* INTERIM. `listening/base` has not been generated yet, and
       an empty stage in the middle of a working speaker selector
       reads as a bug rather than as a pending render. So this room
       borrows the bar plate — a lounge in the same house, same
       floor, same light — until its own render lands, and carries
       its own alt text while it does. `fallbackAlt` is what makes
       that honest: the description matches the photograph actually
       on screen, not the one we intend to replace it with.

       Delete both `fallback` lines the day `listening/base`
       builds; nothing else changes. */
    fallback: 'bar/base',
    fallbackAlt:
      'A lounge in the same residence, in stone and timber with low seating and warm concealed lighting',
    reel: 'listening/room',
    headline: ['Hear every', 'detail.'],
    body: 'A dedicated listening room. Timber, stone and wool, arranged around one seat.',
    alt: 'A private listening lounge with floorstanding speakers, acoustic panels and warm low lighting',
  },
  {
    id: 'control',
    n: '07',
    label: 'Smart Home',
    nav: 'Control',
    plan: { x: 560, y: 300, w: 340, h: 200 },
    slot: 'living/base',
    reel: 'control/scenes',
    headline: ['One house,', 'one gesture.'],
    body: 'Light, shade, climate, sound and access, on scenes rather than on switches.',
    alt: 'A living area moving between lighting scenes',
  },
  {
    id: 'gallery',
    n: '08',
    label: 'Product Experience',
    nav: 'Products',
    planLabel: 'Products',
    plan: { x: 620, y: 500, w: 280, h: 160 },
    slot: 'gallery/base',
    reel: null,
    headline: ['Built in,', 'not bolted on.'],
    body: 'Every product in this house is specified to disappear into it. Here they are, out in the open.',
    alt: 'A product gallery wall of in-wall speakers and architectural fittings',
  },
  {
    id: 'materials',
    n: '09',
    label: 'Materials & Finishes',
    nav: 'Materials',
    planLabel: 'Materials',
    plan: { x: 40, y: 500, w: 290, h: 160 },
    slot: 'materials/library',
    reel: null,
    headline: ['Touch. Discover.', 'Design.'],
    body: 'The library. Every surface in the house, at the scale you actually decide it at.',
    alt: 'A materials library of walnut, basalt, blackened steel and acoustic fabric samples',
  },
]

export const getRoom = (id) => rooms.find((r) => r.id === id) ?? rooms[0]

/**
 * The plate something should actually show, and the alt text that
 * honestly describes it.
 *
 * Anything with a `slot` may also name a `fallback` — another
 * plate from the same house — for use until its own render is
 * generated. The pair is always returned TOGETHER, and always
 * from here, because the failure mode this exists to prevent is a
 * caption describing a photograph the visitor is not looking at.
 *
 * Takes any `{ slot, alt, fallback, fallbackAlt }`, not only a
 * room: the closing sequence's chapters need exactly the same
 * rule, and two implementations of it would drift.
 */
export function roomPlate(subject) {
  if (hasStill(subject.slot)) return { slot: subject.slot, alt: subject.alt }
  if (subject.fallback && hasStill(subject.fallback)) {
    return { slot: subject.fallback, alt: subject.fallbackAlt ?? subject.alt }
  }
  return { slot: subject.slot, alt: subject.alt }
}

/* --- THE DRAWING -----------------------------------------------
   Walls are line SEGMENTS rather than the edges of the room
   rectangles, because a plan drawn from rectangles has no doors —
   every space ends up sealed, which is precisely what makes a
   generated floor plan read as a diagram instead of as
   architecture. Each run below is broken where an opening is, so
   the house reads as something you could walk through.

   Same 1200x700 grid as `rooms[].plan`. */
export const plan = {
  viewBox: '0 0 1200 700',

  /* Structural envelope, broken at the entrance. */
  outer: [
    [40, 40, 1160, 40],
    [1160, 40, 1160, 660],
    [1160, 660, 520, 660],
    [430, 660, 40, 660],
    [40, 660, 40, 40],
  ],

  /* Partitions, broken at every door opening. */
  inner: [
    [40, 300, 190, 300],
    [250, 300, 480, 300],
    [540, 300, 740, 300],
    [800, 300, 900, 300],
    [40, 500, 150, 500],
    [210, 500, 720, 500],
    [780, 500, 900, 500],
    [380, 40, 380, 300],
    [640, 40, 640, 300],
    [560, 300, 560, 380],
    [560, 440, 560, 500],
    [330, 500, 330, 660],
    [620, 500, 620, 660],
  ],

  /* The east elevation, in its own weight. It is the wall the
     whole house is organised around, and a glass wall drawn like
     a masonry wall loses the only reason the terrace and the
     living area read as one space. */
  glazing: [
    [900, 40, 900, 330],
    [900, 470, 900, 660],
  ],

  /* Terrace detail. The pool is what makes the right-hand strip
     legible as outdoors rather than as a corridor. */
  pool: { x: 980, y: 180, w: 140, h: 340 },
}

/* ============================================================
   LIGHTING GRADES

   A scene is a filter over the plate plus a wash over it, and
   between them they are the reason the room can change without a
   second render. Values were set against the theatre master
   rather than in the abstract: `brightness` below 0.45 turns
   these already-dark interiors into black rectangles, so 0.46 is
   the floor and the vignette does the rest of the work.

   `wash` is a colour laid over the plate at `washAlpha`. Cove
   warmth is the house's own 2700K; the cool wash is daylight
   through the east glazing, never a blue "night" filter.
   ============================================================ */
export const grades = {
  cinema: {
    label: 'Cinema',
    filter: 'brightness(0.58) contrast(1.14) saturate(0.9)',
    wash: '#000000',
    washAlpha: 0.22,
    vignette: 0.72,
  },
  screening: {
    label: 'Private Screening',
    filter: 'brightness(0.72) contrast(1.06)',
    wash: '#c9ad7c',
    washAlpha: 0.06,
    vignette: 0.52,
  },
  movie: {
    label: 'Movie Night',
    filter: 'brightness(0.48) contrast(1.2) saturate(0.82)',
    wash: '#000000',
    washAlpha: 0.3,
    vignette: 0.86,
  },
  relax: {
    label: 'Relax',
    filter: 'brightness(0.86) contrast(1.02) saturate(1.04)',
    wash: '#c9ad7c',
    washAlpha: 0.12,
    vignette: 0.4,
  },
  day: {
    label: 'Day',
    filter: 'brightness(1.12) contrast(0.98) saturate(1.02)',
    wash: '#dfe6ec',
    washAlpha: 0.09,
    vignette: 0.24,
  },
  evening: {
    label: 'Evening',
    filter: 'brightness(0.84) contrast(1.05) saturate(1.06)',
    wash: '#c9ad7c',
    washAlpha: 0.14,
    vignette: 0.46,
  },
  night: {
    label: 'Night',
    filter: 'brightness(0.6) contrast(1.16) saturate(0.94)',
    wash: '#0a1420',
    washAlpha: 0.24,
    vignette: 0.78,
  },
  party: {
    label: 'Party',
    filter: 'brightness(0.78) contrast(1.12) saturate(1.14)',
    wash: '#c9ad7c',
    washAlpha: 0.16,
    vignette: 0.5,
  },
  off: {
    label: 'Off',
    filter: 'brightness(0.34) contrast(1.1) saturate(0.7)',
    wash: '#000000',
    washAlpha: 0.42,
    vignette: 0.92,
  },
}

/* ============================================================
   SPEAKER GEOMETRY

   Positions are percentages of the THEATRE PLATE, read off the
   render itself rather than guessed, so a point stays welded to
   the wall it is mounted on at every viewport. Same contract as
   the hotspots.

   `kind` drives how the point is drawn: a subwoofer is a heavier
   mark than a surround, and a ceiling speaker is drawn hollow
   because it fires down at you rather than across the room.
   ============================================================ */
export const speakerPoints = {
  L: { x: 30, y: 47, kind: 'main', label: 'Left' },
  C: { x: 50.5, y: 56, kind: 'main', label: 'Centre' },
  R: { x: 71, y: 47, kind: 'main', label: 'Right' },
  SL: { x: 9, y: 52, kind: 'surround', label: 'Surround L' },
  SR: { x: 92, y: 52, kind: 'surround', label: 'Surround R' },
  SBL: { x: 21, y: 68, kind: 'surround', label: 'Back L' },
  SBR: { x: 80, y: 68, kind: 'surround', label: 'Back R' },
  SW1: { x: 26, y: 79, kind: 'sub', label: 'Subwoofer' },
  SW2: { x: 75, y: 79, kind: 'sub', label: 'Subwoofer' },
  TFL: { x: 38, y: 15, kind: 'height', label: 'Height' },
  TFR: { x: 62, y: 15, kind: 'height', label: 'Height' },
  TRL: { x: 42, y: 27, kind: 'height', label: 'Height' },
  TRR: { x: 58, y: 27, kind: 'height', label: 'Height' },
}

/* ============================================================
   03 THE HOME THEATRE
   ============================================================ */

/* Screen geometry, drawn on the plate. `w` is the width as a
   percentage of the plate and `aspect` its shape — together they
   are why choosing Cinema Projection visibly widens the screen on
   the wall instead of only changing a word in a panel.

   THE RANGE IS MEASURED OFF THE RENDER, NOT CHOSEN IN THE
   ABSTRACT. The end wall of the theatre plate occupies roughly
   41%-71% of the plate width, so a screen drawn at 62% put its
   corner ticks out on the SIDE walls — physically impossible, and
   it read as a broken overlay rather than as a bigger screen.
   These widths span that wall instead: the smallest sits inside
   it, the largest reaches its full width. The jump between
   options is still obvious; it is just obviously on the wall. */
export const theatreChannels = [
  {
    id: 'display',
    label: 'Display',
    options: [
      {
        id: 'oled',
        label: 'Premium OLED',
        hint: '77" OLED, reference black',
        screen: { w: 17, aspect: 16 / 9 },
        spec: '77" · 4K · self-emissive',
      },
      {
        id: 'led',
        label: 'Large-format LED',
        hint: 'Direct-view LED, 1.2mm pitch',
        screen: { w: 22, aspect: 16 / 9 },
        spec: '138" · 4K · direct-view LED',
      },
      {
        id: 'projection',
        label: 'Projection',
        hint: 'Laser projection to a matte white screen',
        screen: { w: 24, aspect: 16 / 9 },
        spec: '120" · 4K laser · 16:9',
      },
      {
        id: 'cinema',
        label: 'Cinema projection',
        hint: 'Scope screen, anamorphic presentation',
        screen: { w: 28, aspect: 2.39 },
        spec: '160" · 4K laser · 2.39:1 scope',
      },
      {
        id: 'ultra',
        label: 'Ultra-large',
        hint: 'Full-wall scope, acoustically transparent',
        screen: { w: 31, aspect: 2.39 },
        spec: '200" · 4K laser · AT weave',
      },
    ],
  },
  {
    id: 'audio',
    label: 'Audio',
    options: [
      {
        id: '5.1',
        label: '5.1',
        hint: 'Five channels and one subwoofer',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SW1'],
        spec: '5 channels · 1 subwoofer',
      },
      {
        id: '7.1',
        label: '7.1',
        hint: 'Adds rear surrounds behind the seating',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1'],
        spec: '7 channels · 1 subwoofer',
      },
      {
        id: '7.2.4',
        label: '7.2.4',
        hint: 'Two subwoofers and four height channels',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1', 'SW2', 'TFL', 'TFR', 'TRL', 'TRR'],
        spec: '7 channels · 2 subwoofers · 4 height',
      },
      {
        id: 'atmos',
        label: 'Dolby Atmos',
        hint: 'Object audio across the full array',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1', 'SW2', 'TFL', 'TFR', 'TRL', 'TRR'],
        spec: 'Object audio · 13 positions',
      },
      {
        id: 'reference',
        label: 'Reference cinema',
        hint: 'Screen channels behind an acoustically transparent screen',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1', 'SW2', 'TFL', 'TFR', 'TRL', 'TRR'],
        spec: 'Cinema processor · behind-screen L/C/R',
      },
    ],
  },
  {
    id: 'seating',
    label: 'Seating',
    options: [
      {
        id: 'fixed',
        label: 'Luxury fixed',
        hint: 'Fixed-back lounge seating in full-grain leather',
        slot: null,
        spec: 'Fixed back · full-grain leather',
      },
      {
        id: 'reclining',
        label: 'Reclining',
        hint: 'Manual recline with integrated console',
        slot: 'theatre/seating-reclining',
        spec: 'Manual recline · console',
      },
      {
        id: 'motorised',
        label: 'Premium motorised',
        hint: 'Motorised recline, lumbar and headrest',
        slot: 'theatre/seating-motorised',
        spec: 'Motorised · lumbar · headrest',
      },
    ],
  },
  {
    id: 'light',
    label: 'Lighting',
    options: [
      { id: 'cinema', label: 'Cinema', hint: 'Lights down, screen only', grade: 'cinema' },
      { id: 'relax', label: 'Relax', hint: 'Cove wash at 2700K', grade: 'relax' },
      { id: 'movie', label: 'Movie Night', hint: 'Aisle light only', grade: 'movie' },
      {
        id: 'screening',
        label: 'Private Screening',
        hint: 'House light at a third',
        grade: 'screening',
      },
    ],
  },
]

/** The state the theatre master render was generated in. */
export const theatreDefaults = {
  display: 'cinema',
  audio: '7.2.4',
  seating: 'fixed',
  light: 'cinema',
}

/* Annotations on the theatre plate. `x` / `y` are percentages of
   the PLATE so a point stays welded to what it annotates at every
   screen size; `side` decides which way the leader draws, so a
   point near an edge never sends its label off the image. */
export const theatreHotspots = [
  {
    id: 'screen',
    label: 'Screen',
    x: 50.5,
    y: 46,
    side: 'right',
    panel: {
      title: 'Calibrated Screen',
      lede: 'Sized to the seating, not to the wall.',
      specs: [
        'Acoustically transparent weave',
        'Screen channels positioned behind the image',
        'Gain matched to room reflectance',
        'Calibrated to the front-row eyeline',
      ],
      cta: { label: 'Explore projection', to: '/solutions' },
    },
  },
  {
    id: 'speakers',
    label: 'Sound',
    x: 90,
    y: 42,
    side: 'left',
    panel: {
      title: 'Integrated Sound',
      lede: 'Heard everywhere. Seen nowhere.',
      specs: [
        'Speakers built into the wall structure',
        'Acoustic fabric drawn across the baffle',
        'Surround array set to seat height',
        'Room-corrected in the finished space',
      ],
      cta: { label: 'Explore acoustics', to: '/solutions' },
    },
  },
  {
    id: 'recliners',
    label: 'Seating',
    x: 50,
    y: 84,
    side: 'right',
    panel: {
      title: 'Luxury Recliner',
      lede: 'Engineered for long-form comfort.',
      specs: [
        'Full-grain leather',
        'Motorised recline',
        'Lumbar support',
        'Adjustable headrest',
        'Integrated console',
      ],
      cta: { label: 'Explore seating', to: '/solutions' },
    },
  },
  {
    id: 'wall',
    label: 'Acoustic Wall',
    x: 12,
    y: 44,
    side: 'right',
    panel: {
      title: 'Acoustic Shell',
      lede: 'The architecture stops arguing with the sound.',
      specs: [
        'Charcoal acoustic fabric on a timber frame',
        'Walnut battens at 40mm centres',
        'Absorption tuned per surface',
        'First reflection points treated',
      ],
      cta: { label: 'Explore the craft', to: '/solutions' },
    },
  },
  {
    id: 'ceiling',
    label: 'Star Ceiling',
    x: 50,
    y: 11,
    side: 'right',
    panel: {
      title: 'Fibre-Optic Ceiling',
      lede: 'A sky that dims with the room.',
      specs: [
        'Hand-set fibre-optic points',
        'Single remote illuminator',
        'Dimmable with the house scenes',
        'No heat and no maintenance at the ceiling',
      ],
      cta: { label: 'Explore ceilings', to: '/solutions' },
    },
  },
  {
    id: 'lighting',
    label: 'Lighting',
    x: 30,
    y: 20,
    side: 'right',
    panel: {
      title: 'Architectural Lighting',
      lede: 'Four scenes, one button each.',
      specs: [
        'Concealed cove wash',
        'Step lighting on the aisle',
        'Scene control at every entrance',
        'Tuned to 2700K throughout',
      ],
      cta: { label: 'Explore lighting', to: '/solutions' },
    },
  },
]

/* --- Discover the room ------------------------------------------
   Six beats. `focus` is the point the composition moves toward
   and `scale` how far it pushes — a camera move expressed as two
   numbers rather than as six separate renders.

   Beats 01 and 06 are deliberately identical: the sequence opens
   on the whole room and returns to it, so the detail beats read
   as having been ABOUT something rather than as a slideshow that
   happened to stop. */
export const theatreStory = [
  {
    id: 'room',
    index: '01',
    title: 'The room',
    body: 'Every surface in this space is doing acoustic work. None of it announces itself.',
    focus: { x: 50, y: 50 },
    scale: 1,
  },
  {
    id: 'screen',
    index: '02',
    title: 'The screen',
    body: 'Sized to the seating distance and calibrated to the front-row eyeline, not to the width of the wall.',
    focus: { x: 50.5, y: 46 },
    scale: 1.5,
  },
  {
    id: 'sound',
    index: '03',
    title: 'The sound',
    body: 'The speakers sit inside the wall structure, behind acoustic fabric, aligned to seat height.',
    focus: { x: 84, y: 44 },
    scale: 1.42,
  },
  {
    id: 'seating',
    index: '04',
    title: 'The seating',
    body: 'Ten recliners on two tiers. The rear row is raised exactly enough to clear the sightline in front of it.',
    focus: { x: 50, y: 78 },
    scale: 1.38,
  },
  {
    id: 'lighting',
    index: '05',
    title: 'The light',
    body: 'A concealed cove, a step-lit aisle and a fibre-optic sky, all on one scene control.',
    focus: { x: 42, y: 16 },
    scale: 1.45,
  },
  {
    id: 'complete',
    index: '06',
    title: 'The complete room',
    body: 'Picture, sound, seating and light, commissioned together and signed off as one system.',
    focus: { x: 50, y: 50 },
    scale: 1,
  },
]

/* ============================================================
   04 EXPERIENCE THE DIFFERENCE

   Two real specifications of the same room, held against each
   other. The rows are matched pairs — every line exists on both
   sides — because a comparison where one column has entries the
   other lacks is a feature list wearing a comparison's clothes.
   ============================================================ */
export const compare = {
  heading: ['Experience', 'the difference.'],
  body: 'The same room, specified two ways. Move the divide, and the difference stops being a number.',
  a: {
    id: 'a',
    name: 'System A',
    sub: 'Living-room theatre',
    slot: 'living/base',
    grade: 'relax',
  },
  b: {
    id: 'b',
    name: 'System B',
    sub: 'Reference cinema',
    slot: 'theatre/base',
    grade: 'cinema',
  },
  rows: [
    { label: 'Display', a: '85" OLED', b: '160" 4K laser' },
    { label: 'Resolution', a: '4K HDR', b: '4K HDR, calibrated' },
    { label: 'Aspect', a: '16:9', b: '2.39:1 scope' },
    { label: 'Audio channels', a: '5.1', b: '7.2.4 object audio' },
    { label: 'Speakers', a: 'In-wall, in-ceiling', b: 'Behind-screen L/C/R, in-wall surrounds' },
    { label: 'Subwoofers', a: 'One, concealed', b: 'Two, corner-loaded' },
    { label: 'Acoustic treatment', a: 'Soft furnishing and rug', b: 'Full acoustic shell, treated first reflections' },
    { label: 'Lighting', a: 'Dimmable cove', b: 'Four scenes, step-lit aisle, star ceiling' },
    { label: 'Seating', a: 'Existing sofa', b: 'Ten recliners on two tiers' },
  ],
}

/* ============================================================
   05 OUTDOOR — the same house, three times of day
   ============================================================ */
export const outdoorTimes = [
  {
    id: 'day',
    label: 'Day',
    grade: 'day',
    slot: 'outdoor/base',
    note: 'Shading closes as the sun comes round. The display sleeps; the audio does not.',
  },
  {
    id: 'evening',
    label: 'Evening',
    grade: 'evening',
    slot: 'outdoor/base',
    note: 'Landscape lighting comes up from below. The terrace and the living area become one room.',
  },
  {
    id: 'night',
    label: 'Night',
    grade: 'night',
    slot: 'outdoor/base',
    note: 'Pool light on, house light down, and the screen becomes the brightest thing outside.',
  },
]

/* ============================================================
   06 GAMING
   ============================================================ */
export const gamingChannels = [
  {
    id: 'display',
    label: 'Display',
    options: [
      { id: 'oled', label: 'OLED', hint: '48" OLED at desk distance', screen: { w: 19, aspect: 16 / 9 }, spec: '48" OLED · 138Hz' },
      { id: 'ultrawide', label: 'Ultra-wide', hint: '49" 32:9, one continuous field', screen: { w: 27, aspect: 32 / 9 }, spec: '49" · 32:9 · 240Hz' },
      { id: 'ledwall', label: 'LED wall', hint: 'Direct-view LED behind the desk', screen: { w: 33, aspect: 16 / 9 }, spec: '1.5mm pitch · direct-view' },
      { id: 'projection', label: 'Projection', hint: 'Laser projection for couch play', screen: { w: 38, aspect: 16 / 9 }, spec: '120" · 4K laser' },
    ],
  },
  {
    id: 'audio',
    label: 'Audio',
    options: [
      { id: 'headphones', label: 'Headphones', hint: 'Open-back, on a desk stand', array: [], spec: 'Open-back · binaural' },
      { id: '5.1', label: '5.1', hint: 'Five channels and one subwoofer', array: ['L', 'C', 'R', 'SL', 'SR', 'SW1'], spec: '5 channels · 1 subwoofer' },
      { id: '7.1', label: '7.1', hint: 'Adds rear surrounds', array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1'], spec: '7 channels · 1 subwoofer' },
      {
        id: 'atmos',
        label: 'Dolby Atmos',
        hint: 'Height channels for positional audio',
        array: ['L', 'C', 'R', 'SL', 'SR', 'SBL', 'SBR', 'SW1', 'TFL', 'TFR', 'TRL', 'TRR'],
        spec: 'Object audio · 12 positions',
      },
    ],
  },
  {
    id: 'mode',
    label: 'Experience',
    options: [
      { id: 'gaming', label: 'Gaming', hint: 'Desk, chair, single display', grade: 'screening', spec: 'Desk · single seat' },
      { id: 'racing', label: 'Racing', hint: 'Direct-drive rig, triple field', grade: 'movie', slot: 'gaming/racing', spec: 'Direct drive · load cell' },
      { id: 'simulation', label: 'Simulation', hint: 'Full motion platform', grade: 'cinema', slot: 'gaming/simulation', spec: 'Motion platform · yoke' },
      { id: 'esports', label: 'Esports', hint: 'Low-latency chain, two seats', grade: 'relax', spec: '240Hz · sub-frame latency' },
    ],
  },
]

export const gamingDefaults = { display: 'ultrawide', audio: 'atmos', mode: 'gaming' }

/* ============================================================
   07 PREMIUM AUDIO — five ways to put sound in a room

   `points` are percentages of the LISTENING plate. Choosing a
   speaker type does not swap the render; it moves where the
   speakers ARE, which is the actual decision being made.

   `detail` is the four-way exploration the brief asks for:
   materials, acoustic performance, design, technical.
   ============================================================ */
export const speakerTypes = [
  {
    id: 'floorstanding',
    label: 'Floorstanding',
    lede: 'The speaker is furniture, and is meant to be.',
    points: [
      { x: 27, y: 62 },
      { x: 73, y: 62 },
    ],
    detail: {
      materials: 'Solid walnut baffle, aluminium cabinet, wool grille.',
      acoustic: 'Full-range to 28Hz. No subwoofer required in a room this size.',
      design: 'Floor-standing, 1180mm. Sits proud of the wall on a stone plinth.',
      technical: '3-way · 28Hz–40kHz · 88dB sensitivity · 4Ω',
    },
  },
  {
    id: 'bookshelf',
    label: 'Bookshelf',
    lede: 'The smallest thing that still images properly.',
    points: [
      { x: 29, y: 52 },
      { x: 71, y: 52 },
    ],
    detail: {
      materials: 'Walnut veneer over MDF, cast alloy baffle.',
      acoustic: 'To 42Hz. Pairs with one concealed subwoofer.',
      design: 'Stand-mounted at 700mm, tweeter on the seated ear axis.',
      technical: '2-way · 42Hz–35kHz · 86dB sensitivity · 6Ω',
    },
  },
  {
    id: 'in-wall',
    label: 'In-wall',
    lede: 'Flush with the plaster, and gone.',
    points: [
      { x: 22, y: 46 },
      { x: 78, y: 46 },
      { x: 50, y: 46 },
    ],
    detail: {
      materials: 'Steel back-box, paintable magnetic grille, no visible frame.',
      acoustic: 'Sealed back-box so the wall cavity cannot colour the sound.',
      design: 'Zero-bezel, plastered in flush. Painted with the wall.',
      technical: '3-way · 45Hz–22kHz · 89dB sensitivity · sealed enclosure',
    },
  },
  {
    id: 'in-ceiling',
    label: 'In-ceiling',
    lede: 'For the channels that should come from above.',
    points: [
      { x: 34, y: 17 },
      { x: 66, y: 17 },
      { x: 38, y: 28 },
      { x: 62, y: 28 },
    ],
    detail: {
      materials: 'Steel back-box, pivoting alloy driver, paintable grille.',
      acoustic: 'Aimed at the listening position rather than straight down.',
      design: 'Flush, 165mm aperture. Set out on the ceiling grid, not on the joists.',
      technical: '2-way pivoting · 55Hz–22kHz · 88dB sensitivity',
    },
  },
  {
    id: 'invisible',
    label: 'Invisible',
    lede: 'Plastered over. There is nothing to see, by design.',
    points: [
      { x: 16, y: 40 },
      { x: 84, y: 40 },
    ],
    detail: {
      materials: 'Composite panel, skimmed and painted as part of the wall.',
      acoustic: 'The panel itself radiates. Dispersion is wide; imaging is soft by nature.',
      design: 'Completely concealed. No grille, no aperture, no reveal.',
      technical: 'Flat-panel radiator · 80Hz–20kHz · requires a subwoofer',
    },
  },
]

export const speakerDetailOrder = [
  { id: 'materials', label: 'Materials' },
  { id: 'acoustic', label: 'Acoustic performance' },
  { id: 'design', label: 'Design' },
  { id: 'technical', label: 'Technical' },
]

/* ============================================================
   08 SMART HOME — four scenes

   Each scene names what actually MOVES. `steps` are ordered and
   played back one at a time so the visitor watches automation
   happen rather than reading that it can. `grade` is the light
   the room lands on when the scene finishes.
   ============================================================ */
export const scenes = [
  {
    id: 'arrive',
    label: 'Arrive Home',
    slot: 'living/base',
    grade: 'relax',
    steps: [
      { channel: 'Entrance', action: 'Path and entrance lights to 40%' },
      { channel: 'Curtains', action: 'Sheers open, blackout stays closed' },
      { channel: 'Climate', action: 'Living area to 23°C' },
      { channel: 'Audio', action: 'Living and kitchen zones on, low' },
      { channel: 'Video', action: 'Living display wakes to art mode' },
    ],
  },
  {
    id: 'movie',
    label: 'Movie Night',
    slot: 'theatre/base',
    grade: 'movie',
    steps: [
      { channel: 'Curtains', action: 'Blackout closes' },
      { channel: 'Lighting', action: 'House to 10%, aisle light on' },
      { channel: 'Video', action: 'Projector on, scope masking out' },
      { channel: 'Audio', action: 'Processor to reference, subs armed' },
      { channel: 'Climate', action: 'Theatre to 21°C, fans to silent' },
    ],
  },
  {
    id: 'party',
    label: 'Party',
    slot: 'outdoor/base',
    grade: 'party',
    steps: [
      { channel: 'Audio', action: 'Indoor and outdoor zones linked' },
      { channel: 'Lighting', action: 'Cove to 60%, landscape lighting on' },
      { channel: 'Outdoor', action: 'Pool light on, terrace display on' },
      { channel: 'Shading', action: 'Terrace shading retracts' },
      { channel: 'Access', action: 'Side gate unlocked until midnight' },
    ],
  },
  {
    id: 'goodnight',
    label: 'Good Night',
    slot: 'master/exterior',
    grade: 'off',
    steps: [
      { channel: 'Lighting', action: 'All zones off, night path at 5%' },
      { channel: 'Access', action: 'Every door locked and confirmed' },
      { channel: 'Security', action: 'Perimeter armed, cameras recording' },
      { channel: 'Climate', action: 'Bedrooms to 22°C, rest to setback' },
      { channel: 'Audio', action: 'All zones off' },
    ],
  },
]

/* ============================================================
   09 PRODUCTS

   `inSpace` is where the product sits in `room` — the coordinates
   "View in space" flies the plate to. A product without one can
   still be read; it just cannot be placed.
   ============================================================ */
export const products = [
  {
    id: 'in-wall-speaker',
    name: 'In-Wall Speaker',
    type: 'Loudspeaker',
    lede: 'Flush with the plaster, painted with the wall.',
    slot: 'products/in-wall-speaker',
    room: 'theatre/base',
    inSpace: { x: 90, y: 42, scale: 1.6 },
    specs: [
      ['Configuration', '3-way, sealed back-box'],
      ['Frequency response', '45Hz – 22kHz'],
      ['Sensitivity', '89dB / 2.83V / 1m'],
      ['Impedance', '6Ω nominal'],
      ['Cut-out', '312 × 512mm'],
      ['Depth', '92mm'],
    ],
    materials: 'Steel back-box, cast alloy baffle, magnetic paintable grille.',
    finishes: ['Paintable white', 'Charcoal fabric', 'Walnut trim'],
    technology: 'Sealed enclosure so the stud cavity cannot colour the midrange.',
    installation: 'New-build brackets or retrofit dog-ears. Plastered flush, no reveal.',
    compatible: 'Any JAZ cinema or whole-house system.',
  },
  {
    id: 'in-ceiling-speaker',
    name: 'In-Ceiling Speaker',
    type: 'Loudspeaker',
    lede: 'Aimed at the seat, not at the floor.',
    slot: 'products/in-ceiling-speaker',
    room: 'theatre/base',
    inSpace: { x: 50, y: 15, scale: 1.7 },
    specs: [
      ['Configuration', '2-way, pivoting'],
      ['Frequency response', '55Hz – 22kHz'],
      ['Sensitivity', '88dB / 2.83V / 1m'],
      ['Aperture', '165mm'],
      ['Depth', '104mm'],
      ['Aiming', '±20° pivot'],
    ],
    materials: 'Steel back-box, pivoting alloy driver, paintable grille.',
    finishes: ['Paintable white', 'Matt black'],
    technology: 'Pivoting driver so height channels arrive on-axis at the seat.',
    installation: 'Set out on the ceiling grid. Back-box required in treated ceilings.',
    compatible: 'Atmos and 7.2.4 configurations.',
  },
  {
    id: 'invisible-speaker',
    name: 'Invisible Speaker',
    type: 'Loudspeaker',
    lede: 'Skimmed into the wall. Nothing to see.',
    slot: 'products/invisible-speaker',
    room: 'living/base',
    inSpace: { x: 20, y: 40, scale: 1.5 },
    specs: [
      ['Configuration', 'Flat-panel radiator'],
      ['Frequency response', '80Hz – 20kHz'],
      ['Sensitivity', '86dB / 2.83V / 1m'],
      ['Panel', '620 × 320 × 26mm'],
      ['Finish', 'Skimmed and painted in situ'],
      ['Subwoofer', 'Required'],
    ],
    materials: 'Composite panel, plaster-skimmed as part of the wall build-up.',
    finishes: ['As the wall'],
    technology: 'The panel radiates. Dispersion is wide; there is no listening axis to miss.',
    installation: 'Fixed before plastering. Not retrofittable without opening the wall.',
    compatible: 'Whole-house audio and living-room systems.',
  },
  {
    id: 'recliner',
    name: 'Motorised Recliner',
    type: 'Seating',
    lede: 'Engineered for a three-hour film.',
    slot: 'products/recliner',
    room: 'theatre/base',
    inSpace: { x: 50, y: 84, scale: 1.5 },
    specs: [
      ['Recline', 'Motorised, infinite positions'],
      ['Headrest', 'Powered, independent'],
      ['Lumbar', 'Powered, four-stage'],
      ['Seat width', '760mm'],
      ['Wall clearance', '80mm'],
      ['Console', 'Integrated, powered'],
    ],
    materials: 'Full-grain leather over moulded foam, steel frame, walnut console.',
    finishes: ['Black', 'Tan', 'Cream', 'Dark brown'],
    technology: 'Wall-hugging mechanism so the back row keeps its sightline when reclined.',
    installation: 'Power to each seat position. Set out on the riser before joinery.',
    compatible: 'Fixed and tiered theatre layouts.',
  },
  {
    id: 'acoustic-panel',
    name: 'Acoustic Panel',
    type: 'Treatment',
    lede: 'The wall stops arguing with the sound.',
    slot: 'products/acoustic-panel',
    room: 'theatre/base',
    inSpace: { x: 12, y: 44, scale: 1.6 },
    specs: [
      ['Core', 'Mineral wool, 60mm'],
      ['NRC', '0.95'],
      ['Frame', 'Timber, concealed'],
      ['Facing', 'Acoustic fabric or walnut batten'],
      ['Module', '600 × 2400mm'],
      ['Fixing', 'Concealed french cleat'],
    ],
    materials: 'Mineral wool core, timber frame, charcoal acoustic fabric or walnut battens.',
    finishes: ['Charcoal fabric', 'Warm grey fabric', 'Walnut batten'],
    technology: 'Absorption tuned per surface, with first reflection points treated hardest.',
    installation: 'Set out to the room, not to the panel module. Cut on site.',
    compatible: 'Theatre, listening room and gaming suite.',
  },
  {
    id: 'control-panel',
    name: 'Wall Keypad',
    type: 'Control',
    lede: 'Four scenes, one button each.',
    slot: 'products/control-panel',
    room: 'living/base',
    inSpace: { x: 78, y: 52, scale: 1.8 },
    specs: [
      ['Buttons', 'Four or six, engraved'],
      ['Finish', 'Solid metal, no plastic'],
      ['Mounting', 'Flush, no visible fixings'],
      ['Backlight', 'Adjustable, 2700K'],
      ['Back-box', 'Standard single gang'],
      ['Protocol', 'Wired bus'],
    ],
    materials: 'Machined brass or blackened steel, laser-engraved legends.',
    finishes: ['Blackened steel', 'Brushed brass', 'Matt white'],
    technology: 'Wired rather than wireless, so a scene never waits for a network.',
    installation: 'One at each entrance to a room, at handle height.',
    compatible: 'Every JAZ control system.',
  },
]

/* ============================================================
   10 MATERIALS — touch, discover, design
   ============================================================ */
export const materials = [
  {
    id: 'walnut',
    name: 'Natural Walnut',
    lede: 'Natural walnut veneer, hand-finished.',
    slot: 'materials/walnut',
    swatch: '#5a4030',
    origin: 'American black walnut, quarter-cut for a straight, quiet figure.',
    texture: 'Open grain, left readable under an oil finish rather than filled flat.',
    finish: 'Hand-applied hardwax oil. Matt, 5% sheen.',
    variations: ['Natural', 'Smoked', 'Fumed dark'],
    applications: 'Acoustic battens, joinery, seating consoles, speaker baffles.',
    products: ['acoustic-panel', 'recliner'],
  },
  {
    id: 'basalt',
    name: 'Honed Basalt',
    lede: 'Dense volcanic stone, honed to a dead matt.',
    slot: 'materials/basalt',
    swatch: '#3b3d40',
    origin: 'Quarried basalt, cut from a single block per project so the tone holds.',
    texture: 'Fine, even porosity. Cool to the hand and audibly hard.',
    finish: 'Honed, not polished. No reflection to fight the lighting.',
    variations: ['Charcoal', 'Grey', 'Black'],
    applications: 'Terrace paving, plinths, bar tops, speaker bases.',
    products: [],
  },
  {
    id: 'steel',
    name: 'Blackened Steel',
    lede: 'Chemically blackened, waxed, never painted.',
    slot: 'materials/steel',
    swatch: '#22232a',
    origin: 'Hot-rolled mild steel, blackened in an oxide bath.',
    texture: 'The mill finish stays visible. Every sheet is slightly its own.',
    finish: 'Waxed. Ages by hand contact and is meant to.',
    variations: ['Blackened', 'Waxed graphite'],
    applications: 'Glazing frames, reveals, keypads, shelving, screen surrounds.',
    products: ['control-panel'],
  },
  {
    id: 'wool',
    name: 'Acoustic Wool',
    lede: 'Woven wool, chosen by absorption before colour.',
    slot: 'materials/wool',
    swatch: '#4a4a4c',
    origin: 'European wool, woven open enough to pass sound into the core behind it.',
    texture: 'Flat weave with a slight slub. Reads as fabric, not as felt.',
    finish: 'Railroaded across the frame so there is no seam on a wall run.',
    variations: ['Charcoal', 'Warm grey', 'Oatmeal'],
    applications: 'Acoustic panels, speaker grilles, theatre walls, ceiling rafts.',
    products: ['acoustic-panel', 'in-wall-speaker'],
  },
  {
    id: 'leather',
    name: 'Full-Grain Leather',
    lede: 'Aniline-finished hide, uncorrected.',
    slot: 'materials/leather',
    swatch: '#6b4a35',
    origin: 'European bull hide, full-grain and uncorrected.',
    texture: 'The grain is the hide’s own. Marks are not defects.',
    finish: 'Aniline dyed through, lightly waxed.',
    variations: ['Black', 'Tan', 'Cream', 'Dark brown'],
    applications: 'Recliners, lounge seating, bar stools, headrests.',
    products: ['recliner'],
  },
  {
    id: 'oak',
    name: 'Smoked Oak',
    lede: 'The floor the whole house is set out from.',
    slot: 'materials/oak',
    swatch: '#7a6248',
    origin: 'European oak, fumed with ammonia so the colour is in the timber, not on it.',
    texture: 'Wide plank, brushed to lift the grain, 220mm.',
    finish: 'Hardwax oil, matt. Repairable in place.',
    variations: ['Smoked', 'Natural', 'Dark smoked'],
    applications: 'Flooring throughout, stair treads, theatre risers.',
    products: [],
  },
]

export const materialDetailOrder = [
  { id: 'origin', label: 'Origin' },
  { id: 'texture', label: 'Texture' },
  { id: 'finish', label: 'Finish' },
  { id: 'applications', label: 'Applications' },
]

/* ============================================================
   11 LIFESTYLE — the house across one day
   ============================================================ */
export const lifestyle = {
  heading: ['Technology that disappears', 'into your lifestyle.'],
  accent: 'disappears',
  body: 'Every detail is designed to work together — quietly, intelligently and beautifully.',
  chapters: [
    {
      id: 'morning',
      label: 'Morning',
      slot: 'living/base',
      grade: 'day',
      line: 'Shades lift with the sun. The house is warm before anyone asks it to be.',
    },
    {
      id: 'afternoon',
      label: 'Afternoon',
      slot: 'outdoor/base',
      grade: 'day',
      line: 'Doors open, the terrace joins the living room, and the audio follows you out.',
    },
    {
      id: 'sunset',
      label: 'Sunset',
      slot: 'listening/base',
      /* Same interim as the listening room's own chapter — see
         the note on that room. Without it this beat of the closing
         sequence is a black frame, which is the last thing the
         visitor sees. */
      fallback: 'bar/base',
      alt: 'The listening room at sunset',
      fallbackAlt: 'A lounge in the same residence at sunset, in stone and timber under warm low light',
      grade: 'evening',
      line: 'One room, one seat, one record. The rest of the house goes quiet.',
    },
    {
      id: 'night',
      label: 'Night',
      slot: 'theatre/base',
      grade: 'movie',
      line: 'Blackout closes, the aisle lights, and the room disappears around the picture.',
    },
  ],
  cta: { label: 'Design your experience', to: '/contact#consultation' },
  secondary: { label: 'Book a consultation', to: '/contact' },
}

/* --- Closing ---------------------------------------------------- */
export const yourRoom = {
  heading: ['What could your', 'space become?'],
  accent: 'become?',
  body: 'Send us the room as it stands today — a photograph, a plan, or the dimensions on the back of an envelope. We will show you what it could hold.',
  primary: { label: 'Design your experience', to: '/contact#consultation' },
  secondary: { label: 'Book a consultation', to: '/contact' },
}
