import AboutHero from '@/features/public/about/components/AboutHero'
import Difference from '@/features/public/about/components/Difference'
import Story from '@/features/public/about/components/Story'
import HumanFactors from '@/features/public/about/components/HumanFactors'
import EverySpace from '@/features/public/about/components/EverySpace'
import Method from '@/features/public/about/components/Method'
import Obsessions from '@/features/public/about/components/Obsessions'
import Team from '@/features/public/about/components/Team'
import Record from '@/features/public/about/components/Record'
import Partners from '@/features/public/about/components/Partners'
import Footer from '@/features/public/layouts/Footer'
import Seam from '@/features/public/about/components/Seam'

/* ============================================================
   ABOUT

   The homepage argues that JAAZ builds better rooms. This page
   has one job the homepage cannot do: explain why the people
   who build them are worth trusting with yours.

   It runs claim -> proof -> people -> record, and inverts to
   paper once on the way, for the story, and once more for the
   standards in Obsessions — the two most reflective stretches of
   the page, printed rather than lit.

   Team stays on black. A stacked pair of portrait coins reads as
   a night-lit object — the same room the hero opened in — and
   forcing it onto paper to keep a third inversion would have
   fought that shape rather than served it.

   ------------------------------------------------------------
   THE JOINS

   Every section is wrapped in a <Seam> that declares the ground
   it is arriving FROM and the ground it is arriving ON. That is
   the only thing the page has to know; the seam works out
   whether the join is a chapter break or a breath.

   Four of the ten joins invert the palette — the moments the
   page changes from lit to printed and back. Those get the full
   gesture: the arriving ground's light thrown up the wall
   first, then the ground itself sliding over, then a single pass
   of light along the new edge. The six joins that stay in the
   same palette get the same mechanism at a fraction of the
   amplitude, so they read as continuity rather than as another
   announcement.

   The seams replaced the static `border-t` hairlines those
   sections used to carry — the resting state of a seam IS that
   hairline, so nothing was lost by handing the join over.
   ============================================================ */

export default function About() {
  return (
    <>
      <AboutHero />

      <Seam from="ink" to="ink">
        <Difference />
      </Seam>

      {/* --- Lights up on paper. The page is printed from here. --- */}
      <Seam from="ink" to="paper">
        <Story />
      </Seam>

      {/* --- and back down into the room. --- */}
      <Seam from="paper" to="ink">
        <HumanFactors />
      </Seam>

      <Seam from="ink" to="ink-2">
        <EverySpace />
      </Seam>

      {/* --- Printed again, and it stays printed through
              Obsessions: two paper sections in a row, so the
              join between them is a laid sheet rather than an
              inversion. --- */}
      <Seam from="ink-2" to="paper">
        <Method />
      </Seam>

      <Seam from="paper" to="paper">
        <Obsessions />
      </Seam>

      {/* --- The last inversion, and the one the page has been
              building to: the people, back in the dark room. --- */}
      <Seam from="paper" to="ink">
        <Team />
      </Seam>

      <Seam from="ink" to="ink">
        <Record />
      </Seam>

      <Seam from="ink" to="ink-2">
        <Partners />
      </Seam>

      {/* No seam on the last join. The footer already draws its own
          fading hairline where the page hands over to it, so a seam
          here marked the same boundary twice — its band left ninety-odd
          pixels of empty ground stranded between the two lines, on top
          of the footer's own top padding. The footer is the end of the
          page, not another chapter of it. */}
      <Footer />
    </>
  )
}
