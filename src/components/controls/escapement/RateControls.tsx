import type { BeatRate } from '../../../types/escapement'
import { BEAT_RATES, BEAT_RATE_META, REGULATOR, beatPeriod, frequencyHz } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { Slider } from '../../ui/Slider'

const RATE_OPTIONS = BEAT_RATES.map((r) => ({ value: r, label: BEAT_RATE_META[r].label, title: `${r} vibrations per hour` }))

function verdict(secondsPerDay: number) {
  const abs = Math.abs(secondsPerDay)
  if (abs === 0) return 'Dead on. Your watchmaker is pleased.'
  if (abs <= 6) return 'Chronometer grade (−4 to +6 s/day).'
  if (abs <= 30) return 'Fine for a mechanical watch.'
  if (abs <= 120) return 'Noticeable by the weekend.'
  return 'Set your meetings by something else.'
}

/** Beat rate (which hairspring-and-balance pair you have) and the regulator (how long that spring effectively is). */
export function RateControls() {
  const { settings, update } = useEscapement()
  const { beatRate, regulator } = settings
  const sign = regulator > 0 ? '+' : ''
  const accent = regulator === 0 ? '#34d399' : Math.abs(regulator) <= 30 ? '#fbbf24' : '#fb923c'

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
          <span>Beat rate, vibrations per hour</span>
          <span className="font-mono text-fog-300">
            {frequencyHz(beatRate)} Hz · {(beatPeriod(beatRate) * 1000).toFixed(0)} ms per tick
          </span>
        </div>
        <SegmentedControl layoutId="esc-rate" size="sm" options={RATE_OPTIONS} value={beatRate} onChange={(v: BeatRate) => update({ beatRate: v })} />
        <p className="mt-1.5 text-[11px] leading-snug text-fog-700">{BEAT_RATE_META[beatRate].note}</p>
      </div>

      <div>
        <div className="mb-1 flex items-end justify-between">
          <div>
            <div className="font-mono text-xl font-semibold tabular-nums leading-none" style={{ color: accent }}>
              {sign}
              {regulator}
              <span className="ml-1 text-xs text-fog-500">s/day</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">regulator · {regulator > 0 ? 'fast' : regulator < 0 ? 'slow' : 'neutral'}</div>
          </div>
          <div className="max-w-[150px] text-right text-[11px] leading-snug text-fog-500">{verdict(regulator)}</div>
        </div>
        <Slider
          ariaLabel="Regulator (seconds per day)"
          min={-REGULATOR.range}
          max={REGULATOR.range}
          step={REGULATOR.step}
          value={regulator}
          accent={accent}
          onChange={(v) => update({ regulator: v })}
          marks={[
            { value: -REGULATOR.range, label: 'slow' },
            { value: 0, label: '0' },
            { value: REGULATOR.range, label: 'fast' },
          ]}
        />
        <p className="mt-1.5 text-[11px] leading-snug text-fog-700">
          Slides the curb pins along the outer coil. Toward the stud the free spring gets longer and softer: slower. Watch the regulator arm on the balance cock move.
        </p>
      </div>
    </div>
  )
}
