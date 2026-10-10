import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api/endpoints'
import { nameOf, type Title } from '../api/types'
import { Button } from '../components/Button'
import { Grid } from '../components/Grid'
import { Screen } from '../components/Screen'
import { Sheet } from '../components/Sheet'
import { SideMenu } from '../components/SideMenu'
import { log } from '../lib/log'
import { useStack } from '../nav/stack'

type Tab = 'watchlist' | 'favorite' | 'continue'

const TABS: { tab: Tab; label: string }[] = [
  { tab: 'watchlist', label: 'لیست تماشا' },
  { tab: 'favorite', label: 'علاقه‌مندی‌ها' },
  { tab: 'continue', label: 'ادامه تماشا' },
]

const EMPTY: Record<Tab, string> = {
  watchlist: 'لیست تماشا خالی است. در صفحه هر فیلم «+ لیست تماشا» را بزنید.',
  favorite: 'هنوز چیزی به علاقه‌مندی‌ها اضافه نکرده‌اید.',
  continue: 'چیزی در حال تماشا نیست.',
}

export function MyList({ active }: { active: boolean }) {
  const { push } = useStack()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('watchlist')
  const [picked, setPicked] = useState<Title | null>(null)

  const fetchPage = (page: number) => (tab === 'continue' ? api.continueWatching() : api.list(tab, page))
  const open = (t: Title) => (tab === 'continue' ? setPicked(t) : push({ name: 'title', id: t.id }))

  const dismiss = (t: Title) =>
    api
      .dismissContinue(t.id)
      .then((r) => log('continue_watching_dismiss', r.success, t.id))
      .catch((e) => log('continue_watching_dismiss', false, e))
      .finally(() => {
        qc.invalidateQueries({ queryKey: ['continue_watching'] })
        qc.invalidateQueries({ queryKey: ['mylist', 'continue'] })
      })

  return (
    <Screen id="mylist" active={active} initialFocus="mylist-tab-watchlist">
      <div className="page has-rail">
        <SideMenu current="mylist" />
        <div className="scroll-page">
          <div className="page-head">
            <h1>لیست من</h1>
            <div className="chips">
              {TABS.map((t) => (
                <Button key={t.tab} focusKey={`mylist-tab-${t.tab}`} className={t.tab === tab ? 'selected' : ''} onPress={() => setTab(t.tab)}>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <Grid key={tab} queryKey={['mylist', tab]} fetchPage={fetchPage} onOpen={open} focusKey="mylist-grid" empty={EMPTY[tab]} />
        </div>
        {picked && (
          <Sheet
            id="mylist-sheet"
            title={nameOf(picked) + (picked.data?.episode_title ? ` · ${picked.data.episode_title}` : '')}
            onClose={() => setPicked(null)}
            actions={[
              { label: '▶ ادامه پخش', variant: 'primary', onPress: () => push({ name: 'player', id: picked.id }) },
              { label: 'جزئیات', onPress: () => push({ name: 'title', id: picked.id }) },
              { label: 'حذف از ادامه تماشا', onPress: () => dismiss(picked) },
            ]}
          />
        )}
      </div>
    </Screen>
  )
}
