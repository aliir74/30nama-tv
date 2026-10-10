import { doesFocusableExist, FocusContext, setFocus, useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import { useEffect, useRef, type ReactNode } from 'react'

const WAIT_STEP_MS = 100
const WAIT_MAX_MS = 4000

// Every screen is a focus boundary, so arrows never wander into screens hidden below it.
export function Screen({ id, active, children, initialFocus }: { id: string; active: boolean; children: ReactNode; initialFocus?: string }) {
  const { ref, focusKey, focusSelf } = useFocusable({ focusKey: id, isFocusBoundary: true, saveLastFocusedChild: true, trackChildren: true })
  // After the first visit, coming back (Back key) restores the last focused child instead.
  const visited = useRef(false)

  useEffect(() => {
    if (!active) return
    // The target often renders only after its data loads, so wait for it before falling back.
    let waited = 0
    let t: ReturnType<typeof setTimeout>
    const place = () => {
      if (!initialFocus || visited.current) return focusSelf()
      if (doesFocusableExist(initialFocus)) {
        visited.current = true
        return setFocus(initialFocus)
      }
      if (waited >= WAIT_MAX_MS) {
        visited.current = true
        return focusSelf()
      }
      waited += WAIT_STEP_MS
      t = setTimeout(place, WAIT_STEP_MS)
    }
    t = setTimeout(place, 0)
    return () => clearTimeout(t)
  }, [active, initialFocus, focusSelf])

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="screen-root">
        {children}
      </div>
    </FocusContext.Provider>
  )
}
