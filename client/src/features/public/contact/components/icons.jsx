/* ============================================================
   CONTACT ICONS — NOW A RE-EXPORT

   This file used to hold the set. It was the first place on the
   site that drew its own line work — stroke 1.25, square caps,
   miter joins, on a 24 box — and every glyph added since has
   been drawn against it.

   Once the ordinals across the rest of the site became marks
   too, keeping the table here would have made the contact page
   the owner of the site's icon vocabulary by accident, and the
   second copy of `theatre` would have been drawn within a week.
   The table moved to components/Mark.jsx unchanged; every glyph
   this page uses is still in it, at the same coordinates.

   The import path stays valid on purpose: `<Icon name="phone" />`
   reads correctly in a form, `<Mark name="ear" />` reads
   correctly in an editorial list, and they are one component.
   ============================================================ */

export { Mark as Icon } from '../../components/Mark'
