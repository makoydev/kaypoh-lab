import { Pause, Play } from 'lucide-react'
import type { SpeedMultiplier } from '../../types/simulation'
import { useEngine } from '../../hooks/useEngineSimulation'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Kbd } from '../ui/Kbd'

const SPEEDS: { value: SpeedMultiplier; label: string; title: string }[] = [
  { value: 0.1, label: '0.1×', title: 'Very slow-mo' },
  { value: 0.5, label: '0.5×', title: 'Slow-mo' },
  { value: 1, label: '1×', title: 'Normal' },
]

export function PlaybackControls() {
  const { settings, update } = useEngine()
  const { playing, speed } = settings

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={playing ? 'solid' : 'accent'}
        size="icon"
        className="size-11 shrink-0 rounded-xl"
        onClick={() => update({ playing: !playing })}
        aria-label={playing ? 'Pause' : 'Play'}
        title={playing ? 'Pause (Space)' : 'Play (Space)'}
      >
        {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="ml-0.5 size-5" fill="currentColor" />}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fog-500">
          <span>Speed</span>
          <span className="flex items-center gap-1">
            <Kbd>Space</Kbd> play / pause
          </span>
        </div>
        <SegmentedControl layoutId="speed" options={SPEEDS} value={speed} onChange={(v) => update({ speed: v })} />
      </div>
    </div>
  )
}
