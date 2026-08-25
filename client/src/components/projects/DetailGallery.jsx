import ProjectFrame from './ProjectFrame'
import { Lines } from '../ui/Motion'

/* ============================================================
   THE GALLERY — five photographs, five different sizes.

   A project's pictures are not equal and should not be set as
   though they are. The full-bleed frames are the room; the
   portrait is a decision inside it; the note is the one thing
   worth stopping to explain. Setting all five at one width in
   one column is the portfolio equivalent of reading a paragraph
   in a monotone.

   FOUR COMPOSITIONS, DRIVEN BY `kind`, NOT BY POSITION.
     full      edge to edge, near viewport height. The room.
     wide      held inside the gutters, most of the column.
     portrait  offset into a half column, alternating side.
     note      a plate with one paragraph set against it.

   Which side `portrait` and `note` sit on comes from the index,
   so the rhythm belongs to the page rather than to the data —
   the same rule the index uses to alternate its running heads.
   Two consecutive projects therefore never fall the same way
   even when their image lists are identical in shape.

   EVERY PLATE IS LAZY EXCEPT THE HERO. Five photographs at four
   widths each is the entire weight of this page; loading them on
   arrival would mean a project page that costs several megabytes
   before the visitor has scrolled past the title.
   ============================================================ */

export default function DetailGallery({ items }) {
  return (
    <section className="relative bg-ink pb-[6vh]" aria-label="Project gallery">
      {items.map((item, i) => {
        const right = i % 2 === 1
        const key = `${item.kind}-${i}`

        if (item.kind === 'full') {
          return (
            <div key={key} className="py-[5vh]">
              <ProjectFrame
                src={item.src}
                srcSet={item.srcSet}
                ratio={null}
                alt={item.alt}
                sizes="100vw"
                className="h-[74svh] min-h-[22rem] sm:h-[88svh]"
                inset={11}
                radiusFrom={16}
                drift={8}
                scaleFrom={1.12}
              />
            </div>
          )
        }

        if (item.kind === 'note') {
          return (
            <div key={key} className="shell-wide py-[7vh]">
              <div className="grid items-end gap-y-10 lg:grid-cols-12 lg:gap-x-12">
                <div className={`lg:col-span-7 ${right ? 'lg:order-2 lg:col-start-6' : 'lg:order-1'}`}>
                  <ProjectFrame
                    src={item.src}
                    srcSet={item.srcSet}
                    ratio={item.ratio}
                    alt={item.alt}
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    inset={8}
                    drift={7}
                    scaleFrom={1.12}
                  />
                </div>

                <div
                  className={`lg:col-span-4 ${
                    right ? 'lg:order-1 lg:col-start-1' : 'lg:order-2 lg:col-start-9'
                  }`}
                >
                  <Lines as="h3" className="t-heading text-bone">
                    {item.title}
                  </Lines>
                  <Lines as="p" className="t-body mt-5 max-w-[46ch] text-mist">
                    {item.body}
                  </Lines>
                </div>
              </div>
            </div>
          )
        }

        if (item.kind === 'portrait') {
          return (
            <div key={key} className="shell-wide py-[5vh]">
              {/* FLUSH TO A GUTTER, never floating between them. A tall
                  plate set at 40% width somewhere in the middle of the
                  column leaves void on both sides and reads as a block
                  that failed to fill its row. Run to one page edge, the
                  same void becomes the margin the picture is set
                  against — and it lines up with the text column above
                  it, which is what makes it look chosen. */}
              <div className="grid lg:grid-cols-12">
                <div className={`sm:col-span-8 lg:col-span-5 ${right ? 'lg:col-start-8' : 'lg:col-start-1'}`}>
                  <ProjectFrame
                    src={item.src}
                    srcSet={item.srcSet}
                    ratio={item.ratio}
                    alt={item.alt}
                    sizes="(min-width: 1024px) 40vw, (min-width: 640px) 66vw, 100vw"
                    inset={9}
                    drift={10}
                    scaleFrom={1.16}
                  />
                </div>
              </div>
            </div>
          )
        }

        return (
          <div key={key} className="shell-wide py-[5vh]">
            <div className="grid lg:grid-cols-12">
              <div className={`lg:col-span-10 ${right ? 'lg:col-start-3' : 'lg:col-start-1'}`}>
                <ProjectFrame
                  src={item.src}
                  srcSet={item.srcSet}
                  ratio={item.ratio}
                  alt={item.alt}
                  sizes="(min-width: 1024px) 80vw, 100vw"
                  inset={8}
                  drift={7}
                  scaleFrom={1.1}
                />
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
