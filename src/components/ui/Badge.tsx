import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type BadgeTone = 'accent' | 'ember' | 'muted'

export function Badge({ children, tone = 'accent', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  const tones: Record<BadgeTone, string> = {
    accent: 'border-accent/40 bg-accent/10 text-accent',
    ember: 'border-ember/40 bg-ember/10 text-ember',
    muted: 'border-white/10 bg-white/[0.04] text-fog-500',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tones[tone], className)}>
      {children}
    </span>
  )
}
