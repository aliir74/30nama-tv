import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/endpoints'
import type { Notification } from '../api/types'
import { Screen } from '../components/Screen'
import { SideMenu } from '../components/SideMenu'
import { log } from '../lib/log'
import { useStack } from '../nav/stack'

const textOf = (n: Notification) => n.text || n.message || n.content || ''
const dateOf = (n: Notification) => (typeof n.date === 'string' ? n.date : n.date?.j || n.date?.g || '')

export function Notifications({ active }: { active: boolean }) {
  const { push } = useStack()
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['notifications', 1], queryFn: () => api.notifications(1), staleTime: 0, enabled: active })
  const { ref, focusKey } = useFocusable({ focusKey: 'notif-list', trackChildren: true, saveLastFocusedChild: true })
  const items = list.data?.notifications ?? []

  const open = (n: Notification) => {
    if (!n.read)
      api
        .readNotification(n.id)
        .then(() => qc.invalidateQueries({ queryKey: ['notifications'] }))
        .catch((e) => log('notification_read', false, e))
    if (n.post_id) push({ name: 'title', id: n.post_id })
  }

  return (
    <Screen id="notifications" active={active}>
      <div className="page has-rail">
        <SideMenu current="notifications" />
        <div className="scroll-page">
          <div className="page-head">
            <h1>اعلان‌ها</h1>
          </div>
          {list.isLoading && <div className="spinner center" />}
          {list.isError && <p className="error">{(list.error as Error).message}</p>}
          {list.isSuccess && items.length === 0 && <p className="grid-note">اعلان تازه‌ای ندارید.</p>}
          <FocusContext.Provider value={focusKey}>
            <div ref={ref} className="notif-list">
              {items.map((n) => (
                <Item key={n.id} n={n} onOpen={open} />
              ))}
            </div>
          </FocusContext.Provider>
        </div>
      </div>
    </Screen>
  )
}

function Item({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  const { ref, focused } = useFocusable({ onEnterPress: () => onOpen(n), onFocus: () => ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }) })
  return (
    <div ref={ref} className={`notif ${focused ? 'focused' : ''} ${n.read ? '' : 'unread'}`} onClick={() => onOpen(n)}>
      <div className="notif-head">
        <strong dir="auto">{n.title}</strong>
        <span className="notif-date">{dateOf(n)}</span>
      </div>
      {textOf(n) && <p dir="auto">{textOf(n)}</p>}
    </div>
  )
}
