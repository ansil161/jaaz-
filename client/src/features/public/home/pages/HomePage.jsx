import Hero from '@/features/public/home/components/Hero'
import ThePromise from '@/features/public/home/components/Promise'
import Brand from '@/features/public/home/components/Brand'
import Possibilities from '@/features/public/home/components/Possibilities'
import LightsDown from '@/features/public/home/components/LightsDown'
import Calibration from '@/features/public/home/components/Calibration'
import Spaces from '@/features/public/home/components/Spaces'
import Snap from '@/features/public/home/components/snap/Snap'
import Craft from '@/features/public/home/components/Craft'
import Transform from '@/features/public/home/components/Transform'
import Testimonials from '@/features/public/home/components/Testimonials'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   HOME

   The running order follows the reference build's spine — the
   sequence that makes that page feel like a film rather than a
   brochure — carrying JAAZ's own argument through it:

     FEEL      Hero, Promise
     WHO       Brand + the three verified numbers
     PROPOSAL  Possibilities, before any further claims are made
     — breath —
     WHAT      Spaces, then Tonight — the rooms, then the nights
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
      which carry their own images. A page this long that reads as one continuous
      column of set type is a page nobody reaches the end of.

   The order here IS the argument. Reordering these is a content
   decision, not a layout one.
   ============================================================ */

export default function Home() {
  return (
    <>
      {/* FEEL */}
      <Hero />
      <ThePromise />

      {/* WHO — and the numbers behind it */}
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
          argument in two halves: Spaces names the rooms, the Snap
          shows one of them becoming five different evenings without
          moving.

          This slot used to hold <Tonight> — six nights, six
          photographs, an instrument rail — which made the same
          argument by ENUMERATION. Enumeration is the weakest form
          of it: six pictures of six rooms is exactly what a visitor
          already expects a builder's site to contain, so it proved
          nothing at the point where they were deciding whether to
          believe the claim above it.

          The Snap makes it by TRANSFORMATION instead, and it is
          still the page's only section the visitor drives rather
          than scrolls past — the transport at its foot moves the
          scroll, so the choice is genuinely theirs. Worth spending
          at the point where they have just been told what can be
          built and have not yet been told how. */}
      <Snap />

      {/* PROOF — the one section that argues rather than shows.
          It sits here, after the rooms and before the craft, because
          it is the hinge between them: everything above it is what a
          JAAZ room feels like, everything below it is how one is
          built, and this is the section that earns the right to move
          from the first to the second. It is also a full-bleed frame,
          which keeps the two-typographic-sections-in-a-row rule
          intact across the join. */}
      <Calibration />

      {/* HOW IT IS BUILT */}
      <Craft />
      <Transform />

      {/* TRUST */}
      <Testimonials />

      <Footer />
    </>
  )
}
