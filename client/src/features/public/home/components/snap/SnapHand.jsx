import { MASS, THUMB, FINGER, CURL_A, CURL_B, HAND } from './handGeometry'

/* ============================================================
   THE HAND

   WHY THIS IS DRAWN AND NOT RENDERED

   The brief asks for a 120–180 frame gesture sequence, and that
   asset does not exist yet. The interesting part is that once
   you try to build the fallback, the fallback turns out to be
   the better artefact, and this is now the intended shape rather
   than a stand-in.

   A photoreal hand is the single riskiest object you can put on
   a luxury page. It is the one subject every viewer is an expert
   in, it dates instantly, and rendered slightly wrong it is
   repellent in a way no amount of grading rescues. It is also
   somebody else's visual language — the specific gesture this
   section is built on belongs, in most people's heads, to one
   film studio, and copying its rendering is how you end up with
   a homage instead of a signature.

   So the hand is DRAFTED. Hairline contours, no shading, the
   drawing language JAAZ already uses for rooms — and it does not
   fade in, it is DRAWN, stroke by stroke, out of nothing. That
   single decision is what makes the gesture the site's own:
   nobody else's snap arrives by being sketched into existence by
   the company that engineers the room it is about to change.

   It also happens to be free at every size, sharp on any
   display, scrubs to any framerate the scroll asks for, and
   costs about four kilobytes against forty megabytes of frames.

   ------------------------------------------------------------
   HOW IT MOVES, AND WHY THE FILL AND THE LINE ARE SEPARATE TREES

   Two parallel trees hold the same four shapes: `[data-hand-fill]`
   (solid, flattened) and `[data-hand-line]` (stroked, hollow).
   That duplication is load-bearing.

   A hand assembled from overlapping parts CANNOT be filled at an
   alpha per part — the overlaps double and every joint shows as
   a bright seam. SVG group opacity flattens its children FIRST
   and applies opacity to the result, so one `opacity` on the
   wrapper renders the union at a single weight and the joints
   disappear. That only works if every filled part is inside that
   one group, which is why the fill tree exists whole.

   The stroke tree exists whole for the opposite reason: DrawSVG
   animates stroke dash geometry, so the contour has to be real
   stroked paths, and hollow ones — a filled path with a stroke
   would draw its outline over its own fill and the "drafting"
   read is gone.

   The digits then have to rotate in both trees at once, so
   `data-thumb` and `data-finger` are each present TWICE and the
   parent tweens them as one selector. Two elements, one tween,
   one transform: they cannot drift apart.

   THE PIVOTS ARE IN USER SPACE, NOT CSS. `svgOrigin` takes
   viewBox coordinates, which is the only way to put a rotation
   centre at a knuckle. `transform-origin` percentages resolve
   against the element's own bounding box, and a thumb's bounding
   box has its corner nowhere near the joint the thumb actually
   turns on.
   ============================================================ */

export default function SnapHand({ className = '' }) {
  return (
    <svg
      data-hand
      viewBox={`0 0 ${HAND.size} ${HAND.size}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* Warm at the fingertips, falling to nothing at the wrist —
            the light in this scene comes from the gesture, so the
            hand is brightest where it is about to make it. */}
        <linearGradient id="snap-hand-line" x1="0.1" y1="0.3" x2="0.95" y2="1">
          <stop offset="0%" stopColor="#fff4e2" />
          <stop offset="45%" stopColor="#c9ad7c" />
          <stop offset="100%" stopColor="#c9ad7c" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* ---- The mass, and it is INK rather than champagne.

              Filled in the contour's own warm colour, the hand
              renders as a pale translucent decal lying on the
              photograph — the milkiness flattens the drawing and
              the contour stops being the brightest thing in it,
              which is the entire point of drafting it. Filled
              near-black, the hand OCCLUDES the room behind it, the
              way a hand in front of a room actually does, and the
              champagne line then reads as light catching its edge.
              Same two trees, same geometry; one colour is an
              object and the other is a sticker.

              One opacity on the wrapper, so the three overlapping
              shapes render as a single silhouette rather than as
              three bright joints. ---- */}
      <g data-hand-fill fill="#04060a" opacity="0">
        <path d={MASS} />
        <g data-thumb>
          <path d={THUMB} />
        </g>
        <g data-finger>
          <path d={FINGER} />
        </g>
      </g>

      {/* ---- The contour. This is what DrawSVG writes on. ---- */}
      <g
        data-hand-line
        fill="none"
        stroke="url(#snap-hand-line)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <path data-draw d={MASS} />
        <path data-draw d={CURL_A} strokeWidth="1" opacity="0.7" />
        <path data-draw d={CURL_B} strokeWidth="1" opacity="0.7" />
        <g data-thumb>
          <path data-draw d={THUMB} />
        </g>
        <g data-finger>
          <path data-draw d={FINGER} />
        </g>
      </g>

      {/* The point the two tips meet on. It is never painted — the
          scene MEASURES it against the stage on every refresh to
          place the flash, the mote emitter and the origin of the
          radial wipe. Deriving those from one invisible node is
          what keeps them agreeing with the drawing at every
          breakpoint; three hand-tuned percentages would not. */}
      <circle data-contact cx={HAND.contact[0]} cy={HAND.contact[1]} r="1" fill="none" />
    </svg>
  )
}
