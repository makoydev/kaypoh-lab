import { Flame, Gauge, Play, RotateCw } from 'lucide-react'
import { PanelSection } from '../ui/Panel'
import { PlaybackControls } from '../controls/PlaybackControls'
import { ThrottleSlider } from '../controls/ThrottleSlider'
import { StrokeStepper } from '../controls/StrokeStepper'
import { FiringOrder } from '../controls/FiringOrder'

/** Simulation & mechanics: playback, throttle, crank stepper, firing order. */
export function SidebarLeft() {
  return (
    <>
      <PanelSection title="Playback" icon={Play}>
        <PlaybackControls />
      </PanelSection>
      <PanelSection title="Throttle" icon={Gauge}>
        <ThrottleSlider />
      </PanelSection>
      <PanelSection title="Crank stepper" icon={RotateCw} hint="Two full turns of the crank = one complete four-stroke cycle.">
        <StrokeStepper />
      </PanelSection>
      <PanelSection title="Firing order" icon={Flame}>
        <FiringOrder />
      </PanelSection>
    </>
  )
}
