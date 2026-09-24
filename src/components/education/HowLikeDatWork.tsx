import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LocateFixed, Radio } from 'lucide-react'
import type { Stroke } from '../../types/simulation'
import { STROKE_META, STROKE_ORDER, cylinderByNumber } from '../../lib/engineConfig'
import { STROKE_INFO } from '../../lib/strokeInfo'
import { crankAngleForStroke } from '../../lib/kinematics'
import { useEngine, useSimSnapshot } from '../../hooks/useEngineSimulation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import { StrokeDiagram } from './StrokeDiagram'

export function HowLikeDatWork({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [sync, setSync] = useState(true)
  const [manualTab, setTab] = useState<Stroke>('intake')
  const { settings, update, setAngle } = useEngine()
  const { focusCylinder } = settings
  const snap = useSimSnapshot(20)
  const live = snap.cylinders[focusCylinder - 1]
  const tab: Stroke = sync && live ? live.stroke : manualTab

  const info = STROKE_INFO[tab]
  const meta = STROKE_META[tab]
  const progress = sync && live && live.stroke === tab ? live.strokeProgress : 0.5

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
          <span className="block text-[11px] text-fog-500">The four-stroke cycle, step by step.</span>
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
              {/* Step tabs */}
              <div className="grid grid-cols-4 gap-1">
                {STROKE_ORDER.map((s) => {
                  const m = STROKE_META[s]
                  const selected = s === tab
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setTab(s)
                        setSync(false)
                      }}
                      className={cn(
                        'flex flex-col items-center rounded-lg border py-1.5 transition-colors',
                        selected ? 'border-transparent text-ink-950' : 'border-white/[0.07] text-fog-300 hover:border-white/20',
                      )}
                      style={selected ? { backgroundColor: m.color } : undefined}
                    >
                      <span className="font-mono text-[10px] opacity-70">{STROKE_INFO[s].step}</span>
                      <span className="text-xs font-semibold">{m.nick}</span>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-ink-900/60 p-2">
                <StrokeDiagram stroke={tab} progress={progress} className="mx-auto h-auto w-full max-w-[240px]" />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold" style={{ color: meta.color }}>
                      {info.step}. {info.title} <span className="text-fog-500">({info.nick})</span>
                    </h4>
                    <span className="font-mono text-[10px] text-fog-700">{info.crankRange}</span>
                  </div>
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
                  checked={sync}
                  onChange={setSync}
                  label={
                    <span className="flex items-center gap-1.5 text-fog-300">
                      <Radio className={cn('size-3.5', sync ? 'text-accent animate-hld-pulse' : 'text-fog-700')} />
                      Follow cyl {focusCylinder}
                    </span>
                  }
                />
                <Button
                  size="sm"
                  onClick={() => {
                    update({ playing: false })
                    setAngle(crankAngleForStroke(cylinderByNumber(focusCylinder), tab, 0.5))
                  }}
                  title="Pause and put the crank in the middle of this stroke"
                >
                  <LocateFixed className="size-3.5" /> Jump crank here
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
