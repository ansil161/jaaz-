/* The admin console's own endpoints.
 *
 * Split from `auth` because the account app has no business importing them:
 * the two consoles share a transport, not a surface area. */

import { apiFetch } from './client'

export const adminApi = {
  overview: (signal) => apiFetch('/api/admin/overview/', { signal }),
}
