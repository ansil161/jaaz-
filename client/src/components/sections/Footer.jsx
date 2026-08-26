import { footer } from '../../data/site'
import { Drift, Lines, Rise } from '../ui/Motion'
import { Link } from './../chrome/PageTransition'

/* ============================================================
   FOOTER — one block, every page

   Rebuilt to the reference footer's own shape: the closing CTA
   and the site directory are ONE dark field, not two sections
   that happen to sit next to each other. That is the structural
   point of the reference — the page ends on a single continuous
   charcoal block, opened by a large serif invitation and closed
   by four columns of quiet directory type — and it is why this
   component now owns the CTA instead of every page composing
   <ClosingCta> + <Footer> by hand.

   THE FOUR BANDS

   1. INVITATION.  Display headline left, its final word italic
      and warm (`--color-cove`); flat off-white button right with
      a quiet "or call ..." line under it. Type on a flat field,
      no photograph — the measurements behind `.btn-flat` and
      `.cta-footnote` were read off the reference's own computed
      styles and are documented in index.css.

   2. RULE.        One hairline. The whole hierarchy down here
      rests on it: everything above is an invitation, everything
      below is reference material.

   3. DIRECTORY.   Brand column (wordmark, italic positioning
      line, the one paragraph of prose, then FOLLOW + four square
      icon buttons) and three link columns — EXPLORE, REACH US,
      VISIT. The brand column is deliberately the widest: it is
      the only column carrying prose, and giving it a ~1.65fr
      track is what keeps the three directory columns narrow
      enough to scan as a set rather than as three paragraphs.

   4. LEGAL.       Small, and meant to be.

   LAYOUT NOTE — why explicit grid tracks are safe here and the
   old `grid-cols-12` + `col-span-N` was not: the previous build
   hit a real bug where a twelve-track row computed to twelve 0px
   columns below `lg` and sized its only item off 440px of gaps,
   running the sentence off a 390px screen. The tracks below are
   declared per breakpoint (`md:grid-cols-2`, then a four-track
   `lg:` rule) over a plain single-column default, so there is no
   breakpoint at which an item spans tracks that do not exist.
   ============================================================ */

/** The link-out arrow, at this system's stroke weight rather than a
 *  unicode glyph — the same drawing `ClosingCta` uses. */
function Arrow({ size = 10, className = '' }) {
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

/* The four social marks, drawn here rather than pulled from an icon
   package: every other glyph on this site is hand-drawn at stroke
   1.25 with square caps (see contact/icons.jsx), and a dropped-in
   icon font would be the one place the line work changes weight.
   Brand marks keep their real geometry — an Instagram glyph that is
   not a rounded square with a circle in it stops being recognisable
   — but they are stroked to this system's weight, not filled. */
const SOCIAL_PATHS = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M14.9 8.1h2.1V5.1h-2.3c-2.2 0-3.7 1.5-3.7 3.8v1.6H8.7v3.1h2.3V21h3.2v-7.4h2.3l.4-3.1h-2.7V9.2c0-.7.3-1.1.7-1.1z" />
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <path d="M7.7 10.4V17M7.7 7.3v.1" />
      <path d="M11.4 17v-6.6M11.4 12.9c0-1.4 1-2.5 2.4-2.5s2.4 1.1 2.4 2.5V17" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.6" y="5.6" width="18.8" height="12.8" rx="3.4" />
      <path d="M10.4 9.4l5.2 2.6-5.2 2.6z" />
    </>
  ),
}

function SocialMark({ name }) {
  const path = SOCIAL_PATHS[name]
  if (!path) return null
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  )
}

/** The house mark as a signature — see `.footer-wordmark` in
 *  index.css for why it is an italic outline rather than a large
 *  filled word.
 *
 *  Lowercased here rather than with `text-transform` so the result
 *  does not depend on how a given engine applies that property, and
 *  so the ONE brand string in `data/site.js` still drives both marks
 *  down here: the readable link home stays as authored, this one is
 *  the same word in its written form. */
function Wordmark() {
  return <span className="footer-wordmark">{footer.wordmark.toLowerCase()}</span>
}

/** Italicises and recolours only the FINAL word of the last headline
 *  line — the reference's own restraint, and the reason the effect
 *  reads as an edit rather than as decoration. */
function splitLastWord(line) {
  const i = line.lastIndexOf(' ')
  return i === -1 ? [null, line] : [line.slice(0, i + 1), line.slice(i + 1)]
}

/** A column heading + its list. Three of these make the directory. */
function Column({ title, children }) {
  return (
    <div data-col>
      <h2 className="t-label text-ash">{title}</h2>
      {children}
    </div>
  )
}

/**
 * <Footer>
 *
 * @param {object} [cta] Overrides `footer.cta` for one page — Contact
 *                       does. Shape: `{ heading: string[], body?,
 *                       primary: { label, to | href | onClick },
 *                       secondary?: { label, href } }`.
 */
export default function Footer({ cta = footer.cta }) {
  const heading = cta.heading
  const lastIndex = heading.length - 1
  const { primary, secondary } = cta

  return (
    <footer className="relative isolate overflow-hidden bg-ink-4">
      {/* ---- 0. Atmosphere. Nothing here is content. ----

          Order matters: glow first so the wordmark sits IN the light
          rather than on top of it, and both sit under `z-10` content.
          All three layers are inert — no pointer events, no text
          selection, hidden from assistive tech — because the mark is
          the brand rendered as texture, and a screen reader announcing
          a decorative "JAAZ" between the address and the copyright
          would be reading out the wallpaper. */}
      <div className="footer-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      {/* Centred on the block and deliberately CROPPED by the footer's
          own bottom edge — the mark runs off the page rather than
          sitting on it. That crop is what keeps it background: an
          uncropped signature needs clear room underneath, and clear
          room under the legal line reads as another section no matter
          how empty it is. Sunk ~16% of its own height, it rises
          behind the directory instead, where a watermark belongs.

          Centred rather than signed into the left gutter because the
          footer's content is a four-column spread with no dominant
          side: a corner mark pulls the whole block's weight left,
          while a mark on the centre axis sits under the columns
          evenly and stops competing with the brand column that is
          already there.

          The translate lives on an inner element, not on <Drift>
          itself: Drift's scroll tween writes `transform` inline, and
          a Tailwind translate on the same node would be overwritten
          the moment the tween ran. */}
      <Drift
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center"
        y={5}
        aria-hidden="true"
      >
        <span className="block translate-y-[16%]">
          <Wordmark />
        </span>
      </Drift>

      {/* The seam with the page above. A fading hairline rather than a
          full-bleed border — see `.rule-fade` in index.css. */}
      <div className="rule-fade absolute inset-x-0 top-0" aria-hidden="true" />

      <div className="relative shell-wide">
        {/* ---- 1. The invitation ---- */}
        {/* Top-aligned, not bottom: the reference sets its button
            beside the FIRST line of the headline, which is what keeps
            the two reading as one row. Bottom-aligning them drops the
            button a whole line and the row falls apart. The small
            `pt` is optical — it lines the button's cap height up with
            the headline's rather than with its ascender box. */}
        <div className="flex flex-col gap-10 py-20 sm:flex-row sm:items-start sm:justify-between sm:gap-12 sm:py-24 lg:py-28">
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

            {cta.body && (
              <Lines as="p" className="t-body mt-5 max-w-md text-fog">
                {cta.body}
              </Lines>
            )}
          </div>

          {/* ---- The action ---- */}
          <Rise className="flex shrink-0 flex-col items-start gap-4 sm:items-end sm:pt-1.5" y={18}>
            {primary.onClick ? (
              <button type="button" onClick={primary.onClick} className="btn-flat focus-ring">
                {primary.label}
                <Arrow className="btn-flat-arrow" />
              </button>
            ) : primary.to ? (
              <Link to={primary.to} className="btn-flat focus-ring">
                {primary.label}
                <Arrow className="btn-flat-arrow" />
              </Link>
            ) : (
              <a href={primary.href} className="btn-flat focus-ring">
                {primary.label}
                <Arrow className="btn-flat-arrow" />
              </a>
            )}

            {secondary && (
              <a href={secondary.href} className="cta-footnote focus-ring">
                {secondary.label}
              </a>
            )}
          </Rise>
        </div>

        {/* ---- 2 + 3. The rule, then the directory ---- */}
        <Rise
          className="grid gap-x-10 gap-y-14 border-t border-white/10 pt-14 sm:pt-16 md:grid-cols-2 lg:grid-cols-[1.65fr_1fr_1.15fr_1.15fr] lg:gap-x-12"
          selector="[data-col]"
          stagger={0.07}
          y={18}
        >
          {/* Brand — mark, positioning line, prose, follow */}
          <div data-col className="max-w-md md:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="focus-ring font-display block text-3xl leading-none text-pure sm:text-[2.15rem]"
            >
              {footer.wordmark}
            </Link>

            <p className="italic-display mt-4 text-[0.95rem] text-fog">{footer.tagline}</p>

            <p className="t-body mt-6 text-mist">{footer.description}</p>

            <h2 className="t-label mt-10 text-ash">{footer.social.title}</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {footer.social.links.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="social-tile focus-ring flex h-11 w-11 items-center justify-center border border-white/15 text-fog"
                  >
                    <SocialMark name={s.icon} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore — routed links */}
          <Column title={footer.explore.title}>
            <ul className="mt-5 space-y-2.5">
              {footer.explore.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="link-underline t-body focus-ring text-fog">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          {/* Reach us — the three real routes, in the order people use them */}
          <Column title={footer.contact.title}>
            <ul className="mt-5 space-y-2.5">
              {footer.contact.links.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    className="link-underline t-body focus-ring text-fog"
                    {...(c.href.startsWith('http')
                      ? { target: '_blank', rel: 'noreferrer' }
                      : null)}
                  >
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </Column>

          {/* Visit — an address that navigates, and the hours */}
          <Column title={footer.office.title}>
            <a
              href={footer.office.mapHref}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-5 block"
            >
              <address className="t-body leading-[1.75] text-fog not-italic transition-colors duration-500 hover:text-pure">
                {footer.office.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </a>
            <p className="t-label mt-5 text-[0.6rem] text-ash">{footer.office.hours}</p>
          </Column>
        </Rise>

        {/* ---- 4. Legal, deliberately small ----
            The bottom padding is ordinary now. It used to be enormous
            (up to 160px) to reserve a clear band for the watermark,
            and that band WAS the problem: a strip of empty charcoal
            holding one outlined word is a section, not a background.
            The mark now passes behind this row and off the bottom
            edge, so the padding only has to be the page's own last
            breath. */}
        <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-white/10 pt-7 pb-12 sm:pb-14">
          <span className="t-label text-[0.6rem] text-ash">
            &copy; {new Date().getFullYear()} JAAZ
          </span>
          <span className="t-label text-[0.6rem] text-ash">{footer.credential}</span>
          <nav aria-label="Legal" className="ms-auto flex gap-8">
            {footer.legal.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="link-underline t-label focus-ring text-[0.6rem] text-ash"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
