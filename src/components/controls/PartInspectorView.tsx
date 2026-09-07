import { AnimatePresence, motion } from 'framer-motion'
import { MousePointerClick, X, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

export interface PartExplainer {
  name: string
  tagline: string
  role: string
  details: string[]
  kaypohFact: string
}

interface PartInspectorViewProps<Id extends string> {
  parts: Id[]
  info: Record<Id, PartExplainer>
  icons: Record<Id, LucideIcon>
  selected: Id | null
  hovered: Id | null
  onSelect: (id: Id | null) => void
  emptyHint: string
}

/** Chips for every inspectable part plus the explainer card for the selected one. Module-agnostic. */
export function PartInspectorView<Id extends string>({ parts, info, icons, selected, hovered, onSelect, emptyHint }: PartInspectorViewProps<Id>) {
  const current = selected ? info[selected] : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {parts.map((id) => {
          const Icon: LucideIcon = icons[id]
          const active = selected === id
          const isHovered = hovered === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(active ? null : id)}
              className={cn(
                'flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors',
                active
                  ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                  : isHovered
                    ? 'border-amber-400/30 text-fog-100'
                    : 'border-white/[0.07] text-fog-300 hover:border-white/20 hover:text-fog-100',
              )}
            >
              <Icon className="size-3" />
              {info[id].name}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {current && selected ? (
          <motion.article
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-amber-400/25 bg-gradient-to-b from-amber-400/[0.08] to-transparent p-3"
          >
            <header className="mb-2 flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-fog-100">{current.name}</h4>
                <p className="text-[11px] italic text-amber-300/90">{current.tagline}</p>
              </div>
              <Button size="icon-sm" variant="ghost" onClick={() => onSelect(null)} aria-label="Clear selection">
                <X className="size-3.5" />
              </Button>
            </header>
            <p className="text-xs leading-relaxed text-fog-300">{current.role}</p>
            <ul className="mt-2 space-y-1.5">
              {current.details.map((d) => (
                <li key={d} className="flex gap-2 text-[11px] leading-snug text-fog-500">
                  <span className="mt-[5px] size-1 shrink-0 rounded-full bg-amber-400/70" />
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-lg border border-white/[0.06] bg-ink-900/60 p-2.5">
              <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Kaypoh fact</div>
              <p className="text-[11px] leading-snug text-fog-300">{current.kaypohFact}</p>
            </div>
          </motion.article>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 p-3 text-[11px] leading-snug text-fog-500"
          >
            <MousePointerClick className="size-5 shrink-0 text-fog-700" />
            {emptyHint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
