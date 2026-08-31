import { createContext, useContext } from 'react'

/* The route context lives here rather than beside the provider so that
   the provider file exports components and nothing else — which is
   what keeps React Fast Refresh working on it during development. */

export const RouteContext = createContext({ path: '/', navigate: () => {} })

/** Current pathname, plus the navigate() that drives the transition. */
export const useRoute = () => useContext(RouteContext)
