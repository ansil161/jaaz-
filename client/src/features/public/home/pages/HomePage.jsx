import Hero from '@/features/public/home/components/Hero'
/* Aliased. The component's file is Promise.jsx and the section is
   still "The Promise" in the data; binding that name at module
   scope here would shadow the global `Promise` for the whole
   file, which is a trap waiting for the first `await` anyone
   adds. */
import Philosophy from '@/features/public/home/components/Promise'
import Possibilities from '@/features/public/home/components/Possibilities'
import LightsDown from '@/features/public/home/components/LightsDown'
import Spaces from '@/features/public/home/components/Spaces'
import Snap from '@/features/public/home/components/Snap'
import Prism from '@/features/public/home/components/prism/Prism'
import Calibration from '@/features/public/home/components/Calibration'
import Engineering from '@/features/public/home/components/Engineering'
import Transform from '@/features/public/home/components/Transform'
import Comfort from '@/features/public/home/components/Comfort'
import Feeling from '@/features/public/home/components/Feeling'
import Brand from '@/features/public/home/components/Brand'
import Testimonials from '@/features/public/home/components/Testimonials'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   HOME

   Sixteen slots, in this order, and the order IS the argument.
   Reordering them is a content decision, not a layout one.

      01  HERO                 The room awakens
      02  THE PHILOSOPHY       Entertainment without comfort
                               is just noise
      03  POSSIBILITIES        Imagine the space
      04  LIGHTS DOWN          — breath —
      05  SPACES               What we bring alive
      06  THE SNAP        ★    One room. Different worlds.
      07  THE PRISM            What's tonight?
      08  CALIBRATION          Measured, not eyeballed
      09  THE JAAZ COMFORT     Six engineering pillars
          SYSTEM
      10  EMPTY ROOM TO        Drag it yourself
          SHOWTIME
      11  COMFORT              Stay longer
      12  FEELING              What do you want to feel?
      13  WHY JAAZ             One team, one vision
      14  CLIENT STORIES       In their rooms
      15  FINAL CTA            Let's build a room worth staying in
      16  FOOTER

   The shape of it: FEEL (01) · BELIEVE (02-03) · SEE (04-07) ·
   TRUST THE ENGINEERING (08-10) · WANT IT (11-12) · TRUST THE
   FIRM (13-14) · ASK (15).

   ------------------------------------------------------------
   FOUR THINGS THE ORDER ENCODES

   1. THE ASK COMES LAST, AND ONLY ONCE. Slots 01-14 ask for
      nothing. The hero's button is there for the small number of
      people who have already decided, and slot 15 — which lives
      inside <Footer> — is the page's one real invitation. A page
      that asks on every screen is a page that has not earned an
      answer on any of them.

   2. NO MORE THAN TWO TYPOGRAPHIC SECTIONS IN A ROW. Every third
      slot breaks the column: <LightsDown>, <Snap> and <Transform>
      are full-bleed frames, <Spaces> and <Prism> carry
      photographs, and <Calibration> is the one thing on this page
      that is not black at all — it is printed on paper, edge to
      edge. A page this long that reads as one continuous column
      of set type is a page nobody reaches the end of.

   3. PROOF IS SANDWICHED BETWEEN DESIRE. 08-10 are the hardest,
      most technical run on the site, and they sit where they can
      afford to be: after four slots of showing what a room feels
      like, and before two that turn the proof back into wanting
      one. Leading with the measurement would be a spec sheet;
      ending with it would be a page that stops at the argument.

   4. THE TWO TRUST SECTIONS ARE AT THE END, NOT THE START. <Brand>
      — "one team, one vision" and the three verified numbers —
      used to open the page at slot 02. It is worth far more here:
      a visitor who has just read a per-seat calibration and six
      engineering pillars has a reason to care who did it. A
      visitor on their second screen does not.

   ------------------------------------------------------------
   WHAT IS NOT ON THIS PAGE, AND WHY

   <Craft> — the five build stages — came off at slot 10, which
   is now <Transform> alone. The component and its `craft` block
   in data/site.js both still exist; putting it back is one import
   and one tag.

   <FirstPause>, <Journal> and <Technology> are likewise built,
   unlinked and intact.
   ============================================================ */

export default function Home() {
  return (
    <>
      {/* 01 · FEEL. The only slot that asks for anything. */}
      <Hero />

      {/* 02 · THE PHILOSOPHY. Reinstated at ansil's request as the
          page's second beat. It is the thesis — comfort is the
          product, not the equipment list — made as a five-act
          typographic pin rather than as a paragraph, because the
          line is meant to be heard one beat at a time. It had been
          removed; the structure asked for it back, and this is the
          slot it was always written for. */}
      <Philosophy />

      {/* 03 · WHAT IT COULD BE — placed before the rest of the
          claims, not after. This slot used to hold a portfolio
          rail; it holds a proposal instead, because JAAZ does not
          yet have its own photography and a portfolio built out of
          stock interiors is a portfolio that is lying at the exact
          point where a visitor is deciding whether to trust the
          claim above it. Everything in it is disclosed as
          conceptual / reference material. */}
      <Possibilities />

      {/* 04 · — breath — */}
      <LightsDown />

      {/* 05 · WHAT WE BUILD */}
      <Spaces />

      {/* 06 · THE SNAP ★ — the page's one filmed moment, and the
          only section that shows a room CHANGE rather than
          describing one.

          It has been here before and it failed: the first build
          ran 3.4 viewports of pin and put the change in the last
          40% of it, so it was replaced by <Prism>, twice. The
          correction is in two numbers rather than in a comment —
          the pin is 1.9 viewports and the snap lands at 0.44 of
          it. See Snap.jsx.

          It renders correctly with no footage on disk, grading its
          own still, and swaps to the frame sequence the moment one
          lands in the manifest. */}
      <Snap />

      {/* 07 · WHAT IT IS FOR — the rooms and the change, then the
          choosing. Placed immediately after <Snap> because the two
          are one argument in two halves: the Snap shows that the
          room becomes something else, the Prism lets you pick
          which. It is the page's only section the visitor drives
          rather than scrolls past.

          It answered to `#snap` through three rewrites and gives
          the name back here, because <Snap> exists again directly
          above it and two sections cannot share an address. */}
      <Prism />

      {/* 08 · PROOF — the one section that argues rather than
          shows. It sits here, after the rooms and before the
          engineering, because it is the hinge between them:
          everything above is what a JAAZ room feels like,
          everything below is how one is built.

          It is also the page's only LIGHT section — full-bleed
          paper, hard edges top and bottom — which keeps the
          two-typographic-sections-in-a-row rule intact across the
          join without a photograph, and it hands over BOTH
          layouts at once rather than hiding one behind a
          control. */}
      <Calibration />

      {/* 09 · PROOF, WIDENED — Calibration proves ONE discipline
          with a real measurement; this names all six pillars and
          shows that each one decides the next. It goes after, not
          before, because "here is how far we take one of these"
          earns the right to say "and there are six" far better
          than the reverse. */}
      <Engineering />

      {/* 10 · FROM EMPTY ROOM TO SHOWTIME. The transformation, and
          the visitor drags it themselves — the seam between the
          bare civil shell and the finished room. It is the last
          thing on the page the visitor operates. */}
      <Transform />

      {/* 11-12 · DESIRE — the two sections that turn proof back
          into a reason to want the room.

          <Comfort> is the page's slow beat, and deliberately has
          nothing to operate: it follows three sections in a row
          that hand the visitor a control (<Prism>'s stack,
          <Calibration>'s chair, <Transform>'s seam) and precedes a
          fourth, so a page that never stops offering interactions
          would start reading as a demo reel. This one is looked
          at.

          <Feeling> is the only section on the page that starts
          from the VISITOR rather than from the room, and it is
          worth the most here — after the whole argument, with
          someone ready to put themselves inside one of these
          rooms. It still asks for nothing. */}
      <Comfort />
      <Feeling />

      {/* 13-14 · TRUST. Who did it, then what the people they did
          it for say about it — in that order, because a quote from
          a stranger means more once you know whose work it is
          praising. */}
      <Brand />
      <Testimonials />

      {/* 15-16 · THE ASK, and the directory. Both live inside
          <Footer>: the closing CTA panel is slot 15 and opens
          every page on the site, so it is authored once there
          rather than duplicated here. */}
      <Footer />
    </>
  )
}
