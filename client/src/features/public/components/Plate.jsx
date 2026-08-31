import { hasStill, ratio, src, srcSet } from '@/features/public/utils/media'

/* ============================================================
   PLATE — one architectural render, served properly

   AVIF first, WebP second, and the reason is this specific
   content rather than a general preference: every render in this
   experience is a dark interior carrying long, smooth gradients —
   a cove wash across a ceiling, light falling off across leather.
   That is precisely where WebP bands and AVIF does not, and it is
   also where the file-size gap is widest (the theatre master is
   51KB as AVIF against 80KB as WebP). WebP stays as the fallback
   for older Safari; `<picture>` picks without any JS.

   `sizes` defaults to 100vw because these plates are full-bleed
   stages. A plate used at a smaller size must say so, or every
   visitor downloads the 1376px file to render it at 400px.
   ============================================================ */

/**
 * <Plate>
 *
 * @param {string}  slot        Manifest key, e.g. "theatre/base".
 * @param {string}  alt         Empty string when the plate is
 *                              decorative and a caption already
 *                              carries its meaning.
 * @param {boolean} [priority]  Skip lazy-loading and decode eagerly.
 *                              For the FIRST plate of the first room
 *                              only — it is the largest paint on the
 *                              page and lazy-loading it delays the
 *                              one image the visitor is waiting for.
 * @param {string}  [sizes]     Media condition for `srcset` picking.
 */
export default function Plate({
  slot,
  alt = '',
  priority = false,
  sizes = '100vw',
  className = '',
  style,
  ...rest
}) {
  /* A slot with no render yet is not an error and must not be a
     broken image: the experience is assembled while its asset set
     is still being generated, so an unbuilt room renders as an
     empty stage of the right shape and the layout never jumps when
     the real plate lands. */
  if (!hasStill(slot)) {
    return (
      <div
        className={`bg-ink-3 ${className}`}
        style={{ aspectRatio: '16 / 9', ...style }}
        data-plate-pending={slot}
        aria-hidden="true"
        {...rest}
      />
    )
  }

  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(slot, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(slot, 'webp')} sizes={sizes} />
      <img
        src={src(slot)}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ aspectRatio: ratio(slot), ...style }}
        className={`h-full w-full object-cover ${className}`}
        {...rest}
      />
    </picture>
  )
}
