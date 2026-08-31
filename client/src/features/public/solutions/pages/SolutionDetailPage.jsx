import { useRoute } from '@/features/public/router/routeContext'
import { getSolution, solutions } from '@/features/public/data/solutions'
import Hero from '@/features/public/solutions/components/detail/Hero'
import Rail from '@/features/public/solutions/components/detail/Rail'
import Fit from '@/features/public/solutions/components/detail/Fit'
import Overview from '@/features/public/solutions/components/detail/Overview'
import System from '@/features/public/solutions/components/detail/System'
import Spec from '@/features/public/solutions/components/detail/Spec'
import Gallery from '@/features/public/solutions/components/detail/Gallery'
import Related from '@/features/public/solutions/components/detail/Related'
import ClosingCta from '@/features/public/components/ClosingCta'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   ONE SOLUTION

   HERO      opens from the shape this solution is on the lens,
             names itself, and puts the cost band and the
             programme one screen in.
   FIT       is this yours — offered BEFORE anything is argued,
             with every "look elsewhere" line linked to the
             solution it names.
   OVERVIEW  why it exists.
   SYSTEM    what it is made of, as a numbered schedule.
   SPEC      the measured facts, as a document.
   ROOMS     four plates, captioned by trade.
   RELATED   the nearest two or three, by what they touch.
   CLOSE     this solution's own consultation copy — every one
             of the nine has its own, and none of them had ever
             been rendered.

   WHY THIS PAGE EXISTS
   All of the above was written into data/solutions.js and none
   of it had anywhere to go: `/solutions/:slug` was never routed,
   so the catalogue's only way onward was the contact form. That
   is a page asking for a survey from someone who has not been
   allowed to find out what they would be surveying.

   The slug is read from the route here rather than passed as a
   prop, because this codebase's router hands pages a path and
   nothing else. App has already resolved it to a real solution
   before choosing this component, so the fallback below only
   fires if someone renders it directly.

   The `key` on the fragment's children is not needed — but the
   page-level remount IS: <Hero> runs a load entrance keyed to
   the solution, and moving between two solutions through
   <Related> without it would leave the second one holding the
   first one's opening.
   ============================================================ */

const SECTIONS = [
  { id: 'fit', label: 'Is this yours' },
  { id: 'why', label: 'Why it exists' },
  { id: 'system', label: "What it's made of" },
  { id: 'spec', label: 'Specification' },
  { id: 'rooms', label: 'Rooms' },
]

export default function SolutionDetail() {
  const { path } = useRoute()
  const slug = path.split('/').filter(Boolean)[1]
  const solution = getSolution(slug) ?? solutions[0]

  return (
    <div key={solution.slug}>
      <Hero solution={solution} />
      <Rail sections={SECTIONS} />

      <Fit solution={solution} />
      <Overview solution={solution} />
      <System solution={solution} />
      <Spec solution={solution} />
      <Gallery solution={solution} />
      <Related solution={solution} />

      <ClosingCta
        heading={solution.cta.heading}
        body={solution.cta.body}
        primary={{ label: solution.cta.action, to: '/contact' }}
        reassurance={solution.cta.reassurance}
      />

      <Footer />
    </div>
  )
}
