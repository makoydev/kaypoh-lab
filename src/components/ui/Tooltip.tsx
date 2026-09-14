import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left'
  className?: string
}

/**
 * CSS-only hover tooltip. Keeps the HUD free of positioning libraries.
 *
 * Purely decorative to a screen reader: `opacity-0` hides it from eyes but not from the a11y tree,
 * and every trigger already carries an `aria-label` saying the same thing, so leaving it exposed
 * had each icon button announced twice ("Reset camera, Reset camera (R)"). It is never referenced
 * by `aria-describedby`, so `role="tooltip"` claimed a relationship that did not exist either.
 */
export function Tooltip({ content, children, side = 'bottom', className }: TooltipProps) {
  const pos = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  }[side]
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-[11px] text-fog-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover/tip:opacity-100',
          pos,
        )}
      >
        {content}
      </span>
    </span>
  )
}
