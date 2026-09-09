import { ArrowRightLeft, Box, CircleDot, Cog, Disc3, GitFork, MoveHorizontal, RotateCcw, Torus, type LucideIcon } from 'lucide-react'
import type { GearboxPartId } from '../../../types/gearbox'
import { GEARBOX_PART_INFO, GEARBOX_PART_LIST } from '../../../lib/gearboxInfo'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { PartInspectorView } from '../PartInspectorView'

const ICONS: Record<GearboxPartId, LucideIcon> = {
  clutch: Disc3,
  inputShaft: MoveHorizontal,
  countershaft: Cog,
  speedGears: CircleDot,
  synchro: Torus,
  reverseIdler: RotateCcw,
  shiftForks: GitFork,
  outputShaft: ArrowRightLeft,
  casing: Box,
}

export function GearboxPartInspector() {
  const { settings, selectPart } = useGearbox()
  return (
    <PartInspectorView
      parts={GEARBOX_PART_LIST}
      info={GEARBOX_PART_INFO}
      icons={ICONS}
      selected={settings.selectedPart}
      hovered={settings.hoveredPart}
      onSelect={selectPart}
      emptyHint="Click any part of the box — or a chip above — to see what it does. The synchro is the clever bit, kaypoh."
    />
  )
}
