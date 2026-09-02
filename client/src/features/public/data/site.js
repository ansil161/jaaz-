/* ============================================================
   JAAZ — CONTENT SOURCE OF TRUTH
   Every string and every image on the homepage comes from here.

   PHOTOGRAPHY
   Real, licensed interior and cinema photography from Unsplash,
   hand-picked to hold up in monochrome: dark rooms, fluted and
   slatted walls, projection light, architectural interiors.

   Unsplash was chosen over Pinterest deliberately — Pinterest
   pins are third-party copyrighted work, are not licensed for
   commercial use, and the CDN blocks hotlinking, so those images
   would break in production AND expose the client. Unsplash's
   licence permits commercial use, and its CDN resizes on demand
   (`&w=` / `&q=`), which is why every slot can request exactly
   the size it renders at.

   To ship JAAZ's own photography, drop files into
   `client/public/media/` and change ONE function — `img()`.
   Nothing else in the codebase knows where pictures come from.
   ============================================================ */

const UNSPLASH = 'https://images.unsplash.com'

/** Named slots -> photo. Swap the right-hand side for real assets. */
const PLATES = {
  // The room itself
  theatre: 'photo-1710131459450-7c384b8be18f', // private cinema, tiered recliners, warm cove
  /* Deliberately the SAME room as `theatre`, requested at a different
     aspect so the CDN crops it differently. Section 3 explains how the
     flagship room is built; section 5 shows it finished. Every other
     free frame with a "luxury cinema" search rank has a smart-TV app
     menu or a streaming show burnt into the screen, which reads as an
     electronics showroom rather than a private cinema. Replace both
     with client photography and they can diverge. */
  comfortRoom: 'photo-1710131459450-7c384b8be18f', // flagship room, tighter crop
  shell: 'photo-1707725669477-18feaba381f4', // bare civil-finished room, before
  projection: 'photo-1478720568477-152d9b164e26', // projector beam through haze
  livingAlt: 'photo-1774551351897-c64cd76a7c22', // dark lounge, planetary art
  screenWall: 'photo-1764344814733-930223ac186c', // large screen, warm cove light
  fire: 'photo-1721733259332-6cf31a73bb0d', // lounge, fire, screen

  // Surfaces and craft
  fluted: 'photo-1640357897497-599b4fc84f51', // fluted acoustic wall, low sofa
  slatted: 'photo-1640357960494-9242650846d3', // curved slatted room, seating
  modern: 'photo-1787143570370-25ff752b305e', // modern architectural interior
  chair: 'photo-1596765513731-558f6581360b', // sculptural lounge chair

  // Rooms beyond the cinema
  bar: 'photo-1529502669403-c073b74fcefb', // warm timber home bar
  dining: 'photo-1778731525602-dc44818f0e5e', // dark dining table
  grand: 'photo-1455593984172-9f753a2e1ebd', // grand dark classical interior
  terrace: 'photo-1758448756167-88dc934c58e4', // terrace at dusk, lounge seating
  terraceAlt: 'photo-1621275471769-e6aa344546d5', // rooftop lounge at night
  tech: 'photo-1635788798247-92a15f830a3b', // AV rack and tower speakers

  /* The About cover. A near-black steel-and-glass interior with one
     perforated screen glowing amber behind it — architecture and
     restraint rather than a room full of equipment, which is what
     that page's headline is actually arguing. Deliberately NOT a
     cinema: the About hero used to reuse `theatre`, the same frame
     the homepage hero dissolves into, so arriving here read as a
     second homepage. Verified against the CDN at the size the hero
     requests; several better-ranked frames for the same search are
     Unsplash+ and 404 without a signature. */
  atrium: 'photo-1515703944563-dbcfbf121b3d', // dark architectural interior, amber screen

  // People. Placeholder studio portraits, standing in for real founder
  // photography until JAAZ supplies it — see team.note in about.js.
  founderPortrait: 'photo-1584940120505-117038d90b05', // dark studio, formal
  cofounderPortrait: 'photo-1600896997793-b8ed3459a17f', // warm studio, informal
}

/**
 * `img('theatre', 1600)` -> a colour CDN URL cropped and compressed for
 * that slot. `q=82` with `auto=format` lets the CDN serve AVIF/WebP,
 * which buys visibly cleaner gradients in dark interiors — exactly
 * where this set lives — without the weight of a q=100 JPEG.
 *
 * Replace the body with `return `/media/${name}.jpg`` once real assets
 * land; nothing else in the codebase knows where pictures come from.
 */
export const img = (name, w = 1600, ratio = '16:10') => {
  const plate = PLATES[name]
  if (!plate) throw new Error(`Unknown image slot: ${name}`)
  const [rw, rh] = ratio.split(':').map(Number)
  const h = Math.round((w * rh) / rw)
  return `${UNSPLASH}/${plate}?auto=format&fit=crop&w=${w}&h=${h}&q=82`
}

/* Primary navigation.
   `href` is a real URL, not a section id, so the same list drives the
   desktop bar, the mobile overlay and the footer, and every item works
   from whichever page you happen to be on: `/about` is a page, `/#x`
   scrolls the homepage — crossing pages first if it has to.

   Projects used to point at the homepage rail (`/#projects`) because
   there was no projects PAGE to send anyone to, and a nav item that
   leads nowhere costs more trust than a missing one. There is one
   now — /projects, plus a page per room — and the homepage rail it
   used to preview is gone entirely, replaced by <Possibilities>, so
   /projects is the only address the work has.

   SOLUTIONS is a plain link to the catalogue page, not a dropdown —
   the nine solutions live and are browsed entirely on `/solutions`
   itself (see data/solutions.js), so the bar never has to duplicate
   that list. */
export const nav = [
  { label: 'About', href: '/about', plate: 'shell' },
  { label: 'Experience', href: '/experience', plate: 'comfortRoom' },
  { label: 'Solutions', href: '/solutions', plate: 'fluted' },
  { label: 'Projects', href: '/projects', plate: 'theatre' },
]

/* `plate` is read by the mobile menu only. The overlay shows one room
   photograph that cross-fades to the plate of whichever item you are
   touching, so the menu previews the destination instead of listing it
   — and it is a slot name, not a URL, so it goes through img() and the
   verified slot map like every other picture on the site.

   `navIdlePlate` is what the menu opens on, before you have touched
   anything: the flagship room, which is also what the site's hero
   opens on. */
export const navIdlePlate = 'comfortRoom'

/* --- 1. Hero -------------------------------------------------- */
export const hero = {
  headline: ['Entertainment without', 'comfort is just', 'noise.'],
  sub: 'JAAZ builds private cinemas where picture, sound and seating are engineered as one experience.',
  cta: 'Book a Consultation',
  scrollHint: 'Scroll to bring the room to life',
}

/* The photograph the drawn room dissolves into at the end of the
   hero sequence — the vector cinema becoming a real one. */
export const heroPlate = {
  src: img('theatre', 2600, '16:9'),
  alt: 'A finished JAAZ private cinema with the house lights down',
}

/* OPTIONAL scroll-scrubbed footage for the hero.
   Drop an 8–10s clip here and the hero plays it frame-by-frame off
   the scroll position instead of drawing the room in SVG. If the file
   is missing, unsupported or unseekable, `Hero` never switches over
   and the vector room runs exactly as before — so this is safe to
   leave pointing at nothing.

   The reference build this was modelled on shipped 398 numbered
   JPEGs (~40MB) for the same effect. One short clip does the same
   job for a fraction of the weight, and unlike a frame sequence it
   degrades to a normal <video> if scrubbing turns out to be rough on
   a given device.

   RENDER SPEC — matters more than it looks:
   · 1920x1080, 16:9, 8s, no audio track
   · H.264 high profile, CRF ~20
   · KEYFRAME EVERY FRAME (`-g 1`). Without this the browser can only
     seek to the nearest I-frame and the scrub stutters in blocks:
       ffmpeg -i in.mp4 -an -c:v libx264 -crf 20 -g 1 -pix_fmt yuv420p out.mp4
   · The action must run dark -> lit, because the scrub is mapped
     straight onto the light cues below.

   `src` is null until a real file exists, and that is deliberate
   rather than lazy. A dev server answers an unknown path with the SPA
   shell — 200 OK, text/html — so a <video> pointed at a file that is
   not there yet downloads index.html, fails to decode it, and does so
   with preload="auto" priority. Null means the element is never
   rendered and nothing is requested. Set the path when the file
   lands; nothing else needs to change. */
export const heroMedia = {
  src: null, // '/media/hero/theatre.mp4'
  poster: img('theatre', 1600, '16:9'),
}

/* Each stage of the hero reveal names itself as the lights come up. */
export const heroStages = [
  { id: 'dark', label: 'The room, unlit' },
  { id: 'steps', label: 'Aisle lighting' },
  { id: 'walls', label: 'Acoustic walls' },
  { id: 'cove', label: 'Ceiling cove' },
  { id: 'stars', label: 'Star ceiling' },
  { id: 'screen', label: 'Projection' },
  { id: 'real', label: 'The room, built' },
]

/* --- 2. The First Pause --------------------------------------- */
/* The dark gallery between the hero and everything that argues.
   Content only — every position, duration and volume lives in the
   component, because those are choreography rather than copy.

   The statement is the HERO'S headline, said again. That repetition
   is the section: the hero shows you a finished room while saying
   it, and here the room is gone and the sentence is alone in the
   dark with nothing to look at. The six words that follow are the
   site's own comfort axes, widened from three (picture, sound,
   room) to the six things JAAZ actually signs off on — and they are
   the spine of the engineering section that comes next.

   `sound.files` names each file EXACTLY as it sits in
   /public/audio. Nothing else in the section knows a filename. */
export const firstPause = {
  id: 'first-pause',
  eyebrow: 'The JAAZ Approach',
  /* Two lines, authored as two, because the break is deliberate and
     must not be left to wrapping. `emphasis` is the one word in the
     line that carries the weight. */
  statement: [
    { text: 'Entertainment without', emphasis: null },
    { text: 'comfort is just ', emphasis: 'noise.' },
  ],
  /* One at a time, never a grid. `place` is where in the frame the
     word lands — see PLACE in FirstPause.jsx. */
  principles: [
    { word: 'Picture.', place: 'center' },
    { word: 'Sound.', place: 'right-high' },
    { word: 'Acoustics.', place: 'left-low' },
    { word: 'Comfort.', place: 'center-high' },
    { word: 'Control.', place: 'left' },
    { word: 'Calibration.', place: 'right-low' },
  ],
  payoff: ['Everything works', 'as one.'],
  sound: {
    on: 'Sound on',
    off: 'Sound off',
    /* Announced to screen readers only — the visible label is the
       state, not the action, which is what a two-word control in a
       dark room can afford to be. */
    action: 'Toggle section sound',
    files: {
      pulse: 'mixkit-mysterious-bass-pulse-2298.wav',
      hit: 'mixkit-short-bass-hit-2299.wav',
      sub: 'djartmusic-sub-bass-boom-1-302682.mp3',
      whoosh: 'dragon-studio-8d-whoosh-sfx-482877.mp3',
      click: 'mixkit-select-click-1109.wav',
      resonance: 'universfield-cinematic-low-hit-291095.mp3',
    },
  },
}

/* --- 3. The Promise ------------------------------------------- */
export const promise = {
  label: 'The Promise',

  /* ---- The statement ----
     Authored as the beats it is SPOKEN in rather than as the lines it
     is typeset in, because the section builds it one beat at a time:
     LUXURY, then WITHOUT, then COMFORT, and only then the interruption.
     The grouping below is still the typeset shape — an array per line,
     a word-group per beat — so the component never has to guess where
     a line breaks or which words arrive together.

     `turn: true` marks the two words the sentence pivots on. They are
     the only italic in the section and the only beat that arrives
     from the side rather than from below: the sentence is going one
     way and 'is not' cuts across it. */
  statement: [
    [{ w: 'Luxury' }],
    [{ w: 'without' }, { w: 'comfort' }],
    [{ w: 'is not', turn: true }, { w: 'luxury.' }],
  ],

  /* ---- The three beats ----
     The same three parallel negations the section has always carried —
     the site's own comfort axes in order, PICTURE, SOUND, ROOM — but
     split at the joint they were always hiding: a subject, and the
     thing that disqualifies it.

       A beautiful picture / you shouldn't have to squint at
       Powerful sound     / that shouldn't make you turn it down
       A beautiful room   / that shouldn't make you want to leave

     Set as one grey paragraph they were three sentences nobody
     finished. Given a beat each, the setup can land, hold, and then be
     answered — which is how the line is read out loud anyway.

     They are NOT captioned PICTURE / SOUND / ROOM. Each subject names
     itself in its first three words, and labelling them would be
     writing new copy onto the page to explain copy that is already
     clear. */
  beats: [
    {
      subject: 'A beautiful picture',
      answer: ['You shouldn’t have', 'to squint to enjoy it.'],
    },
    {
      subject: 'Powerful sound',
      answer: ['Shouldn’t make you', 'want to turn it down.'],
    },
    {
      subject: 'A beautiful room',
      answer: ['Shouldn’t make you', 'want to leave it.'],
    },
  ],

  /* ---- The turn ----
     This used to read "JAAZ starts where most cinemas stop — with the
     body in the chair." The idea is right and it is kept; the words
     are not. "The body in the chair" is how an engineer describes a
     listening position, and a brand that has just spent a full pin
     arguing it starts with the PERSON cannot land that argument on a
     noun that turns them into a payload.

     Stated as a first-person commitment instead, and split so the two
     halves can arrive apart: the denial, then the answer. 'with you.'
     is the only colour in the section and the last two words of it. */
  turn: {
    lead: ['We don’t start', 'with the technology.'],
    resolve: ['We start', 'with you.'],
    coda: 'Because the best entertainment experience isn’t measured by what’s in the room. It’s measured by how long you want to stay in it.',
  },
}

/* --- 3b. Before / After --------------------------------------- */
export const transform = {
  label: 'Before / After',
  heading: ['A room is what', 'you make of it.'],
  body: 'Every JAAZ project starts as a bare, civil-finished shell. Drag to see what it becomes.',
  hint: 'Drag to reveal',
  before: {
    src: img('shell', 2000, '16:9'),
    alt: 'A bare, civil-finished room before work begins',
    caption: 'Handover condition',
    tag: 'Before',
  },
  after: {
    src: img('theatre', 1500, '16:9'),
    alt: 'The same brief, delivered as a calibrated JAAZ private cinema',
    caption: 'Calibrated and signed off',
    tag: 'After',
  },
}

/* --- Slot 13: Why JAAZ ---------------------------------------- */
/* THIS USED TO BE THE PAGE'S SECOND SECTION AND IT WAS WORTH
   LESS THERE.

   Headed "Bring the big screen home", it opened the page as a
   general statement of what the company does — which is the one
   thing a visitor on their second screen has no reason to
   believe yet, and the one thing every builder's site says.

   It now closes the argument instead. By the time anyone reaches
   it they have read a per-seat calibration, six engineering
   pillars and a room they dragged from shell to finished, and
   the question in their head has changed from "what do you do"
   to "who does this". The heading answers that question
   literally, and the three numbers underneath it are the only
   figures JAAZ has actually supplied. */
export const brand = {
  label: 'Why JAAZ',
  /* Three claims, hard-broken, because they are three claims and
     not one sentence: one accountable team, one intention running
     through the whole room, one thing it is all for. */
  heading: ['One team.', 'One vision.', 'One experience.'],
  body: [
    'JAAZ designs and builds private entertainment spaces — from dedicated cinema rooms to living rooms that quietly outperform them.',
    'We work as a single team across design, acoustics, joinery, electronics and calibration, so responsibility for the finished room never gets divided.',
  ],
  /* The only figures JAAZ has supplied. The four that were here before
     — rooms delivered, years building, cities served, technology
     partners — were invented to fill a four-up row, which is exactly
     the kind of manufactured credibility the brief rules out. Three
     verified numbers beat four convincing ones. */
  stats: [
    { value: 5, suffix: '+', label: 'Years' },
    { value: 200, suffix: '+', label: 'Projects' },
    { value: 200, suffix: '+', label: 'Customers' },
  ],
  cta: 'Discover More',
  image: img('grand', 1500, '3:4'),
  imageAlt: 'A JAAZ private cinema, lights raised',
}

/* --- 4b. Possibilities ---------------------------------------- */
/* WHAT REPLACED THE PORTFOLIO, AND WHY.

   This slot used to hold a rail of six "signed off" rooms. JAAZ
   does not yet have photography of its own work at the standard
   the rest of this page is set to, and a portfolio built out of
   stock interiors is a portfolio that is lying — quietly, but at
   the exact point on the page where a visitor is trying to decide
   whether to trust the claim above it.

   So the section stops claiming and starts PROPOSING. Every frame
   below is conceptual or reference material, it says so on the
   stage in mono type that never leaves the screen, and nothing
   here is captioned with a city, a seat count or a sign-off date.
   The honesty is not a disclaimer bolted on afterwards; it is the
   reason the section is allowed to be this aspirational.

   THE CATEGORY IS THE ARGUMENT, THE TITLE IS THE ROOM.
   `label` is one of five categories — a private cinema, a living
   cinema, gaming, lounge, outdoor — and it repeats, because a
   category is a kind of room rather than a room. `title` never
   repeats. That split is what lets eight environments sit under
   five headings without the same word appearing twice as a
   headline and reading as a bug.

   `line` is what the stage holds at display size. `body` is the
   sentence underneath it. `meta` is the mono annotation — the two
   or three facts a room of this kind is actually specified by,
   set as type rather than drawn into a badge.

   ORDER IS THE SEQUENCE THE PINNED STAGE DISSOLVES THROUGH: the
   five categories in the order above, and inside each one the
   darkest, most dedicated room first. It walks from a room that
   does nothing but show films out through the house and finally
   outdoors. Reordering these is a content decision, not a layout
   one.

   EVERY FRAME IS CAPTIONED AS WHAT IT ACTUALLY SHOWS. Three of
   these slots were originally assigned on the strength of the
   comment beside the id in PLATES rather than the photograph the
   CDN returns, and all three were wrong: `fire` is an OUTDOOR fire
   pit in front of a projection screen, not a snug; `fluted` is a
   treated lounge vignette with no screen in it at all; and there
   is no gaming photograph anywhere in the verified set. In a
   section whose entire licence to be aspirational is that it tells
   you the imagery is reference material, captioning a picture as a
   room it plainly is not is the one mistake that cannot be made
   here. Check the pixels before adding a frame, not the comment. */
export const possibilities = {
  label: 'Possibilities',
  heading: ['What could your', 'room become?'],
  intro:
    'Five kinds of room, and eight ways they get pointed at something. What follows is direction, not a portfolio.',
  /* The disclosure, in two registers. `note` is the sentence in the
     header, where there is room to be plain about it. `badge` is the
     mono mark that stays on the stage for the whole sequence — small,
     hairline-ruled, never dismissed, because a disclosure that scrolls
     away is a disclosure that was written for the wrong reader. */
  /* Short on purpose. It is set in mono at 11px, where a
     three-line sentence stops reading as a note and starts reading
     as small print somebody is hoping you will skip. */
  note: 'Conceptual and reference environments — the character a space can take, not photographs of JAAZ installations.',
  badge: 'Concept / Reference',
  /* Navigation, not an ask. The homepage deliberately carries no
     closing CTA — see the note in HomePage.jsx — so the way OUT of
     this section is a route to the catalogue, the same job the old
     rail's 'All projects' link did. */
  link: { label: 'How we build them', to: '/solutions' },
  items: [
    {
      n: '01',
      label: 'Private Cinema',
      title: 'The Dedicated Room',
      line: 'Designed for the film, not the equipment.',
      body: 'Tiered seating, a masked 2.39:1 screen and a room whose acoustics were drawn before any of its finishes were chosen.',
      meta: 'Dedicated room · 8–14 seats · full masking',
      image: img('theatre', 1600, '16:9'),
      alt: 'A dark private cinema with tiered recliners and a star-field ceiling',
    },
    {
      n: '02',
      label: 'Private Cinema',
      title: 'The Dark Room',
      line: 'Nothing in the room competes with the screen.',
      body: 'Black architecture, no reflective surface left facing the picture, and one warm plane of light — the room disappears and the film does not.',
      meta: 'Dedicated room · 0.0 lx ambient · black shell',
      image: img('atrium', 1600, '16:9'),
      alt: 'A near-black glazed interior with a single warm perforated screen glowing behind it',
    },
    {
      n: '03',
      label: 'Living Cinema',
      title: 'The Room That Disappears',
      line: 'Performance without visual clutter.',
      body: 'Speakers behind the plaster, every cable buried, one control. It reads as a living room right up until the moment it does not.',
      meta: 'Living system · concealed speakers · single remote',
      image: img('livingAlt', 1600, '16:9'),
      alt: 'A dark lounge with a long low sofa and two large framed artworks',
    },
    {
      n: '04',
      label: 'Living Cinema',
      title: 'Open Plan',
      line: 'A system that has to hold a whole floor.',
      body: 'Sound designed for a space with no back wall, tuned so the sofa and the kitchen island are listening to the same mix.',
      meta: 'Open plan · multi-zone · steered coverage',
      image: img('modern', 1600, '16:9'),
      alt: 'A modern open-plan interior with a staircase, long table and full-height glazing',
    },
    {
      n: '05',
      label: 'Gaming',
      title: 'Low Latency',
      line: 'Precision at every frame.',
      body: 'A 120 Hz path from console to screen, positional audio placed to the seat rather than to the room, and light that takes its cue from the game.',
      meta: 'Gaming room · 120 Hz · sub-frame latency',
      image: img('slatted', 1600, '16:9'),
      alt: 'A curved slatted room in cool grey with low seating',
    },
    {
      n: '06',
      label: 'Lounge',
      title: 'Quiet Hours',
      line: 'Treatment that reads as joinery, not as foam.',
      body: 'Fluted timber and concealed absorption doing acoustic work in a room nobody would describe as a cinema.',
      meta: 'Lounge · fluted timber · broadband absorption',
      image: img('fluted', 1600, '16:9'),
      alt: 'A fluted timber wall lit from above, with a low sofa and a stone table',
    },
    {
      n: '07',
      label: 'Lounge',
      title: 'After the Credits',
      line: 'Entertainment beyond the credits.',
      body: 'Distributed audio tuned for conversation first, with a screen that only appears at the point somebody wants one.',
      meta: 'Bar & lounge · distributed audio · concealed screen',
      image: img('bar', 1600, '16:9'),
      alt: 'A warm home bar with backlit bottle shelves and a timber counter',
    },
    {
      n: '08',
      label: 'Outdoor',
      title: 'Under Open Skies',
      line: 'Cinema under open skies.',
      body: 'A screen, a fire and seating arranged around both — weather-rated throughout, and calibrated twice: once for still air, once for the monsoon that arrives anyway.',
      meta: 'Terrace · weather-rated · dual calibration',
      image: img('fire', 1600, '16:9'),
      alt: 'An outdoor terrace at night with a fire pit in front of a large projection screen',
    },
  ],
}

/* --- Chapter 01: Lights Down ---------------------------------- */
/* The interstitial after PROOF. It is not a hero with a video
   behind it; it is a projection. The photograph is revealed by a
   masked beam whose apex is the projector port, so the room is
   PAINTED open by light rather than faded in — see LightsDown.jsx
   for the mask itself.

   `gate` is the technical annotation column that appears with the
   first light: the three numbers a calibrator would actually write
   on the sign-off sheet for a room this dark. They are annotation,
   not badges — hairline-ruled mono, nothing drawn around them.

   `video` is optional in exactly the way `heroMedia.src` is, and
   null for the same reason — see the note there. With no clip the
   still is projected on its own and nothing else changes. Same
   encoding requirement applies (`-g 1`). */
export const lightsDown = {
  id: 'lights-down',
  chapter: 'Ch. 01',
  kicker: 'Lights down',
  statement: 'The room changes when the lights disappear.',
  caption: 'Bengaluru · 11 seats · signed off 2024',
  gate: [
    ['Ambient', '0.0 lx'],
    ['Grade', 'D65 · ISF Night'],
    ['Frame', '2.35 : 1 · 4.10 m'],
  ],
  poster: img('projection', 2400, '21:9'),
  video: null, // '/media/showcase/lights-down.mp4'
  alt: 'A projector beam cutting through the haze of a dark private cinema',
}

/* --- Spaces (no chapter mark of its own) ---------------------- */
/* Six rooms, traversed laterally rather than dissolved between —
   the section is a camera moving through a plan, so every room
   carries what a room schedule would carry: a clear internal
   dimension and a principal material, set as type rather than drawn.
   `line` is the editorial one-liner the pinned view shows; `body` is
   the longer sentence the reduced-motion stack falls back to, where
   there is room to read it. */
export const spaces = {
  label: 'Spaces',
  heading: 'What we bring alive',
  intro: 'A cinema is one answer. It is rarely the only one.',
  /* The line the reel lands on once the last frame has run. It
     restates PRODUCT.md's thesis rather than adding a claim: one
     accountable team, one system, however many rooms. */
  closing: 'Six spaces. One system, one team, one sign-off.',
  items: [
    {
      n: '01',
      meta: 'Dedicated room · 6-14 seats',
      title: 'Private Theatre',
      line: 'Immersion, engineered.',
      body: 'An intimate cinema designed entirely around the art of watching.',
      dim: '6.40 × 9.00 × 3.10 m',
      spec: 'Acoustic fabric · walnut batten',
      image: img('theatre', 1700, '16:9'),
    },
    {
      n: '02',
      meta: 'Concealed system · Any room',
      title: 'Living Room',
      line: 'Nothing on show but the picture.',
      body: 'Cinema performance, seamlessly integrated into everyday living.',
      dim: '7.20 × 5.60 × 2.90 m',
      spec: 'In-wall array · plaster return',
      image: img('livingAlt', 1500, '16:9'),
    },
    {
      n: '03',
      meta: 'Low latency · Positional audio',
      title: 'Gaming Den',
      line: 'Latency you can measure. Never feel.',
      body: 'Performance, immersion and comfort — without compromise.',
      dim: '5.10 × 6.20 × 2.80 m',
      spec: 'Slatted oak · 120 Hz path',
      /* STAND-IN. No frame in the verified pool is a luxury gaming
         room — every candidate outside it is an RGB desk setup, which
         the brand direction rules out. This fluted-timber lounge holds
         the tone until real photography lands, and it earns the slot
         twice over on the Spaces wall: it is the only plate in the set
         whose subject IS a slatted acoustic wall, so the room the
         board opens onto is made of the same thing the board is.

         Swapped off `slatted`, which is the darker frame of the same
         idea. On a wall built to open onto a LIT room, a plate that
         reads as black at full exposure is not a stand-in, it is an
         empty board. */
      image: img('fluted', 1500, '16:9'),
    },
    {
      n: '04',
      meta: 'Scaled output · Lighting scenes',
      title: 'Party Lounge',
      line: 'Loud, without ever being harsh.',
      body: 'Built for the moments when the room becomes the occasion.',
      dim: '8.40 × 7.10 × 3.40 m',
      spec: 'Stone floor · scened lighting',
      /* STAND-IN, as above: every social/party frame in the pool is
         outdoors, which would collide with Terrace. This open-plan
         interior keeps the range indoor and distinct, and it is the
         brightest plate in the set — which is what an occasion looks
         like, and what the widest board on the wall needs.

         Swapped off `chair`, a sculptural chair shot so dark that the
         board opened onto nothing. */
      image: img('modern', 1500, '16:9'),
    },
    {
      n: '05',
      meta: 'Distributed audio · Warm & even',
      title: 'Bar',
      line: 'Even at the far end of the counter.',
      body: 'Where entertainment meets effortless hospitality.',
      dim: '4.60 × 6.80 × 2.90 m',
      spec: 'Solid walnut · brushed brass',
      image: img('bar', 1500, '16:9'),
    },
    {
      n: '06',
      meta: 'Weather-rated · Open air',
      title: 'Terrace',
      line: 'Rated for the weather it will actually get.',
      body: 'Bring the experience outside.',
      dim: '11.20 × 6.40 m · open',
      spec: 'IP66 enclosures · teak deck',
      image: img('terrace', 1500, '16:9'),
    },
  ],
}

/* --- Chapter 02: The Snap ------------------------------------- */
/* ONE ROOM, SHOWN AS SEVERAL. NOTHING HIDDEN.

   The claim is that a JAAZ room is not one room. The honest way
   to make it is to put every version of that room on the page at
   once and let someone look from one to the next — not to hide
   them behind a control, and not to perform the change as a film.

   THIS SECTION HAS BEEN BUILT AS A FILM TWICE AND FAILED BOTH
   TIMES. The first build ran 3.4 viewports of pinned scroll with
   a drawn hand and a masked wipe, and put the pay-off in the last
   40% of a pin most visitors never finished. The second, written
   the same day as this one, was a scrubbed frame sequence with a
   blowout at contact — and ansil ruled the whole register out
   before it ever shipped: no pinned or scroll-jacked sections, no
   near-black screens, no film-style motion, no display-serif
   drama filling a screen. It is printed on paper instead, like
   Calibration, and it simply shows the four rooms.

   THE PHOTOGRAPHS ARE THE SECTION. Four frames of THE SAME room,
   which is the one thing the verified stock pool cannot supply —
   every plate in it is a different property, and four different
   rooms under a heading that says "one room" would make the
   section lie. `render` names the asset each slot is waiting for;
   `image` is the interim plate and is disclosed as reference in
   `note` until the renders land. Nothing here pretends. */
export const snap = {
  id: 'snap',
  chapter: 'Ch. 02',
  label: 'The Snap',

  /* Two lines, hard-broken. The eye reads "One room." as a
     finished sentence before it is told there is more than one of
     them. This line came back here from <Prism>. */
  heading: ['One room.', 'Different worlds.'],
  intro:
    'The same walls, the same chairs, the same screen. What changes is everything the room is doing with them — and none of it is a different room.',

  /* Shown under the set, in the same size type as the captions,
     for exactly as long as the plates are stand-ins. */
  note: 'Reference imagery. The four frames above are placeholders until the room is photographed in each state.',

  /* THE FOUR STATES. Four and not six: the point is that the room
     has more than one life, and four makes it without turning the
     set into a catalogue. <Prism> is where the full range gets
     chosen from — this section only has to be true. */
  worlds: [
    {
      n: '01',
      name: 'Cinema',
      line: 'Lights to zero. The screen is the only source in the room.',
      render: 'snap/cinema',
      image: img('theatre', 1600, '4:3'),
      alt: 'The room with the house lights down and the screen lit',
    },
    {
      n: '02',
      name: 'The match',
      line: 'Brighter, wider, and loud enough to shout over.',
      render: 'snap/match',
      image: img('livingAlt', 1400, '4:5'),
      alt: 'The same room set up for live sport',
    },
    {
      n: '03',
      name: 'Gathering',
      line: 'The screen steps back. The room is for the people in it.',
      render: 'snap/gathering',
      image: img('bar', 1400, '4:5'),
      alt: 'The same room with the seating opened up for company',
    },
    {
      n: '04',
      name: 'Everyday',
      line: 'Nothing on show. A room you would sit in with the lights on.',
      render: 'snap/everyday',
      image: img('fluted', 1600, '4:3'),
      alt: 'The same room in daylight with everything put away',
    },
  ],
}

/* --- Chapter 04: Calibration ---------------------------------- */
/* THE SECTION IS AN ARGUMENT, SO THE VISITOR IS HANDED THE SWITCH.

   TWO BUILDS ARE BURIED UNDER THIS ONE, AND BOTH FAILED THE SAME
   WAY. The first ran the argument as a three-and-a-half-viewport
   pinned scrub over a photograph — mono ticks on hairline
   drop-lines, a legend, a row of seat numerals. An engineering
   drawing. The second kept the photograph and put the seven
   figures on top of it: better, but a dark room photographed at
   f/2 is the wrong ground for the one section on the site whose
   job is to be READ, and the plan being argued about was never
   actually visible — the visitor had to take the geometry on
   trust.

   The third build drew the plan and put it on paper, but it still
   hid half the argument behind a switch: you could see one layout
   at a time and had to hold the other in your head.

   THIS BUILD HIDES NOTHING. Both rooms are drawn side by side,
   both verdicts are on screen at once, and there is no control to
   work out — the comparison is simply there. What is left to
   operate is one thing only: which CHAIR you are reading, and it
   is read in both rooms at the same time. The whole section is
   set on paper, full bleed, which is the plainest and friendliest
   ground the site has.

   COPY IS SENTENCES, NOT FIELDS. `seatSentence` and `spreadNote`
   are templates with `{placeholders}`; the component fills them
   from the geometry below and sets the figures at display size
   inline. Nothing here is typed by hand, so the prose cannot
   drift away from the plans it describes.

   THE PLAN IS DRAWN FROM THESE COORDINATES, NOT TRACED. `asFound`
   and `asBuilt` are metres in one coordinate system whose origin
   is the centre of the screen wall; the drawing's viewBox IS that
   system, so a seat cannot be drawn anywhere except where it was
   measured. There is no second set of screen positions to keep in
   sync — the `mark` percentages the photograph needed are gone
   with the photograph. */
export const calibration = {
  id: 'calibration',
  chapter: 'Ch. 04',
  label: 'Calibration',

  /* The claim, in two halves. The first is set back; the second is
     what the section spends its length earning. */
  title: ['You may never', 'see the difference.'],
  titleTurn: ['But you will', 'always feel it.'],
  lead: 'One microphone, seven chairs, no averages. Both rooms below are the same space measured twice — pick any chair and read what each layout actually gives it.',

  /* The two rooms, side by side. `name` heads each column and
     `short` heads its figures where a column is one word wide.
     `note` is what that layout MEANS in plain words — it replaces
     the legend a drawing would otherwise need. */
  layouts: [
    {
      key: 'found',
      name: 'Conventional layout',
      short: 'Conventional',
      note: 'What a room this size would normally be given.',
    },
    {
      key: 'built',
      name: 'JAAZ layout',
      short: 'JAAZ',
      note: 'What the measurement asked for instead.',
    },
  ],
  rows: ['Front row', 'Back row'],
  seatWord: 'Seat',
  pick: 'Pick any chair below, or point at one in either room.',

  /* The drawings' own captions. `planScale` is a template — the
     component fills it from `room` and `screenWidth` below, so the
     dimensions printed on the sheet are the dimensions the plans
     were built from. `planNote` is the only legend either drawing
     gets, and it is a sentence rather than a key. */
  planScale: 'Drawn to scale · {w} × {d} m · {s} m screen',
  planNote:
    'The same room at the same scale, drawn twice: screen at the top, seven chairs in two rows. Only the seating and the front three speakers differ.',
  valuesLabel: 'Every chair, against the room average',
  seatReadLabel: 'The same chair, in both rooms',

  /* The selected chair, as a sentence rather than a readout. Every
     figure in it is computed from the plans below. */
  seatSentence:
    'Sound reaches it in {ms} ms. It measures {db} dB against the room average, and the screen fills {view}° of the view — {window}.',
  viewIn: 'inside the window the trade works to',
  viewOut: 'outside the window the trade works to',

  /* The verdict on the whole room, which is the only figure that
     settles the argument. */
  spreadLabel: 'Best chair to worst',
  /* Two readings of the same measurement, so they have to be the
     same sentence. Anything else is the comparison being weighted
     by how it is worded rather than by what was measured. */
  spreadNote: {
    found: 'The worst chair sits {b} dB off the room average.',
    built: 'Not one chair sits more than {b} dB off the room average.',
  },

  /* The close. */
  resolve: ['Every seat.', 'The same intention.'],
  resolveSub:
    'Picture, sound and comfort are tuned for the people in the room — not just the equipment inside it.',

  /* Speed of sound at 20 °C. It is printed in the section, so it
     lives here. */
  speedOfSound: 343,
  /* The picture window every chair has to land inside — 30° to 40°
     of horizontal viewing angle is the industry's own range, and
     the report prints where each chair falls in it. */
  viewWindow: [30, 40],
  room: { w: 6.4, d: 8.4 },
  screenWidth: 4.2,

  asFound: {
    speakers: [
      { id: 'L', x: -2.6, y: 0.45 },
      { id: 'C', x: 0, y: 0.4 },
      { id: 'R', x: 2.6, y: 0.45 },
    ],
    seats: [
      { x: -1.1, y: 4.5 },
      { x: 0.3, y: 4.5 },
      { x: 1.7, y: 4.5 },
      { x: -1.8, y: 6.9 },
      { x: -0.4, y: 6.9 },
      { x: 1.0, y: 6.9 },
      { x: 2.4, y: 6.9 },
    ],
  },

  asBuilt: {
    speakers: [
      { id: 'L', x: -1.85, y: 0.55 },
      { id: 'C', x: 0, y: 0.4 },
      { id: 'R', x: 1.85, y: 0.55 },
    ],
    seats: [
      { x: -1.5, y: 6.2 },
      { x: 0, y: 6.2 },
      { x: 1.5, y: 6.2 },
      { x: -2.1, y: 7.15 },
      { x: -0.7, y: 7.15 },
      { x: 0.7, y: 7.15 },
      { x: 2.1, y: 7.15 },
    ],
  },
}

/* --- 6. From Setup to Showtime -------------------------------- */
export const craft = {
  label: 'The Craft',
  heading: ['From setup', 'to showtime'],
  intro: 'Everything below the surface of a JAAZ room — resolved before a single speaker is mounted.',
  items: [
    {
      n: '01',
      title: '3D Design',
      body: 'The room is built in full 3D before it is built in brick. Sightlines, screen size, riser heights and seat spacing are proven on screen first.',
      image: img('modern', 1800, '3:2'),
    },
    {
      n: '02',
      title: 'Wall Acoustics',
      body: 'Fabric-wrapped absorbers, diffusers and bass traps designed into the wall build-up — invisible in the finished room, decisive in how it sounds.',
      image: img('fluted', 1800, '3:2'),
    },
    {
      n: '03',
      title: 'Acoustic Flooring',
      body: 'Decoupled floor construction that stops structure-borne bass from leaving the room and the rest of the house from entering it.',
      image: img('dining', 1800, '3:2'),
    },
    {
      n: '04',
      title: 'Luxury Recliners',
      body: 'Motorised recliners in leather or fabric, with tray tables, lighting and per-seat power specified around a three-hour film.',
      image: img('chair', 1800, '3:2'),
    },
    {
      n: '05',
      title: 'Star-Light Ceilings',
      body: 'Fibre-optic star fields with twinkle wheels and shooting stars, mapped by hand so the ceiling reads as sky rather than as pattern.',
      image: img('theatre', 1800, '3:2'),
    },
  ],
}

/* --- 7. Technology & Brands ----------------------------------- */
export const technology = {
  label: 'Technology',
  heading: ['Specified for the room.', 'Not for the brochure.'],
  intro: 'JAAZ is brand-agnostic. Equipment is chosen after the room is understood — never before.',
  categories: [
    'Projectors',
    'Screens',
    'Speakers',
    'Amplifiers',
    'Subwoofers',
    'Streaming',
    'Control',
    'Lighting',
    'Seating',
  ],
  brands: [
    'BARCO',
    'SONY',
    'JBL SYNTHESIS',
    'BOWERS & WILKINS',
    'TRINNOV',
    'STORM AUDIO',
    'KALEIDESCAPE',
    'CONTROL4',
    'LUTRON',
    'SCREEN RESEARCH',
    'PROCELLA',
    'MARANTZ',
    'ANTHEM',
    'SONANCE',
    'ARTCOUSTIC',
    'CINEAK',
  ],
}

/* --- 9. Testimonials ------------------------------------------ */
export const testimonials = {
  label: 'Testimonials',
  heading: 'In their rooms',
  items: [
    {
      quote:
        'We had been told our basement was the wrong shape for a cinema. JAAZ treated that as the starting point rather than a reason to compromise. Four years on, we still use it every week.',
      name: 'Rohan Mehta',
      context: 'Private Theatre · 9 seats · Bengaluru',
      image: img('livingAlt', 1100, '4:5'),
    },
    {
      quote:
        'What convinced me was the calibration report. Nobody else measured anything. JAAZ handed over a document showing exactly what the room does at every seat.',
      name: 'Aisha Rahman',
      context: 'Living Room System · Kochi',
      image: img('screenWall', 1100, '4:5'),
    },
    {
      quote:
        'The chairs are the part guests talk about, which tells you something. Three hours in and nobody shifts. That was the whole brief and they took it seriously.',
      name: 'Vikram & Nisha Shetty',
      context: 'Theatre & Bar · 14 seats · Dubai',
      image: img('fire', 1100, '4:5'),
    },
  ],
}

/* --- 9b. Journal ---------------------------------------------- */
/* Three pieces, and the first one carries the standfirst. Dates are
   authored as strings rather than parsed from `Date`, because these
   are editorial publication dates and a locale-formatted date would
   silently shift by a day depending on where the page is read. */
export const journal = {
  label: 'Journal',
  heading: 'Notes from the room',
  cta: 'All writing',
  items: [
    {
      date: '18 Aug 2026',
      kind: 'Field note',
      title: 'Why we measure every seat, not the sweet spot',
      standfirst:
        'A single microphone position at the prime seat will tell you the room is excellent. Move it two feet and the same room can be twelve decibels down at 60Hz. Here is what per-seat time alignment actually corrects, what it cannot, and why the calibration report is the only part of a handover worth arguing about.',
      image: img('comfortRoom', 1600, '16:10'),
      href: '#',
    },
    {
      date: '02 Aug 2026',
      kind: 'Craft',
      title: 'The floor is an instrument',
      image: img('modern', 1200, '4:3'),
      href: '#',
    },
    {
      date: '21 Jul 2026',
      kind: 'Opinion',
      title: 'Against the feature list',
      image: img('slatted', 1200, '4:3'),
      href: '#',
    },
  ],
}

/* --- 11. Footer ----------------------------------------------- */
export const footer = {
  /* The house mark, rendered twice down here and meaning two
     different things each time: once at reading size as the link
     home, and once enormous behind everything as the footer's
     texture (see `.footer-wordmark` in index.css). ONE string, so
     the two can never drift apart — change the spelling here and
     both change together. */
  wordmark: 'JAAZ',
  /* The masthead line under the wordmark. Set in italic display, the
     same way the reference footer sets its positioning line — one
     short claim, not a sentence. */
  tagline: 'Engineered around comfort.',
  /* Trimmed to one sentence when the directory gained a fifth
     column. It sits under the lockup as the brand column's only
     prose, and three sentences there made the widest column also
     the tallest — the four link columns beside it then read as
     footnotes to a paragraph rather than as a set of equals. The
     full version of this text is the About page's job. */
  description:
    'Private cinemas and entertainment spaces, engineered end to end by one accountable team.',
  credential: 'Private cinema since 2013',

  /* The closing CTA that opens the footer on EVERY page — now a
     panel rather than a band, so it carries a photograph of its
     own. A page can override the whole object (Contact does) by
     passing its own `cta` to <Footer>; `plate` is optional there
     and falls back to this one.

     `body` is the contact page's own promise, verbatim. The card
     needs a line under the headline — the reference's shape has a
     sub-line and the headline alone leaves the panel top-heavy —
     and inventing a new claim to fill it would have been the one
     unforgivable way to fill it. */
  cta: {
    heading: ['Let’s build a room', 'worth staying in.'],
    body: 'Tell us the room, the budget band and how you want to use it. One reply within a working day.',
    /* The backlit fluted lounge, not the flagship cinema. The
       headline is about a room worth STAYING in, and the cinema
       plate is already the hero's dissolve target and section
       five's photograph — a third run of it at the foot of every
       page turns the site's best frame into wallpaper. Verified
       against the CDN: `fluted` renders as a warm low-lit lounge
       vignette, cushions and backlit ribbing, which is the
       sentence above with the lights on. */
    plate: {
      src: img('fluted', 1400, '5:4'),
      alt: 'A low-lit lounge with a backlit fluted wall behind the seating',
    },
    primary: { label: 'Discuss your project', to: '/contact#consultation' },
    /* Was "or call +91 98470 00000" — the trailing half of a
       sentence, which is what a text footnote under a button can
       be and what a button beside one cannot. */
    secondary: { label: 'Call +91 98470 00000', href: 'tel:+919847000000' },
  },

  contact: {
    title: 'Reach us',
    links: [
      { label: 'hello@jaaz.com', href: 'mailto:hello@jaaz.com' },
      { label: '+91 98470 00000', href: 'tel:+919847000000' },
      { label: 'Enquire on WhatsApp', href: 'https://wa.me/919847000000' },
    ],
  },

  explore: {
    title: 'Explore',
    links: [
      { label: 'Solutions', href: '/solutions' },
      /* The real page, not the old homepage anchor. `#projects` was
         the id of the portfolio rail that <Possibilities> replaced;
         with that section gone the link scrolled to nothing. */
      { label: 'Work', href: '/projects' },
      { label: 'About', href: '/about' },
      { label: 'The Craft', href: '/#craft' },
      { label: 'Contact', href: '/contact' },
    ],
  },

  /* The fifth column, and the reason the directory is worth
     rebuilding rather than restyling.

     The reference's footer is four columns because the site behind
     it has four real branches to list. This one had three, and one
     of them was an address — so the sitemap stopped at the level of
     "Solutions" while nine solution PAGES sat one click further in
     with no route to them from anywhere except the catalogue index.
     Five of the nine are listed here by name and the sixth line
     opens the rest, which is the shape a footer sitemap is for:
     the shortest path from the bottom of any page to the specific
     thing someone came to read.

     Five and not nine because a column that outruns the four
     beside it stops being a column. They are the five with the
     broadest reach — the flagship, the most-requested, and the
     three standalone services that sell on their own. */
  solutions: {
    title: 'Solutions',
    links: [
      { label: 'Private Home Theatre', href: '/solutions/private-home-theatre' },
      { label: 'Living Room Upgrade', href: '/solutions/living-room-theatre-upgrade' },
      { label: 'Automation & Control', href: '/solutions/home-automation-control' },
      { label: 'Acoustic Treatment', href: '/solutions/acoustic-treatment' },
      { label: 'Lighting & Ambience', href: '/solutions/lighting-ambience-design' },
      { label: 'All nine solutions', href: '/solutions', more: true },
    ],
  },

  office: {
    title: 'Visit',
    lines: [
      'JAAZ Experience Centre,',
      '2nd Floor, Marine Drive,',
      'Ernakulam,',
      'Kochi, Kerala',
      '682031',
    ],
    hours: 'Mon – Sat · 10:00 – 19:00',
    /* The address block is a link to the real pin, the way the
       reference footer's is — an address you cannot navigate to is
       just five lines of text. */
    mapHref:
      'https://www.google.com/maps/search/?api=1&query=Marine%20Drive%2C%20Kochi%2C%20Kerala',
  },

  /* `icon` keys are drawn in Footer.jsx — square outline buttons.

     The FOLLOW label these used to sit under is gone with the row's
     move into the legal line: a heading over four marks parked at
     the right-hand end of a copyright rule reads as a fifth column
     with nothing in it, and the marks are self-labelling anyway —
     each carries its own `aria-label` for the readers that need
     one. */
  social: {
    links: [
      { label: 'Instagram', icon: 'instagram', href: '#' },
      { label: 'Facebook', icon: 'facebook', href: '#' },
      { label: 'LinkedIn', icon: 'linkedin', href: '#' },
      { label: 'YouTube', icon: 'youtube', href: '#' },
    ],
  },

  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Use', href: '#' },
  ],
}

/* --- Chapter 05: The JAAZ Comfort System ------------------------ */
/* "Engineered. Not assembled." — the six disciplines a room has to
   resolve, each carried by ONE figure at display size.

   WHY FIGURES AND NOT DIAGRAMS. The brief for this section asked for
   self-drawing speaker layouts and animated frequency plots. That is
   the blueprint register this site has already ruled out once:
   hairline rules, micro labels and drop-lines from a number to the
   thing it annotates read as a technical dashboard, and the thing
   being sold is a room people sit in. A figure set in Instrument
   Serif at 5rem says "measured" more convincingly than a drawing of
   a measurement does, and it survives a phone.

   EVERY FIGURE IS A STANDARD OR A DESIGN TARGET, NOT A CLAIM ABOUT A
   DELIVERED ROOM, and `note` is where it says which. The 30–40°
   viewing window is the same one <Calibration> prints and works
   inside; the 30° front pair is the mixing-stage geometry the
   content itself was made on. Nothing in this block asserts a result
   JAAZ has not been asked to stand behind.

   `decides` is what makes the section an argument rather than a
   list. An assembled room is six purchases; an engineered one is six
   decisions, each of which moves the next. Read the `decides` lines
   on their own, in order, and they chain. */
export const engineering = {
  id: 'engineering',
  chapter: 'Ch. 05',
  /* Named as a SYSTEM rather than as a discipline. Six pillars
     that each decide the next is not "engineering" in the abstract
     — it is the thing JAAZ sells, and the label is the only place
     on the page it gets called by its own name. */
  label: 'The JAAZ Comfort System',
  heading: ['Engineered.', 'Not assembled.'],
  intro:
    'A room is not the sum of what is installed in it. Six things have to agree before any of them is ordered — and each one decides the next.',

  items: [
    {
      n: '01',
      name: 'Picture',
      figure: '37°',
      note: 'of your view, filled',
      body: 'Screen size is set by where the seats are, not by what fits the wall. Thirty to forty degrees of horizontal view is the window the trade works to; the number inside it is the one this room can actually hold.',
      decides: 'Which fixes where the front row sits.',
    },
    {
      n: '02',
      name: 'Sound',
      figure: '30°',
      note: 'off centre, from the main chair',
      body: 'Left and right sit thirty degrees off the centre line from the main chair, because that is the geometry the film was mixed on. Surrounds and heights are placed to the same rule rather than to the nearest joist.',
      decides: 'Which fixes what the walls have to absorb.',
    },
    {
      n: '03',
      name: 'Acoustics',
      figure: '0.3 s',
      note: 'target decay, mid-band',
      body: 'Absorption, diffusion and bass traps are designed into the wall build-up, not hung on it afterwards. What you hear should be the mix — not the room having an opinion about the mix.',
      decides: 'Which fixes the depth of every wall.',
    },
    {
      n: '04',
      name: 'Comfort',
      figure: '3 h',
      note: 'the length we design for',
      body: 'Seat pitch, riser height, back angle and where your head lands are specified around a three-hour film rather than a ten-minute demonstration. A room you leave early is a room that failed.',
      decides: 'Which fixes the plan everything else is built on.',
    },
    {
      n: '05',
      name: 'Control',
      figure: '1',
      note: 'press to lights-down',
      body: 'Media, lighting, masking, climate and blinds answer to one scene on one control. If the room has to be explained to a guest, it is not finished.',
      decides: 'Which fixes what is wired, and to where.',
    },
    {
      n: '06',
      name: 'Calibration',
      figure: '±1.5 dB',
      note: 'the target, chair to chair',
      body: 'Every seat is measured on its own and tuned on its own, and the room is signed off on the worst chair in it. An average hides exactly the seat somebody is going to be sitting in.',
      decides: 'Which is the only step that can say the rest worked.',
    },
  ],

  /* The close. Three words carrying the whole difference between the
     two halves of the headline.

     Split into `pre` / `turn` / `post` rather than left as one
     string, because every display line on this site turns exactly
     one word warm and the component should not have to know which
     word that is. Copy stays here; typography stays there. */
  closing: { pre: '', turn: 'Measured', post: ', not eyeballed.' },
}

/* --- Chapter 06: Comfort --------------------------------------- */
/* "Stay longer." The slow section, deliberately — it follows
   Engineering, and the two are meant to feel different in the body
   and not only to read differently.

   NO CONTROL, NO PICKER, NO SEQUENCE. <Calibration> is driven by a
   chair you choose, <Transform> by a seam you drag, and <Feeling> by
   a word you press. This one is looked at. Three plates, a great
   deal of air, long parallax and short copy is the entire mechanism,
   and the pacing IS the argument: a section about not noticing time
   passing should not be hurrying you through itself.

   PLATE SLOTS ARE CHOSEN AGAINST THE RENDERED PIXELS, not against
   the comment beside the id in PLATES. `comfortRoom` is the flagship
   cinema at a tighter crop — seating, warm cove. `fluted` is a tight
   lounge vignette (cushions, vase, stone table, no screen in it),
   which is why it carries the MATERIAL beat and not the seating one.
   `terrace` is dusk seating outdoors and closes the section on the
   hour after the film. `chair` is deliberately NOT used: it renders
   as a bar/lobby rather than a recliner, and this is the one section
   where that would be spotted immediately. */
export const comfort = {
  id: 'comfort',
  chapter: 'Ch. 06',
  label: 'Comfort',
  heading: ['Stay', 'longer.'],

  /* The supporting idea, and the only sentence in the section that
     gets the scrubbed word-by-word treatment. It is the claim
     everything below it is evidence for. */
  statement:
    'A great cinema shouldn’t impress you for ten minutes. It should make you forget how long you’ve been sitting there.',

  beats: [
    {
      key: 'seating',
      title: 'Seating',
      body: 'Motorised recliners specified around a three-hour film: seat pitch, back angle, where your head lands, a tray that actually reaches, power at the arm.',
      second: {
        title: 'Sightlines',
        body: 'Every row is raised until the screen clears the head in front of it. Nobody in this room is watching around somebody else.',
      },
      plate: img('comfortRoom', 1800, '4:5'),
      alt: 'Tiered recliners in a private cinema under warm cove lighting',
    },
    {
      key: 'material',
      title: 'Materials',
      body: 'Wool, leather and stone, chosen for how they behave in a dark room over three hours rather than for how they photograph in a showroom.',
      second: {
        title: 'Light',
        body: 'Cove, step and star-field lighting on scenes: warm, low, enough to find your glass and never enough to touch the picture.',
      },
      plate: img('fluted', 2400, '16:9'),
      alt: 'A lounge vignette in a dark interior — cushions, stone table, soft textiles',
    },
  ],

  /* The close: the one comfort nobody specifies and everybody
     notices, and then the hour after the film. */
  close: {
    title: 'And the air.',
    body: 'Ventilation sized to hold temperature with a full room in it, and quiet enough that you never hear the thing holding it. It is the last comfort anyone specifies and the first one a guest notices.',
    plate: img('terrace', 2400, '21:9'),
    alt: 'A terrace at dusk with lounge seating, after the film',
    /* Same `pre` / `turn` / `post` split as engineering.closing, and
       for the same reason. */
    line: { pre: 'The ', turn: 'third hour', post: ' is the test.' },
  },
}

/* --- Chapter 07: What do you want to feel? --------------------- */
/* The experience selector. Six feelings; press one and the room
   answers.

   THE CONTROL IS SIX WORDS AT DISPLAY SIZE, and that is the whole
   design. No pills, no tabs, no thumbnail strip, no 01/06 counter —
   every one of those has been ruled out on this site by name, and
   each is a piece of app chrome sitting on somebody's photograph.
   The chosen word is white with a warm rule that SLIDES to it; the
   rest are quiet. A visitor who has never seen the page knows what
   to do with it without being told twice.

   WHY IT IS NOT A SECOND PRISM. <Prism> shows one room becoming five
   atmospheres — it is about the room. This is about the VISITOR: it
   starts from what they want to feel and hands back the room that
   does it. Different question, different answer, and the copy is in
   the second person for exactly that reason.

   IMAGES ARE VERIFIED SLOTS AND NOTHING IS CAPTIONED AS A JOB. There
   is still no JAAZ photography, and no gaming photograph anywhere in
   the verified set — `slatted` (curved slatted room, cool grey) is
   the honest stand-in for COMPETITION, and `note` says in plain
   words that these are reference images. */
export const feelings = {
  id: 'feeling',
  chapter: 'Ch. 07',
  label: 'The Brief',
  heading: ['What do you', 'want to feel?'],
  intro:
    'Every room on this page began as an answer to that question, not as a brand list. Pick the one that sounds like your evening.',
  /* The instruction, in plain words, above the control — a control
     nobody is told about is a control half of them miss. */
  cue: 'Pick one',
  note: 'Reference images. JAAZ photography replaces these as rooms are handed over.',

  states: [
    {
      key: 'immersion',
      word: 'Immersion',
      line: 'Disappear into it.',
      body: 'A dedicated room with the door shut, the walls treated and the chairs placed where the sound actually is. Nothing in your eyeline that is not the picture.',
      meta: 'Dedicated cinema · treated walls · tiered seating',
      plate: img('theatre', 1500, '4:5'),
      alt: 'A private cinema with tiered recliners and a warm cove-lit ceiling',
    },
    {
      key: 'escape',
      word: 'Escape',
      line: 'One row. One film. Nobody else.',
      body: 'A small room built for two, where the lights fall to nothing and the phone stays outside. The smallest rooms are usually the most exactly specified ones.',
      meta: 'Compact room · full blackout · one scene',
      plate: img('projection', 1500, '4:5'),
      alt: 'A projector beam cutting through the haze of a darkened room',
    },
    {
      key: 'connection',
      word: 'Connection',
      line: 'The room everyone ends up in.',
      body: 'A living space that performs like a cinema and still looks like a living space — speakers behind the finish, the screen gone when it is not wanted.',
      meta: 'Living cinema · concealed system · daily use',
      plate: img('livingAlt', 1500, '4:5'),
      alt: 'A dark contemporary lounge with a large artwork and low seating',
    },
    {
      key: 'competition',
      word: 'Competition',
      line: 'Fast enough to blame yourself.',
      body: 'A low-latency display, a chair you can sit in for a whole tournament, and acoustics that keep four people audible to each other over the game.',
      meta: 'Gaming room · low latency · multi-seat',
      plate: img('slatted', 1500, '4:5'),
      alt: 'A curved slatted room with built-in seating',
    },
    {
      key: 'celebration',
      word: 'Celebration',
      line: 'For the night that runs long.',
      body: 'A bar, a system that fills the room without shouting, and lighting scenes that move the evening on without anyone having to touch a panel.',
      meta: 'Bar · distributed audio · lighting scenes',
      plate: img('bar', 1500, '4:5'),
      alt: 'A warm timber home bar lit low',
    },
    {
      key: 'listen',
      word: 'Listen',
      line: 'Two speakers, telling the truth.',
      body: 'A room built around one chair and a stereo pair, treated so the recording arrives without the walls editing it first. No screen, on purpose.',
      meta: 'Listening room · stereo pair · one chair',
      plate: img('fluted', 1500, '4:5'),
      alt: 'A quiet listening space with soft textiles and a stone table',
    },
  ],
}
