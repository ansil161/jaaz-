import { method } from '@/features/public/data/about'
import ProcessTimeline from './ProcessTimeline'

/* ============================================================
   ABOUT 06 — THE JAAZ METHOD

   The five habits, on the same timeline the homepage's Process
   section runs — same measured curve, same scrubbed progress
   clip, same live card and tracking glow, same finale plate.
   Not a copy of it: both sections import the one
   <ProcessTimeline> and differ only in the props below.

   This replaced a dark, sticky-rail version of the same content
   that resolved each habit out of the dark as it passed the
   reading line. That section argued its point through motion —
   nothing completes, because these are conditions rather than
   steps — and this one does not make that argument. What it
   does instead is put the habits in the shape the rest of the
   site already teaches you to read.

   NOTE ON RHYTHM: this section is now paper, and Obsessions
   directly below it is also paper, so About no longer alternates
   here the way its page comment describes. Moving one of the two
   is a content-order decision.
   ============================================================ */

export default function Method() {
  return (
    <ProcessTimeline
      id="method"
      label={method.label}
      heading={method.heading}
      intro={method.intro}
      steps={method.steps}
      finale={method.finale}
    />
  )
}
