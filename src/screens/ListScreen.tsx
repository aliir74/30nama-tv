import { useState } from 'react'
import { api } from '../api/endpoints'
import type { Page, Title } from '../api/types'
import { Button } from '../components/Button'
import { Grid } from '../components/Grid'
import { Screen } from '../components/Screen'
import { useStack, type ListSource } from '../nav/stack'

// Only these two orders change the result on v2; "imdb" and "date" fall back to relevance.
type Order = 'relevant' | 'year'

function fetcher(source: ListSource, order: Order): (page: number) => Promise<Page> {
  if (source.kind === 'archive') return (page) => api.archive(source.slug, page, order)
  if (source.kind === 'filter') return (page) => api.advancedSearch(source.params, page, order)
  return (page) => api.advancedSearch({ [source.role]: source.imdb || source.name, stream: 'true' }, page, order)
}

export function ListScreen({ title, source, active, routeKey }: { title: string; source: ListSource; active: boolean; routeKey: string }) {
  const { push } = useStack()
  const [order, setOrder] = useState<Order>('relevant')
  const open = (t: Title) => push({ name: 'title', id: t.id })
  const subtitle = source.kind === 'person' ? (source.role === 'actor' ? 'آثار بازیگر' : 'آثار کارگردان') : null

  return (
    <Screen id={`list-${routeKey}`} active={active}>
      <div className="page">
        <div className="scroll-page">
          <div className="page-head">
            <div>
              {subtitle && <div className="page-kicker">{subtitle}</div>}
              <h1 className={/[؀-ۿ]/.test(title) ? '' : 'latin'}>{title}</h1>
            </div>
            <div className="chips">
              <Button className={order === 'relevant' ? 'selected' : ''} onPress={() => setOrder('relevant')}>
                مرتبط‌ترین
              </Button>
              <Button className={order === 'year' ? 'selected' : ''} onPress={() => setOrder('year')}>
                جدیدترین
              </Button>
            </div>
          </div>
          <Grid
            key={order}
            queryKey={['list', routeKey, order]}
            fetchPage={fetcher(source, order)}
            onOpen={open}
            focusKey={`list-${routeKey}-grid`}
            autoFocus={active}
          />
        </div>
      </div>
    </Screen>
  )
}
