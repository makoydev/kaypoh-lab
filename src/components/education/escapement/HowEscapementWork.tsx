import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Crosshair, Radio } from 'lucide-react'
import type { EscapementStep } from '../../../types/escapement'
import { PHASE_META, STEP_META, STEP_ORDER } from '../../../lib/escapementConfig'
import { ESCAPEMENT_STEP_INFO } from '../../../lib/escapementInfo'
import { useEscapement, useEscapementSnapshot } from '../../../hooks/useEscapementSimulation'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Toggle } from '../../ui/Toggle'
import { EscapementSchematic } from './EscapementSchematic'

/** Swing, unlock, impulse, lock — the four things that happen 28,800 times an hour. */
export function HowEscapementWork({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [follow, setFollow] = useState(false)
  const [manualTab, setTab] = useState<EscapementStep>('swing')
  const { update } = useEscapement()
  const snap = useEscapementSnapshot(30)
  const tab: EscapementStep = follow ? PHASE_META[snap.phase].step : manualTab

  const info = ESCAPEMENT_STEP_INFO[tab]
  const meta = STEP_META[tab]

  const showIn3D = () => {
    const a = info.action
    update(a.speed ? { viewMode: a.viewMode, speed: a.speed, playing: true } : { viewMode: a.viewMode })
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span>
          <span className="block text-sm font-semibold text-fog-100">How like dat work?</span>
          <span className="block text-[11px] text-fog-500">A spring that wants to unwind, let go one tooth at a time.</span>
        </span>
        <ChevronDown className={cn('size-4 text-fog-500 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {STEP_ORDER.map((st) => {
                  const m = STEP_META[st]
                  const selected = st === tab
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setTab(st)
                        setFollow(false)
                      }}
                      className={cn(
                        'flex flex-col items-center rounded-lg border py-1.5 transition-colors',
                        selected ? 'border-transparent text-ink-950' : 'border-white/[0.07] text-fog-300 hover:border-white/20',
                      )}
                      style={selected ? { backgroundColor: m.color } : undefined}
                    >
                      <span className="font-mono text-[10px] opacity-70">{ESCAPEMENT_STEP_INFO[st].step}</span>
                      <span className="text-xs font-semibold">{m.nick}</span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-2">
                <EscapementSchematic
                  step={tab}
                  balanceAngle={snap.balanceAngle}
                  forkAngle={snap.forkAngle}
                  escapeAngle={snap.escapeAngle}
                  phase={snap.phase}
                  pallet={snap.pallet}
                  s={snap.s}
                  className="mx-auto h-auto w-full"
                />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                  <h4 className="mb-1 text-sm font-semibold" style={{ color: meta.color }}>
                    {info.step}. {info.title}
                  </h4>
                  <p className="text-xs font-medium text-fog-100">{info.headline}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-fog-500">{info.body}</p>
                  <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    {info.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-[11px] text-fog-300">
                        <span className="mt-[5px] size-1 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <Toggle
                  checked={follow}
                  onChange={setFollow}
                  label={
                    <span className="flex items-center gap-1.5 text-fog-300">
                      <Radio className={cn('size-3.5', follow ? 'text-accent animate-hld-pulse' : 'text-fog-700')} />
                      Follow the live escapement
                    </span>
                  }
                />
                <Button size="sm" onClick={showIn3D} title="Set the 3D view up for this step">
                  <Crosshair className="size-3.5" /> Show in 3D
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
