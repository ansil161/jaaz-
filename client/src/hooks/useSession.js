import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '@/services/api/client'
import { auth } from '@/services/api/auth'
import { loginPathFor } from '@/utils/nextPath'

/* Who is using the console.
 *
 * The admin app cannot inspect the session cookie — that is what HttpOnly
 * means — so it asks. Until the answer arrives the app renders a loading
 * state and nothing else: rendering the dashboard optimistically and
 * withdrawing it a moment later would flash protected content at someone who
 * may have no right to it, and would make every load look broken.
 *
 * Note what this hook does NOT do: decide anything. `role` comes back from
 * the server and is used to choose which screen to draw. The server has
 * already made the real decision, and makes it again on every request the
 * dashboard sends. */

export const STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
  UNREACHABLE: 'unreachable',
}

export function redirectToLogin() {
  const { pathname, search, hash } = window.location
  /* `replace` so the back button does not walk into a page that will only
   * bounce here again. */
  window.location.replace(loginPathFor(pathname, `${search}${hash}`))
}

export function useSession() {
  const [state, setState] = useState({ status: STATUS.LOADING, user: null, error: null })

  const load = useCallback((signal) => {
    return auth
      .me(signal)
      .then(({ user }) => {
        if (signal?.aborted) return
        setState({ status: STATUS.AUTHENTICATED, user, error: null })
      })
      .catch((error) => {
        if (signal?.aborted) return
        if (error instanceof ApiError && error.isUnauthenticated) {
          setState({ status: STATUS.ANONYMOUS, user: null, error: null })
          return
        }
        /* The backend is unreachable, or answered with something unexpected.
         * Distinct from "not signed in", because bouncing someone to the
         * login page over a network blip would lose their place and teach
         * them nothing. */
        setState({ status: STATUS.UNREACHABLE, user: null, error })
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return { ...state, reload: () => load() }
}
