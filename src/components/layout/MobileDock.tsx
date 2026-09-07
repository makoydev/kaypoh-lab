import { Eye, Pause, Play, SlidersHorizontal } from 'lucide-react'
import { useEngine } from '../../hooks/useEngineSimulation'
import { Button } from '../ui/Button'

export type Sheet = 'controls' | 'visuals'

export function MobileDock({ onOpen }: { onOpen: (sheet: Sheet) => void }) {
  const { settings, update } = useEngine()
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="glass pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-2xl p-2">
        <Button className="flex-1" onClick={() => onOpen('controls')}>
          <SlidersHorizontal className="size-4" /> Simulation
        </Button>
        <Button
          variant={settings.playing ? 'solid' : 'accent'}
          size="icon"
          className="rounded-xl"
          onClick={() => update({ playing: !settings.playing })}
          aria-label={settings.playing ? 'Pause' : 'Play'}
        >
          {settings.playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
        </Button>
        <Button className="flex-1" onClick={() => onOpen('visuals')}>
          <Eye className="size-4" /> Visuals
        </Button>
      </div>
    </div>
  )
}
