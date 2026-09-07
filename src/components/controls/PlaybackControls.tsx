import { useEngine } from '../../hooks/useEngineSimulation'
import { PlaybackControlsView } from './PlaybackControlsView'

export function PlaybackControls() {
  const { settings, update } = useEngine()
  return (
    <PlaybackControlsView
      playing={settings.playing}
      speed={settings.speed}
      onToggle={() => update({ playing: !settings.playing })}
      onSpeed={(speed) => update({ speed })}
    />
  )
}
