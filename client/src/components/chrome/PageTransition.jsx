import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/useGsap'
import { scrollToId } from '../../lib/useLenis'
import { RouteContext, useRoute } from '../../lib/route'

/* ============================================================
   ROUTING + PAGE TRANSITION

   Two pages do not justify a router dependency, and the whole
   point of owning it here is that the route swap and the thing
   the user SEES during the swap are one mechanism rather than
   two that have to be kept in sync.

   The transition is a house curtain, not a loading screen:
   a black plane wipes up over the page, the wordmark holds for
   a beat in the dark, and the plane wipes away to reveal the
   next chapter. Nothing spins, nothing reports a percentage.

   The swap itself happens at the one moment the screen is fully
   covered, which is also where the scroll is reset and every
   ScrollTrigger is remeasured — so the incoming page never
   flashes at the old scroll position.
   ============================================================ */

/** Same-origin, unmodified, left-click only — everything else is the browser's. */
const isPlainClick = (e) =>
  !e.defaultPrevented &&
  e.button === 0 &&
  !e.metaKey &&
  !e.ctrlKey &&
  !e.shiftKey &&
  !e.altKey

const COVER = 0.6
const HOLD = 0.14
const REVEAL = 0.78

export function RouteProvider({ children }) {
  const [path, setPath] = useState(() => window.location.pathname)
  const curtain = useRef(null)
  const mark = useRef(null)
  const seam = useRef(null)
  /* A second navigation mid-transition would swap the page out from
     under a running timeline and leave the curtain stranded. */
  const busy = useRef(false)

  /* We move the scroll ourselves at the covered moment; letting the
     browser also restore a remembered position fights that. */
  useEffect(() => {
    const previous = history.scrollRestoration
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    return () => {
      if ('scrollRestoration' in history) history.scrollRestoration = previous
    }
  }, [])

  /* A `/#section` link crossing pages cannot find its anchor until the
     incoming page has actually rendered, so the hash is parked here at
     swap time and consumed by the effect below.

     Seeded from the address bar so that opening `/#comfort` directly —
     a shared link, a bookmark — lands in the same place a click would.
     Native hash scrolling cannot be relied on here: scroll restoration
     is manual and Lenis owns the scroller. */
  const pendingHash = useRef(window.location.hash.slice(1))

  /* Applies the new path and parks the scroll at the top. Runs only
     while the curtain is closed, so none of it is ever visible. */
  const swap = useCallback((to) => {
    const [pathname, hash] = to.split('#')
    pendingHash.current = hash || ''
    setPath(pathname || '/')

    /* `force` is load-bearing. The transition stops Lenis for the
       duration of the curtain, and a stopped Lenis silently ignores
       scrollTo — so without this the incoming page would open at
       whatever scroll position the outgoing one was left at. */
    const lenis = window.__lenis
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [])

  /* Land on the anchor, then remeasure.

     This is an effect keyed on `path` rather than a step inside the
     transition timeline, and that is the whole point: an effect runs
     after React has committed the new page, so the anchor is
     guaranteed to exist. Scheduling it on the timeline instead meant
     guessing at a delay long enough for the render to have landed —
     and when the guess was wrong the element simply was not there
     yet, so the page silently stayed at the top.

     Order matters too, and not in the obvious direction: REFRESH
     FIRST, then scroll. Both of these pages pin sections, and a pin
     only inserts its spacer — adding thousands of pixels above
     everything below it — once ScrollTrigger has measured the new
     tree. Scrolling to an anchor before that lands on a position the
     refresh then invalidates, which put `/#comfort` roughly two
     viewports short of the section it names. */
  useEffect(() => {
    const hash = pendingHash.current
    pendingHash.current = ''

    ScrollTrigger.refresh()
    if (!hash) return

    const target = document.getElementById(hash)
    if (!target) return

    const lenis = window.__lenis
    /* Same reason as in `swap`: this runs while the curtain is closed
       and Lenis is stopped, and a stopped Lenis ignores scrollTo. */
    if (lenis) lenis.scrollTo(target, { immediate: true, offset: -20, force: true })
    else target.scrollIntoView()
  }, [path])

  const navigate = useCallback(
    (to, { replace = false, fromPop = false } = {}) => {
      const target = to || '/'
      if (busy.current) return

      const [rawPath, hash] = target.split('#')
      const samePage = (rawPath || '/') === window.location.pathname

      /* Back/forward that only moved the anchor. The rendered page is
         already the right one, so this is a scroll, not a transition. */
      if (fromPop && (rawPath || '/') === path) {
        if (hash) scrollToId(hash, -20)
        else window.__lenis?.scrollTo(0)
        return
      }

      if (samePage && !fromPop) {
        /* A repeat click on the current page is not a navigation. If it
           carries an anchor it is a scroll — smooth, in place. Dropping
           a full curtain to move within a page the user is already on
           would read as a bug. */
        if (!hash) return
        history.replaceState({}, '', target)
        scrollToId(hash, -20)
        return
      }

      if (!fromPop) {
        if (replace) history.replaceState({}, '', target)
        else history.pushState({}, '', target)
      }

      /* Reduced motion gets the destination, not a performance. */
      if (prefersReducedMotion() || !curtain.current) {
        swap(target)
        return
      }

      busy.current = true
      const lenis = window.__lenis
      lenis?.stop()

      const tl = gsap.timeline({
        onComplete: () => {
          busy.current = false
          lenis?.start()
        },
      })

      tl.set(curtain.current, { pointerEvents: 'auto' })
        .fromTo(
          curtain.current,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: COVER, ease: 'jaz-io' },
        )
        /* The seam of warm light that rides the leading edge — the only
           colour in the whole transition, and the reason it reads as a
           curtain rather than a rectangle. */
        .fromTo(
          seam.current,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: COVER, ease: 'jaz-io' },
          0,
        )
        .fromTo(
          mark.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.4, ease: 'jaz' },
          COVER - 0.22,
        )
        .add(() => {
          swap(target)
        })
        .to(mark.current, { autoAlpha: 0, y: -12, duration: 0.34, ease: 'jaz' }, `+=${HOLD}`)
        .to(seam.current, { opacity: 0, duration: 0.3, ease: 'none' }, '<')
        .to(
          curtain.current,
          { clipPath: 'inset(0% 0% 100% 0%)', duration: REVEAL, ease: 'jaz-io' },
          '<',
        )
        .set(curtain.current, { pointerEvents: 'none' })
    },
    [swap, path],
  )

  /* Back / forward. The URL has already changed, so we only play the
     curtain and adopt it. */
  useEffect(() => {
    const onPop = () =>
      navigate(window.location.pathname + window.location.hash, { fromPop: true })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [navigate])

  /* A route change is a new document as far as a screen reader is
     concerned, but focus stays wherever the old link was. Reset it to
     the top of the new page once the curtain has opened. */
  useEffect(() => {
    const main = document.getElementById('main')
    if (!main) return
    const t = setTimeout(
      () => main.focus({ preventScroll: true }),
      prefersReducedMotion() ? 0 : (COVER + HOLD) * 1000,
    )
    return () => clearTimeout(t)
  }, [path])

  useEffect(() => () => gsap.killTweensOf([curtain.current, mark.current, seam.current]), [])

  return (
    <RouteContext.Provider value={{ path, navigate }}>
      {children}

      <div
        ref={curtain}
        aria-hidden="true"
        className="fixed inset-0 z-[70] bg-ink"
        style={{ clipPath: 'inset(100% 0% 0% 0%)', pointerEvents: 'none' }}
      >
        <div
          ref={seam}
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(255,240,214,0.75) 22%, rgba(255,240,214,0.75) 78%, transparent)',
          }}
        />
        <div className="flex h-full items-center justify-center">
          <span
            ref={mark}
            className="font-display text-3xl leading-none tracking-tight text-bone/70"
            style={{ visibility: 'hidden' }}
          >
            JAAZ
          </span>
        </div>
      </div>
    </RouteContext.Provider>
  )
}

/**
 * <Link> — a real anchor with a real href, so middle-click, "open in
 * new tab" and crawlers all behave. Only a plain left-click is taken
 * over and turned into a curtain transition.
 */
export function Link({ to, className = '', children, onNavigate, ...rest }) {
  const { navigate } = useRoute()
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (!isPlainClick(e)) return
        e.preventDefault()
        onNavigate?.()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
