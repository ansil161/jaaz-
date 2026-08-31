/* Where to send someone after they sign in.
 *
 * The destination arrives in a query string, which means it arrives from
 * whoever wrote the link — including someone who emailed it. An unchecked
 * `?next=` is an open redirect: the login page is genuinely ours, the person
 * signs in for real, and then gets handed to an attacker's site carrying
 * whatever trust the JAAZ domain earned.
 *
 * So only a plain same-origin path is accepted, and anything else silently
 * falls back to the console root. */

/* Where each kind of account belongs when no destination was requested.
 *
 * Two areas, two audiences. `/account` is the assistant — every signed-in
 * account has one, because asking the knowledge base a question is the thing
 * the product does. `/admin` is the console, where the knowledge base is
 * curated, and it is for staff.
 *
 * Sending an administrator to /admin rather than to the assistant is not a
 * statement that they may not use it — the chat API accepts any
 * authenticated account, and /account works for them too. It is just the
 * screen they came for. */
const HOME_FOR_ROLE = {
  admin: '/admin',
  member: '/account',
}

const DEFAULT_DESTINATION = '/account'

export function homeFor(role) {
  return HOME_FOR_ROLE[role] ?? DEFAULT_DESTINATION
}

export function safeNextPath(search, fallback = DEFAULT_DESTINATION) {
  const candidate = new URLSearchParams(search).get('next')
  if (!candidate) return fallback

  /* Must be a path on this origin. `//evil.com` and `/\evil.com` are both
   * protocol-relative URLs that browsers treat as absolute, so a leading
   * slash on its own is not enough of a test. */
  if (!candidate.startsWith('/')) return fallback
  if (candidate.startsWith('//') || candidate.startsWith('/\\')) return fallback

  return candidate
}

export function loginPathFor(pathname, searchAndHash = '') {
  const next = encodeURIComponent(`${pathname}${searchAndHash}`)
  return `/account/login?next=${next}`
}
