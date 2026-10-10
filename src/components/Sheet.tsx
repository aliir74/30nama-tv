import { FocusContext, getCurrentFocusKey, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { isLatin } from '../api/types'
import { is } from '../lib/tv'
import { Button } from './Button'

export type SheetAction = { label: string; onPress: () => void; variant?: 'primary' | 'ghost' }

// A modal list of actions. It traps focus, and Back closes it instead of leaving the screen.
export function Sheet({ id, title, actions, onClose }: { id: string; title: string; actions: SheetAction[]; onClose: () => void }) {
  const { ref, focusKey } = useFocusable({ focusKey: id, isFocusBoundary: true, trackChildren: true })
  // Callers pass inline closures; a ref keeps the effect from re-running (and re-focusing) on render.
  const close = useRef(onClose)
  useLayoutEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    // Focus goes back to whatever opened the sheet once it closes.
    const opener = getCurrentFocusKey()
    const t = setTimeout(() => setFocus(`${id}-0`), 0)
    const onKey = (e: KeyboardEvent) => {
      if (!is(e, 'Back')) return
      e.preventDefault()
      e.stopImmediatePropagation()
      close.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey, true)
      setTimeout(() => setFocus(opener), 0)
    }
  }, [id])

  return (
    <FocusContext.Provider value={focusKey}>
      <div className="sheet-backdrop">
        <div ref={ref} className="sheet">
          <h2 dir="auto" className={isLatin(title) ? 'latin' : ''}>{title}</h2>
          <div className="sheet-actions">
            {actions.map((a, i) => (
              <Button
                key={a.label}
                focusKey={`${id}-${i}`}
                variant={a.variant}
                onPress={() => {
                  onClose()
                  a.onPress()
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  )
}
