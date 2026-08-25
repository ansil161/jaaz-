import {
  useGsapScope,
  gsap,
  ScrollTrigger,
  SplitText,
  revealLines,
  prefersReducedMotion,
} from '../../lib/useGsap'

/* ============================================================
   MOTION PRIMITIVES

   Two families, and the difference is the whole point:

   ENTRANCES fire once when a block arrives — Lines, Rise, Rule.
   They introduce content and then stop.

   SCROLL-LINKED behaviour runs continuously for as long as the
   element is on screen — Figure's parallax, Drift, ScrubText,
   Marquee's velocity coupling. Nothing on the page is fully at
   rest while you are moving. That is what stops a layout this
   restrained from reading as a static poster.

   All of it collapses to a legible, motionless page under
   `prefers-reduced-motion`.
   ============================================================ */

/**
 * <Lines> — masked line reveal. The entrance for prose and headings.
 */
export function Lines({
  as: Tag = 'p',
  className = '',
  children,
  start = 'top 84%',
  stagger = 0.085,
  delay = 0,
  ...rest
}) {
  const ref = useGsapScope((el) => {
    revealLines(el, { start, stagger, delay })
  }, [])

  return (
    <Tag ref={ref} className={className} style={{ visibility: 'hidden' }} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * <ScrubText> — the sentence resolves out of the dark AS YOU SCROLL,
 * word by word, and un-resolves if you scroll back. Reserved for the
 * few statements the page is actually built around; everywhere else
 * it would be exhausting.
 */
export function ScrubText({
  as: Tag = 'p',
  className = '',
  children,
  dim = 0.12,
  start = 'top 80%',
  end = 'top 25%',
  ...rest
}) {
  const ref = useGsapScope((el) => {
    gsap.set(el, { autoAlpha: 1 })
    if (prefersReducedMotion()) return

    /* autoSplit re-splits on resize; onSplit rebuilds the tween against
       the new word boxes, so the effect survives a rotation. */
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: dim },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.4,
            scrollTrigger: { trigger: el, start, end, scrub: true },
          },
        ),
    })
  }, [])

  return (
    <Tag ref={ref} className={className} style={{ visibility: 'hidden' }} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * <Rise> — fade-and-rise entrance for anything that isn't text.
 */
export function Rise({
  as: Tag = 'div',
  className = '',
  children,
  y = 30,
  stagger = 0.09,
  start = 'top 86%',
  selector,
  ...rest
}) {
  const ref = useGsapScope((el) => {
    const targets = gsap.utils.toArray(selector ? el.querySelectorAll(selector) : el.children)
    if (!targets.length) return
    if (prefersReducedMotion()) {
      gsap.set(targets, { autoAlpha: 1, y: 0 })
      return
    }
    gsap.from(targets, {
      autoAlpha: 0,
      y,
      duration: 1.15,
      stagger,
      ease: 'jaz',
      scrollTrigger: { trigger: el, start, once: true },
    })
  }, [])

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * <Drift> — scroll-linked counter-movement. Wrap a heading, caption or
 * number in this and it travels at a different rate to the image beside
 * it, so the two are never locked together. This is most of what makes
 * a page feel like it has depth rather than layers.
 *
 * `y` / `x` are half-ranges in percent: y={6} travels -6% → +6%.
 */
export function Drift({
  as: Tag = 'div',
  className = '',
  children,
  y = 0,
  x = 0,
  start = 'top bottom',
  end = 'bottom top',
  ...rest
}) {
  const ref = useGsapScope((el) => {
    if (prefersReducedMotion() || (!y && !x)) return
    gsap.fromTo(
      el,
      { yPercent: -y, xPercent: -x },
      {
        yPercent: y,
        xPercent: x,
        ease: 'none',
        scrollTrigger: { trigger: el, start, end, scrub: true },
      },
    )
  }, [])

  return (
    <Tag ref={ref} className={`will-change-transform ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * <Rule> — a hairline that draws itself in from the left.
 */
export function Rule({ className = '', start = 'top 92%' }) {
  const ref = useGsapScope((el) => {
    if (prefersReducedMotion()) return
    gsap.from(el, {
      scaleX: 0,
      duration: 1.5,
      ease: 'jaz',
      scrollTrigger: { trigger: el, start, once: true },
    })
  }, [])

  return (
    <div
      ref={ref}
      className={`h-px w-full origin-left bg-current opacity-15 ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * <Figure> — the only way images enter this site.
 *
 * Two things always happen: a clip-path wipes the frame open once (the
 * picture is UNCOVERED, not grown), and the image keeps drifting inside
 * its own frame for as long as it is on screen. That second part is why
 * parallax defaults ON — an image that stops moving the instant it has
 * arrived is exactly what makes a page feel dead.
 */
export function Figure({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  /* Per-plate grading that has to CHANGE after mount — `.plate` builds
     its filter out of custom properties, so setting `--plate-grayscale`
     here and transitioning `filter` is how a plate resolves from
     desaturated to full colour. A class can't do it: the value is
     driven by React state, not by a breakpoint. Merged over the
     parallax positioning below rather than replacing it. */
  imgStyle,
  parallax = 9,
  scaleFrom = 1.24,
  start = 'top 88%',
  priority = false,
  placeholder = 'bg-ink-3',
  children,
}) {
  const ref = useGsapScope((el) => {
    const img = el.querySelector('img')
    if (prefersReducedMotion()) {
      gsap.set([el, img], { clipPath: 'none', scale: 1 })
      return
    }

    gsap.fromTo(
      el,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.5,
        ease: 'jaz-io',
        scrollTrigger: { trigger: el, start, once: true },
      },
    )
    gsap.fromTo(
      img,
      { scale: scaleFrom },
      {
        scale: 1,
        duration: 1.8,
        ease: 'jaz',
        scrollTrigger: { trigger: el, start, once: true },
      },
    )

    /* Its own always-live trigger, so it keeps running long after the
       entrance has finished. */
    if (parallax) {
      gsap.fromTo(
        img,
        { yPercent: -parallax },
        {
          yPercent: parallax,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }
  }, [])

  return (
    <figure ref={ref} className={`relative overflow-hidden ${placeholder} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
        className={`plate ${imgClassName}`}
        /* Oversized so there is real image to travel through; a
           parallaxed element sized 100% would show its own edge. */
        style={
          parallax
            ? { position: 'absolute', inset: 0, height: '128%', top: '-14%', ...imgStyle }
            : imgStyle
        }
      />
      {children}
    </figure>
  )
}

/**
 * <Counter> — tabular numerals that count up once, on arrival.
 */
export function Counter({ to, suffix = '', className = '' }) {
  const ref = useGsapScope((el) => {
    if (prefersReducedMotion()) {
      el.textContent = `${to}${suffix}`
      return
    }
    const state = { v: 0 }
    gsap.to(state, {
      v: to,
      duration: 2.2,
      ease: 'jaz',
      snap: { v: 1 },
      onUpdate: () => {
        el.textContent = `${Math.round(state.v)}${suffix}`
      },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  }, [])

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  )
}

/**
 * <Magnetic> — the cursor pulls the element toward itself.
 * Primary CTAs only; used more widely it becomes noise.
 */
export function Magnetic({ children, strength = 0.32, className = '' }) {
  const ref = useGsapScope((el) => {
    if (prefersReducedMotion() || window.matchMedia('(hover: none)').matches) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'jaz' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'jaz' })

    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const reset = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', reset)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', reset)
    }
  }, [])

  return (
    <div ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </div>
  )
}

/**
 * <Marquee> — an endless rail whose speed is COUPLED TO SCROLL
 * VELOCITY. Scroll hard and it surges; stop and it eases back to its
 * idle drift. It is the clearest signal on the page that the layout is
 * responding to you rather than merely playing at you.
 *
 * The track holds its content twice and travels exactly 50%, so the
 * loop has no seam.
 */
export function Marquee({ children, duration = 42, reverse = false, className = '' }) {
  const ref = useGsapScope((el) => {
    const track = el.querySelector('[data-mq-track]')
    if (prefersReducedMotion()) return

    gsap.set(track, { xPercent: reverse ? -50 : 0 })
    const tween = gsap.to(track, {
      xPercent: reverse ? 0 : -50,
      duration,
      ease: 'none',
      repeat: -1,
    })

    /* Speed lives in a plain object that we push into `timeScale()`
       explicitly, rather than tweening the tween's property directly.
       `getVelocity()` can hand back a non-finite value (notably around
       programmatic jumps), and a NaN timeScale silently freezes the
       playhead forever — the rail just stops, with no error. Guarding
       the input and going through the method keeps that impossible. */
    const speed = { v: 1 }
    const applySpeed = () => tween.timeScale(speed.v)

    const velocityTrigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const raw = self.getVelocity()
        const velocity = Number.isFinite(raw) ? Math.abs(raw) : 0
        // px/sec; /400 turns a brisk flick into roughly 3x idle speed.
        const surge = gsap.utils.clamp(0, 4, velocity / 400)
        gsap.to(speed, {
          v: 1 + surge,
          duration: 0.5,
          ease: 'jaz',
          overwrite: true,
          onUpdate: applySpeed,
        })
      },
    })

    return () => {
      velocityTrigger.kill()
      tween.kill()
    }
  }, [])

  return (
    <div ref={ref} className={`edge-fade-x overflow-hidden ${className}`}>
      <div data-mq-track className="flex w-max will-change-transform">
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
