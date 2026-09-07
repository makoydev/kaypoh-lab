import { Eye, Gauge, GraduationCap, Play, Search, Split, Thermometer, Wind } from 'lucide-react'
import { PanelSection } from '../../ui/Panel'
import { TurbofanPlayback } from '../../controls/turbofan/TurbofanPlayback'
import { N1Throttle } from '../../controls/turbofan/N1Throttle'
import { BypassRatioSlider } from '../../controls/turbofan/BypassRatioSlider'
import { ThrustSplit } from '../../controls/turbofan/ThrustSplit'
import { TurbofanViewModes } from '../../controls/turbofan/TurbofanViewModes'
import { StationStrip } from '../../controls/turbofan/StationStrip'
import { TurbofanPartInspector } from '../../controls/turbofan/TurbofanPartInspector'
import { HowTurbofanWork } from '../../education/turbofan/HowTurbofanWork'

/** Simulation & performance: playback, throttle, bypass ratio, thrust split. */
export function TurbofanSidebarLeft() {
  return (
    <>
      <PanelSection title="Playback" icon={Play}>
        <TurbofanPlayback />
      </PanelSection>
      <PanelSection title="Throttle" icon={Gauge}>
        <N1Throttle />
      </PanelSection>
      <PanelSection title="Bypass ratio" icon={Wind} hint="Kilograms around the core for every kilogram through it.">
        <BypassRatioSlider />
      </PanelSection>
      <PanelSection title="Where the thrust comes from" icon={Split}>
        <ThrustSplit />
      </PanelSection>
    </>
  )
}

/** Visuals & education: view modes, station strip, part inspector, explainer. */
export function TurbofanSidebarRight({ explainerOpen = true }: { explainerOpen?: boolean }) {
  return (
    <>
      <PanelSection title="View mode" icon={Eye}>
        <TurbofanViewModes />
      </PanelSection>
      <PanelSection title="Along the engine" icon={Thermometer}>
        <StationStrip />
      </PanelSection>
      <PanelSection title="Part inspector" icon={Search}>
        <TurbofanPartInspector />
      </PanelSection>
      <PanelSection title="Explainer" icon={GraduationCap}>
        <HowTurbofanWork defaultOpen={explainerOpen} />
      </PanelSection>
    </>
  )
}
