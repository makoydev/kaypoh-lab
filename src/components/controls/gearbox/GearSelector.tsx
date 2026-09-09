import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { GearId } from '../../../types/gearbox'
import { GEAR_META, ratioOf } from '../../../lib/gearboxConfig'
import { SHIFT_PHASE_LABEL } from '../../../lib/gearboxModel'
import { useGearbox, useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Kbd } from '../../ui/Kbd'
import { Toggle } from '../../ui/Toggle'

/** The gate, as it is on the knob: three rails, neutral across the middle. */
const GATE: (GearId | null)[][] = [
  ['1', '3', '5'],
  ['N', 'N', 'N'],
  ['2', '4', 'R'],
]

/** H-pattern lever plus what the box is doing about it. */
export function GearSelector() {
  const { settings, update, selectGear, shiftBy, shiftNote } = useGearbox()
  const snap = useGearboxSnapshot()
  const target = settings.gear
  const { engaged, shift } = snap
  const shifting = shift !== null
  const phaseColor = shift?.phase === 'grind' ? '#f87171' : shift?.phase === 'synchro' ? '#fbbf24' : '#22d3ee'

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3">
        <div role="radiogroup" aria-label="Gear" className="relative grid flex-1 grid-cols-3 gap-x-4 gap-y-1 rounded-xl border border-white/[0.07] bg-ink-900/60 p-3">
          {/* gate lines */}
          <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px bg-white/10" />
          {[0, 1, 2].map((c) => (
            <div key={c} className="pointer-events-none absolute bottom-3 top-3 w-px bg-white/10" style={{ left: `calc(${(c + 0.5) * 33.333}% + ${(c - 1) * 8}px)` }} />
          ))}
          {GATE.map((row, r) =>
            row.map((g, c) => {
              if (g === 'N' && c !== 1) return <span key={`${r}-${c}`} aria-hidden />
              if (!g) return <span key={`${r}-${c}`} aria-hidden />
              const isTarget = target === g
              const isEngaged = engaged === g
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  role="radio"
                  aria-checked={isTarget}
                  aria-label={GEAR_META[g].label}
                  onClick={() => selectGear(g)}
                  className={cn(
                    'relative z-10 mx-auto flex size-9 items-center justify-center rounded-full border font-mono text-sm font-semibold transition-colors',
                    isTarget
                      ? isEngaged
                        ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-300'
                        : 'border-amber-400/70 bg-amber-400/15 text-amber-300'
                      : 'border-white/10 bg-ink-800 text-fog-300 hover:border-white/25 hover:text-fog-100',
                  )}
                >
                  {GEAR_META[g].short}
                </button>
              )
            }),
          )}
        </div>
        <div className="flex flex-col justify-between gap-1">
          <Button size="icon" variant="ghost" onClick={() => shiftBy(1)} aria-label="Shift up" title="Shift up (↑)" className="border border-white/[0.07]">
            <ChevronUp className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => shiftBy(-1)} aria-label="Shift down" title="Shift down (↓)" className="border border-white/[0.07]">
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 px-2.5 py-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-fog-500">
            Box in <span className="font-mono text-fog-100">{GEAR_META[engaged].label}</span>
            {engaged !== 'N' && <span className="font-mono text-fog-500"> · ×{ratioOf(engaged).toFixed(2)}</span>}
          </span>
          <span className="font-mono" style={{ color: shifting ? phaseColor : '#34d399' }}>
            {shift ? SHIFT_PHASE_LABEL[shift.phase] : target === engaged ? 'Locked' : 'Waiting'}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${shift ? shift.progress * 100 : 100}%`, backgroundColor: shifting ? phaseColor : '#34d399' }} />
        </div>
        <AnimatePresence initial={false}>
          {shift && shift.to !== 'N' && (shift.phase === 'synchro' || shift.phase === 'grind') && (
            <motion.div key="slip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1.5 text-[11px] text-fog-300">
              {shift.phase === 'grind' ? 'Dog teeth meeting at ' : 'Ring closing a gap of '}
              <span className="font-mono" style={{ color: phaseColor }}>
                {Math.round(Math.abs(snap.slipRpm)).toLocaleString()} rpm
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {shiftNote && (
          <motion.div
            key="note"
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/[0.08] px-2.5 py-2 text-[11px] leading-snug text-amber-200"
          >
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            {shiftNote}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2">
        <Toggle
          checked={settings.synchro}
          onChange={(v) => update({ synchro: v })}
          label={
            <span className="flex items-center gap-1.5">
              Synchroniser rings <Kbd>S</Kbd>
            </span>
          }
          description={settings.synchro ? 'Speeds are matched before the teeth meet.' : 'No matching. Listen for the crunch.'}
        />
      </div>
      {snap.crunches > 0 && (
        <p className="text-[11px] text-fog-500">
          Crunches so far: <span className="font-mono text-red-300">{snap.crunches}</span>. Each one is a chipped dog tooth. Your mechanic sends regards.
        </p>
      )}
      <p className="text-[11px] leading-snug text-fog-700">
        <Kbd>↑</Kbd> <Kbd>↓</Kbd> walk the gate. Reverse only from a standstill, lah.
      </p>
    </div>
  )
}
