import { Eye, GraduationCap, Search } from 'lucide-react'
import { PanelSection } from '../ui/Panel'
import { ViewModes } from '../controls/ViewModes'
import { PartInspector } from '../controls/PartInspector'
import { HowLikeDatWork } from '../education/HowLikeDatWork'

/** Visuals & education: view modes, part inspector, four-stroke explainer. */
export function SidebarRight({ explainerOpen = true }: { explainerOpen?: boolean }) {
  return (
    <>
      <PanelSection title="View mode" icon={Eye}>
        <ViewModes />
      </PanelSection>
      <PanelSection title="Part inspector" icon={Search}>
        <PartInspector />
      </PanelSection>
      <PanelSection title="Explainer" icon={GraduationCap}>
        <HowLikeDatWork defaultOpen={explainerOpen} />
      </PanelSection>
    </>
  )
}
