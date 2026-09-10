import type { EscapementPhase, EscapementStep, Pallet } from '../../../types/escapement'
import { ACTION, BANKED_FORK_ANGLE, ESC, STEP_META } from '../../../lib/escapementConfig'
import { BALANCE_CENTRE, WHEEL_CENTRE, add, impulsePin, palletStoneOutline, polar, rot, toothTipAngles } from '../../../lib/escapementModel'
import { BANKING_PINS } from '../../3d/escapement/geometries'

interface EscapementSchematicProps {
  step: EscapementStep
  balanceAngle: number
  forkAngle: number
  escapeAngle: number
  phase: EscapementPhase
  pallet: Pallet
  s: number
  className?: string
}

const W = 320
const H = 170
const SCALE = 44
const CX = 132
const CY = 80
const mono = 'JetBrains Mono, ui-monospace, monospace'
const DIM = '#3b4351'

/** Scene (x, z) → SVG. Plan view, z toward the bottom of the sheet, as the 3D camera sees it. */
const sx = (x: number) => CX + x * SCALE
const sy = (z: number) => CY + z * SCALE
const path = (pts: { x: number; z: number }[], close = true) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(1)} ${sy(p.z).toFixed(1)}`).join(' ') + (close ? ' Z' : '')

const STONES: Record<Pallet, { x: number; z: number }[]> = { entry: palletStoneOutline('entry'), exit: palletStoneOutline('exit') }

/**
 * Plan-view line drawing of the live escapement: balance with roller and pin, fork between its
 * banking pins, escape wheel with teeth. The part doing the work for the current step is lit.
 */
export function EscapementSchematic({ step, balanceAngle, forkAngle, escapeAngle, phase, pallet, s, className }: EscapementSchematicProps) {
  const accent = STEP_META[step].color
  const lit = (on: boolean) => (on ? accent : DIM)
  const inNotch = phase !== 'free'
  const balanceOn = step === 'swing'
  const forkOn = step === 'unlock' || step === 'impulse'
  const wheelOn = step === 'impulse' || step === 'lock'
  const pin = impulsePin(balanceAngle)
  const teeth = toothTipAngles(escapeAngle)
  const { tipRadius: Rt, rootRadius: Rr } = ESC.escapeWheel
  const label = `Escapement schematic, ${STEP_META[step].label.toLowerCase()}, ${phase}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
      {/* line of centres */}
      <line x1={sx(ESC.escapeWheel.x)} y1={CY} x2={sx(ESC.balance.x)} y2={CY} stroke="#222834" strokeDasharray="3 3" />

      {/* escape wheel */}
      <g stroke={lit(wheelOn)} fill="none" strokeWidth={wheelOn ? 1.3 : 1}>
        <circle cx={sx(WHEEL_CENTRE.x)} cy={sy(0)} r={Rr * SCALE} opacity={0.45} />
        <path
          d={path(
            teeth.flatMap((a) => [add(WHEEL_CENTRE, polar(Rr, a - 14)), add(WHEEL_CENTRE, polar(Rt - 0.09, a - 4)), add(WHEEL_CENTRE, polar(Rt, a)), add(WHEEL_CENTRE, polar(Rt - 0.16, a + 1)), add(WHEEL_CENTRE, polar(Rr, a + 4))]),
          )}
        />
        <circle cx={sx(WHEEL_CENTRE.x)} cy={sy(0)} r={3} fill="#0b0e13" />
      </g>

      {/* fork and pallets */}
      <g transform={`rotate(${-forkAngle} ${CX} ${CY})`}>
        <line x1={sx(0)} y1={CY} x2={sx(ESC.fork.notchRadius)} y2={CY} stroke={lit(forkOn)} strokeWidth={forkOn ? 2.2 : 1.6} strokeLinecap="round" />
        <path d={`M ${sx(ESC.fork.notchRadius)} ${sy(-0.11)} L ${sx(ESC.fork.notchRadius + 0.18)} ${sy(-0.11)} L ${sx(ESC.fork.notchRadius + 0.18)} ${sy(-0.058)} L ${sx(ESC.fork.notchRadius)} ${sy(-0.058)} M ${sx(ESC.fork.notchRadius)} ${sy(0.11)} L ${sx(ESC.fork.notchRadius + 0.18)} ${sy(0.11)} L ${sx(ESC.fork.notchRadius + 0.18)} ${sy(0.058)} L ${sx(ESC.fork.notchRadius)} ${sy(0.058)}`} fill="none" stroke={lit(forkOn)} strokeWidth={1.2} />
        {(['entry', 'exit'] as const).map((p) => {
          const c = STONES[p].reduce((acc, q) => ({ x: acc.x + q.x / STONES[p].length, z: acc.z + q.z / STONES[p].length }), { x: 0, z: 0 })
          const active = inNotch && (p === pallet ? phase !== 'lock' : phase === 'lock')
          return (
            <g key={p}>
              <line x1={sx(0)} y1={CY} x2={sx(c.x)} y2={sy(c.z)} stroke={lit(forkOn)} strokeWidth={1.4} strokeLinecap="round" />
              <path d={path(STONES[p])} fill={active ? `${accent}55` : '#3a1a22'} stroke={active ? accent : '#b04050'} strokeWidth={active ? 1.4 : 0.9} />
            </g>
          )
        })}
        <circle cx={CX} cy={CY} r={3.5} fill="#0b0e13" stroke={lit(forkOn)} />
      </g>
      {/* banking pins (fixed) */}
      {(['entry', 'exit'] as const).map((p) => (
        <circle key={p} cx={sx(BANKING_PINS[p].x)} cy={sy(BANKING_PINS[p].z)} r={2.2} fill="#5b616b" />
      ))}

      {/* balance, roller, pin */}
      <g stroke={lit(balanceOn)} fill="none" strokeWidth={balanceOn ? 1.4 : 1}>
        <circle cx={sx(BALANCE_CENTRE.x)} cy={sy(0)} r={ESC.balance.rimRadius * SCALE} />
        {[0, 1, 2].map((i) => {
          const a = balanceAngle + 120 * i
          const q = add(BALANCE_CENTRE, polar(ESC.balance.rimRadius - ESC.balance.rimWidth, a))
          return <line key={i} x1={sx(BALANCE_CENTRE.x)} y1={sy(0)} x2={sx(q.x)} y2={sy(q.z)} />
        })}
        <circle cx={sx(BALANCE_CENTRE.x)} cy={sy(0)} r={ESC.roller.radius * SCALE} opacity={0.6} />
      </g>
      <circle cx={sx(pin.x)} cy={sy(pin.z)} r={2.6} fill={inNotch ? accent : '#b04050'} />

      {/* fork swing arc at the notch */}
      <path
        d={path([rot(BANKED_FORK_ANGLE.entry, { x: ESC.fork.notchRadius + 0.1, z: 0 }), rot(BANKED_FORK_ANGLE.exit, { x: ESC.fork.notchRadius + 0.1, z: 0 })], false)}
        stroke={step === 'unlock' ? accent : '#2b3341'}
        strokeWidth={0.8}
        fill="none"
        strokeDasharray="2 2"
      />

      {/* labels */}
      <text x={sx(WHEEL_CENTRE.x)} y={sy(0) + Rt * SCALE + 12} textAnchor="middle" fontSize={7} fontFamily={mono} fill="#5b616b">
        ESCAPE WHEEL · {ESC.escapeWheel.teeth}T
      </text>
      <text x={sx(BALANCE_CENTRE.x)} y={sy(0) + ESC.balance.rimRadius * SCALE + 12} textAnchor="middle" fontSize={7} fontFamily={mono} fill="#5b616b">
        BALANCE {balanceAngle >= 0 ? '+' : ''}
        {balanceAngle.toFixed(0)}°
      </text>
      <text x={sx(0)} y={sy(0) - 1.2 * SCALE} textAnchor="middle" fontSize={7} fontFamily={mono} fill="#5b616b">
        FORK {forkAngle >= 0 ? '+' : ''}
        {forkAngle.toFixed(1)}°
      </text>
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={7} fontFamily={mono} fill={accent}>
        {inNotch ? `${phase.toUpperCase()} · ${pallet.toUpperCase()} PALLET · ${Math.round(s * 100)} %` : `FREE SWING · WHEEL LOCKED · DROP ${ACTION.drop}° WAITS`}
      </text>
    </svg>
  )
}
