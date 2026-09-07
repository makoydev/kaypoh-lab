import { Html } from '@react-three/drei'
import type { StageId } from '../../../types/turbofan'
import { STAGE_EXTENT, STAGE_META, stationById } from '../../../lib/turbofanConfig'
import { kelvinToCelsius } from '../../../lib/turbofanModel'
import { useTurbofanState } from '../../../hooks/useTurbofanSimulation'

const labelClass =
  'pointer-events-none select-none whitespace-nowrap rounded-md border border-white/10 bg-ink-900/90 px-2 py-1 font-mono text-[11px] leading-none text-fog-100 shadow-lg'

function Label({ children, accent, position }: { children: React.ReactNode; accent?: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <Html center distanceFactor={6} zIndexRange={[10, 0]}>
        <div className={labelClass} style={accent ? { borderColor: accent, color: accent } : undefined}>
          {children}
        </div>
      </Html>
    </group>
  )
}

/** Stage-focus annotations: pressure and temperature going in and coming out, plus the stage name. */
export function StageLabels({ stage }: { stage: StageId }) {
  const state = useTurbofanState()
  const st = state.stages[stage]
  const extent = STAGE_EXTENT[stage]
  const inlet = stationById(st.inlet)
  const outlet = stationById(st.outlet)
  // Sit the in/out tags just outside the blade tips; the fan's tips are high, so scale down for it.
  const y = Math.min(extent.radius * 0.72 + 0.35, 1.75)
  const meta = STAGE_META[stage]
  const pr = st.pressureRatio
  const dT = st.temperatureOutK - st.temperatureInK

  return (
    <group>
      <Label position={[inlet.x, y, 0]} accent="#38bdf8">
        in · ×{state.stations.find((s) => s.id === st.inlet)!.pressureRatio.toFixed(1)} · {Math.round(kelvinToCelsius(st.temperatureInK))} °C
      </Label>
      <Label position={[outlet.x, y, 0]} accent="#fb923c">
        out · ×{state.stations.find((s) => s.id === st.outlet)!.pressureRatio.toFixed(1)} · {Math.round(kelvinToCelsius(st.temperatureOutK))} °C
      </Label>
      <Label position={[(extent.xStart + extent.xEnd) / 2, -Math.min(extent.radius * 0.72 + 0.5, 1.9), 0]} accent={meta.color}>
        {meta.label} · {pr >= 1 ? `pressure ×${pr.toFixed(2)}` : `pressure ÷${(1 / pr).toFixed(2)}`} · {dT >= 0 ? '+' : '−'}
        {Math.round(Math.abs(dT))} °C
      </Label>
    </group>
  )
}
