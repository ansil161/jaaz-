import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/site.css'
import App from './App.jsx'

/* Every reveal on this page starts hidden and is released by GSAP.
   `.no-js` is the safety net: if the bundle never runs, the CSS
   rule keyed off it hands back a plain, fully legible document. */
document.documentElement.classList.remove('no-js')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
