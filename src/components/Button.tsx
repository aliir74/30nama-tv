import { useFocusable } from '@noriginmedia/norigin-spatial-navigation'
import type { ReactNode } from 'react'

export function Button({ children, onPress, focusKey, variant = 'ghost', className = '' }: {
  children: ReactNode
  onPress: () => void
  focusKey?: string
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onPress,
    // Pages clip overflow, so a focused button brings itself on screen.
    onFocus: () => ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
  })
  return (
    <div ref={ref} className={`btn btn-${variant} ${focused ? 'focused' : ''} ${className}`} onClick={onPress}>
      {children}
    </div>
  )
}
