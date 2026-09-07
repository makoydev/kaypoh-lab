import { useId, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: ReactNode
  valueLabel?: ReactNode
  accent?: string
  disabled?: boolean
  className?: string
  marks?: { value: number; label?: string }[]
  ariaLabel?: string
}

export function Slider({ value, min, max, step = 1, onChange, label, valueLabel, accent = '#22d3ee', disabled, className, marks, ariaLabel }: SliderProps) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  const style = {
    '--range-accent': accent,
    '--range-track': `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #252b36 ${pct}%, #252b36 100%)`,
  } as CSSProperties

  return (
    <div className={cn('w-full', className)}>
      {(label || valueLabel) && (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          {label && (
            <label htmlFor={id} className="text-xs text-fog-300">
              {label}
            </label>
          )}
          {valueLabel && <span className="font-mono text-xs tabular-nums text-fog-100">{valueLabel}</span>}
        </div>
      )}
      <input
        id={id}
        type="range"
        className="hld-range"
        style={style}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {marks && (
        <div className="relative mt-0.5 h-3.5 text-[10px] text-fog-700">
          {marks.map((m) => {
            const p = ((m.value - min) / (max - min)) * 100
            return (
              <span key={m.value} className="absolute -translate-x-1/2 font-mono" style={{ left: `${p}%` }}>
                {m.label ?? m.value}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
