import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))

/* Three entry points, not one.
 *
 * The marketing site pulls in three.js, GSAP, Lenis smooth-scroll, a
 * preloader and a film-grain overlay. None of that belongs behind a login,
 * and a dashboard that inherits hijacked scrolling is a worse dashboard. Two
 * extra HTML entries keep the bundles genuinely separate: a visitor to the
 * homepage never downloads the console, and the console never downloads a 3D
 * engine. */
const ENTRIES = {
  main: here('./index.html'),
  account: here('./account.html'),
  admin: here('./admin.html'),
}

/* Vite serves multi-page entries at their file path — /account.html. The
 * addresses people actually use are /account/login and /admin, and the
 * production host has to be configured to rewrite those (see the deployment
 * notes). The dev server has to do the same, or the two environments
 * disagree about what a URL means and the difference only shows up after a
 * deploy. */
function consoleRoutes() {
  const rewrite = (req, _res, next) => {
    const [path] = (req.url || '/').split('?')
    if (path === '/account' || path.startsWith('/account/')) {
      req.url = '/account.html'
    } else if (path === '/admin' || path.startsWith('/admin/')) {
      req.url = '/admin.html'
    }
    next()
  }

  /* Block bodies, not expression bodies. `middlewares.use()` returns the
     connect app, and a `configureServer` hook that returns a function is
     treated by Vite as a post-hook to invoke later — it then calls the app
     with no request and the dev server dies on startup with
     "Cannot read properties of undefined (reading 'url')". */
  return {
    name: 'jaaz-console-routes',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), consoleRoutes()],
  build: {
    rollupOptions: { input: ENTRIES },
  },
  server: {
    proxy: {
      /* Proxying makes the API same-origin in development, which is what
       * lets the session cookie be SameSite=Lax and lets Django's CSRF
       * origin check pass with no extra configuration on either side.
       *
       * `changeOrigin` stays false on purpose. Turning it on rewrites the
       * Host header to 127.0.0.1:8000 while the browser still sends
       * `Origin: http://localhost:5173`; Django compares the two, finds they
       * disagree, and rejects every write with a CSRF failure that looks
       * like an application bug. */
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
