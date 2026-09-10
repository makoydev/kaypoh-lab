import { Crosshair, Layers, RotateCw, ScanLine, Volume2 } from 'lucide-react'
import type { CasingMode } from '../../../types/simulation'
import type { EscapementViewMode } from '../../../types/escapement'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { cn } from '../../../lib/utils'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Toggle } from '../../ui/Toggle'
import { Kbd } from '../../ui/Kbd'

const MODES: { value: EscapementViewMode; label: string; desc: string; icon: typeof Layers; key: string }[] = [
  { value: 'cutaway', label: 'Bench view', desc: 'The whole escapement on its plate.', icon: Layers, key: '1' },
  { value: 'xray', label: 'X-Ray', desc: 'Holographic CAD wireframe.', icon: ScanLine, key: '2' },
  { value: 'pallet', label: 'Pallet Focus', desc: 'Straight down on the jewels and teeth.', icon: Crosshair, key: '3' },
]

const CASINGS: { value: CasingMode; label: string }[] = [
  { value: 'hidden', label: 'Hidden' },
  { value: 'ghost', label: 'Ghost' },
  { value: 'solid', label: 'Solid' },
]

export function EscapementViewModes() {
  const { settings, update } = useEscapement()
  const { viewMode, casingMode, autoRotate, sound } = settings

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        {MODES.map((m) => {
          const selected = viewMode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => update({ viewMode: m.value })}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                selected ? 'border-accent/60 bg-accent/10' : 'border-white/[0.07] hover:border-white/20 hover:bg-white/[0.03]',
              )}
            >
              <m.icon className={cn('size-4 shrink-0', selected ? 'text-accent' : 'text-fog-500')} />
              <span className="min-w-0 flex-1">
                <span className={cn('block text-xs font-medium', selected ? 'text-fog-100' : 'text-fog-300')}>{m.label}</span>
                <span className="block text-[11px] text-fog-500">{m.desc}</span>
              </span>
              <Kbd>{m.key}</Kbd>
            </button>
          )
        })}
      </div>

      {viewMode === 'pallet' && <p className="text-[11px] leading-snug text-fog-500">Slow it to 0.1× and watch a tooth recoil, slide down the jewel, drop and land.</p>}

      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
          <span>Plate & bridges</span>
          <span className="flex items-center gap-1">
            <Kbd>C</Kbd> cycle
          </span>
        </div>
        <SegmentedControl layoutId="esc-casing" size="sm" options={CASINGS} value={casingMode} onChange={(v) => update({ casingMode: v })} disabled={viewMode !== 'cutaway'} />
      </div>

      <Toggle
        checked={sound}
        onChange={(v) => update({ sound: v })}
        label={
          <span className="flex items-center gap-1.5">
            <Volume2 className="size-3.5 text-fog-500" /> Tick sound <Kbd>S</Kbd>
          </span>
        }
        description="Synthesised: a click for the landing, a thud for the banking pin."
      />
      <Toggle
        checked={autoRotate}
        onChange={(v) => update({ autoRotate: v })}
        label={
          <span className="flex items-center gap-1.5">
            <RotateCw className="size-3.5 text-fog-500" /> Auto-rotate camera
          </span>
        }
      />
    </div>
  )
}
