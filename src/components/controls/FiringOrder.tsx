import { CYLINDERS, DEG_PER_FIRE, FIRING_ORDER, STROKE_META, STROKE_ORDER } from '../../lib/engineConfig'
import { mod } from '../../lib/kinematics'
import { useEngine, useSimSnapshot } from '../../hooks/useEngineSimulation'
import { cn } from '../../lib/utils'
import type { CylinderState } from '../../types/simulation'

interface CellProps {
  n: number
  state: CylinderState | undefined
  firing: boolean
  isFocus: boolean
  onFocus: (n: number) => void
}

/**
 * One cylinder in the bank layout. Lives at module scope: declared inside `FiringOrder` it was a new
 * component type on every 30 fps snapshot, so React remounted all eight buttons and a click on a
 * running engine landed on a button that no longer existed by mouseup.
 */
function Cell({ n, state, firing, isFocus, onFocus }: CellProps) {
  const meta = state ? STROKE_META[state.stroke] : null
  return (
    <button
      type="button"
      onClick={() => onFocus(n)}
      title={`Cylinder ${n} — click to focus`}
      className={cn(
        'relative flex h-9 flex-col items-center justify-center rounded-md border text-center transition-colors',
        isFocus ? 'border-accent/70' : 'border-white/[0.07] hover:border-white/20',
      )}
      style={{ backgroundColor: meta ? `${meta.color}${firing ? '55' : '22'}` : undefined }}
    >
      <span className="font-mono text-xs font-semibold leading-none text-fog-100">{n}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider leading-none" style={{ color: meta?.color }}>
        {meta?.nick}
      </span>
      {firing && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-ember shadow-[0_0_10px_2px_rgba(251,146,60,0.8)]" />}
    </button>
  )
}

export function FiringOrder() {
  const snap = useSimSnapshot(30)
  const { settings, update } = useEngine()
  const { focusCylinder } = settings
  const active = snap.activeCylinder
  const slotProgress = mod(snap.angle, DEG_PER_FIRE) / DEG_PER_FIRE

  const left = CYLINDERS.filter((c) => c.bank === 'left')
  const right = CYLINDERS.filter((c) => c.bank === 'right')
  const focus = (n: number) => update({ focusCylinder: n })
  const cell = (n: number) => (
    <Cell key={n} n={n} state={snap.cylinders[n - 1]} firing={n === active} isFocus={n === focusCylinder} onFocus={focus} />
  )

  return (
    <div className="space-y-3">
      {/* Firing sequence */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
          <span>Firing order</span>
          <span className="font-mono text-fog-300">every {DEG_PER_FIRE}°</span>
        </div>
        <div className="grid grid-cols-8 gap-1">
          {FIRING_ORDER.map((n, i) => {
            const firing = n === active
            const idx = FIRING_ORDER.indexOf(active)
            const done = i < idx
            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-md border font-mono text-sm font-semibold transition-all',
                    firing
                      ? 'border-ember bg-ember/20 text-ember-hot shadow-[0_0_18px_-4px_rgba(251,146,60,0.9)]'
                      : done
                        ? 'border-white/[0.06] bg-white/[0.04] text-fog-500'
                        : 'border-white/[0.06] text-fog-300',
                  )}
                >
                  {n}
                </div>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full bg-ember transition-[width] duration-75"
                    style={{ width: firing ? `${slotProgress * 100}%` : done ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Physical V layout */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
          <span>Bank layout · front at top</span>
          <span>click to focus</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
          <div className="grid gap-1">
            {left.map((c) => cell(c.number))}
          </div>
          <div className="flex flex-col items-center justify-center text-[9px] uppercase tracking-[0.2em] text-fog-700">
            <span className="rotate-90 whitespace-nowrap">crank</span>
          </div>
          <div className="grid gap-1">
            {right.map((c) => cell(c.number))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-fog-500">
        {STROKE_ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="size-2 rounded-sm" style={{ backgroundColor: STROKE_META[s].color }} />
            {STROKE_META[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}
