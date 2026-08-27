import { Figure, Lines } from '../../ui/Motion'

/* ============================================================
   ONE SOLUTION — THE ROOMS

   Four plates, each with a caption that names the trade it is
   showing — "Acoustics · fluted absorption, first reflection
   points". The captions are the reason this section is not a
   decorative gallery: they tie the photographs back to the
   seven-layer schedule above, so the reader sees the layer and
   then sees it built.

   Two columns offset against each other rather than a four-up
   grid. A row of four identical frames reads as a contact
   sheet; offsetting one column means the eye travels down the
   page instead of across it, which is the direction it is
   already going.

   <Figure> is the only way an image enters this site: it wipes
   its frame open once and then keeps drifting inside it for as
   long as it is on screen. It renders its own <figure>, which
   is why there is one nested inside the outer one here — the
   outer element exists to own the <figcaption>, which cannot
   live inside the clipped, overflow-hidden frame the inner one
   draws. Nesting is legal, and a caption that names the trade
   is worth more to a screen reader than a tidier tree.
   ============================================================ */

export default function Gallery({ solution: s }) {
  const { gallery } = s

  return (
    <section id="rooms" className="relative scroll-mt-32 bg-ink-2 py-24 sm:py-32">
      <div className="shell-wide">
        <Lines as="h2" className="t-chapter mb-16 text-bone sm:mb-20">
          {gallery.label}
        </Lines>

        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {gallery.items.map((item, i) => (
            <figure key={item.src} className={i % 2 === 1 ? 'sm:mt-24' : ''}>
              <Figure
                src={item.src}
                alt={item.alt}
                /* Capped as well as proportioned. A 4:5 frame in a
                   two-column grid at this measure is ~740px tall,
                   which is taller than the window on any laptop —
                   four of them become four screens of scrolling past
                   pictures nobody can see whole. The cap crops rather
                   than squashes, because the frame is `overflow-hidden`
                   and the plate inside it is `object-cover`. */
                className="aspect-4/5 w-full sm:max-h-[74vh]"
                /* Lifted above 1, which nothing else on this site does.
                   These plates carry no type at all — the caption is
                   outside the frame — so there is nothing to protect,
                   and several of the room photographs are exposed close
                   to black. At 1 they read as dark rectangles. */
                imgClassName="w-full [--plate-brightness:1.12] [--plate-contrast:1.04] [--plate-saturate:0.94]"
              />
              <figcaption className="t-num mt-5 max-w-[36ch] text-[0.74rem] leading-relaxed text-mist">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
