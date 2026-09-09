import { useMemo } from 'react'
import type { HubId, SpeedGearId } from '../../types/gearbox'
import { HUB_META } from '../../lib/gearboxConfig'
import { useGearbox, useGearboxFocusHub } from '../../hooks/useGearboxSimulation'
import { GearboxMaterialsProvider } from '../3d/gearbox/materials'
import { Casing } from '../3d/gearbox/Casing'
import { Clutch } from '../3d/gearbox/Clutch'
import { Countershaft, FreewheelGears, InputShaft, OutputShaft, ReverseIdler } from '../3d/gearbox/Gears'
import { RingGlow, Synchros } from '../3d/gearbox/Synchros'
import { Forks } from '../3d/gearbox/Forks'
import { SynchroLabels } from '../3d/gearbox/SynchroLabels'
import { GearboxDriver } from './GearboxDriver'

/**
 * The complete running gearbox: materials, per-frame driver, casing, clutch, three shafts, every
 * gear, the synchro packs and the forks. Shared by the simulation scene and the Workshop preview.
 */
export function GearboxAssembly({ labels = true }: { labels?: boolean }) {
  const { settings } = useGearbox()
  const focusHub = useGearboxFocusHub(settings.viewMode === 'synchro')
  const visibleGears = useMemo(() => (focusHub ? new Set<SpeedGearId>(HUB_META[focusHub].gears) : null), [focusHub])
  const visibleHubs = useMemo(() => (focusHub ? new Set<HubId>([focusHub]) : null), [focusHub])

  return (
    <GearboxMaterialsProvider>
      <GearboxDriver />
      <Casing />
      {!focusHub && <Clutch />}
      <InputShaft visibleGears={visibleGears} />
      <Countershaft visibleGears={visibleGears} />
      <FreewheelGears visibleGears={visibleGears} />
      {(!visibleGears || visibleGears.has('R')) && <ReverseIdler />}
      <OutputShaft />
      <Synchros visibleHubs={visibleHubs} />
      <Forks visibleHubs={visibleHubs} />
      <RingGlow />
      {labels && focusHub && <SynchroLabels hub={focusHub} />}
    </GearboxMaterialsProvider>
  )
}
