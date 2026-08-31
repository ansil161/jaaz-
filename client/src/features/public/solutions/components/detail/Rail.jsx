import { useState } from 'react'
import { useGsapScope, ScrollTrigger } from '@/lib/animation/useGsap'

/* ============================================================
   ONE SOLUTION — THE SECTION INDEX

   A detail page here is five screens of specification, and the
   two questions a visitor arrives with are "is this mine?" and
   "what does it cost and how long does it take?". Both have
   answers on this page and neither is at the top of it. A
   scannable page still needs a way to skip.

   IT DOCKS BELOW THE NAV, NOT AT THE TOP
   <Nav> is `fixed top-0` and deliberately does not retract —
   that decision is written up in its own file — so a second bar
   at `top-0` would sit underneath it forever. This sticks at the
   nav's height instead, which is the one offset that leaves both
   readable.

   It is drawn as a scale with a travelling mark rather than a
   row of tabs, because that is the same instrument the
   catalogue's barrel is drawn as. A visitor arrives here from a
   lens; the page they land on should be built by the same hand.
   ============================================================ */

const NAV_OFFSET = -92

export default function Rail({ sections }) {
  const [active, setActive] = useState(sections[0]?.id)

  const root = useGsapScope(() => {
    const created = []

    /* Recomputed from ALL the triggers on every toggle, never set from
       the one that happened to fire.

       Handling only `isActive === true` looks equivalent and is not: a
       section going INACTIVE with nothing taking its place leaves the
       mark on a section the reader has left. That is exactly what
       happens on the first refresh — the triggers are built before the
       hero's photograph has loaded, so every section is measured at
       roughly the same place and whichever was created last wins; the
       page then settles, that one deactivates, and no `true` toggle
       ever arrives to correct it. The rail sat on "Rooms" from the top
       of the page. */
    const sync = () => {
      const hit = created.find((c) => c.st.isActive)
      /* Nothing active means the reading line is in a gap between two
         sections — the padding where one ends and the next has not
         begun. HOLDING the last mark is the honest reading of that;
         resetting to the first would send the mark back to the top of
         the page every time the reader crossed a section boundary. */
      setActive((prev) => (hit ? hit.id : prev))
    }

    sections.forEach((s) => {
      /* The ELEMENT, never the selector string.
         `useGsapScope` runs this inside a `gsap.context` scoped to the
         rail's own div, and a context scopes every selector string it
         is handed — so `'#fit'` is looked up INSIDE the rail, where
         none of these sections live. It does not throw; the triggers
         are simply built against nothing and toggle at meaningless
         scroll positions, which is why the mark sat on the wrong
         section and would not move. */
      const el = document.getElementById(s.id)
      if (!el) return

      created.push({
        id: s.id,
        st: ScrollTrigger.create({
          trigger: el,
          /* Both edges measured at the same line, so exactly one
             section is ever active and there is no band between two
             where the mark flickers. */
          start: 'top 42%',
          end: 'bottom 42%',
          onToggle: sync,
          /* Images settling changes every one of these positions. */
          onRefresh: sync,
        }),
      })
    })

    sync()
    return () => created.forEach((c) => c.st.kill())
  }, [sections])

  const go = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: NAV_OFFSET, duration: 1.3 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      ref={root}
      className="sticky top-[4.6rem] z-30 hidden border-b border-white/[0.07] bg-ink/85 backdrop-blur-md md:block"
    >
      <nav className="shell-wide flex items-center gap-8 py-3.5" aria-label="On this page">
        {sections.map((s) => {
          const on = s.id === active
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={on ? 'true' : 'false'}
              className="focus-ring group flex cursor-pointer flex-col gap-2 py-1"
            >
              <span
                className={`t-label transition-colors duration-500 ${
                  on ? 'text-bone' : 'text-ash group-hover:text-fog'
                }`}
              >
                {s.label}
              </span>
              <span
                aria-hidden="true"
                className={`h-px w-full origin-left transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  on ? 'scale-x-100 bg-cove' : 'scale-x-0 bg-cove'
                }`}
              />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
