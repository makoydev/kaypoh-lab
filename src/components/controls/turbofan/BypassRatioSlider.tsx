import { BPR } from '../../../lib/turbofanConfig'
import { useTurbofan, useTurbofanState } from '../../../hooks/useTurbofanSimulation'
import { Slider } from '../../ui/Slider'

function label(bpr: number) {
  if (bpr <= 3) return 'Low bypass: fighter-jet territory. Loud, thirsty, fast.'
  if (bpr <= 6) return 'Classic 1980s–90s airliner engine.'
  if (bpr <= 9) return 'Modern airliner engine.'
  return 'Very high bypass: the newest, quietest, most frugal fans.'
}

/** Bypass ratio: how many kilograms go around the core for every kilogram that goes through it. */
export function BypassRatioSlider() {
  const { settings, update } = useTurbofan()
  const state = useTurbofanState()
  const { bpr } = settings
  const bypassPct = Math.round((bpr / (1 + bpr)) * 100)

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none text-fog-100">
            {bpr.toFixed(1)}
            <span className="ml-1 text-sm text-fog-500">: 1</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">
            {bypassPct} % of the air bypasses the core
          </div>
        </div>
        <div className="max-w-[150px] text-right text-[11px] leading-snug text-fog-500">{label(bpr)}</div>
      </div>

      <Slider
        ariaLabel="Bypass ratio"
        min={BPR.min}
        max={BPR.max}
        step={0.5}
        value={bpr}
        accent="#a78bfa"
        onChange={(v) => update({ bpr: v })}
        marks={[
          { value: BPR.min, label: `${BPR.min}` },
          { value: 5, label: '5' },
          { value: 8, label: '8' },
          { value: BPR.max, label: `${BPR.max}` },
        ]}
      />

      <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-2">
          <dt className="text-[9px] uppercase tracking-[0.14em] text-fog-700">Bypass air</dt>
          <dd className="mt-0.5 font-mono text-fog-100">
            {Math.round(state.massFlow.bypass)} <span className="text-fog-500">kg/s</span>
          </dd>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-2">
          <dt className="text-[9px] uppercase tracking-[0.14em] text-fog-700">Core air</dt>
          <dd className="mt-0.5 font-mono text-fog-100">
            {Math.round(state.massFlow.core)} <span className="text-fog-500">kg/s</span>
          </dd>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-2">
          <dt className="text-[9px] uppercase tracking-[0.14em] text-fog-700">Fuel per kN</dt>
          <dd className="mt-0.5 font-mono text-fog-100">
            {state.tsfc.toFixed(1)} <span className="text-fog-500">g/s</span>
          </dd>
        </div>
      </dl>
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        Slide it and watch fuel-per-kN fall: moving more air a little slower is cheaper than moving less air a lot faster.
      </p>
    </div>
  )
}
