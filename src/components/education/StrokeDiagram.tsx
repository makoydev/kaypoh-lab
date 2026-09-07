import { motion } from 'framer-motion'
import type { Stroke } from '../../types/simulation'
import { STROKE_META } from '../../lib/engineConfig'

interface StrokeDiagramProps {
  stroke: Stroke
  /** 0-1 progress through the stroke. Defaults to a representative mid-stroke pose. */
  progress?: number
  className?: string
}

const W = 220
const H = 230
const BORE_L = 70
const BORE_R = 150
const BORE_TOP = 62
const BORE_BOTTOM = 200
const PISTON_H = 26
const TRAVEL = BORE_BOTTOM - BORE_TOP - PISTON_H - 10

/** Piston crown Y for a stroke + progress. Down-strokes: intake, power. Up-strokes: compression, exhaust. */
function pistonY(stroke: Stroke, p: number) {
  const eased = (1 - Math.cos(p * Math.PI)) / 2
  const down = stroke === 'intake' || stroke === 'power'
  return BORE_TOP + 8 + (down ? eased : 1 - eased) * TRAVEL
}

function Valve({ x, open, color, flip }: { x: number; open: number; color: string; flip?: boolean }) {
  const lift = open * 10
  return (
    <motion.g animate={{ y: lift }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
      <line x1={x} y1={BORE_TOP - 34} x2={x} y2={BORE_TOP - 2} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <path d={`M ${x - 12} ${BORE_TOP - 3} L ${x + 12} ${BORE_TOP - 3} L ${x + 8} ${BORE_TOP + 4} L ${x - 8} ${BORE_TOP + 4} Z`} fill={color} />
      {flip && null}
    </motion.g>
  )
}

/** Schematic single-cylinder diagram that animates between the four strokes. */
export function StrokeDiagram({ stroke, progress = 0.5, className }: StrokeDiagramProps) {
  const y = pistonY(stroke, progress)
  const meta = STROKE_META[stroke]
  const intakeOpen = stroke === 'intake' ? Math.sin(progress * Math.PI) : 0
  const exhaustOpen = stroke === 'exhaust' ? Math.sin(progress * Math.PI) : 0
  const spark = stroke === 'power' && progress < 0.22
  const down = stroke === 'intake' || stroke === 'power'
  const gasOpacity = stroke === 'compression' ? 0.25 + progress * 0.45 : stroke === 'power' ? 0.7 - progress * 0.4 : stroke === 'intake' ? 0.15 + progress * 0.2 : 0.4 - progress * 0.3
  const gasColor = stroke === 'power' ? '#fb923c' : stroke === 'exhaust' ? '#94a3b8' : stroke === 'compression' ? '#a78bfa' : '#38bdf8'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`${meta.label} stroke diagram`}>
      <defs>
        <linearGradient id="hld-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="0.5" stopColor="#d1d5db" />
          <stop offset="1" stopColor="#6b7280" />
        </linearGradient>
        <radialGradient id="hld-spark">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.4" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ports */}
      <path d={`M 20 ${BORE_TOP - 26} L ${BORE_L + 22} ${BORE_TOP - 26} L ${BORE_L + 22} ${BORE_TOP - 8}`} fill="none" stroke="#2b3341" strokeWidth={12} strokeLinejoin="round" />
      <path d={`M ${W - 20} ${BORE_TOP - 26} L ${BORE_R - 22} ${BORE_TOP - 26} L ${BORE_R - 22} ${BORE_TOP - 8}`} fill="none" stroke="#2b3341" strokeWidth={12} strokeLinejoin="round" />

      {/* Flow arrows */}
      {stroke === 'intake' && (
        <motion.g initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ repeat: Infinity, duration: 0.9, repeatType: 'loop' }}>
          <path d={`M 26 ${BORE_TOP - 26} l 26 0 m -8 -6 l 8 6 l -8 6`} fill="none" stroke="#38bdf8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}
      {stroke === 'exhaust' && (
        <motion.g initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 6 }} transition={{ repeat: Infinity, duration: 0.9, repeatType: 'loop' }}>
          <path d={`M ${W - 52} ${BORE_TOP - 26} l 26 0 m -8 -6 l 8 6 l -8 6`} fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}

      {/* Cylinder walls */}
      <rect x={BORE_L - 10} y={BORE_TOP - 8} width={10} height={BORE_BOTTOM - BORE_TOP + 8} fill="#343b48" />
      <rect x={BORE_R} y={BORE_TOP - 8} width={10} height={BORE_BOTTOM - BORE_TOP + 8} fill="#343b48" />
      <rect x={BORE_L - 10} y={BORE_TOP - 8} width={BORE_R - BORE_L + 20} height={8} fill="#343b48" />

      {/* Gas */}
      <motion.rect
        x={BORE_L}
        y={BORE_TOP}
        width={BORE_R - BORE_L}
        animate={{ height: Math.max(0, y - BORE_TOP), opacity: gasOpacity, fill: gasColor }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />

      {/* Valves: intake left (blue), exhaust right (grey) */}
      <Valve x={BORE_L + 22} open={intakeOpen} color="#7dd3fc" />
      <Valve x={BORE_R - 22} open={exhaustOpen} color="#cbd5e1" />

      {/* Spark plug */}
      <rect x={W / 2 - 4} y={BORE_TOP - 34} width={8} height={26} rx={2} fill="#e5e7eb" />
      <rect x={W / 2 - 2} y={BORE_TOP - 10} width={4} height={10} fill="#9ca3af" />
      {spark && (
        <motion.circle
          cx={W / 2}
          cy={BORE_TOP + 8}
          r={18}
          fill="url(#hld-spark)"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.4, 1], opacity: [0, 1, 0.8] }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Piston + rod */}
      <motion.g animate={{ y }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}>
        <rect x={BORE_L + 2} y={0} width={BORE_R - BORE_L - 4} height={PISTON_H} rx={3} fill="url(#hld-metal)" />
        <rect x={BORE_L + 2} y={5} width={BORE_R - BORE_L - 4} height={2} fill="#1f2937" opacity={0.7} />
        <rect x={BORE_L + 2} y={10} width={BORE_R - BORE_L - 4} height={2} fill="#1f2937" opacity={0.7} />
        <rect x={W / 2 - 6} y={PISTON_H - 2} width={12} height={BORE_BOTTOM - y + 30} rx={2} fill="#8b919c" />
        {/* Motion arrow */}
        <path
          d={down ? `M ${BORE_R + 28} 4 l 0 22 m -6 -7 l 6 7 l 6 -7` : `M ${BORE_R + 28} 26 l 0 -22 m -6 7 l 6 -7 l 6 7`}
          fill="none"
          stroke={meta.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>

      {/* Bottom mask so the rod disappears into the crankcase */}
      <rect x={0} y={BORE_BOTTOM} width={W} height={H - BORE_BOTTOM} fill="#0e1117" />
      <rect x={BORE_L - 10} y={BORE_BOTTOM - 1} width={BORE_R - BORE_L + 20} height={2} fill="#2b3341" />

      {/* Labels */}
      <text x={BORE_L + 22} y={BORE_TOP - 44} textAnchor="middle" fontSize={9} fill="#7dd3fc" fontFamily="JetBrains Mono, monospace">
        IN
      </text>
      <text x={BORE_R - 22} y={BORE_TOP - 44} textAnchor="middle" fontSize={9} fill="#cbd5e1" fontFamily="JetBrains Mono, monospace">
        EX
      </text>
    </svg>
  )
}
