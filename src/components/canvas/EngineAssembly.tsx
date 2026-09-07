import { Fragment } from 'react'
import { CYLINDERS } from '../../lib/engineConfig'
import { useEngine } from '../../hooks/useEngineSimulation'
import { EngineMaterialsProvider } from '../3d/materials'
import { EngineBlock } from '../3d/EngineBlock'
import { Crankshaft } from '../3d/Crankshaft'
import { Piston } from '../3d/Piston'
import { ConnectingRod } from '../3d/ConnectingRod'
import { CombustionLight, SparkEffect } from '../3d/SparkEffect'
import { FocusLabels } from '../3d/FocusLabels'
import { SimulationDriver } from './SimulationDriver'

const ALL_JOURNALS = [0, 1, 2, 3]

/**
 * The complete running engine: materials, per-frame driver, block, crank, pistons, rods, flashes.
 * Shared by the full simulation scene and the Workshop's live preview.
 */
export function EngineAssembly({ labels = true }: { labels?: boolean }) {
  const { settings } = useEngine()
  const { viewMode, focusCylinder } = settings
  const pistonMode = viewMode === 'piston'
  const focusIdx = focusCylinder - 1
  const journals = pistonMode ? [CYLINDERS[focusIdx].journal] : ALL_JOURNALS

  return (
    <EngineMaterialsProvider>
      <SimulationDriver />
      <EngineBlock />
      <Crankshaft journals={journals} />
      {CYLINDERS.map((c, i) =>
        !pistonMode || i === focusIdx ? (
          <Fragment key={c.number}>
            <Piston index={i} />
            <ConnectingRod index={i} />
            <SparkEffect index={i} />
          </Fragment>
        ) : null,
      )}
      <CombustionLight />
      {labels && pistonMode && <FocusLabels index={focusIdx} />}
    </EngineMaterialsProvider>
  )
}
