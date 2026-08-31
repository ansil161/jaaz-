import { img } from './site'

/* ============================================================
   JAAZ — SOLUTIONS
   Nine sellable systems, lifted straight out of the brochure.

   WHY THIS FILE EXISTS SEPARATELY FROM site.js
   `site.js` is the homepage's script: one long argument, read
   top to bottom, once. This is a CATALOGUE — nine entries with
   an identical shape, each of which has to stand on its own for
   someone who arrived from a search result and has never seen
   the homepage.

   Same shape for all nine is the load-bearing part. One page
   component reads this file and renders any of them, so adding
   a tenth solution is a data edit, not a new page.

   THE ONE THING THAT IS NOT SHARED
   `signature` names a bespoke scroll mechanism per solution —
   the acoustic page's reverb tail flattening, the automation
   page's scene switcher, the terrace page's day-to-night ramp.
   Nine pages built from one template with one identical
   animation would read as nine copies of a brochure; the
   signature is what makes each one about ITS OWN subject. The
   dispatcher lives in components/solutions/Signature.jsx.

   PHOTOGRAPHY
   Every plate here comes from the verified slot map in
   `site.js` — see the long note at the top of that file for why
   this build uses Unsplash rather than Pinterest (pins are
   third-party copyrighted work, are not licensed for commercial
   use, and the CDN blocks hotlinking, so they break in
   production AND expose the client). Slots are deliberately
   REUSED across solutions rather than invented: an unverified
   photo id is a broken image on a live page. Add JAAZ's own
   shoot to `PLATES` in site.js and every reference here picks
   it up.
   ============================================================ */

/* --- The index page ------------------------------------------- */
export const solutionsIndex = {
  headline: ['Nine ways to', 'build the', 'room you want.'],
  sub: 'A dedicated cinema is one answer. Most people need a system, not a room — so every one of these is quoted, engineered and signed off on its own.',
  statement:
    'Some of these cost more than a car. One of them is an afternoon of work and a better pair of speakers. All nine are built by the same team, to the same measurement standard, and handed over on one button.',
  meta: 'Kochi · India & the Gulf',
  image: img('theatre', 2400, '16:9'),
  imageAlt: 'A finished JAAZ private cinema with the house lights down',

  /* ============================================================
     THE LENS — the nine as STOPS on one barrel.

     The index page is a single aperture that stops down. Every
     stop below is that aperture's geometry for one solution, as
     percentage insets from the edges of the stage, and the shape
     is not decoration: it is the PROPORTION OF SPACE that
     solution actually touches.

     01 gives up a whole room, so the lens is wide open and the
     photograph is the screen. 04 happens inside a wall, so it is
     a narrow standing column. 07 has no room at all, so it is a
     horizon. 09 is one chair, so it is a pin-spot. The barrel
     runs from f/1.4 to f/22 in the standard series, in catalogue
     order, and the tick lengths on the scale are the aperture
     AREA at each stop — which is why the profile falls without
     falling evenly. A monotonic ramp would be a chart; this is a
     lens.

     `x` and `y` are half-insets in percent (left = right, top =
     bottom), so every stop is concentric with the one before it
     and the morph between any two is a single interpolation of
     one `inset()`. `r` is the corner radius in percent — the one
     stop that is a pool of light rather than a rectangle uses 50
     and becomes an ellipse.

     `focus` is `object-position` for the plate behind the
     opening. It exists because a narrow stop crops hard, and the
     centre of a photograph is rarely the part worth cropping to.

     `touches` is the readout in the top corner. It is the axis
     the page is actually organised on, in plain words, and it is
     the fastest answer to "which of these nine is mine".
     ============================================================ */
  lens: {
    hint: 'Scroll',
    open: 'Explore this',
    barrel: 'Aperture',
    tints: {
      warm: '201, 173, 124',
      dusk: '104, 128, 154',
      ash: '150, 150, 158',
    },
    stops: {
      'private-home-theatre': {
        f: '1.4', x: 0, y: 0, r: 0, focus: '50% 50%', tint: 'warm',
        touches: 'A room given over entirely',
      },
      'living-room-theatre-upgrade': {
        f: '2', x: 7, y: 19, r: 0, focus: '50% 46%', tint: 'warm',
        touches: 'One wall of a room you already use',
      },
      'home-automation-control': {
        f: '2.8', x: 30, y: 11, r: 0, focus: '50% 44%', tint: 'ash',
        touches: 'One button, every room',
      },
      'acoustic-treatment': {
        f: '4', x: 39, y: 7, r: 0, focus: '50% 50%', tint: 'ash',
        touches: 'Inside the walls',
      },
      'party-event-audio': {
        f: '5.6', x: 6, y: 33, r: 0, focus: '50% 54%', tint: 'warm',
        touches: 'The whole floor, one night',
      },
      'bar-lounge-audio': {
        f: '8', x: 24, y: 17, r: 0, focus: '50% 48%', tint: 'warm',
        touches: 'One room, all evening',
      },
      'outdoor-terrace-sound': {
        f: '11', x: 3, y: 38, r: 0, focus: '50% 58%', tint: 'dusk',
        touches: 'Everything outside',
      },
      'lighting-ambience-design': {
        f: '16', x: 31, y: 12, r: 50, focus: '64% 46%', tint: 'warm',
        touches: 'The air in the room',
      },
      'premium-seating': {
        f: '22', x: 38, y: 26, r: 2, focus: '50% 74%', tint: 'ash',
        touches: 'Where you actually sit',
      },
    },
  },

  /* The quiet list that closes the page, for the visitor who has
     already seen the nine chapters and wants to go straight back to
     one of them. */
  index: {
    heading: ['All nine,', 'in one place.'],
    fallback: 'Not sure which of the nine fits the room you have?',
    fallbackAction: 'Ask us directly',
  },

  cta: {
    heading: ['Tell us the room.', 'We will tell you which.'],
    body: 'Send a photograph, the rough dimensions and how you actually want to use the space. You get a straight answer about which of these nine fits — including the answer that none of them do yet.',
    action: 'Book a Consultation',
    reassurance: 'One reply within a working day.',
  },
}

/* --- The nine ------------------------------------------------- */
export const solutions = [
  /* ============================================================
     01 — PRIVATE HOME THEATRE
     ============================================================ */
  {
    slug: 'private-home-theatre',
    n: '01',
    nav: 'Private Home Theatre',
    navNote: 'The full dedicated room',
    title: 'Private Home Theatre',
    tier: 'Flagship',
    headline: ['A room that exists', 'for one reason.'],
    sub: 'A dedicated cinema built from the shell up — acoustics, Dolby Atmos, projection, seating, lighting and control, engineered as one system and calibrated per seat.',
    meta: 'Dedicated room · 6–14 seats · 10–16 weeks',
    range: 'On survey',
    signature: 'aperture',
    hero: img('theatre', 2600, '16:9'),
    heroAlt: 'A JAAZ private cinema, tiered recliners, house lights down',
    statement: 'Everything else in the house disappears.',
    intro: [
      'A dedicated theatre is the only build where nothing has to be compromised for another use. The walls can be the shape acoustics wants. The floor can be tiered for sightlines instead of level for furniture. The lights can go to zero.',
      'That freedom is the whole product. It is also why this is the one solution we will not quote from photographs — the room has to be measured first.',
    ],
    system: {
      label: 'What the room is made of',
      heading: ['Seven systems,', 'one handover.'],
      intro: 'Each of these is a trade that most projects buy separately, from people who never meet. Here they are specified against each other from the first drawing.',
      layers: [
        { n: '01', title: 'Room & Acoustics', body: 'The shell is treated before a single speaker is chosen.', points: ['Sound isolation from the rest of the house', 'Absorption, diffusion and bass trapping', 'Room-mode analysis and correction'] },
        { n: '02', title: 'Dolby Atmos Sound', body: 'A full object-based layout, including height channels.', points: ['Bed, surround and ceiling channels', 'Multi-subwoofer bass management', 'Per-seat time alignment and EQ'] },
        { n: '03', title: 'Projection & Screen', body: 'Throw, gain and masking chosen for this room, not from a catalogue.', points: ['Projector matched to screen size and gain', 'Acoustically transparent screen where the layout needs it', 'Reference colour calibration'] },
        { n: '04', title: 'Motorised Recliners', body: 'Tiered, powered and specified around the people using them.', points: ['Riser heights set from real sightlines', 'Powered headrest, lumbar and leg rest', 'Console storage, charging and per-seat control'] },
        { n: '05', title: 'Star Ceiling', body: 'Fibre-optic points set out by hand, not on a grid.', points: ['Variable point density and brightness', 'Twinkle and shooting-star effects', 'Dims to nothing on the movie cue'] },
        { n: '06', title: 'Ambient & Screen-Synced Lighting', body: 'Cove, step and wall light that answers to the picture.', points: ['Dimmable cove and aisle circuits', 'Colour-reactive wash behind the screen', 'Scene presets, never a bank of switches'] },
        { n: '07', title: 'Full Automation', body: 'One button. The room does the rest.', points: ['Projector, AV, lighting, AC and blinds on one scene', 'Wall panel, remote and phone', 'Failure modes that leave you with light'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Indicative for a 6.5 x 4.2 m room. Every figure is re-derived from the survey.',
      rows: [
        { label: 'Channel layout', value: '7.2.4 – 9.4.6 Dolby Atmos' },
        { label: 'Screen', value: '2.35:1 or 16:9, 120" – 180"' },
        { label: 'Seating', value: '6 – 14 motorised recliners, 1 – 3 tiers' },
        { label: 'Target reverberation', value: '0.25 – 0.35 s (RT60, mid-band)' },
        { label: 'Isolation target', value: '45 – 55 dB reduction to adjacent rooms' },
        { label: 'Calibration', value: 'Per seat, measured, documented' },
        { label: 'Programme', value: '10 – 16 weeks from civil handover' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'You have a room — basement, attic, spare bedroom — that can be given over entirely.',
          'You want reference performance rather than a very good television.',
          'You are prepared for civil work: framing, wiring, ceiling, floor.',
          'You want one team accountable for the finished result, not five quotes.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'The room has to stay a living room — see the Living Room Theatre Upgrade.',
          'You cannot do civil work yet — Acoustic Treatment can be staged first.',
          'The room is fine and the seating is the problem — see Premium Seating.',
        ],
      },
    },
    gallery: {
      label: 'Rooms delivered',
      items: [
        { src: img('projection', 1800, '4:5'), alt: 'A projector beam cutting through the haze of a dark cinema', caption: 'Projection · through-air, before the screen goes in' },
        { src: img('fluted', 1800, '4:5'), alt: 'A fluted acoustic wall in a private cinema', caption: 'Acoustics · fluted absorption, first reflection points' },
        { src: img('comfortRoom', 1800, '4:5'), alt: 'A JAAZ private cinema, calibrated', caption: 'Seating · three tiers, sightlines set from the chair' },
        { src: img('screenWall', 1800, '4:5'), alt: 'A large cinema screen washing a room in warm light', caption: 'Lighting · cove wash, cued off the picture' },
      ],
    },
    cta: {
      heading: ['Book the survey.', 'Everything follows it.'],
      body: 'We measure the shell, model the acoustics and come back with what the room can actually become — including whether it should be this solution at all.',
      action: 'Book a Consultation',
      reassurance: 'Survey first. No specification before measurement.',
    },
    related: ['acoustic-treatment', 'premium-seating', 'lighting-ambience-design'],
  },

  /* ============================================================
     02 — LIVING ROOM THEATRE UPGRADE
     ============================================================ */
  {
    slug: 'living-room-theatre-upgrade',
    n: '02',
    nav: 'Living Room Theatre Upgrade',
    navNote: 'Cinema sound, no civil work',
    title: 'Living Room Theatre Upgrade',
    tier: 'Most requested',
    headline: ['You already own', 'the screen.'],
    sub: 'The television is not the problem. Receiver, front and surround speakers, a subwoofer that is placed rather than parked, clean wiring and a proper calibration — in the room you already live in.',
    meta: 'Existing room · No civil work · 1–3 days on site',
    range: 'Entry to mid',
    signature: 'seam',
    hero: img('livingAlt', 2600, '16:9'),
    heroAlt: 'A dark living room with a large screen and concealed audio',
    statement: 'A great picture with thin sound is half a room.',
    intro: [
      'Most living rooms in this price bracket have a genuinely excellent panel and are still running its internal speakers, or a soundbar chosen for its width. The picture is already cinema. The sound is a laptop.',
      'This is the fastest, cheapest change with the largest audible difference, and nothing gets knocked down to do it.',
    ],
    system: {
      label: 'What we bring',
      heading: ['Everything except', 'the demolition.'],
      intro: 'No false ceiling, no chased walls, no dust sheets for three weeks. The room is handed back the same week.',
      layers: [
        { n: '01', title: 'AV Receiver or Soundbar Platform', body: 'The decision is made on the room, not on the brochure.', points: ['Full AV receiver where placement allows', 'High-end soundbar platform where it does not', 'HDMI 2.1 and eARC handled properly'] },
        { n: '02', title: 'Front & Centre Speakers', body: 'Dialogue is the thing people actually notice.', points: ['Left, centre, right matched as a set', 'Centre aligned to the screen, not to the cabinet', 'On-wall, in-wall or free-standing to suit the room'] },
        { n: '03', title: 'Surrounds', body: 'Placed for the seating you have, not for a diagram.', points: ['5.1 or 7.1, in-ceiling or on-wall', 'Height channels where the ceiling permits', 'Angles set from the sofa'] },
        { n: '04', title: 'Subwoofer', body: 'One box, and where it goes decides whether it works.', points: ['Placement found by measurement, not by convenience', 'Crossover and phase set to the mains', 'Room-mode notch where the space demands it'] },
        { n: '05', title: 'Clean Wiring', body: 'The part everyone forgets and everyone sees.', points: ['Skirting, cornice and cavity routes', 'No visible runs, no trailing looms', 'Labelled, documented, serviceable'] },
        { n: '06', title: 'Calibrated Cinematic Sound', body: 'The last two hours are the ones that matter.', points: ['Measured response at the seating position', 'Level, distance and EQ per channel', 'Two presets: film and everyday'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Indicative for a 5.5 x 4 m living room with an existing 65" – 85" panel.',
      rows: [
        { label: 'Channel layout', value: '5.1 · 5.1.2 · 7.1.4' },
        { label: 'Existing display', value: 'Retained. Any modern LED, OLED or QLED' },
        { label: 'Civil work', value: 'None' },
        { label: 'Speaker placement', value: 'On-wall, in-wall or in-ceiling' },
        { label: 'Cable routing', value: 'Concealed — skirting, cornice or cavity' },
        { label: 'Calibration', value: 'Measured at the primary seat' },
        { label: 'Time on site', value: '1 – 3 days' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'You have a large panel you are happy with and want it to sound like it looks.',
          'The room has to stay a living room — furniture, daylight, guests.',
          'You want a real difference this month, not a project this year.',
          'You would rather spend on audio than on construction.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'You want reference performance and can give up a room — see Private Home Theatre.',
          'The room echoes badly with everything you already own — start with Acoustic Treatment.',
          'It is a bar, a terrace or a party space — those are their own solutions.',
        ],
      },
    },
    gallery: {
      label: 'Rooms delivered',
      items: [
        { src: img('fire', 1800, '4:5'), alt: 'A lounge with a fire and a large screen', caption: 'Concealed surrounds · nothing on show' },
        { src: img('modern', 1800, '4:5'), alt: 'A modern architectural interior', caption: 'On-wall fronts · aligned to the panel' },
        { src: img('screenWall', 1800, '4:5'), alt: 'A large screen with warm cove light', caption: 'Placement · found by measurement' },
        { src: img('dining', 1800, '4:5'), alt: 'A dark dining space with distributed audio', caption: 'Open plan · one system, two zones' },
      ],
    },
    cta: {
      heading: ['Send a photo of', 'the room.'],
      body: 'A picture of the wall, a rough width and what you watch is enough for us to come back with a specification and a number. No survey needed to start.',
      action: 'Get a Specification',
      reassurance: 'Most of these are specified from photographs in a day.',
    },
    related: ['acoustic-treatment', 'home-automation-control', 'premium-seating'],
  },

  /* ============================================================
     03 — HOME AUTOMATION & CONTROL
     ============================================================ */
  {
    slug: 'home-automation-control',
    n: '03',
    nav: 'Home Automation & Control',
    navNote: 'One button, one room',
    title: 'Home Automation & Control',
    tier: 'Standalone or bundled',
    headline: ['One button.', 'The room', 'does the rest.'],
    sub: 'Air conditioning, lighting, projector, screen, blinds and recliners collapsed into named scenes — Movie, Party, Dinner, Off — on a wall panel, a remote or a phone.',
    meta: 'Any room · Retrofit or new build · 2–5 days',
    range: 'Mid',
    signature: 'scenes',
    hero: img('modern', 2600, '16:9'),
    heroAlt: 'A modern interior lit by a single automation scene',
    statement: 'Six remotes is not a system. It is a drawer.',
    intro: [
      'Every good room accumulates controls. A projector remote, an AV remote, a lighting keypad, an AC remote, an app for the blinds. By the time the film starts, someone has stood up twice.',
      'Automation is not about doing something new. It is about the room already being in the state you wanted, before you asked.',
    ],
    system: {
      label: 'What gets unified',
      heading: ['Named states,', 'not a hundred switches.'],
      intro: 'A scene is a decision made once, at commissioning, so it never has to be made again at eight in the evening.',
      layers: [
        { n: '01', title: 'Movie Mode', body: 'The one everything else is judged against.', points: ['Projector on, screen down, source selected', 'Cove to 8%, aisle lights on, star ceiling up', 'AC dropped two degrees and set to silent'] },
        { n: '02', title: 'Party Mode', body: 'Bright, loud, and nobody touching the rack.', points: ['House lighting to a warm high level', 'Audio to the party preset and zones opened', 'Screen up, source on the playlist input'] },
        { n: '03', title: 'Dinner & Lounge', body: 'The state a room spends most of its life in.', points: ['Low warm wash, accents on', 'Audio at conversation level', 'Screen and projector off and out of the way'] },
        { n: '04', title: 'Climate', body: 'Comfort is a temperature as much as a chair.', points: ['AC on the scene, not on a separate remote', 'Fan curves set for a quiet room', 'Schedules for pre-cooling before a screening'] },
        { n: '05', title: 'Seating', body: 'Recliners answer to the scene too.', points: ['All-seats-upright on Off', 'Per-seat control retained at the console', 'Powered headrest and leg rest presets'] },
        { n: '06', title: 'Control Surfaces', body: 'Three ways in, and all three agree.', points: ['Engraved wall panel by the door', 'One handheld remote, backlit', 'Phone and tablet app for everything else'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Scene names and contents are written with you at commissioning, not shipped as defaults.',
      rows: [
        { label: 'Scenes', value: '4 – 8, named, editable' },
        { label: 'Controlled loads', value: 'AV, lighting, AC, blinds, screen, seating' },
        { label: 'Interfaces', value: 'Wall panel · handheld remote · app' },
        { label: 'Network', value: 'Wired backbone, dedicated VLAN' },
        { label: 'Failure mode', value: 'Manual override retained on every circuit' },
        { label: 'Handover', value: 'Scene sheet, labelled panel, one training session' },
        { label: 'Time on site', value: '2 – 5 days' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The room already has good equipment that is annoying to operate.',
          'Guests, staff or children need to run it without a briefing.',
          'You are building a theatre and want the control layer done properly.',
          'You want lighting, AV and climate to stop being three separate arguments.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'The equipment itself is the weak link — fix the audio first.',
          'You want whole-house automation across every room. That is a larger scope; ask us.',
        ],
      },
    },
    gallery: {
      label: 'In place',
      items: [
        { src: img('tech', 1800, '4:5'), alt: 'An AV rack and tower speakers', caption: 'The rack · labelled, ventilated, serviceable' },
        { src: img('fluted', 1800, '4:5'), alt: 'A fluted acoustic wall with concealed lighting', caption: 'Circuits · cove, aisle and wash on separate dimmers' },
        { src: img('livingAlt', 1800, '4:5'), alt: 'A dark lounge under one lighting scene', caption: 'Lounge scene · one press' },
        { src: img('comfortRoom', 1800, '4:5'), alt: 'A calibrated private cinema', caption: 'Movie scene · projector, lights, climate, seating' },
      ],
    },
    cta: {
      heading: ['Tell us what', 'annoys you.'],
      body: 'Automation projects are specified backwards — from the four or five things that currently take too many steps. Send us those and we will send you the scene sheet.',
      action: 'Start a Project',
      reassurance: 'Every circuit keeps a manual override. Always.',
    },
    related: ['private-home-theatre', 'lighting-ambience-design', 'living-room-theatre-upgrade'],
  },

  /* ============================================================
     04 — ACOUSTIC TREATMENT & ROOM ENGINEERING
     ============================================================ */
  {
    slug: 'acoustic-treatment',
    n: '04',
    nav: 'Acoustic Treatment & Room Engineering',
    navNote: 'When the room is the problem',
    title: 'Acoustic Treatment & Room Engineering',
    tier: 'Engineering service',
    headline: ['The room is', 'the loudest', 'thing in it.'],
    sub: 'Measurement, sound isolation, absorption and diffusion, bass optimisation and reflection control — for a space whose equipment is already better than it sounds.',
    meta: 'Existing room · Measurement first · 1–4 weeks',
    range: 'Low to mid',
    signature: 'decay',
    hero: img('fluted', 2600, '16:9'),
    heroAlt: 'A fluted acoustic wall in a treated listening room',
    statement: 'You cannot buy your way out of a bad room.',
    intro: [
      'A significant number of the systems we are called to look at are already good. The speakers are right, the receiver is right, the placement is nearly right — and the room is adding a second, worse copy of everything a few milliseconds late.',
      'This is the one service that regularly makes an existing system sound like a different price bracket without replacing a single box.',
    ],
    system: {
      label: 'What we do to the room',
      heading: ['Measure.', 'Then treat.'],
      intro: 'Nothing is fitted before the room is measured, because treatment applied to the wrong surface is decoration with a technical name.',
      layers: [
        { n: '01', title: 'Acoustic Analysis', body: 'The room tells us what it needs.', points: ['Impulse response and RT60 by octave band', 'Modal map and null locations', 'Noise floor and ingress survey'] },
        { n: '02', title: 'Sound Isolation', body: 'Keeping it in is a different problem to making it sound good.', points: ['Decoupled stud and resilient channel', 'Mass layers and damped cavities', 'Door, threshold and service-penetration sealing'] },
        { n: '03', title: 'Absorption', body: 'Placed at the reflections that actually reach the seat.', points: ['First-reflection points found by mirror trace', 'Broadband panels, not foam', 'Fabric, timber or fluted finishes'] },
        { n: '04', title: 'Diffusion', body: 'A dead room is as wrong as a live one.', points: ['Rear-wall and ceiling diffusion', 'Slatted and sculpted timber elements', 'Balance set to keep the room alive at low levels'] },
        { n: '05', title: 'Bass Optimisation', body: 'Where nearly all of the audible damage is.', points: ['Corner and pressure-zone bass trapping', 'Multi-sub placement and phase', 'Parametric correction below the transition frequency'] },
        { n: '06', title: 'Reverberation Control', body: 'One target number, and we hit it.', points: ['Frequency-even decay, not just a short one', 'Speech intelligibility checked, not assumed', 'Before-and-after measurements handed over'] },
      ],
    },
    spec: {
      label: 'Typical outcome',
      note: 'Real figures from a treated 5 x 4 m room. Yours will differ; the report will say by how much.',
      rows: [
        { label: 'RT60 before', value: '0.62 s (mid-band)' },
        { label: 'RT60 after', value: '0.31 s (mid-band)' },
        { label: 'Modal peak reduction', value: '9 – 14 dB at the primary mode' },
        { label: 'Decay evenness', value: 'Within ±0.05 s, 250 Hz – 4 kHz' },
        { label: 'Isolation gain', value: '12 – 30 dB, depending on scope' },
        { label: 'Deliverable', value: 'Before / after measurement report' },
        { label: 'Programme', value: '1 – 4 weeks' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The system sounds boomy, harsh or vague and you have already moved everything.',
          'Dialogue is hard to follow at a comfortable volume.',
          'Sound carries into bedrooms or to neighbours.',
          'You are about to spend on new equipment and want to know if that is the problem.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'There is no system yet — treatment is designed alongside one, not before it.',
          'You want a full room build; this is included in Private Home Theatre.',
        ],
      },
    },
    gallery: {
      label: 'Treatments',
      items: [
        { src: img('slatted', 1800, '4:5'), alt: 'A curved slatted acoustic room', caption: 'Diffusion · slatted timber, rear wall' },
        { src: img('shell', 1800, '4:5'), alt: 'A bare civil-finished room before treatment', caption: 'Before · bare shell, 0.9 s decay' },
        { src: img('fluted', 1800, '4:5'), alt: 'Fluted absorption panels', caption: 'Absorption · first reflection points' },
        { src: img('comfortRoom', 1800, '4:5'), alt: 'A finished treated cinema', caption: 'After · 0.31 s, even across the band' },
      ],
    },
    cta: {
      heading: ['Book the', 'measurement.'],
      body: 'An acoustic survey is a half-day on site and a written report. It is the cheapest way to find out whether your room or your equipment is the thing holding you back.',
      action: 'Book an Acoustic Survey',
      reassurance: 'You get the measurements whether or not you use us for the work.',
    },
    related: ['private-home-theatre', 'living-room-theatre-upgrade', 'bar-lounge-audio'],
  },

  /* ============================================================
     05 — PARTY & EVENT AUDIO
     ============================================================ */
  {
    slug: 'party-event-audio',
    n: '05',
    nav: 'Party & Event Audio',
    navNote: 'When the room becomes the occasion',
    title: 'Party & Event Audio',
    tier: 'Event-driven',
    headline: ['Built for the', 'nights the room', 'is the occasion.'],
    sub: 'High-output speakers, real subwoofers, karaoke and DJ inputs, and controls simple enough that whoever is nearest can run it. Permanent or brought in for the weekend.',
    meta: 'Indoor or outdoor · Permanent or event · 1–2 days',
    range: 'Low to mid',
    signature: 'spectrum',
    hero: img('grand', 2600, '16:9'),
    heroAlt: 'A large dark interior set up for an event',
    statement: 'Cinema sound and party sound are not the same job.',
    intro: [
      'A calibrated home theatre is designed to be accurate at one moderate level, for people sitting down and paying attention. A party is the opposite specification: loud, even across a whole floor, and forgiving of a hundred people absorbing the high frequencies.',
      'Running one for the other is why so many birthdays end with a system that is either shouting or inaudible.',
    ],
    system: {
      label: 'What comes in',
      heading: ['Output, headroom,', 'and nothing to learn.'],
      intro: 'Specified for a full room, not a sweet spot, and set up so nobody needs to find the engineer.',
      layers: [
        { n: '01', title: 'High-Output Speakers', body: 'Level with headroom left over.', points: ['Full-range cabinets sized to the floor area', 'Even coverage, no hot spot at the source', 'Distributed fills for adjoining spaces'] },
        { n: '02', title: 'Subwoofers', body: 'The part people feel and remember.', points: ['Dedicated party subs, not the cinema sub', 'Placed for even low end across the floor', 'Limited to stay clean at maximum'] },
        { n: '03', title: 'Karaoke Input', body: 'Wireless microphones that work at the far end of the room.', points: ['Two to four wireless handhelds', 'Feedback-controlled mic channel', 'Track playback with key and tempo control'] },
        { n: '04', title: 'DJ Input', body: 'A guest can plug in in ten seconds.', points: ['Line, USB and Bluetooth inputs at a labelled point', 'Booth level independent of the house level', 'Handover-safe: no access to the calibration'] },
        { n: '05', title: 'Lighting Tie-In', body: 'The lights come with it, on one preset.', points: ['Party scene on the same control surface', 'Colour wash and beat-reactive options', 'One press back to normal at the end of the night'] },
        { n: '06', title: 'Easy Control', body: 'One dial that everyone understands.', points: ['Master level and one input selector', 'Presets: background, dancing, karaoke', 'Nothing that can break the calibrated presets'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Sized for a 120 m² indoor floor or a comparable terrace. Event hire is quoted per night.',
      rows: [
        { label: 'Coverage', value: 'Even ±3 dB across the floor' },
        { label: 'Headroom', value: '6 dB above the loudest intended level' },
        { label: 'Microphones', value: '2 – 4 wireless, licensed band' },
        { label: 'Inputs', value: 'Line · USB · Bluetooth · DJ booth' },
        { label: 'Presets', value: 'Background · Dancing · Karaoke' },
        { label: 'Basis', value: 'Permanent install or per-event hire' },
        { label: 'Set-up time', value: '1 – 2 days permanent, hours for an event' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The house hosts — birthdays, festivals, receptions, weekends.',
          'Your existing system is either too quiet or distorting at the level you want.',
          'You want karaoke or a guest DJ without handing over the whole rack.',
          'You need it for a date, not forever — ask about event hire.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'The room is for films — see Private Home Theatre or the Living Room Upgrade.',
          'You want low-level ambience for conversation — see Bar & Lounge Audio.',
        ],
      },
    },
    gallery: {
      label: 'Nights delivered',
      items: [
        { src: img('bar', 1800, '4:5'), alt: 'A warm timber home bar set up for an event', caption: 'Indoor floor · distributed fills' },
        { src: img('grand', 1800, '4:5'), alt: 'A grand dark interior at an event', caption: 'Large volume · even coverage, no hot spot' },
        { src: img('terraceAlt', 1800, '4:5'), alt: 'A rooftop lounge at night', caption: 'Terrace · weather-rated, event level' },
        { src: img('dining', 1800, '4:5'), alt: 'A dark dining space with distributed audio', caption: 'Adjoining zones · independent level' },
      ],
    },
    cta: {
      heading: ['Tell us the date', 'and the floor.'],
      body: 'Number of people, indoor or out, and whether it is one night or every month. That is enough for us to come back with a hire price or an install specification.',
      action: 'Get a Quote',
      reassurance: 'Event hire available. Ask when you enquire.',
    },
    related: ['bar-lounge-audio', 'outdoor-terrace-sound', 'lighting-ambience-design'],
  },

  /* ============================================================
     06 — BAR & LOUNGE AUDIO
     ============================================================ */
  {
    slug: 'bar-lounge-audio',
    n: '06',
    nav: 'Bar & Lounge Audio',
    navNote: 'Ambience, not spectacle',
    title: 'Bar & Lounge Audio',
    tier: 'Hospitality',
    headline: ['Sound you notice', 'only when it', 'stops.'],
    sub: 'Discreet ceiling, wall and bookshelf systems for home bars, cigar rooms and entertainment counters — tuned for conversation at a low level, and invisible until it is wanted.',
    meta: 'Bar · lounge · cigar room · 1–3 days',
    range: 'Low to mid',
    signature: 'dimmer',
    hero: img('bar', 2600, '16:9'),
    heroAlt: 'A warm timber home bar with concealed audio',
    statement: 'Mood is a level, not a volume.',
    intro: [
      'A bar has the opposite brief to a cinema. Nobody is facing forward, nobody is sitting still, and the music is there to hold the room together underneath the conversation rather than to be the event.',
      'Most systems fail here by being too directional and too loud in one spot. Ours are specified to be even, warm and slightly too quiet — which is exactly right.',
    ],
    system: {
      label: 'What goes in',
      heading: ['Even, warm,', 'and out of sight.'],
      intro: 'Every choice here trades peak output for evenness. That is the correct trade for a room people talk in.',
      layers: [
        { n: '01', title: 'Ceiling Speakers', body: 'The default, because they disappear completely.', points: ['Wide-dispersion drivers on a close grid', 'Trimless bezels, painted to the ceiling', 'Even coverage standing and seated'] },
        { n: '02', title: 'Wall & Bookshelf', body: 'Where the ceiling is not available or not right.', points: ['Compact cabinets on shelving and joinery', 'Timber and fabric finishes to match the bar', 'Angled to the standing ear height'] },
        { n: '03', title: 'Discreet Subwoofer', body: 'Weight without a box in the room.', points: ['In-cabinet or in-wall placement', 'Set low and flat, never demonstrative', 'Crossed over high enough to stay unnoticed'] },
        { n: '04', title: 'Zoning', body: 'The counter, the seating and the cigar room are not one room.', points: ['Independent level per zone', 'Separate sources where wanted', 'One master mute at the bar'] },
        { n: '05', title: 'Mood Presets', body: 'Named for the evening, not for the equipment.', points: ['Aperitif, Late, Cigar, Off', 'Level and tone shift together', 'Lighting joins the same preset'] },
        { n: '06', title: 'Sources', body: 'Streaming that works without a laptop.', points: ['Built-in streaming, one app', 'Turntable and line inputs where wanted', 'Guest Bluetooth on a limited zone'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Indicative for a bar and adjoining lounge of about 45 m².',
      rows: [
        { label: 'Layout', value: '4 – 10 distributed, 1 – 2 zones' },
        { label: 'Coverage target', value: 'Even ±2 dB at standing ear height' },
        { label: 'Design level', value: '68 – 74 dBA, conversation-first' },
        { label: 'Visibility', value: 'Trimless, painted to finish' },
        { label: 'Presets', value: 'Aperitif · Late · Cigar · Off' },
        { label: 'Sources', value: 'Streaming · line · guest Bluetooth' },
        { label: 'Time on site', value: '1 – 3 days' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'You have a home bar, cigar room or entertainment counter.',
          'Music should hold the room without anyone raising their voice.',
          'Nothing may be visible — no stands, no grilles, no cables.',
          'Different parts of the space need different levels.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'The room needs to go loud for dancing — see Party & Event Audio.',
          'It is a terrace or exposed to weather — see Outdoor / Terrace Sound.',
        ],
      },
    },
    gallery: {
      label: 'Rooms delivered',
      items: [
        { src: img('dining', 1800, '4:5'), alt: 'A dark dining and bar space', caption: 'Counter zone · independent level' },
        { src: img('fire', 1800, '4:5'), alt: 'A lounge with a fire', caption: 'Lounge zone · warm, low, even' },
        { src: img('chair', 1800, '4:5'), alt: 'A sculptural lounge chair', caption: 'Cigar room · its own zone and preset' },
        { src: img('grand', 1800, '4:5'), alt: 'A grand dark interior', caption: 'Ceiling grid · trimless, painted out' },
      ],
    },
    cta: {
      heading: ['Show us the bar.', 'We will hide the rest.'],
      body: 'A plan or a couple of photographs, the ceiling type and how the space is used through an evening. We come back with a layout that nobody will be able to see.',
      action: 'Start a Project',
      reassurance: 'Nothing visible. That is the specification, not a preference.',
    },
    related: ['party-event-audio', 'outdoor-terrace-sound', 'lighting-ambience-design'],
  },

  /* ============================================================
     07 — OUTDOOR / TERRACE SOUND
     ============================================================ */
  {
    slug: 'outdoor-terrace-sound',
    n: '07',
    nav: 'Outdoor / Terrace Sound',
    navNote: 'Weather is the specification',
    title: 'Outdoor / Terrace Sound',
    tier: 'Engineered for exposure',
    headline: ['Outside, the', 'weather writes', 'the spec.'],
    sub: 'Weather-protected exposed systems and concealed indoor-terrace systems for rooftops, balconies and semi-open spaces — engineered for water, UV, salt air and no walls to help.',
    meta: 'Rooftop · balcony · semi-open · 2–5 days',
    range: 'Mid',
    signature: 'weather',
    hero: img('terrace', 2600, '16:9'),
    heroAlt: 'A terrace at dusk with lounge seating and concealed audio',
    statement: 'There is no room. That is the whole problem.',
    intro: [
      'Indoors, walls and a ceiling return most of the energy you put into the air. Outdoors, everything you emit leaves and never comes back — so an outdoor system needs more sources, closer together, at lower individual levels, or it becomes a nuisance for the neighbours before it becomes enjoyable for you.',
      'Then there is the part nobody quotes for: monsoon, direct sun, salt air, and a drainage detail that decides whether the installation lasts two seasons or ten years.',
    ],
    system: {
      label: 'What survives outside',
      heading: ['Two approaches.', 'Both engineered.'],
      intro: 'Whether the hardware is exposed or concealed changes every decision after it, so it is the first thing we settle.',
      layers: [
        { n: '01', title: 'Exposed, Weather-Protected', body: 'Hardware that lives outdoors permanently.', points: ['IP-rated enclosures, marine-grade fixings', 'UV-stable grilles and cabinets', 'Rated to the local monsoon, not to a lab'] },
        { n: '02', title: 'Concealed Indoor-Terrace', body: 'The system stays inside the weather line and throws out.', points: ['Speakers in the soffit or reveal, out of the rain', 'Coverage modelled across the open area', 'Zero visible hardware on the terrace itself'] },
        { n: '03', title: 'Coverage Without Walls', body: 'More sources, quieter each, is the whole trick.', points: ['Distributed layout instead of two big cabinets', 'Level even across seating and standing areas', 'Boundary level checked toward neighbours'] },
        { n: '04', title: 'Low End Outdoors', body: 'The hardest part of any exposed system.', points: ['Weather-rated or interior-mounted subwoofer', 'Boundary reinforcement used deliberately', 'Curfew preset that drops the bass first'] },
        { n: '05', title: 'Water & Drainage', body: 'The detail that decides the lifespan.', points: ['Drip loops, gland seals, drained back-boxes', 'No termination at the low point of any run', 'Conduit falls away from every enclosure'] },
        { n: '06', title: 'Power & Protection', body: 'Electrics that are happy in a storm.', points: ['RCD-protected, weather-rated distribution', 'Surge protection at the amplifier', 'Amplifiers indoors wherever it is possible'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Indicative for an 80 m² rooftop terrace in a coastal, monsoon climate.',
      rows: [
        { label: 'Enclosure rating', value: 'IP66 exposed · IP54 sheltered soffit' },
        { label: 'Fixings', value: 'A4 / 316 stainless, marine grade' },
        { label: 'UV', value: 'UV-stable polymers, powder-coat over primer' },
        { label: 'Layout', value: '6 – 12 distributed sources' },
        { label: 'Coverage target', value: 'Even ±3 dB across seating' },
        { label: 'Curfew preset', value: 'Level and low end reduced together' },
        { label: 'Amplification', value: 'Indoors, surge-protected' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The space is a rooftop, terrace, balcony or semi-open pavilion.',
          'Anything installed will see direct rain, sun or salt air.',
          'A previous outdoor system has already failed or corroded.',
          'You need it loud enough to enjoy and quiet enough for neighbours.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'The space is enclosed and dry — see Bar & Lounge Audio.',
          'It is one event, not an installation — see Party & Event Audio.',
        ],
      },
    },
    gallery: {
      label: 'Terraces delivered',
      items: [
        { src: img('terraceAlt', 1800, '4:5'), alt: 'A rooftop lounge at night', caption: 'Rooftop · distributed, IP66' },
        { src: img('terrace', 1800, '4:5'), alt: 'A terrace at dusk with lounge seating', caption: 'Semi-open · soffit-mounted, out of the rain' },
        { src: img('grand', 1800, '4:5'), alt: 'A grand interior adjoining a terrace', caption: 'Threshold · one system, two climates' },
        { src: img('modern', 1800, '4:5'), alt: 'A modern architectural exterior detail', caption: 'Detail · drip loops and drained back-boxes' },
      ],
    },
    cta: {
      heading: ['Send the plan', 'and the compass.'],
      body: 'Terrace dimensions, which way it faces, what it is exposed to and where power comes from. Coastal and monsoon exposure change the specification, so tell us where you are.',
      action: 'Start a Project',
      reassurance: 'Every exposed installation is quoted with its ingress detail.',
    },
    related: ['party-event-audio', 'bar-lounge-audio', 'lighting-ambience-design'],
  },

  /* ============================================================
     08 — LIGHTING & AMBIENCE DESIGN
     ============================================================ */
  {
    slug: 'lighting-ambience-design',
    n: '08',
    nav: 'Lighting & Ambience Design',
    navNote: 'The room moves with the story',
    title: 'Lighting & Ambience Design',
    tier: 'Design service',
    headline: ['The room moves', 'with the story.'],
    sub: 'Cove lighting, wall washers, star ceilings and screen-synced colour — designed as scenes rather than circuits, so the room changes state with the picture instead of sitting at one brightness all evening.',
    meta: 'Any room · Retrofit or new build · 3–10 days',
    range: 'Low to mid',
    signature: 'starfield',
    hero: img('screenWall', 2600, '16:9'),
    heroAlt: 'A large screen washing a room in warm cove light',
    statement: 'Light is the cheapest way to change how a room feels.',
    intro: [
      'Everything else on this list is measured in decibels and milliseconds. Lighting is the one system whose entire value is subjective — and it is still the change that visitors notice first, before a single speaker has played.',
      'It is also the one thing that can be added to a finished room in a week and transform it.',
    ],
    system: {
      label: 'What gets designed',
      heading: ['Layers of light,', 'never one switch.'],
      intro: 'Four or five separately dimmable layers is what makes a room capable of having moods at all. A single bright circuit can only be on or off.',
      layers: [
        { n: '01', title: 'Cove Lighting', body: 'Indirect light off the ceiling perimeter.', points: ['Warm-dim strip, hidden detail', 'Continuous run, no visible dots or scallops', 'Dims smoothly to 1% without stepping'] },
        { n: '02', title: 'Wall Washers', body: 'Architecture, lit deliberately.', points: ['Grazing light on fluted and slatted surfaces', 'Beam angles set on site, not on paper', 'Separate circuit from the cove'] },
        { n: '03', title: 'Star Ceiling', body: 'Fibre-optic points, set out by hand.', points: ['Variable density and point brightness', 'Twinkle wheel and shooting-star effects', 'Optional constellations, laid out to a real sky'] },
        { n: '04', title: 'Screen-Synced Colour', body: 'The wall behind the screen answers to the picture.', points: ['Colour sampled from the frame in real time', 'Response damped so it never flickers', 'Defeatable in one press for reference viewing'] },
        { n: '05', title: 'Step & Aisle Light', body: 'The safety layer, and it should be beautiful.', points: ['Recessed marker or continuous nosing strip', 'On automatically when the room is dark', 'Level set to not lift the screen black'] },
        { n: '06', title: 'Scenes', body: 'Layers only matter if they move together.', points: ['Movie, Interval, Party, Clean, Off', 'Fade times authored per scene', 'One control surface with the rest of the room'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Indicative for a dedicated 26 m² room. Retrofits use the circuits that exist.',
      rows: [
        { label: 'Dimmable layers', value: '4 – 6, independently controlled' },
        { label: 'Colour temperature', value: '2200 – 3000 K warm-dim' },
        { label: 'Dimming', value: 'Flicker-free to 1%, no visible steps' },
        { label: 'Colour rendering', value: 'CRI 90+ on every white circuit' },
        { label: 'Star ceiling', value: '150 – 900 points, hand set out' },
        { label: 'Screen sync', value: 'Real-time, damped, defeatable' },
        { label: 'Scenes', value: '5 – 8, authored fade times' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The room is finished and feels flat, bright or clinical.',
          'You want a star ceiling or screen-synced colour without a full rebuild.',
          'The lighting is currently one circuit and one switch.',
          'You are building a theatre and want this designed rather than assumed.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'You want the whole room rebuilt — this is included in Private Home Theatre.',
          'The problem is that the controls are a mess — see Home Automation & Control.',
        ],
      },
    },
    gallery: {
      label: 'Rooms lit',
      items: [
        { src: img('projection', 1800, '4:5'), alt: 'A projector beam through haze', caption: 'Darkness · the layer everything else is judged against' },
        { src: img('grand', 1800, '4:5'), alt: 'A grand dark interior with architectural lighting', caption: 'Wall washers · grazing light on relief' },
        { src: img('fluted', 1800, '4:5'), alt: 'A fluted wall grazed by warm light', caption: 'Cove · continuous, warm-dim, no scallops' },
        { src: img('theatre', 1800, '4:5'), alt: 'A private cinema with a star ceiling', caption: 'Star ceiling · hand set out, dims to nothing' },
      ],
    },
    cta: {
      heading: ['Send a photo', 'with the lights on.'],
      body: 'And one with them off. Between the two we can tell you which layers the room is missing and what it would take to add them.',
      action: 'Start a Project',
      reassurance: 'Retrofits work with the circuits you already have.',
    },
    related: ['home-automation-control', 'private-home-theatre', 'bar-lounge-audio'],
  },

  /* ============================================================
     09 — PREMIUM SEATING / RECLINERS
     ============================================================ */
  {
    slug: 'premium-seating',
    n: '09',
    nav: 'Premium Seating & Recliners',
    navNote: 'Seating on its own',
    title: 'Premium Seating & Recliners',
    tier: 'Product',
    headline: ['The one part of', 'the room you', 'actually touch.'],
    sub: 'Motorised recliners with powered headrest, lumbar and leg rest, console storage and per-seat control — specified, tiered and installed on their own, without a full AV overhaul.',
    meta: 'Any room · 2–24 seats · 4–10 weeks lead',
    range: 'Per seat',
    signature: 'recliner',
    hero: img('chair', 2600, '16:9'),
    heroAlt: 'A sculptural motorised recliner in a private cinema',
    statement: 'You leave early because of the chair.',
    intro: [
      'A room can have a perfect picture and a perfect measurement report and still fail, because forty minutes in, your lower back has decided the evening is over. Seating is the only system in the room that is in physical contact with the person the whole time.',
      'It is also the one thing on this list you can buy on its own and feel immediately.',
    ],
    system: {
      label: 'The specification',
      heading: ['Every axis', 'that moves.'],
      intro: 'The brochure spec, itemised — because a "motorised recliner" ranges from two motors and a cupholder to what is described here.',
      layers: [
        { n: '01', title: 'Powered Headrest', body: 'The adjustment that decides whether your neck lasts the film.', points: ['Independent motorised articulation', 'Set for the actual screen height in your room', 'Memory position per seat'] },
        { n: '02', title: 'Lumbar Support', body: 'Powered, because the right amount changes through an evening.', points: ['Adjustable depth under power', 'Held through the full recline range', 'Tuned at handover, per person'] },
        { n: '03', title: 'Leg Rest', body: 'Full extension, and it takes the weight.', points: ['Independent powered extension', 'Calf support through the range', 'Wall-hugging mechanism where space is tight'] },
        { n: '04', title: 'Console & Storage', body: 'Everything you put down has somewhere to go.', points: ['Cooled or plain cupholders', 'Lidded storage and a device tray', 'USB-C and mains charging at the seat'] },
        { n: '05', title: 'Upholstery', body: 'The finish decides how it ages, not how it looks.', points: ['Aniline and semi-aniline leather, or performance fabric', 'Contrast stitch, piping and perforation options', 'Cleanable specifications for family rooms'] },
        { n: '06', title: 'Layout & Risers', body: 'A great chair in the wrong place is still the wrong seat.', points: ['Sightlines calculated per row', 'Riser heights and depths designed to suit', 'Power, data and control routed into every seat'] },
      ],
    },
    spec: {
      label: 'Typical specification',
      note: 'Per-seat figures. Configuration, upholstery and motor count vary by model.',
      rows: [
        { label: 'Motors per seat', value: '3 – 4 (back, leg rest, headrest, lumbar)' },
        { label: 'Recline range', value: 'Upright to near-flat' },
        { label: 'Seat width', value: '700 – 840 mm, arm to arm' },
        { label: 'Wall clearance', value: 'From 80 mm, wall-hugging mechanism' },
        { label: 'Power at seat', value: 'USB-C PD and mains socket' },
        { label: 'Upholstery', value: 'Leather, semi-aniline or performance fabric' },
        { label: 'Lead time', value: '4 – 10 weeks, configuration dependent' },
      ],
    },
    fit: {
      label: 'Is this the one',
      heading: ['Built for.', 'Not built for.'],
      yes: {
        title: 'This is the right solution if',
        items: [
          'The picture and sound are already good and the seating is what lets it down.',
          'You want cinema seating in a living room or media room.',
          'People leave before the end and nobody can say why.',
          'You want the risers and sightlines designed, not guessed.',
        ],
      },
      no: {
        title: 'Look at another solution if',
        items: [
          'You are building a dedicated room — seating is already in Private Home Theatre.',
          'The room sounds wrong — a better chair will not fix that.',
        ],
      },
    },
    gallery: {
      label: 'Seating delivered',
      items: [
        { src: img('theatre', 1800, '4:5'), alt: 'Tiered recliners in a private cinema', caption: 'Three tiers · sightlines set from the chair' },
        { src: img('comfortRoom', 1800, '4:5'), alt: 'A calibrated private cinema with recliners', caption: 'Console · storage, charging, per-seat control' },
        { src: img('fluted', 1800, '4:5'), alt: 'A low sofa against a fluted acoustic wall', caption: 'Front row · lounge seating, same specification' },
        { src: img('modern', 1800, '4:5'), alt: 'A modern interior with sculptural seating', caption: 'Media room · cinema seating, living-room finish' },
      ],
    },
    cta: {
      heading: ['Come and sit', 'in one.'],
      body: 'This is the one solution nobody should buy from a photograph. The experience centre on Marine Drive has them in three configurations, and forty minutes in a chair settles it.',
      action: 'Book a Visit',
      reassurance: 'Mon – Sat · 10:00 – 19:00 · Marine Drive, Kochi',
    },
    related: ['private-home-theatre', 'living-room-theatre-upgrade', 'acoustic-treatment'],
  },
]

/* --- Lookups -------------------------------------------------- */

/** One solution by slug, or undefined. */
export const getSolution = (slug) => solutions.find((s) => s.slug === slug)

/** `related` slugs resolved to the entries themselves, missing ones dropped. */
export const relatedTo = (solution) =>
  (solution.related ?? []).map(getSolution).filter(Boolean)

/* ============================================================
   CROSS-REFERENCES

   The `fit.no` lists are the most useful copy in this file and
   the easiest to waste. Almost every entry ends by naming the
   solution the visitor should be reading instead — "see Bar &
   Lounge Audio", "start with Acoustic Treatment", "this is
   included in Private Home Theatre" — which means the catalogue
   already knows how to route someone who has landed on the
   wrong page. Rendered as flat text, it makes them go back to
   the index and search for a name they half-remember.

   So the names are matched and turned into links.

   WHY A DECLARED LIST AND NOT A HEURISTIC
   The copy refers to solutions by whatever reads best in the
   sentence — "the Living Room Upgrade" for a solution titled
   "Living Room Theatre Upgrade", "Premium Seating" for one
   titled "Premium Seating & Recliners". Deriving short forms by
   splitting titles on `&` gets "Party", "Bar" and "Outdoor",
   which are ordinary English words that would light up half the
   sentences on the page as links. Every phrase that becomes a
   link is written down here, and adding a new way of referring
   to a solution is a deliberate edit rather than a side effect.

   Matched longest-first, so "Acoustic Treatment & Room
   Engineering" wins before "Acoustic Treatment" can match its
   first two words.
   ============================================================ */
const ALIASES = {
  'private-home-theatre': ['Private Home Theatre'],
  'living-room-theatre-upgrade': ['Living Room Theatre Upgrade', 'Living Room Upgrade'],
  'home-automation-control': ['Home Automation & Control'],
  'acoustic-treatment': ['Acoustic Treatment & Room Engineering', 'Acoustic Treatment'],
  'party-event-audio': ['Party & Event Audio'],
  'bar-lounge-audio': ['Bar & Lounge Audio'],
  'outdoor-terrace-sound': ['Outdoor / Terrace Sound'],
  'lighting-ambience-design': ['Lighting & Ambience Design'],
  'premium-seating': ['Premium Seating & Recliners', 'Premium Seating'],
}

const NAMES = Object.entries(ALIASES)
  .flatMap(([slug, names]) => names.map((name) => ({ slug, name })))
  .sort((a, b) => b.name.length - a.name.length)

/**
 * Split a sentence into plain strings and `{ slug, name }` links.
 *
 * `self` is the page the sentence is ON — a solution linking to
 * itself is a control that does nothing, which reads as broken, so
 * its own names are skipped and left as text.
 */
export function crossRefs(text, self) {
  const parts = []
  let rest = String(text)

  while (rest) {
    let hit = null

    for (const entry of NAMES) {
      if (entry.slug === self) continue
      const at = rest.indexOf(entry.name)
      if (at === -1) continue
      if (!hit || at < hit.at) hit = { ...entry, at }
    }

    if (!hit) {
      parts.push(rest)
      break
    }

    if (hit.at > 0) parts.push(rest.slice(0, hit.at))
    parts.push({ slug: hit.slug, name: hit.name })
    rest = rest.slice(hit.at + hit.name.length)
  }

  return parts
}

/** The next solution in catalogue order, wrapping — so a detail page
 *  always has somewhere to go that is not "back". */
export const nextSolution = (slug) => {
  const i = solutions.findIndex((s) => s.slug === slug)
  return solutions[(i + 1) % solutions.length]
}
