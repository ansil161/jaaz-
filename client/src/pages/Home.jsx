import Hero from '../components/hero/Hero'
import FirstPause from '../components/sections/FirstPause'
import ThePromise from '../components/sections/Promise'
import Brand from '../components/sections/Brand'
import Projects from '../components/sections/Projects'
import LightsDown from '../components/sections/LightsDown'
import EverySeat from '../components/sections/EverySeat'
import Spaces from '../components/sections/Spaces'
import Tonight from '../components/tonight/Tonight'
import Craft from '../components/sections/Craft'
import Transform from '../components/sections/Transform'
import Testimonials from '../components/sections/Testimonials'
import Footer from '../components/sections/Footer'

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

      {/* — the cut to black —
          The only section on the page with no image, no video and no
          furniture of any kind. It exists to break the rhythm the
          hero establishes before anything starts arguing, and it is
          the one place on the site where sound is part of the
          experience rather than absent from it. */}
      <FirstPause />

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
