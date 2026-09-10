import { useEscapement } from '../../hooks/useEscapementSimulation'
import { EscapementMaterialsProvider } from '../3d/escapement/materials'
import { Balance } from '../3d/escapement/Balance'
import { Hairspring } from '../3d/escapement/Hairspring'
import { PalletFork } from '../3d/escapement/PalletFork'
import { EscapeWheel } from '../3d/escapement/EscapeWheel'
import { Frame } from '../3d/escapement/Frame'
import { TickFlash } from '../3d/escapement/TickFlash'
import { PalletLabels } from '../3d/escapement/PalletLabels'
import { EscapementDriver } from './EscapementDriver'

/**
 * The complete running escapement: materials, per-frame driver, plate and bridges, balance with
 * roller and hairspring, pallet fork, escape wheel, tick flash. Shared by the simulation scene and
 * the Workshop preview.
 */
export function EscapementAssembly({ labels = true }: { labels?: boolean }) {
  const { settings } = useEscapement()
  const focus = settings.viewMode === 'pallet'
  return (
    <EscapementMaterialsProvider>
      <EscapementDriver />
      <Frame />
      <Balance />
      <Hairspring />
      <PalletFork />
      <EscapeWheel />
      <TickFlash />
      {labels && focus && <PalletLabels />}
    </EscapementMaterialsProvider>
  )
}
