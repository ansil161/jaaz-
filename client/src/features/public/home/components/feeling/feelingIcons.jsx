/* ============================================================
   FEELING ICONS

   Six marks, one per feeling, and every one of them is a ROOM
   PLAN.

   That is the whole idea and it is not decoration. This section
   answers "what do you want to feel?" with a kind of room, so the
   mark that stands for a feeling should be the room seen from
   above — the same view Chapter 04 draws its calibration on. A
   set of literal pictograms (a door for escape, a trophy for
   competition) would have been quicker and would have said
   nothing this site has not already said better.

   Drawn to the same specification as `prism/prismIcons.jsx`: a
   24-unit box, 1.25 stroke, square caps and mitred joins, no
   fills. The two sets deliberately do not share a `base` object —
   see the note in that file for why. A third set is the point at
   which both get promoted into one primitive.

   Every plan reads bottom-up: the screen or the source is at the
   top of the box, the listener is below it, which is how the
   plans in Chapter 04 are oriented and how anyone who has seen a
   seating layout expects to read one.

   An unknown key renders nothing rather than throwing, so a data
   typo costs a glyph and not the page.
   ============================================================ */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
  focusable: false,
}

const GLYPHS = {
  /* IMMERSION — the screen wall, two walls closing in on it, and
     two rows of seats inside them. The convergence is the point:
     this is the one room shaped around the picture rather than
     around the furniture. */
  immersion: (
    <>
      <path d="M5 4.5h14" />
      <path d="M3.5 20 6 4.5M20.5 20 18 4.5" />
      <path d="M8 12.5h8M6.5 17.5h11" />
    </>
  ),

  /* ESCAPE — one shut room, one screen, one chair. The box is
     closed on all four sides, which is the difference between
     this and every other plan in the set. */
  escape: (
    <>
      <rect x="5" y="3.5" width="14" height="17" />
      <path d="M8.5 7.5h7" />
      <rect x="10.25" y="14" width="3.5" height="3.5" />
    </>
  ),

  /* CONNECTION — a screen wall and one long sectional, in a room
     drawn with no back wall and no sides. The open plan is the
     absence, not a stroke. */
  connection: (
    <>
      <path d="M4 4.5h16" />
      <path d="M5.5 19.5v-7h13" />
    </>
  ),

  /* COMPETITION — the same wall, a chevron where the picture
     would be, and one row. The chevron is the only mark in the
     set that is not architecture: it is the frame arriving before
     the room can react to it. */
  competition: (
    <>
      <path d="M4 5h16" />
      <path d="m9 10.5 3 3 3-3" />
      <path d="M6.5 18h11" />
    </>
  ),

  /* CELEBRATION — a counter with its depth, and three stools. The
     only plan in the set with nobody facing a screen. */
  celebration: (
    <>
      <path d="M4 7.5v3.5h16V7.5" />
      <circle cx="8" cy="16.5" r="1.5" />
      <circle cx="12" cy="16.5" r="1.5" />
      <circle cx="16" cy="16.5" r="1.5" />
    </>
  ),

  /* LISTEN — a stereo pair, the triangle they make, and the one
     chair at its apex. No screen, which is the whole
     specification. */
  listen: (
    <>
      <rect x="4" y="5" width="3.5" height="5" />
      <rect x="16.5" y="5" width="3.5" height="5" />
      <path d="M5.75 10.5 12 17l6.25-6.5" />
      <rect x="10.25" y="17" width="3.5" height="3" />
    </>
  ),
}

export default function FeelingIcon({ name, size = 22, className = '' }) {
  const glyph = GLYPHS[name]
  if (!glyph) return null
  return (
    <svg {...base} width={size} height={size} className={className}>
      {glyph}
    </svg>
  )
}
