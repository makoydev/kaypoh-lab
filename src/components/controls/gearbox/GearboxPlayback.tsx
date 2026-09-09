import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { PlaybackControlsView } from '../PlaybackControlsView'

export function GearboxPlayback() {
  const { settings, update } = useGearbox()
  return (
    <PlaybackControlsView
      playing={settings.playing}
      speed={settings.speed}
      onToggle={() => update({ playing: !settings.playing })}
      onSpeed={(speed) => update({ speed })}
      layoutId="gb-speed"
    />
  )
}
