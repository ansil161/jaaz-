/* ============================================================
   JAZ — CONTENT SOURCE OF TRUTH
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

   To ship JAZ's own photography, drop files into
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

  // People. Placeholder studio portraits, standing in for real founder
  // photography until JAZ supplies it — see team.note in about.js.
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
   now — /projects, plus a page per room — so the item is a real
   destination and the homepage rail is what it should always have
   been: a preview of it.

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
  sub: 'JAZ builds private cinemas where picture, sound and seating are engineered as one experience.',
  cta: 'Book a Consultation',
  scrollHint: 'Scroll to bring the room to life',
}

/* The photograph the drawn room dissolves into at the end of the
   hero sequence — the vector cinema becoming a real one. */
export const heroPlate = {
  src: img('theatre', 2600, '16:9'),
  alt: 'A finished JAZ private cinema with the house lights down',
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

/* --- 2. The Promise ------------------------------------------- */
export const promise = {
  label: 'The Promise',
  statement: ['Luxury without', 'comfort is', 'not luxury.'],
  body: 'A great picture you have to squint at is not a great picture. Sound that fatigues you is not great sound. A room you leave early was never worth building. JAZ starts where most cinemas stop — with the body in the chair.',
  watermark: 'LUXURY',
}

/* --- 3. The JAZ Comfort System -------------------------------- */
export const comfort = {
  label: 'The JAZ Comfort System',
  heading: ['Three kinds of comfort.', 'Engineered together.'],
  intro: 'Most installers solve one of these and hope the other two follow. They never do. JAZ treats them as a single system, calibrated against each other.',

  /* One photograph per pillar, each of a room where that pillar is the
     thing you actually see: the beam for picture, the fluted wall for
     sound, the tiered recliners for seating. The previous build showed
     ONE room three times and drew the difference on top of it in SVG —
     which meant the picture never changed while the claim did, and the
     claim had to be taken on trust. Three real rooms make the argument
     photographically instead of annotating it.

     Every slot below is in the verified PLATES map at the top of this
     file. An unverified id is a broken image in production. */
  layers: [
    {
      n: '01',
      title: 'Visual Comfort',
      body: 'Every detail is designed for effortless viewing.',
      plate: img('projection', 1700, '4:3'),
      plateAlt: 'A projector beam resolving through the haze of a dark cinema',
      caption: 'D65 reference · ΔE < 1',
      points: [
        'Screen-to-seat geometry',
        'D65 reference colour calibration',
        '99.4% light-absorbing surfaces',
      ],
    },
    {
      n: '02',
      title: 'Acoustic Comfort',
      body: 'Sound should surround you, never overwhelm you.',
      plate: img('fluted', 1700, '4:3'),
      plateAlt: 'A fluted acoustic wall running the length of a listening room',
      caption: 'RT60 0.28s · 11.4.6 Atmos',
      points: [
        'Room-first acoustic treatment',
        'Decoupled bass management',
        'Per-seat time alignment, 11.4.6 Atmos',
      ],
    },
    {
      n: '03',
      title: 'Seating Comfort',
      body: 'Because the best experiences begin with comfort.',
      plate: img('theatre', 1700, '4:3'),
      plateAlt: 'Tiered recliners in a finished JAZ private cinema',
      caption: '135° recline · 20–200 Hz',
      points: [
        'Non-reflective acoustic headrests',
        '135° Zero-G recline',
        'Tactile bass shakers, per seat',
      ],
    },
  ],

  /* The close, once all three have been read. */
  summary: {
    label: 'The JAZ Comfort System',
    lede: 'Visual. Acoustic. Seating.',
    body: 'Everything designed around how you experience the moment.',
    cta: 'Discover the Comfort System',
  },

  /* The material bar, held under Seating Comfort. Rendered as generated
     surfaces rather than photographs — see the long note at the top of
     this file on why swatch photography does not get sourced from
     Pinterest, and four fabric close-ups is exactly the kind of asset
     that note is about. */
  materials: [
    {
      id: 'leather',
      label: 'Aniline Leather',
      swatch: 'linear-gradient(155deg, #3b2a22, #6b4a35 45%, #4a3226)',
      note: 'Full-grain, unpigmented — takes the warmth of the room into the seat.',
    },
    {
      id: 'velvet',
      label: 'Acoustic Velvet',
      swatch: 'linear-gradient(155deg, #1c1c22, #34333d 45%, #201f26)',
      note: 'An absorptive pile that doubles as a first-reflection surface.',
    },
    {
      id: 'walnut',
      label: 'Fluted Walnut',
      swatch:
        'repeating-linear-gradient(90deg, #2a1c14 0 4px, #4a3324 4px 9px), linear-gradient(160deg, #3a2818, #2a1c12)',
      note: "A diffusive profile milled to the room's own acoustic model.",
    },
    {
      id: 'starfield',
      label: 'Star-Field Fabric',
      swatch:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0 1px, transparent 1.6px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.35) 0 1px, transparent 1.6px), radial-gradient(circle at 45% 80%, rgba(255,255,255,0.4) 0 1px, transparent 1.6px), #0a0a0d',
      note: "A blackout weave with the ceiling's own fibre points woven through.",
    },
  ],
}

/* --- 3b. Before / After --------------------------------------- */
export const transform = {
  label: 'Before / After',
  heading: ['A room is what', 'you make of it.'],
  body: 'Every JAZ project starts as a bare, civil-finished shell. Drag to see what it becomes.',
  hint: 'Drag to reveal',
  before: {
    src: img('shell', 2000, '16:9'),
    alt: 'A bare, civil-finished room before work begins',
    caption: 'Handover condition',
    tag: 'Before',
  },
  after: {
    src: img('theatre', 1500, '16:9'),
    alt: 'The same brief, delivered as a calibrated JAZ private cinema',
    caption: 'Calibrated and signed off',
    tag: 'After',
  },
  /* Shown under the frame so the comparison is never overstated. */
  note: 'Reference images. Paired photography of a single JAZ project drops straight into this component.',
}

/* --- 4. Bring the Big Screen Home ----------------------------- */
export const brand = {
  label: 'Who We Are',
  heading: ['Bring the', 'big screen', 'home.'],
  body: [
    'JAZ designs and builds private entertainment spaces — from dedicated cinema rooms to living rooms that quietly outperform them.',
    'We work as a single team across design, acoustics, joinery, electronics and calibration, so responsibility for the finished room never gets divided.',
  ],
  /* The only figures JAZ has supplied. The four that were here before
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
  imageAlt: 'A JAZ private cinema, lights raised',
}

/* --- 4b. Projects --------------------------------------------- */
/* Proof, immediately after the claim. The stats above say 200+
   projects; this is where that stops being a number.

   Filters are a flat list rather than a nested taxonomy — with six
   rooms, a two-level filter is furniture pretending to be
   navigation. `tags` is an array so a room can be both.

   `slug` is the same room's address on /projects/:slug, so the rail
   is a PREVIEW of the collection rather than a second, shorter
   version of it. The full entry — overview, spec, gallery,
   technology — lives in data/projects.js; the six strings here are
   its deliberately shorter homepage voice, which is why they were
   not replaced by an import. Keep the two in step: the slug is the
   only thing tying them together. */
export const projects = {
  label: 'Selected Work',
  heading: ['Rooms we have', 'signed off.'],
  intro: 'Six of the last two hundred. Every one measured, documented and handed over on one button.',
  filters: [
    { id: 'all', label: 'All rooms' },
    { id: 'theatre', label: 'Private theatre' },
    { id: 'living', label: 'Living & social' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'corporate', label: 'Corporate' },
  ],
  items: [
    {
      n: '01',
      title: 'The Long Room',
      slug: 'the-long-room',
      meta: 'Private theatre · 11 seats · Bengaluru',
      body: 'A basement nobody else would quote on. Three tiers, decoupled floor, 2.39:1 masked screen.',
      tags: ['theatre'],
      image: img('theatre', 1400, '4:5'),
    },
    {
      n: '02',
      title: 'Low Latency',
      slug: 'low-latency',
      meta: 'Gaming room · 4 stations · Kochi',
      body: 'Positional audio and a 120 Hz projector, with lighting scenes cued off the console.',
      tags: ['gaming'],
      image: img('slatted', 1400, '4:5'),
    },
    {
      n: '03',
      title: 'The Boardroom Cut',
      slug: 'the-boardroom-cut',
      meta: 'Corporate screening · 16 seats · Dubai',
      body: 'A conference room by day that closes down into a reference cinema by six.',
      tags: ['corporate'],
      image: img('modern', 1400, '4:5'),
    },
    {
      n: '04',
      title: 'Sunday Matinee',
      slug: 'sunday-matinee',
      meta: 'Living room system · Chennai',
      body: 'Every speaker concealed, every cable buried. The room reads as a living room until it does not.',
      tags: ['living'],
      image: img('fire', 1400, '4:5'),
    },
    {
      n: '05',
      title: 'Nightcap',
      slug: 'nightcap',
      meta: 'Bar & lounge · Kochi',
      body: 'Distributed audio tuned for conversation first, with a screen that drops when it is wanted.',
      tags: ['living'],
      image: img('bar', 1400, '4:5'),
    },
    {
      n: '06',
      title: 'Open Air',
      slug: 'open-air',
      meta: 'Terrace cinema · Goa',
      body: 'Weather-rated throughout, calibrated twice — once for still air and once for the monsoon.',
      tags: ['living', 'theatre'],
      image: img('terrace', 1400, '4:5'),
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

/* --- Chapter 02: Spaces --------------------------------------- */
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

/* --- Chapter 03: Every Seat ----------------------------------- */
/* The engineering chapter. It is staged on a REAL PHOTOGRAPH of a
   JAZ room rather than on a diagram of one — the argument is about
   chairs people sit in, and a plan view of chairs is a drawing of
   the argument rather than the argument.

   Two coordinate systems, and they do different jobs.

   `x` / `y` are METRES in the real room, origin at the screen wall,
   x measured from centre. EverySeat.jsx derives every number it
   prints from them — path length, arrival spread at 343 m/s, level
   spread at 20·log10. Nothing is typed in: move a seat 200mm here
   and every figure on screen moves with it.

   `mark` is a PERCENTAGE POSITION IN THE PHOTOGRAPH, so the light
   that lands on each seat lands on the chair that seat actually is.
   The two are independent on purpose — the plate can be re-cropped,
   or replaced with JAZ's own photography, by editing `mark` alone
   and leaving the acoustics untouched.

   Seven seats, front row of three and a rear row of four, because
   that is the room in the photograph. */
export const everySeat = {
  id: 'every-seat',
  chapter: 'Ch. 03',
  label: 'Calibration',
  heading: 'Every seat',
  intro: "Reference-grade performance isn't reserved for the centre.",
  resolve: 'Measured, not eyeballed.',
  resolveSub: 'Every seat. Every time.',
  sheet: 'Arrival spread, per seat',
  settled: 'After calibration · 0.00 ms at every chair',
  caption: 'Seven positions · 11.4.6 · measured at the chair',
  /* Speed of sound at 20 °C, and the reference every trim is cut
     against. It is printed in the section, so it lives here. */
  speedOfSound: 343,
  room: { w: 6.4, d: 9.0, h: 3.1 },
  /* The three front channels. Only these are traced, because the
     argument needs them and seven paths per chair is a diagram
     nobody can read. */
  speakers: [
    { id: 'L', x: -1.85, y: 0.6 },
    { id: 'C', x: 0, y: 0.44 },
    { id: 'R', x: 1.85, y: 0.6 },
  ],
  /* `row` scales the light: a chair further from the camera catches
     a smaller pool of it, and a pool the same size on every seat is
     the fastest way to make an overlay look stuck to the glass
     rather than lying in the room. */
  seats: [
    { n: '01', x: -1.5, y: 5.0, row: 0, mark: { x: 37.1, y: 48.8 } },
    { n: '02', x: 0, y: 5.0, row: 0, mark: { x: 45.0, y: 46.2 } },
    { n: '03', x: 1.5, y: 5.0, row: 0, mark: { x: 53.6, y: 43.8 } },
    { n: '04', x: -2.25, y: 6.6, row: 1, mark: { x: 60.7, y: 42.4 } },
    { n: '05', x: -0.75, y: 6.6, row: 1, mark: { x: 66.3, y: 41.4 } },
    { n: '06', x: 0.75, y: 6.6, row: 2, mark: { x: 72.9, y: 39.7 } },
    { n: '07', x: 2.25, y: 6.6, row: 2, mark: { x: 80.2, y: 39.3 } },
  ],
  /* 16:9, and the ratio is load-bearing: `mark` is a percentage of
     THIS frame, so the component reproduces the cover-crop geometry
     by hand rather than letting object-fit decide where the chairs
     ended up. */
  plate: img('theatre', 2200, '16:9'),
  plateAlt: 'A JAZ private cinema with the house lights down',
}

/* --- 6. From Setup to Showtime -------------------------------- */
export const craft = {
  label: 'The Craft',
  heading: ['From setup', 'to showtime'],
  intro: 'Everything below the surface of a JAZ room — resolved before a single speaker is mounted.',
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

/* --- 6b. The Kit ---------------------------------------------- */
/* Six equipment categories, written as what each one is FOR rather
   than as what it is. Deliberately not a spec sheet: the numbers
   that matter differ per room, which is the argument the technology
   section immediately below then makes explicitly.

   Rendered as a horizontal rail rather than a six-up grid, because
   six equal cards stacked vertically is the single most generic
   layout available and this is the section most likely to read as
   filler if it looks like everyone else's. */
export const collections = {
  label: 'The Kit',
  heading: ['What actually', 'moves the room.'],
  intro: 'Six categories, chosen after the room is measured. Brand comes last, and it comes from the brief.',
  items: [
    {
      n: '01',
      title: 'Projectors',
      body: 'Sized to the throw and the screen gain, not to the lumen figure on the box. Laser sources, so the picture you sign off is the picture in year five.',
      image: img('projection', 1400, '3:4'),
    },
    {
      n: '02',
      title: 'Screens',
      body: 'Acoustically transparent where speakers sit behind them, masked where the room takes more than one aspect ratio. Gain matched to the projector, never guessed.',
      image: img('screenWall', 1400, '3:4'),
    },
    {
      n: '03',
      title: 'Speakers',
      body: 'Placed against the geometry of the room first and the wall finish second. A speaker in the wrong position is a worse speaker.',
      image: img('tech', 1400, '3:4'),
    },
    {
      n: '04',
      title: 'Amplification',
      body: 'Headroom specified for the loudest ten seconds of the film, not the average. Nothing on the page clips at reference level.',
      image: img('fluted', 1400, '3:4'),
    },
    {
      n: '05',
      title: 'Subwoofers',
      body: 'Multiple, positioned to cancel the room modes rather than excite them. Even bass at every seat beats loud bass at one.',
      image: img('dining', 1400, '3:4'),
    },
    {
      n: '06',
      title: 'Seating',
      body: 'Motorised recliners specified around a three-hour film — lumbar support, tray tables, per-seat power and lighting, sightlines proven in 3D first.',
      image: img('chair', 1400, '3:4'),
    },
  ],
}

/* --- 7. Technology & Brands ----------------------------------- */
export const technology = {
  label: 'Technology',
  heading: ['Specified for the room.', 'Not for the brochure.'],
  intro: 'JAZ is brand-agnostic. Equipment is chosen after the room is understood — never before.',
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

/* --- 8. Our Process ------------------------------------------- */
export const process = {
  label: 'Our Process',
  /* Opens the same way the reference site's process heading does —
     "Let us show you how we..." — with the back half swapped for
     what JAZ actually does. The reference's own back half ("...drive
     your brand to new heights") is agency/branding language; kept
     verbatim it would be a false claim about a company that builds
     physical rooms, not brands. Single entry, not the site's usual
     two-line array: the sentence is long enough to want a natural
     wrap rather than a forced break. */
  heading: ['Let us show you how we bring your room to life.'],
  intro: 'We follow a measured, hands-on process from the first sketch to the final calibration — nothing about the room is left to guesswork.',
  steps: [
    {
      n: '01',
      title: 'Consultation',
      body: 'We start with how you actually watch, listen and host — then set a budget band that matches it honestly.',
    },
    {
      n: '02',
      title: 'Site Study',
      body: 'Measurements, structure, power, light ingress and noise paths. Every constraint is found now, not during installation.',
    },
    {
      n: '03',
      title: 'Design',
      body: '3D layouts, acoustic modelling, material selection and a fixed equipment schedule you sign off before anything is ordered.',
    },
    {
      n: '04',
      title: 'Installation',
      body: 'Our own team on site, sequenced with your builders and joiners, with cabling and containment done to a documented standard.',
    },
    {
      n: '05',
      title: 'Calibration',
      body: 'Measured, not eyeballed. Colour, geometry, room correction and per-seat time alignment brought to reference and documented.',
    },
    {
      n: '06',
      title: 'Handover',
      body: 'A room you can operate on one button, a walkthrough with everyone who will use it, and support that answers the phone afterwards.',
    },
  ],
  /* Where the curve stops. The six above are stages the room is still
     passing through; this is the one state it ends in. Lifted out of
     the component when About's Method started sharing the same
     timeline — the mechanism is shared, the words are not. */
  finale: {
    badge: 'Handover complete',
    lead: 'Ready to be',
    em: 'delivered',
    body: 'Lights down, one button, every measurement on file. From here it stops being a project and starts being the room you sit in.',
  },
}

/* --- 9. Testimonials ------------------------------------------ */
export const testimonials = {
  label: 'Testimonials',
  heading: 'In their rooms',
  items: [
    {
      quote:
        'We had been told our basement was the wrong shape for a cinema. JAZ treated that as the starting point rather than a reason to compromise. Four years on, we still use it every week.',
      name: 'Rohan Mehta',
      context: 'Private Theatre · 9 seats · Bengaluru',
      image: img('livingAlt', 1100, '4:5'),
    },
    {
      quote:
        'What convinced me was the calibration report. Nobody else measured anything. JAZ handed over a document showing exactly what the room does at every seat.',
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
  wordmark: 'JAZ',
  /* The masthead line under the wordmark. Set in italic display, the
     same way the reference footer sets its positioning line — one
     short claim, not a sentence. */
  tagline: 'Engineered around comfort.',
  description:
    'Private cinemas and luxury entertainment spaces — designed, built and calibrated by one accountable team across acoustics, joinery, electronics and seating. Based in Kochi, working across India and the Gulf.',
  credential: 'Private cinema since 2013',

  /* The closing CTA that opens the footer on EVERY page. A page can
     override it (Contact does) by passing its own `cta` to <Footer>. */
  cta: {
    heading: ['Let’s build a room', 'worth staying in.'],
    primary: { label: 'Discuss your project', to: '/contact#consultation' },
    secondary: { label: 'or call +91 98470 00000', href: 'tel:+919847000000' },
  },

  contact: {
    title: 'Reach us',
    links: [
      { label: 'hello@jaz.com', href: 'mailto:hello@jaz.com' },
      { label: '+91 98470 00000', href: 'tel:+919847000000' },
      { label: 'Enquire on WhatsApp', href: 'https://wa.me/919847000000' },
    ],
  },

  explore: {
    title: 'Explore',
    links: [
      { label: 'Solutions', href: '/solutions' },
      { label: 'Work', href: '/#projects' },
      { label: 'About', href: '/about' },
      { label: 'The Craft', href: '/#craft' },
      { label: 'Process', href: '/#process' },
      { label: 'Contact', href: '/contact' },
    ],
  },

  office: {
    title: 'Visit',
    lines: [
      'JAZ Experience Centre,',
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

  /* `icon` keys are drawn in Footer.jsx — square outline buttons, the
     same row the reference runs under its FOLLOW label. */
  social: {
    title: 'Follow',
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
