/* ============================================================
   PRISM ICONS

   Nine marks: one per face, and one per readout axis.

   ------------------------------------------------------------
   AUTHORED, NOT IMPORTED, AND AT THE HOUSE STROKE

   `lucide-react` is already a dependency and is used all through
   the console and the chat widget, and it is the wrong source
   here. Lucide draws at stroke 2 with round caps and round joins;
   this site's own line work — see contact/components/icons.jsx —
   is stroke 1.25, SQUARE caps, MITER joins, on a 24 box. Those
   two sets do not sit on a page together: the round-capped one
   reads as a UI kit that arrived with a library, next to type
   that has been drawn.

   So this is the same convention, extended by nine glyphs. If a
   tenth is ever needed it goes here, at 1.25 and square, or the
   set stops being a set.

   ------------------------------------------------------------
   WHY THE SET IS LOCAL AND NOT SHARED WITH CONTACT

   The obvious move is to import contact/icons.jsx and add to it.
   That points a homepage section at a contact-page module and
   makes the contact page's icon list the place a future edit has
   to go to change a homepage glyph — a dependency running the
   wrong way for the sake of saving a `base` object. If a third
   section ever needs marks, the two sets get promoted together
   into one shared primitive; two is not yet a pattern.
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
  /* ---- The five faces ---- */

  /* WATCH — a film frame with its perforations, not a monitor.

     THE FACE MARK AND THE SCREEN AXIS MARK CANNOT BOTH BE A
     DISPLAY. They sit four inches apart on the same card, and two
     near-identical rectangles read as one asset used twice. The
     monitor is the more literal drawing of "screen", so the axis
     keeps it and the face takes the frame — which is also the
     better mark for WATCH, because the face is about cinema
     rather than about hardware.

     Drawn for 26px, which is the only size it is used at. The
     perforations are 1-unit ticks: at the 18px the axis marks use
     they would close up, and this glyph is never asked to. */
  watch: (
    <>
      <rect x="3.5" y="5" width="17" height="14" />
      <path d="M7.5 5v14M16.5 5v14" />
      <path d="M4.8 8h1.4M4.8 12h1.4M4.8 16h1.4M17.8 8h1.4M17.8 12h1.4M17.8 16h1.4" />
    </>
  ),
  play: (
    <>
      <path d="M6 9h12l2 8a2 2 0 0 1-3.6 1.4L15 16H9l-1.4 2.4A2 2 0 0 1 4 17z" />
      <path d="M9 12h2M10 11v2M15 12.5h.01M17.5 10.5h.01" />
    </>
  ),
  /* LISTEN — a driver and two wavefronts. Two rather than three:
     at 16px on screen the third arc closes up against the second
     and the glyph turns into a smudge. */
  listen: (
    <>
      <path d="M4 9.5h3l4-3.5v12l-4-3.5H4z" />
      <path d="M14.8 9.4a4 4 0 0 1 0 5.2" />
      <path d="M17.6 7a7.6 7.6 0 0 1 0 10" />
    </>
  ),
  /* HOST — two people, one behind. Not a sofa: the face is about
     who is in the room, and furniture is what every other glyph
     in the set is already made of. */
  host: (
    <>
      <circle cx="9.5" cy="8.5" r="3" />
      <path d="M3.5 19.5c.8-3 3-4.6 6-4.6s5.2 1.6 6 4.6" />
      <circle cx="17.5" cy="9.5" r="2.2" />
      <path d="M16.4 14.6c1.9.4 3.3 1.8 4.1 4.9" />
    </>
  ),
  escape: <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.8 6.8 0 0 0 20 13.5z" />,

  /* ---- The four axes ---- */

  light: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.4v2.2M12 18.4v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3.4 12h2.2M18.4 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </>
  ),
  /* SOUND — a level meter, which is the one drawing of sound that
     is not a speaker. The face marks already own the speaker. */
  sound: <path d="M4 10v4M8 6.5v11M12 4v16M16 7.5v9M20 10.5v3" />,
  /* SCREEN — a display on a stand, and nothing else in it.

     A version of this threw three short rays off the top to say
     "emitting". Drawn for a 24 box they measure about two device
     pixels at the 18px these axis marks are set at, which is not
     a ray, it is a speck — and three specks over a rectangle read
     as dirt on the screen rather than as light coming off it.
     Anything that has to survive 18px is drawn in whole units. */
  screen: (
    <>
      <rect x="3" y="6" width="18" height="11" />
      <path d="M9 20h6M12 17v3" />
    </>
  ),
  /* AMBIENCE — a table lamp over its own pool of light. A moon
     would have read for ESCAPE and against HOST, and this axis
     has to carry "Social" as readily as "Intimate". */
  ambience: (
    <>
      <path d="M8.5 11.5 12 4.5l3.5 7z" />
      <path d="M12 11.5v6" />
      <path d="M8 19.5h8" />
    </>
  ),
}

/**
 * `<PrismIcon name="watch" size={24} />`
 *
 * An unknown key renders nothing rather than throwing, so a data
 * typo costs a glyph and not the page — the same rule the reels
 * and plates in utils/media.js follow.
 */
export default function PrismIcon({ name, size = 22, className = '' }) {
  const glyph = GLYPHS[name]
  if (!glyph) return null
  return (
    <svg {...base} width={size} height={size} className={className}>
      {glyph}
    </svg>
  )
}
