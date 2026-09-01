/* ============================================================
   THE HAND, AS NUMBERS

   Separated from <SnapHand> because the scene needs the pivots
   and the closing angles without needing the component — and
   because these are not five arbitrary path strings. They are a
   set of measurements that only work together.

   A right hand in profile: wrist entering bottom-right, thumb
   reaching up-left, middle finger reaching left, the remaining
   fingers curled into the palm. Drawn OPEN. Closing it is two
   rotations, not two more paths, which is the whole reason the
   gesture can be scrubbed to any position the scroll asks for
   rather than stepping through rendered frames.

   ------------------------------------------------------------
   WHAT MAKES A PROFILE HAND READ AS A HAND

   Three things, all of which the first draft of this file got
   wrong, and all of which are cheap to get right once named:

   1. THE PALM IS NOT A CIRCLE. A round palm plus two lobes reads
      as a ring with bumps on it. The palm is a long form running
      diagonally from the knuckles down to the heel, about twice
      as long as it is deep.

   2. THE PALM AND THE WRIST ARE ONE OUTLINE. Drawn as two shapes
      they meet at a seam, and a hairline contour makes the seam
      the most visible line in the drawing — the forearm reads as
      a separate object lying behind a hand.

   3. THE DIGITS TAPER, AND THEY ARE LONG. A thumb is about as
      long as the palm is deep and roughly half as wide at the
      tip as at the base. Stubby, parallel-sided digits are the
      single fastest way to make a hand look like a mitten.

   ------------------------------------------------------------
   THE ANGLES ARE DERIVED, NOT EYEBALLED

   Each fingertip sits a fixed radius from its own pivot, so the
   rotations that bring both tips onto ONE point are the
   intersection of two circles rather than a matter of taste:

     thumb  tip (104,126), pivot (196,152) -> r 95.6 at  195.8deg
     finger tip (105,243), pivot (190,214) -> r 89.8 at  161.2deg

   Those two circles meet at (106,183). Rotating the thumb -35deg
   and the finger +39deg puts both tips there — and the readout
   in the scene counts 74 degrees down to zero, because 74 is
   35 + 39, the real angular gap between the two digits at rest.

   ------------------------------------------------------------
   TWO NUMBERS DO THE WORK, AND BOTH WERE WRONG TWICE

   THE PIVOT SEPARATION. The first version put them 23 units
   apart, at the top and bottom of one knuckle. Two nearly
   coincident pivots with tips at nearly the same radius share a
   closed ray, so both digits ended up lying ALONGSIDE each other
   pointing the same way — a beak, or tweezers closing. The tips
   touched and the arithmetic was right and it did not read as a
   snap for a moment. They are 62 apart now: thumb high on the
   palm, middle finger low.

   THE RADII. Separating the pivots is not enough on its own. Two
   digits of the SAME length from separated pivots still close
   into an overlapping stack, because each one is long enough to
   lie across the other. The middle finger is deliberately the
   shorter of the two — which is also what it does in life; it
   curls, it does not reach — and the difference is what leaves
   the two axes crossing at CONTACT at 39 degrees instead of
   running parallel. That angle is the difference between a hand
   closing on itself and two shapes arriving at one coordinate.

   IF YOU EDIT A PATH, RE-DERIVE ALL OF THIS TOGETHER. Nudging a
   fingertip and leaving the angles alone does not misplace the
   contact point slightly — it makes the two digits close PAST
   each other, and the flash then goes off somewhere the drawing
   is not.
   ============================================================ */

/* Palm, back of hand, heel and forearm as ONE outline, running
   off the bottom edge of the viewBox so the arm is cropped by
   the frame rather than ending in a rounded stump.

   THE BACK OF THE HAND IS THE FLAT SIDE. The first version drew
   the palm as an even oval, and an even oval with two digits on
   it reads as a balloon on a stick however good the digits are.
   A hand in profile is asymmetric: a nearly straight back edge
   from the knuckles down to the wrist, and all of the curvature
   on the palm side, bulging at the heel. Getting that one
   asymmetry right does more for the read than any amount of
   detail added elsewhere. */
export const MASS =
  'M 190 136 C 206 122, 236 114, 258 122 C 274 128, 282 144, 283 166 ' +
  'C 284 190, 281 212, 274 234 C 286 260, 299 288, 310 312 L 316 322 ' +
  'L 248 322 C 242 300, 232 272, 224 244 C 208 240, 194 232, 187 218 ' +
  'C 179 200, 179 166, 190 136 Z'

/* ------------------------------------------------------------
   BOTH DIGITS ARE OPEN PATHS, AND THAT IS THE WHOLE TRICK.

   Each one starts and ends ON the palm's outline: out along the
   top edge, around the tip, back along the underside, stop. No
   `Z`, and no segment closing across the palm.

   Closed, they render as two complete outlines lying on top of a
   third — so the contour draws the base of the thumb straight
   across the middle of the hand, and the drawing reads as a palm
   with two sticks in front of it rather than as a hand with two
   digits attached to it. Crossing lines are the single loudest
   error available in a hairline drawing, because every line in
   it carries the same weight.

   Open, the two trees each get what they need from ONE path
   string: `fill` implicitly closes a subpath, so the mass still
   unions cleanly with the palm, while `stroke` leaves the ends
   where they are and no line ever crosses the silhouette.

   Base ~26 wide at the palm and ~14 at the tip: the outbound and
   return edges are deliberately not parallel, and that
   difference IS the taper. Parallel-sided digits are the fastest
   way to turn a hand into a mitten.
   ------------------------------------------------------------ */
export const THUMB =
  'M 191 139 C 170 132, 138 121, 116 114 C 108 111, 100 116, 101 124 ' +
  'C 102 132, 110 135, 119 138 C 143 146, 173 158, 199 166'

/* The middle finger — the one that actually makes the sound.
   Longer and a little deeper than the thumb, reaching left. */
export const FINGER =
  'M 185 201 C 162 210, 132 224, 112 234 C 104 238, 100 246, 107 251 ' +
  'C 114 256, 124 252, 133 248 C 153 239, 176 231, 195 228'

/* The fingers that stay curled, as two creases across the front
   of the palm. Stroke only: they are folds INSIDE the
   silhouette, not part of its outline, so filling them would
   punch shapes out of the mass. They are most of what tells the
   eye it is looking at a hand from the side rather than at an
   abstract form. */
export const CURL_A = 'M 200 190 C 214 202, 232 210, 250 209'
export const CURL_B = 'M 203 210 C 216 222, 233 228, 250 226'

export const HAND = {
  /* Pivots in USER SPACE, because `svgOrigin` is the only way to
     put a rotation centre on a knuckle. `transform-origin`
     percentages resolve against the element's own bounding box,
     and a thumb's bounding box has its corner nowhere near the
     joint the thumb actually turns on. */
  thumbPivot: '196 152',
  fingerPivot: '190 214',

  /* Open is the drawn position — rotation 0 — so the paths above
     are what you see before anything moves, and there is only
     one set of numbers to keep true. */
  thumbClosed: -35,
  fingerClosed: 39,

  /* The strike. A real snap is not the two digits meeting — it
     is the middle finger sliding OFF the thumb and striking the
     palm, so the finger carries well past contact while the
     thumb springs back the other way. Without these two the
     gesture reads as a pinch, which is a completely different
     thing to watch. */
  fingerStrike: 56,
  thumbRecoil: -24,

  /** Where the tips meet. Everything in the scene is placed from
   *  here — see `measureContact` in Snap.jsx. */
  contact: [106, 183],

  /** The viewBox all of the above is measured in. */
  size: 320,
}
