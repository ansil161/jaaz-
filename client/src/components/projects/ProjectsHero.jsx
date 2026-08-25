import { projectsIntro } from '../../data/projects'
import Words from '../solutions/Words'
import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   PROJECTS — THE HERO

   One photograph, one word, one sentence. The page below it is
   six rooms long, so this has exactly one job and summarising
   them is not it: it is to establish that what follows is
   photography, held at full size, taken slowly.

   THE ENTRANCE IS THE PLATE, NOT THE TYPE.
   The word PROJECTS rises once from behind a mask and stops.
   There is no per-character stagger, no scramble, no split on
   the sentence underneath. On a page whose entire argument is
   the quality of the rooms, animated lettering is the one thing
   that would make it look like a template — and the brief said
   so directly. What actually moves is the room: the plate
   arrives at 1.14 and settles over nearly three seconds, which
   is slow enough to read as a camera rather than as a CSS
   transition.

   THE HANDOVER
   The hero does not end, it is COVERED. As it leaves, the plate
   sinks at one rate and the copy lifts and fades at another, so
   the screen comes apart in depth instead of sliding away in one
   piece — the same dissolve the Solutions overture uses, because
   this site's sections hand over by being covered rather than by
   being divided.
   ============================================================ */

export default function ProjectsHero() {
  const { title, sub, scrollHint, hero, heroAlt } = projectsIntro

  const root = useGsapScope((el) => {
    const q = (sel) => el.querySelector(sel)
    const qa = (sel) => gsap.utils.toArray(el.querySelectorAll(sel))

    const img = q('[data-hero-img]')
    const words = qa('[data-word]')
    const lift = qa('[data-lift]')
    const copy = q('[data-copy]')
    const tick = q('[data-tick]')

    if (prefersReducedMotion()) {
      gsap.set(lift, { autoAlpha: 1, y: 0 })
      gsap.set(words, { yPercent: 0 })
      return
    }

    gsap
      .timeline({ defaults: { ease: 'jaz' } })
      .from(img, { scale: 1.14, duration: 2.8 }, 0)
      .fromTo(
        words,
        { yPercent: 108 },
        { yPercent: 0, duration: 1.4, ease: 'power3.out' },
        0.4,
      )
      .fromTo(
        lift,
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 1.15, stagger: 0.14 },
        0.95,
      )

    /* The scroll cue travels its own rule on a loop — the only
       repeating motion on the page, and the only place one is earned:
       it is an instruction, and an instruction that does not move is
       not read. */
    if (tick) {
      gsap.fromTo(
        tick,
        { scaleY: 0, transformOrigin: 'top' },
        {
          scaleY: 1,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          repeatDelay: 0.35,
          transformOrigin: 'top',
          onRepeat: () => gsap.set(tick, { transformOrigin: 'top' }),
        },
      )
    }

    /* Two rates out. */
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(img, { yPercent: 0 }, { yPercent: 10, duration: 1 }, 0)
      .fromTo(copy, { yPercent: 0, autoAlpha: 1 }, { yPercent: -24, autoAlpha: 0, duration: 1 }, 0)
  }, [])

  const hidden = { opacity: 0, visibility: 'hidden' }

  return (
    <section
      ref={root}
      className="relative flex h-[var(--app-h)] min-h-[34rem] flex-col justify-end overflow-hidden bg-ink"
    >
      <img
        data-hero-img
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="100vw"
        alt={heroAlt}
        fetchPriority="high"
        decoding="async"
        draggable="false"
        className="plate absolute inset-0 [--plate-brightness:0.58] [--plate-contrast:1.1] [--plate-saturate:0.88]"
        style={{ height: '116%', top: '-8%' }}
      />

      {/* Two washes, not one. The vertical gradient buys the type its
          contrast; the warm pool at the base is the same cove light
          every other opening screen on this site sits in, and it is
          what stops a black scrim reading as a black scrim. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.68) 28%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(78% 52% at 50% 104%, rgba(201, 173, 124, 0.17) 0%, rgba(201, 173, 124, 0.05) 42%, transparent 70%)',
        }}
      />

      <div data-copy className="shell-wide relative pb-[8vh]">
        <Words
          as="h1"
          text={title}
          className="t-mega text-bone uppercase"
          wordClassName="tracking-[-0.03em]"
        />

        <div className="mt-10 grid gap-8 sm:grid-cols-12 sm:items-end">
          <p data-lift className="t-sub max-w-[38ch] text-fog sm:col-span-6" style={hidden}>
            {sub}
          </p>

          {/* The scroll cue. A drawn rule that fills downward, with the
              instruction set beside it — not a bouncing chevron, and not
              a mouse pictogram for a site half of whose visitors will
              never touch one. */}
          <div
            data-lift
            className="flex items-center gap-4 sm:col-span-4 sm:col-start-9 sm:justify-end"
            style={hidden}
          >
            <span className="t-label text-mist">{scrollHint}</span>
            <span className="relative block h-10 w-px overflow-hidden bg-white/15" aria-hidden="true">
              <span data-tick className="absolute inset-0 block bg-cove" />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
