import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('glass rounded-2xl', className)}>{children}</div>
}

interface PanelSectionProps {
  title: string
  icon?: LucideIcon
  hint?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}

export function PanelSection({ title, icon: Icon, hint, right, children, className }: PanelSectionProps) {
  return (
    <section className={cn('border-b border-white/[0.06] px-4 py-4 last:border-b-0', className)}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-3.5 text-accent" strokeWidth={2.2} />}
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fog-300">{title}</h3>
        </div>
        {right}
      </header>
      {hint && <p className="-mt-2 mb-3 text-[11px] leading-snug text-fog-500">{hint}</p>}
      {children}
    </section>
  )
}
