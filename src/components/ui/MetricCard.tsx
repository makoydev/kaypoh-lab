import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface MetricCardProps {
  label: string
  value: ReactNode
  unit?: string
  accent?: string
  className?: string
}

export function MetricCard({ label, value, unit, accent, className }: MetricCardProps) {
  return (
    <div className={cn('flex min-w-[88px] flex-col px-3 py-2', className)}>
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-fog-700">{label}</span>
      <span className="mt-0.5 flex items-baseline gap-1 font-mono text-sm tabular-nums" style={accent ? { color: accent } : undefined}>
        <span className="text-fog-100" style={accent ? { color: accent } : undefined}>
          {value}
        </span>
        {unit && <span className="text-[10px] text-fog-500">{unit}</span>}
      </span>
    </div>
  )
}
