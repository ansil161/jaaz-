import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger, gsap, prefersReducedMotion } from '@/lib/animation/useGsap'
import { lifestyle, roomPlate } from '@/features/public/data/experience'
import { Link } from '@/features/public/router/PageTransition'
import { Lines } from '@/features/public/components/Motion'
import GradedPlate from './GradedPlate'

/* ============================================================
   THE HOUSE ACROSS ONE DAY — the closing sequence

   The last thing the visitor sees is not a summary of features.
   It is the house working, from morning to night, with the four
   spaces they have just configured appearing in the order a real
   day would visit them. The argument being made is the brief's
   own closing line: the technology has disappeared, and what is
   left is a day.

   HOW THE PIN WORKS, AND WHY IT IS CSS

   The stage is held with `position: sticky` and the scroll
   distance comes from a tall wrapper above it. GSAP's own pinning
   would work, but it rewrites the DOM around the pinned element,
   and on a page that already hands scroll to Lenis that is one
   more thing to keep in sync at every resize. Sticky is native,
   survives a resize with no measurement, and leaves ScrollTrigger
   with exactly one job: report progress.

   So the ONLY thing JavaScript decides here is which of the four
   chapters is current. Everything else — the cross-fade, the
   grade, the type — is CSS reacting to that one number.

   THE FALLBACK IS THE SAME CONTENT, NOT LESS OF IT

   Under reduced motion, or on a viewport too short to hold a
   pinned stage without clipping it, the four chapters stack and
   scroll normally. Nobody loses a beat of the sequence; they
   simply read it instead of watching it.
   ============================================================ */

/* Four chapters, one viewport of scroll each. Below this height a
   pinned 16:9 stage plus its heading does not fit, and the last
   line of the sequence gets cut off — the same constraint the
   horizontal rail on the homepage is gated on. */
const MIN_PIN_HEIGHT = 680

export default function Lifestyle({ className = '' }) {
  const root = useRef(null)
  const [index, setIndex] = useState(0)
  const [cinematic, setCinematic] = useState(false)

  const chapters = lifestyle.chapters

  /* Decide the mode once, and re-decide on resize. Doing this in
     JS rather than in a media query keeps the pin's height and
     the trigger's existence tied to the SAME condition — the way
     those two drifted apart is how a section ends up with no
     scroll distance and no way to reach its last chapter. */
  useEffect(() => {
    const decide = () => {
      const ok =
        !prefersReducedMotion() &&
        window.innerHeight >= MIN_PIN_HEIGHT &&
        window.matchMedia('(min-width: 768px)').matches
      setCinematic(ok)
      if (!ok) setIndex(0)
    }
    decide()
    window.addEventListener('resize', decide)
    return () => window.removeEventListener('resize', decide)
  }, [])

  useEffect(() => {
    const el = root.current
    if (!el || !cinematic) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        /* One state write per frame at most. `clamp` matters at
           the very end, where progress reaches exactly 1 and the
           floor would index one past the last chapter. */
        onUpdate: (self) => {
          const next = Math.min(
            chapters.length - 1,
            Math.floor(self.progress * chapters.length),
          )
          setIndex((prev) => (prev === next ? prev : next))
        },
      })
    }, el)

    return () => ctx.revert()
  }, [cinematic, chapters.length])

  const heading = (
    <Lines as="h2" className="t-display max-w-4xl text-pure" stagger={0.1}>
      {lifestyle.heading.map((line, i) => (
        <span key={line} className="block">
          {i === lifestyle.heading.length - 1 ? (
            <>
              {line.slice(0, line.lastIndexOf(' ') + 1)}
              <em className="italic-display text-cove">
                {line.slice(line.lastIndexOf(' ') + 1)}
              </em>
            </>
          ) : (
            line
          )}
        </span>
      ))}
    </Lines>
  )

  return (
    <section
      id="lifestyle"
      aria-label="The house across one day"
      className={`relative scroll-mt-24 border-t border-white/10 bg-ink ${className}`}
    >
      <div className="shell-wide pt-20 pb-14 sm:pt-28">
        {heading}
        <p className="t-sub mt-8 max-w-xl text-fog">{lifestyle.body}</p>
      </div>

      {cinematic ? (
        /* The tall wrapper is the scroll distance; the sticky
           child is what the visitor actually sees. */
        <div ref={root} style={{ height: `${chapters.length * 100}vh` }}>
          <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
            <div className="absolute inset-0">
              {chapters.map((c, i) => (
                <div
                  key={c.id}
                  className="absolute inset-0 transition-opacity duration-[1400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ opacity: i === index ? 1 : 0 }}
                  aria-hidden={i !== index}
                >
                  <GradedPlate
                    slot={roomPlate(c).slot}
                    alt={`${c.label} — ${roomPlate(c).alt ?? c.line}`}
                    grade={c.grade}
                    sizes="100vw"
                  />
                </div>
              ))}

              {/* A floor of ink under the type. The plates run the
                  full viewport here, and a headline sitting
                  directly on a bright morning render is the one
                  place on this page contrast could fail. */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0) 100%)',
                }}
                aria-hidden="true"
              />
            </div>

            <div className="shell-wide relative mt-auto pb-16">
              {/* The rail. Four marks, the current one lit — the
                  only navigation the sequence needs, and it doubles
                  as the progress indicator. */}
              <ul className="flex gap-8">
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <span
                      className={`t-label block text-[0.55rem] transition-colors duration-700 ${
                        i === index ? 'text-cove' : 'text-pure/35'
                      }`}
                    >
                      {c.label}
                    </span>
                    <span
                      className={`mt-2 block h-px w-full origin-left bg-cove transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        i === index ? 'scale-x-100' : 'scale-x-0'
                      }`}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>

              <p
                key={chapters[index].id}
                className="t-heading mt-8 max-w-2xl animate-[fade-plate_900ms_cubic-bezier(0.16,1,0.3,1)_both] text-[1.6rem] leading-snug text-pure sm:text-[2rem]"
              >
                {chapters[index].line}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Stacked. Same four beats, read rather than watched. */
        <div className="shell-wide space-y-12 pb-8">
          {chapters.map((c) => (
            <article key={c.id}>
              <div className="relative overflow-hidden bg-ink-3" style={{ aspectRatio: 16 / 9 }}>
                <GradedPlate
                  slot={roomPlate(c).slot}
                  alt={`${c.label} — ${roomPlate(c).alt ?? c.line}`}
                  grade={c.grade}
                />
              </div>
              <p className="t-label mt-5 text-[0.55rem] text-cove">{c.label}</p>
              <p className="t-body mt-2 max-w-xl text-fog">{c.line}</p>
            </article>
          ))}
        </div>
      )}

      {/* ---- The turn to the visitor ---- */}
      <div className="shell-wide border-t border-white/10 py-20 sm:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="t-sub max-w-lg text-fog">
            Send us the room as it stands today — a photograph, a plan, or the dimensions on the
            back of an envelope. We will show you what it could hold.
          </p>

          <div className="flex flex-wrap items-center gap-8">
            <Link to={lifestyle.cta.to} className="btn-flat focus-ring">
              {lifestyle.cta.label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="square"
                aria-hidden="true"
                className="btn-flat-arrow shrink-0"
              >
                <path d="M2.5 8h10.5" />
                <path d="M9 4l4 4-4 4" />
              </svg>
            </Link>

            <Link to={lifestyle.secondary.to} className="cta-footnote focus-ring">
              {lifestyle.secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
