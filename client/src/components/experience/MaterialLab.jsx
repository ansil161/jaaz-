import { useState } from 'react'
import { hasStill } from '../../lib/media'
import { materialDetailOrder, materials, products } from '../../data/experience'
import Plate from './Plate'

/* ============================================================
   TOUCH. DISCOVER. DESIGN.

   The materials library, and the one section of the experience
   that is about the hand rather than the eye. Everything else in
   this journey is a room seen from a distance; this is the
   opposite — a surface at the scale you would actually hold it.

   SO THE PHOTOGRAPHY IS THE INTERFACE. The swatch is not a colour
   chip beside a label, it is a macro plate large enough to read
   grain direction and finish sheen, because that is the
   information a material decision is actually made on. A 20px
   chip communicates nothing that the word "walnut" did not
   already say.

   THE COLOUR FALLBACK IS DELIBERATE, NOT A PLACEHOLDER. Where a
   macro render has not been produced yet, the tile fills with the
   material's own measured tone. It reads as a specification chip
   — which is a real thing a designer works from — rather than as
   a missing image. When the macro lands it simply replaces it,
   and nothing about the layout moves.

   The related products at the foot are the join between this
   section and the gallery above it: a material is only a decision
   once you know what it is available ON.
   ============================================================ */

export default function MaterialLab({ className = '' }) {
  const [id, setId] = useState(materials[0].id)
  const [facet, setFacet] = useState(materialDetailOrder[0].id)
  const material = materials.find((m) => m.id === id) ?? materials[0]

  const related = products.filter((p) => material.products.includes(p.id))

  return (
    <div className={className}>
      {/* ---- The library ---- */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {materials.map((m) => {
          const on = m.id === id
          const shot = hasStill(m.slot)
          return (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setId(m.id)}
                className="focus-ring group block w-full text-left"
              >
                <span
                  className="relative block w-full overflow-hidden"
                  style={{ aspectRatio: '4 / 5' }}
                >
                  {shot ? (
                    <Plate
                      slot={m.slot}
                      alt={m.name}
                      sizes="(min-width: 1024px) 12rem, 40vw"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span
                      className="absolute inset-0 block"
                      style={{ backgroundColor: m.swatch }}
                      aria-hidden="true"
                    />
                  )}

                  {/* The selected state is a hairline inset, not a
                      glow. A material sample sits under a rule on
                      a designer's board; it does not light up. */}
                  <span
                    className={`pointer-events-none absolute inset-0 border transition-colors duration-500 ${
                      on ? 'border-cove' : 'border-white/10 group-hover:border-white/25'
                    }`}
                    aria-hidden="true"
                  />

                  {/* A scrim only under the caption, so the name
                      stays legible on a pale stone without
                      dimming the whole sample. */}
                  <span
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))',
                    }}
                    aria-hidden="true"
                  />

                  <span
                    className={`t-label absolute bottom-3 left-3 text-[0.5rem] transition-colors duration-500 ${
                      on ? 'text-cove' : 'text-pure/85'
                    }`}
                  >
                    {m.name}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* ---- The sample, read close ---- */}
      <div
        key={material.id}
        className="mt-12 animate-[fade-plate_800ms_cubic-bezier(0.16,1,0.3,1)_both]"
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          <div className="min-w-0 flex-1">
            <div className="relative overflow-hidden bg-ink-3" style={{ aspectRatio: 3 / 2 }}>
              {hasStill(material.slot) ? (
                <Plate
                  slot={material.slot}
                  alt={`${material.name} — macro`}
                  sizes="(min-width: 1024px) 46rem, 100vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: material.swatch }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-80">
            <h3 className="t-heading text-[1.8rem] leading-tight text-pure">{material.name}</h3>
            <p className="italic-display mt-2 text-[0.95rem] text-cove">{material.lede}</p>

            <div
              role="tablist"
              aria-label={`Explore ${material.name}`}
              className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-6"
            >
              {materialDetailOrder.map((f) => {
                const on = f.id === facet
                return (
                  <button
                    key={f.id}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    onClick={() => setFacet(f.id)}
                    className={`t-label focus-ring text-[0.52rem] transition-colors duration-400 ${
                      on ? 'text-cove' : 'text-ash hover:text-mist'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>

            <p
              key={facet}
              role="tabpanel"
              className="t-body mt-5 animate-[fade-plate_600ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.92rem] leading-relaxed text-fog"
            >
              {material[facet]}
            </p>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="t-label text-[0.5rem] text-ash">Colour variations</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {material.variations.map((v) => (
                  <li key={v} className="text-[0.86rem] text-fog">
                    {v}
                  </li>
                ))}
              </ul>
            </div>

            {related.length > 0 && (
              <div className="mt-6">
                <p className="t-label text-[0.5rem] text-ash">Available on</p>
                <ul className="mt-2 space-y-1">
                  {related.map((p) => (
                    <li key={p.id} className="text-[0.86rem] text-fog">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
