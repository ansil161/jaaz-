import { useState } from 'react'
import { comfort } from '../../../data/site'

/* ============================================================
   MATERIAL BAR — the tactile swatches at the base of Act 03.

   Four generated surfaces, not photographs. A leather grain or
   a woven star-field close-up is exactly the asset this file's
   long note at the top of data/site.js warns about sourcing
   from Pinterest — hotlink-protected, not licensed for
   commercial use, and a broken image the moment it ships. A CSS
   gradient tuned to the material's own tone and texture never
   breaks and never needs a licence.

   Clicking a swatch does not repaint the room photo — there is
   one room in this sequence, not four re-shoots — it updates the
   note beneath the bar, which is the part of "material selection"
   a photo swap was standing in for anyway.
   ============================================================ */

export default function MaterialBar() {
  const [active, setActive] = useState(comfort.materials[0].id)
  const material = comfort.materials.find((m) => m.id === active)

  return (
    <div className="mt-8 max-w-md">
      <div role="radiogroup" aria-label="Material" className="flex items-center gap-3">
        {comfort.materials.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={active === m.id}
            aria-label={m.label}
            onClick={() => setActive(m.id)}
            className="focus-ring group relative h-10 w-10 shrink-0 overflow-hidden rounded-full border transition-[border-color,transform] duration-400"
            style={{
              background: m.swatch,
              borderColor: active === m.id ? '#fff' : 'rgba(255,255,255,0.25)',
              transform: active === m.id ? 'scale(1.08)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <span className="t-label text-pure">{material.label}</span>
        <p className="t-body mt-2 max-w-sm text-sm text-mist">{material.note}</p>
      </div>
    </div>
  )
}
