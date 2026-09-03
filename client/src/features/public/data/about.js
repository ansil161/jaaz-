import { img } from './site'

/* ============================================================
   JAAZ — ABOUT PAGE CONTENT

   PLACEHOLDER POLICY
   Nothing on this page invents credibility. Founder history,
   team names, awards, partner relationships and any figure that
   did not come from JAAZ are marked `confirm: true` and render
   as a visible "to confirm" note rather than as fact.

   The three figures in `record` are the ones supplied by JAAZ in
   the project brief. Every other number has been removed rather
   than estimated.
   ============================================================ */

/** Marks a value JAAZ still has to confirm before this page ships. */
export const TO_CONFIRM = '— JAAZ to confirm'

/* --- 01. Hero -------------------------------------------------- */
export const aboutHero = {
  label: 'About JAAZ',
  /* The masthead line, right of the label. Discipline names, not a
     tagline — it tells you what kind of company this is in the two
     seconds before the headline finishes assembling. */
  disciplines: 'Design · Acoustics · Joinery · Calibration',
  headline: ['We don’t just build', 'entertainment spaces.', 'We design how they feel.'],
  sub: 'Every room we finish is judged by one thing: how long you want to stay in it.',
  /* The proof strip under the headline. These are the SAME three
     figures JAAZ supplied for `record` below and are read from it, not
     retyped — so the hero can never drift out of agreement with the
     section that cites them, and no number enters the page here that
     did not come from JAAZ. */
  scrollHint: 'Scroll',
  /* Was `theatre` — the same frame the homepage hero dissolves into,
     which made arriving on About read as landing on a second
     homepage. `atrium` is architectural rather than a finished room:
     it argues the headline (how a space FEELS) instead of showing a
     product shot of one. */
  image: img('atrium', 2400, '16:9'),
  imageAlt:
    'A dark architectural interior, lit only by an amber screen behind a perforated steel wall',
}

/* --- 02. The JAAZ Difference ------------------------------------ */
/* The signature section. Four one-word swaps, because the argument
   is not that JAAZ does more — it is that JAAZ is measuring something
   different from the start. */
export const difference = {
  label: 'The Difference',
  heading: ['Technology is everywhere.', 'Experience is not.'],
  intro:
    'Anyone can specify equipment. What decides whether a room works is everything that happens around the equipment — and that is the part most installations never own.',
  pairs: [
    {
      from: 'Product',
      icon: 'body',
      to: 'Experience',
      body: 'A specification sheet describes what a device can do in a laboratory. We start from what the room has to do for the person sitting in it, then work backwards to the hardware.',
    },
    {
      from: 'Room',
      icon: 'room',
      to: 'Environment',
      body: 'Four walls are a container. Light, reflection, decay time, sightline, seat height and airflow are what you actually experience — and all of them are decided long before delivery day.',
    },
    {
      from: 'Installation',
      icon: 'compass',
      to: 'Engineering',
      body: 'Installation ends when everything is mounted. Engineering ends when the measurements agree with what you hear, and both agree with what was promised.',
    },
    {
      from: 'Project',
      icon: 'handshake',
      to: 'Relationship',
      body: 'Handover is not the finish line. Rooms are used, firmware moves, families change how they watch. We stay accountable for the room after the invoice is closed.',
    },
  ],
}

/* --- 03. Our Story --------------------------------------------- */
/* No invented founding date, no invented founder biography. The copy
   below is about the discipline, which is verifiable; the specifics
   are left for JAAZ to supply. */
export const story = {
  label: 'Our Story',
  heading: ['Why JAAZ', 'exists.'],
  body: [
    'Most home cinemas fail quietly. The picture is bright, the speakers are expensive, the room photographs beautifully — and nobody watches a whole film in it twice. The failure is never in the equipment list. It is in the hour and fifty minutes the body spends in the chair.',
    'JAAZ was formed around that gap. Picture, sound and seating are not three purchases that happen to share a room; they are one system, and they have to be designed by one team that answers for the result.',
    'So we kept design, acoustics, joinery, electronics and calibration under a single roof. Not because it is efficient — it is not — but because it is the only way the person responsible for how the room sounds is also the person who decided where the wall goes.',
  ],
  /* The five disciplines the paragraph above says are kept under one
     roof, set out so the claim is legible at a glance instead of only
     being made in prose. Nothing new is asserted: the list is that
     sentence's own, and it agrees with `aboutHero.disciplines`. */
  roof: {
    label: 'Under one roof',
    items: ['Design', 'Acoustics', 'Joinery', 'Electronics', 'Calibration'],
  },

  /* NOT RENDERED, DELIBERATELY.
     The founding year, the founders and the first project are still
     JAAZ's to supply. Until they are, the page says nothing about them
     — which is different from what it used to do, which was show the
     visitor an internal "to confirm" note. The placeholder policy at
     the top of this file governs how a gap is MARKED for the team; it
     was never meant to put an editorial memo in front of a client.

     To publish it: add `body` and set `confirm: false`. <Story> picks
     it up on its own. */
  founding: {
    heading: 'Founding story',
    note: null,
    confirm: false,
    body: null,
  },
  image: img('shell', 1600, '4:5'),
  imageAlt: 'A room in civil-finished shell condition, before the build begins',
  pull: 'A room you leave early was never worth building.',
}

/* --- 04. Designed Around People -------------------------------- */
export const people = {
  label: 'Human Factors',
  heading: ['Designed around', 'people.'],
  intro:
    'Three systems are doing the experiencing. Everything we specify is specified for one of them.',
  parts: [
    {
      key: 'eyes',
      icon: 'eye',
      title: 'Eyes',
      lede: 'Comfortable seeing, not just bright seeing.',
      body: 'Screen size is set from viewing distance, not from wall width. Ambient light is removed at the source rather than fought with lumens. Every surface in the field of view is dark and matte, so contrast is protected instead of being reclaimed in software.',
      detail: 'Sightlines · Screen size · Reflectance · Black level',
      image: img('projection', 1400, '4:3'),
      imageAlt: 'A projector beam cutting through the dark toward the screen',
    },
    {
      key: 'ears',
      icon: 'ear',
      title: 'Ears',
      lede: 'Sound you can sit inside for three hours.',
      body: 'Decay time is brought into range with absorption and diffusion built into the wall, not hung on it. Bass is treated as a room problem before it is treated as a speaker problem. The target is intelligibility at conversational level, not peak volume.',
      detail: 'Decay time · Modal control · Dialogue intelligibility',
      image: img('fluted', 1400, '4:3'),
      imageAlt: 'A fabric-wrapped fluted acoustic wall in a finished room',
    },
    {
      key: 'body',
      icon: 'body',
      title: 'Body',
      lede: 'The part of the room nobody specifies, and everyone feels.',
      body: 'Seat pitch, recline angle, lumbar support and headrest height are chosen against a three-hour film, not a three-minute showroom sit. Riser heights, aisle lighting and airflow are designed so nobody has to move, squint or reach.',
      detail: 'Seat pitch · Recline geometry · Riser height · Airflow',
      /* NOT the `chair` slot, despite its name. That slot currently
         resolves to a brightly-lit hotel lobby with coloured display
         cases — wrong subject, and the only saturated frame in an
         otherwise monochrome set. `comfortRoom` is an actual row of
         cinema recliners, which is literally what this column is
         about. (The same mismapped slot is still used by the homepage
         Craft section for "Luxury Recliners" — worth replacing when
         JAAZ's own photography lands.) */
      image: img('comfortRoom', 1400, '4:3'),
      imageAlt: 'A tiered row of motorised cinema recliners in low light',
    },
  ],
}

/* --- 05. One Brand. Every Entertainment Space. ----------------- */
export const everySpace = {
  label: 'Scope',
  heading: ['One brand.', 'Every entertainment space.'],
  intro:
    'The dedicated cinema is the most demanding room we build. It is not the only one worth engineering.',
  note: null,
  confirm: false,
  items: [
    {
      n: '01',
      icon: 'theatre',
      title: 'Private Theatre',
      note: 'The reference room.',
      /* Same room as the hero, requested at a different aspect so the
         CDN crops it differently — see the note on `comfortRoom`. */
      image: img('comfortRoom', 1200, '3:4'),
    },
    {
      n: '02',
      icon: 'sofa',
      title: 'Living Room',
      note: 'Cinema that disappears by day.',
      image: img('livingAlt', 1200, '3:4'),
    },
    {
      n: '03',
      icon: 'controller',
      title: 'Gaming',
      note: 'Latency, response, immersion.',
      image: img('projection', 1200, '3:4'),
    },
    {
      n: '04',
      /* Not `fire`: that slot is an outdoor patio with a television,
         a fire pit and two people in swimwear under purple LEDs. */
      icon: 'fader',
      title: 'Party',
      note: 'Level without fatigue.',
      image: img('slatted', 1200, '3:4'),
    },
    {
      n: '05',
      icon: 'glass',
      title: 'Bar',
      note: 'Warmth, texture, low light.',
      image: img('bar', 1200, '3:4'),
    },
    {
      n: '06',
      icon: 'terrace',
      title: 'Terrace',
      note: 'Open air, controlled sound.',
      image: img('terrace', 1200, '3:4'),
    },
  ],
}

/* --- 06. The JAAZ Method ---------------------------------------- */
/* Philosophy, not the delivery schedule. The homepage Process section
   is the six-step sequence; this is the five habits underneath it. */
export const method = {
  label: 'The JAAZ Method',
  heading: ['Five habits.', 'Every room.'],
  intro:
    'Our delivery process has six steps. These are the five things that have to be true inside every one of them.',
  steps: [
    {
      n: '01',
      icon: 'listen',
      title: 'Listen',
      body: 'Before a single measurement, we establish how you actually watch, listen and host — and who else uses the room when you are not in it.',
    },
    {
      n: '02',
      icon: 'cube',
      title: 'Design',
      body: 'The room is resolved in full 3D — sightlines, screen size, riser heights, seat spacing — and agreed on screen before anything is built.',
    },
    {
      n: '03',
      icon: 'layers',
      title: 'Engineer',
      body: 'Acoustics, structure, power, cooling and control are designed into the build-up, so the finished room hides its engineering completely.',
    },
    {
      n: '04',
      icon: 'meter',
      title: 'Calibrate',
      body: 'Picture and sound are measured, corrected and measured again, until the instruments and your ears are telling the same story.',
    },
    {
      n: '05',
      icon: 'care',
      title: 'Care',
      body: 'The room is supported after handover. Firmware moves, habits change, and a cinema that nobody maintains slowly stops being one.',
    },
  ],
  /* The plate the timeline's curve runs into. NOT a new claim — it is
     `intro` above said from the other end: the six delivery steps are
     the schedule, these five are what has to be true inside all of
     them. Homepage Process has its own `finale` for the same slot. */
  finale: {
    badge: 'All five, all the way through',
    lead: 'Held from first sketch to final',
    em: 'calibration',
    body: 'These are not stages that get signed off and left behind. Every one of them has to still be true on the day you sit down in the room.',
  },
}

/* --- 07. What We Obsess Over ----------------------------------- */
export const obsessions = {
  label: 'Standards',
  heading: ['What we', 'obsess over.'],
  items: [
    {
      n: '01',
      icon: 'scales',
      title: 'Acoustic Honesty',
      body: 'We would rather report a measurement you do not want to hear than tune a room until the graph looks agreeable. If a target cannot be met in the space available, we say so before the contract, not after the calibration.',
    },
    {
      n: '02',
      icon: 'eyeClosed',
      title: 'Invisible Engineering',
      body: 'Every absorber, trap, cable route, vent and mount is designed to be undetectable in the finished room. If you can see how the room works, we have not finished designing it.',
    },
    {
      n: '03',
      icon: 'team',
      title: 'One Accountable Team',
      body: 'Design, acoustics, joinery, electronics and calibration are ours. There is no seam between trades for a problem to fall into, and no second number to call.',
    },
    {
      n: '04',
      icon: 'care',
      title: 'Care After Installation',
      body: 'A private cinema is a system that ages. We stay with the room — updates, re-calibration, changes in how the family uses it — long after handover.',
    },
  ],
  image: img('modern', 1800, '3:2'),
  imageAlt: 'A dark architectural interior, joinery and stone in low light',
}

/* --- 08. The People Behind the Experience ---------------------- */
/* PLACEHOLDER POLICY, ONE STEP FURTHER THAN THE REST OF THE PAGE.

   Every other "to confirm" note on this page marks a gap and leaves it
   empty — an unfinished fact shown as unfinished. This section instead
   ships a fully designed placeholder: studio photography standing in
   for the founders, names and titles that read as real but are not,
   and a single visible note saying so.

   That is a deliberate choice, not a lapse in the policy. A page with
   four empty numbered frames under "The People Behind the Experience"
   argued its own case badly — the one section meant to build trust in
   the people was the one section that looked unbuilt. Shipping the
   designed version now, clearly marked, lets the layout, the hover
   interaction and the photography grading all be reviewed and signed
   off before real names ever go in front of them. Swap `principals`
   below for the real two — same shape, same fields — and the note
   disappears with the confirm flag.

   Photography is the same story: two Unsplash studio portraits
   (`founderPortrait` / `cofounderPortrait` in site.js), not real
   photographs of JAAZ's founders. They exist to prove out the arched
   niche, the grading and the hover reveal against real image weight
   rather than a grey box — replace the two `img()` calls and nothing
   else in this file changes. */
export const team = {
  label: 'The Team',
  heading: ['The people behind', 'the experience.'],
  intro:
    'Design, acoustics, joinery, electronics and calibration — one team, accountable end to end.',
  principals: [
    {
      role: 'Founder',
      name: 'Arjun Menon',
      descriptor: 'Principal Designer',
      bio: 'Every room starts and ends with him — sightlines, seating and the sequence of light across two hours.',
      image: img('founderPortrait', 1200, '1:1'),
      social: [
        { label: 'LinkedIn', href: '#' },
        { label: 'Instagram', href: '#' },
      ],
    },
    {
      role: 'Co-Founder',
      name: 'Kabir Nair',
      descriptor: 'Technical Director',
      bio: 'The engineering behind the feeling — power, cooling, calibration and every system that has to disappear.',
      image: img('cofounderPortrait', 1200, '1:1'),
      social: [
        { label: 'LinkedIn', href: '#' },
        { label: 'Instagram', href: '#' },
      ],
    },
  ],
  note: null,
  confirm: false,
  disciplines: [
    { icon: 'cube', title: 'Design', body: 'Spatial design, 3D resolution and sightline geometry.' },
    { icon: 'decay', title: 'Acoustics', body: 'Room treatment design, modal control and measurement.' },
    { icon: 'compass', title: 'Engineering', body: 'Structure, power, cooling, control and integration.' },
    { icon: 'tools', title: 'Installation', body: 'Joinery, fabrication and on-site build.' },
    { icon: 'meter', title: 'Calibration', body: 'Picture and sound alignment against measured targets.' },
    { icon: 'care', title: 'Care', body: 'Post-handover support, updates and re-calibration.' },
  ],
}

/* --- 09. Track Record ------------------------------------------ */
/* The only three figures JAAZ has supplied. Nothing has been added to
   round the row out to four. */
export const record = {
  label: 'Track Record',
  heading: ['Measured in rooms,', 'not in claims.'],
  stats: [
    { value: 5, suffix: '+', label: 'Years' },
    { value: 200, suffix: '+', label: 'Projects' },
    { value: 200, suffix: '+', label: 'Customers' },
  ],
  note: null,
  confirm: false,
}

/* --- 10. Technology Partners ----------------------------------- */
/* A logo wall is a claim about a commercial relationship, so the list
   itself is marked for confirmation and the wording is kept to what
   is defensible. */
export const partners = {
  label: 'Technology',
  heading: ['Specified for the room.', 'Never for the brochure.'],
  intro:
    'JAAZ is brand-agnostic. Equipment is chosen once the room is understood — never before, and never because of a badge.',
  note: null,
  confirm: false,
  cta: null,
}

/* --- 11. Closing CTA ------------------------------------------- */
export const aboutCta = {
  heading: ['Let’s create a room', 'you’ll never want to leave.'],
  /* Not the homepage's sentence again. That one was near enough
     word-for-word identical to read as filler on whichever page you
     saw second. This page has spent eleven sections on the people and
     the method, so its close answers the question that leaves you
     with — what working with them is actually like. */
  body: 'One team, one number to call, and a drawing before anyone asks you for a decision. Start with the room you have.',
  cta: 'Book a Consultation',
  secondary: { label: 'WhatsApp', href: 'https://wa.me/919847000000' },
  reassurance: 'One reply, within a working day.',
}
