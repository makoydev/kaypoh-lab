import { Cog, Disc3, Flame, MoveVertical, Sparkles, Waypoints, type LucideIcon } from 'lucide-react'
import type { PartId } from '../../types/simulation'
import { PART_INFO, PART_LIST } from '../../lib/partInfo'
import { useEngine } from '../../hooks/useEngineSimulation'
import { PartInspectorView } from './PartInspectorView'

const ICONS: Record<PartId, LucideIcon> = {
  piston: MoveVertical,
  connectingRod: Waypoints,
  crankshaft: Cog,
  sparkPlug: Sparkles,
  cylinderBank: Flame,
  flywheel: Disc3,
  valves: MoveVertical,
}

export function PartInspector() {
  const { settings, selectPart } = useEngine()
  return (
    <PartInspectorView
      parts={PART_LIST}
      info={PART_INFO}
      icons={ICONS}
      selected={settings.selectedPart}
      hovered={settings.hoveredPart}
      onSelect={selectPart}
      emptyHint="Click any part on the engine — or a chip above — to see what it does. Go on, kaypoh a bit."
    />
  )
}
