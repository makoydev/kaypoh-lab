import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Boxes, Check, ChevronDown, LayoutGrid, Lock } from 'lucide-react'
import { MODULES } from '../../lib/modules'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/Badge'

interface ModuleSelectorProps {
  onOpenModule: (id: string) => void
  onBrowse: () => void
}

export function ModuleSelector({ onOpenModule, onBrowse }: ModuleSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = MODULES.find((m) => m.status === 'active')!

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-fog-100 transition-colors hover:border-white/20 hover:bg-white/[0.06]',
          open && 'border-accent/50',
        )}
      >
        <Boxes className="size-4 text-accent" />
        <span className="hidden sm:inline text-fog-500">Module</span>
        <span className="font-medium">{active.name}</span>
        <ChevronDown className={cn('size-3.5 text-fog-500 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="glass absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-1.5"
          >
            <li className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-fog-700">Catalog</li>
            {MODULES.map((m) => {
              const isActive = m.status === 'active'
              return (
                <li key={m.id} role="option" aria-selected={isActive} aria-disabled={!isActive}>
                  <button
                    type="button"
                    disabled={!isActive}
                    onClick={() => {
                      setOpen(false)
                      onOpenModule(m.id)
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                      isActive ? 'bg-accent/10 hover:bg-accent/15' : 'cursor-not-allowed opacity-55',
                    )}
                  >
                    <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md', isActive ? 'bg-accent text-ink-950' : 'bg-white/[0.06] text-fog-500')}>
                      {isActive ? <Check className="size-3.5" strokeWidth={3} /> : <Lock className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-medium text-fog-100">{m.name}</span>
                        {isActive ? <Badge>Active</Badge> : <Badge tone="muted">Coming soon</Badge>}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-fog-500">{m.description}</span>
                    </span>
                  </button>
                </li>
              )
            })}
            <li className="mt-1 border-t border-white/[0.06] pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onBrowse()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-fog-300 transition-colors hover:bg-white/[0.05] hover:text-fog-100"
              >
                <LayoutGrid className="size-3.5 text-accent" /> Browse the workshop
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
