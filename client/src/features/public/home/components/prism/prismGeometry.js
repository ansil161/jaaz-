import { prismModeCount } from '@/features/public/data/prism'

/* ============================================================
   PRISM GEOMETRY

   Where the five faces sit around the room, written once, in one
   coordinate system, and read by three components that would
   otherwise each invent their own percentages and drift apart.

   ------------------------------------------------------------
   THE COORDINATE SYSTEM IS THE FIELD, NOT THE SECTION

   Every number below is a percentage of the FIELD — the box
   `<Prism>` insets from the pinned stage, clear of the nav above
   and the index rail below. Not of the viewport, and not of the
   section.

   That matters because the field is the only box whose height is
   stable across the two things that change it: the site header
   (a solid bar on the homepage, which a stage pinned at `top: 0`
   otherwise slides its own top edge underneath) and the index
   rail plus the floating chat widget at the foot. Measure from
   the viewport and every marker moves when either of those is
   adjusted; measure from the field and none of them do.

   ------------------------------------------------------------
   THE COMPOSITION IS ASYMMETRIC ON PURPOSE

   Five points around a centre wants to be a pentagon, and a
   pentagon is an infographic. So:

     - WATCH sits LEFT of the room's centre line, not on it.
     - PLAY and LISTEN are both to the right and at DIFFERENT
       distances from the frame (72.5 and 73.5), so the right
       side does not read as a column.
     - HOST is the only face on the left, and it is low, which is
       what stops the arrangement from having a mirror line.
     - ESCAPE is below and slightly left of centre.

   Nothing here is on a circle, nothing is evenly spaced, and no
   two faces share an axis. If a later edit makes two of these
   numbers agree, the pentagon comes back.

   ------------------------------------------------------------
   THE LINKS ARE STUBS, NOT A DIAGRAM

   `link` is where the face's hairline ENDS — a point on the
   frame's own edge. The lines are 30-60px long and they are
   never joined to each other. The geometry has to be implied by
   five short marks pointing at one object, not drawn as a ring
   around it: a closed polygon connecting the faces would be the
   pentagon this composition is built to avoid, and it would also
   be a lie, because the faces are not related to each other.
   They are each related to the room.
   ============================================================ */

/** The room's aperture, as a box in field percentages. */
export const FRAME = { l: 29, r: 71, t: 9, b: 88 }

/**
 * The five faces.
 *
 * `x`,`y`   the node — the small marker, and where its hairline
 *           starts. The label block is centred on it vertically.
 * `side`    which way the label reads away from the node:
 *           'right' puts the type to the right of the marker,
 *           'left' right-aligns it so it ends at the marker.
 *           Always pointing AWAY from the room, so no label ever
 *           has to cross the photograph to be read.
 * `flow`    'stack' sets the number over the word; 'row' sets
 *           them side by side. NOT a style choice — see below.
 * `link`    where the hairline lands on the frame.
 * `arc`     the mobile position, as a percentage of the shallow
 *           band above the image. Desktop coordinates are useless
 *           there — see <PrismFacets>.
 *
 * ------------------------------------------------------------
 * THE THREE SIDE FACES ARE PLACED AGAINST THE COLUMNS, NOT JUST
 * AGAINST THE ROOM
 *
 * A face's label is roughly 5% of the field wide, and PLAY,
 * LISTEN and HOST all read outward — so their type ends up in the
 * strip between the photograph and a text column, and the number
 * that matters is the clearance on the FAR side. Measured on a
 * 1360px window, the first pass left LISTEN eleven pixels from
 * the reading panel and HOST eleven from the claim, which is not
 * a gutter, it is two blocks that look joined. Each of the three
 * is set so both of its gaps are near 2.5% of the field —
 * about 30px — and the frame is 29-71 rather than 31-69 so the
 * photograph gets the width that buys.
 *
 * ------------------------------------------------------------
 * WHY THE TOP AND BOTTOM FACES READ ACROSS
 *
 * Every coordinate here is a percentage, and every label is a
 * fixed number of pixels tall. Those two facts fight on a short
 * window: on a maximised 1366x768 laptop the field is about
 * 340px, so a stacked 34px label is a TENTH of the height it is
 * being placed in, and WATCH and ESCAPE — the only two faces
 * whose clearance is vertical — end up sitting on the
 * photograph's edge. On a tall window the same label is a
 * twentieth of the field and the composition looks exactly as
 * drawn, which is why this is the kind of break that ships.
 *
 * So the two faces with vertical clearance set their number and
 * word ACROSS, at half the height, and the three with horizontal
 * clearance keep the stack. It is also simply the better
 * composition: a label reads along the edge it belongs to.
 */
export const FACES = [
  {
    key: 'watch',
    x: 38.0,
    y: 3.5,
    side: 'right',
    flow: 'row',
    link: { x: 38.0, y: 9.0 },
    arc: { x: 8, y: 66 },
  },
  {
    key: 'play',
    x: 72.5,
    y: 21.0,
    side: 'right',
    flow: 'stack',
    link: { x: 71.0, y: 14.0 },
    arc: { x: 29.5, y: 26 },
  },
  {
    key: 'listen',
    x: 73.5,
    y: 58.0,
    side: 'right',
    flow: 'stack',
    link: { x: 71.0, y: 58.0 },
    arc: { x: 50, y: 8 },
  },
  {
    key: 'host',
    x: 26.5,
    y: 69.0,
    side: 'left',
    flow: 'stack',
    link: { x: 29.0, y: 73.0 },
    arc: { x: 70.5, y: 26 },
  },
  {
    key: 'escape',
    x: 48.0,
    y: 95.0,
    side: 'right',
    flow: 'row',
    link: { x: 48.0, y: 88.0 },
    arc: { x: 92, y: 66 },
  },
]

/* ------------------------------------------------------------
   THE PIN, AS POSITIONS

   The whole interaction is five discrete faces along one scrub,
   so there are exactly three numbers and they are all here.

   LEAD and TAIL are dead air at the two ends of the pin. They
   are not padding: `at()` is used to SCROLL to a face when one is
   clicked, and without them WATCH would resolve to the exact
   pixel the pin starts at and ESCAPE to the pixel it releases at.
   Landing a smooth scroll on either edge lands it on the frame
   where the pin engages or lets go, which reads as the section
   flinching at the end of its own animation. Six percent of the
   pin at each end is roughly a fifth of a viewport of room.
   ------------------------------------------------------------ */
const LEAD = 0.06
const SPAN = 0.88

/** Where face `i` is centred along the pin, 0-1. */
export const at = (i) => LEAD + (SPAN * i) / (prismModeCount - 1)

/** The pin's progress, remapped so 0-1 spans the five faces. */
export const faceProgress = (p) => Math.min(1, Math.max(0, (p - LEAD) / SPAN))

/**
 * Which face a pin progress lands on.
 *
 * ROUND, NOT FLOOR, and the two are not interchangeable. Floor
 * divides the pin into five slices and a face becomes active as
 * you ENTER its slice — which puts the index marker a tenth of
 * the rail ahead of the label it has just activated, so the dot
 * is visibly never on the word it is pointing at. Round makes the
 * change happen at the midpoint between two labels, which is
 * exactly where the travelling marker crosses, and the rail then
 * reads as one instrument instead of two out-of-phase ones.
 */
export const faceAt = (p) => Math.round(faceProgress(p) * (prismModeCount - 1))

/**
 * The index marker's position along its rail, 0-1.
 *
 * The rail has five equal cells, so their centres are at 10%,
 * 30%, 50%, 70% and 90%. Mapping face progress into 0.1-0.9 puts
 * the marker exactly under a label at every face and lets it
 * travel between them in step with the scroll.
 */
export const markerAt = (p) => 0.1 + faceProgress(p) * 0.8

/**
 * The aperture, as an eight-point polygon.
 *
 * Written once and consumed twice — as a `clip-path` on the
 * photograph, and as the `points` of the hairline that outlines
 * it. Both have to be generated from the same four numbers or
 * the outline drifts off the picture the moment a chamfer
 * animates, and it drifts by a couple of pixels, which is the
 * amount nobody sees in review and everybody sees on the page.
 */
export const facetPoints = ({ tl, tr, br, bl }) =>
  [
    [tl, 0],
    [100 - tr, 0],
    [100, tr],
    [100, 100 - br],
    [100 - br, 100],
    [bl, 100],
    [0, 100 - bl],
    [0, tl],
  ].map(([x, y]) => [x, y])

/** `clip-path: polygon(...)` for a set of chamfers. */
export const facetClip = (facet) =>
  `polygon(${facetPoints(facet)
    .map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`)
    .join(', ')})`

/** The same polygon as an SVG `points` attribute, in a 0-100 box. */
export const facetSvg = (facet) =>
  facetPoints(facet)
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
