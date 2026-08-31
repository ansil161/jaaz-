/* ============================================================
   TONIGHT — the six marks

   One minimal line drawing per night, sitting in the rail at the
   foot of the section.

   DRAWN HERE RATHER THAN INSTALLED
   `lucide-react` is in package.json and unused, and it stays
   unused: its icons are 2px strokes with ROUND caps and joins,
   and every drawn mark on this site — the arrows in ClosingCta
   and DetailRelated, the ticks and crosses in DetailFit — is a
   1.25px stroke with SQUARE caps. Six round-capped icons in a
   rail of square-capped ones is the kind of mismatch that reads
   as "component library" rather than as one hand, which is the
   single thing this design cannot afford.

   They are also deliberately literal. A rail of six abstract
   glyphs would need labels to be legible, and it HAS labels —
   so the mark's only job is to be recognised in peripheral
   vision before the word is read. A screen, a controller, a
   ball, three people, a moon, a note.

   `aria-hidden` on every one: the cell's text label is the
   accessible name, and a decorative mark announced beside it is
   noise.
   ============================================================ */

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': 'true',
  focusable: 'false',
}

/** 01 — a screen, and the picture running on it. */
function Screen() {
  return (
    <svg {...base}>
      <rect x="2.5" y="4.5" width="19" height="13" />
      <path d="M10.5 8.5l4.5 2.5-4.5 2.5z" />
      <path d="M8 20.5h8" />
    </svg>
  )
}

/** 02 — a controller. */
function Controller() {
  return (
    <svg {...base}>
      <path d="M7.5 8.5h9a4.5 4.5 0 0 1 4.5 4.5v1.5a3 3 0 0 1-5.4 1.8L14.5 15h-5l-1.1 1.3A3 3 0 0 1 3 14.5V13a4.5 4.5 0 0 1 4.5-4.5z" />
      <path d="M7 11v2.5M5.75 12.25h2.5" />
      <path d="M16 11.5h.01M18 13.5h.01" />
    </svg>
  )
}

/** 03 — a ball. */
function Ball() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 6.5l3.5 2.6-1.35 4.15h-4.3L8.5 9.1z" />
      <path d="M12 3.5v3M5 9.5l3.5-.4M19 9.5l-3.5-.4M9.85 13.25L8 16.5M14.15 13.25L16 16.5" />
    </svg>
  )
}

/** 04 — three people. */
function People() {
  return (
    <svg {...base}>
      <circle cx="8" cy="8.5" r="2.75" />
      <circle cx="16.5" cy="9.5" r="2.25" />
      <path d="M2.5 19.5v-1.75A4.25 4.25 0 0 1 6.75 13.5h2.5a4.25 4.25 0 0 1 4.25 4.25v1.75" />
      <path d="M15 13.75h1.75a4.75 4.75 0 0 1 4.75 4.75v1" />
    </svg>
  )
}

/** 05 — night, outside. */
function Night() {
  return (
    <svg {...base}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />
      <path d="M16.5 3.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  )
}

/** 06 — one more song. */
function Note() {
  return (
    <svg {...base}>
      <path d="M9.5 17.5V6l10-2v11.5" />
      <ellipse cx="7" cy="17.5" rx="2.5" ry="2" />
      <ellipse cx="17" cy="15.5" rx="2.5" ry="2" />
      <path d="M9.5 9.5l10-2" />
    </svg>
  )
}

const MARKS = {
  'movie-marathon': Screen,
  'boss-fight': Controller,
  'match-day': Ball,
  'family-takeover': People,
  'party-after-dark': Night,
  'one-more-song': Note,
}

export default function NightMark({ name }) {
  const Mark = MARKS[name]
  return Mark ? <Mark /> : null
}
