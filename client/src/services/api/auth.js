/* The authentication endpoints, named.
 *
 * Nothing here does credential handling of its own — the cookie, the CSRF
 * token and the error envelope all belong to `client.js`, and this module is
 * deliberately only a list of the addresses the two console apps are allowed
 * to call. Keeping it separate means a page can ask for `auth` without also
 * pulling the streaming parser and the upload machinery into its bundle. */

import { apiFetch } from './client'

export const auth = {
  login: (email, password) =>
    apiFetch('/api/auth/login/', { method: 'POST', body: { email, password } }),

  logout: () => apiFetch('/api/auth/logout/', { method: 'POST' }),

  /* The only way either app can know whether it is signed in. Returns the
   * user, or throws a 401 ApiError. */
  me: (signal) => apiFetch('/api/auth/me/', { signal }),
}
