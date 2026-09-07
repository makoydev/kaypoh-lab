import type { CatalogModule } from '../../types/simulation'

interface SchematicProps {
  moduleId: CatalogModule['id']
  accent: string
  className?: string
}

const mono = 'JetBrains Mono, ui-monospace, monospace'

function Dim({ x1, x2, y, label, accent }: { x1: number; x2: number; y: number; label: string; accent: string }) {
  return (
    <g stroke={accent} strokeWidth={0.8} opacity={0.7}>
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <line x1={x1} y1={y} x2={x2} y2={y} markerEnd="url(#arrow)" markerStart="url(#arrow)" />
      <text x={(x1 + x2) / 2} y={y - 4} textAnchor="middle" fontSize={7} fill={accent} stroke="none" fontFamily={mono}>
        {label}
      </text>
    </g>
  )
}

function Turbofan({ accent }: { accent: string }) {
  const stages = [110, 124, 138, 152]
  return (
    <g fill="none" stroke={accent} strokeWidth={1.1}>
      <path d="M 40 60 Q 160 40 290 66 L 290 134 Q 160 160 40 140 Z" />
      <line x1={30} y1={100} x2={300} y2={100} strokeDasharray="4 4" opacity={0.5} />
      {/* fan */}
      <circle cx={70} cy={100} r={38} />
      <circle cx={70} cy={100} r={7} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <line key={i} x1={70 + Math.cos(a) * 8} y1={100 + Math.sin(a) * 8} x2={70 + Math.cos(a + 0.25) * 36} y2={100 + Math.sin(a + 0.25) * 36} />
      })}
      {/* compressor stages */}
      {stages.map((x, i) => (
        <g key={x}>
          <line x1={x} y1={100 - (30 - i * 4)} x2={x} y2={100 + (30 - i * 4)} />
          <line x1={x + 7} y1={100 - (26 - i * 4)} x2={x + 7} y2={100 + (26 - i * 4)} opacity={0.6} />
        </g>
      ))}
      {/* combustor */}
      <rect x={172} y={84} width={34} height={32} rx={4} />
      <path d="M 180 100 q 5 -8 9 0 q 4 8 9 0" stroke="#fb923c" />
      {/* turbine */}
      {[218, 232].map((x, i) => (
        <line key={x} x1={x} y1={100 - (22 + i * 4)} x2={x} y2={100 + (22 + i * 4)} />
      ))}
      {/* nozzle cone */}
      <path d="M 244 86 L 286 100 L 244 114" />
      <Dim x1={40} x2={290} y={172} label="L overall" accent={accent} />
      <text x={70} y={48} textAnchor="middle" fontSize={7} fill={accent} fontFamily={mono}>
        FAN Ø
      </text>
    </g>
  )
}

function Escapement({ accent }: { accent: string }) {
  const teeth = 15
  return (
    <g fill="none" stroke={accent} strokeWidth={1.1}>
      {/* balance wheel + hairspring */}
      <circle cx={90} cy={92} r={48} />
      <circle cx={90} cy={92} r={40} opacity={0.5} />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.4
        return <line key={i} x1={90} y1={92} x2={90 + Math.cos(a) * 44} y2={92 + Math.sin(a) * 44} />
      })}
      <path d="M 90 92 m 0 0 a 4 4 0 1 1 4 -4 a 8 8 0 1 1 -8 8 a 12 12 0 1 1 12 -12 a 16 16 0 1 1 -16 16 a 20 20 0 1 1 20 -20" opacity={0.7} />
      {/* pallet fork */}
      <path d="M 138 92 L 178 108 L 196 100 M 178 108 L 172 124" />
      <circle cx={178} cy={108} r={3} />
      {/* escape wheel */}
      <circle cx={232} cy={118} r={34} opacity={0.4} />
      <path
        d={Array.from({ length: teeth }, (_, i) => {
          const a1 = (i / teeth) * Math.PI * 2
          const a2 = ((i + 0.55) / teeth) * Math.PI * 2
          const a3 = ((i + 1) / teeth) * Math.PI * 2
          const p = (a: number, r: number) => `${232 + Math.cos(a) * r} ${118 + Math.sin(a) * r}`
          return `${i === 0 ? 'M' : 'L'} ${p(a1, 30)} L ${p(a2, 38)} L ${p(a3, 30)}`
        }).join(' ') + ' Z'}
      />
      <circle cx={232} cy={118} r={5} />
      <Dim x1={42} x2={138} y={160} label="balance Ø" accent={accent} />
      <text x={232} y={70} textAnchor="middle" fontSize={7} fill={accent} fontFamily={mono}>
        ESCAPE WHEEL · 15T
      </text>
    </g>
  )
}

function Transmission({ accent }: { accent: string }) {
  const gear = (cx: number, cy: number, r: number, n: number, key: string) => (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.3} opacity={0.6} />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2
        return <line key={i} x1={cx + Math.cos(a) * r} y1={cy + Math.sin(a) * r} x2={cx + Math.cos(a) * (r + 4)} y2={cy + Math.sin(a) * (r + 4)} />
      })}
    </g>
  )
  return (
    <g fill="none" stroke={accent} strokeWidth={1.1}>
      <line x1={30} y1={70} x2={290} y2={70} />
      <line x1={30} y1={138} x2={290} y2={138} />
      {gear(80, 70, 14, 12, 'a1')}
      {gear(80, 138, 34, 24, 'a2')}
      {gear(150, 70, 22, 16, 'b1')}
      {gear(150, 138, 26, 20, 'b2')}
      {gear(220, 70, 30, 22, 'c1')}
      {gear(220, 138, 18, 14, 'c2')}
      {/* synchro sleeve */}
      <rect x={106} y={58} width={22} height={24} rx={2} strokeDasharray="3 2" />
      <path d="M 117 50 L 117 40 L 128 34" />
      {/* shifter H pattern */}
      <g transform="translate(262 88)" opacity={0.8}>
        <line x1={0} y1={0} x2={0} y2={24} />
        <line x1={12} y1={0} x2={12} y2={24} />
        <line x1={24} y1={0} x2={24} y2={24} />
        <line x1={0} y1={12} x2={24} y2={12} />
      </g>
      <text x={30} y={62} fontSize={7} fill={accent} fontFamily={mono}>
        INPUT
      </text>
      <text x={30} y={152} fontSize={7} fill={accent} fontFamily={mono}>
        COUNTER
      </text>
      <Dim x1={80} x2={220} y={178} label="3 gear pairs" accent={accent} />
    </g>
  )
}

function V8({ accent }: { accent: string }) {
  return (
    <g fill="none" stroke={accent} strokeWidth={1.1}>
      {/* V banks */}
      <path d="M 160 120 L 90 50 L 130 20 L 175 92 Z" />
      <path d="M 160 120 L 230 50 L 190 20 L 145 92 Z" />
      <rect x={100} y={118} width={120} height={50} rx={6} />
      <circle cx={160} cy={143} r={16} />
      <circle cx={160} cy={143} r={4} />
      <line x1={160} y1={143} x2={172} y2={132} strokeWidth={2} />
      <Dim x1={100} x2={220} y={186} label="90° V" accent={accent} />
    </g>
  )
}

/** Blueprint-style line drawing for a module. */
export function ModuleSchematic({ moduleId, accent, className }: SchematicProps) {
  return (
    <svg viewBox="0 0 320 200" className={className} role="img" aria-label={`${moduleId} schematic`}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
        </marker>
      </defs>
      {moduleId === 'turbofan' && <Turbofan accent={accent} />}
      {moduleId === 'escapement' && <Escapement accent={accent} />}
      {moduleId === 'manual-transmission' && <Transmission accent={accent} />}
      {moduleId === 'v8-engine' && <V8 accent={accent} />}
    </svg>
  )
}
