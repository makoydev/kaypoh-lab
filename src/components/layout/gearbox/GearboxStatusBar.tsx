import { GEAR_META, GEARBOX_VISUAL_TIME_SCALE, ratioOf } from '../../../lib/gearboxConfig'
import { driveline } from '../../../lib/gearboxModel'
import { useGearbox, useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'
import { MetricCard } from '../../ui/MetricCard'

export function GearboxStatusBar() {
  const { settings } = useGearbox()
  const snap = useGearboxSnapshot()
  const { playing, speed } = settings
  const r = driveline(snap.inputRpm, snap.outputRpm, snap.engaged, snap.shift ? snap.shift.clutch : 1)
  const gearLabel = snap.shift ? `${GEAR_META[snap.shift.from].short} → ${GEAR_META[snap.shift.to].short}` : GEAR_META[snap.engaged].short

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <div className="glass pointer-events-auto flex divide-x divide-white/[0.06] rounded-xl">
        <MetricCard label="Engine" value={Math.round(snap.engineRpm).toLocaleString()} unit="rpm" />
        <MetricCard label="Gear" value={gearLabel} accent={snap.shift ? '#fbbf24' : '#34d399'} />
        <MetricCard label="Ratio" value={snap.engaged === 'N' ? '—' : `×${ratioOf(snap.engaged).toFixed(2)}`} />
        <MetricCard label="Output" value={Math.round(Math.abs(snap.outputRpm)).toLocaleString()} unit="rpm" accent="#22d3ee" />
        <MetricCard label="Speed" value={`${r.speedKmh < -1 ? '−' : ''}${Math.round(Math.abs(r.speedKmh))}`} unit="km/h" accent="#22d3ee" />
        <MetricCard label="Wheel torque" value={Math.round(Math.abs(r.wheelTorque)).toLocaleString()} unit="N·m" accent="#34d399" />
        <MetricCard label="Time scale" value={playing ? `1:${Math.round(GEARBOX_VISUAL_TIME_SCALE / speed)}` : 'paused'} unit={playing ? `${speed}×` : undefined} />
      </div>
    </div>
  )
}
