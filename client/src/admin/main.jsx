import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '../styles/console.css'
import { setUnauthenticatedHandler } from '../lib/api'
import AdminApp from './AdminApp'
import { redirectToLogin } from '../lib/useSession'

/* The admin app. Its own entry point and its own bundle — see vite.config.js.
 *
 * The handler below is the answer to "what happens when a session expires
 * while someone is working". Any request that comes back 401 sends them to
 * the login page with their current address attached, so signing in again
 * returns them to where they were rather than to the dashboard root. */
setUnauthenticatedHandler(redirectToLogin)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
