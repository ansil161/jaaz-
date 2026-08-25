import { process } from '../../data/site'
import ProcessTimeline from './ProcessTimeline'

/* ============================================================
   08 — OUR PROCESS

   The six delivery stages, on the shared timeline. Everything
   that used to live here — the measured curve, the scrubbed
   progress clip, the live card, the blueprint grid and the glow
   that tracks it — moved into <ProcessTimeline> when About's
   Method section started running the same mechanism. This file
   is now only the answer to "which content, on which page".
   ============================================================ */

export default function Process() {
  return (
    <ProcessTimeline
      id="process"
      label={process.label}
      heading={process.heading}
      intro={process.intro}
      steps={process.steps}
      finale={process.finale}
    />
  )
}
