import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { PlaybackControlsView } from '../PlaybackControlsView'

export function EscapementPlayback() {
  const { settings, update } = useEscapement()
  return (
    <PlaybackControlsView
      playing={settings.playing}
      speed={settings.speed}
      onToggle={() => update({ playing: !settings.playing })}
      onSpeed={(speed) => update({ speed })}
      layoutId="esc-speed"
    />
  )
}
