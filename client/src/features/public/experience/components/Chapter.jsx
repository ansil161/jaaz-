import { Lines, Rise } from '@/features/public/components/Motion'
import { Mark } from '@/features/public/components/Mark'

/* ============================================================
   CHAPTER — the shell every room is built in

   Nine spaces have to read as one house, and the surest way to
   lose that is nine sections each laid out slightly differently.
   So a room is a Chapter: number and name, a display headline, a
   line of intent, a stage, and whatever controls that room
   happens to offer.

   WHAT VARIES, AND WHAT DOES NOT

   Type scale, rhythm, rule weights and colour never vary. The
   only thing a room chooses is `lead`:

     type    the headline arrives first and the stage follows
     stage   the room fills the page edge to edge and the words
             sit under it

   Two arrangements rather than nine, alternating down the
   journey. That is enough to stop the page reading as a template
   without letting it read as nine unrelated designs — and the
   alternation itself does useful work, because the full-bleed
   chapters land on the beats where the visitor moves OUTSIDE or
   steps back to look at the whole house.

   THE NUMBER IS NOT AN EYEBROW. It is a drawing reference. The
   plan prints 03 on the theatre, so the theatre's chapter prints
   03 too, and the two are keyed to each other. Remove the plan
   and the number should go with it.
   ============================================================ */

/**
 * <SpecReadout> — the system you have just built, as a line.
 *
 * The configurator names what is being CHOSEN; this names what
 * has been chosen, in the schedule's own order. Without it the
 * visitor has to remember which words they clicked in four
 * separate groups, which is exactly the memory load a
 * specification exists to remove.
 */
export function SpecReadout({ specs = [], className = '' }) {
  if (!specs.length) return null

  return (
    <dl
      className={`flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-white/10 pt-5 ${className}`}
    >
      {specs.map((s) => (
        <div key={s.id} className="min-w-0">
          <dt className="t-label text-[0.5rem] text-ash">{s.label}</dt>
          <dd className="mt-1 text-[0.82rem] text-fog">
            <span className={s.pending ? 'text-ash' : 'text-pure'}>{s.value}</span>
            {s.detail && <span className="ml-2 text-mist">{s.detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * <Chapter>
 *
 * @param {Object}   room      From data/experience.
 * @param {'type'|'stage'} lead
 * @param {ReactNode} stage    The room itself.
 * @param {ReactNode} children Controls, readouts, panels.
 * @param {ReactNode} aside    Optional column beside the copy.
 */
export default function Chapter({
  room,
  lead = 'type',
  stage,
  aside = null,
  children,
  className = '',
}) {
  const header = (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {/* The chapter used to open on the room's plan number,
            keyed to the same number on the drawing. The key is
            better as a mark: it says WHICH ROOM on both, and on the
            plan it says it without the reader having to hold "06"
            in their head on the way down the page. */}
        <p className="t-label flex items-center text-[0.55rem] text-ash">
          <Mark name={room.icon} size={17} className="text-cove" />
          <span className="mx-3 inline-block h-px w-8 bg-white/20" />
          {room.label}
        </p>

        <Lines as="h2" className="t-display mt-6 max-w-3xl text-pure" stagger={0.1}>
          {room.headline.map((line, i) => (
            <span key={line} className="block">
              {/* The last word of the last line goes italic. One
                  device, used identically in every chapter, so the
                  eye learns where a room's sentence ends. */}
              {i === room.headline.length - 1 ? (
                <>
                  {line.slice(0, line.lastIndexOf(' ') + 1)}
                  <em className="italic-display text-cove">
                    {line.slice(line.lastIndexOf(' ') + 1)}
                  </em>
                </>
              ) : (
                line
              )}
            </span>
          ))}
        </Lines>
      </div>

      <p className="t-body max-w-sm shrink-0 text-mist lg:pb-2">{room.body}</p>
    </div>
  )

  if (lead === 'stage') {
    return (
      <section
        id={room.id}
        aria-label={room.label}
        className={`relative scroll-mt-24 bg-ink py-20 sm:py-28 ${className}`}
      >
        {/* Full bleed. These chapters are the ones where the room
            should arrive before any words do. */}
        <Rise className="relative" y={0}>
          {stage}
        </Rise>

        <div className="shell-wide mt-12 sm:mt-16">
          {header}
          {aside}
          {children}
        </div>
      </section>
    )
  }

  return (
    <section
      id={room.id}
      aria-label={room.label}
      className={`relative scroll-mt-24 bg-ink py-20 sm:py-28 ${className}`}
    >
      <div className="shell-wide">
        {header}

        <div className="mt-12 sm:mt-14">{stage}</div>

        {aside}
        {children}
      </div>
    </section>
  )
}
