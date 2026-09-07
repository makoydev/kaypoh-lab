import { useMemo } from 'react'
import type { StageId } from '../../types/turbofan'
import { STAGE_ORDER } from '../../lib/turbofanConfig'
import { useTurbofan } from '../../hooks/useTurbofanSimulation'
import { TurbofanMaterialsProvider } from '../3d/turbofan/materials'
import { Casings } from '../3d/turbofan/Casings'
import { ExhaustCone, HpSpool, LpSpool } from '../3d/turbofan/Spools'
import { CombustionGlow } from '../3d/turbofan/CombustionGlow'
import { FlowParticles } from '../3d/turbofan/FlowParticles'
import { StageLabels } from '../3d/turbofan/StageLabels'
import { TurbofanDriver } from './TurbofanDriver'

const ALL_STAGES = new Set<StageId>(STAGE_ORDER)

/**
 * The complete running turbofan: materials, per-frame driver, casings, both spools, flame and flow.
 * Shared by the full simulation scene and the Workshop's live preview.
 */
export function TurbofanAssembly({ flow = true, labels = true }: { flow?: boolean; labels?: boolean }) {
  const { settings } = useTurbofan()
  const { viewMode, focusStage } = settings
  const visibleStages = useMemo(() => (viewMode === 'stage' ? new Set<StageId>([focusStage]) : ALL_STAGES), [viewMode, focusStage])

  return (
    <TurbofanMaterialsProvider>
      <TurbofanDriver />
      <Casings visibleStages={visibleStages} />
      <LpSpool visibleStages={visibleStages} />
      <HpSpool visibleStages={visibleStages} />
      {visibleStages.has('nozzle') && <ExhaustCone />}
      {visibleStages.has('combustor') && <CombustionGlow />}
      {flow && <FlowParticles />}
      {labels && viewMode === 'stage' && <StageLabels stage={focusStage} />}
    </TurbofanMaterialsProvider>
  )
}
