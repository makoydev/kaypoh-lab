import { ACTION, ADVANCE_PER_BEAT, EMBRACE_TEETH, ESC, LEVER_SWING, PALLET_HALF_ANGLE, beatPeriod, escapeRpm, frequencyHz, secondsRatio } from '../../../lib/escapementConfig'
import { LIFT_ANGLE } from '../../../lib/escapementModel'
import { useEscapement } from '../../../hooks/useEscapementSimulation'

/** The handful of angles and counts that define this escapement, all read from the same config the 3D uses. */
export function NumbersTable() {
  const { settings } = useEscapement()
  const rate = settings.beatRate
  const rows: [string, string, string][] = [
    ['Escape wheel teeth', String(ESC.escapeWheel.teeth), `${(360 / ESC.escapeWheel.teeth).toFixed(0)}° pitch`],
    ['Pallets embrace', `${EMBRACE_TEETH} teeth`, `lock at ±${PALLET_HALF_ANGLE}°`],
    ['Wheel per beat', `${ADVANCE_PER_BEAT}°`, 'half a pitch, jewels alternate'],
    ['Lever travel', `${LEVER_SWING}°`, `unlock ${(LEVER_SWING * ACTION.unlockEnd).toFixed(1)}° · impulse ${(LEVER_SWING * (ACTION.impulseEnd - ACTION.unlockEnd)).toFixed(1)}°`],
    ['Balance lift angle', `${LIFT_ANGLE.toFixed(0)}°`, `pin in notch ±${(LIFT_ANGLE / 2).toFixed(0)}°`],
    ['Draw (recoil)', `${ACTION.recoil}°`, 'wheel backs up to unlock'],
    ['Impulse · drop', `${ACTION.impulse}° · ${ACTION.drop}°`, 'of escape wheel'],
    ['Beat', `${(beatPeriod(rate) * 1000).toFixed(0)} ms`, `${frequencyHz(rate)} Hz, ${rate.toLocaleString()} vph`],
    ['Escape wheel', `${escapeRpm(rate)} rpm`, `${secondsRatio(rate)} turns per seconds-hand turn`],
  ]
  return (
    <table className="w-full text-[11px]">
      <tbody>
        {rows.map(([k, v, note]) => (
          <tr key={k} className="border-b border-white/[0.05] last:border-b-0">
            <td className="py-1.5 pr-2 text-fog-500">{k}</td>
            <td className="py-1.5 pr-2 text-right font-mono text-fog-100">{v}</td>
            <td className="py-1.5 text-right text-[10px] text-fog-700">{note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
