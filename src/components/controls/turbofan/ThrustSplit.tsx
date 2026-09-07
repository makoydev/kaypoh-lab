import { motion } from 'framer-motion'
import { useTurbofanState } from '../../../hooks/useTurbofanSimulation'

const kN = (n: number) => (n / 1000).toFixed(n >= 100_000 ? 0 : 1)

/** Where the push comes from: the bypass jet versus the core jet. */
export function ThrustSplit() {
  const state = useTurbofanState()
  const share = state.thrust.bypassShare
  const pct = Math.round(share * 100)

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="font-mono text-2xl font-semibold tabular-nums leading-none text-fog-100">
            {kN(state.thrust.total)}
            <span className="ml-1 text-sm text-fog-500">kN</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-fog-700">static thrust, sea level</div>
        </div>
        <div className="text-right text-[11px] text-fog-500">
          <span className="font-mono text-sky-300">{pct} %</span> from the fan
        </div>
      </div>

      <div className="relative flex h-3 w-full overflow-hidden rounded-full bg-ink-700" role="img" aria-label={`Bypass ${pct} percent, core ${100 - pct} percent of thrust`}>
        <motion.div className="h-full bg-sky-400/80" animate={{ width: `${share * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 24 }} />
        <div className="h-full flex-1 bg-ember/80" />
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-sky-400/20 bg-sky-400/[0.06] p-2">
          <dt className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-sky-300">
            Bypass jet <span className="font-mono normal-case tracking-normal text-fog-100">{kN(state.thrust.bypass)} kN</span>
          </dt>
          <dd className="mt-1 text-fog-500">
            {Math.round(state.massFlow.bypass)} kg/s at <span className="font-mono text-fog-300">{Math.round(state.jetVelocity.bypass)} m/s</span>
          </dd>
        </div>
        <div className="rounded-lg border border-ember/25 bg-ember/[0.06] p-2">
          <dt className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-ember">
            Core jet <span className="font-mono normal-case tracking-normal text-fog-100">{kN(state.thrust.core)} kN</span>
          </dt>
          <dd className="mt-1 text-fog-500">
            {Math.round(state.massFlow.core)} kg/s at <span className="font-mono text-fog-300">{Math.round(state.jetVelocity.core)} m/s</span>
          </dd>
        </div>
      </dl>
      <p className="mt-1.5 text-[11px] leading-snug text-fog-700">Thrust is mass flow × jet speed. The fan moves a lot of air slowly; the core moves a little very fast.</p>
    </div>
  )
}
