import { useGsapScope, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   SEAM — the join between two sections

   Every section on this site sits on a ground: black when the
   room is lit, paper when the page is printed. Until now those
   grounds met at a static hairline, which was the one moment in
   an otherwise continuously-moving page where nothing happened.

   A seam makes the join an event. Three layers, one scrubbed
   timeline, all anchored to the TOP EDGE of the arriving section
   and drawn upward into the section above it:

     CAST   the arriving ground's light or shadow, thrown onto
            the outgoing section BEFORE the ground itself gets
            there. Paper arriving over black spills warm cove
            light up the wall; black arriving under paper takes
            the page into shadow. This is what makes two
            sections feel like they are in the same physical
            space rather than merely adjacent in a document.

     SHEET  the arriving ground itself, a solid band that
            travels UP into the join — so its leading edge moves
            faster than the scroll and reads as one surface
            sliding over another rather than as a border
            scrolling past.

     LINE   a hairline riding that leading edge. It draws out
            from the centre, brightens as it lands, then settles
            to the resting hairline the join always had. On the
            four palette inversions a glint runs along it once —
            the same single pass of light the About hero opens
            with, so the two read as the same hand.

   ------------------------------------------------------------
   WHY THE WRAPPER CARRIES PADDING

   The sheet has to travel somewhere, and the only honest place
   is the gap between the two sections. Simply drawing it upward
   over the outgoing section would work, but it would then sit
   there permanently, eating most of that section's closing
   breath — the join would end up tight above and generous
   below, which reads as a mistake rather than as a transition.

   So the seam ADDS its own band of ground (`--seam-band`) above
   the section and travels through that. Before the transition
   the band shows the outgoing ground and the join sits at the
   bottom of it; after, the band has become the arriving ground
   and the join sits at the top. Either way both sections keep
   the padding they were designed with, and nothing inside them
   moves.

   That also keeps every section's ancestors untransformed, which
   matters: <Difference> holds a `position: sticky` column, and a
   transformed ancestor would drag it down the page.

   Wrapping rather than editing each section keeps the join in
   ONE place — the running order in About.jsx declares which
   ground it is leaving and which it is arriving on, and the
   sections themselves stay unaware.
   ============================================================ */

/* The monochrome ramp, as literal values. The sheet has to match
   its section's ground EXACTLY — a near miss is a visible band
   in the section's top padding — and both it and the band are
   set as inline styles, so the values are spelled out rather
   than looked up through a utility class. Keep in sync with
   @theme in index.css. */
const GROUND = {
  ink: '#000000',
  'ink-2': '#050505',
  'ink-3': '#0b0b0c',
  'ink-4': '#141416',
  paper: '#f4f2ee',
}

/* How far the leading edge travels. Generous enough that the
   edge visibly outruns the scroll (roughly 1.4x at reading
   speed), short enough that the band never reads as a gap while
   it is still showing the outgoing ground. */
const BAND = 'clamp(6rem, 12vh, 10rem)'

/* How far up the outgoing section the arriving light reaches.
   Long, because a cast that starts where the ground starts is
   just a second border. */
const CAST = 'clamp(14rem, 34vh, 26rem)'

const isLight = (tone) => tone === 'paper'

/* The cast: what the arriving ground does to the one above it.
   Always strongest at the join and gone well before the top, so
   it never dims a paragraph that is still being read — only the
   empty ground a section ends on. */
function castFor(from, to) {
  const lightArriving = isLight(to)
  const lightLeaving = isLight(from)

  /* Paper over black — the page is about to be printed, and the
     light it is printed under arrives first. */
  if (lightArriving && !lightLeaving)
    return 'linear-gradient(to top, rgba(255,240,214,0.20), rgba(201,173,124,0.085) 34%, rgba(201,173,124,0.02) 62%, transparent 82%)'

  /* Black under paper — lights down on the page. Steep: most of
     the sheet stays clean and the darkening is concentrated into
     a contact shadow at the join, which is both how a shadow
     actually falls and what keeps this from reading as a smudge
     across the bottom of the section. */
  if (!lightArriving && lightLeaving)
    return 'linear-gradient(to top, rgba(0,0,0,0.50), rgba(0,0,0,0.22) 14%, rgba(0,0,0,0.07) 34%, transparent 62%)'

  /* Paper on paper — one sheet laid over another, so the only
     cue is the shadow the upper sheet casts. */
  if (lightArriving && lightLeaving)
    return 'linear-gradient(to top, rgba(0,0,0,0.13), rgba(0,0,0,0.04) 32%, transparent 68%)'

  /* Black on black — a breath of cove light and nothing more.
     Six of the ten joins on this page are this one; anything
     louder here and the four real inversions stop reading as
     the chapter breaks they are. */
  return 'linear-gradient(to top, rgba(255,240,214,0.075), rgba(201,173,124,0.026) 38%, transparent 74%)'
}

/* The line reads against the ground it is CROSSING, not the one
   it belongs to — it spends the whole transition travelling over
   the outgoing section's territory, and comes to rest on it. */
function lineFor(from) {
  return isLight(from)
    ? { color: 'rgba(0,0,0,0.44)', rest: 0.32, glint: 'rgba(0,0,0,0.5)' }
    : { color: 'rgba(255,244,224,0.62)', rest: 0.26, glint: 'rgba(255,244,224,0.95)' }
}

export default function Seam({ from, to, children }) {
  const inversion = isLight(from) !== isLight(to)
  const line = lineFor(from)

  const root = useGsapScope((el) => {
    const cast = el.querySelector('[data-seam-cast]')
    const sheet = el.querySelector('[data-seam-sheet]')
    const rule = el.querySelector('[data-seam-line]')
    const glint = el.querySelector('[data-seam-glint]')

    /* The section on the OTHER side of this join. A seam is a
       handover, and a handover needs both hands: the ground
       arriving on its own is a detail you only notice once you
       have been told it is there.

       The previous sibling is another seam's wrapper, so the
       section itself is one level in. The exception is the very
       first join, whose previous sibling IS a section — the About
       hero, which already scrubs its own exit and does not want a
       second one on top. */
    const leaving = el.previousElementSibling?.querySelector(':scope > [data-seam-content]')

    /* Reduced motion keeps the DESIGN and drops the movement: the
       ground has already arrived, the hairline is already at rest. */
    if (prefersReducedMotion()) {
      gsap.set(cast, { autoAlpha: 1, yPercent: 0 })
      gsap.set(sheet, { y: 0, yPercent: 0 })
      gsap.set(rule, { autoAlpha: line.rest, scaleX: 1 })
      if (glint) gsap.set(glint, { autoAlpha: 0 })
      return
    }

    /* One timeline for the whole join, scrubbed. `start: 'top bottom'`
       is the moment the band's top edge reaches the bottom of the
       screen — by which point the cast, which lives entirely ABOVE
       that edge, is already in view. It ends with the join at half
       height, so it lands in the middle of the window and the reader
       watches it happen rather than catching it in the corner of
       their eye. The 0.55s catch-up is most of the difference
       between "linked to scroll" and "polished". */
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'top 50%',
        scrub: 0.55,
      },
    })

    /* THE DEPARTURE. The finished section lifts away and sinks back
       into its own ground while the new one arrives over it. This is
       the half of the transition the reader actually sees — by the
       time a join is on screen, both sides of it are mostly empty
       ground, and moving empty ground is invisible. Moving the
       CONTENT is not.

       It ends at 0.34 rather than 0, because a section that
       disappears completely reads as a bug the moment anyone scrolls
       back up. `y` stays smaller than the band so the section can
       never climb out of its own wrapper and paint over the join
       above it. */
    if (leaving) {
      /* The lift runs the whole range — it is only a difference in
         rate, and starting it late would read as a jolt. The FADE
         waits until the back quarter: when the join first appears at
         the bottom of the screen the outgoing section still has its
         last line on screen, and dimming text somebody may still be
         reading is the one way this gesture could actively annoy. */
      tl.fromTo(leaving, { y: 0 }, { y: -56 }, 0).fromTo(
        leaving,
        { autoAlpha: 1 },
        { autoAlpha: 0.34, duration: 0.74 },
        0.26,
      )
    }

    /* The cast rides the sheet, so this is only the extra lead — the
       light reaching a little further ahead than the ground does. */
    tl.fromTo(cast, { autoAlpha: 0, yPercent: 9 }, { autoAlpha: 1, yPercent: 0 }, 0)
      /* `y: 0` is not decoration. The sheet's inline style parks it
         with `translateY(100%)`, which the browser reports back as a
         RESOLVED PIXEL matrix — GSAP reads that as `y`, and a bare
         `yPercent` tween then stacks on top of it, so the sheet
         travels the right distance from twice the right place and
         its edge never reaches the join. Zeroing y in both states
         hands the whole transform to the tween.

         yPercent rather than height or scaleY: the leading edge
         carries a 1px hairline, and a scaled band would squash it. */
      .fromTo(sheet, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0 }, 0)
      /* An inversion is a chapter break and earns a bright edge. A
         same-palette join is a breath, and at full strength the
         hairline crossing black reads as loudly as the four moments
         the page is actually structured around. */
      .fromTo(
        rule,
        { autoAlpha: 0, scaleX: 0.14 },
        { autoAlpha: inversion ? 1 : 0.55, scaleX: 1, duration: 0.6 },
        0,
      )
      /* Brightest mid-travel, then quiet — so the join ends as the
         same hairline it has always been. */
      .to(rule, { autoAlpha: line.rest, duration: 0.4 }, 0.6)

    if (glint) {
      tl.fromTo(
        glint,
        { xPercent: -320, autoAlpha: 0 },
        { xPercent: 320, autoAlpha: 1, duration: 0.85 },
        0.1,
      )
    }
  }, [])

  return (
    <div
      ref={root}
      className="relative"
      /* The wrapper is painted in its OWN section's ground, not the
         one above — so that when the outgoing section lifts on its
         departure, the strip it uncovers at its foot is the ground
         it was already standing on. */
      style={{ paddingTop: BAND, background: GROUND[to] }}
    >
      {/* The band, before the new ground reaches it: still reading as
          the previous section running on, rather than as a gap. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: BAND, background: GROUND[from] }}
      />

      {/* Named, because the seam BELOW this one reaches back up for it
          to run the departure — and reaching for "the first child"
          would find the band. */}
      <div data-seam-content>{children}</div>

      {/* The sheet occupies the band exactly. Everything else in the
          seam is a CHILD of it, which is the whole trick: the cast
          and the hairline are carried by the same transform, so the
          light always sits directly on the leading edge instead of
          stopping short of it and leaving a bar of untouched ground
          between the two. */}
      <div
        data-seam-sheet
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 will-change-transform"
        style={{ height: BAND, background: GROUND[to], transform: 'translateY(100%)' }}
      >
        <div
          data-seam-cast
          className="absolute inset-x-0 bottom-full will-change-transform"
          style={{ height: CAST, background: castFor(from, to), opacity: 0 }}
        />

        {/* One pixel tall, and it clips — which is what lets the glint
            run the width of the edge without escaping it. */}
        <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
          <div
            data-seam-line
            className="absolute inset-0 origin-center"
            style={{ background: line.color, opacity: 0 }}
          />

          {inversion && (
            <div
              data-seam-glint
              className="absolute inset-y-0 left-1/3 w-1/3 will-change-transform"
              style={{
                background: `linear-gradient(90deg, transparent, ${line.glint}, transparent)`,
                opacity: 0,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
