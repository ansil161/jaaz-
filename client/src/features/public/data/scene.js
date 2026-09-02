import { img } from './site'

/* ============================================================
   THE SCENE EXPERIENCE MODULE

   Built to the JAAZ Scene Experience concept document
   (JAAZ_Scene_Experience_Module_Complete_Concept.pdf, 5pp).
   Every heading, every scene, every device state and every
   manual control below is from that document; where the
   document contradicts itself the note beside the value says
   which reading was taken and why.

   ------------------------------------------------------------
   THE SECTION IN ONE SENTENCE

   The visitor picks a MOMENT — movie night, match night, music,
   a party, goodnight — and the room in the photograph re-lights
   itself while five device states arrive one after another in
   the order a real room would actually do them.

   ------------------------------------------------------------
   WHAT IT REPLACED, AND THE ONE THING THAT SURVIVED

   <Prism>: five wide bands, one per atmosphere, stacked with
   `position: sticky` and scrolled through. It made the same
   claim — one room, several worlds — and it made it by
   SCROLLING. The visitor was carried through five states in a
   fixed order and chose nothing.

   This section makes the claim by being OPERATED, which is what
   the concept document asks for and what the claim actually
   needs: "Technology should not feel like something the
   homeowner has to control. The technology works for the
   homeowner." A section that demonstrates one-touch automation
   has to have a touch in it.

   WHAT SURVIVED IS THE GRADE. The five `look` blocks below are
   carried over from Prism's five faces, and they are not
   redecoration — they were tuned against THIS EXACT PLATE over
   two rebuilds (see the long note over `looks`). A grade is a
   relationship to one photograph and does not survive being
   re-derived from scratch, so the numbers move with the plate.

   ------------------------------------------------------------
   WHY THIS IS NOT A SECOND <Feeling>

   <Feeling> also asks a question and swaps a picture. The
   difference is the whole point of this section:

     Feeling   asks the VISITOR what they want to feel, answers
               with a KIND OF ROOM, and shows one photograph per
               answer. There is no room state, no timing and
               nothing to fine-tune.

     Scene     asks what the visitor wants to DO tonight, answers
               with ONE room reconfiguring itself, and the answer
               is a CASCADE — five subsystems arriving over a
               second and a half, in the order the room would
               really do them.

   Feeling is a mood board with a control on it. This is the
   automation, demonstrated. If a future edit makes either of
   them look like the other, the one that has to change is
   whichever one stopped doing its own job.

   ------------------------------------------------------------
   FIVE SCENES, NOT SIX

   The document lists five scenes in its scene table (§6), five
   in its UX philosophy (§11) and five in its final messaging
   (§13). Its bottom-navigation section (§9) lists six by
   splitting GAMING out of PARTY, and its layout table (§4) calls
   the same item "Gaming/Party". Five is the reading taken here:
   three sections agree on it, and the site has no gaming
   photograph anywhere in the verified set, so a sixth scene
   would be a word with nothing behind it.
   ============================================================ */

export const scene = {
  /* THE ANCHOR. This slot answered to `#prism`, and before that
     to `#snap`. `#snap` now belongs to <Snap> directly above;
     `#prism` named a mechanism (a stack of bands) that no longer
     exists here, and an anchor naming a thing the visitor cannot
     see is worse than one that changed. Nothing in the codebase
     linked to `#prism` when this was written — checked, not
     assumed. */
  id: 'scene',

  /* A NAME, NOT A NUMBER. Chapter numerals are down to one
     deliberate survivor on this page (see the note over
     `lightsDown` in data/site.js): the running order no longer
     puts the numbered sections in a contiguous run, so a set of
     marks that skips and doubles back is worse than none. */
  label: 'Scenes',

  /* §5. The document's primary headline, verbatim, in the site's
     roman-over-italic lockup. Its stated alternative — "You
     choose the moment. JAAZ sets the scene." — says the same
     thing in the third person and is longer; the imperative is
     the better half of the pair and it is the one the document
     itself lists as primary. */
  heading: ['Choose the moment.', 'We’ll set the scene.'],

  /* §5, supporting copy, verbatim. */
  intro:
    'From movie night to goodnight, JAAZ brings lighting, audio, video, climate and shading together in one effortless experience.',

  /* §11. Two lines that state the section's whole proposition,
     and they are the label for the manual layer rather than a
     paragraph in the header — because that is the moment the
     visitor is deciding whether to open it. */
  manualCue: ['Automatic when you want it.', 'Manual when you need it.'],

  /* §13, the supporting message. It sits at the very bottom, once,
     small, after the visitor has already watched the thing it
     describes happen. Said before the demonstration it is a
     claim; said after it, it is a caption. */
  coda: 'Behind the scenes: complex engineering. In front of you: effortless living.',

  /* ---- The room ----

     ONE PHOTOGRAPH. The claim is that a single room becomes five
     different evenings, so five photographs would quietly refute
     it — the visitor would be looking at five rooms.

     `living/base` is the media lounge, and it is the plate
     because it can hold all five scenes: a large screen with
     in-wall speakers, a deep modular sofa AND separate lounge
     chairs, a low table, cove light, and a full-height glass wall
     onto a lit terrace. A dedicated cinema — four rows of fixed
     tiered recliners — can watch a film and cannot host anybody,
     which is the contradiction this slot had before.

     It is also a JAAZ pipeline render rather than a stock
     interior, which matters for a section whose entire argument
     is "this is what our automation does to a room".

     THE FALLBACK IS NOT THE SAME ROOM. `living/base` is in the
     manifest, so `hasStill()` is true and the fallback is
     unreachable today; it exists for the day the plate is
     regenerated or renamed. There is no stock frame of THIS room,
     so the stand-in is `livingAlt` — a dark media lounge whose
     sofa already faces a blank wall — chosen because it can at
     least attempt all five scenes. */
  room: {
    still: 'living/base',
    /* Requested at 3:2. The stage is a wide landscape panel, so
       asking the CDN for a portrait crop and throwing away the
       sides is the one thing that would waste bytes here. */
    photo: img('livingAlt', 2200, '3:2'),
    alt: 'A JAAZ media lounge: a large screen, a deep sofa and lounge chairs, opening onto a lit terrace',
  },

  /* ---- The five states the panel reads out ----

     §8. The panel's ORDER and the room's TIMING are two different
     orders, and that is the most load-bearing detail in this
     file.

     THE PANEL READS in the document's order: projector, audio,
     lights, curtains, climate. That is a reading order — the two
     things a visitor thinks of as "the scene" first, then the
     three that make the room comfortable.

     THE ROOM ACTS in §7's order: lights (0.2s), curtains (0.5s),
     screen (0.8s), audio (1.0s), climate (1.2s). That is a
     physical order — you dim before you close, you close before
     you throw a picture at the wall, and the air handling is last
     because it is the slowest thing in the room and nobody
     watches it happen.

     So `at` is the cue and the array order is the layout, and
     they deliberately disagree. A visitor cannot name why the
     cascade feels right, and would notice immediately if the
     rows simply lit up top to bottom like a progress list.

     `key` is also the glyph key — see sceneIcons.jsx. It lives
     here rather than being mapped from the label in the
     component, because the label is COPY and can be rewritten
     ("Projector" becomes "Screen" for four of the five scenes
     already), and copy that silently controls which picture
     appears is a trap. */
  channels: [
    { key: 'screen', label: 'Projector', at: 0.8 },
    { key: 'sound', label: 'Audio', at: 1.0 },
    { key: 'light', label: 'Lights', at: 0.2 },
    { key: 'curtain', label: 'Curtains', at: 0.5 },
    { key: 'climate', label: 'Climate', at: 1.2 },
  ],

  /* §7. The moment the room reports itself finished. 1.5s is the
     document's own number and it is 0.3s after the last channel
     lands, which is the pause that makes it read as a conclusion
     rather than as a sixth item. */
  readyAt: 1.5,
  readyWord: 'Room ready',
  settingWord: 'Setting the scene',

  /* ---- The scenes ----

     Every `line` is the document's own copy for that scene, and
     every `states` value is its room response (§6), normalised
     into one word or one figure per channel.

     WHY LIGHTS AND CLIMATE ARE FIGURES AND THE OTHERS ARE WORDS.
     The manual layer (§10) hands the visitor a lights percentage
     and a temperature, and a manual control that disagrees with
     the readout above it is the one bug this section cannot
     afford — it would break the exact claim it is making. So
     those two channels are the SAME NUMBER in both places, and
     the scene sets its opening value. Everything else the scene
     states as a word, because "Stadium" is what the document
     says and it is the interesting half of "Stadium Audio".

     WHERE THE DOCUMENT GIVES A RANGE OR A CHARACTER RATHER THAN A
     NUMBER, one was chosen and it is marked. Match night is
     "Lights 35-40%" -> 38. Music is "Ambient Lighting" -> 30,
     Party is "Dynamic Lighting" -> 65, Goodnight is "OFF/LOW" ->
     5, all read off the lighting character the document
     describes. Goodnight's "AC ECO" is 24°C, which is what an eco
     setpoint is in this climate. */
  scenes: [
    {
      key: 'movie',
      n: '01',
      nav: 'Movie',
      title: 'Movie Night',
      line: 'One touch. Everything ready.',
      /* The one long-form sentence per scene. The document does
         not supply these; they are written to the register of its
         own copy — one sentence, in the second person, about the
         room rather than about the equipment. */
      body: 'The lights fall to a quarter, the curtains close, and the picture becomes the only bright thing in the room.',
      states: { screen: 'On', sound: 'Cinema', curtain: 'Closed' },
      lights: 20,
      climate: 22,
      volume: 42,
      seat: 'recline',
      /* Cool, dark, and pushed in on the screen wall. Watching is
         the one scene where the rest of the room is meant to stop
         existing. */
      look: {
        grade: { brightness: 0.55, contrast: 1.27, saturate: 0.7 },
        wash: { at: '68% 42%', tint: '176, 190, 208', power: 0.28 },
        veil: 0.3,
        crop: { pos: '70% 46%', zoom: 1.18 },
      },
    },
    {
      key: 'match',
      n: '02',
      nav: 'Match',
      title: 'Match Night',
      line: 'The stadium, without leaving home.',
      body: 'Brighter than a film and louder than a room needs to be, with the curtains open because nobody watches a match in the dark.',
      states: { screen: 'On', sound: 'Stadium', curtain: 'Open' },
      lights: 38, // "35-40%"
      climate: 22,
      volume: 54,
      seat: 'upright',
      look: {
        grade: { brightness: 0.86, contrast: 1.22, saturate: 1.06 },
        wash: { at: '64% 46%', tint: '150, 178, 208', power: 0.34 },
        veil: 0.09,
        crop: { pos: '62% 50%', zoom: 1.1 },
      },
    },
    {
      key: 'music',
      n: '03',
      nav: 'Music',
      title: 'Music',
      line: 'Let the room become the instrument.',
      body: 'The screen fades out on purpose. What is left is two channels, warm light and a room tuned to be listened to.',
      states: { screen: 'Resting', sound: 'Hi-Fi', curtain: 'Open' },
      lights: 30, // "Ambient Lighting"
      climate: 23,
      volume: 38,
      seat: 'relax',
      /* With the seating and the lamp, not the screen — the
         screen is off. The only warm-lit scene of the three
         darker ones. */
      look: {
        grade: { brightness: 0.68, contrast: 1.05, saturate: 0.78 },
        wash: { at: '28% 56%', tint: '214, 168, 116', power: 0.34 },
        veil: 0.17,
        crop: { pos: '34% 56%', zoom: 1.12 },
      },
    },
    {
      key: 'party',
      n: '04',
      nav: 'Party',
      title: 'Party',
      line: 'Bring the room to life.',
      body: 'House lights up, content on the screen, and the whole room open — because a party is a question about how much room there is.',
      states: { screen: 'Visuals', sound: 'Party', curtain: 'Open' },
      lights: 65, // "Dynamic Lighting"
      climate: 23,
      volume: 61,
      seat: 'upright',
      /* The widest frame in the set and the only one at zoom 1,
         for the reason in the body copy: this scene answers a
         question about space by showing all of it. */
      look: {
        grade: { brightness: 1.1, contrast: 0.99, saturate: 1.12 },
        wash: { at: '50% 72%', tint: '236, 214, 178', power: 0.42 },
        veil: 0,
        crop: { pos: '50% 50%', zoom: 1 },
      },
    },
    {
      key: 'goodnight',
      n: '05',
      nav: 'Goodnight',
      title: 'Goodnight',
      line: 'Everything settles around you.',
      body: 'Every system drops to the lowest setting it has and stays there, and the air handling goes quiet for the night.',
      states: { screen: 'Off', sound: 'Off', curtain: 'Closed' },
      lights: 5, // "OFF/LOW"
      climate: 24, // "AC ECO"
      volume: 0,
      seat: 'recline',
      /* The tightest frame in the set, on the far corner and the
         one lamp still on. 0.42 against Party's 1.10 is nearly
         one and a half stops between the darkest and the
         brightest evening in the same room — a section claiming
         the room transforms cannot make that claim inside a
         quarter of a stop. */
      look: {
        grade: { brightness: 0.42, contrast: 1.12, saturate: 0.5 },
        wash: { at: '78% 64%', tint: '196, 152, 104', power: 0.2 },
        veil: 0.36,
        crop: { pos: '76% 60%', zoom: 1.2 },
      },
    },
  ],

  /* ---- The manual layer (§10) ----

     It is SECONDARY and it stays closed. The document is explicit
     about this twice: "Manual control should exist, but it should
     not compete with the main scene experience", and "Manual
     controls stay hidden until Adjust Room is selected". A
     section whose argument is that you do not have to operate
     anything cannot open with five controls on screen.

     THREE OF THESE FIVE WRITE BACK INTO THE READOUT, and that is
     what stops the panel being a decoration. Move the lights and
     the LIGHTS row changes; step the temperature and CLIMATE
     changes; press CLOSED and CURTAINS changes. Volume and seats
     have no row of their own — the readout states what the SCENE
     set, and those two are finer than a scene.

     A manually changed channel is marked, and choosing any scene
     clears every mark: that is the "automatic when you want it"
     half made real rather than asserted. */
  adjust: {
    open: 'Adjust room',
    close: 'Close controls',
    lights: { label: 'Lights', min: 0, max: 100, step: 5 },
    climate: { label: 'Climate', min: 18, max: 28, step: 1 },
    volume: { label: 'Audio', min: 0, max: 100, step: 1 },
    curtain: {
      label: 'Curtains',
      /* OPEN · STOP · CLOSED, from the document. "Stop" is a
         command on a real curtain track rather than a position,
         and it is kept because it is what the hardware does — a
         drape halted mid-travel is a state the room can be in,
         and pretending otherwise would be tidier and less true. */
      options: [
        ['Open', 'Open'],
        ['Stopped', 'Stop'],
        ['Closed', 'Closed'],
      ],
    },
    seat: {
      label: 'Seats',
      options: [
        ['upright', 'Upright'],
        ['relax', 'Relax'],
        ['recline', 'Recline'],
      ],
    },
  },
}

export const sceneList = scene.scenes
export const sceneCount = sceneList.length
export const sceneChannels = scene.channels
