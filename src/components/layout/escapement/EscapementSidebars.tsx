import { Activity, Eye, GraduationCap, Hash, Play, Search, Timer, Wind } from 'lucide-react'
import { PanelSection } from '../../ui/Panel'
import { EscapementPlayback } from '../../controls/escapement/EscapementPlayback'
import { MainspringSlider } from '../../controls/escapement/MainspringSlider'
import { RateControls } from '../../controls/escapement/RateControls'
import { BeatReadout } from '../../controls/escapement/BeatReadout'
import { EscapementViewModes } from '../../controls/escapement/EscapementViewModes'
import { NumbersTable } from '../../controls/escapement/NumbersTable'
import { EscapementPartInspector } from '../../controls/escapement/EscapementPartInspector'
import { HowEscapementWork } from '../../education/escapement/HowEscapementWork'

/** Simulation & mechanics: playback, mainspring, rate and regulator, what the beat is doing. */
export function EscapementSidebarLeft() {
  return (
    <>
      <PanelSection title="Playback" icon={Play}>
        <EscapementPlayback />
      </PanelSection>
      <PanelSection title="Mainspring" icon={Wind}>
        <MainspringSlider />
      </PanelSection>
      <PanelSection title="Rate & regulator" icon={Timer}>
        <RateControls />
      </PanelSection>
      <PanelSection title="This beat" icon={Activity}>
        <BeatReadout />
      </PanelSection>
    </>
  )
}

/** Visuals & education: view modes, the numbers, part inspector, explainer. */
export function EscapementSidebarRight({ explainerOpen = true }: { explainerOpen?: boolean }) {
  return (
    <>
      <PanelSection title="View mode" icon={Eye}>
        <EscapementViewModes />
      </PanelSection>
      <PanelSection title="The numbers" icon={Hash}>
        <NumbersTable />
      </PanelSection>
      <PanelSection title="Part inspector" icon={Search}>
        <EscapementPartInspector />
      </PanelSection>
      <PanelSection title="Explainer" icon={GraduationCap}>
        <HowEscapementWork defaultOpen={explainerOpen} />
      </PanelSection>
    </>
  )
}
