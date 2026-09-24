import { motion } from 'framer-motion'
import type { GearId, GearboxStep, HubId, SpeedGearId } from '../../../types/gearbox'
import { HUB_OF, STEP_META } from '../../../lib/gearboxConfig'

interface GearboxSchematicProps {
  step: GearboxStep
  /** Gear currently locked in the 3D model, so the torque path matches what the learner sees. */
  engaged: GearId
  /** Live sleeve positions, −1..1 per hub. */
  sleeves: Record<HubId, number>
  className?: string
}

const W = 320
const H = 150
const MAIN_Y = 58
const COUNTER_Y = 118
const mono = 'JetBrains Mono, ui-monospace, monospace'
const DIM = '#3b4351'

/** Layout along the schematic, left → right: input gear (4th), 3-4 hub, 3rd, 2nd, 1-2 hub, 1st, 5th, 5-R hub, R. */
const GEAR_X: Record<SpeedGearId, number> = { '4': 74, '3': 118, '2': 150, '1': 194, '5': 226, R: 270 }
const HUB_X: Record<HubId, number> = { '34': 96, '12': 172, '5R': 248 }
/** Half-heights of the output-side (top) and counter-side (bottom) wheels, proportional to their radii. */
const SIZE: Record<SpeedGearId, [number, number]> = { '4': [12, 18], '3': [14, 16], '2': [17, 13], '1': [20, 10], '5': [11, 19], R: [19, 8] }

/**
 * Side-view line drawing: input and output shafts along the top, countershaft below, one gear pair
 * per speed, three synchro hubs whose sleeves slide with the live model, and the torque path lit when
 * a gear is locked. The reverse idler is drawn as a small third wheel between R's pair.
 */
export function GearboxSchematic({ step, engaged, sleeves, className }: GearboxSchematicProps) {
  const accent = STEP_META[step].color
  const meshOn = step === 'mesh'
  const lockOn = step === 'lock' && engaged !== 'N'
  const synchroOn = step === 'synchro'
  const engagedHub = engaged === 'N' ? null : HUB_OF[engaged].hub
  const pairStroke = (g: SpeedGearId) => (meshOn ? accent : lockOn && engaged === g ? accent : DIM)
  const label = `Gearbox schematic, ${STEP_META[step].label.toLowerCase()}${lockOn ? `, torque through ${engaged === 'R' ? 'reverse' : `gear ${engaged}`}` : ''}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label}>
      {/* case outline */}
      <rect x={52} y={24} width={244} height={112} rx={8} fill="none" stroke="#2b3341" strokeWidth={1} strokeDasharray="3 3" />

      {/* shafts */}
      <line x1={14} y1={MAIN_Y} x2={92} y2={MAIN_Y} stroke={lockOn ? accent : '#6b7280'} strokeWidth={3} strokeLinecap="round" />
      <line x1={92} y1={MAIN_Y} x2={306} y2={MAIN_Y} stroke={lockOn ? accent : '#6b7280'} strokeWidth={3} strokeLinecap="round" />
      <line x1={60} y1={COUNTER_Y} x2={286} y2={COUNTER_Y} stroke={lockOn && engaged !== '4' ? accent : '#6b7280'} strokeWidth={3} strokeLinecap="round" />
      <text x={14} y={MAIN_Y - 8} fontSize={7} fontFamily={mono} fill="#5b616b">
        ENGINE →
      </text>
      <text x={306} y={MAIN_Y - 8} textAnchor="end" fontSize={7} fontFamily={mono} fill="#5b616b">
        → WHEELS
      </text>
      <text x={60} y={COUNTER_Y + 14} fontSize={7} fontFamily={mono} fill="#5b616b">
        COUNTERSHAFT
      </text>

      {/* gear pairs */}
      {(Object.keys(GEAR_X) as SpeedGearId[]).map((g) => {
        const x = GEAR_X[g]
        const [top, bottom] = SIZE[g]
        const stroke = pairStroke(g)
        const lit = stroke !== DIM
        return (
          <g key={g}>
            <rect x={x - 5} y={MAIN_Y - top} width={10} height={top * 2} rx={1.5} fill={lit ? `${stroke}22` : 'transparent'} stroke={stroke} strokeWidth={lit ? 1.6 : 1.1} />
            {g === 'R' ? (
              <>
                <rect x={x - 5} y={COUNTER_Y - bottom} width={10} height={bottom * 2} rx={1.5} fill={lit ? `${stroke}22` : 'transparent'} stroke={stroke} strokeWidth={lit ? 1.6 : 1.1} />
                <circle cx={x + 14} cy={(MAIN_Y + top + COUNTER_Y - bottom) / 2 + 4} r={9} fill="none" stroke={stroke} strokeWidth={lit ? 1.6 : 1.1} />
              </>
            ) : (
              <rect x={x - 5} y={COUNTER_Y - bottom} width={10} height={bottom * 2} rx={1.5} fill={lit ? `${stroke}22` : 'transparent'} stroke={stroke} strokeWidth={lit ? 1.6 : 1.1} />
            )}
            <text x={x} y={MAIN_Y - top - 4} textAnchor="middle" fontSize={7} fontFamily={mono} fill={lit ? stroke : '#5b616b'} fontWeight={lit ? 700 : 400}>
              {g}
            </text>
          </g>
        )
      })}

      {/* synchro hubs + sleeves */}
      {(Object.keys(HUB_X) as HubId[]).map((h) => {
        const x = HUB_X[h]
        const hot = synchroOn && sleeves[h] !== 0 && Math.abs(sleeves[h]) < 1
        const on = (lockOn && engagedHub === h) || hot
        const color = hot ? '#fbbf24' : on ? accent : '#8b919c'
        return (
          <g key={h}>
            <rect x={x - 7} y={MAIN_Y - 8} width={14} height={16} rx={2} fill="#1a1f28" stroke={color} strokeWidth={1.1} />
            <motion.rect
              x={x - 9}
              y={MAIN_Y - 12}
              width={18}
              height={24}
              rx={2}
              fill={on ? `${color}33` : '#252b36'}
              stroke={color}
              strokeWidth={on ? 1.6 : 1.1}
              animate={{ x: sleeves[h] * 12 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            />
            {hot && (
              <motion.circle
                cx={x + Math.sign(sleeves[h]) * 15}
                cy={MAIN_Y}
                r={6}
                fill="none"
                stroke="#fb923c"
                strokeWidth={1.4}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
            )}
          </g>
        )
      })}

      {/* neutral note */}
      {step === 'neutral' && (
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={7} fontFamily={mono} fill={accent}>
          ALL SLEEVES CENTRED · NOTHING LOCKED
        </text>
      )}
      {lockOn && (
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={7} fontFamily={mono} fill={accent}>
          TORQUE PATH LIT
        </text>
      )}
      {meshOn && (
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={7} fontFamily={mono} fill={accent}>
          EVERY PAIR TURNING · OUTPUT GEARS FREEWHEEL
        </text>
      )}
    </svg>
  )
}
