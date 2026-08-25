import { infoStrip } from '../../data/contact'
import { Icon } from './icons'
import { Rise } from '../ui/Motion'

/* ============================================================
   INFO STRIP — call, hours, email, follow.

   Four columns on paper, a circular outline icon over a serif
   heading over the values — the same shape the reference runs
   between its hero panel and its "Experience Glaze in person"
   section, doing the same job here: everything except the form
   and the map, read out in one glance.
   ============================================================ */

export default function InfoStrip() {
  return (
    <section className="relative bg-paper py-16 text-ink sm:py-20">
      <Rise
        className="shell-wide grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 sm:gap-y-0"
        y={18}
        stagger={0.08}
      >
        {infoStrip.map((item) => {
          const Wrapper = item.href ? 'a' : 'div'
          return (
            <Wrapper key={item.key} href={item.href} className="focus-ring group block text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ink/20 text-ink/60 transition-colors duration-400 group-hover:border-ink group-hover:text-ink">
                <Icon name={item.icon} />
              </span>
              <h3 className="t-sub mt-5 text-ink">{item.title}</h3>
              <div className="mt-2 space-y-0.5">
                {item.lines.map((l) => (
                  <p key={l} className="t-body text-sm text-ink/55">
                    {l}
                  </p>
                ))}
              </div>
              {item.social && (
                <div className="mt-4 flex justify-center gap-2.5">
                  {item.social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink/50 transition-colors duration-400 hover:border-ink hover:text-ink"
                    >
                      <span className="t-label text-[0.55rem]">{s.label[0]}</span>
                    </a>
                  ))}
                </div>
              )}
            </Wrapper>
          )
        })}
      </Rise>
    </section>
  )
}
