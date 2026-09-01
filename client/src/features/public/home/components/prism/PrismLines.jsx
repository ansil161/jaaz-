import { FACES } from './prismGeometry'

/* ============================================================
   THE IMPLIED GEOMETRY

   Five hairlines, each running from one face to the edge of the
   room, and nothing else. No ring, no polygon, no guide through
   the middle.

   WHY THERE IS NO SHAPE HERE. Five points around a centre are one
   `<polyline>` away from being a pentagon, and a pentagon is an
   infographic — it says "here is a diagram of five things" where
   the composition is supposed to say "here is one room, and these
   are its faces". The faces are not related to each other. They
   are each related to the room, and five short marks pointing at
   it is the whole of what that means. The eye completes the
   figure on its own and completes it better than a drawn ring
   would, for the same reason <Possibilities> never draws the
   circle its environments travel.

   ------------------------------------------------------------
   `preserveAspectRatio="none"` PLUS `vector-effect`

   The viewBox is 0-100 in both axes over a box that is neither
   square nor a fixed ratio, so the coordinates in
   prismGeometry.js can stay in the field's own percentages and
   be read directly by CSS-positioned markers as well. Scaling
   non-uniformly would normally squash the stroke into a
   different weight on each axis; `vector-effect: non-scaling-
   stroke` renders it in device space instead, so every line in
   this section is one physical pixel at every window size and at
   every angle.

   ------------------------------------------------------------
   THE ACTIVE LINE IS THE ONLY ONE THAT MOVES

   Inactive lines sit at 8% white — present, findable if you look
   for them, invisible if you do not. The active one goes to the
   warm accent and draws itself in from the marker end. The
   `pathLength="1"` normalisation is what lets one dash rule cover
   five lines of five different lengths without measuring any of
   them.
   ============================================================ */

export default function PrismLines({ index, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`prism-lines pointer-events-none h-full w-full ${className}`}
    >
      {FACES.map((face, i) => (
        <line
          key={face.key}
          x1={face.x}
          y1={face.y}
          x2={face.link.x}
          y2={face.link.y}
          pathLength="1"
          vectorEffect="non-scaling-stroke"
          data-active={i === index || undefined}
        />
      ))}
    </svg>
  )
}
