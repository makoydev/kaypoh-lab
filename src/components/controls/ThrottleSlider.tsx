import { useMemo } from 'react'
import { RPM, VISUAL_TIME_SCALE } from '../../lib/engineConfig'
import { useEngine } from '../../hooks/useEngineSimulation'
import { cn } from '../../lib/utils'
import { Slider } from '../ui/Slider'

const SEGMENTS = 28

export function ThrottleSlider() {
  const { settings, update } = useEngine()
  const { rpm } = settings
  const frac = (rpm - RPM.idle) / (RPM.max - RPM.idle)
  const nearRedline = rpm >= RPM.redline
  const accent = nearRedline ? '#f87171' : rpm > 4500 ? '#fb923c' : '#22d3ee'

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const segRpm = RPM.idle + ((i + 0.5) / SEGMENTS) * (RPM.max - RPM.idle)
        return { lit: i / SEGMENTS <= frac, red: segRpm >= RPM.redline, warm: segRpm >= 4500 }
      }),
    [frac],
  )

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none" style={{ color: accent }}>
            {rpm.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">rpm · {(rpm / 60).toFixed(1)} rev/s real</div>
        </div>
        <div className="text-right text-[11px] text-fog-500">
          {nearRedline ? <span className="text-red-400">Redline. Steady lah.</span> : rpm <= 1000 ? 'Idling, very relaxed.' : rpm < 3000 ? 'Cruising.' : 'Getting serious.'}
        </div>
      </div>

      <div className="mb-2 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }}>
        {segments.map((s, i) => (
          <span
            key={i}
            className={cn(
              'h-2 rounded-[2px] transition-colors duration-100',
              s.lit ? (s.red ? 'bg-red-400' : s.warm ? 'bg-ember' : 'bg-accent') : s.red ? 'bg-red-400/15' : 'bg-white/[0.06]',
            )}
          />
        ))}
      </div>

      <Slider
        ariaLabel="Throttle (RPM)"
        min={RPM.idle}
        max={RPM.max}
        step={50}
        value={rpm}
        accent={accent}
        onChange={(v) => update({ rpm: v })}
        marks={[
          { value: RPM.idle, label: 'idle' },
          { value: 4000, label: '4k' },
          { value: RPM.redline, label: 'redline' },
        ]}
      />
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        Scene runs at 1 : {VISUAL_TIME_SCALE} time scale. At real speed the crank would be a blur — your eyes cannot catch.
      </p>
    </div>
  )
}
