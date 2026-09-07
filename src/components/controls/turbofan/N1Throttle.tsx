import { useMemo } from 'react'
import { N1, TURBOFAN_VISUAL_TIME_SCALE } from '../../../lib/turbofanConfig'
import { useTurbofan, useTurbofanState } from '../../../hooks/useTurbofanSimulation'
import { cn } from '../../../lib/utils'
import { Slider } from '../../ui/Slider'

const SEGMENTS = 28

function mood(n1: number) {
  if (n1 >= N1.max) return 'Takeoff power. Hold on to your kopi.'
  if (n1 >= N1.cruise) return 'Climb / cruise.'
  if (n1 >= 45) return 'Taxi-ing with intent.'
  if (n1 <= N1.idle + 2) return 'Ground idle, very chill.'
  return 'Spooling up.'
}

/** Throttle as N1 — fan speed in % of rated. N2 follows. */
export function N1Throttle() {
  const { settings, update } = useTurbofan()
  const state = useTurbofanState()
  const { n1 } = settings
  const frac = (n1 - N1.idle) / (N1.max - N1.idle)
  const accent = n1 >= 95 ? '#fb923c' : n1 >= N1.cruise ? '#fbbf24' : '#22d3ee'

  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const seg = N1.idle + ((i + 0.5) / SEGMENTS) * (N1.max - N1.idle)
        return { lit: i / SEGMENTS <= frac, hot: seg >= 95, warm: seg >= N1.cruise }
      }),
    [frac],
  )

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none" style={{ color: accent }}>
            {Math.round(n1)}
            <span className="ml-1 text-sm text-fog-500">% N1</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">
            fan {Math.round(state.lpRpm).toLocaleString()} rpm · N2 {Math.round(state.n2)} % · core {Math.round(state.hpRpm).toLocaleString()} rpm
          </div>
        </div>
        <div className="text-right text-[11px] text-fog-500">{mood(n1)}</div>
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
        ariaLabel="Throttle (N1 %)"
        min={N1.idle}
        max={N1.max}
        step={1}
        value={n1}
        accent={accent}
        onChange={(v) => update({ n1: v })}
        marks={[
          { value: N1.idle, label: 'idle' },
          { value: 60, label: '60' },
          { value: N1.cruise, label: 'cruise' },
          { value: N1.max, label: 'T/O' },
        ]}
      />
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        N1 is fan speed as a percentage of its rated maximum — the number pilots actually set. Scene runs at 1 : {TURBOFAN_VISUAL_TIME_SCALE} time scale so the blades
        stay countable.
      </p>
    </div>
  )
}
