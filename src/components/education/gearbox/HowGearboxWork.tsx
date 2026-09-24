import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Crosshair, Radio } from 'lucide-react'
import type { GearboxStep } from '../../../types/gearbox'
import { STEP_META, STEP_ORDER } from '../../../lib/gearboxConfig'
import { STEP_INFO } from '../../../lib/gearboxInfo'
import { nextGear } from '../../../lib/gearboxModel'
import { useGearbox, useGearboxSnapshot } from '../../../hooks/useGearboxSimulation'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/Button'
import { Toggle } from '../../ui/Toggle'
import { GearboxSchematic } from './GearboxSchematic'

/** What the live box is doing, as one of the four explainer steps. */
function liveStep(engaged: string, shifting: boolean): GearboxStep {
  if (shifting) return 'synchro'
  return engaged === 'N' ? 'neutral' : 'lock'
}

/** Mesh, neutral, synchro, lock — the four ideas behind every gear change. */
export function HowGearboxWork({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [follow, setFollow] = useState(false)
  const [manualTab, setTab] = useState<GearboxStep>('mesh')
  const { settings, update, selectGear, sim } = useGearbox()
  const snap = useGearboxSnapshot()
  const tab: GearboxStep = follow ? liveStep(snap.engaged, snap.shift !== null) : manualTab

  const info = STEP_INFO[tab]
  const meta = STEP_META[tab]

  const showIn3D = () => {
    const a = info.action
    const patch: Partial<typeof settings> = { viewMode: a.viewMode }
    if (a.torquePath !== undefined) patch.showTorquePath = a.torquePath
    update(patch)
    if (a.gear === 'next') {
      const current = settings.gear
      selectGear(current === '5' ? '4' : current === 'R' ? 'N' : nextGear(current, 1))
    } else if (a.gear) selectGear(a.gear)
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
          <span className="block text-[11px] text-fog-500">Everything is meshed. The lever only picks what gets locked.</span>
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
                {STEP_ORDER.map((s) => {
                  const m = STEP_META[s]
                  const selected = s === tab
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setTab(s)
                        setFollow(false)
                      }}
                      className={cn(
                        'flex flex-col items-center rounded-lg border py-1.5 transition-colors',
                        selected ? 'border-transparent text-ink-950' : 'border-white/[0.07] text-fog-300 hover:border-white/20',
                      )}
                      style={selected ? { backgroundColor: m.color } : undefined}
                    >
                      <span className="font-mono text-[10px] opacity-70">{STEP_INFO[s].step}</span>
                      <span className="text-xs font-semibold">{m.nick}</span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-2">
                <GearboxSchematic step={tab} engaged={snap.engaged} sleeves={sim.sleeves} className="mx-auto h-auto w-full" />
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
                      Follow the live box
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
