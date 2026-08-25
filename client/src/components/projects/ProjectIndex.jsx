import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { projects, projectFilters, projectsIntro } from '../../data/projects'
import ProjectChapter from './ProjectChapter'
import ProjectCards from './ProjectCards'
import ProjectFilter from './ProjectFilter'
import { Lines } from '../ui/Motion'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   THE COLLECTION — one project leads, the rest are cards.

   ONE SIZE FOR THE LEAD, ONE SIZE FOR EVERYTHING ELSE.
   The page's whole argument is the difference between those two
   sizes. Six full chapters gave every room the same weight,
   which is the same failure as a six-up grid one scale down —
   the visitor is handed six equal things and has to decide for
   themselves which one is worth their attention.

   Here the first project gets a full screen of photograph, a
   sticky running head and three screens of scroll; the rest get
   a photograph, a name and a line. Nothing is labelled
   "featured", because the composition already said it — a badge
   would only be repeating in words what the layout does better.

   WHICH PROJECT LEADS IS THE DATA'S ORDER, NOT A FLAG.
   `shown[0]` — the first project in the current view. With no
   filter on that is the first entry in data/projects.js, so
   reordering that array is how you change what leads. Under a
   filter it is the first MATCH, which is the only behaviour that
   cannot produce an empty stage: a `featured: true` flag would
   have to answer "what leads when the flagged project is
   filtered out", and every answer to that is this one anyway.

   THE FILTER CHANGEOVER IS A CUT, NOT A REPLACEMENT.
   Swapping the list under the visitor is technically instant and
   experientially awful: the lead chapter is close to three
   screens, so a filter applied inside it leaves you looking at
   the middle of a project that no longer exists, at a scroll
   position that now means something else.

   So the change is staged, in the order a cut is:
     1. the collection fades down and settles a little,
     2. the list is swapped while nothing is visible,
     3. the page is returned to the head of the collection,
     4. every trigger on the page is re-measured — the document
        just changed height by several screens,
     5. the new set is revealed.

   Step 4 is the one that is invisible until it is missing. The
   card entrances were measured against a document that no longer
   exists; without a refresh they fire at the wrong scroll
   positions, which reads as cards that are already arrived
   before you reach them.
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

  const lead = shown[0]
  const rest = shown.slice(1)

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
    <section ref={section} className="relative bg-ink pt-[12vh] pb-[6vh]" aria-label="Selected work">
      <div className="shell-wide">
        <Lines as="p" className="t-sub max-w-[46ch] text-fog">
          {projectsIntro.standfirst}
        </Lines>
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

      <div ref={list} className="mt-[8vh]">
        {!lead ? (
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
          <>
            <ProjectChapter key={lead.slug} project={lead} index={0} total={shown.length} />
            <ProjectCards items={rest} startIndex={1} resetKey={active} />
          </>
        )}
      </div>
    </section>
  )
}
