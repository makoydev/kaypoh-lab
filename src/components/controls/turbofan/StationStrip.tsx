import type { StageId, StationId } from '../../../types/turbofan'
import { CYCLE, STAGE_META, STAGE_ORDER, STAGE_STATIONS } from '../../../lib/turbofanConfig'
import { kelvinToCelsius, stationOf } from '../../../lib/turbofanModel'
import { temperatureColor } from '../../../lib/flowVis'
import { useTurbofan, useTurbofanState } from '../../../hooks/useTurbofanSimulation'
import { cn } from '../../../lib/utils'

const T_MIN = CYCLE.ambient.temperatureK
const T_MAX = 1900

const css = (rgb: [number, number, number]) => `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`

/** The stage whose outlet is this station, if any — clicking a station focuses that stage. */
function stageEndingAt(id: StationId): StageId | null {
  return STAGE_ORDER.find((s) => STAGE_STATIONS[s].outlet === id) ?? null
}

/**
 * Pressure and temperature at every station along the engine, front to back. Temperature is the
 * coloured bar; pressure is the number under it. The bypass exit sits on its own since it branches
 * off after the fan.
 */
export function StationStrip() {
  const state = useTurbofanState()
  const { settings, update } = useTurbofan()
  const focusIds = settings.viewMode === 'stage' ? [STAGE_STATIONS[settings.focusStage].inlet, STAGE_STATIONS[settings.focusStage].outlet] : []
  const core = state.stations.filter((s) => s.strip && s.stream !== 'bypass')
  const bypass = stationOf(state, '13')
  const peak = Math.max(...state.stations.map((s) => s.temperatureK))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
        <span>Core stream · front → back</span>
        <span className="font-mono text-fog-300">peak {Math.round(kelvinToCelsius(peak))} °C</span>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${core.length}, minmax(0, 1fr))` }}>
        {core.map((s) => {
          const h = 6 + ((s.temperatureK - T_MIN) / (T_MAX - T_MIN)) * 44
          const focused = focusIds.includes(s.id)
          const stage = stageEndingAt(s.id)
          const color = css(temperatureColor(s.temperatureK))
          return (
            <button
              key={s.id}
              type="button"
              disabled={!stage}
              onClick={() => stage && update({ viewMode: 'stage', focusStage: stage })}
              title={stage ? `${s.label} — focus the ${STAGE_META[stage].label}` : s.label}
              className={cn(
                'group flex flex-col items-center rounded-md border px-0.5 pb-1 pt-1.5 transition-colors',
                focused ? 'border-accent/60 bg-accent/10' : 'border-white/[0.05] hover:border-white/15 disabled:hover:border-white/[0.05]',
              )}
            >
              <span className="flex h-[52px] items-end">
                <span className="w-2.5 rounded-t-sm transition-[height] duration-300" style={{ height: h, backgroundColor: color, boxShadow: `0 0 8px ${color}55` }} />
              </span>
              <span className="mt-1 font-mono text-[10px] leading-none text-fog-100">{s.id}</span>
              <span className="mt-1 font-mono text-[9px] leading-none text-fog-300">{Math.round(kelvinToCelsius(s.temperatureK))}°</span>
              <span className="mt-0.5 font-mono text-[9px] leading-none text-fog-500">×{s.pressureRatio < 10 ? s.pressureRatio.toFixed(1) : Math.round(s.pressureRatio)}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-md border border-sky-400/20 bg-sky-400/[0.05] px-2 py-1.5 text-[11px]">
        <span className="text-sky-300">
          Station {bypass.id} · {bypass.label}
        </span>
        <span className="font-mono text-fog-300">
          {Math.round(kelvinToCelsius(bypass.temperatureK))}° · ×{bypass.pressureRatio.toFixed(2)}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        Bar = temperature, number = pressure as a multiple of outside air. Click a station to isolate the stage that ends there.
      </p>
    </div>
  )
}
