import { Lines, Rise } from './Motion'
import { Link } from '../chrome/PageTransition'

/* ============================================================
   THE CLOSING CTA — rebuilt off glazewindowsystems.com

   The brief for this rewrite was explicit: match that site's own
   closing CTA, not this site's earlier "cinema aperture" take on
   one. Its footer CTA was read directly out of the rendered page
   (computed styles, not a screenshot guess), and every number
   below traces back to that: button padding 13.6px/28px, label
   10px/600/2px-tracked uppercase, hover that moves only the arrow
   4px with no fill or colour change, a two-tone headline where
   just the LAST WORD turns warm and italic, and — the biggest
   structural change — no photograph at all. Glaze's CTA is type
   on a flat charcoal field. Nothing else.

   WHAT THAT FIXES, ON TOP OF MATCHING THE REFERENCE

   The previous version ran a full-bleed plate behind the headline,
   which meant every page's close depended on a photograph
   surviving a 2.39:1 crop at readable exposure — two of the three
   plates tried there failed that test and had to be replaced. A
   typographic CTA has no such failure mode, and it is also the
   quieter, more confident move for the LAST thing on a page: by
   this point the visitor has seen a dozen rooms. The close doesn't
   need one more.

   It also drops the three-item contact rail the old version ran
   under the button. Glaze doesn't have one — just a button and one
   muted alternate line — and that rail was duplicate information
   anyway: every contact route it listed already lives in the
   site-wide Footer immediately below. One button, one quiet
   alternate, same as the reference.

   No eyebrow label either. Every other section on this site opens
   on a mono label + rule; this component drops it for two reasons
   at once — Glaze's own CTA has no kicker above its headline, and
   `impeccable`'s own craft floor lists a kicker-above-heading as a
   flat ban, brief or no brief: "the heading carries its own
   weight; delete the label and let the heading speak."

   TWO LINES ON THE LEFT, NOT THREE
   `body` and `reassurance` used to both render in the copy column
   — heading, then the body sentence, then a small caps reassurance
   line underneath it — on every page that supplied both (Home,
   About, Contact all do). Three stacked blocks with a margin each
   reads as three separate rows rather than one composed headline,
   which is exactly the "looks like three sections" complaint this
   revision fixes. `reassurance` now only ever appears in the ONE
   slot it shares with `secondary`, under the button — never beside
   `body`. The copy column is heading-plus-one-line, full stop.

   THE ONE DELIBERATE DEPARTURE FROM THE REFERENCE
   Glaze's emphasis word switches to a second serif face (Bodoni
   Moda against a Playfair Display headline). This system runs on
   ONE display face by house rule — see the "one display face, one
   sans" comment in index.css — and introducing a second serif for
   a single word would break that discipline for a passing effect.
   The warm colour shift is kept; the typeface swap is not. `em`
   still uses this site's own `italic-display`, just recoloured
   with `--color-cove` — the same warm light every closing CTA on
   this site already glows with, now given a solid value instead of
   staying a gradient. Not a second accent competing with the
   site's reserved `--color-signal`; the SAME accent, one more way.
   ============================================================ */

/** A drawn diagonal arrow — this system's own convention for a link
 *  that leaves the current context, matching the stroke weight used
 *  everywhere else rather than an inline unicode glyph. */
function Arrow({ size = 11, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d="M2.5 8h10.5" />
      <path d="M9 4l4 4-4 4" />
    </svg>
  )
}

/** Splits a line's trailing word off for its own emphasis span —
 *  Glaze italicises and recolours only the FINAL word of its
 *  headline, not the whole second line, and that restraint is most
 *  of why the effect reads as a considered edit rather than a
 *  decoration. Falls back to the whole line if it is one word. */
function splitLastWord(line) {
  const i = line.lastIndexOf(' ')
  return i === -1 ? [null, line] : [line.slice(0, i + 1), line.slice(i + 1)]
}

/**
 * <ClosingCta>
 *
 * @param {string}   id           Anchor id. `/#contact` links depend on it.
 * @param {string[]} heading      Display lines. The final word of the LAST
 *                                line is set in italic-cove emphasis.
 * @param {string}   [body]       One sentence under the heading.
 * @param {object}   primary      `{ label, to }` — routed, the sharp button —
 *                                OR `{ label, onClick }` for an in-page action
 *                                (the Contact page's brief drawer, for one)
 *                                rather than a navigation. Exactly one of
 *                                `to` / `onClick` is expected.
 * @param {object}   [secondary]  `{ label, href }` — the quiet alternate
 *                                line under the button (Glaze's "or call").
 *                                Takes priority over `reassurance` there.
 * @param {string}   [reassurance] The same quiet-alternate slot under the
 *                                button, used only when there is no
 *                                `secondary`. Never shown alongside `body`
 *                                — see the note below on why the copy
 *                                column stays to two lines, not three.
 */
export default function ClosingCta({ id = 'contact', heading, body, primary, secondary, reassurance }) {
  const lastIndex = heading.length - 1
  const footnote = secondary
    ? { text: secondary.label, href: secondary.href }
    : reassurance
      ? { text: reassurance, href: null }
      : null

  return (
    <section id={id} className="relative border-t border-white/10 bg-ink-4 py-24 sm:py-28 lg:py-32">
      <div className="shell-wide">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          {/* ---- The copy ---- */}
          <div className="max-w-xl">
            <Lines as="h2" className="t-heading text-pure" stagger={0.1}>
              {heading.map((line, i) => {
                if (i !== lastIndex) {
                  return (
                    <span key={line} className="block">
                      {line}
                    </span>
                  )
                }
                const [rest, last] = splitLastWord(line)
                return (
                  <span key={line} className="block">
                    {rest}
                    <em className="italic-display" style={{ color: 'var(--color-cove)' }}>
                      {last}
                    </em>
                  </span>
                )
              })}
            </Lines>

            {body && (
              <Lines as="p" className="t-body mt-5 max-w-md text-fog">
                {body}
              </Lines>
            )}
          </div>

          {/* ---- The action ---- */}
          <Rise className="flex shrink-0 flex-col items-start gap-4 sm:items-end" y={18}>
            {primary.onClick ? (
              <button type="button" onClick={primary.onClick} className="btn-flat focus-ring">
                {primary.label}
                <Arrow size={10} className="btn-flat-arrow" />
              </button>
            ) : (
              <Link to={primary.to} className="btn-flat focus-ring">
                {primary.label}
                <Arrow size={10} className="btn-flat-arrow" />
              </Link>
            )}

            {footnote &&
              (footnote.href ? (
                <a href={footnote.href} className="cta-footnote focus-ring">
                  {footnote.text}
                </a>
              ) : (
                <span className="cta-footnote">{footnote.text}</span>
              ))}
          </Rise>
        </div>
      </div>
    </section>
  )
}
