import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { memo, useCallback, useRef } from 'react'
import { isLatin, nameOf, posterOf, type Title } from '../api/types'

export function Row({ title, items, onOpen, focusKey }: { title: string; items: Title[]; onOpen: (t: Title) => void; focusKey?: string }) {
  const { ref, focusKey: key } = useFocusable({ focusKey, saveLastFocusedChild: true })
  const rowRef = useRef<HTMLElement | null>(null)

  const onCardFocus = useCallback((el: HTMLElement) => {
    // Keep the focused row on screen, then slide the card into view inside the row.
    rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [])

  if (!items.length) return null
  return (
    <FocusContext.Provider value={key}>
      <section
        className="row"
        ref={(el) => {
          ref.current = el
          rowRef.current = el
        }}
      >
        <h2 className="row-title">{title}</h2>
        <div className="row-track">
          {items.map((t) => (
            <Card key={`${t.id}-${t.data?.id ?? ''}`} title={t} onOpen={onOpen} onFocusEl={onCardFocus} />
          ))}
        </div>
      </section>
    </FocusContext.Provider>
  )
}

// Memoised: a row re-renders when focus enters or leaves it, and its cards need not follow.
export const Card = memo(function Card({ title, onOpen, onFocusEl }: { title: Title; onOpen: (t: Title) => void; onFocusEl: (el: HTMLElement) => void }) {
  const { ref, focused } = useFocusable({
    onEnterPress: () => onOpen(title),
    onFocus: () => ref.current && onFocusEl(ref.current),
  })
  const progress = Number(title.data?.progress ?? 0)
  return (
    <div ref={ref} className={`card ${focused ? 'focused' : ''}`} onClick={() => onOpen(title)}>
      <img
        className="card-poster"
        src={posterOf(title, 'medium')}
        alt=""
        loading="lazy"
        decoding="async"
        // A missing poster shows the empty card instead of the broken-image icon.
        onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
      />
      {title.options.persian_subtitle && <span className="badge">زیرنویس</span>}
      {progress > 0 && (
        <div className="card-progress">
          <div style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      <div className="card-caption">
        <div className={`card-name ${isLatin(nameOf(title)) ? 'latin' : ''}`}>{nameOf(title)}</div>
        {title.data?.episode_title && <div className="card-sub">{title.data.episode_title}</div>}
      </div>
    </div>
  )
})
