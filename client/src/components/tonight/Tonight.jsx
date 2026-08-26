import { useCallback, useEffect, useRef, useState } from 'react'
import { tonight, nights, nightTotal } from '../../data/tonight'
import { Lines } from '../ui/Motion'
import ExperienceVideo from './ExperienceVideo'
import ExperienceContent from './ExperienceContent'
import ExperienceNavigation from './ExperienceNavigation'

/* ============================================================
   WHAT'S TONIGHT? — the interactive stage

   The homepage spends eleven sections proving JAAZ can build the
   room. This is the one that says what the room is FOR: six
   evenings in the same house, swapped in place, never a page
   change. It is the only section on the site the visitor drives
   rather than scrolls past, and that is the point — you cannot
   argue someone into wanting a Friday night, you can only let
   them picture six and watch which one they linger on.

   THE COMPOSITION
   Type column left, media right, instrument rail across the
   foot. Three things carry it and none of them are decoration:

   1. THE MEDIA BLEEDS OFF THE RIGHT EDGE, AND IT TAKES 70%. The
      grid is ten columns, not twelve, so the frame can hold seven
      of them exactly — and it still runs out of the page on top of
      that. A 50/50 split reads as two panels of equal rank; at
      70/30 the left column reads as a caption to something larger
      than the screen, which is the relationship we want.
   2. THE NUMERAL IS HOLLOW AND ENORMOUS. It is the loudest thing
      in the column, louder than the name it labels, because the
      section is a set of six and the count is the subject.
   3. THE RAIL IS CELLS, NOT DOTS. See ExperienceNavigation.

   ONE GRID, TWO COMPOSITIONS
   Desktop is the split above. Mobile is not that shrunk — the
   line goes UNDER THE VIDEO, which means the copy and the frame
   have to be siblings in one grid and place themselves per
   breakpoint rather than living in two nested columns. That is
   why `<ExperienceContent>` returns loose grid items; see the
   note in that file.

   WHAT IS DELIBERATELY ABSENT: AUTOPLAY
   No timer advances this. A carousel that moves on its own is
   telling you what to look at, and this section's entire claim is
   that the choice is yours.

   KEYBOARD, AND WHY THE NUMBER KEYS ARE GATED
   Arrow keys, Home and End come free from the ARIA tablist in
   `<ExperienceNavigation>` and only apply while focus is inside
   it — the correct, unsurprising scope. The 1–6 shortcuts are an
   extra, and a global listener that hijacks digits anywhere on a
   long homepage is a bug, not a feature. They are therefore live
   only while this section is actually on screen and the visitor
   is not typing into something.
   ============================================================ */

const TAB_ID = 'tonight-tab'
const PANEL_ID = 'tonight-panel'

export default function Tonight() {
  const [index, setIndex] = useState(0)
  /* What the tag on the plate is currently naming. Lags `index` by the
     length of the column's swap so the caption and the picture change
     together — see `onShown` in ExperienceContent. */
  const [captioned, setCaptioned] = useState(() => nights[0])
  const root = useRef(null)
  const inView = useRef(false)

  const count = nights.length
  const night = nights[index]
  const nextIndex = (index + 1) % count

  const select = useCallback((i) => setIndex(((i % count) + count) % count), [count])
  const prev = useCallback(() => select(index - 1), [index, select])
  const next = useCallback(() => select(index + 1), [index, select])

  /* ---- Number keys, only while the section is on screen ---- */
  useEffect(() => {
    const el = root.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting
      },
      { threshold: 0.4 },
    )
    io.observe(el)

    const onKey = (e) => {
      if (!inView.current || e.metaKey || e.ctrlKey || e.altKey) return
      /* Never steal a digit from a field the visitor is filling in. */
      const t = e.target
      if (t?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName)) return

      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= count) {
        e.preventDefault()
        select(n - 1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [count, select])

  /* ---- Swipe. Horizontal intent only, so a swipe that is really a
          scroll still scrolls the page. ---- */
  const touch = useRef(null)
  const onTouchStart = (e) => {
    const t = e.changedTouches[0]
    touch.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touch.current.x
    const dy = t.clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    if (dx < 0) next()
    else prev()
  }

  return (
    <section
      id={tonight.id}
      ref={root}
      /* THE HEIGHT LOCK IS GATED ON HEIGHT, NOT JUST WIDTH.
         The composition wants one viewport, and it needs about
         700px to give it: nav clearance, a two-line display
         heading, the hollow numeral, a name, a line of copy and a
         130px rail do not compress below that without shrinking the
         numeral to the point where it stops being the loudest thing
         in the column — which is the design.

         So `kit-tall` (>=1024 wide AND >=760 tall) locks it to
         `--app-h`; anything shorter keeps the same desktop
         composition but lets the section run its natural height.
         The alternative — forcing one screen on a short window —
         overflows into the rail, and `overflow-hidden` then hides
         that it happened rather than fixing it.

         This is now the ONLY consumer of `kit-tall` — the
         `<Collections>` rail it was originally written for has
         been removed from the homepage. The gate is pure CSS
         here; there is no matching matchMedia in this file. */
      className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:pt-28 lg:pb-10 kit-tall:flex kit-tall:h-[var(--app-h)] kit-tall:flex-col kit-tall:py-0"
    >
      <div className="relative flex w-full flex-col kit-tall:h-full kit-tall:min-h-0">
        {/* ---- Stage: type left, media running off the right ---- */}
        <div className="shell-wide grid grid-cols-1 gap-y-7 lg:grid-cols-10 lg:grid-rows-[auto_1fr_auto] lg:items-start lg:gap-x-8 lg:pb-8 lg:pr-0 kit-tall:min-h-0 kit-tall:flex-1 kit-tall:pt-24">
          <div className="order-2 lg:order-none lg:col-span-3 lg:col-start-1 lg:row-start-1">
            {/* The scale lives on the WRAPPER, not on <Lines>. `Lines`
                ships its element with `visibility: hidden` so the split
                has somewhere to come from, and any `style` handed to it
                lands after that and silently overrides it — the heading
                would flash unsplit before the reveal. Font size
                inherits down to the split lines either way. */}
            <div
              style={{
                fontSize: 'clamp(2.2rem, min(3.9vw, 7.6vh), 4.4rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.03em',
              }}
            >
              <Lines as="h2" className="font-display text-pure" stagger={0.1}>
                {tonight.heading.map((line, i) => (
                  <span key={line} className="block">
                    {i === 1 ? (
                      <em className="italic-display" style={{ color: 'var(--color-cove)' }}>
                        {line}
                      </em>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </Lines>
            </div>

            {/* The short rule, then the one line that never changes.
                It keeps its 2px weight and its cove warmth now that the
                field behind it is gone: with flat ink underneath, the
                rule is the only warm mark holding the column's foot to
                the accent in the heading above it. */}
            <div
              className="mt-7 h-[2px] w-16 bg-gradient-to-r from-cove/80 via-cove/35 to-transparent"
              aria-hidden="true"
            />
            <p className="t-label mt-6 text-ash">{tonight.label}</p>
          </div>

          <ExperienceContent
            night={night}
            total={nightTotal}
            scopeRef={root}
            onShown={setCaptioned}
          />

          {/* Seven of ten columns, then off the right edge on top of
              that: `-mr-[var(--gutter)]` cancels the shell's own gutter
              and the extra 2vw pushes it past the viewport, so the frame
              is cropped by the screen rather than sitting in a margin. */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="relative order-4 aspect-[16/10] w-full lg:order-none lg:col-span-7 lg:col-start-4 lg:row-span-3 lg:row-start-1 lg:mr-[calc(-1*var(--gutter)-2vw)] lg:aspect-auto lg:h-full lg:min-h-0 lg:self-stretch lg:min-h-[26rem]"
          >
            <ExperienceVideo
              nights={nights}
              index={index}
              nextIndex={nextIndex}
              labelledBy={`${TAB_ID}-${night.key}`}
              panelId={PANEL_ID}
            />

            {/* The tag on the plate. Sits ON the media, bottom left,
                and names what you are looking at — the one place the
                night's full title appears at full width. */}
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2.5 border border-white/12 bg-ink/55 px-4 py-2.5 backdrop-blur-sm sm:bottom-6 sm:left-6">
              <span className="h-1.5 w-1.5 rounded-full bg-cove" aria-hidden="true" />
              <span className="t-label text-[0.65rem] text-bone">
                Night {captioned.n} — {captioned.title}
              </span>
            </div>
          </div>
        </div>

        {/* ---- The rail ---- */}
        <div className="shell-wide mt-12 shrink-0 lg:mt-4 kit-tall:mt-0 kit-tall:pb-8">
          <ExperienceNavigation
            nights={nights}
            index={index}
            onSelect={select}
            onPrev={prev}
            onNext={next}
            labels={{ group: tonight.group, prev: tonight.prev, next: tonight.next }}
            tabId={TAB_ID}
            panelId={PANEL_ID}
          />
        </div>
      </div>
    </section>
  )
}
