import { aboutCta } from '../../data/about'
import ClosingCta from '../ui/ClosingCta'

/* ============================================================
   ABOUT 11 — CLOSING CTA

   Same device as the homepage's close, on a different sentence.
   Rebuilt to match glazewindowsystems.com's own CTA — see the
   long comment in ClosingCta.jsx for the full account.
   ============================================================ */

export default function AboutCta() {
  return (
    <ClosingCta
      id="contact"
      heading={aboutCta.heading}
      body={aboutCta.body}
      primary={{ label: aboutCta.cta, to: '/contact' }}
      secondary={aboutCta.secondary}
      reassurance={aboutCta.reassurance}
    />
  )
}
