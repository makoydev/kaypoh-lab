import { motion } from 'framer-motion'
import type { StageId } from '../../../types/turbofan'
import { STAGE_META } from '../../../lib/turbofanConfig'

interface FlowSchematicProps {
  /** Stages to light up. */
  active: StageId[]
  accent: string
  className?: string
}

const W = 320
const H = 150
const CY = 78
const mono = 'JetBrains Mono, ui-monospace, monospace'

/** Side-view line drawing of the engine with the active region highlighted and the air animated through it. */
export function FlowSchematic({ active, accent, className }: FlowSchematicProps) {
  const on = (s: StageId) => active.includes(s)
  const stroke = (s: StageId) => (on(s) ? accent : '#3b4351')
  const width = (s: StageId) => (on(s) ? 1.8 : 1.1)
  const fill = (s: StageId) => (on(s) ? `${accent}22` : 'transparent')
  const bypassOn = on('fan')
  const coreOn = active.some((s) => s !== 'fan')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`Engine schematic, highlighting ${active.map((s) => STAGE_META[s].label).join(', ')}`}>
      {/* nacelle */}
      <path d="M 36 30 Q 110 22 168 32 L 168 124 Q 110 134 36 126 Z" fill="none" stroke="#3b4351" strokeWidth={1.2} />
      <line x1={26} y1={CY} x2={300} y2={CY} stroke="#2b3341" strokeDasharray="3 4" />

      {/* fan */}
      <g>
        <rect x={52} y={36} width={10} height={84} rx={2} fill={fill('fan')} stroke={stroke('fan')} strokeWidth={width('fan')} />
        {Array.from({ length: 7 }, (_, i) => (
          <line key={i} x1={53} y1={40 + i * 12.5} x2={61} y2={46 + i * 12.5} stroke={stroke('fan')} strokeWidth={0.8} />
        ))}
        <path d="M 30 62 q 8 -20 22 -26 M 30 94 q 8 20 22 26" fill="none" stroke="#3b4351" strokeWidth={1} />
      </g>

      {/* core casing */}
      <path d="M 74 58 L 128 60 L 160 64 L 176 56 L 200 56 L 204 62 L 234 58 L 262 52 L 286 62 M 74 98 L 128 96 L 160 92 L 176 100 L 200 100 L 204 94 L 234 98 L 262 104 L 286 94" fill="none" stroke="#3b4351" strokeWidth={1.1} />

      {/* booster */}
      <g>
        <rect x={76} y={61} width={22} height={34} rx={1.5} fill={fill('booster')} stroke={stroke('booster')} strokeWidth={width('booster')} />
        {[80, 86, 92].map((x) => (
          <line key={x} x1={x} y1={63} x2={x} y2={93} stroke={stroke('booster')} strokeWidth={0.8} />
        ))}
      </g>

      {/* HP compressor: shrinking rows */}
      <g>
        <path d="M 104 61 L 160 65 L 160 91 L 104 95 Z" fill={fill('hpCompressor')} stroke={stroke('hpCompressor')} strokeWidth={width('hpCompressor')} />
        {Array.from({ length: 8 }, (_, i) => {
          const x = 108 + i * 6.6
          const half = 15 - i * 1.4
          return <line key={i} x1={x} y1={CY - half} x2={x} y2={CY + half} stroke={stroke('hpCompressor')} strokeWidth={0.8} />
        })}
      </g>

      {/* combustor */}
      <g>
        <rect x={168} y={60} width={34} height={36} rx={5} fill={fill('combustor')} stroke={stroke('combustor')} strokeWidth={width('combustor')} />
        <motion.path
          d="M 176 78 q 4 -9 9 0 q 4 9 9 0 q 3 -6 6 0"
          fill="none"
          stroke={on('combustor') ? '#fb923c' : '#4b3a2c'}
          strokeWidth={1.4}
          animate={on('combustor') ? { opacity: [0.6, 1, 0.6], scaleY: [1, 1.15, 1] } : { opacity: 0.7 }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          style={{ transformOrigin: '185px 78px' }}
        />
      </g>

      {/* HP turbine */}
      <g>
        <rect x={206} y={60} width={16} height={36} rx={1.5} fill={fill('hpTurbine')} stroke={stroke('hpTurbine')} strokeWidth={width('hpTurbine')} />
        {[210, 217].map((x) => (
          <line key={x} x1={x} y1={63} x2={x} y2={93} stroke={stroke('hpTurbine')} strokeWidth={0.8} />
        ))}
      </g>

      {/* LP turbine: growing rows */}
      <g>
        <path d="M 226 60 L 260 54 L 260 102 L 226 96 Z" fill={fill('lpTurbine')} stroke={stroke('lpTurbine')} strokeWidth={width('lpTurbine')} />
        {Array.from({ length: 4 }, (_, i) => {
          const x = 230 + i * 8
          const half = 16 + i * 2.2
          return <line key={i} x1={x} y1={CY - half} x2={x} y2={CY + half} stroke={stroke('lpTurbine')} strokeWidth={0.8} />
        })}
      </g>

      {/* nozzle + cone */}
      <g>
        <path d="M 262 52 L 288 62 L 288 94 L 262 104 Z" fill={fill('nozzle')} stroke={stroke('nozzle')} strokeWidth={width('nozzle')} />
        <path d="M 262 70 L 300 78 L 262 86 Z" fill="none" stroke={stroke('nozzle')} strokeWidth={width('nozzle')} />
      </g>

      {/* Animated flow: bypass (top/bottom) and core (centre) */}
      {[44, 112].map((y) => (
        <motion.g key={y} initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 40], opacity: [0, 1, 1, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}>
          {[70, 100, 130].map((x) => (
            <line key={x} x1={x} y1={y} x2={x + 14} y2={y} stroke={bypassOn ? '#38bdf8' : '#2f4a5a'} strokeWidth={1.6} strokeLinecap="round" />
          ))}
        </motion.g>
      ))}
      <motion.g initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 34], opacity: [0, 1, 1, 0] }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}>
        {[100, 134, 210, 244, 292].map((x, i) => (
          <line key={x} x1={x} y1={CY} x2={x + 10} y2={CY} stroke={coreOn ? (i >= 2 ? '#fb923c' : '#a78bfa') : '#3b4351'} strokeWidth={1.6} strokeLinecap="round" />
        ))}
      </motion.g>

      {/* labels */}
      {(
        [
          ['fan', 57, 'FAN'],
          ['booster', 87, 'BOOST'],
          ['hpCompressor', 132, 'HPC'],
          ['combustor', 185, 'BURN'],
          ['hpTurbine', 214, 'HPT'],
          ['lpTurbine', 243, 'LPT'],
          ['nozzle', 280, 'NOZZLE'],
        ] as [StageId, number, string][]
      ).map(([id, x, text]) => (
        <text key={id} x={x} y={142} textAnchor="middle" fontSize={7} fontFamily={mono} fill={on(id) ? accent : '#5b616b'} fontWeight={on(id) ? 700 : 400}>
          {text}
        </text>
      ))}
      <text x={30} y={16} fontSize={7} fontFamily={mono} fill="#5b616b">
        AIR IN →
      </text>
      <text x={300} y={16} textAnchor="end" fontSize={7} fontFamily={mono} fill="#5b616b">
        → THRUST
      </text>
    </svg>
  )
}
