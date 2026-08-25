import ConsultationHero from '../components/contact/ConsultationHero'
import InfoStrip from '../components/contact/InfoStrip'
import ExperienceInvite from '../components/contact/ExperienceInvite'
import FaqAccordion from '../components/contact/FaqAccordion'
import LocationMap from '../components/contact/LocationMap'
import Footer from '../components/sections/Footer'
import { contactCta } from '../data/contact'

/* ============================================================
   CONTACT

   Rebuilt to the shape of glazewindowsystems.com/contact — the
   same reference ClosingCta.jsx already matches at the foot of
   every page on this site, extended here to the whole page
   rather than just its close:

     HERO + WIZARD   paper, the five-step enquiry panel
     INFO STRIP      paper, call / hours / email / follow
     EXPERIENCE      ink, the invitation to visit
     QUESTIONS       paper, an FAQ accordion
     MAP             ink, a real embed
     CLOSE           ink, the site-wide Footer carrying this
                     page's own CTA copy

   Every dark/paper alternation below is a deliberate inversion,
   the same rule the rest of the site already runs on — this
   page just carries it through six beats instead of two or
   three, because that is the reference's own rhythm.
   ============================================================ */

export default function Contact() {
  return (
    <>
      <ConsultationHero />
      <InfoStrip />
      <ExperienceInvite />
      <FaqAccordion />
      <LocationMap />

      {/* The close and the footer are one dark block now — the
          footer owns the CTA on every page (see Footer.jsx), so this
          page hands it Contact's own copy instead of stacking a
          separate <ClosingCta> above an identically dark footer. */}
      <Footer cta={contactCta} />
    </>
  )
}
