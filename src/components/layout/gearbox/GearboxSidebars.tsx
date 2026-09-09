import { Eye, Gauge, GraduationCap, Play, Search, Sigma, Table2, Zap } from 'lucide-react'
import { PanelSection } from '../../ui/Panel'
import { GearboxPlayback } from '../../controls/gearbox/GearboxPlayback'
import { EngineRpmSlider } from '../../controls/gearbox/EngineRpmSlider'
import { GearSelector } from '../../controls/gearbox/GearSelector'
import { TorqueReadout } from '../../controls/gearbox/TorqueReadout'
import { GearboxViewModes } from '../../controls/gearbox/GearboxViewModes'
import { RatioTable } from '../../controls/gearbox/RatioTable'
import { GearboxPartInspector } from '../../controls/gearbox/GearboxPartInspector'
import { HowGearboxWork } from '../../education/gearbox/HowGearboxWork'

/** Simulation & mechanics: playback, engine speed, the lever, torque in and out. */
export function GearboxSidebarLeft() {
  return (
    <>
      <PanelSection title="Playback" icon={Play}>
        <GearboxPlayback />
      </PanelSection>
      <PanelSection title="Engine" icon={Gauge}>
        <EngineRpmSlider />
      </PanelSection>
      <PanelSection title="Gear lever" icon={Sigma}>
        <GearSelector />
      </PanelSection>
      <PanelSection title="Speed in, torque out" icon={Zap}>
        <TorqueReadout />
      </PanelSection>
    </>
  )
}

/** Visuals & education: view modes, ratio table, part inspector, explainer. */
export function GearboxSidebarRight({ explainerOpen = true }: { explainerOpen?: boolean }) {
  return (
    <>
      <PanelSection title="View mode" icon={Eye}>
        <GearboxViewModes />
      </PanelSection>
      <PanelSection title="Gear ratios" icon={Table2}>
        <RatioTable />
      </PanelSection>
      <PanelSection title="Part inspector" icon={Search}>
        <GearboxPartInspector />
      </PanelSection>
      <PanelSection title="Explainer" icon={GraduationCap}>
        <HowGearboxWork defaultOpen={explainerOpen} />
      </PanelSection>
    </>
  )
}
