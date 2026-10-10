import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/endpoints'
import type { MenuItem } from '../api/types'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { SideMenu } from '../components/SideMenu'
import { useStack } from '../nav/stack'

// Categories that never stream are left out; this app only plays.
const HIDDEN = ['coming-soon']

export function Browse({ active }: { active: boolean }) {
  const { push } = useStack()
  const menu = useQuery({ queryKey: ['menu'], queryFn: api.menu, staleTime: 6 * 60 * 60_000 })
  const open = (m: MenuItem) => push({ name: 'list', title: m.name, source: { kind: 'archive', slug: m.slug } })

  return (
    <Screen id="browse" active={active} initialFocus="browse-filters">
      <div className="page has-rail">
        <SideMenu current="browse" />
        <div className="scroll-page">
          <div className="page-head">
            <h1>دسته‌بندی‌ها</h1>
            <Button focusKey="browse-filters" variant="primary" onPress={() => push({ name: 'filters' })}>
              جستجوی پیشرفته
            </Button>
          </div>
          {menu.isError && <p className="error">{(menu.error as Error).message}</p>}
          {menu.isLoading && <div className="spinner center" />}
          {menu.data && (
            <>
              <Tiles title="نوع" items={menu.data.categories.filter((c) => !HIDDEN.includes(c.slug))} onOpen={open} wide />
              <Tiles title="ژانر" items={menu.data.genres} onOpen={open} />
            </>
          )}
        </div>
      </div>
    </Screen>
  )
}

function Tiles({ title, items, onOpen, wide }: { title: string; items: MenuItem[]; onOpen: (m: MenuItem) => void; wide?: boolean }) {
  const { ref, focusKey } = useFocusable({ saveLastFocusedChild: true })
  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className="tiles-section">
        <h2 className="section-title">{title}</h2>
        <div className={`tiles ${wide ? 'wide' : ''}`}>
          {items.map((m) => (
            <Tile key={m.slug} item={m} onOpen={onOpen} />
          ))}
        </div>
      </section>
    </FocusContext.Provider>
  )
}

function Tile({ item, onOpen }: { item: MenuItem; onOpen: (m: MenuItem) => void }) {
  const { ref, focused } = useFocusable({
    onEnterPress: () => onOpen(item),
    onFocus: () => ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
  })
  const img = item.image?.webp?.thumb || item.image?.jpg?.thumb
  return (
    <div ref={ref} className={`tile ${focused ? 'focused' : ''}`} onClick={() => onOpen(item)} style={img ? { backgroundImage: `url(${img})` } : undefined}>
      <div className="tile-shade" />
      <span className="tile-name">{item.name}</span>
    </div>
  )
}
