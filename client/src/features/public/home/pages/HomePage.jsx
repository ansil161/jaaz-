import Hero from '@/features/public/home/components/Hero'
import Brand from '@/features/public/home/components/Brand'
import Possibilities from '@/features/public/home/components/Possibilities'
import LightsDown from '@/features/public/home/components/LightsDown'
import Calibration from '@/features/public/home/components/Calibration'
import Engineering from '@/features/public/home/components/Engineering'
import Comfort from '@/features/public/home/components/Comfort'
import Feeling from '@/features/public/home/components/Feeling'
import Spaces from '@/features/public/home/components/Spaces'
import Prism from '@/features/public/home/components/prism/Prism'
import Craft from '@/features/public/home/components/Craft'
import Transform from '@/features/public/home/components/Transform'
import Testimonials from '@/features/public/home/components/Testimonials'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   HOME

   The running order follows the reference build's spine — the
   sequence that makes that page feel like a film rather than a
   brochure — carrying JAAZ's own argument through it:

     FEEL      Hero
     WHO       Brand + the three verified numbers
     PROPOSAL  Possibilities, before any further claims are made
     — breath —
     WHAT      Spaces, then the Prism — the rooms, then the nights
     — breath —
     HOW       Craft, Transform
     TRUST     Testimonials

   Two structural rules the order encodes:

   1. NOTHING IS ASKED UNTIL EVERYTHING IS SHOWN. The page carries
      no closing CTA section — the hero's button is the only ask,
      offered early to the small number of people who have already
      decided.

   2. NO MORE THAN TWO TYPOGRAPHIC SECTIONS IN A ROW. Every
      third slot is a full-bleed frame — the two chapter pins
      (<LightsDown>, <Calibration>), plus Spaces and Transform,
      which carry their own images. A page this long that reads as
      one continuous column of set type is a page nobody reaches the
      end of.

      The rule survives the loss of <ThePromise>: the run is now
      Hero, Brand, Possibilities, then <LightsDown> — two in a row
      and then a frame — and Possibilities carries three
      photographs of its own besides.

   The order here IS the argument. Reordering these is a content
   decision, not a layout one.
   ============================================================ */

export default function Home() {
  return (
    <>
      {/* FEEL */}
      <Hero />

      {/* WHO — and the numbers behind it.
          The Hero used to hand over to <ThePromise>, a five-act
          typographic statement on a pinned stage. It was removed at
          ansil's request; the component and its `promise` block in
          data/site.js both still exist, so putting it back is one
          import and one tag. */}
      <Brand />

      {/* WHAT IT COULD BE — placed before the rest of the claims,
          not after. This slot used to hold a portfolio rail; it holds
          a proposal instead, because JAAZ does not yet have its own
          photography and a portfolio built out of stock interiors is
          a portfolio that is lying at the exact point where a visitor
          is deciding whether to trust the claim above it. Everything
          in it is disclosed as conceptual / reference material. */}
      <Possibilities />

      {/* — breath — */}
      <LightsDown />

      {/* WHAT WE BUILD */}
      <Spaces />

      {/* WHAT IT IS FOR — the rooms, then what happens inside them.
          Placed immediately after <Spaces> because the two are one
          argument in two halves: Spaces names the rooms, the Prism
          shows one of them being five different evenings without
          moving.

          This slot has held the same claim three ways. <Tonight>
          made it by ENUMERATION — six nights, six photographs —
          which is the weakest form of it, because six pictures of
          six rooms is exactly what a visitor already expects a
          builder's site to contain. <Snap> made it by
          STORYTELLING, and put the five evenings in the last 40%
          of a 3.4-viewport pin most people never finished.

          The Prism makes it STRUCTURALLY: one photograph at the
          centre of a composition, five faces of it around the
          edge, and the whole idea legible on arrival. It is still
          the page's only section the visitor drives rather than
          scrolls past — the index at its foot moves the scroll, so
          the choice is genuinely theirs. Worth spending at the
          point where they have just been told what can be built
          and have not yet been told how. */}
      <Prism />

      {/* PROOF — the one section that argues rather than shows.
          It sits here, after the rooms and before the craft, because
          it is the hinge between them: everything above it is what a
          JAAZ room feels like, everything below it is how one is
          built, and this is the section that earns the right to move
          from the first to the second. It is also a full-bleed frame,
          which keeps the two-typographic-sections-in-a-row rule
          intact across the join. */}
      <Calibration />

      {/* PROOF, WIDENED — Calibration proves ONE discipline with a
          real measurement; this names all six and shows that each
          one decides the next. It goes after, not before, because
          "here is how far we take one of these" earns the right to
          say "and there are six" far better than the reverse.

          It is also the only typographic section in this run, which
          is what keeps the two-in-a-row rule intact: Calibration is
          a full-bleed frame, Engineering is set type, Craft carries
          photographs again. */}
      <Engineering />

      {/* HOW IT IS BUILT */}
      <Craft />
      <Transform />

      {/* DESIRE — the two sections that turn proof back into a
          reason to want the room.

          <Comfort> is the page's slow beat, and deliberately has
          nothing to operate: it follows two sections in a row that
          hand the visitor a control (<Calibration>'s chair,
          <Transform>'s seam) and precedes a third, so a page that
          never stops offering interactions would start reading as a
          demo reel. This one is looked at.

          <Feeling> is the last thing before the testimonials for a
          reason. It is the only section on the page that starts
          from the VISITOR rather than from the room, and it is
          worth the most at the point where someone has read the
          whole argument and is ready to put themselves inside one
          of these rooms. It still asks for nothing — the hero's
          button remains the page's only ask. */}
      <Comfort />
      <Feeling />

      {/* TRUST */}
      <Testimonials />

      <Footer />
    </>
  )
}
