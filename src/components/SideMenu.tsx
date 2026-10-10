import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '../api/endpoints'
import { useStack, type Section } from '../nav/stack'

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)

const items: { section: Section; label: string; icon: ReactNode }[] = [
  { section: 'home', label: 'خانه', icon: icon(<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />) },
  { section: 'search', label: 'جستجو', icon: icon(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></>) },
  { section: 'browse', label: 'دسته‌بندی‌ها', icon: icon(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>) },
  { section: 'mylist', label: 'لیست من', icon: icon(<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />) },
  { section: 'notifications', label: 'اعلان‌ها', icon: icon(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>) },
  { section: 'profile', label: 'حساب و تنظیمات', icon: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>) },
]

// A rail on the right (start) edge of every top-level screen; it widens to show labels while focused.
export function SideMenu({ current }: { current: Section }) {
  const { ref, focusKey, hasFocusedChild } = useFocusable({ focusKey: `menu-${current}`, trackChildren: true, saveLastFocusedChild: false })
  const unread = useQuery({ queryKey: ['notifications', 1], queryFn: () => api.notifications(1), staleTime: 10 * 60_000 })
  const badge = unread.data?.total_unread ?? 0
  return (
    <FocusContext.Provider value={focusKey}>
      <nav ref={ref} className={`rail ${hasFocusedChild ? 'open' : ''}`}>
        {items.map((it) => (
          <MenuItem key={it.section} {...it} owner={current} active={it.section === current} badge={it.section === 'notifications' ? badge : 0} />
        ))}
      </nav>
    </FocusContext.Provider>
  )
}

function MenuItem({ section, label, icon, active, badge, owner }: {
  section: Section
  label: string
  icon: ReactNode
  active: boolean
  badge: number
  owner: Section
}) {
  const { navigate } = useStack()
  const go = () => {
    if (!active) navigate(section)
  }
  // Screens below the top stay mounted, so keys are scoped by the screen that owns the menu.
  const { ref, focused } = useFocusable({ focusKey: `menu-${owner}-${section}`, onEnterPress: go })
  return (
    <div ref={ref} className={`rail-item ${focused ? 'focused' : ''} ${active ? 'active' : ''}`} onClick={go}>
      <span className="rail-icon">
        {icon}
        {badge > 0 && <span className="rail-badge">{badge}</span>}
      </span>
      <span className="rail-label">{label}</span>
    </div>
  )
}
