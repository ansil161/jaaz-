import { img } from './site'

/* ============================================================
   JAAZ — CONTACT PAGE CONTENT

   Rebuilt to the shape of glazewindowsystems.com/contact — the
   same reference ClosingCta.jsx already matches at the foot of
   every page. The page this content drives is that structure,
   in JAAZ's own voice and the site's own black/paper/cove system
   rather than Glaze's own palette:

     HERO + WIZARD   headline, a photo, a five-step enquiry panel
     INFO STRIP      call, hours, email, follow — four columns
     EXPERIENCE      the invitation to visit, on ink
     QUESTIONS       an FAQ accordion
     MAP             the studio location, on ink
     CLOSE           the site's own ClosingCta + Footer

   THE WIZARD is the one genuinely new mechanism this page adds
   to the site — five short questions instead of one long form,
   each revealed only once the one before it is answered. See
   Wizard.jsx for why that reads as more considered than a
   six-field page ever could, not just shorter.
   ============================================================ */

/* --- 01. Hero --------------------------------------------------- */
export const consultation = {
  eyebrow: 'Plan your project',
  headline: ['Tell us about', 'the room.'],
  sub: 'Send the space, the budget band and how you actually want to use it. We respond within one working day.',
  photo: {
    src: img('theatre', 1400, '4:5'),
    alt: 'A finished JAAZ private cinema with the house lights down',
    badge: 'Your space',
  },
  panelLabel: 'Request a consultation',
}

/* --- 02. The wizard ----------------------------------------------
   Five steps. `n` is what the progress rail and the "01" mark
   inside each step both read from — keep it in step with the
   array's own order rather than hand-numbering. */
export const wizard = {
  steps: [
    {
      key: 'space',
      title: 'What are you building?',
      note: 'Tell us about your project. Choose one.',
      type: 'single',
      field: 'space',
      grid: 2,
      options: [
        { value: 'Private Theatre', icon: 'theatre' },
        { value: 'Living Room System', icon: 'sofa' },
        { value: 'Gaming Room', icon: 'controller' },
        { value: 'Bar or Lounge', icon: 'glass' },
        { value: 'Terrace', icon: 'terrace' },
        { value: 'Whole Home', icon: 'home' },
        { value: 'Not Sure Yet', icon: 'question' },
      ],
    },
    {
      key: 'budget',
      title: 'Estimated budget',
      note: 'A band, not a number. It decides what is honest to propose.',
      type: 'chip',
      field: 'budget',
      options: ['Under ₹15L', '₹15L – ₹40L', '₹40L – ₹1Cr', '₹1Cr +', 'Advise me'],
    },
    {
      key: 'details',
      title: 'Project details',
      note: null,
      type: 'compound',
      groups: [
        {
          n: '01',
          title: 'Where the room is',
          kind: 'text',
          field: 'city',
          placeholder: 'City',
        },
        {
          n: '02',
          title: 'Timeline',
          kind: 'chip',
          field: 'timeline',
          options: ['Immediately', '1 – 3 months', '3 – 6 months', 'Not decided'],
        },
        {
          n: '03',
          title: 'Tell us about your project',
          kind: 'textarea',
          field: 'message',
          maxLength: 500,
          placeholder:
            'Basement, roughly 6 × 4.5 m, shell handed over last month. Nine seats if possible…',
        },
      ],
    },
    {
      key: 'contact',
      title: 'Your contact',
      note: null,
      type: 'contact',
      fields: [
        { name: 'name', label: 'Name', type: 'text', icon: 'user', autoComplete: 'name' },
        { name: 'phone', label: 'Phone', type: 'tel', icon: 'phone', autoComplete: 'tel' },
        { name: 'email', label: 'Email', type: 'email', icon: 'mail', autoComplete: 'email' },
      ],
      method: {
        title: 'Preferred contact method',
        note: 'How would you prefer we reach you?',
        field: 'method',
        options: [
          { value: 'Call', icon: 'phone' },
          { value: 'WhatsApp', icon: 'whatsapp' },
          { value: 'Email', icon: 'mail' },
        ],
      },
      time: {
        title: 'Best time to contact',
        note: 'When is the best time to reach you?',
        field: 'time',
        options: [
          { value: 'Morning', meta: '9am – 12pm', icon: 'sun-rise' },
          { value: 'Afternoon', meta: '12pm – 5pm', icon: 'sun' },
          { value: 'Evening', meta: '5pm – 9pm', icon: 'moon' },
        ],
      },
      privacy: {
        title: 'Your information stays private.',
        body: "Never shared. Never sold. We'll usually respond within one working day.",
      },
    },
    {
      key: 'review',
      title: 'Review & send',
      note: 'Everything below goes straight into an email to the studio — nothing is stored anywhere else.',
      type: 'review',
    },
  ],

  submit: 'Send enquiry',
  sent: {
    title: 'Your brief is ready to send.',
    body: 'We opened it in your mail app with every answer already filled in — press send there and it reaches the studio directly.',
    again: 'Start another',
  },
  error: 'Add a name and an email we can reply to.',
  to: 'hello@jaaz.com',
  subject: 'New project enquiry — JAAZ',
}

/* --- 03. Info strip ----------------------------------------------- */
export const infoStrip = [
  {
    key: 'call',
    icon: 'phone',
    title: 'Call & WhatsApp',
    lines: ['+91 98470 00000', 'WhatsApp us'],
    href: 'tel:+919847000000',
  },
  {
    key: 'hours',
    icon: 'clock',
    title: 'Working Hours',
    lines: ['Mon–Sat: 10am–7pm', 'Sunday: Closed'],
  },
  {
    key: 'email',
    icon: 'mail',
    title: 'Write to Us',
    lines: ['hello@jaaz.com', 'We reply within one working day.'],
    href: 'mailto:hello@jaaz.com',
  },
  {
    key: 'follow',
    icon: 'share',
    title: 'Follow Us',
    lines: ['See our latest installations and site stories.'],
    social: [
      { label: 'Instagram', href: '#' },
      { label: 'Facebook', href: '#' },
      { label: 'YouTube', href: '#' },
    ],
  },
]

/* --- 04. Experience invite ------------------------------------- */
export const experience = {
  heading: ['Experience JAAZ', 'in person.'],
  body: 'Step into our experience centre — see, feel and hear the difference.',
  cta: { label: 'Book a visit', href: 'mailto:hello@jaaz.com?subject=Book%20a%20visit%20%E2%80%94%20JAAZ' },
  photos: [
    { src: img('comfortRoom', 1200, '4:5'), alt: 'A JAAZ private cinema, calibrated' },
    { src: img('tech', 1000, '3:4'), alt: 'An equipment rack and tower speakers' },
  ],
}

/* --- 05. Questions ------------------------------------------------ */
export const faq = {
  label: 'Questions',
  heading: ['Before you', 'send it.'],
  body: 'How quickly we reply, what to send with an enquiry, and what happens to it afterwards.',
  items: [
    {
      q: 'How quickly will I hear back?',
      a: 'Within one working day, and usually the same one. Someone who knows the systems reads the enquiry — if you have sent drawings, they will have been through them before they call.',
    },
    {
      q: 'What should I send with my enquiry?',
      a: 'A rough size for the room, what stage it is at, and how you want to use it. Photographs or drawings help but are never required to start the conversation.',
    },
    {
      q: 'Do I have to know which system I want before I enquire?',
      a: 'No. Most people arrive with a room and a feeling, not a spec sheet — that is exactly what the first call is for.',
    },
    {
      q: 'Can I see a room before deciding?',
      a: 'Yes — the experience centre on Marine Drive is a working reference room, booked one session at a time. See the invitation above.',
    },
    {
      q: 'Do you work outside Kochi?',
      a: 'Yes, across India and the Gulf. Site visits are scoped once the brief and location are confirmed.',
    },
    {
      q: 'What happens to the details I send?',
      a: 'They go straight to the studio inbox to reply to you, and nowhere else — no lists, no sharing, no automated follow-ups.',
    },
  ],
}

/* --- 06. Map ----------------------------------------------------- */
export const mapPanel = {
  address: 'JAAZ Experience Centre, 2nd Floor, Marine Drive, Kochi, Kerala 682031',
  hours: 'Mon – Sat · 10:00 – 19:00',
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=Marine+Drive+Kochi+Kerala',
  embedSrc: 'https://www.google.com/maps?q=Marine+Drive,+Kochi,+Kerala&output=embed',
}

/* --- 07. Closing CTA ----------------------------------------------
   Fed straight into the site's own <ClosingCta> — same component
   every other page closes on. */
export const contactCta = {
  heading: ['Six questions, then', 'a conversation.'],
  body: 'The enquiry above is the fastest way in. If you would rather just talk, the line is open through studio hours.',
  /* The closing card carries a photograph now, and this page gets
     its own rather than inheriting the footer's default: the
     default is a finished lounge, which is the right picture under
     "a room worth staying in" and the wrong one under a headline
     about starting a conversation. The atrium plate is architecture
     — steel, glass and one amber screen — which is a studio you
     walk into, not a room you are being sold. Optional everywhere
     else; <Footer> falls back to `footer.cta.plate` without it. */
  plate: {
    src: img('atrium', 1400, '5:4'),
    alt: 'A dark steel-and-glass interior lit by one amber screen',
  },
  primary: { label: 'Write the brief', to: '/contact#consultation' },
  secondary: { label: 'Call the studio', href: 'tel:+919847000000' },
}
