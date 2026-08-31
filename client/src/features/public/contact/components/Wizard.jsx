import { useMemo, useRef, useState } from 'react'
import { wizard } from '@/features/public/data/contact'
import { Icon } from './icons'

/* ============================================================
   THE WIZARD

   Five short questions, one at a time, instead of one long form
   — the mechanism this whole redesign is built around, and the
   one genuinely new interaction pattern this site has borrowed
   deliberately from glazewindowsystems.com/contact rather than
   invented from scratch (the same reference ClosingCta.jsx
   already matches at the foot of every page).

   WHY A WIZARD READS AS MORE PREMIUM THAN A LONG FORM
   A six-field form shows you the whole cost of answering before
   you have answered anything — the effort is visible up front.
   A wizard shows you one small, answerable question, and the
   next one only appears once you have cleared the first. The
   total effort is often identical; the FELT effort is not, and
   felt effort is most of what "this feels considered" means on
   a contact page.

   Card, not sheet — a deliberate departure from this site's
   usual "no boxes" rule for the reason above: the reference is
   explicit that the wizard IS a physical object (a request
   panel), and pretending it is loose ruled paper the way the
   previous Brief form did would undersell exactly the effect
   the redesign was asked for.

   THE SEND PATH is unchanged in substance from every earlier
   version of this form: no backend, so the composed answers
   become a real mailto: opened on the final "Send enquiry" click.
   ============================================================ */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const STEPS = wizard.steps

const EMPTY = {
  space: '',
  budget: '',
  city: '',
  timeline: '',
  message: '',
  name: '',
  phone: '',
  email: '',
  method: '',
  time: '',
}

function ProgressRail({ step }) {
  return (
    <div className="flex items-center gap-2">
      <span className="t-num shrink-0 text-xs text-ink/40">
        {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
      </span>
      <div className="flex flex-1 gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-ink/10">
            <span
              className="block h-full origin-left rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                background: 'linear-gradient(90deg, var(--color-ink), var(--color-cove))',
                transform: `scaleX(${i <= step ? 1 : 0})`,
              }}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

/** Icon card — used for single-select "what are you building",
    contact method and best-time-to-contact. */
function IconCard({ icon, label, meta, on, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`focus-ring group flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors duration-300 ${
        on ? 'border-ink bg-ink/[0.04]' : 'border-ink/15 hover:border-ink/35'
      }`}
    >
      <span className="text-ink/60 group-hover:text-ink">
        <Icon name={icon} />
      </span>
      <span className="flex-1">
        <span className="t-label block text-ink">{label}</span>
        {meta && <span className="t-label mt-0.5 block text-[0.6rem] text-ink/40">{meta}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 rounded-full border transition-colors duration-300 ${
          on ? 'border-ink bg-ink' : 'border-ink/25'
        }`}
      />
    </button>
  )
}

/** Pill chip — budget, timeline, and any other quick single-select. */
function Chip({ label, on, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`t-label focus-ring rounded-full border px-4 py-2.5 transition-colors duration-300 ${
        on ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

export default function Wizard() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(EMPTY)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (error) setError('')
  }

  const scrollToPanel = () => {
    panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const goNext = () => {
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    scrollToPanel()
  }
  const goBack = () => {
    setStep((s) => Math.max(0, s - 1))
    scrollToPanel()
  }

  const mailHref = useMemo(() => {
    const line = (label, v) => (v && v.trim() ? `${label}: ${v.trim()}\n` : '')
    const body =
      line('Building', values.space) +
      line('Budget', values.budget) +
      line('City', values.city) +
      line('Timeline', values.timeline) +
      line('Preferred contact', values.method) +
      line('Best time', values.time) +
      line('Name', values.name) +
      line('Phone', values.phone) +
      line('Email', values.email) +
      (values.message.trim() ? `\nThe room:\n${values.message.trim()}\n` : '')
    return `mailto:${wizard.to}?subject=${encodeURIComponent(wizard.subject)}&body=${encodeURIComponent(body)}`
  }, [values])

  const send = () => {
    if (!values.name.trim() || !EMAIL.test(values.email.trim())) {
      setError(wizard.error)
      setStep(3)
      return
    }
    window.location.href = mailHref
    setSent(true)
  }

  const current = STEPS[step]

  return (
    <div
      ref={panelRef}
      id="consultation"
      className="scroll-mt-28 rounded-2xl border border-ink/12 bg-paper p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.18)] sm:p-9"
    >
      {sent ? (
        <div aria-live="polite">
          <span className="t-label text-ink/45">{wizard.subject}</span>
          <h3 className="t-heading mt-4 text-ink">{wizard.sent.title}</h3>
          <p className="t-body mt-5 max-w-sm text-sm text-ink/60">{wizard.sent.body}</p>
          <div className="mt-9 flex flex-wrap items-center gap-8">
            <a
              href={mailHref}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-paper transition-opacity duration-300 hover:opacity-85"
            >
              <span className="t-label">Open it again</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setValues(EMPTY)
                setSent(false)
                setStep(0)
              }}
              className="link-underline t-label focus-ring text-ink/50 hover:text-ink"
            >
              {wizard.sent.again}
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="t-label text-ink/45">Request a consultation</span>
          <div className="mt-4">
            <ProgressRail step={step} />
          </div>

          <div className="mt-7">
            <span className="t-num text-xs text-ink/35">{String(step + 1).padStart(2, '0')}</span>
            <h3 className="t-sub mt-2 text-[1.4rem] text-ink sm:text-[1.6rem]">{current.title}</h3>
            {current.note && <p className="t-body mt-2.5 max-w-sm text-sm text-ink/55">{current.note}</p>}
          </div>

          {/* ---- Step body ---- */}
          <div className="mt-7">
            {current.type === 'single' && (
              <div role="radiogroup" aria-label={current.field} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {current.options.map((opt) => (
                  <IconCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.value}
                    on={values[current.field] === opt.value}
                    onClick={() => set(current.field, opt.value)}
                  />
                ))}
              </div>
            )}

            {current.type === 'chip' && (
              <div role="radiogroup" aria-label={current.field} className="flex flex-wrap gap-2.5">
                {current.options.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    on={values[current.field] === opt}
                    onClick={() => set(current.field, opt)}
                  />
                ))}
              </div>
            )}

            {current.type === 'compound' && (
              <div className="space-y-7">
                {current.groups.map((g) => (
                  <div key={g.field} className="border-t border-ink/10 pt-6 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline gap-3">
                      <span className="t-num text-xs text-ink/30">{g.n}</span>
                      <span className="t-label text-ink/60">{g.title}</span>
                    </div>
                    <div className="mt-4">
                      {g.kind === 'text' && (
                        <input
                          type="text"
                          value={values[g.field]}
                          placeholder={g.placeholder}
                          onChange={(e) => set(g.field, e.target.value)}
                          className="font-display w-full border-b border-ink/20 bg-transparent pb-2.5 text-lg text-ink outline-none placeholder:text-ink/30 focus:border-ink"
                        />
                      )}
                      {g.kind === 'chip' && (
                        <div role="radiogroup" aria-label={g.field} className="flex flex-wrap gap-2.5">
                          {g.options.map((opt) => (
                            <Chip
                              key={opt}
                              label={opt}
                              on={values[g.field] === opt}
                              onClick={() => set(g.field, opt)}
                            />
                          ))}
                        </div>
                      )}
                      {g.kind === 'textarea' && (
                        <>
                          <textarea
                            rows={3}
                            maxLength={g.maxLength}
                            value={values[g.field]}
                            placeholder={g.placeholder}
                            onChange={(e) => set(g.field, e.target.value)}
                            className="font-sans w-full resize-none rounded-lg border border-ink/15 bg-white/40 p-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink/40"
                          />
                          <p className="t-label mt-2 text-right text-[0.6rem] text-ink/35">
                            {values[g.field].length} / {g.maxLength}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {current.type === 'contact' && (
              <div className="space-y-7">
                <div className="grid gap-6 sm:grid-cols-2">
                  {current.fields.map((f) => (
                    <label key={f.name} className={f.name === 'email' ? 'sm:col-span-2 block' : 'block'}>
                      <span className="t-label text-ink/50">{f.label}</span>
                      <span className="mt-2 flex items-center gap-2.5 border-b border-ink/20 pb-2.5 focus-within:border-ink">
                        <span className="text-ink/40">
                          <Icon name={f.icon} size={15} />
                        </span>
                        <input
                          type={f.type}
                          value={values[f.name]}
                          autoComplete={f.autoComplete}
                          onChange={(e) => set(f.name, e.target.value)}
                          aria-invalid={!!error && f.name === 'name' && !values.name.trim() ? true : undefined}
                          className="font-sans w-full bg-transparent text-sm text-ink outline-none"
                        />
                      </span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-ink/10 pt-6">
                  <span className="t-label text-ink/60">{current.method.title}</span>
                  <p className="t-body mt-1.5 text-sm text-ink/50">{current.method.note}</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {current.method.options.map((opt) => (
                      <IconCard
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.value}
                        on={values.method === opt.value}
                        onClick={() => set('method', opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-ink/10 pt-6">
                  <span className="t-label text-ink/60">{current.time.title}</span>
                  <p className="t-body mt-1.5 text-sm text-ink/50">{current.time.note}</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {current.time.options.map((opt) => (
                      <IconCard
                        key={opt.value}
                        icon={opt.icon}
                        label={opt.value}
                        meta={opt.meta}
                        on={values.time === opt.value}
                        onClick={() => set('time', opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-ink/[0.035] p-4">
                  <span className="mt-0.5 text-ink/50">
                    <Icon name="shield" size={17} />
                  </span>
                  <div>
                    <p className="t-label text-ink">{current.privacy.title}</p>
                    <p className="t-body mt-1 text-xs text-ink/55">{current.privacy.body}</p>
                  </div>
                </div>
              </div>
            )}

            {current.type === 'review' && (
              <div className="divide-y divide-ink/10 rounded-xl border border-ink/10">
                {[
                  ['Building', values.space],
                  ['Budget', values.budget],
                  ['City', values.city],
                  ['Timeline', values.timeline],
                  ['Contact method', values.method],
                  ['Best time', values.time],
                  ['Name', values.name],
                  ['Phone', values.phone],
                  ['Email', values.email],
                ]
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="flex items-baseline justify-between gap-6 px-4 py-3">
                      <span className="t-label text-ink/45">{label}</span>
                      <span className="t-body text-right text-sm text-ink">{v}</span>
                    </div>
                  ))}
                {values.message.trim() && (
                  <div className="px-4 py-3">
                    <span className="t-label text-ink/45">The room</span>
                    <p className="t-body mt-2 text-sm text-ink/75">{values.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- Nav ---- */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-ink/10 pt-7">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="t-label focus-ring text-ink/45 hover:text-ink"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            {current.type === 'review' ? (
              <button
                type="button"
                onClick={send}
                className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-paper transition-opacity duration-300 hover:opacity-85"
              >
                <span className="t-label">{wizard.submit}</span>
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-paper transition-opacity duration-300 hover:opacity-85"
              >
                <span className="t-label">Continue</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          <p className="t-label mt-3 h-4 text-ink/70" role="alert">
            {error}
          </p>
        </>
      )}
    </div>
  )
}
