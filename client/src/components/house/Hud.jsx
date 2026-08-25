/* ============================================================
   HUD — the smallest interface a house can carry

   Four things, each anchored to an edge so the middle of the
   frame — where the house is — stays empty:

     the room rail        down the left, six entries
     what you are seeing  two lines, bottom left
     which scheme         a counter, bottom right, only when there
                          is a set of schemes to count
     the way in           the scroll cue, and only at the start

   A tight text-shadow rather than a scrim. A panel behind the
   type would put a grey rectangle over a house we spent the whole
   build lighting; a shadow keeps the words legible over plaster
   and over black acoustic fabric alike, covering nothing.
   ============================================================ */

const SHADOW = { textShadow: '0 1px 20px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.7)' }

export default function Hud({ beat, rail, activeRail, count, index, onJump, progress, reduced }) {
  return (
    <>
      {/* ---- Where you are in the house ---- */}
      <nav
        aria-label="Rooms"
        className="pointer-events-none absolute top-1/2 left-5 z-20 hidden -translate-y-1/2 sm:left-8 md:block"
      >
        <ul className="space-y-3.5">
          {rail.map((r) => {
            const on = r.id === activeRail
            return (
              <li key={r.id} className="flex items-center gap-3">
                <span
                  className={`block h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    on ? 'w-7 bg-cove' : 'w-3 bg-white/30'
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => onJump(r.p)}
                  aria-current={on ? 'true' : undefined}
                  className={`t-label pointer-events-auto text-left text-[0.5rem] transition-colors duration-700 ${
                    on ? 'text-pure' : 'text-white/35 hover:text-white/70'
                  }`}
                  style={SHADOW}
                >
                  <span className={on ? 'text-cove' : 'text-white/30'}>{r.n}</span>
                  <span className="ml-2">{r.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ---- What you are looking at ----
          Keyed on the title so the lines replay on every beat.
          Without the key the text swaps silently and a change of
          scheme reads as the room having glitched. */}
      <div
        key={beat.title}
        className="pointer-events-none absolute right-5 bottom-8 left-5 z-20 sm:bottom-10 sm:left-8 md:left-28 lg:left-32"
      >
        <p
          className="t-label animate-[fade-plate_600ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.5rem] text-cove"
          style={SHADOW}
        >
          {beat.chapter}
        </p>
        <h2
          className="t-heading mt-2 max-w-2xl animate-[fade-plate_700ms_60ms_cubic-bezier(0.16,1,0.3,1)_both] text-[1.55rem] leading-tight text-pure sm:text-[2.05rem]"
          style={SHADOW}
        >
          {beat.title}
        </h2>
        {beat.note && (
          <p
            className="mt-2 max-w-md animate-[fade-plate_700ms_120ms_cubic-bezier(0.16,1,0.3,1)_both] text-[0.86rem] leading-snug text-white/70"
            style={SHADOW}
          >
            {beat.note}
          </p>
        )}
      </div>

      {/* ---- Which scheme, of how many ----
          Only while a set of schemes is actually being shown. A
          counter reading "02 / 04" during a corridor walk is
          counting something the visitor is not looking at. */}
      {count > 0 && (
        <div className="pointer-events-none absolute top-24 right-5 z-20 text-right sm:right-8">
          <p className="t-label text-[0.5rem] text-white/45" style={SHADOW}>
            Design
          </p>
          <p className="t-label mt-1 text-[0.72rem] text-pure" style={SHADOW}>
            <span className="text-cove">{String(index + 1).padStart(2, '0')}</span>
            <span className="mx-1.5 text-white/35">/</span>
            {String(count).padStart(2, '0')}
          </p>
        </div>
      )}

      {/* ---- The way in ---- */}
      {!reduced && (
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-700"
          style={{ opacity: progress < 0.012 ? 1 : 0 }}
          aria-hidden="true"
        >
          <span className="t-label text-[0.5rem] text-white/60" style={SHADOW}>
            Scroll to walk in
          </span>
          <span className="jaz-scroll-tick block h-12 w-px bg-white/40" />
        </div>
      )}
    </>
  )
}
