import { team } from '../../data/about'
import { Lines, Rise } from '../ui/Motion'
import { SectionLabel, ConfirmNote } from '../ui/Editorial'

/* ============================================================
   ABOUT 08 — THE PEOPLE BEHIND THE EXPERIENCE

   Rebuilt to a brief: two portraits as a stacked pair of coins,
   centred under a headline, on black — the reference was a
   three-up version of this exact arrangement for a generic
   agency site. Ours is two, because JAZ is a two-founder studio
   and a third empty ring would be a lie the layout tells before
   any copy does.

   THE STACK
   Each portrait is a circle with an ink-coloured ring around it —
   the same colour as the section behind it. Where two rings
   overlap, the front one's ring punches a visible notch out of
   the photo behind it, which is the entire trick: it is not two
   photos overlapping, it is two coins stacked, and the ring is
   what sells that. `marginInlineStart` pulls the second circle
   back over the first; because it is later in the DOM and both
   are plain flow (no z-index needed), it paints on top for free.

   TONE. This section previously sat on paper — see the old
   comment in `pages/About.jsx`, now updated — as the second half
   of a two-part "lit" stretch with Obsessions. Moving it to black
   breaks that pairing on purpose: a coin stack is a night-lit
   object, not a printed one, and forcing it onto paper to protect
   a rhythm would have fought the brief. Obsessions stays lit on
   its own; Team now closes the page's dark half instead.

   THE REVEAL
   At rest, a circle is just the photograph. Hovering — or
   tabbing onto the social links, via `:focus-within`, so keyboard
   use gets the same reveal — brings up a scrim and one sentence
   about what the person does, plus their two social routes. Name
   and role live OUTSIDE the circle, in a caption underneath, so
   identity is never gated behind a pointer.

   PLACEHOLDER POLICY
   `team.principals` is fully designed placeholder content, not an
   empty frame — see the long comment in `data/about.js` for why.
   The visible `ConfirmNote` below is what keeps that honest.
   ============================================================ */

/** A drawn diagonal arrow, matching the stroke weight `ClosingCta`
 *  already established for this system rather than pulling in a
 *  brand-logo icon set for two links. */
function ExternalArrow() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
    >
      <path d="M4 12L12 4" />
      <path d="M5.5 4H12v6.5" />
    </svg>
  )
}

/* Diameter and overlap live together so the overlap always reads as a
   fixed fraction of the coin, at every breakpoint, with one number to
   tune. 22% is enough notch for the stack to register at a glance
   without either photo losing more than its outer edge. */
const COIN = 'clamp(11.5rem, 30vw, 19rem)'
const OVERLAP = 'calc(-1 * clamp(11.5rem, 30vw, 19rem) * 0.22)'

function PrincipalCoin({ principal, index }) {
  return (
    <div
      data-principal
      className="relative flex flex-col items-center"
      style={index > 0 ? { marginInlineStart: OVERLAP } : undefined}
    >
      {/* ---- The ring: ink-coloured, same as the section behind it.
              Where this sits over the previous coin, it is what cuts
              the notch — the padding shows through as a gap, not a
              border drawn in any other colour. ---- */}
      <div
        className="rounded-full bg-ink p-[0.6rem] ring-1 ring-white/8 sm:p-[0.7rem]"
        style={{ width: COIN, height: COIN }}
      >
        <div className="group/card relative h-full w-full overflow-hidden rounded-full">
          <img
            src={principal.image}
            alt={`Portrait of ${principal.name}, ${principal.role}`}
            loading="lazy"
            decoding="async"
            draggable="false"
            className="plate absolute inset-0 h-full w-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:scale-[1.06]"
            style={{ '--plate-brightness': 0.96 }}
          />

          {/* The reveal scrim. Opacity only — never `visibility` or
              `display` — so the bio sentence under it stays reachable
              to assistive tech at every state. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/35 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100 group-focus-within/card:opacity-100"
          />

          {/* Centred, not bottom-anchored — a rectangle of text set
              against a circle's curve reads worst near its own corners,
              so the reveal sits in the middle of the disc instead,
              clear of the edge on every side. */}
          <div className="absolute inset-[14%] flex flex-col items-center justify-center text-center">
            <p
              className="t-body max-w-[85%] translate-y-2 text-[0.8125rem] leading-snug text-paper/95 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100"
            >
              {principal.bio}
            </p>

            <ul className="mt-4 flex gap-5">
              {principal.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-underline group/link focus-ring t-label flex translate-y-2 items-center gap-1.5 text-paper opacity-0 transition-all delay-75 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100"
                  >
                    {s.label}
                    <ExternalArrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---- Identity, outside the ring and never hover-gated ---- */}
      <div className="mt-6 text-center">
        <span className="t-label text-mist">{principal.role}</span>
        <h3 className="font-display mt-2 text-[1.6rem] leading-[0.98] tracking-[-0.02em] text-pure sm:text-[1.85rem]">
          {principal.name}
        </h3>
        <p className="t-label mt-1.5 text-ash">{principal.descriptor}</p>
      </div>
    </div>
  )
}

export default function Team() {
  return (
    <section id="team" className="relative bg-ink py-28 sm:py-36">
      {/* The same warm cove light the hero, the closing CTA and the
          niche this replaced all share — the one recurring colour in
          an otherwise monochrome interface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem]"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 50% 8%, rgba(255,238,210,0.07) 0%, rgba(255,238,210,0.02) 45%, transparent 72%)',
        }}
      />

      <div className="shell-wide relative">
        <div className="flex flex-col text-center">
          <SectionLabel tone="dark" className="justify-center">
            {team.label}
          </SectionLabel>

          <Lines as="h2" className="t-display mt-8 text-pure" stagger={0.11}>
            {team.heading.map((line, i) => (
              <span key={line} className="block">
                {i === 1 ? <em className="italic-display">{line}</em> : line}
              </span>
            ))}
          </Lines>

          {/* A plain block, not `Lines`. SplitText's auto line-detection
              wraps each detected line in a box sized to that line's OWN text
              width, not the paragraph's full width — fine for a left-aligned
              column (every other use of `Lines as="p"` on this site is one),
              but centring text-align on an intrinsically-sized box does
              nothing, since there is no leftover width inside the box to
              center into. It rendered as the first line flush left and the
              second line adrift under it. `Rise` animates the paragraph as
              one whole block instead, which centers correctly. */}
          <Rise as="div" className="mt-6 flex justify-center">
            <p className="t-sub max-w-md text-fog">{team.intro}</p>
          </Rise>
        </div>

        {/* --- The coin stack --- */}
        <Rise
          className="mt-20 flex flex-wrap justify-center sm:mt-24"
          selector="[data-principal]"
          y={28}
          stagger={0.14}
        >
          {team.principals.map((p, i) => (
            <PrincipalCoin key={p.name} principal={p} index={i} />
          ))}
        </Rise>

        <ConfirmNote className="mx-auto mt-16 sm:mt-20">
          {team.note}
        </ConfirmNote>

        {/* --- What the team actually covers --- */}
        <Rise
          as="ul"
          className="mt-20 grid gap-x-10 gap-y-10 border-t border-white/12 pt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-14"
          selector="[data-discipline]"
          stagger={0.08}
        >
          {team.disciplines.map((d, i) => (
            <li key={d.title} data-discipline>
              <div className="flex items-baseline gap-4">
                <span className="t-num text-xs text-mist">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="t-sub text-pure">{d.title}</h3>
              </div>
              <p className="t-body mt-2 max-w-xs text-fog sm:pl-9">{d.body}</p>
            </li>
          ))}
        </Rise>
      </div>
    </section>
  )
}
