import { MAINSPRING, amplitudeFor } from '../../../lib/escapementConfig'
import { powerReserveHours } from '../../../lib/escapementModel'
import { useEscapement, useEscapementSnapshot } from '../../../hooks/useEscapementSimulation'
import { Slider } from '../../ui/Slider'

function mood(wind: number) {
  if (wind >= 95) return 'Fully wound. Big, lazy swings.'
  if (wind >= 60) return 'Plenty in the barrel.'
  if (wind >= 30) return 'Getting low. Smaller swings, same rate.'
  return 'Nearly run down. Still keeping time, lah.'
}

/** Mainspring wind → balance amplitude. The rate readout next to it refuses to move: that is the lesson. */
export function MainspringSlider() {
  const { settings, update } = useEscapement()
  const snap = useEscapementSnapshot()
  const wind = settings.wind
  const target = amplitudeFor(wind)
  const reserve = powerReserveHours(wind, MAINSPRING.reserveHours)

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none text-accent">
            {Math.round(snap.amplitude)}
            <span className="ml-1 text-sm text-fog-500">° amplitude</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">
            wind {wind} % · {reserve.toFixed(0)} h reserve · {snap.frequencyHz.toFixed(3)} Hz
          </div>
        </div>
        <div className="max-w-[140px] text-right text-[11px] leading-snug text-fog-500">{mood(wind)}</div>
      </div>

      <Slider
        ariaLabel="Mainspring wind (%)"
        min={MAINSPRING.minWind}
        max={MAINSPRING.maxWind}
        step={1}
        value={wind}
        onChange={(v) => update({ wind: v })}
        marks={[
          { value: MAINSPRING.minWind, label: 'empty' },
          { value: 50, label: '50 %' },
          { value: MAINSPRING.maxWind, label: 'full' },
        ]}
      />
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
        Less torque means a smaller swing ({MAINSPRING.minAmplitude}–{MAINSPRING.maxAmplitude}°, heading for {Math.round(target)}°), but the hairspring pulls back in proportion, so each swing takes the same time. Below about {Math.round(MAINSPRING.minAmplitude / 2.5)}° the pin could not unlock the fork and a real watch would stop.
      </p>
    </div>
  )
}
