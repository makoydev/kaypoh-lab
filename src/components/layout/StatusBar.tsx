import { REAL_STROKE_M, STROKE_META, VISUAL_TIME_SCALE } from '../../lib/engineConfig'
import { useEngine, useSimSnapshot } from '../../hooks/useEngineSimulation'
import { MetricCard } from '../ui/MetricCard'

export function StatusBar() {
  const { settings } = useEngine()
  const snap = useSimSnapshot(20)
  const { rpm, focusCylinder, playing, speed } = settings
  const st = snap.cylinders[focusCylinder - 1]
  const meanPistonSpeed = (2 * REAL_STROKE_M * rpm) / 60

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <div className="glass pointer-events-auto flex divide-x divide-white/[0.06] rounded-xl">
        <MetricCard label="Engine" value={rpm.toLocaleString()} unit="rpm" />
        <MetricCard label="Crank" value={`${Math.round(snap.angle).toString().padStart(3, '0')}°`} unit="/ 720" />
        <MetricCard
          label={`Cyl ${focusCylinder}`}
          value={st ? STROKE_META[st.stroke].label : '—'}
          unit={st ? `${Math.round(st.strokeProgress * 100)}%` : undefined}
          accent={st ? STROKE_META[st.stroke].color : undefined}
        />
        <MetricCard label="Piston speed" value={meanPistonSpeed.toFixed(1)} unit="m/s mean" />
        <MetricCard label="Firing" value={`#${snap.activeCylinder}`} unit="cylinder" accent="#fb923c" />
        <MetricCard label="Time scale" value={playing ? `1:${Math.round(VISUAL_TIME_SCALE / speed)}` : 'paused'} unit={playing ? `${speed}×` : undefined} />
      </div>
    </div>
  )
}
