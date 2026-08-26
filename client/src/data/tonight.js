import { img } from './site'

/* ============================================================
   WHAT'S TONIGHT? — six nights in one house

   The homepage's argument is that JAZ engineers rooms. This
   section is the other half of it: what those rooms are FOR. Six
   scenarios, one interactive stage, no page change — the visitor
   is meant to picture their own Friday, not read a capability
   list.

   "One space. Different worlds." is not a tagline bolted on
   afterwards; it is the reason two of these six share a room (see
   `still` below). A living room that is a match on Saturday and a
   family night on Sunday IS the product.

   ------------------------------------------------------------
   HOW A NIGHT RESOLVES TO SOMETHING ON SCREEN

   Three independent sources, checked in order, and every one of
   them is a legitimate state the section renders well rather than
   an error — the same principle `reel()` in lib/media.js is built
   on, extended by one step:

     1. `reel`   the Veo clip, once generated. Motion.
     2. `still`  a render the house pipeline has ALREADY produced
                 (media-src/jaz-home/...), used as the poster until
                 the clip lands.
     3. `photo`  a verified Unsplash plate. The floor. Always
                 present, so this section is never empty on a
                 fresh clone with no generated assets at all.

   That ordering is what lets the section ship and be reviewed
   TODAY, before a single second of Veo has been generated, and
   get quietly better as clips arrive — with no component change.
   Step 3 exists because steps 1 and 2 are both build artefacts:
   `media-src/` is gitignored-scale binary that a new machine will
   not have.

   Photography rule, unchanged: `photo` values come from the
   verified `PLATES` slot map in site.js. An invented Unsplash id
   is a broken image in production.
   ------------------------------------------------------------ */

export const tonight = {
  id: 'tonight',
  label: 'One space. Different worlds.',
  heading: ["What's", 'tonight?'],

  /* Spoken by the section, not by a button — the nav is numbers, so
     the affordance has to be stated once in words somewhere. */
  hint: 'Pick a night',

  /* The leading cell's label — what the six cells ARE, in the
     same slot the reference gives to its category name. */
  group: 'Nights',

  prev: 'Previous night',
  next: 'Next night',

  experiences: [
    {
      key: 'movie-marathon',
      short: 'Movie',
      n: '01',
      title: 'Movie Marathon',
      copy: 'One movie becomes three, so the comfort has to last the distance.',
      reel: 'tonight/movie-marathon',
      still: 'theatre/base',
      photo: img('theatre', 2200, '16:9'),
      alt: 'A private cinema at night, tiered recliners facing a lit scope screen',
    },
    {
      key: 'boss-fight',
      short: 'Gaming',
      n: '02',
      title: 'Boss Fight',
      copy: 'The room disappears and the game takes over completely.',
      reel: 'tonight/boss-fight',
      still: 'gaming/base',
      photo: img('tech', 2200, '16:9'),
      alt: 'A restrained architectural gaming room, ultrawide display, warm cove light',
    },
    {
      key: 'match-day',
      short: 'Match',
      n: '03',
      title: 'Match Day',
      copy: 'Every goal, every reaction, every second of the match.',
      reel: 'tonight/match-day',
      still: 'living/base',
      photo: img('screenWall', 2200, '16:9'),
      alt: 'A living area with a large display, friends watching a match',
    },
    {
      key: 'family-takeover',
      short: 'Family',
      n: '04',
      title: 'Family Takeover',
      copy: 'Everyone in the house finds a reason to stay in the room.',
      reel: 'tonight/family-takeover',
      /* Deliberately the same room as Match Day. The section's whole
         claim is that one space becomes different worlds, and the two
         clips will differ completely; sharing the interim poster is
         the honest representation of that, not a gap. */
      still: 'living/base',
      photo: img('fire', 2200, '16:9'),
      alt: 'A warm lounge in the evening, fire lit, screen glowing, people together',
    },
    {
      key: 'party-after-dark',
      short: 'Party',
      n: '05',
      title: 'Party After Dark',
      copy: 'The screen moves outside and the night gets louder.',
      reel: 'tonight/party-after-dark',
      still: 'outdoor/base',
      photo: img('terraceAlt', 2200, '16:9'),
      alt: 'A lit terrace at night, outdoor screen and lounge seating by the pool',
    },
    {
      key: 'one-more-song',
      short: 'Music',
      n: '06',
      title: 'One More Song',
      copy: 'The movie is over, but nobody wants to leave yet.',
      reel: 'tonight/one-more-song',
      still: 'bar/base',
      photo: img('bar', 2200, '16:9'),
      alt: 'A warm timber home bar late at night, low light, music playing',
    },
  ],
}

export const nights = tonight.experiences
export const nightCount = nights.length
/** "06" — the denominator, derived so it can never drift from the list. */
export const nightTotal = String(nights.length).padStart(2, '0')
