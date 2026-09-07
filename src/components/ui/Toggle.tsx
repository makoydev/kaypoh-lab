import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-3', disabled && 'cursor-not-allowed opacity-40', className)}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-xs text-fog-100">{label}</span>}
          {description && <span className="block text-[11px] leading-snug text-fog-500">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent/60 bg-accent/80' : 'border-white/10 bg-ink-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </label>
  )
}
