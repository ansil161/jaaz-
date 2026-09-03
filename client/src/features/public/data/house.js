/* ============================================================
   THE HOUSE — one continuous walk, written as a route

   Not a page of rooms. A single residence the camera travels
   through without ever cutting: exterior, entrance, living,
   theatre, corridor, glass door, terrace, pool, back inside,
   gaming, listening room, and out again for the reveal.

   EVERY BEAT IS A CAMERA POSITION AND A ROOM STATE. Scroll
   resolves to a position between two beats; the camera
   interpolates continuously along a spline, and the room's design
   changes at the beat that changes it. Movement is continuous,
   change is an event.

   COORDINATES ARE IN METRES and beats are authored in the LOCAL
   space of their `zone`. Only the theatre carries an offset (it
   was built first, around its own origin, and is worth not
   renumbering); every other zone sits at the world origin, so its
   beats are world coordinates. `ZONE_ORIGIN` is the single place
   that knows the difference.

   AXES: +x east, +y up, -z toward the theatre screen. The spine
   corridor runs north up +z. The terrace lies east beyond x = 12,
   behind the full-height glazing of the east elevation.
   ============================================================ */

/* --- THE PLAN ---------------------------------------------------
   Every wall in the house is derived from these numbers, so the
   geometry and the camera route cannot disagree about where a
   room is. Change a bound here and the room moves; the beats that
   sit inside it move with it only if they are authored relative
   to it, which is why the theatre has an origin and the rest are
   placed by hand against this table. */
export const PLAN = {
  theatre: { x0: -11, x1: -2, z0: -8, z1: 6, h: 3.4, door: { x0: -7.4, x1: -5.6, h: 2.4 } },
  spine: { x0: -7.6, x1: -5.4, z0: 6, z1: 38, h: 2.8 },
  corridorB: { x0: -5.4, x1: 12, z0: 10, z1: 14, h: 2.8 },
  /* Audio and gaming are stacked north of corridor B and share a
     wall, so the walk from the terrace back to the listening room
     never has to cross a space the visitor has not been shown.
     The first layout put audio south of the theatre, which made
     the return journey a teleport in all but name. */
  audio: { x0: 2, x1: 12, z0: 14, z1: 24, h: 3.2 },
  gaming: { x0: -2, x1: 12, z0: 24, z1: 34, h: 3.0 },
  living: { x0: -18, x1: -7.6, z0: 20, z1: 34, h: 3.6 },
  entrance: { x0: -9.5, x1: -3.5, z0: 38, z1: 46, h: 3.2 },
  terrace: { x0: 12, x1: 40, z0: -10, z1: 36 },
  pool: { x0: 17, x1: 33, z0: 0, z1: 16 },
}

/* The theatre was built around its own centre. Rather than
   renumber a room that already works, it is placed in the house
   by an offset and its beats stay in the coordinates they were
   authored and tuned in. */
export const ZONE_ORIGIN = {
  theatre: [-6.5, 0, -1],
}

export const ZONES = [
  'exterior',
  'entrance',
  'living',
  'spine',
  'theatre',
  'corridorB',
  'terrace',
  'gaming',
  'audio',
]

/* WHAT EACH ZONE CAN SEE FROM INSIDE IT.
   A large house is only affordable if most of it is switched off
   most of the time. Standing in the theatre you cannot see the
   terrace, so the terrace is not drawn — and the frame cost stays
   near constant however many rooms get added later. Sky and
   ground are always on; only rooms are culled. */
export const VISIBLE_FROM = {
  /* The reveal looks at the east elevation from the terrace, so
     the living space and entrance hall are behind the house mass
     and contribute nothing but cost. */
  exterior: ['exterior', 'terrace', 'gaming', 'audio', 'corridorB'],
  entrance: ['entrance', 'spine', 'living', 'exterior'],
  living: ['living', 'spine', 'entrance', 'exterior'],
  spine: ['spine', 'entrance', 'living', 'theatre', 'corridorB', 'gaming'],
  theatre: ['theatre', 'spine'],
  corridorB: ['corridorB', 'spine', 'terrace', 'exterior'],
  terrace: ['terrace', 'corridorB', 'gaming', 'audio', 'exterior', 'living', 'entrance'],
  gaming: ['gaming', 'terrace', 'audio', 'exterior'],
  audio: ['audio', 'gaming', 'corridorB', 'terrace', 'exterior'],
}

/* ============================================================
   SKY — day, sunset, blue hour, night

   The outdoor sequence is not a colour filter over a still. The
   sun moves, its colour changes, the sky gradient is re-mixed,
   the fog follows it and the exposure moves with all of it. The
   pool and landscape lighting come up as the sun goes down,
   because that is the actual argument the terrace is making: the
   system is at its best when the light has gone.
   ============================================================ */
export const skies = {
  day: {
    id: 'day',
    label: 'Day',
    top: 0x3f76b8,
    horizon: 0xbcd4e6,
    sun: [60, 48, 20],
    sunColor: 0xfff2dd,
    sunI: 3.2,
    ambient: 0.55,
    fog: 0x9fb6cc,
    fogDensity: 0.004,
    exposure: 1.0,
    artificial: 0,
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    top: 0x2b4a7a,
    horizon: 0xe0894a,
    sun: [72, 7, 6],
    sunColor: 0xff9a4d,
    sunI: 2.4,
    ambient: 0.34,
    fog: 0xa9713f,
    fogDensity: 0.006,
    exposure: 0.98,
    artificial: 0.3,
  },
  blue: {
    id: 'blue',
    label: 'Blue hour',
    top: 0x101f3d,
    horizon: 0x3c5a80,
    sun: [70, -3, 4],
    sunColor: 0x5f7fae,
    sunI: 0.7,
    ambient: 0.2,
    fog: 0x22344f,
    fogDensity: 0.009,
    exposure: 0.95,
    artificial: 0.75,
  },
  night: {
    id: 'night',
    label: 'Night',
    top: 0x03060e,
    horizon: 0x0b1522,
    sun: [40, -14, 0],
    sunColor: 0x2a3c58,
    sunI: 0.12,
    ambient: 0.09,
    fog: 0x060a12,
    fogDensity: 0.0125,
    exposure: 0.92,
    artificial: 1,
  },
}

/* ============================================================
   THEATRE — unchanged from the prototype
   ============================================================ */
export const screens = {
  oled: { id: 'oled', w: 1.9, aspect: 16 / 9, label: 'Premium OLED', spec: '77" · self-emissive' },
  led: { id: 'led', w: 3.4, aspect: 16 / 9, label: 'Large-format LED', spec: '138" · direct-view' },
  projection: { id: 'projection', w: 4.6, aspect: 16 / 9, label: 'Projection', spec: '120" · 4K laser' },
  scope: { id: 'scope', w: 6.0, aspect: 2.39, label: 'Cinema projection', spec: '160" · 2.39:1 scope' },
  ultra: { id: 'ultra', w: 7.2, aspect: 2.39, label: 'Ultra-large', spec: '200" · acoustically transparent' },
}

export const speakerSets = {
  floorstanding: { id: 'floorstanding', label: 'Floorstanding', show: ['towers', 'subs'] },
  inwall: { id: 'inwall', label: 'In-wall', show: ['inwall', 'surrounds', 'subs'] },
  atmos: { id: 'atmos', label: 'In-ceiling Atmos', show: ['inwall', 'surrounds', 'ceiling', 'subs'] },
  invisible: { id: 'invisible', label: 'Invisible', show: ['subs'] },
}

export const wallMaterials = {
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal Acoustic Fabric',
    color: 0x24242a,
    roughness: 0.94,
    lede: 'Woven wool over a mineral-wool core.',
    facts: [
      ['Origin', 'European wool, woven open to pass sound'],
      ['Finish', 'Railroaded — no seam on a wall run'],
      ['Acoustic', 'NRC 0.95 over 60mm core'],
      ['Applications', 'Theatre walls, ceiling rafts, grilles'],
    ],
  },
  walnut: {
    id: 'walnut',
    name: 'Natural Walnut',
    color: 0x4a3325,
    roughness: 0.52,
    lede: 'Quarter-cut veneer, hand-finished in oil.',
    facts: [
      ['Origin', 'American black walnut, quarter-cut'],
      ['Finish', 'Hardwax oil, matt, 5% sheen'],
      ['Acoustic', 'Battens at 40mm centres over absorber'],
      ['Applications', 'Battens, joinery, consoles, baffles'],
    ],
  },
  stone: {
    id: 'stone',
    name: 'Honed Basalt',
    color: 0x3a3c40,
    roughness: 0.78,
    lede: 'Dense volcanic stone, honed to a dead matt.',
    facts: [
      ['Origin', 'Single block per project, so the tone holds'],
      ['Finish', 'Honed, never polished — no specular glare'],
      ['Acoustic', 'Reflective; used only behind the seating'],
      ['Applications', 'Plinths, side returns, bar tops'],
    ],
  },
  plaster: {
    id: 'plaster',
    name: 'Lime Plaster',
    color: 0x8d8478,
    roughness: 0.96,
    lede: 'Warm off-white, polished by hand.',
    facts: [
      ['Origin', 'Natural hydraulic lime, pigmented in the mix'],
      ['Finish', 'Burnished in situ, matt'],
      ['Acoustic', 'Reflective; paired with a treated ceiling'],
      ['Applications', 'Architectural minimal schemes'],
    ],
  },
}

export const theatreDesigns = [
  {
    id: 'modern', n: '01', name: 'Modern Cinema',
    note: 'Black acoustic panels, reference black, nothing reflective.',
    wall: 'charcoal', battens: false, battenColor: 0x2a2a30,
    seat: 0x141416, seatRough: 0.62, floor: 0x1a1714, ceil: 0x101013,
    cove: 0xffb765, coveI: 2.1, star: true, screen: 'scope', speakers: 'inwall', exposure: 0.94,
  },
  {
    id: 'wood', n: '02', name: 'Luxury Wood',
    note: 'Walnut battens, warm light, full-grain leather.',
    wall: 'walnut', battens: true, battenColor: 0x53392a,
    seat: 0x5a3a26, seatRough: 0.5, floor: 0x24190f, ceil: 0x1b1410,
    cove: 0xffa54a, coveI: 2.4, star: true, screen: 'projection', speakers: 'floorstanding', exposure: 0.98,
  },
  {
    id: 'minimal', n: '03', name: 'Architectural Minimal',
    note: 'Light plaster, hidden speakers, one continuous LED wall.',
    wall: 'plaster', battens: false, battenColor: 0x8d8478,
    seat: 0x2e2b28, seatRough: 0.7, floor: 0x6b5f52, ceil: 0x93897c,
    cove: 0xfff0d8, coveI: 3.2, star: false, screen: 'ultra', speakers: 'invisible', exposure: 1.06,
  },
  {
    id: 'private', n: '04', name: 'Private Cinema',
    note: 'Stone returns, fabric walls, reference Atmos.',
    wall: 'stone', battens: true, battenColor: 0x3f4145,
    seat: 0x3a2f2a, seatRough: 0.56, floor: 0x1d1a17, ceil: 0x16161b,
    cove: 0xffc07a, coveI: 2.0, star: true, screen: 'scope', speakers: 'atmos', exposure: 0.92,
  },
]

/* ============================================================
   OUTDOOR — four terraces, one slab

   Same pool, same paving, same east elevation behind. What
   changes is what the terrace is FOR: lounging beside the water,
   a private outdoor cinema, a table for twelve, or the full
   night-time system with everything running at once.
   ============================================================ */
export const outdoorDesigns = [
  {
    id: 'poolside', n: '01', name: 'Poolside Entertainment',
    note: 'Large outdoor display, premium weatherproof audio, low landscape light.',
    sky: 'sunset', screen: { w: 3.4, aspect: 16 / 9 }, show: ['lounge', 'towers'],
    paving: 0x3d3a36, water: 0x11333d, poolLight: 0.5, landscape: 0.8,
  },
  {
    id: 'cinema', n: '02', name: 'Outdoor Cinema',
    note: 'A scope screen at the head of the pool, and seating that faces it.',
    sky: 'night', screen: { w: 6.4, aspect: 2.39 }, show: ['cinemaSeats', 'towers'],
    paving: 0x33312e, water: 0x0d2a33, poolLight: 1.0, landscape: 0.55,
  },
  {
    id: 'terrace', n: '03', name: 'Entertaining Terrace',
    note: 'Dining for twelve, integrated audio, shading out.',
    sky: 'day', screen: { w: 2.6, aspect: 16 / 9 }, show: ['dining', 'lounge', 'inwall'],
    paving: 0x6b665e, water: 0x2a6f80, poolLight: 0, landscape: 0,
  },
  {
    id: 'night', n: '04', name: 'Night Entertainment',
    note: 'Pool lit, cinema running, landscape lighting up, music across every zone.',
    sky: 'night', screen: { w: 6.4, aspect: 2.39 }, show: ['lounge', 'cinemaSeats', 'towers', 'inwall'],
    paving: 0x2e2c29, water: 0x0f3b47, poolLight: 1.35, landscape: 1.0,
  },
]

/* ============================================================
   GAMING — four suites in one room
   ============================================================ */
export const gamingDesigns = [
  {
    id: 'luxury', n: '01', name: 'Luxury Gaming',
    note: 'Dark premium interior, one OLED, an architectural desk.',
    wall: 0x22222a, floor: 0x1c1a18, ceil: 0x121215, battens: false,
    screen: { w: 1.3, aspect: 16 / 9 }, show: ['desk', 'chair'],
    cove: 0xffb765, coveI: 1.9, exposure: 0.94,
  },
  {
    id: 'simulation', n: '02', name: 'Simulation',
    note: 'Direct-drive rig, curved triple field, immersive audio.',
    wall: 0x2a2622, floor: 0x24190f, ceil: 0x17130f, battens: true,
    screen: { w: 4.2, aspect: 32 / 9 }, show: ['rig', 'towers'],
    cove: 0xffa54a, coveI: 2.2, exposure: 0.97,
  },
  {
    id: 'cinematic', n: '03', name: 'Cinematic Gaming',
    note: 'A wall of LED, lounge seating, minimal architecture.',
    wall: 0x8a8177, floor: 0x6b5f52, ceil: 0x8f867a, battens: false,
    screen: { w: 6.2, aspect: 16 / 9 }, show: ['lounge'],
    cove: 0xfff0d8, coveI: 3.0, exposure: 1.05,
  },
  {
    id: 'esports', n: '04', name: 'Premium Esports',
    note: 'Three stations, acoustic treatment, sub-frame latency.',
    wall: 0x2b2f34, floor: 0x1d1c1b, ceil: 0x15171a, battens: true,
    screen: { w: 2.4, aspect: 16 / 9 }, show: ['stations', 'chair', 'panels'],
    cove: 0xbcd0e8, coveI: 2.4, exposure: 0.96,
  },
]

/* ============================================================
   LISTENING ROOM — five ways to put sound in a room
   ============================================================ */
export const audioSets = [
  {
    id: 'floorstanding', n: '01', name: 'Floorstanding',
    note: 'The speaker is furniture, and is meant to be.',
    show: ['towers'], spec: '3-way · 28Hz–40kHz · 88dB',
  },
  {
    id: 'bookshelf', n: '02', name: 'Bookshelf',
    note: 'The smallest thing that still images properly.',
    show: ['bookshelf', 'sub'], spec: '2-way · 42Hz–35kHz · 86dB',
  },
  {
    id: 'inwall', n: '03', name: 'In-wall',
    note: 'Flush with the plaster, and gone.',
    show: ['inwall', 'sub'], spec: '3-way sealed · 45Hz–22kHz · 89dB',
  },
  {
    id: 'ceiling', n: '04', name: 'In-ceiling',
    note: 'For the channels that should come from above.',
    show: ['ceiling', 'inwall', 'sub'], spec: '2-way pivoting · 55Hz–22kHz',
  },
  {
    id: 'invisible', n: '05', name: 'Invisible',
    note: 'Plastered over. There is nothing to see, by design.',
    show: ['sub'], spec: 'Flat-panel radiator · 80Hz–20kHz',
  },
]

/* ============================================================
   SMART HOME — the house responding, seen from the living space
   ============================================================ */
export const scenes = [
  {
    id: 'arrive', n: '01', name: 'Arrive Home', sky: 'blue',
    note: 'Path lights to 40%, sheers open, climate to 23°, music on low.',
    house: { living: 1.0, terrace: 0.5, spine: 0.8, pool: 0.2 }, exposure: 0.98,
  },
  {
    id: 'movie', n: '02', name: 'Movie Night', sky: 'night',
    note: 'Blackout closes, house to 10%, projector on, subs armed.',
    house: { living: 0.12, terrace: 0.1, spine: 0.25, pool: 0 }, exposure: 0.9,
  },
  {
    id: 'party', n: '03', name: 'Party', sky: 'night',
    note: 'Indoor and outdoor zones linked, pool lit, terrace open.',
    house: { living: 0.85, terrace: 1.0, spine: 0.7, pool: 1.35 }, exposure: 0.97,
  },
  {
    id: 'goodnight', n: '04', name: 'Good Night', sky: 'night',
    note: 'Every zone off, night path at 5%, doors locked, perimeter armed.',
    house: { living: 0.06, terrace: 0.12, spine: 0.1, pool: 0 }, exposure: 0.88,
  },
]

/* ============================================================
   ANNOTATIONS — welded to a point in the house
   ============================================================ */
export const hotspots = [
  {
    id: 'screen', zone: 'theatre', at: [0, 1.55, -6.75], label: 'Screen', show: [0.2, 0.26],
    panel: {
      title: 'Acoustically Transparent Screen',
      lede: 'Sized to the seating, not to the wall.',
      facts: [
        ['Weave', 'Acoustically transparent, 1% open area'],
        ['Gain', 'Matched to room reflectance'],
        ['Channels', 'L/C/R positioned behind the image'],
        ['Calibration', 'Set to the front-row eyeline'],
      ],
    },
  },
  {
    id: 'seat', zone: 'theatre', at: [1.0, 0.78, 1.4], label: 'Recliner', show: [0.135, 0.175],
    panel: {
      title: 'Motorised Recliner',
      lede: 'Engineered for a three-hour film.',
      facts: [
        ['Recline', 'Motorised, infinite positions'],
        ['Lumbar', 'Powered, four-stage'],
        ['Seat width', '760mm'],
        ['Wall clearance', '80mm — wall-hugging mechanism'],
      ],
    },
  },
  {
    id: 'inwall', zone: 'theatre', at: [-4.42, 1.35, -2.2], label: 'In-wall speaker', show: [0.325, 0.35],
    panel: {
      title: 'Reference In-Wall Speaker',
      lede: 'Flush with the plaster, painted with the wall.',
      facts: [
        ['Configuration', '3-way, sealed back-box'],
        ['Response', '45Hz – 22kHz'],
        ['Sensitivity', '89dB / 2.83V / 1m'],
        ['Cut-out', '312 × 512mm, 92mm deep'],
      ],
    },
  },
  {
    id: 'outdoorSpk', zone: 'terrace', at: [15.4, 0.55, 9.5], label: 'Landscape speaker', show: [0.566, 0.6],
    panel: {
      title: 'Landscape Speaker',
      lede: 'Buried in the planting, heard across the terrace.',
      facts: [
        ['Configuration', '2-way, sealed', ],
        ['Response', '65Hz – 20kHz'],
        ['Enclosure', 'IP66, UV-stable composite'],
        ['Mounting', 'Ground spike, cable buried to the plant room'],
      ],
    },
  },
  {
    id: 'poolEdge', zone: 'terrace', at: [17.4, 0.08, 10], label: 'Pool lighting', show: [0.604, 0.632],
    panel: {
      title: 'Pool & Landscape Lighting',
      lede: 'Warm below the water, cooler in the planting.',
      facts: [
        ['Colour', '2700K underwater, 3000K landscape'],
        ['Control', 'On the house scenes, not on a timer'],
        ['Fittings', 'Flush niche, no visible bezel'],
        ['Zones', 'Water, coping, planting, façade'],
      ],
    },
  },
  {
    id: 'rig', zone: 'gaming', at: [1.2, 1.0, 28.6], label: 'Racing rig', show: [0.87, 0.888],
    panel: {
      title: 'Direct-Drive Simulator',
      lede: 'Force feedback measured in newton-metres, not settings.',
      facts: [
        ['Wheelbase', 'Direct drive, 20Nm'],
        ['Pedals', 'Load-cell brake, 140kg'],
        ['Display', 'Triple curved, 32:9 equivalent'],
        ['Chassis', 'Aluminium profile on isolators'],
      ],
    },
  },
]

/* ============================================================
   THE ROUTE

   Sixty-one beats. Every one names the zone it stands in, where
   the camera is, what it looks at, and what that zone is showing.

   The travel beats between rooms are not filler — they are the
   entire reason this reads as a house. A doorway approached,
   entered and left behind is what makes two rooms adjacent rather
   than merely sequential.
   ============================================================ */
const B = (p, zone, cam, look, chapter, title, note, extra = {}) => ({
  p, zone, cam, look, chapter, title, note, ...extra,
})

export const beats = [
  /* ---------- ARRIVAL ---------- */
  /* Zone 'entrance', not 'exterior', even though the camera is
     outdoors for all three. The zone here is choosing what gets
     DRAWN, and the arrival is looking straight at the front door:
     it needs the entrance hall and the light behind its glazing.
     'exterior' is scoped to the closing reveal, which looks the
     other way down the east elevation and would otherwise pay to
     draw a hall hidden behind the house. */
  B(0.0, 'entrance', [-6.5, 1.7, 62], [-6.5, 2.2, 46], 'Arrival', 'The approach', 'Scroll to walk in.', { sky: 'night' }),
  B(0.018, 'entrance', [-6.5, 1.68, 54], [-6.5, 2.0, 46], 'Arrival', 'The house', '', { sky: 'night' }),
  B(0.034, 'entrance', [-6.5, 1.64, 48.5], [-6.5, 1.7, 40], 'Arrival', 'The door', '', { sky: 'night' }),
  B(0.05, 'entrance', [-6.5, 1.62, 44], [-6.5, 1.6, 36], 'Arrival', 'Inside', '', { sky: 'night' }),

  /* ---------- LIVING ---------- */
  B(0.068, 'entrance', [-6.5, 1.6, 39.5], [-8.5, 1.55, 30], 'Living', 'The living space', '', { sky: 'night' }),
  B(0.088, 'living', [-8.6, 1.6, 31], [-13, 1.5, 26], 'Living', 'One room, open east', 'Glazing on two sides, and the terrace beyond it.', { sky: 'night' }),
  B(0.108, 'living', [-12, 1.6, 27.5], [-16, 1.5, 24], 'Living', 'Integrated, not installed', 'Nothing on display. The system is in the building.', { sky: 'night' }),

  /* ---------- SPINE, WALKING SOUTH ---------- */
  B(0.13, 'spine', [-6.5, 1.58, 26], [-6.5, 1.5, 14], 'Corridor', 'The spine', 'Every room in the house opens off this.', { sky: 'night' }),
  B(0.15, 'theatre', [0, 1.6, 11.4], [0, 1.5, -1], 'Corridor', 'The theatre door', '', { sky: 'night' }),
  B(0.168, 'theatre', [0, 1.58, 7.0], [0, 1.5, -3], 'Home Theatre', 'Entering', '', { sky: 'night' }),

  /* ---------- THEATRE ---------- */
  B(0.185, 'theatre', [0, 1.56, 4.6], [0, 1.5, -5], 'Home Theatre', 'The room', 'Twelve seats, two tiers, one screen.', { design: 0 }),
  B(0.205, 'theatre', [0, 1.51, 1.6], [0, 1.5, -6], 'Home Theatre', 'The aisle', '', { design: 0 }),
  B(0.235, 'theatre', [0, 1.66, 2.25], [0, 1.42, -7], 'Design 01 / 04', 'Modern Cinema', 'Black acoustic panels. Reference black. Nothing reflective.', { design: 0 }),
  B(0.265, 'theatre', [-1.28, 1.66, 2.2], [0.5, 1.4, -7], 'Design 02 / 04', 'Luxury Wood', 'Walnut battens, warm light, full-grain leather.', { design: 1 }),
  B(0.295, 'theatre', [1.28, 1.68, 2.2], [-0.5, 1.4, -7], 'Design 03 / 04', 'Architectural Minimal', 'Light plaster, hidden speakers, one continuous LED wall.', { design: 2 }),
  B(0.322, 'theatre', [0, 1.72, 2.3], [0, 1.38, -7], 'Design 04 / 04', 'Private Cinema', 'Stone returns, fabric walls, reference Atmos.', { design: 3 }),

  /* ---------- THEATRE CONFIGURATION ---------- */
  B(0.34, 'theatre', [-2.0, 1.4, -2.0], [-4.5, 1.4, -3.2], 'Speakers', 'In-wall', 'Flush with the plaster, and gone.', { design: 3, speakers: 'inwall' }),
  B(0.355, 'theatre', [-1.4, 1.4, -1.4], [-2.0, 3.2, -4.0], 'Speakers', 'In-ceiling Atmos', 'Four height channels, aimed at the seat.', { design: 3, speakers: 'atmos' }),
  B(0.372, 'theatre', [0, 1.62, 2.0], [0, 1.45, -7], 'Screen', 'Premium OLED', '77 inches. The smallest thing that still works here.', { design: 3, screen: 'oled' }),
  B(0.388, 'theatre', [0, 1.62, 2.0], [0, 1.45, -7], 'Screen', 'Projection', '120 inches, 4K laser.', { design: 3, screen: 'projection' }),
  B(0.404, 'theatre', [0, 1.62, 2.05], [0, 1.45, -7], 'Screen', 'Ultra-large', '200 inches, wall to wall, acoustically transparent.', { design: 3, screen: 'ultra' }),
  B(0.422, 'theatre', [-1.6, 1.45, -1.0], [-4.5, 1.5, -1.0], 'Materials', 'Natural Walnut', '', { design: 3, wall: 'walnut', screen: 'scope' }),
  B(0.438, 'theatre', [-1.6, 1.45, -1.0], [-4.5, 1.5, -1.0], 'Materials', 'Honed Basalt', '', { design: 3, wall: 'stone' }),
  B(0.452, 'theatre', [-1.6, 1.45, -1.0], [-4.5, 1.5, -1.0], 'Materials', 'Charcoal Acoustic Fabric', '', { design: 3, wall: 'charcoal' }),
  B(0.468, 'theatre', [0, 1.95, 5.2], [0, 1.4, -7], 'Home Theatre', 'The complete room', 'One room. Four ways to build it.', { design: 3 }),

  /* ---------- OUT THROUGH THE CORRIDOR ---------- */
  B(0.485, 'theatre', [0, 1.6, 7.4], [0, 1.5, 12], 'Corridor', 'Leaving the theatre', '', {}),
  B(0.5, 'spine', [-6.5, 1.58, 11], [-2, 1.5, 12], 'Corridor', 'Turning east', '', {}),
  B(0.515, 'corridorB', [-3, 1.58, 12], [6, 1.5, 12], 'Corridor', 'Toward the glass', 'The terrace is behind that door.', {}),
  B(0.53, 'corridorB', [4, 1.58, 12], [13, 1.5, 12], 'Corridor', 'The glass door', '', {}),
  B(0.545, 'corridorB', [10.5, 1.58, 12], [16, 1.5, 11], 'Outdoor', 'Stepping out', '', { sky: 'sunset' }),

  /* ---------- TERRACE ---------- */
  B(0.562, 'terrace', [14, 1.6, 11], [22, 1.3, 8], 'Outdoor', 'The terrace', 'The same system, carried outside.', { sky: 'sunset', design: 0 }),
  B(0.582, 'terrace', [16.5, 1.62, 9], [26, 1.1, 8], 'Outdoor', 'The pool', '', { sky: 'sunset', design: 0 }),
  B(0.605, 'terrace', [19, 1.6, 17.5], [26, 1.2, 8], 'Outdoor', 'Along the water', '', { sky: 'sunset', design: 0 }),

  /* ---------- OUTDOOR DESIGNS ---------- */
  B(0.628, 'terrace', [21, 1.65, 20], [30, 1.4, 8], 'Outdoor 01 / 04', 'Poolside Entertainment', 'Large outdoor display, premium weatherproof audio, low landscape light.', { design: 0 }),
  B(0.655, 'terrace', [22.5, 1.7, 21], [32, 1.6, 8], 'Outdoor 02 / 04', 'Outdoor Cinema', 'A scope screen at the head of the pool, and seating that faces it.', { design: 1 }),
  B(0.68, 'terrace', [20, 1.68, 22], [30, 1.4, 7], 'Outdoor 03 / 04', 'Entertaining Terrace', 'Dining for twelve, integrated audio, shading out.', { design: 2 }),
  B(0.703, 'terrace', [23, 1.7, 20], [33, 1.5, 8], 'Outdoor 04 / 04', 'Night Entertainment', 'Pool lit, cinema running, landscape lighting up.', { design: 3 }),

  /* ---------- DAY TO NIGHT ---------- */
  B(0.724, 'terrace', [24, 1.72, 18], [16, 1.6, 10], 'Day to Night', 'Day', 'Bright natural light, shading out, the display asleep.', { design: 3, sky: 'day' }),
  B(0.742, 'terrace', [24, 1.72, 18], [16, 1.6, 10], 'Day to Night', 'Sunset', 'The sun drops behind the house.', { design: 3, sky: 'sunset' }),
  B(0.758, 'terrace', [24, 1.72, 18], [16, 1.6, 10], 'Day to Night', 'Blue hour', 'Architectural lighting begins.', { design: 3, sky: 'blue' }),
  B(0.775, 'terrace', [24, 1.72, 18], [16, 1.6, 10], 'Day to Night', 'Night', 'Pool lit, landscape up, warm light through the glass.', { design: 3, sky: 'night' }),

  /* ---------- BACK INSIDE, THROUGH THE GAMING DOOR ---------- */
  B(0.793, 'terrace', [20, 1.62, 24], [14, 1.5, 29], 'Gaming', 'Back toward the house', '', { design: 3, sky: 'night' }),
  B(0.808, 'terrace', [14.8, 1.6, 28], [8, 1.5, 29], 'Gaming', 'The second door', '', { design: 3, sky: 'night' }),
  B(0.822, 'gaming', [10.8, 1.58, 29], [2, 1.5, 29], 'Gaming', 'Entering', '', { sky: 'night' }),

  /* ---------- GAMING ---------- */
  B(0.838, 'gaming', [7.5, 1.6, 29.5], [-2, 1.4, 28.6], 'Gaming', 'The suite', 'Built like a study. No lightshow.', { design: 0 }),
  B(0.857, 'gaming', [4.5, 1.62, 30.4], [-2, 1.35, 28], 'Gaming 01 / 04', 'Luxury Gaming', 'Dark premium interior, one OLED, an architectural desk.', { design: 0 }),
  B(0.876, 'gaming', [3.6, 1.6, 31], [-2, 1.3, 27.6], 'Gaming 02 / 04', 'Simulation', 'Direct-drive rig, curved triple field, immersive audio.', { design: 1 }),
  B(0.895, 'gaming', [5.2, 1.68, 31.4], [-2, 1.4, 28.4], 'Gaming 03 / 04', 'Cinematic Gaming', 'A wall of LED, lounge seating, minimal architecture.', { design: 2 }),
  B(0.912, 'gaming', [4.2, 1.62, 30.6], [-2, 1.35, 28.2], 'Gaming 04 / 04', 'Premium Esports', 'Three stations, acoustic treatment, sub-frame latency.', { design: 3 }),

  /* ---------- DOWN INTO THE LISTENING ROOM ---------- */
  B(0.928, 'gaming', [6, 1.58, 26.5], [6, 1.45, 20], 'Audio', 'Through to the listening room', '', { design: 3 }),
  B(0.941, 'audio', [6, 1.55, 22.5], [7, 1.35, 15], 'Audio', 'One seat, one axis', 'A room arranged around a single chair.', { design: 0 }),
  B(0.952, 'audio', [7, 1.5, 21], [7, 1.3, 14], 'Audio 01 / 05', 'Floorstanding', 'The speaker is furniture, and is meant to be.', { design: 0 }),
  B(0.961, 'audio', [7, 1.5, 21], [7, 1.3, 14], 'Audio 02 / 05', 'Bookshelf', 'The smallest thing that still images properly.', { design: 1 }),
  B(0.969, 'audio', [7, 1.5, 21], [7, 1.3, 14], 'Audio 03 / 05', 'In-wall', 'Flush with the plaster, and gone.', { design: 2 }),
  B(0.976, 'audio', [7, 1.55, 20.5], [7, 2.7, 15], 'Audio 04 / 05', 'In-ceiling', 'For the channels that should come from above.', { design: 3 }),
  B(0.982, 'audio', [7, 1.5, 21], [7, 1.3, 14], 'Audio 05 / 05', 'Invisible', 'Plastered over. There is nothing to see, by design.', { design: 4 }),

  /* ---------- OUT, AND THE HOUSE RESPONDS ----------
     The smart-home demonstration happens OUTSIDE, looking back at
     the whole east elevation. Shown from a single room it would be
     one set of lights dimming; shown from the terrace it is the
     entire house — living, spine, terrace, pool — moving together,
     which is the only version of that argument worth making. */
  B(0.988, 'audio', [7, 1.55, 16], [11, 1.5, 15], 'Smart Home', 'Out to the terrace', '', { design: 4 }),
  B(0.9925, 'terrace', [17, 1.75, 14], [4, 2.0, 18], 'Smart Home', 'Arrive Home', 'Path lights to 40%, sheers open, climate to 23 degrees.', { scene: 0, sky: 'blue' }),
  B(0.9955, 'terrace', [19, 2.0, 16], [4, 2.0, 18], 'Smart Home', 'Movie Night', 'Blackout closes, house to 10%, projector on.', { scene: 1, sky: 'night' }),
  B(0.9975, 'terrace', [21, 2.2, 18], [4, 2.0, 18], 'Smart Home', 'Party', 'Indoor and outdoor zones linked, pool lit.', { scene: 2, sky: 'night' }),
  B(0.9992, 'terrace', [23, 2.6, 20], [4, 2.0, 18], 'Smart Home', 'Good Night', 'Every zone off, doors locked, perimeter armed.', { scene: 3, sky: 'night' }),
  B(1.0, 'exterior', [31, 6.0, 30], [2, 1.8, 16], 'The House', 'One residence', 'Every room on one system, running as one.', { sky: 'night', scene: 2 }),
]

/* The progress rail. Grouped by the ROOM the chapter belongs to
   rather than by chapter title, so "Design 02 / 04" does not earn
   its own row — the visitor wants to know they are in the
   theatre, not which of its four schemes is on screen. */
const RAIL = [
  { id: 'arrival', icon: 'home', label: 'Home', match: ['Arrival', 'Living', 'Corridor'] },
  { id: 'theatre', icon: 'theatre', label: 'Theatre', match: ['Home Theatre', 'Design', 'Screen', 'Speakers', 'Materials'] },
  { id: 'outdoor', icon: 'terrace', label: 'Outdoor', match: ['Outdoor', 'Day to Night'] },
  { id: 'gaming', icon: 'controller', label: 'Gaming', match: ['Gaming'] },
  { id: 'audio', icon: 'ear', label: 'Audio', match: ['Audio'] },
  { id: 'smart', icon: 'scene', label: 'Smart Home', match: ['Smart Home', 'The House'] },
]

export const rail = RAIL.map((r, i) => ({
  ...r,
  /* Where the rail jumps to: the first beat whose chapter belongs
     to this room. Derived, so a re-cut route cannot leave the
     navigation pointing at a beat that no longer exists. */
  p: beats.find((b) => RAIL[i].match.some((m) => b.chapter.startsWith(m)))?.p ?? 0,
}))

/** Which rail entry a chapter belongs to. */
export function railFor(chapter) {
  return RAIL.find((r) => r.match.some((m) => chapter.startsWith(m)))?.id ?? RAIL[0].id
}
