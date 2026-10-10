import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { exitApp, is } from '../lib/tv'

// Where a title list comes from; one ListScreen renders all of them.
export type ListSource =
  | { kind: 'archive'; slug: string }
  | { kind: 'filter'; params: Record<string, unknown> }
  // `imdb` (nm…) matches exactly; a name alone matches any credit containing one of its words.
  | { kind: 'person'; role: 'actor' | 'director'; name: string; imdb?: string }

export type Route =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'browse' }
  | { name: 'filters' }
  | { name: 'mylist' }
  | { name: 'notifications' }
  | { name: 'profile' }
  | { name: 'list'; title: string; source: ListSource }
  | { name: 'title'; id: number }
  | { name: 'player'; id: number; fileId?: number }

// Destinations of the side menu. Each one sits directly on top of home.
export type Section = 'home' | 'search' | 'browse' | 'mylist' | 'notifications' | 'profile'

type Stack = {
  route: Route
  depth: number
  push: (r: Route) => void
  replace: (r: Route) => void
  back: () => void
  // Jump to a side-menu section, dropping anything stacked above home.
  navigate: (s: Section) => void
}

const StackContext = createContext<Stack | null>(null)

// Screens below the top stay mounted (hidden) so focus and scroll survive a Back press.
export function StackProvider({ root, render }: { root: Route; render: (r: Route, active: boolean) => ReactNode }) {
  const [routes, setRoutes] = useState<Route[]>([root])

  const push = useCallback((r: Route) => setRoutes((s) => [...s, r]), [])
  const replace = useCallback((r: Route) => setRoutes((s) => [...s.slice(0, -1), r]), [])
  const back = useCallback(() => setRoutes((s) => (s.length > 1 ? s.slice(0, -1) : s)), [])
  const navigate = useCallback((s: Section) => setRoutes(s === 'home' ? [root] : [root, { name: s }]), [root])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!is(e, 'Back')) return
      // Text inputs need Backspace for editing.
      if (e.keyCode === 8 && (e.target as HTMLElement)?.tagName === 'INPUT') return
      e.preventDefault()
      setRoutes((s) => {
        if (s.length > 1) return s.slice(0, -1)
        exitApp()
        return s
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const top = routes[routes.length - 1]
  const value = useMemo(
    () => ({ route: top, depth: routes.length, push, replace, back, navigate }),
    [top, routes.length, push, replace, back, navigate],
  )

  return (
    <StackContext.Provider value={value}>
      {routes.map((r, i) => (
        <div key={i} className="screen" hidden={i !== routes.length - 1}>
          {render(r, i === routes.length - 1)}
        </div>
      ))}
    </StackContext.Provider>
  )
}

export function useStack(): Stack {
  const s = useContext(StackContext)
  if (!s) throw new Error('useStack outside StackProvider')
  return s
}
