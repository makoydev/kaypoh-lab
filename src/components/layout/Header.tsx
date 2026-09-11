import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Keyboard, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { useFullscreen } from '../../hooks/useFullscreen'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/Kbd'
import { Tooltip } from '../ui/Tooltip'
import { ModuleSelector } from './ModuleSelector'

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <a
      href="#/"
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex items-center gap-2.5"
      aria-label="HowLikeDat workshop"
    >
      <span className="relative flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-ink-700 to-ink-900 shadow-inner">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <circle cx="12" cy="13" r="6.5" stroke="#22d3ee" strokeWidth="1.8" />
          <circle cx="12" cy="13" r="1.8" fill="#22d3ee" />
          <path d="M12 13 L17 6" stroke="#fb923c" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="15" y="2.5" width="4.5" height="5" rx="1" fill="#e5e7eb" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-semibold tracking-tight text-fog-100">
          How<span className="text-accent">Like</span>Dat
        </span>
        <span className="mt-0.5 hidden text-[10px] text-fog-500 md:block">See how things actually jalan inside</span>
      </span>
    </a>
  )
}

export const V8_SHORTCUTS: [string[], string][] = [
  [['Space'], 'Play / pause'],
  [['←', '→'], 'Step 1° when paused'],
  [['Shift', '←/→'], 'Step 10°'],
  [['1', '2', '3'], 'Cutaway / X-ray / Piston focus'],
  [['C'], 'Cycle casing'],
  [['R'], 'Reset camera'],
  [['Esc'], 'Clear selection'],
]

function ShortcutsPopover({ rows }: { rows: [string[], string][] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative hidden md:block">
      <Tooltip content="Keyboard shortcuts">
        <Button size="icon" variant="ghost" onClick={() => setOpen((o) => !o)} aria-label="Keyboard shortcuts" aria-expanded={open} active={open}>
          <Keyboard className="size-4" />
        </Button>
      </Tooltip>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 top-full z-50 mt-2 w-64 rounded-xl p-3"
          >
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-fog-700">Shortcuts</div>
            <ul className="space-y-1.5">
              {rows.map(([keys, label]) => (
                <li key={label} className="flex items-center justify-between gap-2 text-[11px] text-fog-300">
                  <span>{label}</span>
                  <span className="flex gap-1">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface HeaderProps {
  /** 'sim' shows simulation tools; 'hub' is the lighter workshop variant. */
  variant: 'sim' | 'hub'
  onBrowse: () => void
  onOpenModule: (id: string) => void
  /** Module currently open in the simulation view, if any. */
  currentModuleId?: string
  onResetCamera?: () => void
  shortcuts?: [string[], string][]
}

export function Header({ variant, onBrowse, onOpenModule, currentModuleId, onResetCamera, shortcuts = V8_SHORTCUTS }: HeaderProps) {
  const { isFullscreen, toggle, supported } = useFullscreen()
  const sim = variant === 'sim'

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 p-3 md:p-4">
      <div className="glass pointer-events-auto mx-auto flex h-14 max-w-[1800px] items-center justify-between gap-3 rounded-2xl px-3 md:px-4">
        <div className="flex items-center gap-3">
          {sim && (
            <Tooltip content="Back to the workshop">
              <Button size="icon" variant="ghost" onClick={onBrowse} aria-label="Back to the workshop">
                <ArrowLeft className="size-4" />
              </Button>
            </Tooltip>
          )}
          <Logo onClick={onBrowse} />
          <Badge tone="ember" className="hidden sm:inline-flex">
            Kaypoh Edition
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <ModuleSelector onOpenModule={onOpenModule} onBrowse={onBrowse} currentModuleId={currentModuleId} />
          <div className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" />
          {sim && onResetCamera && (
            <Tooltip content="Reset camera (R)">
              <Button size="icon" variant="ghost" onClick={onResetCamera} aria-label="Reset camera">
                <RotateCcw className="size-4" />
              </Button>
            </Tooltip>
          )}
          {supported && (
            <Tooltip content={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle fullscreen">
                {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </Button>
            </Tooltip>
          )}
          {sim && <ShortcutsPopover rows={shortcuts} />}
        </div>
      </div>
    </header>
  )
}
