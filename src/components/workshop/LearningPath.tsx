import { Check, ChevronRight, Lock } from 'lucide-react'
import type { CatalogModule } from '../../types/simulation'
import { cn } from '../../lib/utils'

const PATH_ORDER = ['v8-engine', 'manual-transmission', 'turbofan', 'escapement']
const PATH_NOTES: Record<string, string> = {
  'v8-engine': 'Start here. Where the power comes from.',
  'manual-transmission': 'Then: how that power reaches the wheels.',
  turbofan: 'Same four ideas, no pistons, a lot more air.',
  escapement: 'Finish tiny. Precision over power.',
}

/** Suggested order through the catalog, drawn as a numbered route. */
export function LearningPath({ modules, onOpen }: { modules: CatalogModule[]; onOpen: (m: CatalogModule) => void }) {
  const ordered = PATH_ORDER.map((id) => modules.find((m) => m.id === id)!).filter(Boolean)
  return (
    <ol className="relative grid gap-3 md:grid-cols-4">
      <span className="pointer-events-none absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-accent/60 via-white/10 to-white/10 md:block" />
      {ordered.map((m, i) => {
        const live = m.status === 'active'
        return (
          <li key={m.id} className="relative">
            <button
              type="button"
              disabled={!live}
              onClick={() => onOpen(m)}
              className={cn(
                'group flex w-full flex-col items-start rounded-xl border p-4 text-left transition-colors',
                live ? 'border-accent/40 bg-accent/[0.06] hover:bg-accent/10' : 'border-white/[0.08] bg-white/[0.02] disabled:cursor-not-allowed',
              )}
            >
              <span
                className={cn(
                  'relative z-10 flex size-5 items-center justify-center rounded-full border font-mono text-[10px]',
                  live ? 'border-accent bg-accent text-ink-950' : 'border-white/15 bg-ink-800 text-fog-500',
                )}
              >
                {live ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-fog-100">
                {m.name}
                {live ? <ChevronRight className="size-3.5 text-accent transition-transform group-hover:translate-x-0.5" /> : <Lock className="size-3 text-fog-700" />}
              </span>
              <span className="mt-1 text-[11px] leading-snug text-fog-500">{PATH_NOTES[m.id]}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
