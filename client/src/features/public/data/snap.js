import { img } from './site'

/* ============================================================
   SIGNATURE SNAP — one room, different worlds

   THE SECTION THIS REPLACES, AND WHY

   The slot used to hold "What's tonight?" — six evenings, six
   photographs, an instrument rail. It argued the point by
   ENUMERATION: here are six things, please infer that the room
   is versatile. Enumeration is the weakest form of that
   argument, because six pictures of six rooms is exactly what a
   visitor already expects a builder's website to contain.

   This section makes the same claim by TRANSFORMATION instead.
   One ordinary room. One gesture. The room becomes a JAAZ
   experience in front of you, and then that single frame — the
   same photograph, never swapped — is re-lit five ways. The
   thesis is in the mechanics, not in the caption: if the picture
   changed between states, "ONE ROOM" would be a lie the layout
   was telling.

   ------------------------------------------------------------
   WHAT IS DELIBERATELY NOT HERE: A SECOND PHOTOGRAPH PER STATE

   The obvious build gives WATCH / PLAY / LISTEN / HOST / ESCAPE
   a picture each, and it is wrong twice over. It needs five
   renders that do not exist, and it disproves the headline in
   the act of illustrating it. So a state carries no image. It
   carries a GRADE (how the room is lit), a WASH (where the light
   is coming from and at what temperature) and a READOUT (what
   the room is actually doing, in the engineering voice the rest
   of this site speaks in). The plate underneath never moves.

   `plate` is left on the shape, unused and null, for the day
   JAAZ has genuine state photography of a single room. It
   resolves through `hasStill()` like every other slot, so the
   section gets quietly better when those land and needs no
   component change — the same three-state honesty the reels in
   utils/media.js are built on.
   ------------------------------------------------------------ */

export const snap = {
  id: 'snap',
  label: 'Signature',
  chapter: 'The Snap',

  /* Spoken once, before anything happens, so the scroll is
     understood as a gesture rather than as a page moving. */
  kicker: 'One gesture. Everything changes.',

  /* The payoff, and the only line in the section set in the
     display serif. Two lines, because the full stop between them
     is the point: a room, then the worlds it holds. */
  payoff: ['One room.', 'Different worlds.'],

  /* Read out beside the hand while the fingers close. It is a
     countdown to contact, not a caption — the section's whole
     tension beat is that a number is going to reach zero. */
  tension: 'Contact',

  /* ---- 01 · the ordinary room ----
     Elegant, and carrying no cinema equipment at all. That
     second condition is the one that matters: a bare
     civil-finished shell (which is what <Transform> further down
     the page opens on) makes this a construction story. The snap
     has to land on a room that already looks finished and
     expensive, so that what changes is CAPABILITY rather than
     decoration. */
  ordinary: {
    /* VERIFIED BY LOOKING AT IT, not by trusting the comment beside
       the id in site.js. `modern` was the first choice on the
       strength of its label and renders as a BRIGHT DAYLIT glass
       dining room — which breaks this section twice over: the scene
       is a night-time transformation, and no viewer will accept a
       sunlit kitchen and a dark cinema as the same room, which is
       the one thing the headline claims.

       `livingAlt` is a dark evening lounge: charcoal walls, a long
       sofa, brass pendants, one warm lamp, and — the detail that
       actually matters — the seating already faces a BLANK WALL.
       That wall is where the screen appears. The transformation has
       somewhere to happen. */
    photo: img('livingAlt', 2400, '16:9'),
    alt: 'A dark evening living room with a long sofa facing a blank wall and no visible cinema equipment',
    tag: 'Before the snap',
  },

  /* ---- 05 · the room after ----
     The rendered house plate when the pipeline has produced it,
     the verified photograph underneath it always. */
  cinema: {
    still: 'theatre/base',
    photo: img('theatre', 2400, '16:9'),
    alt: 'The same room as a JAAZ private cinema, screen lit and seating in place',
    tag: 'After the snap',
  },

  /* ---- 07 · the five states ----

     GRADE drives the four registered `--plate-*` properties on
     the plate itself. WASH is a radial light signature laid over
     it: `at` is where the light is coming from, `tint` its
     colour temperature, `power` how much of the frame it owns.
     Both are pure CSS on properties that already exist — no
     state costs a byte of new media.

     The readouts are real units in the house voice, and they are
     the thing that stops five words over one photograph from
     reading as a colour picker. */
  states: [
    {
      key: 'watch',
      word: 'Watch',
      n: '01',
      line: 'The room disappears and the picture is the only thing left in it.',
      readout: [
        ['Mode', 'Reference'],
        ['Light', '0.6 fL'],
        ['Cadence', '24p'],
      ],
      grade: { brightness: 0.98, contrast: 1.14, saturate: 0.92 },
      wash: { at: '50% 34%', tint: '198, 176, 138', power: 0.34 },
      plate: null,
    },
    {
      key: 'play',
      word: 'Play',
      n: '02',
      line: 'Latency collapses, the frame rate doubles and the room leans in.',
      readout: [
        ['Mode', 'Low latency'],
        ['Signal', '4K · 120Hz'],
        ['Lag', '9 ms'],
      ],
      grade: { brightness: 1.04, contrast: 1.18, saturate: 1.06 },
      wash: { at: '68% 46%', tint: '150, 178, 208', power: 0.42 },
      plate: null,
    },
    {
      key: 'listen',
      word: 'Listen',
      n: '03',
      line: 'The screen goes dark on purpose, and the room becomes an instrument.',
      readout: [
        ['Mode', 'Two channel'],
        ['Response', '±1.5 dB'],
        ['Decay', '0.32 s'],
      ],
      grade: { brightness: 0.9, contrast: 1.06, saturate: 0.7 },
      wash: { at: '28% 62%', tint: '214, 168, 116', power: 0.3 },
      plate: null,
    },
    {
      key: 'host',
      word: 'Host',
      n: '04',
      line: 'House lights up, every seat is a good seat, nobody is watching alone.',
      readout: [
        ['Mode', 'House'],
        ['Seats', 'All rows'],
        ['Zones', '4 lit'],
      ],
      grade: { brightness: 1.1, contrast: 1.02, saturate: 1.0 },
      wash: { at: '50% 78%', tint: '236, 214, 178', power: 0.5 },
      plate: null,
    },
    {
      key: 'escape',
      word: 'Escape',
      n: '05',
      line: 'Everything drops to the lowest setting the room has, and stays there.',
      readout: [
        ['Mode', 'Late'],
        ['Light', '0.1 fL'],
        ['Level', '-32 dB'],
      ],
      grade: { brightness: 0.84, contrast: 1.1, saturate: 0.62 },
      wash: { at: '80% 68%', tint: '186, 146, 104', power: 0.24 },
      plate: null,
    },
  ],

  /* The instrument rail's own labels. */
  hint: 'Scroll, or pick a state',
}

export const snapStates = snap.states
export const snapStateCount = snapStates.length

/* ------------------------------------------------------------
   THE PINNED TIMELINE, AS POSITIONS.

   Written here rather than inline in the component because the
   scene has four named acts and the numbers between them are
   content decisions — how long the tension lasts, how long the
   freeze holds — not implementation detail. Every value is a
   progress along the pin, 0 to 1.

   THE FREEZE IS A GAP, NOT A TWEEN. Between `snapOut` and
   `transform` there is no animation at all, which under a scrub
   means the picture is genuinely motionless while the visitor
   keeps scrolling. That is what makes the transformation feel
   physical: something struck, and the world took a moment to
   catch up. Closing the gap would remove the effect entirely and
   nothing would error.
   ------------------------------------------------------------ */
export const BEATS = {
  /* 01–03 · ordinary, hand enters, tension */
  handIn: 0.06,
  tension: 0.17,

  /* 04 · the peak. Two frames of flash, then the held gap. */
  snap: 0.3,
  snapOut: 0.318,

  /* 05–06 · transformation and payoff */
  transform: 0.355,
  payoff: 0.47,

  /* 07 · the five states share everything from here to the end */
  states: 0.6,
}

/** Where state `i` is centred along the pin. */
export const stateAt = (i) =>
  BEATS.states + ((i + 0.5) / snapStateCount) * (1 - BEATS.states)
