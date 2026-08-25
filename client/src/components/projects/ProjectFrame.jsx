import { useGsapScope, gsap, prefersReducedMotion } from '../../lib/useGsap'

/* ============================================================
   PROJECT FRAME — the one way a photograph enters this section.

   Every plate on /projects and every /projects/:slug goes
   through this. That is deliberate and it is the whole reason
   the page reads as one hand: the reveal, the drift and the
   grading are decided once, here, rather than re-invented per
   composition.

   TWO SCROLL-LINKED THINGS, NEVER AN ENTRANCE
   1. The frame OPENS. A clip-path inset relaxes to zero as the
      plate crosses the lower half of the viewport — so the
      picture is uncovered rather than faded, and it is tied to
      the scroll rather than fired once. Scrub back up and it
      closes again. A portfolio whose images animate once and
      then sit still is a slideshow with a delay on it.
   2. The image DRIFTS inside the frame for as long as it is on
      screen. Subtle — a tenth of the frame, top to bottom.
      Enough that the picture is never locked to the page.

   `<Figure>` in components/ui already does a one-shot version of
   this for the rest of the site. This is its scroll-linked
   sibling, and it exists rather than a prop on Figure because
   the mechanics genuinely differ: Figure fires `once`, this one
   scrubs, and the two want opposite easing.

   NO `will-change` ON THE CLIPPED LAYER. Ever. It promotes a
   layer Chrome intermittently fails to rasterise, and the
   failure mode is the worst one available on a page like this:
   the frame draws, the photograph inside it stays black, and any
   unrelated repaint brings it back — so it looks like a loading
   bug rather than a compositing one. The drift lives on the
   <img>, which is a plain transform and safe to promote; the
   clip stays on the <figure> and is left alone.
   ============================================================ */

/**
 * <ProjectFrame>
 *
 * @param {string} src        Largest-step URL, from `plate()`.
 * @param {string} srcSet     Four widths, from `plate()`.
 * @param {number} ratio      Intrinsic ratio, from `plate()`. Reserves the
 *                            box so nothing on the page reflows on load.
 * @param {string} alt
 * @param {string} sizes      What share of the viewport this plate occupies,
 *                            so the browser can pick a step before layout.
 * @param {number} inset      How far in the clip starts, in percent. The
 *                            opening plate of a project uses more; a small
 *                            detail uses less.
 * @param {number} drift      Parallax half-range in percent. 0 disables it.
 * @param {number} scaleFrom  Where the image starts. Reaches 1 at the end
 *                            of the reveal, so the plate settles rather
 *                            than arriving already still.
 * @param {number} radiusFrom Corner radius at the start of the open,
 *                            interpolated to `radius` inside the SAME
 *                            clip-path value. That is why the corners can
 *                            relax as the frame widens without costing a
 *                            second animated property — and why it costs
 *                            no layout at all, which an animated
 *                            `border-radius` on a sized box does not.
 * @param {boolean} priority  Eager + high fetch priority. The hero only.
 */
export default function ProjectFrame({
  src,
  srcSet,
  ratio = 3 / 2,
  alt = '',
  sizes = '100vw',
  className = '',
  imgClassName = '',
  inset = 10,
  drift = 8,
  scaleFrom = 1.12,
  radius = 0,
  radiusFrom = null,
  priority = false,
  start = 'top 88%',
  end = 'top 32%',
  children,
}) {
  const root = useGsapScope((el) => {
    const img = el.querySelector('img')

    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: 'none' })
      gsap.set(img, { scale: 1, yPercent: 0 })
      return
    }

    /* One matchMedia for the whole component. Phones get a shallower
       open and half the drift — not because motion is a desktop luxury,
       but because a 12% inset on a 390px-wide plate is 47px of hidden
       picture, which reads as a broken crop rather than as a reveal. */
    const mm = gsap.matchMedia(el)

    mm.add(
      {
        wide: '(min-width: 768px)',
        narrow: '(max-width: 767px)',
      },
      (ctx) => {
        const { wide } = ctx.conditions
        const i = wide ? inset : inset * 0.45
        const d = wide ? drift : drift * 0.5
        const r0 = radiusFrom ?? radius

        /* The open. Horizontal inset is deliberately larger than the
           vertical: the frame widens INTO the composition, which is the
           gesture an architectural spread makes when a photograph runs
           to the gutter. Equal insets read as a zoom. */
        gsap.fromTo(
          el,
          { clipPath: `inset(${i * 0.85}% ${i}% ${i * 0.85}% ${i}% round ${r0}px)` },
          {
            clipPath: `inset(0% 0% 0% 0% round ${radius}px)`,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        )

        gsap.fromTo(
          img,
          { scale: scaleFrom },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start,
              end,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        )

        /* Its own trigger over the element's whole life on screen, so
           the drift is still running long after the frame has finished
           opening. This is the part that keeps the page alive. */
        if (d) {
          gsap.fromTo(
            img,
            { yPercent: -d },
            {
              yPercent: d,
              ease: 'none',
              scrollTrigger: {
                trigger: el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          )
        }
      },
    )
  }, [])

  return (
    <figure
      ref={root}
      className={`relative overflow-hidden bg-ink-3 ${className}`}
      /* `ratio` reserves the box before the file lands, which is what
         keeps a page made almost entirely of photographs from reflowing
         its way down the screen as each one arrives. Callers that set
         their own height (the full-height opening plates) pass null and
         opt out rather than declaring two competing sizes. */
      style={{ aspectRatio: ratio || undefined, borderRadius: radius || undefined }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable="false"
        className={`plate absolute inset-0 will-change-transform ${imgClassName}`}
        /* Oversized so the drift has real picture to travel through.
           Sized to the drift range rather than to a round number — a
           frame that does not move does not need the extra pixels. */
        style={
          drift
            ? { height: `${100 + drift * 2.6}%`, top: `${-drift * 1.3}%` }
            : undefined
        }
      />
      {children}
    </figure>
  )
}
