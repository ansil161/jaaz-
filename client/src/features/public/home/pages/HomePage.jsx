import Hero from '@/features/public/home/components/Hero'
import ThePromise from '@/features/public/home/components/Promise'
import Brand from '@/features/public/home/components/Brand'
import Projects from '@/features/public/home/components/Projects'
import LightsDown from '@/features/public/home/components/LightsDown'
import EverySeat from '@/features/public/home/components/EverySeat'
import Spaces from '@/features/public/home/components/Spaces'
import Tonight from '@/features/public/home/components/tonight/Tonight'
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
     PROOF     Projects, before any further claims are made
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
      (<LightsDown>, <EverySeat>), plus Spaces and Transform,
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

      {/* PROOF — placed before the rest of the claims, not after */}
      <Projects />

      {/* — breath — */}
      <LightsDown />

      {/* WHAT WE BUILD */}
      <Spaces />

      {/* WHAT IT IS FOR — the rooms, then the nights they hold.
          Placed immediately after <Spaces> because the two are one
          argument in two halves: Spaces names the rooms, Tonight
          shows what happens inside them. It is also the page's only
          section the visitor drives rather than scrolls, which is
          worth spending at the point where they have just been told
          what can be built and have not yet been told how. */}
      <Tonight />

      {/* — breath — */}
      <EverySeat />

      {/* HOW IT IS BUILT */}
      <Craft />
      <Transform />

      {/* TRUST */}
      <Testimonials />

      <Footer />
    </>
  )
}
