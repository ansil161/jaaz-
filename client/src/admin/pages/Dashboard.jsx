import { useEffect, useState } from 'react'

import Spinner from '../../components/console/Spinner'
import { ApiError, adminApi } from '../../lib/api'

/* The dashboard.
 *
 * Small on purpose. It exists to prove the whole chain works end to end —
 * cookie, token, authorization, data — and to be the place the console grows
 * from. The numbers come from an endpoint that four separate checks stand in
 * front of, and if any of them fail this page shows why rather than
 * rendering an empty grid. */

const CARDS = [
  { key: 'totalAccounts', label: 'Accounts' },
  { key: 'administrators', label: 'Administrators' },
  { key: 'activeAccounts', label: 'Active' },
  { key: 'signedInLast30Days', label: 'Signed in · 30d' },
]

export default function Dashboard({ user }) {
  const [state, setState] = useState({ loading: true, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()

    adminApi
      .overview(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ loading: false, data, error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        /* A 401 has already sent the browser to the login page — the handler
         * registered in main.jsx did that. Showing an error here as well
         * would flash a failure at someone who is already on their way out. */
        if (error instanceof ApiError && error.isUnauthenticated) return
        setState({ loading: false, data: null, error })
      })

    return () => controller.abort()
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <h2 className="font-display text-3xl leading-tight text-paper sm:text-4xl">
          Welcome, {user.name}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-mist">
          You are signed in to the JAAZ administration console. This is the
          foundation — sections will appear here as they are built.
        </p>
      </header>

      <section aria-labelledby="overview-heading" className="mt-10">
        <h3
          id="overview-heading"
          className="font-mono text-[0.6875rem] tracking-[0.2em] text-mist uppercase"
        >
          Overview
        </h3>

        <div className="mt-4">
          {state.loading ? (
            <div className="flex items-center gap-3 border border-[var(--rule)] px-5 py-8 text-sm text-mist">
              <Spinner label="Loading the overview" />
              <span aria-hidden="true">Loading…</span>
            </div>
          ) : state.error ? (
            <ErrorPanel error={state.error} />
          ) : (
            <dl className="grid grid-cols-2 gap-px border border-[var(--rule)] bg-[var(--rule)] lg:grid-cols-4">
              {CARDS.map(({ key, label }) => (
                <div key={key} className="bg-ink px-5 py-6">
                  <dt className="font-mono text-[0.625rem] tracking-[0.16em] text-mist uppercase">
                    {label}
                  </dt>
                  {/* Tabular figures so the numbers line up as they change. */}
                  <dd className="mt-3 font-display text-4xl text-paper tabular-nums">
                    {state.data.stats[key]}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    </div>
  )
}

function ErrorPanel({ error }) {
  const forbidden = error instanceof ApiError && error.isForbidden

  return (
    <div
      role="alert"
      className="border border-[var(--rule)] border-l-2 border-l-signal px-5 py-6"
    >
      <p className="text-sm text-fog">{error.message}</p>
      {forbidden ? null : (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 border border-[var(--rule-strong)] px-4 py-2 font-mono text-[0.6875rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
        >
          Try again
        </button>
      )}
    </div>
  )
}
