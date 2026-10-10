import { init } from '@noriginmedia/norigin-spatial-navigation'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { ApiError, session } from './api/client'
import { api } from './api/endpoints'
import { log, logStore } from './lib/log'
import { is, registerTvKeys } from './lib/tv'
import { StackProvider, type Route } from './nav/stack'
import { Player } from './player/Player'
import { Browse } from './screens/Browse'
import { Filters } from './screens/Filters'
import { Home } from './screens/Home'
import { ListScreen } from './screens/ListScreen'
import { Login } from './screens/Login'
import { MyList } from './screens/MyList'
import { Notifications } from './screens/Notifications'
import { Profile } from './screens/Profile'
import { Search } from './screens/Search'
import { TitleScreen } from './screens/TitleScreen'

init({ rtl: true, throttle: 80, throttleKeypresses: true })

const ROOT: Route = { name: 'home' }

// Short stable id for a list route, used in focus keys and query keys.
function hashOf(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

function renderRoute(r: Route, active: boolean) {
  switch (r.name) {
    case 'home':
      return <Home active={active} />
    case 'search':
      return <Search active={active} />
    case 'browse':
      return <Browse active={active} />
    case 'filters':
      return <Filters active={active} />
    case 'mylist':
      return <MyList active={active} />
    case 'notifications':
      return <Notifications active={active} />
    case 'profile':
      return <Profile active={active} />
    case 'list':
      return <ListScreen title={r.title} source={r.source} active={active} routeKey={hashOf(JSON.stringify(r.source))} />
    case 'title':
      return <TitleScreen id={r.id} active={active} />
    case 'player':
      return <Player key={`${r.id}-${r.fileId ?? ''}`} id={r.id} fileId={r.fileId} active={active} />
  }
}
registerTvKeys()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (n, e) => n < 1 && !(e instanceof ApiError && e.kind !== 'network'),
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Gate />
      <DebugLog />
    </QueryClientProvider>
  )
}

function Gate() {
  const qc = useQueryClient()
  const [hasToken, setHasToken] = useState(() => !!session.get())
  const user = useQuery({ queryKey: ['user'], queryFn: api.user, enabled: hasToken, staleTime: 60 * 60_000, retry: 0 })

  useEffect(() => {
    if (user.isSuccess) log('user', true, `${user.data.user_name} · ${user.data.user_type} · ${user.data.user_expire?.days ?? '?'}d`)
    if (user.isError) {
      log('user', false, user.error)
      // An expired or revoked session sends the viewer back to the QR screen.
      if (user.error instanceof ApiError && user.error.kind === 'unauthorized') {
        session.clear()
        setHasToken(false)
      }
    }
  }, [user.isSuccess, user.isError, user.data, user.error])

  const onLoggedIn = useCallback(() => {
    qc.clear()
    setHasToken(true)
  }, [qc])

  if (!hasToken) return <Login onLoggedIn={onLoggedIn} />
  if (user.isError && !(user.error instanceof ApiError && user.error.kind === 'unauthorized'))
    return <p className="error center">{(user.error as Error).message}</p>
  if (!user.data) return <div className="spinner center" />

  return (
    <StackProvider root={ROOT} render={renderRoute} />
  )
}

function DebugLog() {
  const [open, setOpen] = useState(false)
  const lines = useSyncExternalStore(logStore.subscribe, logStore.snapshot)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (is(e, 'Red') && (e.target as HTMLElement)?.tagName !== 'INPUT') setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!open) return null
  return (
    <div className="debug" dir="ltr">
      <div>{navigator.userAgent}</div>
      {lines.map((l, i) => (
        <div key={i} className={l.ok ? 'ok' : 'fail'}>
          {l.at} {l.ok ? '✓' : '✗'} {l.step} {l.detail}
        </div>
      ))}
    </div>
  )
}
