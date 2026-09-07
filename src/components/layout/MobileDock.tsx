import { Eye, Pause, Play, SlidersHorizontal } from 'lucide-react'
import { Button } from '../ui/Button'

export type Sheet = 'controls' | 'visuals'

interface MobileDockProps {
  onOpen: (sheet: Sheet) => void
  playing: boolean
  onTogglePlay: () => void
}

export function MobileDock({ onOpen, playing, onTogglePlay }: MobileDockProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3">
      <div className="glass pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-2xl p-2">
        <Button className="flex-1" onClick={() => onOpen('controls')}>
          <SlidersHorizontal className="size-4" /> Simulation
        </Button>
        <Button variant={playing ? 'solid' : 'accent'} size="icon" className="rounded-xl" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
        </Button>
        <Button className="flex-1" onClick={() => onOpen('visuals')}>
          <Eye className="size-4" /> Visuals
        </Button>
      </div>
    </div>
  )
}
