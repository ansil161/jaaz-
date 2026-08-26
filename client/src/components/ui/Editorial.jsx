import { Rule } from './Motion'

/* ============================================================
   EDITORIAL CHROME
   The two small pieces every About section repeats, kept here
   so the label rhythm and the placeholder treatment stay
   identical across eleven sections.
   ============================================================ */

/**
 * <SectionLabel> — mono label plus a rule that draws itself in.
 * Every section on the site is anchored by one of these.
 */
export function SectionLabel({ children, tone = 'dark', className = '' }) {
  const ink = tone === 'paper'
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <span className={`t-label ${ink ? 'text-ink/45' : 'text-mist'}`}>{children}</span>
      <Rule className={`max-w-40 ${ink ? 'text-ink' : 'text-pure'}`} />
    </div>
  )
}

/**
 * <ConfirmNote> — an unfinished fact, shown as unfinished.
 *
 * The brief is explicit that this site must not manufacture
 * credibility, so anything JAAZ has not supplied is rendered as a
 * visible, deliberately un-designed note rather than filled with a
 * plausible number, a stock portrait or an invented partner. It reads
 * as a production marker on purpose: it should be uncomfortable
 * enough that it never ships by accident.
 */
export function ConfirmNote({ children, tone = 'dark', className = '' }) {
  const ink = tone === 'paper'
  return (
    <p
      data-confirm
      className={`t-label flex max-w-lg items-start gap-3 border-l py-1 pl-4 leading-[1.7] ${
        ink ? 'border-ink/25 text-ink/40' : 'border-white/20 text-ash'
      } ${className}`}
    >
      <span aria-hidden="true" className="mt-[0.15em] shrink-0 tracking-normal">
        &#9633;
      </span>
      <span className="tracking-[0.14em] normal-case">{children}</span>
    </p>
  )
}
