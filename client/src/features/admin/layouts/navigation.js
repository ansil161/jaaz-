import { LayoutDashboard, Library, Settings, Users } from 'lucide-react'

/* The console's navigation, as data.
 *
 * Dashboard and Knowledge Base exist. Users and Settings are listed because
 * they are next, and because a sidebar that grows an item later moves
 * everything under it — but they are marked unavailable and rendered inert,
 * not as links to pages that would 404. Building them was out of scope;
 * pretending they work would be worse than either building them or leaving
 * them out.
 *
 * Adding a real section is one entry here plus one case in AdminApp's
 * `renderSection`. */
export const NAVIGATION = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, available: true },
  /* The assistant itself is deliberately NOT here. The console is where the
     knowledge base is curated; asking it questions is what the member area
     at /account is for, and every account has one. Duplicating the chat into
     the console would make administrators the only people who could see both
     halves, which is backwards — they are the ones who least need to ask. */
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    icon: Library,
    available: true,
    /* The parent is not itself a destination — selecting it lands on
       Documents, which is what anyone opening a knowledge base wants first. */
    defaultChild: 'kb-documents',
    children: [
      { id: 'kb-documents', label: 'Documents', available: true },
      { id: 'kb-upload', label: 'Upload', available: true },
    ],
  },
  { id: 'users', label: 'Users', icon: Users, available: false },
  { id: 'settings', label: 'Settings', icon: Settings, available: false },
]

/* Flattened once, so a section id resolves to its label and its parent in a
 * lookup rather than a nested search at every render. */
const INDEX = new Map()
for (const item of NAVIGATION) {
  INDEX.set(item.id, { ...item, parent: null })
  for (const child of item.children ?? []) {
    INDEX.set(child.id, { ...child, parent: item })
  }
}

export function findSection(id) {
  return INDEX.get(id) ?? null
}

/** The heading for a section: "Knowledge Base / Documents". */
export function titleFor(id) {
  const section = findSection(id)
  if (!section) return 'Dashboard'
  return section.parent ? `${section.parent.label} / ${section.label}` : section.label
}

/** Whether a top-level item should read as selected. */
export function isGroupActive(item, current) {
  if (item.id === current) return true
  return (item.children ?? []).some((child) => child.id === current)
}
