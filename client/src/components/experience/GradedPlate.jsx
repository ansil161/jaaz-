import { grades } from '../../data/experience'
import Plate from './Plate'

/* ============================================================
   GRADED PLATE — a room under a named light, as a fill layer

   RoomStage owns the aspect frame, the dissolve between renders
   and the camera move. This owns none of those: it is the plate
   plus its grade, sized to whatever contains it.

   It exists because three sections need a lit room INSIDE a
   layout they control — the two halves of a comparison, a scene
   playing behind a control panel, and the four chapters of the
   closing sequence. Giving each of those its own copy of the
   filter/wash/vignette arithmetic is how three sections quietly
   end up with three different ideas of what "Movie Night" looks
   like.
   ============================================================ */

export default function GradedPlate({
  slot,
  alt = '',
  grade = null,
  priority = false,
  vignette = true,
  sizes = '100vw',
  className = '',
  children,
}) {
  const g = (grade && grades[grade]) || null
  const ms = 1100

  return (
    <div className={`absolute inset-0 ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          filter: g?.filter ?? undefined,
          transition: `filter ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <Plate
          slot={slot}
          alt={alt}
          priority={priority}
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* The wash — the hue the grade ADDS. A filter can bend the
          colour already in the plate but it cannot introduce the
          warmth of a 2700K cove, so that arrives as its own
          layer. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: g?.wash ?? 'transparent',
          opacity: g?.washAlpha ?? 0,
          transition: `opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1), background-color ${ms}ms linear`,
        }}
        aria-hidden="true"
      />

      {vignette && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 45%, transparent 44%, rgba(0,0,0,${
              0.26 * (g?.vignette ?? 1)
            }) 74%, rgba(0,0,0,${0.58 * (g?.vignette ?? 1)}) 100%)`,
            transition: `background ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
          aria-hidden="true"
        />
      )}

      {children}
    </div>
  )
}
