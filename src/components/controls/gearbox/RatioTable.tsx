import { GEAR_META, SPEED_GEARS, TEETH, ratioOf } from '../../../lib/gearboxConfig'
import { carSpeedKmh } from '../../../lib/gearboxModel'
import { useGearbox, useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'
import { cn } from '../../../lib/utils'

/** Every gear's tooth counts and ratio, with the road speed it would give at the current engine rpm. Click to shift. */
export function RatioTable() {
  const { settings, selectGear } = useGearbox()
  const snap = useGearboxSnapshot()
  const rpm = settings.engineRpm

  return (
    <div>
      <table className="w-full border-separate border-spacing-y-1 text-[11px]">
        <thead>
          <tr className="text-[9px] uppercase tracking-[0.14em] text-fog-700">
            <th className="text-left font-medium">Gear</th>
            <th className="text-left font-medium">Teeth</th>
            <th className="text-right font-medium">Ratio</th>
            <th className="text-right font-medium">@ {Math.round(rpm / 100) / 10}k rpm</th>
          </tr>
        </thead>
        <tbody>
          {SPEED_GEARS.map((g) => {
            const engaged = snap.engaged === g
            const target = settings.gear === g
            const teeth = g === '4' ? 'direct' : `${TEETH.pairs[g].counter} : ${TEETH.pairs[g].output}`
            const kmh = Math.abs(carSpeedKmh(rpm / ratioOf(g)))
            return (
              <tr
                key={g}
                onClick={() => selectGear(g)}
                className={cn('cursor-pointer transition-colors', engaged ? 'text-emerald-300' : target ? 'text-amber-300' : 'text-fog-300 hover:text-fog-100')}
                aria-current={engaged ? 'true' : undefined}
              >
                <td className={cn('rounded-l-md py-1 pl-2 font-mono', engaged ? 'bg-emerald-400/10' : 'bg-white/[0.02]')}>{GEAR_META[g].label}</td>
                <td className={cn('py-1 font-mono text-fog-500', engaged ? 'bg-emerald-400/10' : 'bg-white/[0.02]')}>{teeth}</td>
                <td className={cn('py-1 text-right font-mono', engaged ? 'bg-emerald-400/10' : 'bg-white/[0.02]')}>×{ratioOf(g).toFixed(2)}</td>
                <td className={cn('rounded-r-md py-1 pr-2 text-right font-mono', engaged ? 'bg-emerald-400/10' : 'bg-white/[0.02]')}>
                  {Math.round(kmh)} <span className="text-fog-500">km/h</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] leading-snug text-fog-700">
        Counter : output teeth. Input to countershaft is {TEETH.input} : {TEETH.counterDrive} on top. Reverse counts the idler out — it only flips the direction.
      </p>
    </div>
  )
}
