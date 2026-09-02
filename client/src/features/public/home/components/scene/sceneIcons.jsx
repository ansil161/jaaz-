/* ============================================================
   SCENE ICONS

   Five marks, one per channel the room reports: screen, sound,
   light, curtain, climate.

   ------------------------------------------------------------
   AUTHORED, NOT IMPORTED, AND AT THE HOUSE STROKE

   `lucide-react` is already a dependency and is used all through
   the console and the chat widget, and it is the wrong source
   here. Lucide draws at stroke 2 with round caps and round
   joins; this site's own line work — see contact/components/
   icons.jsx — is stroke 1.25, SQUARE caps, MITER joins, on a 24
   box. Those two sets do not sit on a page together: the
   round-capped one reads as a UI kit that arrived with a
   library, next to type that has been drawn.

   The concept document asks for exactly this and says so: "Use
   small monochrome line icons or typography. Avoid colorful
   emoji-style icons if the goal is a refined JAAZ aesthetic."

   Three of the five (screen, sound, light) are carried over from
   the icon set the previous section in this slot shipped, where
   they had already been drawn and sized against this same
   register. Curtain and climate are new and drawn to match.

   ------------------------------------------------------------
   EVERYTHING SURVIVES 18px

   These are set at 18 in the readout and nowhere else. Anything
   that has to survive 18px is drawn in WHOLE UNITS — a detail
   measuring under a unit on the 24 box lands on about two device
   pixels and reads as dirt on the glyph rather than as a line.
   That rule is why the screen has no emitted rays and the
   speaker has two wavefronts rather than three.

   ------------------------------------------------------------
   WHY THIS SET IS LOCAL

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
  /* SCREEN — a display on a stand, and nothing else in it. A
     version of this threw three short rays off the top to say
     "emitting"; see the whole-units note above for why they came
     off. */
  screen: (
    <>
      <rect x="3" y="6" width="18" height="11" />
      <path d="M9 20h6M12 17v3" />
    </>
  ),

  /* SOUND — a level meter, which is the one drawing of sound
     that is not a speaker. It sits two rows above the curtain
     and one below the screen, and a speaker cone at 18px next to
     a rectangle reads as two versions of the same object. */
  sound: <path d="M4 10v4M8 6.5v11M12 4v16M16 7.5v9M20 10.5v3" />,

  light: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.4v2.2M12 18.4v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3.4 12h2.2M18.4 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </>
  ),

  /* CURTAIN — a track with one drape gathered under it, drawn
     HALF-OPEN rather than open or closed.

     A closed drape at this size is a filled rectangle and an
     open one is an empty one, and either would read as the state
     rather than as the channel — the glyph would be arguing with
     the value beside it every time the value changed. Half-open
     is the only drawing of a curtain that is a noun. */
  curtain: (
    <>
      <path d="M3 5h18" />
      <path d="M6 5v14M6 19c2.4 0 3.6-2.3 3.6-7C9.6 8.4 8.6 6 6 5" />
      <path d="M18 5v14M18 19c-2.4 0-3.6-2.3-3.6-7C14.4 8.4 15.4 6 18 5" />
    </>
  ),

  /* CLIMATE — moving air, not a thermometer.

     A thermometer draws the MEASUREMENT and this row reports a
     setpoint the room is holding; two curves of air is the
     drawing of the thing actually happening. It is also the only
     glyph in the set with no straight line in it, which is what
     separates it from the level meter three rows above at a
     glance. */
  climate: (
    <>
      <path d="M3.5 8.5h11a3 3 0 1 0-3-3" />
      <path d="M3.5 12.5h14a3 3 0 1 1-3 3" />
      <path d="M3.5 16.5h6" />
    </>
  ),
}

/**
 * `<SceneIcon name="curtain" size={18} />`
 *
 * An unknown key renders nothing rather than throwing, so a data
 * typo costs a glyph and not the page — the same rule the reels
 * and plates in utils/media.js follow.
 */
export default function SceneIcon({ name, size = 18, className = '' }) {
  const glyph = GLYPHS[name]
  if (!glyph) return null
  return (
    <svg {...base} width={size} height={size} className={className}>
      {glyph}
    </svg>
  )
}
