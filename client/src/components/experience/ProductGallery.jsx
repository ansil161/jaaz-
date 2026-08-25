import { useState } from 'react'
import { hasStill } from '../../lib/media'
import { products, rooms } from '../../data/experience'
import RoomStage from './RoomStage'
import { PointOverlay } from './Overlays'

/* ============================================================
   PRODUCTS — and the one interaction that justifies the section

   A product page shows you a thing on white. This shows you the
   thing, and then shows you WHERE IT GOES, in the room you have
   just spent the last ten minutes inside. That second state is
   the entire reason the gallery is at this point in the journey
   rather than at the start: "view in space" only means anything
   once you know the space.

   TWO STATES, ONE STAGE. `Explore product` holds the product
   plate; `View in space` swaps to the room and flies the camera
   to the coordinates the product actually occupies, with a mark
   on it. RoomStage already owns both halves of that — the
   dissolve between plates and the focus/scale camera move — so
   this section adds no new motion of its own.

   THE SPECIFICATION IS A TABLE, NOT A CARD. Two columns, hairline
   rules, one fact per row, every value carrying a unit or a
   material. That is what a specification looks like on a drawing
   set, and it is the format that makes a claim checkable rather
   than persuasive.
   ============================================================ */

/* Which room plate a product's `room` slot belongs to, so the
   "in space" view can name the room it just flew into. */
const roomFor = (slot) => rooms.find((r) => r.slot === slot)

export default function ProductGallery({ className = '' }) {
  const [id, setId] = useState(products[0].id)
  const product = products.find((p) => p.id === id) ?? products[0]

  /* Open on whichever view can actually show something. The
     product plates are the last renders in the queue, so until
     they land "Explore product" would be an empty frame while
     "View in space" has a real room to fly into — and starting on
     the empty one would make the whole gallery look broken rather
     than unfinished. Flips back automatically as the plates
     arrive; no code changes when they do. */
  const [inSpace, setInSpace] = useState(() => !hasStill(products[0].slot))

  /* Changing product returns to the product view. Staying "in
     space" across a change would fly the camera to a new room
     while the visitor was still reading the last one, and the
     marker would land on something they never asked about.

     Adjusted DURING render off the previous id rather than in an
     effect. An effect would let one frame paint with the camera
     still pushed into the old room before resetting it, and would
     cost an extra render pass to do it; React handles a setState
     in render by re-running this component before it ever
     commits. */
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
    setPrevId(id)
    setInSpace(!hasStill(product.slot))
  }

  const canPlace = Boolean(product.inSpace) && hasStill(product.room)
  const showingSpace = inSpace && canPlace
  const placedIn = roomFor(product.room)

  return (
    <div className={className}>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        {/* ---- The index. A schedule of what is in the house. ---- */}
        <nav aria-label="Products" className="w-full shrink-0 lg:w-56">
          <ul className="divide-y divide-white/8 border-y border-white/10">
            {products.map((p) => {
              const on = p.id === id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={on ? 'true' : undefined}
                    onClick={() => setId(p.id)}
                    className={`focus-ring group flex w-full items-baseline justify-between gap-4 py-3.5 text-left transition-colors duration-500 ${
                      on ? 'text-pure' : 'text-mist hover:text-fog'
                    }`}
                  >
                    <span className="min-w-0 text-[0.9rem] leading-snug">{p.name}</span>
                    <span
                      className={`t-label shrink-0 text-[0.48rem] transition-colors duration-500 ${
                        on ? 'text-cove' : 'text-ash'
                      }`}
                    >
                      {p.type}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ---- The stage and the specification ---- */}
        <div className="min-w-0 flex-1">
          <RoomStage
            slot={showingSpace ? product.room : product.slot}
            alt={
              showingSpace
                ? `${product.name} shown in place — ${placedIn?.label ?? 'the house'}`
                : product.name
            }
            ratio={16 / 9}
            grade={showingSpace ? 'screening' : null}
            focus={showingSpace ? { x: product.inSpace.x, y: product.inSpace.y } : { x: 50, y: 50 }}
            scale={showingSpace ? product.inSpace.scale : 1}
          >
            {showingSpace && (
              <PointOverlay key={product.id} points={[{ x: product.inSpace.x, y: product.inSpace.y }]} />
            )}
          </RoomStage>

          {/* The two ways in. `View in space` disables itself when
              the room render it would fly to does not exist yet,
              rather than flying to an empty stage. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
            <button
              type="button"
              aria-pressed={!showingSpace}
              onClick={() => setInSpace(false)}
              className={`focus-ring t-label relative pb-1 text-[0.55rem] transition-colors duration-500 ${
                showingSpace ? 'text-mist hover:text-fog' : 'text-pure'
              }`}
            >
              Explore product
              <span
                className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  showingSpace ? 'scale-x-0' : 'scale-x-100'
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              disabled={!canPlace}
              aria-pressed={showingSpace}
              onClick={() => setInSpace(true)}
              title={canPlace ? `See it in the ${placedIn?.label ?? 'house'}` : 'Render in preparation'}
              className={`focus-ring t-label relative pb-1 text-[0.55rem] transition-colors duration-500 ${
                !canPlace
                  ? 'cursor-not-allowed text-ash/55'
                  : showingSpace
                    ? 'text-pure'
                    : 'text-mist hover:text-fog'
              }`}
            >
              View in space
              <span
                className={`absolute inset-x-0 bottom-0 h-px origin-left bg-cove transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  showingSpace ? 'scale-x-100' : 'scale-x-0'
                }`}
                aria-hidden="true"
              />
            </button>

            {showingSpace && placedIn && (
              <span className="t-label text-[0.5rem] text-ash">In {placedIn.label}</span>
            )}
          </div>

          {/* ---- The panel ---- */}
          <div
            key={product.id}
            className="mt-10 animate-[fade-plate_700ms_cubic-bezier(0.16,1,0.3,1)_both] border-t border-white/10 pt-8"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
              <div className="min-w-0 flex-1">
                <h3 className="t-heading text-[1.7rem] leading-tight text-pure">{product.name}</h3>
                <p className="italic-display mt-2 text-[0.95rem] text-cove">{product.lede}</p>

                <dl className="mt-7 divide-y divide-white/8 border-t border-white/10">
                  {product.specs.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 py-3">
                      <dt className="t-label text-[0.5rem] text-ash">{k}</dt>
                      <dd className="text-[0.86rem] text-fog">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="w-full shrink-0 space-y-6 lg:w-72">
                {[
                  ['Materials', product.materials],
                  ['Acoustic technology', product.technology],
                  ['Installation', product.installation],
                  ['Compatible systems', product.compatible],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="t-label text-[0.5rem] text-ash">{label}</p>
                    <p className="mt-2 text-[0.86rem] leading-relaxed text-fog">{value}</p>
                  </div>
                ))}

                <div>
                  <p className="t-label text-[0.5rem] text-ash">Available finishes</p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                    {product.finishes.map((f) => (
                      <li key={f} className="text-[0.86rem] text-fog">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
