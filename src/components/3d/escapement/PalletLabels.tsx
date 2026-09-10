import { Html } from '@react-three/drei'
import type { Pallet } from '../../../types/escapement'
import { ACTION, BANKED_FORK_ANGLE, ESC, LOCK_ANGLE, PALLET_META, PHASE_META } from '../../../lib/escapementConfig'
import { LIFT_ANGLE, palletWorkingEdge, rot, otherPallet } from '../../../lib/escapementModel'
import { useEscapementSnapshot } from '../../../hooks/useEscapementSimulation'

const labelClass =
  'pointer-events-none select-none whitespace-nowrap rounded-md border border-white/10 bg-ink-900/90 px-2 py-1 font-mono text-[11px] leading-none text-fog-100 shadow-lg'

function Label({ children, accent, position }: { children: React.ReactNode; accent?: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <Html center distanceFactor={2.4} zIndexRange={[10, 0]}>
        <div className={labelClass} style={accent ? { borderColor: accent, color: accent } : undefined}>
          {children}
        </div>
      </Html>
    </group>
  )
}

const LOCK_POINT: Record<Pallet, { x: number; z: number }> = {
  entry: rot(BANKED_FORK_ANGLE.entry, palletWorkingEdge('entry', 2)[0]),
  exit: rot(BANKED_FORK_ANGLE.exit, palletWorkingEdge('exit', 2)[0]),
}

function palletStatus(p: Pallet, releasing: Pallet, phase: string, s: number) {
  if (phase === 'free') return p === releasing ? 'banked · holding' : 'clear'
  if (p === releasing) {
    if (phase === 'unlock') return `unlocking · recoil ${(ACTION.recoil * Math.min(1, s / ACTION.unlockEnd)).toFixed(2)}°`
    if (phase === 'impulse') return `impulse · ${Math.round(((s - ACTION.unlockEnd) / (ACTION.impulseEnd - ACTION.unlockEnd)) * 100)} %`
    if (phase === 'drop') return 'let off · tooth dropping'
    return 'clear'
  }
  if (phase === 'lock') return 'caught · run to banking'
  if (phase === 'drop') return 'waiting for the tooth'
  return 'swinging in'
}

/** Pallet-focus annotations: what each jewel is doing, the escape wheel's tooth angle, the fork's travel. */
export function PalletLabels() {
  const snap = useEscapementSnapshot(30)
  const { phase, pallet, s, forkAngle } = snap
  const meta = PHASE_META[phase]
  const landing = otherPallet(pallet)

  return (
    <group>
      {(['entry', 'exit'] as const).map((p) => {
        const hot = phase !== 'free' && ((p === pallet && phase !== 'lock') || (p === landing && phase === 'lock'))
        return (
          <Label key={p} position={[LOCK_POINT[p].x - 0.1, 0.5, LOCK_POINT[p].z + (p === 'entry' ? 0.3 : -0.3)]} accent={hot ? meta.color : '#38bdf8'}>
            {PALLET_META[p].label} · {palletStatus(p, pallet, phase, s)}
          </Label>
        )
      })}
      <Label position={[ESC.escapeWheel.x - 0.1, 0.4, 1.05]} accent="#a5f3fc">
        escape wheel · {(((snap.escapeAngle % 360) + 360) % 360).toFixed(1)}° · lock at ±{LOCK_ANGLE.exit}°
      </Label>
      <Label position={[0.05, 0.55, 0.85]} accent={meta.color}>
        {meta.label} · fork {forkAngle >= 0 ? '+' : ''}{forkAngle.toFixed(1)}° of ±{BANKED_FORK_ANGLE.exit}°
      </Label>
      <Label position={[0.35, 0.55, -1.0]} accent="#fbbf24">
        lift angle {LIFT_ANGLE.toFixed(0)}° · balance {snap.balanceAngle >= 0 ? '+' : ''}{snap.balanceAngle.toFixed(0)}°
      </Label>
    </group>
  )
}
