import { Html } from '@react-three/drei'
import type { HubId } from '../../../types/gearbox'
import { GEAR_META, HUB_META, HUB_OF, HUB_X, gearX, signedRatio } from '../../../lib/gearboxConfig'
import { SHIFT_PHASE_LABEL } from '../../../lib/gearboxModel'
import { useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'

const labelClass =
  'pointer-events-none select-none whitespace-nowrap rounded-md border border-white/10 bg-ink-900/90 px-2 py-1 font-mono text-[11px] leading-none text-fog-100 shadow-lg'

function Label({ children, accent, position }: { children: React.ReactNode; accent?: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <Html center distanceFactor={5} zIndexRange={[10, 0]}>
        <div className={labelClass} style={accent ? { borderColor: accent, color: accent } : undefined}>
          {children}
        </div>
      </Html>
    </group>
  )
}

const rpm = (v: number) => `${Math.round(Math.abs(v)).toLocaleString()} rpm`

/** Synchro-focus annotations: what each of the hub's two gears is doing versus the shaft, and the slip. */
export function SynchroLabels({ hub }: { hub: HubId }) {
  const snap = useGearboxSnapshot()
  const [left, right] = HUB_META[hub].gears
  const shaft = snap.outputRpm
  const shift = snap.shift
  const active = shift && shift.to !== 'N' && HUB_OF[shift.to].hub === hub ? shift : null
  const status = active ? SHIFT_PHASE_LABEL[active.phase] : snap.engaged !== 'N' && HUB_OF[snap.engaged].hub === hub ? `${GEAR_META[snap.engaged].label} locked` : 'Sleeve centred'
  const accent = active ? (active.phase === 'grind' ? '#f87171' : '#fbbf24') : '#34d399'

  return (
    <group>
      {[left, right].map((g) => {
        const gearRpm = snap.inputRpm / signedRatio(g)
        return (
          <Label key={g} position={[gearX(g), 1.05, 0]} accent="#38bdf8">
            {GEAR_META[g].label} gear · {rpm(gearRpm)}
          </Label>
        )
      })}
      <Label position={[HUB_X[hub], -1.05, 0]} accent="#a5f3fc">
        shaft · {rpm(shaft)}
      </Label>
      <Label position={[HUB_X[hub], 1.45, 0]} accent={accent}>
        {status}
        {active && active.phase !== 'clutchOut' && active.phase !== 'clutchIn' ? ` · slip ${rpm(snap.slipRpm)}` : ''}
      </Label>
    </group>
  )
}
