import { DRIVELINE, GEAR_META } from '../../../lib/gearboxConfig'
import { driveline } from '../../../lib/gearboxModel'
import { useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'

function Bar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-fog-500">{label}</span>
        <span className="font-mono text-fog-100">
          {Math.round(Math.abs(value)).toLocaleString()} <span className="text-fog-500">{unit}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

/** Speed goes down by the ratio, torque goes up by the ratio, power stays the same. */
export function TorqueReadout() {
  const snap = useGearboxSnapshot()
  const clutch = snap.shift ? snap.shift.clutch : 1
  const r = driveline(snap.inputRpm, snap.outputRpm, snap.engaged, clutch)
  const ratio = Math.abs(r.ratio)
  const transmitting = r.outputTorque !== 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-2">
          <div className="text-[9px] uppercase tracking-[0.14em] text-fog-700">In</div>
          <div className="mt-0.5 font-mono text-sm text-fog-100">
            {Math.round(Math.abs(r.inputRpm)).toLocaleString()} <span className="text-[10px] text-fog-500">rpm</span>
          </div>
          <div className="font-mono text-sm text-fog-100">
            {Math.round(r.inputTorque)} <span className="text-[10px] text-fog-500">N·m</span>
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-semibold text-accent">{ratio ? `×${ratio.toFixed(2)}` : '—'}</div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-fog-700">{GEAR_META[snap.engaged].label}</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-ink-900/50 p-2 text-right">
          <div className="text-[9px] uppercase tracking-[0.14em] text-fog-700">Out</div>
          <div className="mt-0.5 font-mono text-sm text-fog-100">
            {Math.round(Math.abs(r.outputRpm)).toLocaleString()} <span className="text-[10px] text-fog-500">rpm</span>
          </div>
          <div className="font-mono text-sm text-fog-100">
            {Math.round(Math.abs(r.outputTorque))} <span className="text-[10px] text-fog-500">N·m</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Bar label="Torque at the output" value={r.outputTorque} max={800} unit="N·m" color="#34d399" />
        <Bar label={`At the wheels (× ${DRIVELINE.finalDrive} final drive)`} value={r.wheelTorque} max={3000} unit="N·m" color="#22d3ee" />
        <Bar label="Power through the box" value={transmitting ? r.powerKw : 0} max={110} unit="kW" color="#a78bfa" />
      </div>

      <div className="flex items-center justify-between rounded-md border border-white/[0.06] bg-ink-900/50 px-2 py-1.5 text-[11px]">
        <span className="text-fog-500">Road speed</span>
        <span className="font-mono text-fog-100">
          {r.speedKmh < -1 ? '−' : ''}
          {Math.round(Math.abs(r.speedKmh))} <span className="text-fog-500">km/h</span>
          {r.speedKmh < -1 ? <span className="ml-1 text-fog-500">(backwards)</span> : null}
        </span>
      </div>
      <p className="text-[11px] leading-snug text-fog-700">
        {transmitting
          ? 'Whatever the ratio takes off the speed it puts onto the torque. Multiply them and the power is the same on both sides.'
          : 'No gear locked, or the clutch is out: rpm goes in, nothing comes out.'}
      </p>
    </div>
  )
}
