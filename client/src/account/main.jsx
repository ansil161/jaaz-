import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '../styles/console.css'
import { setUnauthenticatedHandler } from '../lib/api'
import { redirectToLogin } from '../lib/useSession'
import AccountApp from './AccountApp'
import LoginPage from './LoginPage'

/* The account app: sign-in, and the assistant behind it.
 *
 * ONE HTML ENTRY, TWO SCREENS. vite.config.js rewrites everything under
 * /account to this file, so the path is read here rather than by a router.
 * Two screens and one boundary between them do not justify a routing
 * library, and the marketing site's constraint against new heavy
 * dependencies applies to the console bundles too.
 *
 * The check is `startsWith`, not equality, so /account/login and any future
 * /account/login/reset land on the same screen.
 *
 * The 401 handler answers "what happens when a session expires mid
 * conversation": the request comes back 401 and the person is sent to sign
 * in with their current address attached, so they return to where they were
 * rather than to a blank assistant.
 *
 * It is registered ONLY off the login page. LoginPage's first act is to ask
 * /api/auth/me, and for a signed-out visitor that 401 is the expected
 * answer — not a failure. With a handler installed it would redirect the
 * login page to the login page, forever. */
const isLogin = window.location.pathname.startsWith('/account/login')

if (!isLogin) setUnauthenticatedHandler(redirectToLogin)

document.title = isLogin ? 'Sign in — JAAZ' : 'Assistant — JAAZ'

createRoot(document.getElementById('root')).render(
  <StrictMode>{isLogin ? <LoginPage /> : <AccountApp />}</StrictMode>,
)
