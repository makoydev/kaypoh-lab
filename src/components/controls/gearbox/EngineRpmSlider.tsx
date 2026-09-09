import { useMemo } from 'react'
import { ENGINE, GEARBOX_VISUAL_TIME_SCALE } from '../../../lib/gearboxConfig'
import { engineTorque } from '../../../lib/gearboxModel'
import { useGearbox, useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'
import { cn } from '../../../lib/utils'
import { Slider } from '../../ui/Slider'

const SEGMENTS = 28

function mood(rpm: number) {
  if (rpm >= ENGINE.redline - 200) return 'Redline. The valves are filing a complaint.'
  if (rpm >= 5500) return 'Spirited.'
  if (rpm >= 3000) return 'Making proper progress.'
  if (rpm <= ENGINE.idle + 100) return 'Idling at the lights.'
  return 'Pottering along.'
}

/** Engine speed, the input to the whole box. A shift rewrites it; the slider takes it back. */
export function EngineRpmSlider() {
  const { settings, update } = useGearbox()
  const snap = useGearboxSnapshot()
  const rpm = settings.engineRpm
  const frac = (rpm - ENGINE.idle) / (ENGINE.redline - ENGINE.idle)
  const accent = rpm >= 6500 ? '#fb923c' : rpm >= 5000 ? '#fbbf24' : '#22d3ee'
  const torque = engineTorque(rpm)
  const clutchOut = snap.shift !== null && snap.shift.clutch < 0.5

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const seg = ENGINE.idle + ((i + 0.5) / SEGMENTS) * (ENGINE.redline - ENGINE.idle)
        return { lit: i / SEGMENTS <= frac, hot: seg >= 6500, warm: seg >= 5000 }
      }),
    [frac],
  )

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none" style={{ color: accent }}>
            {rpm.toLocaleString()}
            <span className="ml-1 text-sm text-fog-500">rpm</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">
            engine torque {Math.round(torque)} N·m · input shaft {Math.round(Math.abs(snap.inputRpm)).toLocaleString()} rpm
            {clutchOut ? ' · clutch out' : ''}
          </div>
        </div>
        <div className="max-w-[140px] text-right text-[11px] leading-snug text-fog-500">{mood(rpm)}</div>
      </div>

      <div className="mb-2 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }}>
        {segments.map((s, i) => (
          <span
            key={i}
            className={cn(
              'h-2 rounded-[2px] transition-colors duration-100',
              s.lit ? (s.hot ? 'bg-ember' : s.warm ? 'bg-amber-400' : 'bg-accent') : s.hot ? 'bg-ember/15' : 'bg-white/[0.06]',
            )}
          />
        ))}
      </div>

      <Slider
        ariaLabel="Engine speed (rpm)"
        min={ENGINE.idle}
        max={ENGINE.redline}
        step={50}
        value={rpm}
        accent={accent}
        onChange={(v) => update({ engineRpm: v })}
        marks={[
          { value: ENGINE.idle, label: 'idle' },
          { value: 3000, label: '3k' },
          { value: 5000, label: '5k' },
          { value: ENGINE.redline, label: 'redline' },
        ]}
      />
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        Change gear and watch this jump: the clutch drags the engine to whatever the wheels demand. Scene runs at 1 : {GEARBOX_VISUAL_TIME_SCALE} time scale.
      </p>
    </div>
  )
}
