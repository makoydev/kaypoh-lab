import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  title?: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  /** Unique id for the shared layout animation. */
  layoutId?: string
}

export function SegmentedControl<T extends string | number>({ options, value, onChange, className, size = 'md', disabled, layoutId }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'relative grid rounded-lg border border-white/[0.08] bg-ink-900/70 p-0.5',
        disabled && 'opacity-40',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            title={opt.title}
            disabled={disabled || opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed',
              size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs',
              selected ? 'text-ink-950' : 'text-fog-500 hover:text-fog-100',
            )}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-md bg-accent"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
