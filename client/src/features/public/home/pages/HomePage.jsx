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
import Transform from '@/features/public/home/components/Transform'
import Comfort from '@/features/public/home/components/Comfort'
import Feeling from '@/features/public/home/components/Feeling'
import Brand from '@/features/public/home/components/Brand'
import Testimonials from '@/features/public/home/components/Testimonials'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   HOME

   Fifteen slots, in this order, and the order IS the argument.
   Reordering them is a content decision, not a layout one.

      01  HERO                 The room awakens
      02  THE PHILOSOPHY       Entertainment without comfort
                               is just noise
      03  POSSIBILITIES        Imagine the space
      04  LIGHTS DOWN          — breath —
      05  SPACES               What we bring alive
      06  THE SNAP        ★    One room. Different worlds.
      07  THE PRISM            What's tonight?
      08  CALIBRATION     ★    The room engineers itself
      09  EMPTY ROOM TO        Drag it yourself
          SHOWTIME
      10  COMFORT              Stay longer
      11  FEELING              What do you want to feel?
      12  WHY JAAZ             One team, one vision
      13  CLIENT STORIES       In their rooms
      14  FINAL CTA            Let's build a room worth staying in
      15  FOOTER

   The shape of it: FEEL (01) · BELIEVE (02-03) · SEE (04-07) ·
   TRUST THE ENGINEERING (08-09) · WANT IT (10-11) · TRUST THE
   FIRM (12-13) · ASK (14).

   ------------------------------------------------------------
   FOUR THINGS THE ORDER ENCODES

   1. THE ASK COMES LAST, AND ONLY ONCE. Slots 01-13 ask for
      nothing. The hero's button is there for the small number of
      people who have already decided, and slot 14 — which lives
      inside <Footer> — is the page's one real invitation. A page
      that asks on every screen is a page that has not earned an
      answer on any of them.

   2. NO MORE THAN TWO TYPOGRAPHIC SECTIONS IN A ROW. Every third
      slot breaks the column: <LightsDown> and <Transform> are
      full-bleed frames, <Spaces> and <Prism> carry photographs,
      and <Snap> and <Calibration> break it hardest of all by not
      being black — both are printed on paper, edge to edge. A
      page this long that reads as one continuous column of set
      type is a page nobody reaches the end of.

      THE LIGHT/DARK RHYTHM IS NOT YET DESIGNED, AND SOMEONE HAS
      TO DECIDE IT. Slots 06 and 08 are paper with a dark slot
      between them, which reads as deliberate today because there
      are only two of them. ansil has ruled the near-black
      cinematic register out for every NEW section, so the count
      only goes up — and at four or five the page starts
      alternating in a way nobody planned. Decide the target
      rhythm before the next section is rebuilt, not after.

   3. PROOF IS SANDWICHED BETWEEN DESIRE. 08-09 are the hardest,
      most technical run on the site, and they sit where they can
      afford to be: after four slots of showing what a room feels
      like, and before two that turn the proof back into wanting
      one. Leading with the measurement would be a spec sheet;
      ending with it would be a page that stops at the argument.

      THE RUN IS NOW TWO SLOTS, NOT THREE. <Engineering> came off
      at ansil's request (2026-09-02) and it was the WIDENING half
      of the proof — Calibration takes one discipline all the way
      down, and Engineering was what said "and there are six of
      these, each deciding the next". What is left is one
      discipline proved and one room transformed, which is a
      narrower claim than the page used to make. If the six
      pillars are wanted back anywhere, this is the seam they came
      out of.

   4. THE TWO TRUST SECTIONS ARE AT THE END, NOT THE START. <Brand>
      — "one team, one vision" and the three verified numbers —
      used to open the page at slot 02. It is worth far more here:
      a visitor who has just read a per-seat calibration and
      dragged a room from bare shell to finished has a reason to
      care who did it. A visitor on their second screen does
      not.

   ------------------------------------------------------------
   WHAT IS NOT ON THIS PAGE, AND WHY

   <Craft> — the five build stages — came off at slot 10, which
   is now <Transform> alone. The component and its `craft` block
   in data/site.js both still exist; putting it back is one import
   and one tag.

   <Engineering> — "The JAAZ Approach", the six pillars — came
   off at slot 09 on 2026-09-02 at ansil's request. The component
   and the `engineering` block in data/site.js both still exist
   and /chapters.html still renders it, so putting it back is one
   import and one tag.

   <FirstPause>, <Craft>, <Journal> and <Technology> are likewise
   built, unlinked and intact.
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

      {/* 06 · THE SNAP ★ — one room, shown as four, all at once.

          IT IS NOT A FILM, AND IT HAS BEEN BUILT AS ONE TWICE.
          The first version ran 3.4 viewports of pinned scroll and
          put the pay-off in the last 40% of it, so it was
          replaced by <Prism>. The second was a scrubbed frame
          sequence with a blowout at contact, and ansil ruled the
          whole register out before it shipped — no pinned or
          scroll-jacked sections, no near-black screens, no
          film-style motion, no display-serif drama filling a
          screen. Neither of those builds survives in Snap.jsx.

          What ships is printed on paper and simply shows the four
          states of the room as an editorial spread. Nothing to
          operate, for the same reason <Calibration> shows both
          layouts side by side: a comparison you have to work is a
          comparison you have to remember. That is also what keeps
          it distinct from <Prism> directly below, which IS the
          chooser and earns its interaction.

          THE FOUR PHOTOGRAPHS DO NOT EXIST YET. The verified pool
          has no four frames of one room, and four different rooms
          under a heading that says "one room" would make the
          section lie — so it runs interim plates with a
          disclosure line under them until the renders land. */}
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

      {/* 08 · PROOF ★ — the one section that argues rather than
          shows, and the only one the visitor watches HAPPEN. It
          sits here, after the rooms and before the transformation,
          because it is the hinge between them: everything above is
          what a JAAZ room feels like, everything below is how one
          is built.

          Rebuilt 2026-09-02 as a pinned instrument. The statement
          lands in the dark, the dark is lifted off a sheet of
          engineering paper, and one scrubbed master timeline then
          runs the work — scan, detect, expose, correct, compare,
          verify — before handing the room over to be interrogated
          chair by chair. It is the page's longest slot by scroll
          (a 440% pin) and its only light one, and it earns both:
          this is where the site stops asserting and starts
          proving.

          Two things it owns that nothing else on this page does,
          so neither should be copied without a reason of its own:
          a PIN with a scrub, and a full-bleed light ground. The
          tonal break is what keeps the two-typographic-sections-
          in-a-row rule intact across the join without a
          photograph. */}
      <Calibration />

      {/* 09 · FROM EMPTY ROOM TO SHOWTIME. The transformation, and
          the visitor drags it themselves — the seam between the
          bare civil shell and the finished room. It is the last
          thing on the page the visitor operates. */}
      <Transform />

      {/* 10-11 · DESIRE — the two sections that turn proof back
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

      {/* 12-13 · TRUST. Who did it, then what the people they did
          it for say about it — in that order, because a quote from
          a stranger means more once you know whose work it is
          praising. */}
      <Brand />
      <Testimonials />

      {/* 14-15 · THE ASK, and the directory. Both live inside
          <Footer>: the closing CTA panel is slot 15 and opens
          every page on the site, so it is authored once there
          rather than duplicated here. */}
      <Footer />
    </>
  )
}
