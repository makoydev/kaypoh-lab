import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { PlaybackControlsView } from '../PlaybackControlsView'

export function TurbofanPlayback() {
  const { settings, update } = useTurbofan()
  return (
    <PlaybackControlsView
      playing={settings.playing}
      speed={settings.speed}
      onToggle={() => update({ playing: !settings.playing })}
      onSpeed={(speed) => update({ speed })}
      layoutId="tf-speed"
    />
  )
}
