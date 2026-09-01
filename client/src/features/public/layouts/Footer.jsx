import { footer } from '@/features/public/data/site'
import { Drift, Figure, Lines, Rise } from '@/features/public/components/Motion'
import { Link } from '@/features/public/router/PageTransition'

/* ============================================================
   FOOTER — one block, every page

   Built to the supplied reference: a saturated colour panel
   carrying the invitation, sitting on a LIGHT footer that lists
   the sitemap under it in plain dark type, closed by a legal
   line with the social marks opposite.

   THE THEME IS INVERTED FROM THE REST OF THE SITE, on purpose.
   Every other section is near-black with photography as the only
   colour. Here the page arrives at its end and the lights come
   up: `--color-paper` field, `--color-cove` panel, ink type.
   That is the reference's own arrangement — bright panel, white
   page — rather than a translation of it, and it is the whole
   reason this file reads differently from its neighbours.

   Two consequences worth knowing before editing:

   - NOTHING FROM THE DARK SYSTEM CARRIES OVER UNCHECKED. Every
     `text-fog` / `border-white/10` / `bg-ink-*` in here was a
     silent no-op or an illegible pairing after the flip, because
     a white hairline at 10% over paper IS paper and nothing
     errors. Colours below are picked off measured contrast:
     ink on cove 9.7:1, ash on paper 6.7:1, the body text on the
     panel ~7:1 (ink cut with cove — never a neutral grey, which
     reads as dirt over gold).
   - <ClosingCta> STILL RUNS ON INK on four other pages, so
     `.btn-flat`, `.btn-flat-ghost` and `.cta-footnote` are
     untouched and this file uses its own `.btn-flat-ink*` pair.

   TYPE. The card headline and the column headings are set in
   Inter 600 — `.t-heading-sans` and `.t-col-head` — following
   the reference's heavy grotesque rather than the Instrument
   Serif display the rest of the site uses. Two deliberate
   exceptions, scoped to this block and nowhere else.

   THE THREE BANDS

   1. CARD.        Headline, the contact promise, then two
      actions — one filled ink, one outlined. A photograph fills
      the right ~45% and dissolves into the panel across its own
      left third rather than butting against the copy; see
      `.footer-card-veil`, which fades to GOLD, not to black.
      Stacked below `lg`, the picture goes on top and the fade
      turns downward with it.

   2. DIRECTORY.   The lockup and its one line of prose, then
      EXPLORE, SOLUTIONS, REACH US and VISIT. Five tracks, and
      the brand column is the widest because it is the only one
      carrying an image and a sentence.

      SOLUTIONS IS NEW and is the point of rebuilding rather
      than restyling the directory: nine solution pages existed
      with no route to them from the foot of any page.

   3. LEGAL.       Copyright over the two policy links, with the
      social marks opposite as filled discs — the reference's own
      split, and the reason the FOLLOW block left the brand
      column.

   The watermark behind the directory is the one element the
   reference does NOT have, and it stays: four columns of links
   on plain paper with nothing behind them is the generic footer,
   and the cropped house mark is what stops this being one.

   LAYOUT NOTE — why explicit grid tracks are safe here and the
   old `grid-cols-12` + `col-span-N` was not: a twelve-track row
   computed to twelve 0px columns below `lg` and sized its only
   item off 440px of gaps, running the sentence off a 390px
   screen. The tracks below are declared per breakpoint over a
   plain single-column default, so there is no breakpoint at
   which an item spans tracks that do not exist.

   MOTION NOTE — the card's photograph goes through <Figure>,
   which reveals itself with an animated `clip-path`. It is
   deliberately NOT wrapped in <Drift>: Drift sets
   `will-change: transform`, and promoting an ancestor of a
   clip-path layer on this site renders the picture black.
   ============================================================ */

/** The link-out arrow, at this system's stroke weight rather than a
 *  unicode glyph. */
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
      width="16"
      height="16"
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
 *  site.css for why it is an italic outline rather than a large
 *  filled word.
 *
 *  Lowercased here rather than with `text-transform` so the result
 *  does not depend on how a given engine applies that property, and
 *  so the ONE brand string in `data/site.js` still drives both marks
 *  down here. */
function Wordmark() {
  return <span className="footer-wordmark">{footer.wordmark.toLowerCase()}</span>
}

/** A column heading and its list. Four of these make the directory.
 *
 *  `Link` for in-app addresses and `<a>` for everything else is
 *  decided per item rather than per column, because REACH US mixes
 *  a `mailto:`, a `tel:` and an external WhatsApp URL, and routing
 *  any of those through the client router navigates to a page that
 *  does not exist. */
function LinkColumn({ title, links }) {
  return (
    <div data-col>
      <h2 className="t-col-head">{title}</h2>
      <ul className="mt-5 space-y-2.5">
        {links.map((l) => {
          const href = l.href
          const routed = href.startsWith('/')
          /* `--color-ash` (#55555b) on paper is 6.7:1 — comfortably
             past AA — where the mid-grey a reference screenshot
             samples to is nearer 4:1. The link colour is picked off
             the contrast requirement, not off the pixel. `.more`
             steps down one, and `--color-mist` on paper is 3.4:1, so
             that one line is deliberately NOT a link colour: it is
             set in ash too and separated by italics instead. */
          const className = `link-underline t-body focus-ring text-ash hover:text-ink transition-colors duration-500 ${
            l.more ? 'italic' : ''
          }`
          return (
            <li key={l.label}>
              {routed ? (
                <Link to={href} className={className}>
                  {l.label}
                </Link>
              ) : (
                <a
                  href={href}
                  className={className}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : null)}
                >
                  {l.label}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One of the card's two actions. The three shapes a CTA target can
 *  take on this site — a route, a raw href, a handler — differ only
 *  in which element carries them, so the styling and the arrow are
 *  written once here rather than three times at each call site. */
function CardAction({ action, className, children }) {
  if (action.onClick) {
    return (
      <button type="button" onClick={action.onClick} className={className}>
        {children}
      </button>
    )
  }
  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={action.href} className={className}>
      {children}
    </a>
  )
}

/**
 * <Footer>
 *
 * @param {object} [cta] Overrides `footer.cta` for one page — Contact
 *                       does. Shape: `{ heading: string[], body?,
 *                       plate?: { src, alt }, primary: { label, to |
 *                       href | onClick }, secondary?: { label, href } }`.
 */
export default function Footer({ cta = footer.cta }) {
  const heading = cta.heading
  const { primary, secondary } = cta
  /* Optional on an override, because a page supplying its own words
     should not be forced to supply its own photograph as well. */
  const plate = cta.plate ?? footer.cta.plate

  return (
    <footer className="relative isolate overflow-hidden bg-paper">
      {/* ---- 0. Atmosphere. Nothing here is content. ----

          Order matters: glow first so the wordmark sits IN the light
          rather than on top of it, and both sit under `z-10` content.
          All three layers are inert — no pointer events, no text
          selection, hidden from assistive tech — because the mark is
          the brand rendered as texture, and a screen reader
          announcing a decorative "JAAZ" between the address and the
          copyright would be reading out the wallpaper. */}
      <div className="footer-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      {/* Centred on the block and deliberately CROPPED by the footer's
          own bottom edge — the mark runs off the page rather than
          sitting on it. Sunk ~16% of its own height, it rises behind
          the directory instead, where a watermark belongs.

          The translate lives on an inner element, not on <Drift>
          itself: Drift's scroll tween writes `transform` inline, and
          a Tailwind translate on the same node would be overwritten
          the moment the tween ran. */}
      <Drift
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center"
        y={5}
        aria-hidden="true"
      >
        <span className="block translate-y-[7%]">
          <Wordmark />
        </span>
      </Drift>

      {/* The seam with the page above. The paper meeting the page's
          near-black IS the boundary now, so this only takes the buzz
          off its first few pixels — see `.rule-fade` in site.css. */}
      <div className="rule-fade absolute inset-x-0 top-0" aria-hidden="true" />

      <div className="relative shell-wide">
        {/* ---- 1. The card ----

            `overflow-hidden` on the panel is load-bearing twice over:
            it is what crops the photograph to the radius, and it is
            what lets the picture be sized past its own panel for the
            parallax inside <Figure> without spilling onto the copy.

            The picture is `order-1` by default and `lg:order-2`
            because the stacked reading is picture-then-invitation —
            the image introduces the offer on a phone, and sits
            beside it on a desktop. */}
        <div className="pt-20 sm:pt-24 lg:pt-28">
          <div className="footer-card grid overflow-hidden rounded-[1.25rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:rounded-[1.75rem]">
            {/* Centred rather than top-aligned, and that is a fix
                rather than a preference: the photograph sets the
                panel's height at `lg`, the copy is shorter than the
                photograph is tall, and top-aligning left ~130px of
                empty card under the buttons — a gap big enough to
                read as a missing element. Centring turns the same
                slack into equal margin above and below. */}
            <div className="order-2 flex flex-col justify-center px-7 py-11 sm:px-10 sm:py-14 lg:order-1 lg:px-14 lg:py-16 xl:px-16">
              {/* Heavy sans, and every line in one ink — no italic
                  gold last word.

                  That flourish was the right move on charcoal: gold
                  on near-black is a 9:1 pairing, so the emphasised
                  word read as emphasis. On a gold PANEL the same
                  word would be drawn in the background colour. There
                  is no version of it that survives the change, so it
                  is gone rather than substituted, which is also what
                  the reference does — its headline is one weight,
                  one colour, and carries on nothing but size. */}
              <Lines as="h2" className="t-heading-sans text-ink" stagger={0.1}>
                {heading.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </Lines>

              {/* Tinted from the panel's own hue rather than set in a
                  grey. A neutral grey over gold reads as dirt; ink
                  cut with cove stays in the family and still holds
                  ~7:1. */}
              {cta.body && (
                <Lines
                  as="p"
                  className="t-body mt-5 max-w-[44ch]"
                  style={{ color: 'color-mix(in srgb, var(--color-ink) 78%, var(--color-cove))' }}
                >
                  {cta.body}
                </Lines>
              )}

              {/* A two-track grid rather than a flex row, and the
                  buttons are equal width because the reference's are.

                  A `flex-wrap` row was the obvious build and it failed
                  in the middle of the range: the labels here are
                  "Discuss your project" (225px) and a phone number
                  (196px), which together need 433px, and the card's
                  left column is 418px wide at a 1060px window. So the
                  pair wrapped — into two auto-width buttons on
                  separate lines, 29px different in length, which reads
                  as a layout that ran out of room rather than one that
                  stacked. Equal tracks make the pair deliberate at
                  every width, and the cap stops them growing into
                  banners on a wide card.

                  THE TRACK COUNT GOES 1 → 2 → 1 → 2 with width, which
                  looks like an error and is not. What the buttons
                  actually answer to is the width of the COLUMN they
                  are in, and that does not increase monotonically
                  with the window: at `lg` the photograph arrives
                  beside the copy and takes 45% of the card away from
                  it, so the text column is NARROWER at 1024px than it
                  was at 1023px. Two 225px buttons do not fit in what
                  is left until `xl`. Forcing the pair through that
                  band is what produced 202px buttons with the label
                  wrapping onto a second line inside them.

                  `Rise` staggers `el.children`, so the two tracks are
                  its two targets exactly as the flex children were. */}
              <Rise
                className="mt-9 grid gap-3 sm:mt-10 sm:max-w-[33rem] sm:grid-cols-2 lg:max-w-[20rem] lg:grid-cols-1 xl:max-w-[33rem] xl:grid-cols-2"
                y={16}
              >
                <CardAction action={primary} className="btn-flat-ink focus-ring justify-center">
                  {primary.label}
                  <Arrow className="btn-flat-arrow" />
                </CardAction>

                {secondary && (
                  <CardAction
                    action={secondary}
                    className="btn-flat-ink-ghost focus-ring justify-center"
                  >
                    {secondary.label}
                  </CardAction>
                )}
              </Rise>
            </div>

            {/* The photograph. `min-h` rather than an aspect ratio
                because on a desktop the panel has to match whatever
                height the copy beside it lands on — an aspect-sized
                picture would set the card's height instead of
                answering to it. Below `lg` there is no copy beside
                it, so the minimum IS the height. */}
            <div className="relative order-1 min-h-[13.5rem] sm:min-h-[16rem] lg:order-2 lg:min-h-[24rem]">
              {/* The absolute positioning is on THIS wrapper and not
                  passed to <Figure> as a class. <Figure> renders its
                  own `<figure className="relative overflow-hidden …">`
                  and appends whatever it is given, so `absolute
                  inset-0` arrives as a second `position` utility on an
                  element that already has one — and which of the two
                  wins is decided by Tailwind's emission order, not by
                  the order they are written in. `relative` won: the
                  frame stayed in flow, `inset-0` did nothing, and with
                  its only child positioned absolutely it computed to
                  HEIGHT ZERO. The photograph loaded correctly and
                  painted nothing, which is the version of this bug
                  that survives a glance at the network tab.

                  Given a parent with a definite height, `h-full`
                  resolves without touching <Figure>'s own positioning
                  at all. */}
              <div className="absolute inset-0">
                {/* `placeholder` overrides <Figure>'s `bg-ink-3`
                    default, which is the colour the frame shows for
                    the moment before the photograph arrives. A
                    near-black rectangle flashing inside a gold panel
                    on every page load is the most visible thing in
                    the footer; the card's own shaded mix is
                    invisible. */}
                <Figure
                  src={plate.src}
                  alt={plate.alt}
                  className="h-full w-full"
                  /* Graded to sit next to gold. Untouched, this frame
                     is a cool near-black interior against a warm
                     light panel — the biggest value AND temperature
                     jump anywhere on the site, and no amount of edge
                     treatment reconciles it. Brightness up a step and
                     saturation down one pulls the room toward the
                     panel's warm-neutral family without turning it
                     into a duotone; the picture stays a photograph.

                     `imgClassName`, NOT `className`: `.plate` declares
                     its own defaults for every one of these custom
                     properties, and an element's own declaration
                     beats an inherited one — set on the wrapping
                     <figure> they do nothing at all, silently. */
                  imgClassName="[--plate-brightness:1.14] [--plate-saturate:0.82] [--plate-contrast:0.96]"
                  placeholder="bg-cove"
                  parallax={6}
                  scaleFrom={1.14}
                  start="top 94%"
                />
              </div>
              <div className="footer-card-veil absolute inset-0" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* ---- 2. The directory ---- */}
        <Rise
          /* VISIT is the widest of the four link tracks and EXPLORE
             the narrowest, because the tracks are sized off what is
             actually in them rather than evenly: EXPLORE holds five
             one-word labels, VISIT holds a five-line postal address
             and an opening-hours line set in 0.24em-tracked mono.
             At an even 1fr the address ran into the shell's right
             gutter and the hours broke mid-time — "10:00 –" on one
             line and "19:00" on the next, which reads as two
             different numbers. */
          className="mt-20 grid gap-x-10 gap-y-12 sm:mt-24 md:grid-cols-2 lg:mt-28 lg:grid-cols-[1.35fr_0.9fr_1.2fr_1.05fr_1.3fr] lg:gap-x-10 xl:gap-x-14"
          selector="[data-col]"
          stagger={0.07}
          y={18}
        >
          {/* Brand — the lockup and the one line of prose */}
          <div data-col className="max-w-sm md:col-span-2 lg:col-span-1">
            {/* The full supplied lockup — the mark, the logotype and
                the "home theater systems" line — in its reverse
                colourway. `w-fit` keeps the hit area on the artwork
                rather than across the column. */}
            <Link to="/" className="focus-ring block w-fit" aria-label={`${footer.wordmark} — home`}>
              {/* The dark-ink lockup, not the reverse colourway the
                  charcoal footer used. Swapping the file is the whole
                  fix — both artworks ship in /public and the reverse
                  one on paper is a white logo on near-white. */}
              <img
                src="/jaz-logo.png"
                alt={footer.wordmark}
                width={860}
                height={594}
                loading="lazy"
                decoding="async"
                className="block h-[4.5rem] w-auto sm:h-20"
              />
            </Link>

            <p className="italic-display mt-4 text-[0.95rem] text-smoke">{footer.tagline}</p>
            <p className="t-body mt-5 text-ash">{footer.description}</p>
          </div>

          <LinkColumn title={footer.explore.title} links={footer.explore.links} />
          <LinkColumn title={footer.solutions.title} links={footer.solutions.links} />
          <LinkColumn title={footer.contact.title} links={footer.contact.links} />

          {/* Visit — an address that navigates, and the hours */}
          <div data-col>
            <h2 className="t-col-head">{footer.office.title}</h2>
            <a
              href={footer.office.mapHref}
              target="_blank"
              rel="noreferrer"
              className="focus-ring mt-5 block"
            >
              <address className="t-body leading-[1.75] text-ash not-italic transition-colors duration-500 hover:text-ink">
                {footer.office.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </a>
            {/* Set in the body sans at a step down rather than in
                0.24em mono. The mono label was the site's idiom on
                charcoal; on paper, under a bold sans heading, it was
                the one line in the column that looked like it came
                from a different document.

                `--color-ash`, not the lighter `--color-mist` a quiet
                line wants: mist measures 3.07:1 on paper and this is
                14px text. The step down from the address above is
                carried by size, which is the axis that does not cost
                anything. */}
            <p className="t-body mt-5 text-[0.875rem] text-ash">{footer.office.hours}</p>
          </div>
        </Rise>

        {/* ---- 3. Legal, and the social marks opposite ----

            The bottom padding is ordinary. It used to be enormous to
            reserve a clear band for the watermark, and that band WAS
            the problem: a strip of empty charcoal holding one
            outlined word is a section, not a background. The mark
            passes behind this row and off the bottom edge, so the
            padding only has to be the page's own last breath. */}
        {/* The rules are ink now, not white-at-10%. `border-white/10`
            over paper computes to #f4f2ee with a 10% white overlay —
            which is #f4f2ee. Every hairline in this block was
            invisible for exactly that reason after the theme flip,
            and nothing errors when a border is the colour of its own
            background. */}
        <div className="mt-16 flex flex-col gap-8 border-t border-black/10 pt-7 pb-12 sm:flex-row sm:items-end sm:justify-between sm:pb-14">
          <div className="flex flex-col gap-2">
            {/* Small sans, the way the reference sets its own
                copyright — not the tracked mono this line used to
                carry. Two lines rather than one row: the reference
                stacks the copyright over the policy links and puts
                the marks opposite, which is what gives the row its
                asymmetry.

                Ash rather than mist, for the same measured reason as
                the opening hours above. */}
            <span className="t-body text-[0.8125rem] text-ash">
              &copy; {new Date().getFullYear()} JAAZ · {footer.credential}
            </span>
            <nav aria-label="Legal" className="flex gap-5">
              {footer.legal.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="link-underline focus-ring t-body text-[0.8125rem] text-ash transition-colors duration-500 hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <ul className="flex flex-wrap gap-2.5">
            {footer.social.links.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="social-dot focus-ring"
                >
                  <SocialMark name={s.icon} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
