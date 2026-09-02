import { process } from '@/features/public/data/site'
import ProcessTimeline from '@/features/public/about/components/ProcessTimeline'

/* ============================================================
   SLOT 12 — OUR PROCESS

   The six delivery steps, from consultation to handover.

   IT IS A PROP SET, NOT A COMPONENT. <ProcessTimeline> already
   takes label / heading / intro / steps / finale precisely so
   two pages can run the same measured curve with different copy
   — About's <Method> is the other one. A second hand-copied
   version of that curve would start identical and drift apart on
   the first change to either page, which is the note at the top
   of ProcessTimeline.jsx and the reason this file is nine lines
   long.

   IT LIVES UNDER home/components DESPITE IMPORTING FROM about/.
   The timeline is shared UI that happens to have been written for
   About first; moving it to a neutral folder is a refactor this
   restructure does not need, and a wrapper that sits with the
   page it belongs to is easier to find than one filed under a
   different page's folder.

   WHY THIS SLOT. A process diagram shown before someone wants the
   room is a schedule for a thing they have not decided to buy.
   Shown here — after the engineering, the range and the team — it
   answers the last question before "how do I start": what this
   actually involves of them. It removes friction; it is not there
   to create interest.
   ============================================================ */

export default function Process() {
  return (
    <ProcessTimeline
      id={process.id}
      label={process.label}
      heading={process.heading}
      intro={process.intro}
      steps={process.steps}
      finale={process.finale}
    />
  )
}
