import { FACES } from './prismGeometry'

/* ============================================================
   THE FIVE FACES

   One marker, one number and one word per mode, placed around
   the room. Everything about how they are POSITIONED is in
   prismGeometry.js; everything about how they LOOK is here and
   in `.prism-face` in site.css.

   ------------------------------------------------------------
   THESE ARE DECORATIVE CONTROLS, AND THAT IS A DELIBERATE
   ACCESSIBILITY DECISION

   Every face is clickable and none of them is in the tab order.
   The real control is the index at the foot of the section — one
   tab stop, a proper `tablist`, arrows and Home/End — and this
   ring is a second, spatial affordance for the pointer.

   Two tablists driving one panel is invalid, and picking the
   spatial ring as the accessible one would be worse: five
   absolutely-positioned controls scattered around a photograph
   have no reading order a keyboard can follow, and their DOM
   order (which is the order the arrow keys would use) has no
   relationship to where they appear.

   So the ring is `aria-hidden` with `tabIndex={-1}`. That is the
   sanctioned shape, not a dodge — axe's `aria-hidden-focus` rule
   asks whether the hidden subtree contains SEQUENTIALLY
   focusable elements, and `tabindex="-1"` is exactly how you say
   no. A pointer user gets two ways in; a keyboard or screen
   reader user gets one, and it is the one that works.

   ------------------------------------------------------------
   MOBILE IS A DIFFERENT COMPOSITION, NOT A SCALED ONE

   The desktop ring depends on having a photograph with room on
   all four sides of it, which a 390px screen does not have. So
   below `lg` the same five nodes take their `arc` coordinates
   instead and become a shallow bow above the image — markers and
   numbers only, no words. The active mode's word is set at full
   size under the image, where there is room for it, and the
   index rail names all five.

   Squeezing the desktop positions into a phone would put the
   words on top of the room, which loses both.
   ============================================================ */

export default function PrismFacets({ modes, index, onSelect, className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {FACES.map((face, i) => {
        const mode = modes[i]
        const active = i === index
        return (
          <button
            key={face.key}
            type="button"
            tabIndex={-1}
            data-face
            data-side={face.side}
            data-active={active || undefined}
            onClick={() => onSelect(i)}
            style={{
              '--fx': `${face.x}%`,
              '--fy': `${face.y}%`,
              '--ax': `${face.arc.x}%`,
              '--ay': `${face.arc.y}%`,
            }}
            className={`prism-face pointer-events-auto absolute -translate-y-1/2 max-lg:left-[var(--ax)] max-lg:top-[var(--ay)] max-lg:-translate-x-1/2 lg:top-[var(--fy)] lg:left-[var(--fx)] ${
              face.side === 'left' ? 'lg:-translate-x-full' : ''
            }`}
          >
            <span className="flex items-center gap-2.5 max-lg:flex-col max-lg:gap-1.5 lg:gap-3">
              {/* The marker. Two elements: a solid core that is
                  always there, and a ring that only opens on the
                  active face — a glow would be the wrong idiom for
                  a section this quiet, and a size change alone is
                  invisible at 4px. */}
              <span className="prism-node" />

              <span className="prism-face-type max-lg:contents">
                <span className="prism-face-n t-num block">{mode.n}</span>
                <span className="prism-face-w t-label block max-lg:hidden">{mode.word}</span>
                {/* The fine line extension. Grows from the side the
                    label reads towards, so it always travels away
                    from the room rather than back into it. */}
                <span className="prism-face-rule max-lg:hidden" />
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
