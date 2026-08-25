/* ============================================================
   CONTACT ICONS

   One small, hand-drawn set at a single stroke weight (1.25,
   square caps) — the same convention the site's Arrow already
   uses elsewhere, so a page built almost entirely from icon
   cards still reads as this brand's line work rather than a
   dropped-in icon font.
   ============================================================ */

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
  focusable: false,
}

const ICONS = {
  theatre: (
    <>
      <rect x="4" y="6" width="16" height="10" />
      <path d="M4 20h16M9 20v-4M15 20v-4" />
    </>
  ),
  sofa: (
    <>
      <path d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
      <rect x="3" y="12" width="18" height="6" />
      <path d="M4 18v2M20 18v2" />
    </>
  ),
  controller: (
    <>
      <path d="M6 9h12l2 8a2 2 0 0 1-3.6 1.4L15 16H9l-1.4 2.4A2 2 0 0 1 4 17z" />
      <path d="M9 12h2M8 11v2M15 12.5h.01M17.5 10.5h.01" />
    </>
  ),
  glass: (
    <>
      <path d="M6 4h12l-2 9a4 4 0 0 1-8 0z" />
      <path d="M12 13v7M9 20h6" />
    </>
  ),
  terrace: (
    <>
      <path d="M3 10a9 9 0 0 1 18 0z" />
      <path d="M12 10v10M12 20H8M12 20h4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.4 2.4 0 1 1 3.6 2c-1 .7-1.2 1.1-1.2 2" />
      <path d="M12 17h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5" />
    </>
  ),
  phone: (
    <path d="M6 3l3 1 .5 3-2 2c1 2.5 2.5 4 5 5l2-2 3 .5 1 3c-1.5 2-4 2.5-6.5 1.5C7.5 15.5 4.5 12.5 3 9 2 6.5 3 4.5 6 3z" />
  ),
  whatsapp: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.4-1.2A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M8.7 8.2c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5l.6 1.5c.1.2 0 .4-.1.5l-.5.6c-.1.2-.1.3 0 .5.4.8 1.5 1.9 2.3 2.3.2.1.3.1.5 0l.6-.5c.1-.1.3-.2.5-.1l1.5.6c.4.2.4.4.4.6v.5c0 .3 0 .6-.5.8-1 .5-2.3.3-3.7-.5-1.6-.9-2.9-2.2-3.8-3.8-.8-1.4-1-2.7-.5-3.7z" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" />
      <path d="M4 6.5l8 6.5 8-6.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17.5" cy="6" r="2.3" />
      <circle cx="17.5" cy="18" r="2.3" />
      <path d="M8.1 10.8l7.4-3.6M8.1 13.2l7.4 3.6" />
    </>
  ),
  'sun-rise': (
    <>
      <path d="M12 4v3M5 12H2M22 12h-3M5.6 8.6l-2-2M20.4 8.6l2-2" />
      <path d="M6 15a6 6 0 0 1 12 0" />
      <path d="M2 19h20" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 3v2.4M12 18.6V21M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M3 12h2.4M18.6 12H21M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
    </>
  ),
  moon: <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4 6.8 6.8 0 0 0 20 13.5z" />,
  shield: (
    <>
      <path d="M12 3.5l7 2.5v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V5M8.5 8.5L12 5l3.5 3.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
}

/** `<Icon name="phone" />` — falls back to nothing for an unknown key
    rather than throwing, so a data typo loses a glyph, not the page. */
export function Icon({ name, className = '', size }) {
  const path = ICONS[name]
  if (!path) return null
  return (
    <svg
      {...base}
      width={size ?? base.width}
      height={size ?? base.height}
      className={className}
    >
      {path}
    </svg>
  )
}
