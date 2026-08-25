import { img } from './site'

/* ============================================================
   PROJECTS — THE WORK, AS DATA

   One array. Everything the /projects index and every
   /projects/:slug detail page renders comes from here, so a new
   project is a new object and nothing else — no new component,
   no new route, no new layout.

   PROVENANCE OF THE COPY
   `title`, `location`, `category` and `summary` are the six
   entries already shipped in data/site.js's homepage rail, moved
   here unchanged so the same room is never described two ways on
   one site. Everything ADDED for this page — `year`, `overview`,
   `services`, `spec`, `technology` and the image captions — is
   written from what those entries already claim and nothing
   further. It is placeholder-grade in exactly one respect: JAZ
   has to confirm the YEARS and hand over its own photography.
   No price, no client name and no capability the site does not
   already claim appears below.

   PHOTOGRAPHY
   Every picture is a SLOT NAME resolved through `img()` against
   the verified plate map in data/site.js. That is a hard rule on
   this codebase: an invented Unsplash id is a broken image in
   production, and there is no way to tell from the string which
   one you have. Slots are cast against what the photograph
   actually SHOWS rather than what its name suggests — `chair`
   renders as a bar/lobby and `screenWall` as a lit pool at dusk,
   so they are used accordingly.

   ASPECT IS REQUESTED, NOT CROPPED IN CSS. The CDN crops on
   demand, so a portrait plate is fetched portrait rather than
   fetched wide and half of it thrown away behind `object-fit`.
   ============================================================ */

/** The widths every plate is offered at. Four steps covers a phone
 *  through a 2x ultrawide without shipping a 2400px file to a 390px
 *  screen — the single biggest weight win available on a page that is
 *  almost entirely photography. */
const WIDTHS = [640, 1024, 1600, 2400]

/**
 * `plate('theatre', '3:2')` -> everything an <img> needs for that slot.
 *
 * Returns `src` (a middle step, so a browser that ignores srcset still
 * gets something sane), `srcSet` across all four widths, and the
 * intrinsic `ratio` so the layout can reserve the box before the file
 * lands. Nothing on this page sets a pixel size on a photograph.
 */
export const plate = (slot, ratio = '3:2') => {
  const [w, h] = ratio.split(':').map(Number)
  return {
    src: img(slot, 1600, ratio),
    srcSet: WIDTHS.map((width) => `${img(slot, width, ratio)} ${width}w`).join(', '),
    ratio: w / h,
  }
}

/* Filters, and the rule that makes them worth having.

   `tags` names what a room IS ABOUT, not every discipline that
   touched it. Tagged by services-present, every one of these six
   carried `audio` and `smart` — JAZ does not build a room without
   engineered sound or without control — so two of the seven filters
   returned the entire catalogue. A filter that changes nothing is
   worse than a missing one: it reads as broken, and it teaches the
   visitor that the others probably do not work either.

   So a project carries a tag only where that discipline is the
   POINT of the room. The Long Room is a reference cinema, so it is
   `theatre` and `audio`; it also has lighting control, and that is
   not what anyone is looking for it under. Every filter now returns
   a genuine subset, and none returns nothing. */
export const projectFilters = [
  { id: 'all', label: 'All' },
  { id: 'theatre', label: 'Home Theatre' },
  { id: 'audio', label: 'Premium Audio' },
  { id: 'smart', label: 'Smart Home' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'corporate', label: 'Corporate' },
]

export const projectsIntro = {
  title: 'Projects',
  sub: 'Spaces designed around the way you live, listen, watch and experience.',
  scrollHint: 'Scroll to explore',
  hero: plate('theatre', '16:9'),
  heroAlt: 'A completed private cinema, tiered recliners under a warm cove.',
  standfirst:
    'Six rooms out of the last two hundred. Every one surveyed, engineered, calibrated and signed off by the same team that drew it.',
}

/* ------------------------------------------------------------
   THE WORK

   `story` is what the INDEX shows for a project: the opening
   plate, then two frames that carry the room without asking
   anyone to open the project. `gallery` is the detail page's
   longer read. They deliberately share little — opening a
   project should show you something the index did not.

   `kind` drives the composition, and the five are the whole
   vocabulary: `open` (the cinematic entrance, scrubbed open),
   `wide` (landscape, held in the column), `portrait` (tall,
   offset), `full` (edge to edge, viewport height), `note` (a
   plate with one detail beside it).
   ------------------------------------------------------------ */
export const projects = [
  {
    id: 1,
    n: '01',
    slug: 'the-long-room',
    title: ['The Long', 'Room'],
    flatTitle: 'The Long Room',
    location: 'Bengaluru',
    category: 'Private Theatre',
    year: '2024',
    meta: 'Private theatre · 11 seats',
    tags: ['theatre', 'audio'],
    summary:
      'A basement nobody else would quote on. Three tiers, a decoupled floor and a 2.39:1 masked screen.',
    overview: [
      'The room arrived as a long, low basement with a services run down one side and a ceiling height that ruled out a conventional three-row layout. Everyone who surveyed it before us quoted a two-row compromise.',
      'We took the depth instead of fighting it. Three tiers, each riser set from a sightline drawn to the bottom of the picture rather than the middle of it, a floating floor decoupled from the slab, and a masked screen that changes shape for the film instead of leaving black bars across it.',
    ],
    services: [
      'Home Theatre',
      'Acoustic Design',
      'Premium Audio',
      'Seating',
      'Lighting Control',
      'Calibration',
    ],
    spec: [
      ['Seats', '11 across three tiers'],
      ['Screen', '2.39:1, motorised masking'],
      ['Floor', 'Decoupled from the slab'],
      ['Handover', 'Calibrated, one button'],
    ],
    hero: {
      ...plate('theatre', '16:9'),
      alt: 'The finished theatre, three tiers of recliners facing a masked screen.',
    },
    story: [
      { kind: 'open', ...plate('theatre', '3:2'), alt: 'The room from the back tier, screen lit.' },
      {
        kind: 'portrait',
        ...plate('fluted', '3:4'),
        alt: 'Fluted acoustic panelling running the length of the side wall.',
      },
      {
        kind: 'wide',
        ...plate('projection', '16:9'),
        alt: 'The projector beam cutting through the darkened room.',
      },
    ],
    gallery: [
      { kind: 'full', ...plate('theatre', '21:9'), alt: 'The room at full width from the projection wall.' },
      {
        kind: 'note',
        ...plate('shell', '4:3'),
        alt: 'The basement as surveyed, before any work.',
        title: 'What we were handed',
        body: 'Civil-finished, services down one wall, and a ceiling that ruled out the obvious layout.',
      },
      { kind: 'portrait', ...plate('fluted', '3:4'), alt: 'Absorption at the first reflection point.' },
      { kind: 'wide', ...plate('tech', '3:2'), alt: 'The rack, terminated and labelled.' },
      { kind: 'full', ...plate('comfortRoom', '16:9'), alt: 'The finished room, lights down.' },
    ],
    technology: [
      {
        label: 'Home Theatre',
        body: 'A dedicated room built around one seat, then made to work for eleven.',
        ...plate('theatre', '4:3'),
      },
      {
        label: 'Acoustic Design',
        body: 'Absorption at the reflection points, diffusion behind the last row, a decoupled floor under all of it.',
        ...plate('fluted', '4:3'),
      },
      {
        label: 'Premium Audio',
        body: 'Every channel placed to the layout, then measured and corrected in the room it lives in.',
        ...plate('tech', '4:3'),
      },
      {
        label: 'Lighting Control',
        body: 'Four scenes on one keypad. Nobody hunts for a dimmer once the film has started.',
        ...plate('projection', '4:3'),
      },
    ],
  },

  {
    id: 2,
    n: '02',
    slug: 'low-latency',
    title: ['Low', 'Latency'],
    flatTitle: 'Low Latency',
    location: 'Kochi',
    category: 'Gaming Room',
    year: '2025',
    meta: 'Gaming room · 4 stations',
    tags: ['gaming'],
    summary: 'Positional audio and a 120 Hz projector, with lighting scenes cued off the console.',
    overview: [
      'Four players, one room, and a brief that put response time above everything else. A gaming room that adds a frame of lag to look good has failed at the only thing it was built for.',
      'The picture path is 120 Hz end to end. The audio is placed for position rather than for spectacle, so a footstep arrives from where it happened. The lighting takes its cue from the console, which means the room changes state without anyone touching a panel.',
    ],
    services: ['Gaming Room', 'Premium Audio', 'Lighting Control', 'Automation'],
    spec: [
      ['Stations', 'Four, independently switched'],
      ['Picture', '120 Hz, low-latency path'],
      ['Audio', 'Positional, not cinematic'],
      ['Lighting', 'Cued from the console'],
    ],
    hero: {
      ...plate('slatted', '16:9'),
      alt: 'The curved slatted gaming room, seating facing the screen wall.',
    },
    story: [
      { kind: 'open', ...plate('slatted', '3:2'), alt: 'The slatted wall curving around the seating.' },
      { kind: 'portrait', ...plate('tech', '3:4'), alt: 'The equipment tower behind the stations.' },
      { kind: 'wide', ...plate('livingAlt', '16:9'), alt: 'The room in its low-light scene.' },
    ],
    gallery: [
      { kind: 'full', ...plate('slatted', '21:9'), alt: 'The full width of the slatted wall.' },
      {
        kind: 'note',
        ...plate('livingAlt', '4:3'),
        alt: 'The room lit for play rather than for film.',
        title: 'Lit for play',
        body: 'A cinema wants the walls dark. A gaming room wants them alive without washing the screen — a different problem, solved with placement rather than brightness.',
      },
      { kind: 'portrait', ...plate('fluted', '3:4'), alt: 'Absorption behind the stations, out of the sightline.' },
      { kind: 'wide', ...plate('projection', '3:2'), alt: 'The 120 Hz throw.' },
      { kind: 'full', ...plate('tech', '16:9'), alt: 'The rack that runs the room.' },
    ],
    technology: [
      {
        label: 'Gaming Room',
        body: 'Four stations that switch independently, on one shared picture and one shared sound field.',
        ...plate('slatted', '4:3'),
      },
      {
        label: 'Premium Audio',
        body: 'Positional first. Placement is set to the seats, then corrected for the room.',
        ...plate('tech', '4:3'),
      },
      {
        label: 'Lighting Control',
        body: 'Scenes cued off the console, so the room follows the game rather than the other way round.',
        ...plate('livingAlt', '4:3'),
      },
      {
        label: 'Automation',
        body: 'One press takes the room from lit to playing, and one press puts it back.',
        ...plate('fluted', '4:3'),
      },
    ],
  },

  {
    id: 3,
    n: '03',
    slug: 'the-boardroom-cut',
    title: ['The Boardroom', 'Cut'],
    flatTitle: 'The Boardroom Cut',
    location: 'Dubai',
    category: 'Screening Room',
    year: '2025',
    meta: 'Corporate screening · 16 seats',
    tags: ['corporate', 'theatre'],
    summary: 'A conference room by day that closes down into a reference cinema by six.',
    overview: [
      'Two rooms sharing one volume. Between nine and six it is a board table under even, neutral light with speech intelligibility as the specification. After six it closes down and becomes a reference screening room.',
      'Nothing is wheeled in or out. The treatment that keeps speech legible across a long table is the same treatment the screening needs; the lighting, masking and audio profile change on a schedule and the room changes with them.',
    ],
    services: ['Screening Room', 'Acoustic Design', 'Premium Audio', 'Automation'],
    spec: [
      ['Seats', '16 at the table'],
      ['Modes', 'Two, on a schedule'],
      ['Acoustics', 'Speech first, film second'],
      ['Control', 'Automated changeover'],
    ],
    hero: {
      ...plate('modern', '16:9'),
      alt: 'The room in its daytime configuration, long table under even light.',
    },
    story: [
      { kind: 'open', ...plate('modern', '3:2'), alt: 'The architectural interior in daylight mode.' },
      { kind: 'portrait', ...plate('grand', '3:4'), alt: 'The room at height, from the head of the table.' },
      { kind: 'wide', ...plate('dining', '16:9'), alt: 'The table under its evening scene.' },
    ],
    gallery: [
      { kind: 'full', ...plate('modern', '21:9'), alt: 'The full volume of the room.' },
      {
        kind: 'note',
        ...plate('dining', '4:3'),
        alt: 'The table in the evening configuration.',
        title: 'Six o’clock',
        body: 'The changeover is a schedule, not a request. Lighting, masking and audio profile move together, and the room is already the other thing when you walk back in.',
      },
      { kind: 'portrait', ...plate('grand', '3:4'), alt: 'Height and proportion at the head of the room.' },
      { kind: 'wide', ...plate('projection', '3:2'), alt: 'Projection into the darkened room.' },
      { kind: 'full', ...plate('tech', '16:9'), alt: 'The rack serving both modes.' },
    ],
    technology: [
      {
        label: 'Screening Room',
        body: 'One volume, two calibrations. Neither is a compromise on the other.',
        ...plate('modern', '4:3'),
      },
      {
        label: 'Acoustic Design',
        body: 'Speech intelligibility across a long table is the harder brief. Solve that and the film looks after itself.',
        ...plate('grand', '4:3'),
      },
      {
        label: 'Premium Audio',
        body: 'Two profiles, stored and recalled — conference and cinema are not the same sound field.',
        ...plate('tech', '4:3'),
      },
      {
        label: 'Automation',
        body: 'The room changes on a schedule. Nobody is asked to remember to change it.',
        ...plate('dining', '4:3'),
      },
    ],
  },

  {
    id: 4,
    n: '04',
    slug: 'sunday-matinee',
    title: ['Sunday', 'Matinee'],
    flatTitle: 'Sunday Matinee',
    location: 'Chennai',
    category: 'Living Room System',
    year: '2026',
    meta: 'Living room system',
    tags: ['theatre', 'smart'],
    summary:
      'Every speaker concealed, every cable buried. The room reads as a living room until it does not.',
    overview: [
      'The brief was the one we hear most often and the hardest to deliver: cinema sound in a room that had to keep working as the room the family actually lives in. Nothing on show. No black boxes.',
      'Every driver sits behind a finish, and every cable was buried during the interior fit-out — which is why this project is decided at the drawing stage rather than the installation stage. A concealed system designed after the plaster is a system with trunking on the wall.',
    ],
    services: ['Living Room Theatre', 'Concealed Audio', 'Smart Home', 'Lighting Control'],
    spec: [
      ['Visible hardware', 'None'],
      ['Cabling', 'Buried at fit-out'],
      ['Sound', 'Full range, concealed'],
      ['Control', 'One remote, four scenes'],
    ],
    hero: { ...plate('fire', '16:9'), alt: 'The living room at dusk, fire lit and screen dark.' },
    story: [
      { kind: 'open', ...plate('fire', '3:2'), alt: 'The lounge with the fire lit, screen at rest.' },
      { kind: 'portrait', ...plate('livingAlt', '3:4'), alt: 'The dark lounge under its evening scene.' },
      { kind: 'wide', ...plate('dining', '16:9'), alt: 'Through to the dining table, on the same audio zone.' },
    ],
    gallery: [
      { kind: 'full', ...plate('fire', '21:9'), alt: 'The room across its full width.' },
      {
        kind: 'note',
        ...plate('livingAlt', '4:3'),
        alt: 'The lounge with the lights down.',
        title: 'Nothing on show',
        body: 'Concealment is a drawing-stage decision. Everything here was routed before the plaster went on, which is the only version of this that has no trunking in it.',
      },
      { kind: 'portrait', ...plate('fluted', '3:4'), alt: 'A finish detail with absorption behind the surface.' },
      { kind: 'wide', ...plate('tech', '3:2'), alt: 'The rack, out of the room entirely.' },
      { kind: 'full', ...plate('dining', '16:9'), alt: 'The adjoining dining space on the same system.' },
    ],
    technology: [
      {
        label: 'Living Room Theatre',
        body: 'Cinema performance inside a room that has to stay a living room in daylight.',
        ...plate('fire', '4:3'),
      },
      {
        label: 'Concealed Audio',
        body: 'Full-range sound from behind the finishes, placed before the finishes existed.',
        ...plate('fluted', '4:3'),
      },
      {
        label: 'Smart Home',
        body: 'Lighting, climate and entertainment answering to one system rather than four apps.',
        ...plate('livingAlt', '4:3'),
      },
      {
        label: 'Lighting Control',
        body: 'Four scenes, one keypad, and a room that dims itself when the film starts.',
        ...plate('dining', '4:3'),
      },
    ],
  },

  {
    id: 5,
    n: '05',
    slug: 'nightcap',
    title: ['Nightcap'],
    flatTitle: 'Nightcap',
    location: 'Kochi',
    category: 'Bar & Lounge',
    year: '2025',
    meta: 'Bar & lounge',
    tags: ['audio', 'smart'],
    summary: 'Distributed audio tuned for conversation first, with a screen that drops when it is wanted.',
    overview: [
      'A bar is the one entertainment room where the audio must not win. Tuned like a cinema it makes conversation work; tuned for conversation it disappears and the room fills up.',
      'Level is held even across the whole floor rather than peaked at the centre, so nobody raises their voice as they cross it. The screen is there for the match and gone the rest of the time.',
    ],
    services: ['Distributed Audio', 'Bar & Lounge', 'Smart Home', 'Lighting Control'],
    spec: [
      ['Coverage', 'Even across the floor'],
      ['Tuning', 'Conversation first'],
      ['Screen', 'Drops on demand'],
      ['Zones', 'Bar, lounge, terrace'],
    ],
    hero: { ...plate('bar', '16:9'), alt: 'The warm timber home bar under low light.' },
    story: [
      { kind: 'open', ...plate('bar', '3:2'), alt: 'The bar, lit low and warm.' },
      { kind: 'portrait', ...plate('chair', '3:4'), alt: 'The lounge seating off the bar.' },
      { kind: 'wide', ...plate('dining', '16:9'), alt: 'The adjoining table on the same zone.' },
    ],
    gallery: [
      { kind: 'full', ...plate('bar', '21:9'), alt: 'The bar across the full width of the room.' },
      {
        kind: 'note',
        ...plate('chair', '4:3'),
        alt: 'Lounge seating beyond the bar.',
        title: 'Even, not loud',
        body: 'Level is held across the floor rather than peaked at the middle. You can cross the room without anyone changing how they are speaking.',
      },
      { kind: 'portrait', ...plate('livingAlt', '3:4'), alt: 'The lounge at its lowest scene.' },
      { kind: 'wide', ...plate('terraceAlt', '3:2'), alt: 'The terrace zone, carried on the same system.' },
      { kind: 'full', ...plate('dining', '16:9'), alt: 'The table under the evening scene.' },
    ],
    technology: [
      {
        label: 'Distributed Audio',
        body: 'One system across bar, lounge and terrace, each zone at its own level.',
        ...plate('bar', '4:3'),
      },
      {
        label: 'Bar & Lounge',
        body: 'Tuned so the room can be full and still hold a conversation.',
        ...plate('chair', '4:3'),
      },
      {
        label: 'Smart Home',
        body: 'Zones, sources and scenes on one control rather than a drawer of remotes.',
        ...plate('livingAlt', '4:3'),
      },
      {
        label: 'Lighting Control',
        body: 'The light drops with the level. The room closes down as one thing.',
        ...plate('terraceAlt', '4:3'),
      },
    ],
  },

  {
    id: 6,
    n: '06',
    slug: 'open-air',
    title: ['Open', 'Air'],
    flatTitle: 'Open Air',
    location: 'Goa',
    category: 'Terrace Cinema',
    year: '2026',
    meta: 'Terrace cinema',
    tags: ['outdoor', 'theatre'],
    summary: 'Weather-rated throughout, calibrated twice — once for still air and once for the monsoon.',
    overview: [
      'Outside there are no walls to reflect from and no ceiling to hold the sound down. Everything a room does for you for free has to be replaced by placement and power.',
      'Every component is weather-rated, and the system is calibrated twice: once for a still evening, and once for the monsoon, when the air itself is a different medium. Both profiles are stored and recalled by name.',
    ],
    services: ['Outdoor Cinema', 'Weather-Rated Audio', 'Lighting Control', 'Automation'],
    spec: [
      ['Rating', 'Weather-rated throughout'],
      ['Calibration', 'Two stored profiles'],
      ['Picture', 'Sized for ambient dusk'],
      ['Control', 'One button, outdoors'],
    ],
    hero: {
      ...plate('terrace', '16:9'),
      alt: 'The terrace at dusk, lounge seating facing the screen wall.',
    },
    story: [
      { kind: 'open', ...plate('terrace', '3:2'), alt: 'The terrace as the light goes.' },
      { kind: 'portrait', ...plate('terraceAlt', '3:4'), alt: 'The rooftop lounge after dark.' },
      { kind: 'wide', ...plate('screenWall', '16:9'), alt: 'The lit pool and screen wall at dusk.' },
    ],
    gallery: [
      { kind: 'full', ...plate('screenWall', '21:9'), alt: 'The pool and screen wall across the full terrace.' },
      {
        kind: 'note',
        ...plate('terraceAlt', '4:3'),
        alt: 'The rooftop lounge at night.',
        title: 'Calibrated twice',
        body: 'A still evening and a monsoon evening are two different rooms. Both are measured, stored and recalled by name.',
      },
      { kind: 'portrait', ...plate('terrace', '3:4'), alt: 'Seating at the edge of the terrace.' },
      { kind: 'wide', ...plate('projection', '3:2'), alt: 'The throw across the open deck.' },
      { kind: 'full', ...plate('bar', '16:9'), alt: 'The bar that serves the terrace.' },
    ],
    technology: [
      {
        label: 'Outdoor Cinema',
        body: 'A picture sized for ambient dusk rather than for a dark room that does not exist out here.',
        ...plate('terrace', '4:3'),
      },
      {
        label: 'Weather-Rated Audio',
        body: 'Every component rated for the season it will sit through.',
        ...plate('screenWall', '4:3'),
      },
      {
        label: 'Lighting Control',
        body: 'Landscape, pool and deck falling away together as the film starts.',
        ...plate('terraceAlt', '4:3'),
      },
      {
        label: 'Automation',
        body: 'One button, outdoors, in the rain, with wet hands. It has to be one button.',
        ...plate('projection', '4:3'),
      },
    ],
  },
]

/** The detail page's closing block. Same shape as every other CTA on
 *  the site, so it renders through the shared <ClosingCta>. */
export const projectsCta = {
  heading: ['Discover what’s', 'possible.'],
  body: 'Tell us the room, the budget band and how you want to use it. One reply within a working day, from the person who would run the project.',
  action: 'Book a Consultation',
  reassurance: 'One reply within a working day.',
}

/** `/projects/:slug` -> the project, or undefined for an unknown slug. */
export const projectBySlug = (slug) => projects.find((p) => p.slug === slug)

/** The next project in catalogue order, wrapping at the end — so a
 *  detail page always has somewhere to go that is not "back". */
export const nextProject = (slug) => {
  const i = projects.findIndex((p) => p.slug === slug)
  return projects[(i + 1) % projects.length]
}
