# PRODUCT — JAZ

> Inferred from the repository (client/src/features/public/data/site.js, solutions.js, about.js,
> contact.js, HOME_PAGE_DESIGN.MD) rather than from a live interview. Every line
> below is traceable to shipped copy or code. Correct anything that is wrong.

## What it is
JAZ designs and builds private home entertainment spaces — dedicated cinemas,
living-room theatres, gaming and party rooms, bars, terraces — with acoustics,
picture, seating, lighting and control engineered as ONE system by one team.

Based in Kochi. Works across India and the Gulf.

## The thesis
"Entertainment without comfort is just noise."
Comfort is the product, not the equipment list. Three comfort axes: Visual,
Acoustic, Seating.

## Who it is for
Homeowners, architects and interior designers commissioning a private
entertainment room. High-consideration, long sales cycle, in-person survey
required. Not e-commerce: nothing is bought on the site.

## What the site must do
Move a qualified visitor to "Book a Consultation." One reply within a working day.

## The Solutions catalogue (the surface in scope)
Nine sellable systems, each quoted, engineered and signed off on its own:
01 Private Home Theatre (Flagship) · 02–09 follow, spanning from a full
dedicated cinema down to a living-room upgrade and staged acoustic treatment.
Shared fields per solution: n, title, tier, sub, meta, range, hero photo,
signature scroll mechanism, and a detail page at /solutions/:slug.

Visitor's real question on this page: "Which of the nine is mine?"
Secondary: "What does that cost, roughly, and how long does it take?"
Escape hatch: "None of these — tell us the room" → /contact.

## Constraints that are not negotiable
- React 19 + Vite 8, Tailwind v4 (@theme tokens in index.css), GSAP 3 +
  ScrollTrigger + SplitText, Lenis smooth scroll. No new heavy dependencies.
- Photography comes only from the verified PLATES slot map in data/site.js via
  img(). An unverified id is a broken image in production.
- Every motion collapses to a legible static page under prefers-reduced-motion.
- Copy is factual. No invented claims, prices or client names.
