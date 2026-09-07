import { Circle, CircleDot, Fan, Flame, Layers, Shield, Sun, Wind, type LucideIcon } from 'lucide-react'
import type { TurbofanPartId } from '../../../types/turbofan'
import { TURBOFAN_PART_INFO, TURBOFAN_PART_LIST } from '../../../lib/turbofanInfo'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { PartInspectorView } from '../PartInspectorView'

const ICONS: Record<TurbofanPartId, LucideIcon> = {
  fan: Fan,
  booster: Circle,
  hpCompressor: Layers,
  combustor: Flame,
  hpTurbine: Sun,
  lpTurbine: CircleDot,
  nozzle: Wind,
  nacelle: Shield,
}

export function TurbofanPartInspector() {
  const { settings, selectPart } = useTurbofan()
  return (
    <PartInspectorView
      parts={TURBOFAN_PART_LIST}
      info={TURBOFAN_PART_INFO}
      icons={ICONS}
      selected={settings.selectedPart}
      hovered={settings.hoveredPart}
      onSelect={selectPart}
      emptyHint="Click any part of the engine — or a chip above — to see what it does. The fan is a good place to start, kaypoh."
    />
  )
}
