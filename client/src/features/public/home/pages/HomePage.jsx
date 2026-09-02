import Hero from '@/features/public/home/components/Hero'
import Engineering from '@/features/public/home/components/Engineering'
/* Aliased. The component's file is Promise.jsx and the section is
   still "The Promise" in the data; binding that name at module
   scope here would shadow the global `Promise` for the whole file,
   which is a trap waiting for the first `await` anyone adds. */
import Philosophy from '@/features/public/home/components/Promise'
import Possibilities from '@/features/public/home/components/Possibilities'
import Transform from '@/features/public/home/components/Transform'
import Snap from '@/features/public/home/components/Snap'
import LightsDown from '@/features/public/home/components/LightsDown'
import Calibration from '@/features/public/home/components/Calibration'
import Craft from '@/features/public/home/components/Craft'
import Technology from '@/features/public/home/components/Technology'
import Spaces from '@/features/public/home/components/Spaces'
import Brand from '@/features/public/home/components/Brand'
import Process from '@/features/public/home/components/Process'
import Testimonials from '@/features/public/home/components/Testimonials'
import Footer from '@/features/public/layouts/Footer'

/* ============================================================
   HOME

   Fifteen slots. The order IS the argument, and reordering them
   is a content decision rather than a layout one.

      01  HERO                 Entertainment without comfort
                               is just noise
      02  THE JAAZ APPROACH    Everything works as one
      03  THE PHILOSOPHY       Luxury without comfort is not luxury
      04  POSSIBILITIES        What could your room become?
      05  BEFORE / AFTER       A room is what you make of it
      06  ONE ROOM.            Four states of the same space
          DIFFERENT WORLDS.
      07  CHAPTER 01:          The room changes when the lights
          LIGHTS DOWN          disappear
      08  CALIBRATION          You may never see the difference
      09  TECHNOLOGY & CRAFT   From setup to showtime
      10  SPACES               What we bring alive
      11  WHY JAAZ             One team. One vision. One experience
      12  OUR PROCESS          From idea to handover
      13  TESTIMONIALS         In their rooms
      14  FINAL CTA            Design your private entertainment
                               world
      15  FOOTER

   The journey it walks, in the visitor's own words:

      01  I feel something.
      02  I understand what JAAZ believes.
      03  I understand why JAAZ is different.
      04  I discover what is possible.
      05  I see the transformation.
      06  I imagine how I could use it.
      07  I experience the atmosphere.
      08  I understand the engineering.
      09  I understand the craftsmanship and technology.
      10  I see that JAAZ can handle different environments.
      11  I understand who is behind it.
      12  I understand how the project works.
      13  Other people validate the decision.
      14  I am ready to talk to JAAZ.

   ------------------------------------------------------------
   THE CONTENT HIERARCHY THIS ORDER ENFORCES

   EXPERIENCE, then OUTCOME, then ENGINEERING, then TECHNOLOGY —
   in that order, never reversed. It is why <Technology>, which
   is the only section on the page that names hardware categories
   and partner brands, cannot appear before slot 09: everything
   before it earns the right to list equipment by having already
   explained what the equipment is FOR. A projector brand above
   the fold would make this an electronics retailer.

   The same rule is why <Engineering> — six pillars, no hardware —
   is allowed at slot 02 while <Craft> and <Technology> are not.
   It states a belief; they state an inventory.

   ------------------------------------------------------------
   THREE STRUCTURAL RULES

   1. THE ASK COMES LAST, AND ONLY ONCE. Slots 01-13 ask for
      nothing. The hero's button is there for the few who have
      already decided, and slot 14 — which lives inside <Footer> —
      is the page's one real invitation. A page that asks on every
      screen has not earned an answer on any of them.

   2. NO MORE THAN TWO TYPOGRAPHIC SECTIONS IN A ROW. Every third
      slot breaks the column: <Possibilities>, <Transform>,
      <LightsDown>, <Craft> and <Spaces> carry photographs, and
      <Snap> and <Calibration> are the two printed on paper — the
      only light ground on the page.

   3. PROOF IS SANDWICHED BY DESIRE. 08-10 are the hardest,
      most technical run on the site and they sit where they can
      afford to be: after six slots of showing what a room feels
      like, and before the three that say who does it and how.
      Leading with the measurement would be a spec sheet.

   ------------------------------------------------------------
   WHAT CAME OFF THIS PAGE IN THE RESTRUCTURE

   Three built sections are not in the fifteen and are no longer
   rendered. All three are intact in the codebase — each is one
   import and one tag to restore — and none of them was deleted.

   <Prism> ("What's tonight?", five atmospheres of one room) is
   the closest call. Slot 06 now makes that exact claim with four
   states, so the two were arguing the same point twice in
   consecutive slots.

   <Comfort> ("Stay longer.") overlaps the COMFORT pillar at slot
   02 and the seating layer at slot 09.

   <Feeling> ("What do you want to feel?") is the only section
   that started from the visitor rather than the room. It is the
   one most worth reinstating if the page later wants a
   visitor-first beat between slots 10 and 11.

   Also unlinked but intact: <FirstPause>, <Journal>.
   ============================================================ */

export default function Home() {
  return (
    <>
      {/* 01 · FEEL. The cinematic room reveal stays exactly as it
          is — the visitor experiences the room before they are
          given a single technical explanation. It is also the only
          slot before the footer that asks for anything. */}
      <Hero />

      {/* 02 · UNDERSTAND. The philosophy, immediately. Six pillars
          — picture, sound, acoustics, comfort, control,
          calibration — and the line they exist to prove: we don't
          engineer individual components, we engineer the
          experience between them.

          This section used to sit ninth, where "Engineered. Not
          assembled." answered a room the visitor had already been
          shown. Second, it answers a question nobody has asked
          yet, which is why it now leads on what JAAZ BELIEVES
          rather than on what JAAZ did. No hardware is named here;
          that is what keeps it legal at slot 02 under the content
          hierarchy above. */}
      <Engineering />

      {/* 03 · DIFFERENTIATE. Why JAAZ does not approach a room the
          way an installation company does. Three contrasts —
          picture, sound, space — landing on "we don't start with
          the technology, we start with you."

          It follows the pillars rather than preceding them because
          02 states the method and 03 states the reason. Reversed,
          the reason has nothing to be the reason FOR. */}
      <Philosophy />

      {/* 04 · DISCOVER. Eight concepts in five categories —
          private cinema, living cinema, gaming den, lounge,
          outdoor — so the visitor's question changes from "what do
          they build" to "they could work with my kind of space".

          Presented as possibilities and not as a catalogue.
          Everything in it is disclosed as conceptual reference
          material, because JAAZ does not yet have its own
          photography and a portfolio built from stock interiors
          would be lying at the exact point trust is decided. */}
      <Possibilities />

      {/* 05 · TRANSFORM. The civil shell on one side of the seam,
          the finished room on the other, and the visitor drags it
          themselves. It goes directly after the possibilities
          because it answers the doubt they raise: those are
          renderings — this is what actually happens to a room. */}
      <Transform />

      {/* 06 · IMAGINE. One room, four states: cinema, the match,
          gathering, everyday. Having seen that a room can be
          transformed, the visitor is shown that the finished room
          is not locked into one setting — which is the difference
          between a cinema and a room worth having.

          All four are on the page at once rather than behind a
          control, for the same reason <Calibration> shows both
          layouts side by side: a comparison you have to operate is
          a comparison you have to remember. */}
      <Snap />

      {/* 07 · EXPERIENCE. The one deliberate change of register on
          the page, and the only section that still carries a
          numbered chapter mark. After six slots of explanation the
          page stops explaining and simply lets the room be dark
          for a moment. The three figures on it — ambient, grade,
          frame — stay annotation-sized: they support the feeling
          rather than replacing it. */}
      <LightsDown />

      {/* 08 · BELIEVE. The one section that argues rather than
          shows, and the hinge of the whole page: everything above
          it is what a JAAZ room feels like, everything below is
          how one is built.

          Both layouts are drawn side by side, both verdicts on the
          page at once, and it closes on the sentence the
          measurement exists for — the room isn't calibrated for
          the sofa, it's calibrated for the people sitting in it. */}
      <Calibration />

      {/* 09 · TECHNICAL AUTHORITY. Craft first, technology second,
          and in that order for a reason: <Craft> shows the five
          build layers as WORK — spatial design, acoustics,
          comfort, atmosphere — and <Technology> is the inventory
          that enables them.

          This is the only place on the page hardware categories
          and partner brands are named, and it is deliberately as
          late as slot 09. Read alone it would be a shopping list;
          read here it is the infrastructure behind eight slots of
          experience the visitor has already had. */}
      <Craft />
      <Technology />

      {/* 10 · RANGE. Six environments — theatre, living room,
          gaming den, party lounge, bar, terrace — each with its
          real internal dimension and principal material.

          Slot 04 asked the visitor to imagine; this answers the
          practical version of the same question now that they have
          seen the engineering: can JAAZ actually build MY kind of
          space, and what does it take. */}
      <Spaces />

      {/* 11 · TRUST. Only now, with the experience, the
          possibilities and the engineering all shown, does the
          page say who did it. One team across design, acoustics,
          joinery, electronics and calibration — an integrated
          specialist rather than a collection of subcontractors —
          and the three verified numbers.

          This opened the page for most of its life. It is worth
          far more here: a visitor who has just read a per-seat
          calibration has a reason to care who ran it. A visitor on
          their second screen does not. */}
      <Brand />

      {/* 12 · REMOVE FRICTION. Six steps from consultation to
          handover. A process diagram shown before someone wants
          the room is a schedule for a thing they have not decided
          to buy; shown here it answers the last question before
          "how do I start" — what this involves of them. It makes a
          high-value project feel controlled and predictable. */}
      <Process />

      {/* 13 · PROOF. The decision validated by somebody other than
          JAAZ, with each quote tied to a specific room, seat count
          and city rather than floating free as a review widget. It
          is the last thing before the ask because it answers the
          last thing standing in front of it: can I trust these
          people with my home. */}
      <Testimonials />

      {/* 14-15 · ACT, and the directory. Both live inside <Footer>:
          the closing panel is slot 14 and opens every page on the
          site, so it is authored once there rather than duplicated
          here. It reads as the conclusion of the story rather than
          as a sales interruption — which is the whole reason
          nothing above it asked for anything. */}
      <Footer />
    </>
  )
}
