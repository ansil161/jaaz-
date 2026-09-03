import { useEffect, useRef, useState } from 'react'
import { spaces } from '@/features/public/data/site'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   SPACES — THE CARD CAROUSEL

   A self-contained rotating card zone. It owns its own active
   index and its own clock, and it takes nothing from the section
   around it but the list of rooms.

   THE CARD IS A PANEL, NOT A PHOTOGRAPH WITH TYPE ON IT.
   Each card is a surface — `.panel-soft`, the house's rounded
   wash-and-hairline — holding two stacked sections: the room
   above, everything the room IS below. The type sits on the
   panel, not on the picture.

   That is a real change and not a cosmetic one. Type over a
   photograph needs a scrim, the scrim has to be tuned to the
   darkest plate in the set, and the tuning is then wrong for
   the brightest — which is why the overlay version carried a
   two-thirds-height gradient over every image regardless of
   what was underneath it. Stacked, the photograph is shown at
   full strength because nothing has to be read through it.

   WHY IT IS ITS OWN FILE
   Because the state has to live BELOW the section heading, not
   beside it. When `active` sat in <Spaces>, every tick of the
   autoplay re-rendered the whole section — label, heading,
   standfirst, closing line — to change one number. Nothing
   moved on screen, so it was invisible, but the left panel is
   now not in this component's tree at all: changing the card
   cannot move the heading, because React is never asked to look
   at the heading.

   NOTHING HERE IS A CONTROL.
   No arrows, no pager buttons, no clickable cards. The `01/06`
   below the row is a readout, not a switch. The one concession
   is that the clock stops while a pointer is over the zone or
   focus is inside it — that is not a control, it is the
   carousel declining to move something you are in the middle of
   reading.

   THE TRANSPORT NEEDS NO MEASUREMENT
   The viewport is padded by exactly half its leftover width, so
   the track's content box is exactly one slot wide — and since
   every slot is also one slot wide, ONE CARD IS 100% OF THE
   TRACK:

     padding-inline: calc((100% - var(--card-w)) / 2)
     transform:      translateX(-{active * 100}%)

   No `calc` and no `var` in the transform, no
   `getBoundingClientRect` anywhere, and it stays correct at
   every width — `100%` is the COLUMN this is dropped into, not
   the screen.

   It only holds while the gutters are `padding-inline` inside
   each slot. A flex `gap` on the row would make the track wider
   than N slots and one card would stop being 100%.

   A DEBUGGING NOTE. `getComputedStyle(track).transform` returns
   the identity matrix in a backgrounded tab no matter what the
   style attribute says, because a CSS transition does not
   advance while the tab is throttled. The row looks frozen and
   it is not. Judge this from a screenshot.
   ============================================================ */

/* How long a card holds before the row advances, and how long the
   move itself takes. The two are one setting, not two.

   At DWELL 1000 the glide has to come down with it. A 900ms
   transition inside a 1000ms cycle leaves a card still for about a
   tenth of a second — the row never settles, and what reads is
   continuous sliding rather than a carousel with steps in it. At
   520 there is roughly half a second of rest between moves, which
   is the least that still reads as arriving somewhere.

   If this is ever slowed back down, raise both: the glide should
   stay near half the dwell. */
const DWELL = 1000
const GLIDE_MS = 520

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const GLIDE = `transform ${GLIDE_MS}ms ${EASE}, opacity ${GLIDE_MS}ms ${EASE}`

export default function SpacesCarousel({ items = spaces.items }) {
  const N = items.length
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const viewport = useRef(null)

  /* Off screen and hovered/focused both stop the clock. A carousel
     turning over where nobody is looking is work the device does for
     no one; one that keeps moving under a cursor is one you cannot
     finish reading. */
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      threshold: 0.3,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* `% N` is the loop: the last card hands back to the first with no
     rewind, because the row is a ring as far as the index is
     concerned. */
  useEffect(() => {
    if (held || !onScreen) return
    const id = setTimeout(() => setActive((i) => (i + 1) % N), DWELL)
    return () => clearTimeout(id)
  }, [active, held, onScreen, N])

  return (
    <div
      style={{
        /* SLOT width — the card plus its two gutters. A percentage, so
           it is a fraction of whatever column this lands in.

           Declared HERE, on the wrapper, and read by the two children
           that need the same inset: the viewport and the readout. Both
           are full-width children of this div, so the percentage
           resolves against the same base in both. */
        '--card-w': 'min(86%, 34rem)',
        '--gap': 'clamp(0.75rem, 2vw, 1.75rem)',
      }}
    >
      <div
        ref={viewport}
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={() => setHeld(false)}
        className="overflow-hidden"
        style={{ paddingInline: 'calc((100% - var(--card-w)) / 2)' }}
      >
        <ul
          className="flex items-stretch"
          style={{ transform: `translateX(-${active * 100}%)`, transition: GLIDE }}
        >
          {items.map((s, i) => {
            const on = i === active

            return (
              <li
                key={s.n}
                className="shrink-0"
                /* `100%`, NOT `var(--card-w)`.

                   The viewport's padding already makes the track's
                   content box exactly one slot wide, so 100% of the
                   track IS the slot — and the width is then stated in
                   one place instead of two.

                   `--card-w` here would be a percentage resolving
                   against the TRACK while the same token in the
                   padding resolves against the VIEWPORT. Two different
                   bases, two different pixel values, and the slot
                   quietly stops matching the step: the row drifts a
                   little further left on every advance, and by the
                   last card it is visibly clipped. Nothing errors.

                   The gutters live in here rather than as `gap` on the
                   row — see the note at the top of the file. */
                style={{ width: '100%', paddingInline: 'calc(var(--gap) / 2)' }}
              >
                {/* The scale is HERE and the translate is on the row.
                    Both on one element means one writes `transform`
                    over the other, and the card either never moves or
                    never shrinks. */}
                <article
                  aria-hidden={!on}
                  className="panel-soft h-full overflow-hidden"
                  style={{
                    transition: GLIDE,
                    transform: on ? 'scale(1)' : 'scale(0.9)',
                    opacity: on ? 1 : 0.4,
                  }}
                >
                  {/* ---- Top: the room ---- */}
                  <div className="relative aspect-16/10 overflow-hidden bg-ink-2">
                    <img
                      src={s.image}
                      alt={s.title}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      decoding="async"
                      draggable="false"
                      /* One shared grade across all six. Mixed sources
                         will never be a single shoot, but a common
                         curve gets them close to reading as one set.
                         No scrim and no dimming: nothing is read
                         through this picture any more. */
                      className="plate absolute inset-0 [--plate-brightness:1.04] [--plate-contrast:1.06] [--plate-saturate:0.9]"
                    />
                  </div>

                  {/* ---- Bottom: what it is ---- */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-3.5">
                      <Mark name={s.icon} size={21} className="shrink-0 text-cove" />
                      <h3 className="t-heading text-[clamp(1.35rem,2.2vw,2rem)] text-pure">
                        {s.title}
                      </h3>
                    </div>
                    <p className="t-sub mt-2 text-bone">{s.line}</p>

                    <p className="t-num mt-5 border-t border-white/[0.09] pt-4 text-[0.6875rem] leading-relaxed text-mist">
                      {s.meta}
                      <span className="mt-1 block text-ash">
                        {s.dim} &nbsp;·&nbsp; {s.spec}
                      </span>
                    </p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ---- The readout ----
          Six ticks, the active one lit, and no numeral. A position
          indicator drawn as a scale rather than as dots, because dots
          are the universal sign for "these are buttons" and none of
          these are.

          Inset by the same padding the viewport uses, so it starts at
          the active card's left edge rather than under a peek.

          `aria-hidden`, and no `aria-live`: this advances on its own
          every three seconds, and announcing that twenty times a
          minute would be noise. The cards are the content, and the
          inactive ones are hidden, so a screen reader gets the active
          room and nothing else. */}
      {/* WAS SIX HAIRLINE TICKS. A strip of thin rules along the
          bottom of a stage is the one carousel read-out this site has
          ruled out by name, and it was doing the same job the ordinals
          were doing everywhere else: reporting a position nobody had
          asked for. Six marks say which ROOM you are on — the same six
          marks that head the cards — and the one you are on is lit. */}
      <div
        aria-hidden="true"
        className="mt-7 flex items-center gap-5"
        style={{ paddingInline: 'calc((100% - var(--card-w)) / 2)' }}
      >
        {items.map((s, i) => (
          <Mark
            key={s.n}
            name={s.icon}
            size={19}
            className={`transition-opacity duration-700 ${
              i === active ? 'text-pure opacity-100' : 'text-fog opacity-40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
