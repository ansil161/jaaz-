import { useState } from 'react'

import Spinner from '@/components/feedback/Spinner'
import AssistantPage from '@/features/assistant/pages/AssistantPage'
import { auth } from '@/services/api/auth'
import { STATUS, useSession } from '@/hooks/useSession'
import AccountHeader from '@/features/account/layouts/AccountHeader'

/* The member area: the assistant, and nothing else yet.
 *
 * WHO GETS IN. Any authenticated account. That is not a relaxation of the
 * console's rule, it is a different rule for a different area — the
 * knowledge base belongs to the organisation, and asking it a question is
 * what the product does. Curating it is the restricted act, and that lives
 * at /admin.
 *
 * There is deliberately no role check below. Adding one would be this
 * component inventing an authorization rule the server does not have, and a
 * frontend that decides who may read something is a frontend that will
 * eventually disagree with the backend. The chat API authenticates every
 * request and builds its retrieval filter from `request.user`; this
 * component only needs to know whether anyone is signed in at all.
 *
 * The states below mirror AdminApp's, because they are the states a session
 * can be in and neither app gets to invent its own.
 */
export default function AccountApp() {
  const { status, user, error, reload } = useSession()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    try {
      await auth.logout()
    } catch {
      /* Ignored deliberately. The cookie may or may not have been cleared,
       * and the login page re-checks the session either way — a more honest
       * answer than anything this component could guess. */
    }
    window.location.replace('/account/login')
  }

  if (status === STATUS.LOADING) {
    return <FullScreen>{<Spinner label="Checking your session" />}</FullScreen>
  }

  if (status === STATUS.UNREACHABLE) {
    return (
      <FullScreen>
        <div role="alert" className="max-w-sm text-center">
          <h1 className="font-display text-2xl text-paper">Assistant unavailable</h1>
          <p className="mt-3 text-sm leading-relaxed text-mist">{error.message}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-6 border border-[var(--rule-strong)] px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-bone uppercase transition-colors hover:border-bone"
          >
            Try again
          </button>
        </div>
      </FullScreen>
    )
  }

  if (status === STATUS.ANONYMOUS) {
    /* The redirect is already in flight — main.jsx registered the handler
     * that fires on any 401. A spinner, not a login form: two sign-in forms
     * on two routes would be two things to keep in step. */
    return <FullScreen>{<Spinner label="Redirecting to sign in" />}</FullScreen>
  }

  return (
    <div className="flex min-h-svh flex-col bg-ink">
      <AccountHeader user={user} onSignOut={signOut} signingOut={signingOut} />
      {/* The same horizontal padding and vertical rhythm as the console's
          main region, so the assistant sits identically in both. */}
      <main className="flex-1 px-5 py-6 sm:px-8">
        <AssistantPage />
      </main>
    </div>
  )
}

function FullScreen({ children }) {
  return <div className="grid min-h-svh place-items-center bg-ink px-6">{children}</div>
}
