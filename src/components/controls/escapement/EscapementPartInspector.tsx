import { Anchor, CircleDot, Diamond, Disc3, Gem, Layers2, Ruler, Shell, Sun, type LucideIcon } from 'lucide-react'
import type { EscapementPartId } from '../../../types/escapement'
import { ESCAPEMENT_PART_INFO, ESCAPEMENT_PART_LIST } from '../../../lib/escapementInfo'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { PartInspectorView } from '../PartInspectorView'

const ICONS: Record<EscapementPartId, LucideIcon> = {
  balance: Disc3,
  hairspring: Shell,
  regulator: Ruler,
  roller: CircleDot,
  fork: Anchor,
  pallets: Gem,
  escapeWheel: Sun,
  banking: Diamond,
  plate: Layers2,
}

export function EscapementPartInspector() {
  const { settings, selectPart } = useEscapement()
  return (
    <PartInspectorView
      parts={ESCAPEMENT_PART_LIST}
      info={ESCAPEMENT_PART_INFO}
      icons={ICONS}
      selected={settings.selectedPart}
      hovered={settings.hoveredPart}
      onSelect={selectPart}
      emptyHint="Click any part — or a chip above — to see what it does. The two rubies on the fork are where the magic happens, kaypoh."
    />
  )
}
