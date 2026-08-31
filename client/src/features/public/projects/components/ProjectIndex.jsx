import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { projects, projectFilters, projectsIntro } from '@/features/public/data/projects'
import ProjectCards from './ProjectCards'
import ProjectFilter from './ProjectFilter'
import { ScrubText } from '@/features/public/components/Motion'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/animation/useGsap'

/* ============================================================
   THE COLLECTION — the statement, the filter, then the rows.

   EVERY PROJECT IS THE SAME SIZE, and the ORDER carries what an
   earlier lead/rest split used to. This page once gave the first
   project a full screen of photograph and three screens of
   scroll, and handed every other project a card one scale down.
   That contrast worked, but it spent most of the page on one
   room and asked the visitor to take the other five on a
   photograph and a line.

   <ProjectCards> now lays every project out as one full-width
   row, alternating text and photograph side to side down the
   page, hairline-separated. It briefly ran as a sticky stack
   where each panel was covered by the next; that is gone
   deliberately. Nothing pins and nothing overlaps — every row
   stays in normal flow and stays findable, which is worth more
   on a page whose job is letting someone go back and compare two
   rooms than any amount of scroll choreography.

   `<ProjectChapter>` is what ran the old lead. It is no longer
   imported here and nothing else uses it; it is left on disk
   rather than deleted because it is the only implementation of
   the full-screen chapter composition, and that is a content
   decision to reverse, not a cleanup.

   THE FILTER CHANGEOVER IS A CUT, NOT A REPLACEMENT.
   Swapping the list under the visitor is technically instant and
   experientially awful: the collection is several screens deep,
   so a filter applied part-way down it leaves you looking at the
   middle of a project that no longer exists, at a scroll position
   that now means something else.

   So the change is staged, in the order a cut is:
     1. the collection fades down and settles a little,
     2. the list is swapped while nothing is visible,
     3. the page is returned to the head of the collection,
     4. every trigger on the page is re-measured — the document
        just changed height by several screens,
     5. the new set is revealed.

   Step 4 is still required even though the row entrances no
   longer depend on it — those run on an IntersectionObserver now
   and re-arm themselves. It is the SCRUBBED statement above the
   filter that needs it: its trigger was measured against a
   document that has just changed height by several screens, and
   an unrefreshed scrub resolves at the wrong scroll positions.
   ============================================================ */

const OUT = 0.42
const IN = 0.9

export default function ProjectIndex() {
  const [active, setActive] = useState('all')
  const section = useRef(null)
  const list = useRef(null)
  const busy = useRef(false)

  /* The filter this effect last acted on, NOT a "have I mounted yet"
     flag. The difference is the whole correctness of the changeover.

     StrictMode mounts, unmounts and remounts every component in
     development, so an effect guarded by a first-run flag runs its
     body on the SECOND mount — and the body here scrolls the page to
     the head of the collection. The page opened one viewport down,
     past its own hero, on every load. Nothing errored and the flag
     read exactly as intended.

     Comparing against the value the effect last handled cannot fail
     that way: a remount re-runs the effect with `active` unchanged,
     which is by definition not a filter change. */
  const handled = useRef(active)

  const shown = useMemo(
    () => (active === 'all' ? projects : projects.filter((p) => p.tags.includes(active))),
    [active],
  )

  /* Every match is laid out, at one size, in data order. There is no
     lead/rest split and no featured flag — the row order is the whole
     hierarchy, so reordering data/projects.js is how you re-rank the
     collection. */
  const any = shown.length > 0

  const select = useCallback(
    (id) => {
      if (id === active || busy.current) return
      const el = list.current

      if (prefersReducedMotion() || !el) {
        setActive(id)
        return
      }

      busy.current = true
      gsap.to(el, {
        autoAlpha: 0,
        y: 24,
        duration: OUT,
        ease: 'jaz-io',
        overwrite: true,
        onComplete: () => setActive(id),
      })
    },
    [active],
  )

  /* Steps 3–5. A layout effect rather than a timeline callback: it is
     guaranteed to run after React has committed the new content AND
     after its own layout effects have created their triggers, which is
     the only moment at which a refresh measures the real page. */
  useLayoutEffect(() => {
    if (handled.current === active) return
    handled.current = active

    const el = list.current
    const top = section.current
    if (!el || !top) return

    /* Land on the head of the collection — the filter row itself, not
       the top of the document, because the visitor asked a question
       here and the answer should start where they asked it. */
    const lenis = window.__lenis
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true })
    else top.scrollIntoView()

    ScrollTrigger.refresh()

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, y: 0 })
      busy.current = false
      return
    }

    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 24 },
      {
        autoAlpha: 1,
        y: 0,
        duration: IN,
        ease: 'jaz',
        overwrite: true,
        onComplete: () => {
          busy.current = false
        },
      },
    )
  }, [active])

  return (
    <section ref={section} className="relative bg-ink pt-[17vh] pb-[6vh]" aria-label="Selected work">
      {/* The dot field. The rows sit directly on the page's black with
          nothing drawn around them, and this is the only thing giving
          that ground a surface to be — without it the hairlines between
          rows are the sole texture on several screens of scroll. Masked
          to a soft centre so it never reaches an edge and reveals itself
          as a rectangle of pattern. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--color-cove) 0.8px, transparent 0.8px)',
          backgroundSize: '26px 26px',
          opacity: 0.05,
          maskImage: 'radial-gradient(120% 70% at 50% 22%, #000 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 70% at 50% 22%, #000 20%, transparent 78%)',
        }}
      />

      <div className="shell-wide relative">
        {/* The one statement the page is built around, so it earns the
            scrub — it resolves word by word as you come down onto it and
            un-resolves if you go back up. */}
        <ScrubText
          as="p"
          className="t-cinema max-w-[22ch] text-bone"
          dim={0.14}
          start="top 85%"
          end="top 38%"
        >
          {projectsIntro.standfirst}
        </ScrubText>
      </div>

      <div className="mt-[9vh]">
        <ProjectFilter
          filters={projectFilters}
          active={active}
          onSelect={select}
          shown={shown.length}
          total={projects.length}
        />
      </div>

      <div ref={list} className="relative mt-[8vh] pb-[12vh]">
        {!any ? (
          /* Cannot happen with the current six — every filter in the
             list is derived from a tag some project carries. It is here
             because the list is data, the data will grow, and a
             portfolio that renders a blank screen is worse than one
             that says so. */
          <div className="shell-wide py-[18vh]">
            <p className="t-heading text-bone">Nothing in this category yet.</p>
            <button
              type="button"
              onClick={() => select('all')}
              className="t-label focus-ring mt-6 border-b border-white/25 pb-1 text-mist transition-colors duration-500 hover:text-bone"
            >
              Show every project
            </button>
          </div>
        ) : (
          <ProjectCards items={shown} resetKey={active} />
        )}
      </div>
    </section>
  )
}
