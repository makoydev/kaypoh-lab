import { TURBOFAN_VISUAL_TIME_SCALE } from '../../../lib/turbofanConfig'
import { kelvinToCelsius, stationOf } from '../../../lib/turbofanModel'
import { useTurbofan, useTurbofanState } from '../../../hooks/useTurbofanSimulation'
import { MetricCard } from '../../ui/MetricCard'

export function TurbofanStatusBar() {
  const { settings } = useTurbofan()
  const state = useTurbofanState()
  const { playing, speed } = settings
  const t4 = stationOf(state, '4').temperatureK

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <div className="glass pointer-events-auto flex divide-x divide-white/[0.06] rounded-xl">
        <MetricCard label="N1 fan" value={Math.round(state.n1)} unit="%" />
        <MetricCard label="N2 core" value={Math.round(state.n2)} unit="%" />
        <MetricCard label="Thrust" value={(state.thrust.total / 1000).toFixed(0)} unit="kN" accent="#22d3ee" />
        <MetricCard label="From fan" value={Math.round(state.thrust.bypassShare * 100)} unit="%" accent="#38bdf8" />
        <MetricCard label="Pressure" value={`×${state.overallPressureRatio.toFixed(0)}`} unit="overall" />
        <MetricCard label="Burner" value={Math.round(kelvinToCelsius(t4)).toLocaleString()} unit="°C" accent="#fb923c" />
        <MetricCard label="Time scale" value={playing ? `1:${Math.round(TURBOFAN_VISUAL_TIME_SCALE / speed)}` : 'paused'} unit={playing ? `${speed}×` : undefined} />
      </div>
    </div>
  )
}
