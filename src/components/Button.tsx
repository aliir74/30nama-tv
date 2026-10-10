import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ReactNode } from 'react'

export function Button({ children, onPress, onFocus, focusKey, variant = 'ghost', className = '' }: {
  children: ReactNode
  onPress: () => void
  // Replaces the default scroll-into-view when a screen needs its own scroll position.
  onFocus?: () => void
  focusKey?: string
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onPress,
    // Pages clip overflow, so a focused button brings itself on screen.
    onFocus: () => (onFocus ? onFocus() : ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })),
  })
  return (
    <div ref={ref} className={`btn btn-${variant} ${focused ? 'focused' : ''} ${className}`} onClick={onPress}>
      {children}
    </div>
  )
}
