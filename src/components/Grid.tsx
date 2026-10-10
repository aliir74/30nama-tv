import { FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import type { Page, Title } from '../api/types'
import { Card } from './Row'

// A paged poster grid. The next page loads when focus reaches the last row.
export function Grid({ queryKey, fetchPage, onOpen, columns = 6, focusKey, empty = 'چیزی پیدا نشد', enabled = true, autoFocus = false }: {
  queryKey: QueryKey
  fetchPage: (page: number) => Promise<Page>
  onOpen: (t: Title) => void
  columns?: number
  focusKey?: string
  empty?: string
  enabled?: boolean
  // Take focus once the first page arrives (for screens that open straight onto the grid).
  autoFocus?: boolean
}) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.pages && all.length < last.pages && last.posts.length ? all.length + 1 : undefined),
    staleTime: 5 * 60_000,
    enabled,
  })
  const { ref, focusKey: key } = useFocusable({ focusKey, saveLastFocusedChild: true })
  const items = query.data?.pages.flatMap((p) => p.posts) ?? []
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  const loaded = items.length > 0

  useEffect(() => {
    if (autoFocus && loaded) setFocus(key)
  }, [autoFocus, loaded, key])

  const onCardFocus = useCallback(
    (el: HTMLElement, index: number) => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      if (index >= items.length - columns && hasNextPage && !isFetchingNextPage) fetchNextPage()
    },
    [items.length, columns, hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  return (
    <FocusContext.Provider value={key}>
      <div ref={ref} className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 240px)` }}>
        {items.map((t, i) => (
          <Card key={`${t.id}-${i}`} title={t} onOpen={onOpen} onFocusEl={(el) => onCardFocus(el, i)} />
        ))}
      </div>
      {query.isLoading && enabled && <div className="spinner grid-spinner" />}
      {query.isError && <p className="error grid-note">{(query.error as Error).message}</p>}
      {query.isSuccess && items.length === 0 && <p className="grid-note">{empty}</p>}
    </FocusContext.Provider>
  )
}
