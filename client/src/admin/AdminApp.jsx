import { useState } from 'react'

import Spinner from '../components/console/Spinner'
import { auth } from '../lib/api'
import DocumentsPage from './features/knowledge-base/pages/DocumentsPage'
import UploadPage from './features/knowledge-base/pages/UploadPage'
import Shell from './layout/Shell'
import { titleFor } from './layout/navigation'
import Dashboard from './pages/Dashboard'
import { STATUS, useSession } from '../lib/useSession'

/* The admin application.
 *
 * Every path through this component is a state the session can actually be
 * in, and none of them renders the dashboard before the server has said who
 * is asking:
 *
 *   loading      → a spinner, nothing else
 *   unreachable  → an error with a retry, not a redirect
 *   anonymous    → the login page (the redirect is already in flight)
 *   not an admin → an explanation and a way out, NOT a bounce to /account,
 *                  which would bounce straight back and loop
 *   admin        → the console
 */

export default function AdminApp() {
  const { status, user, error, reload } = useSession()
  const [section, setSection] = useState('dashboard')
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    try {
      await auth.logout()
    } catch {
      /* Ignored deliberately. The cookie may or may not have been cleared,
       * and the login page re-checks the session either way — which is a
       * more honest answer than anything this component could guess. */
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
          <h1 className="font-display text-2xl text-paper">Console unavailable</h1>
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
    return <FullScreen>{<Spinner label="Redirecting to sign in" />}</FullScreen>
  }

  if (user.role !== 'admin') {
    return (
      <FullScreen>
        <div className="max-w-sm text-center">
          <p className="font-mono text-[0.6875rem] tracking-[0.3em] text-mist uppercase">
            403
          </p>
          <h1 className="mt-4 font-display text-2xl text-paper">Not authorised</h1>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            You are signed in as {user.email}, which does not have access to the
            administration console. The assistant is open to your account.
          </p>
          {/* The primary action is the door that IS open. Offering only
              "sign out" would tell someone with a perfectly valid account
              that their only option is to leave. */}
          <a
            href="/account"
            className="mt-6 inline-block border border-bone bg-bone px-5 py-2.5 font-mono text-[0.6875rem] tracking-[0.16em] text-ink uppercase transition-opacity hover:opacity-85"
          >
            Go to the assistant
          </a>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-4 block w-full font-mono text-[0.6875rem] tracking-[0.16em] text-mist uppercase transition-colors hover:text-paper disabled:opacity-45"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </FullScreen>
    )
  }

  return (
    <Shell
      current={section}
      onNavigate={setSection}
      user={user}
      onSignOut={signOut}
      signingOut={signingOut}
      title={titleFor(section)}
    >
      {renderSection(section, { user, navigate: setSection })}
    </Shell>
  )
}

/* One place that maps a section id to a screen. A new section is an entry in
 * navigation.js and a case here — and nothing else in the console changes. */
function renderSection(section, { user, navigate }) {
  switch (section) {
    case 'kb-documents':
      return <DocumentsPage onNavigate={navigate} />
    case 'kb-upload':
      return <UploadPage onNavigate={navigate} />
    default:
      return <Dashboard user={user} />
  }
}

function FullScreen({ children }) {
  return <div className="grid min-h-svh place-items-center bg-ink px-6">{children}</div>
}
