import { ESCAPEMENT_VISUAL_TIME_SCALE, PHASE_META } from '../../../lib/escapementConfig'
import { useEscapement, useEscapementSnapshot } from '../../../hooks/useEscapementSimulation'
import { MetricCard } from '../../ui/MetricCard'

export function EscapementStatusBar() {
  const { settings } = useEscapement()
  const snap = useEscapementSnapshot()
  const { playing, speed, beatRate, regulator } = settings
  const meta = PHASE_META[snap.phase]

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <div className="glass pointer-events-auto flex divide-x divide-white/[0.06] rounded-xl">
        <MetricCard label="Beat rate" value={beatRate.toLocaleString()} unit="vph" />
        <MetricCard label="Frequency" value={snap.frequencyHz.toFixed(3)} unit="Hz" accent="#22d3ee" />
        <MetricCard label="Amplitude" value={Math.round(snap.amplitude)} unit="°" accent="#22d3ee" />
        <MetricCard label="Now" value={meta.label} accent={meta.color} />
        <MetricCard label="Ticks" value={snap.beats.toLocaleString()} />
        <MetricCard label="Rate error" value={`${regulator > 0 ? '+' : ''}${regulator}`} unit="s/day" accent={regulator === 0 ? '#34d399' : '#fbbf24'} />
        <MetricCard label="Time scale" value={playing ? `1:${Math.round(ESCAPEMENT_VISUAL_TIME_SCALE / speed)}` : 'paused'} unit={playing ? `${speed}×` : undefined} />
      </div>
    </div>
  )
}
