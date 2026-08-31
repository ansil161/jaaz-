/* ============================================================
   SIGNATURE — one small badge motif per solution

   The dispatcher named in the long comment at the top of
   data/solutions.js. Each `case` is a minimal, looping graphic
   keyed to what that solution physically does — an iris for the
   dedicated theatre, an equalizer for party audio, a ripple for
   the terrace's weather problem — sitting in the corner of that
   solution's hero as a signature rather than decoration.

   Kept deliberately small and CSS-driven (keyframes live in
   index.css, under "SOLUTION SIGNATURES") rather than nine GSAP
   contexts: the effect a corner badge needs is a loop, and a
   `prefers-reduced-motion` query already turns all of them off
   in one place.
   ============================================================ */

function Frame({ label, children }) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div className="relative flex h-16 w-16 items-center justify-center border border-white/15 bg-white/[0.03] sm:h-20 sm:w-20">
        {children}
      </div>
      <span className="t-num text-right text-[0.6rem] tracking-[0.16em] text-mist/70">
        {label}
      </span>
    </div>
  )
}

function Aperture() {
  return (
    <Frame label="APERTURE — IRIS CYCLE">
      <div className="flex h-8 w-8 flex-col gap-1 overflow-hidden">
        <span className="h-1/2 origin-bottom animate-[sig-aperture_2.2s_ease-in-out_infinite] bg-pure/70" />
        <span
          className="h-1/2 origin-top animate-[sig-aperture_2.2s_ease-in-out_infinite] bg-pure/70"
          style={{ animationDelay: '0.05s' }}
        />
      </div>
    </Frame>
  )
}

function Seam() {
  return (
    <Frame label="SEAM — CALIBRATION SWEEP">
      <div className="relative h-px w-10 overflow-hidden bg-white/15">
        <span
          className="absolute inset-y-0 w-4 animate-[sig-seam-sweep_2.6s_ease-in-out_infinite]"
          style={{ background: 'linear-gradient(90deg, transparent, #ffeed2, transparent)' }}
        />
      </div>
    </Frame>
  )
}

function Scenes() {
  return (
    <Frame label="SCENES — ONE PRESS">
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 0.5, 1, 1.5].map((d) => (
          <span
            key={d}
            className="h-3 w-3 animate-[sig-scene-pulse_2.4s_ease-in-out_infinite] bg-pure"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </Frame>
  )
}

function Decay() {
  return (
    <Frame label="RT60 — DECAY">
      <div className="flex h-8 items-end gap-1">
        {[0, 0.15, 0.3, 0.45, 0.6].map((d, i) => (
          <span
            key={d}
            className="w-1 origin-bottom animate-[sig-decay-bar_1.8s_ease-in_infinite] bg-pure/70"
            style={{ height: `${100 - i * 8}%`, animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </Frame>
  )
}

function Spectrum() {
  return (
    <Frame label="OUTPUT — SPECTRUM">
      <div className="flex h-8 items-end gap-1">
        {[0, 0.12, 0.24, 0.36, 0.48].map((d) => (
          <span
            key={d}
            className="w-1 origin-bottom animate-[sig-eq-bounce_1.1s_ease-in-out_infinite] bg-pure/70"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </Frame>
  )
}

function Dimmer() {
  return (
    <Frame label="MOOD — LEVEL">
      <div className="relative h-9 w-9 rounded-full border border-white/25">
        <span
          className="absolute top-1 left-1/2 h-3 w-px origin-bottom animate-[sig-dimmer-turn_3.2s_ease-in-out_infinite] bg-pure"
          style={{ transformOrigin: '50% 1.1rem' }}
        />
      </div>
    </Frame>
  )
}

function Weather() {
  return (
    <Frame label="EXPOSURE — IP66">
      <div className="relative flex h-9 w-9 items-center justify-center">
        {[0, 0.9, 1.8].map((d) => (
          <span
            key={d}
            className="absolute h-6 w-6 animate-[sig-ripple_2.7s_ease-out_infinite] rounded-full border border-pure/60"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </Frame>
  )
}

function Starfield() {
  return (
    <Frame label="LAYERS — LIGHT">
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-pure"
            style={{
              animation: `jaz-twinkle ${1.6 + (i % 3) * 0.4}s ease-in-out infinite`,
              animationDelay: `${(i % 5) * 0.2}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    </Frame>
  )
}

function Recliner() {
  return (
    <Frame label="RECLINE — FULL RANGE">
      <div className="relative h-8 w-8">
        <span className="absolute bottom-0 left-0 h-1.5 w-7 bg-pure/70" />
        <span
          className="absolute bottom-1.5 left-0 h-6 w-1.5 origin-bottom animate-[sig-recliner-tilt_3s_ease-in-out_infinite] bg-pure/70"
        />
      </div>
    </Frame>
  )
}

const SIGNATURES = {
  aperture: Aperture,
  seam: Seam,
  scenes: Scenes,
  decay: Decay,
  spectrum: Spectrum,
  dimmer: Dimmer,
  weather: Weather,
  starfield: Starfield,
  recliner: Recliner,
}

export default function Signature({ type }) {
  const Motif = SIGNATURES[type]
  if (!Motif) return null
  return <Motif />
}
