/* The one place either console app talks to the backend.
 *
 * Both the account app and the admin app import this. Neither has its own
 * copy of the credential handling, and neither has any idea what a JWT is —
 * the session lives in an HttpOnly cookie, which JavaScript cannot read by
 * design, so `credentials: 'include'` is the entire client-side story.
 *
 * If you ever find yourself wanting to read the token here: that is the
 * thing this design is built to prevent. Ask GET /api/auth/me instead. */

/* Empty by default. In development Vite proxies /api to Django so the two
 * are same-origin, which is what lets the cookie be SameSite=Lax and the
 * CSRF origin check pass without any special configuration. Set
 * VITE_API_BASE_URL only for a deployment that genuinely splits them — and
 * then the backend needs CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS to
 * match, and the cookie needs SameSite=None; Secure. */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const CSRF_COOKIE = 'csrftoken'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/* A failure the API described on purpose. `code` is the stable identifier —
 * branch on that, never on the message, which is written for a person to
 * read and may be reworded. */
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details ?? null
  }

  get isUnauthenticated() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }
}

/* Raised when the request never reached the server — offline, DNS, the dev
 * backend not running. Kept distinct from ApiError because the advice to the
 * user is different: try again, rather than fix your input. */
export class NetworkError extends Error {
  constructor(cause) {
    super('Unable to reach the server. Check your connection and try again.')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

function readCookie(name) {
  const prefix = `${name}=`
  for (const part of document.cookie.split('; ')) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length))
  }
  return null
}

/* Django will not accept a state-changing request without a CSRF token, and
 * on a browser's very first visit there is no csrftoken cookie to echo. This
 * asks for one. It is a GET, so it needs no token itself. */
async function ensureCsrfToken() {
  const existing = readCookie(CSRF_COOKIE)
  if (existing) return existing

  await fetch(`${BASE_URL}/api/auth/csrf/`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  return readCookie(CSRF_COOKIE)
}

/* Set once, by the admin app, so that a session expiring mid-session sends
 * the person back to the login page instead of leaving them looking at a
 * dashboard that has quietly stopped loading. The login page deliberately
 * does not register one — it is already where a 401 would send you. */
let onUnauthenticated = null

export function setUnauthenticatedHandler(handler) {
  onUnauthenticated = handler
}

async function parseBody(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    /* A non-JSON body from an API that only speaks JSON means something
     * upstream answered instead — a proxy error page, usually. There is
     * nothing in it worth showing anyone. */
    return null
  }
}

function toApiError(response, body) {
  const error = body?.error
  return new ApiError({
    status: response.status,
    code: error?.code ?? 'UNEXPECTED_ERROR',
    message: error?.message ?? 'Something went wrong. Please try again.',
    details: error?.details,
  })
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }

  if (!SAFE_METHODS.has(method)) {
    const csrf = await ensureCsrfToken()
    if (csrf) headers['X-CSRFToken'] = csrf
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      /* Without this the browser sends no cookie and every request is
       * anonymous. It is the single line that makes cookie auth work. */
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new NetworkError(cause)
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    const error = toApiError(response, payload)
    if (error.isUnauthenticated) onUnauthenticated?.(error)
    throw error
  }

  return payload
}

/* Uploads go through XMLHttpRequest rather than fetch, for one reason:
 * fetch cannot report upload progress. A 20MB PDF on a slow connection with
 * nothing but a spinner is indistinguishable from a hung page, so the
 * progress event is worth the older API.
 *
 * Everything else — the cookie, the CSRF token, the error envelope — is
 * identical to apiFetch, and deliberately so. Content-Type is the one header
 * NOT set here: the browser has to write it itself so it can include the
 * multipart boundary. */
export async function apiUpload(path, { file, fields = {}, onProgress, signal } = {}) {
  const csrf = await ensureCsrfToken()

  const form = new FormData()
  form.append('file', file)
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') form.append(key, value)
  }

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${BASE_URL}${path}`)
    request.withCredentials = true
    request.setRequestHeader('Accept', 'application/json')
    if (csrf) request.setRequestHeader('X-CSRFToken', csrf)

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    })

    request.addEventListener('load', () => {
      let payload = null
      try {
        payload = request.responseText ? JSON.parse(request.responseText) : null
      } catch {
        payload = null
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(payload)
        return
      }

      const error = new ApiError({
        status: request.status,
        code: payload?.error?.code ?? 'UNEXPECTED_ERROR',
        message: payload?.error?.message ?? 'The upload could not be completed.',
        details: payload?.error?.details,
      })
      if (error.isUnauthenticated) onUnauthenticated?.(error)
      reject(error)
    })

    request.addEventListener('error', () => reject(new NetworkError()))
    request.addEventListener('abort', () =>
      reject(Object.assign(new Error('Upload cancelled'), { name: 'AbortError' })),
    )

    signal?.addEventListener('abort', () => request.abort())
    request.send(form)
  })
}

/* -- Server-Sent Events, for streamed answers -------------------------- */

/* Why this is here rather than in the assistant feature: it is a request to
 * the same backend with the same cookie and the same CSRF token, and the
 * moment a second module starts doing credential handling there are two
 * versions of it to keep in step. Everything below the fetch is SSE parsing;
 * everything above it is identical to apiFetch.
 *
 * fetch, not EventSource. EventSource can only issue GET requests and cannot
 * set headers, so it can carry neither the question nor the CSRF token. The
 * ReadableStream on a fetch response does both and gives cancellation for
 * free — aborting the signal closes the socket, which Django sees as a client
 * disconnect and turns into a cancelled, unbilled generation upstream. */
export async function apiStream(path, { body, signal, onEvent } = {}) {
  const csrf = await ensureCsrfToken()

  const headers = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  }
  if (csrf) headers['X-CSRFToken'] = csrf

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body ?? {}),
      signal,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new NetworkError(cause)
  }

  /* A failure before the stream opens is still an ordinary HTTP error with a
   * JSON envelope — 401, 403, 429, 400. Only failures *after* the 200 has
   * been sent arrive as `error` frames, because by then the status line is
   * long gone. */
  if (!response.ok) {
    const payload = await parseBody(response)
    const error = toApiError(response, payload)
    if (error.isUnauthenticated) onUnauthenticated?.(error)
    throw error
  }

  if (!response.body) {
    throw new NetworkError(new Error('This browser cannot read streamed responses.'))
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      /* `stream: true` keeps a multi-byte character that straddles two
       * network chunks intact. Without it a single emoji or accented letter
       * arriving on a chunk boundary decodes to a replacement character. */
      buffer += decoder.decode(value, { stream: true })

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const event = parseEventFrame(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        if (event) onEvent?.(event)
        boundary = buffer.indexOf('\n\n')
      }
    }

    /* A final frame with no trailing blank line. Well-behaved servers send
     * one, but a connection closed cleanly right after the last event will
     * otherwise drop it — and the last event is message_complete. */
    const trailing = parseEventFrame(buffer)
    if (trailing) onEvent?.(trailing)
  } finally {
    /* Releases the connection when the caller aborted mid-answer. Throws if
     * the stream already ended, which is not a failure worth reporting. */
    try {
      await reader.cancel()
    } catch {
      /* Already closed. */
    }
  }
}

/* One SSE frame → { event, data }, or null if there is nothing in it.
 *
 * Lines beginning with a colon are comments — the keepalives ai_service
 * sends while retrieval is running so an idle proxy does not close the
 * connection. They are dropped here and never reach the UI. */
function parseEventFrame(frame) {
  const trimmed = frame.replace(/\r/g, '').trim()
  if (!trimmed) return null

  let event = 'message'
  const data = []

  for (const line of trimmed.split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
  }

  if (data.length === 0) return null

  try {
    return { event, data: JSON.parse(data.join('\n')) }
  } catch {
    /* The protocol is JSON-only. Anything else came from something that is
     * not ai_service, and there is nothing in it worth showing anyone. */
    return null
  }
}
