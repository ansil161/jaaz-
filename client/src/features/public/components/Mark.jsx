/* ============================================================
   MARKS — THE SITE'S ONE ICON SET

   WHY THIS FILE EXISTS AT ALL

   The pages were numbered. Every list, every step, every space
   and every system layer opened with an ordinal — 01, 02, 03 —
   set in the numeric face at 11px. That is a habit, not a
   decision: a numeral tells you WHERE a thing sits in a list and
   nothing whatsoever about WHAT it is, and on a page where the
   items are already in visual order, position was the one fact
   the reader did not need.

   So the ordinals are marks now. "01 Listen" becomes an ear and
   the word Listen; "03 Acoustics" becomes a decay curve. The
   list still reads in order — it is a list — but the eye now
   collects a subject on the way past instead of a count.

   NUMBERS THAT ARE FACTS ARE STILL NUMBERS. 200+ projects, 0.3s
   decay, ±1.5 dB, a year, a price band, a seat count, "05 / 12
   shown" — those are quantities, and a glyph cannot say them.
   Only ordinals were replaced.

   ------------------------------------------------------------
   AUTHORED, NOT IMPORTED

   `lucide-react` is a dependency and is used in the console and
   the chat widget. It is the wrong source here. Lucide draws at
   stroke 2, round caps, round joins. This site's line work —
   which started in contact/components/icons.jsx and is now this
   file — is stroke 1.25, SQUARE caps, MITER joins, on a 24 box.
   The two do not sit on a page together: the round-capped one
   reads as a UI kit that arrived with a library, next to type
   that was drawn.

   EVERYTHING SURVIVES 18px. These are set between 15 and 22 and
   nowhere else, so every detail is drawn in whole units. A
   feature under a unit on the 24 box lands on about two device
   pixels and reads as dirt on the glyph rather than as a line.
   That rule is why the projector emits no rays and the star
   ceiling has one star and four points rather than twenty.

   ONE SET, NOT PER-PAGE SETS. contact/components/icons.jsx now
   re-exports from here; home/components/scene/sceneIcons.jsx is
   deliberately left where it is (it is sized and hinted against
   one readout — see the note in that file). Everything else on
   the public site draws from this table, so the mark used for
   Acoustics on About is the mark used for Acoustics on
   Solutions, which is the entire point of having a set.
   ============================================================ */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  focusable: false,
}

const MARKS = {
  /* --- Rooms ------------------------------------------------ */
  theatre: (
    <>
      <rect x="4" y="6" width="16" height="10" />
      <path d="M4 20h16M9 20v-4M15 20v-4" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <rect x="3" y="12" width="18" height="6" />
      <path d="M4 18v2M20 18v2" />
    </>
  ),
  controller: (
    <>
      <path d="M6 9h12l2 8a2 2 0 0 1-3.6 1.4L15 16H9l-1.4 2.4A2 2 0 0 1 4 17z" />
      <path d="M9 12h2M8 11v2M15 12.5h.01M17.5 10.5h.01" />
    </>
  ),
  glass: (
    <>
      <path d="M6 4h12l-2 9a4 4 0 0 1-8 0z" />
      <path d="M12 13v7M9 20h6" />
    </>
  ),
  terrace: (
    <>
      <path d="M3 10a9 9 0 0 1 18 0z" />
      <path d="M12 10v10M12 20H8M12 20h4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  /* Open plan: one shell, no back wall, two zones inside it. */
  openPlan: (
    <>
      <path d="M3 20V7l9-4 9 4v13" />
      <path d="M3 20h18M12 20v-6M12 14H7v6" />
    </>
  ),
  /* A room considered as a volume rather than as a place. */
  room: (
    <>
      <rect x="3.5" y="6.5" width="14" height="12" />
      <path d="M3.5 6.5L7 3h14v12l-3.5 3.5" />
    </>
  ),
  /* Fire — the terrace at night, and the party held outdoors. */
  flame: (
    <>
      <path d="M12 3c4 4 6 6.5 6 10a6 6 0 0 1-12 0c0-2 .8-3.5 2-5 .5 1.5 1.2 2 2 2 0-3 1-5 2-7z" />
      <path d="M8 21h8" />
    </>
  ),

  /* --- Picture ---------------------------------------------- */
  screen: (
    <>
      <rect x="3" y="5" width="18" height="11" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  projector: (
    <>
      <rect x="3" y="8" width="14" height="9" />
      <circle cx="8" cy="12.5" r="2.5" />
      <path d="M17 10.5l4-2v8l-4-2M5 17v2M15 17v2" />
    </>
  ),
  /* Masking: the scope frame closing in on the flat one. */
  masking: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" />
      <path d="M6 9.5h12v5H6zM6 5.5v4M18 5.5v4M6 14.5v4M18 14.5v4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </>
  ),
  /* Invisible engineering: the same eye, closed over its work. */
  eyeClosed: (
    <>
      <path d="M2.5 10.5S6 15.5 12 15.5s9.5-5 9.5-5" />
      <path d="M5 14l-1.5 3M12 15.5V19M19 14l1.5 3" />
    </>
  ),

  /* --- Sound ------------------------------------------------ */
  speaker: (
    <>
      <rect x="6" y="3" width="12" height="18" />
      <circle cx="12" cy="14" r="3.5" />
      <circle cx="12" cy="7" r="1.5" />
    </>
  ),
  sub: (
    <>
      <rect x="4" y="6" width="16" height="14" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M12 11v4" />
    </>
  ),
  ceilingSpeaker: (
    <>
      <path d="M3 5h18" />
      <circle cx="12" cy="13" r="5.5" />
      <circle cx="12" cy="13" r="1.75" />
      <path d="M12 5v2" />
    </>
  ),
  /* Height channels: sound arriving from above the seat. */
  atmos: (
    <>
      <path d="M3 4h18" />
      <path d="M8 6.5L12 13l4-6.5" />
      <path d="M5 20h14M9 20v-3h6v3" />
    </>
  ),
  /* The centre channel: dialogue, aligned to the screen. */
  dialogue: (
    <>
      <path d="M3.5 5.5h17v10h-9l-4.5 4v-4h-3.5z" />
      <path d="M9 10.5h6" />
    </>
  ),
  wave: (
    <>
      <path d="M4.5 8.5v7M9.5 5.5v13M14.5 7v10M19.5 9.5v5" />
      <path d="M2 12h20" />
    </>
  ),
  mic: (
    <>
      <rect x="9.5" y="3" width="5" height="10" />
      <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6" />
    </>
  ),
  fader: (
    <>
      <path d="M4 4v16M12 4v16M20 4v16" />
      <path d="M2 9h4M10 15h4M18 7h4" />
    </>
  ),

  /* --- Acoustics -------------------------------------------- */
  /* Decay: the tail the room adds, and where it is brought to. */
  decay: (
    <>
      <path d="M3 20V4" />
      <path d="M3 8c4 0 5 3 7 5.5s4 4 11 4.5" />
      <path d="M3 20h18" />
    </>
  ),
  /* Absorption: energy entering a panel and not coming back. */
  absorption: (
    <>
      <rect x="3" y="4" width="6" height="16" />
      <path d="M5 8h2M5 12h2M5 16h2" />
      <path d="M20 8l-8 4M20 16l-8-4" />
    </>
  ),
  /* Diffusion: one arrival, scattered — a well-depth profile. */
  diffusion: (
    <>
      <path d="M3 20V8h3v12M6 20V4h3v16M9 20V10h3v10M12 20V6h3v14M15 20V11h3v9" />
      <path d="M2 20h20" />
    </>
  ),
  /* Isolation: mass, a gap, mass. What keeps the sound in. */
  isolation: (
    <>
      <path d="M5 3v18M9 3v18M15 3v18M19 3v18" />
      <path d="M11 12h2" />
    </>
  ),
  /* Modal behaviour: the standing wave the room wants to have. */
  mode: (
    <>
      <rect x="2.5" y="6.5" width="19" height="11" />
      <path d="M2.5 12c3-6 6.5-6 9.5 0s6.5 6 9.5 0" />
    </>
  ),

  /* --- Comfort ---------------------------------------------- */
  seat: (
    <>
      <path d="M6 4h9a2 2 0 0 1 2 2v7H6z" />
      <path d="M4 13h15a2 2 0 0 1 2 2v4H4z" />
      <path d="M4 19v2M21 19v2" />
    </>
  ),
  /* The chair at full extension — the leg rest, not the seat. */
  recline: (
    <>
      <path d="M3 8.5l7-3 3 7-7 3z" />
      <path d="M3 15.5h14a2 2 0 0 1 2 2v3H3z" />
      <path d="M21 12v8" />
    </>
  ),
  /* The console beside the seat: a drawer, and what goes in it. */
  storage: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" />
      <path d="M3.5 12h17M10 8h4M10 15.5h4" />
    </>
  ),
  /* Upholstery, acoustic fabric, anything woven. */
  fabric: (
    <>
      <path d="M3.5 3.5h17v17h-17z" />
      <path d="M8 3.5v17M13 3.5v17M3.5 9h17M3.5 15h17" />
    </>
  ),
  /* Riser: the tiers the sightline is set out on. */
  riser: (
    <>
      <path d="M2 20h5v-4h5v-4h5V8h5" />
      <path d="M2 20v-4" />
    </>
  ),
  body: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 8v7M7 11h10M9 21l3-6 3 6" />
    </>
  ),
  ear: (
    <>
      <path d="M7 10a5 5 0 0 1 10 0c0 3-2.5 3.5-3.5 5.5S13 21 11 21a2.5 2.5 0 0 1-2.5-2.5" />
      <path d="M10.5 10a1.5 1.5 0 0 1 3 0c0 1.5-1.5 1.5-1.5 3" />
    </>
  ),
  /* Climate: moved air, held temperature. */
  climate: (
    <>
      <rect x="3" y="4" width="18" height="6" />
      <path d="M6 7h2M11 7h2M16 7h2" />
      <path d="M7 13c0 3 3 3 3 6M14 13c0 3 3 3 3 6" />
    </>
  ),
  /* Airflow alone, where climate would be too much machine. */
  air: <path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h14a2.5 2.5 0 1 1-2.5 2.5M3 16h8" />,

  /* --- Light ------------------------------------------------ */
  light: (
    <>
      <path d="M9 17h6M10 20h4" />
      <path d="M12 3a6 6 0 0 0-3 11v3h6v-3a6 6 0 0 0-3-11z" />
    </>
  ),
  /* Cove: light thrown at a surface it never appears on. */
  cove: (
    <>
      <path d="M3 4h18v4H3z" />
      <path d="M6 11l-2 4M12 11v5M18 11l2 4" />
      <path d="M2 20h20" />
    </>
  ),
  star: (
    <>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M5 17h1M18 18h1M9 20h1M16 21h1" />
    </>
  ),
  curtain: (
    <>
      <path d="M3 4h18" />
      <path d="M7 4c0 6-1 10-3 16M11 4c0 6 .5 10 1.5 16" />
      <path d="M17 4v16M17 12h4" />
    </>
  ),

  /* --- Control ---------------------------------------------- */
  /* One press. The whole argument of the control section. */
  scene: (
    <>
      <rect x="4" y="3" width="16" height="18" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8 15h8M8 18h5" />
    </>
  ),
  remote: (
    <>
      <rect x="8" y="2.5" width="8" height="19" />
      <circle cx="12" cy="7" r="1.75" />
      <path d="M10 12h4M10 15h4M10 18h4" />
    </>
  ),
  automation: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  zones: (
    <>
      <rect x="3" y="3" width="8" height="8" />
      <rect x="13" y="3" width="8" height="8" />
      <rect x="3" y="13" width="8" height="8" />
      <path d="M13 17h8M17 13v8" />
    </>
  ),
  cable: (
    <>
      <path d="M5 3v6a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4v4" />
      <path d="M3 3h4M17 21h4" />
    </>
  ),
  power: <path d="M13 2L5 13h6l-2 9 8-11h-6z" />,
  /* The rack: sources, processing and amplification, stacked. */
  rack: (
    <>
      <rect x="4" y="2.5" width="16" height="19" />
      <path d="M4 9h16M4 15h16" />
      <path d="M7 6h4M7 12h4M7 18h4M16 6h1M16 12h1M16 18h1" />
    </>
  ),
  /* Water, and the fall that takes it away from the enclosure. */
  drain: (
    <>
      <path d="M12 3c3 4 4.5 6 4.5 8a4.5 4.5 0 0 1-9 0c0-2 1.5-4 4.5-8z" />
      <path d="M2 21h20M2 21l4-3M22 21l-4-3" />
    </>
  ),
  stream: (
    <>
      <path d="M4.5 9a10 10 0 0 1 15 0M7.5 12.5a6 6 0 0 1 9 0" />
      <circle cx="12" cy="17.5" r="1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
    </>
  ),

  /* --- Method, process, people ------------------------------ */
  /* Listen: a conversation, not a headset. */
  listen: (
    <>
      <path d="M3.5 4.5h11v9h-7l-4 3.5z" />
      <path d="M17 8.5h3.5v9h-3l-3 2.5v-2.5h-3v-4" />
    </>
  ),
  /* Design: the room resolved in 3D before it is built in brick. */
  cube: (
    <>
      <path d="M12 2.5l9 4.75v9.5L12 21.5l-9-4.75v-9.5z" />
      <path d="M3 7.25L12 12l9-4.75M12 12v9.5" />
    </>
  ),
  compass: (
    <>
      <path d="M12 3v3M9.5 6.5L5 20M14.5 6.5L19 20" />
      <path d="M8 15h8" />
      <circle cx="12" cy="4.5" r="1.5" />
    </>
  ),
  /* Site study: the room measured before anything is promised. */
  measure: (
    <>
      <path d="M2.5 8.5h19v7h-19z" />
      <path d="M6 8.5v3M9.5 8.5v4.5M13 8.5v3M16.5 8.5v4.5M20 8.5v3" />
    </>
  ),
  /* Engineering: the build-up, layer by layer. */
  layers: (
    <>
      <path d="M12 2.5l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5L12 21l9-4.5" />
    </>
  ),
  /* Installation: one team, on site. */
  tools: (
    <>
      <path d="M14.5 3a4 4 0 0 0 5.5 5.5L10 18.5 8.5 20 4 15.5 5.5 14z" />
      <path d="M6 16.5l1.5 1.5" />
    </>
  ),
  /* Calibration: the instrument agreeing with the ear. */
  meter: (
    <>
      <path d="M3 18a9 9 0 0 1 18 0" />
      <path d="M12 18l5-5.5" />
      <path d="M3 18h4M17 18h4" />
    </>
  ),
  /* The signed report handed over with the room. */
  report: (
    <>
      <path d="M5.5 2.5h9L19 7v14.5H5.5z" />
      <path d="M14 2.5V7h5" />
      <path d="M8.5 12h7M8.5 15.5h7M8.5 19h4" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="12" r="4" />
      <path d="M11.5 12H21M18 12v3M15 12v2.5" />
    </>
  ),
  /* Care after handover: the room supported as it ages. */
  care: (
    <>
      <path d="M20.5 7.5a4.5 4.5 0 0 0-8.5-2 4.5 4.5 0 0 0-8.5 2c0 5 8.5 10.5 8.5 10.5s8.5-5.5 8.5-10.5z" />
      <path d="M3 21h18" />
    </>
  ),
  /* One accountable team. Two people, one outline. */
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
      <path d="M16 6.5a3 3 0 0 1 0 6M17.5 15.5c2 .8 3 2.2 3.5 4.5" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 9.5L6 6l4 1 2 2-2 2-3-2" />
      <path d="M21.5 9.5L18 6l-4 1" />
      <path d="M12 9l4.5 4.5M9.5 11.5L13 15M7.5 13.5l3 3" />
    </>
  ),
  /* Warranty, and a promise that survives handover. */
  shield: (
    <>
      <path d="M12 3.5l7 2.5v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  /* Acoustic honesty: the reading reported as it came. */
  scales: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M4 8h16M4 8l-2 5h4zM20 8l2 5h-4z" />
    </>
  ),
  /* A product, in its box. What the Difference section refuses. */
  box: (
    <>
      <path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5 3.5 16.5z" />
      <path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),

  /* --- Utility (carried over from the contact set) ---------- */
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.4 2.4 0 1 1 3.6 2c-1 .7-1.2 1.1-1.2 2" />
      <path d="M12 17h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5" />
    </>
  ),
  phone: (
    <path d="M6 3l3 1 .5 3-2 2c1 2.5 2.5 4 5 5l2-2 3 .5 1 3c-1.5 2-4 2.5-6.5 1.5C7.5 15.5 4.5 12.5 3 9 2 6.5 3 4.5 6 3z" />
  ),
  whatsapp: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.2A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M8.7 8.2c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5l.6 1.5c.1.2 0 .4-.1.5l-.5.6c-.1.2-.1.3 0 .5.4.8 1.5 1.9 2.3 2.3.2.1.3.1.5 0l.6-.5c.1-.1.3-.2.5-.1l1.5.6c.4.2.4.4.4.6v.5c0 .3 0 .6-.5.8-1 .5-2.3.3-3.7-.5-1.6-.9-2.9-2.2-3.8-3.8-.8-1.4-1-2.7-.5-3.7z" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" />
      <path d="M4 6.5l8 6.5 8-6.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17.5" cy="6" r="2.3" />
      <circle cx="17.5" cy="18" r="2.3" />
      <path d="M8.1 10.8l7.4-3.6M8.1 13.2l7.4 3.6" />
    </>
  ),
  'sun-rise': (
    <>
      <path d="M12 4v3M5 12H2M22 12h-3M5.6 8.6l-2-2M20.4 8.6l2-2" />
      <path d="M6 15a6 6 0 0 1 12 0" />
      <path d="M2 19h20" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
    </>
  ),
  moon: <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.8 6.8 0 0 0 20 13.5z" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V5M8.5 8.5L12 5l3.5 3.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  /* The default. Used where a list item has no subject of its
     own — an aperture, the most neutral thing this brand owns
     that still reads as drawn rather than as a bullet. */
  dot: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export const MARK_NAMES = Object.keys(MARKS)

/** `<Mark name="ear" />`. An unknown key falls back to the aperture
    rather than throwing, so a data typo costs a glyph, not the page.
    `size` sets both axes; 18 is the size every glyph in this table
    was drawn against. Pass `title` only where the mark is the ONLY
    carrier of the meaning — next to a word, it must stay silent. */
export function Mark({ name, className = '', size = 18, title }) {
  const glyph = MARKS[name] ?? MARKS.dot
  return (
    <svg
      {...base}
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {glyph}
    </svg>
  )
}

/** The name the contact page has always imported. Same component. */
export { Mark as Icon }

export default Mark
