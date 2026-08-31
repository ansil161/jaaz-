import { useEffect, useRef, useState } from 'react'

import Spinner from '@/components/feedback/Spinner'
import { ApiError } from '@/services/api/client'
import { auth } from '@/services/api/auth'
import { homeFor, safeNextPath } from '@/utils/nextPath'
import Field from '@/features/account/auth/components/Field'

/* Sign-in.
 *
 * This page holds no authentication logic of its own. It collects two
 * strings, posts them, and reacts to what comes back. The decision, the
 * hashing, the token and the cookie are all the server's — which is why
 * there is nothing here to keep in sync with the admin app.
 *
 * On mount it asks the server whether this browser is already signed in,
 * because the session cookie is HttpOnly and there is no other way to know.
 * Whoever it is gets sent on — to the assistant at /account, or to the
 * console at /admin if they are staff. There is no longer a dead end here:
 * every account has somewhere to be, so the old "you are signed in but have
 * nowhere to go" panel is gone. */

const SESSION = {
  CHECKING: 'checking',
  ANONYMOUS: 'anonymous',
  LEAVING: 'leaving',
}

/* An explicit `?next=` wins, because it is where the person was actually
 * headed when the session expired. Otherwise their role decides. */
function destinationFor(user) {
  return safeNextPath(window.location.search, homeFor(user.role))
}

function validate({ email, password }) {
  const errors = {}
  /* Light client-side checks, purely so nobody waits for a round trip to be
   * told they left a box empty. The server validates everything again and is
   * the only opinion that counts. */
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

export default function LoginPage() {
  const [session, setSession] = useState(SESSION.CHECKING)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    auth
      .me(controller.signal)
      .then(({ user }) => {
        if (controller.signal.aborted) return
        setSession(SESSION.LEAVING)
        window.location.replace(destinationFor(user))
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        /* A 401 here is the expected case — it is what "not signed in"
         * looks like from outside an HttpOnly cookie. Anything else (the
         * backend being down, say) still lands on the form: the person can
         * try to sign in, and they will get a real message if it fails. */
        setSession(SESSION.ANONYMOUS)
        if (!(error instanceof ApiError)) setFormError(error.message)
      })

    return () => controller.abort()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const errors = validate({ email, password })
    setFieldErrors(errors)
    if (errors.email) return emailRef.current?.focus()
    if (errors.password) return passwordRef.current?.focus()

    setSubmitting(true)
    try {
      const { user } = await auth.login(email.trim(), password)
      setSession(SESSION.LEAVING)
      /* `replace`, not `assign`: the login page should not sit in the back
       * history of a signed-in session. */
      window.location.replace(destinationFor(user))
    } catch (error) {
      setSubmitting(false)
      setPassword('')
      passwordRef.current?.focus()

      if (error instanceof ApiError && error.details) {
        setFieldErrors({
          email: error.details.email?.[0],
          password: error.details.password?.[0],
        })
        return
      }
      /* Every message shown here comes from the API's own `message` field,
       * which is written to be read by a person. Nothing from a database
       * driver, a token library or a stack trace can reach this line. */
      setFormError(error.message)
    }
  }

  if (session === SESSION.CHECKING || session === SESSION.LEAVING) {
    return (
      <main className="grid min-h-svh place-items-center bg-ink px-6">
        <Spinner
          label={session === SESSION.LEAVING ? 'Signing you in' : 'Checking your session'}
        />
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-ink px-6 py-16 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-sm flex-col justify-center">
        <header>
          {/* The real mark rather than the mono eyebrow the rest of the
              member chrome uses. A sign-in screen is the one place in
              here that is mostly empty and mostly brand, so it gets the
              artwork; the header and the console sidebar keep the
              typeset label, where an image would compete with the
              "Assistant"/"Admin" title sitting beside it. Reverse
              colourway — this field is `bg-ink`. */}
          <img
            src="/jaz-mark-reverse.png"
            alt="JAZ Home Theater Systems"
            width={840}
            height={515}
            decoding="async"
            className="block h-9 w-auto"
          />
          <h1 className="mt-5 font-display text-4xl leading-[1.05] text-paper">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            Sign in to ask the JAAZ assistant about your documents.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-7">
          {/* aria-live so the failure is announced when it appears, not only
              when someone happens to tab past it. */}
          <div aria-live="polite">
            {formError ? (
              <p className="border-l-2 border-signal bg-ink-3 px-4 py-3 text-sm text-fog">
                {formError}
              </p>
            ) : null}
          </div>

          <Field
            id="email"
            label="Email"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="username"
            autoFocus
            required
            spellCheck="false"
            placeholder="you@example.com"
            value={email}
            inputRef={emailRef}
            error={fieldErrors.email}
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Field
            id="password"
            label="Password"
            type={revealed ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            inputRef={passwordRef}
            error={fieldErrors.password}
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <button
                type="button"
                onClick={() => setRevealed((shown) => !shown)}
                /* A real button in the tab order with a stated pressed
                   state, not an icon that only works with a mouse. */
                aria-pressed={revealed}
                aria-label={revealed ? 'Hide password' : 'Show password'}
                className="px-1 font-mono text-[0.6875rem] tracking-[0.14em] text-mist uppercase transition-colors hover:text-bone"
              >
                {revealed ? 'Hide' : 'Show'}
              </button>
            }
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-3 bg-paper font-mono text-[0.75rem] tracking-[0.18em] text-ink uppercase transition-opacity duration-200 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="console-spinner block size-3.5 rounded-full border border-ink/30 border-t-ink"
                />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-10 text-sm text-ash">
          Trouble signing in? Contact your JAAZ administrator.
        </p>
      </div>
    </main>
  )
}
