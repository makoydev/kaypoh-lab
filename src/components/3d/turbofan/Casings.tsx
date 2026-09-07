import type { StageId } from '../../../types/turbofan'
import { BLADE_ROWS } from '../../../lib/turbofanConfig'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { useTurbofanPartInteraction } from '../../../hooks/usePartInteraction'
import { useTurbofanMaterials } from './materials'
import { BladeRow } from './BladeRow'
import {
  combustorCapGeometry,
  combustorLinerGeometry,
  coreCasingCapGeometry,
  coreCasingShellGeometry,
  innerCasingGeometry,
  intermediateCaseGeometry,
  nacelleCapGeometry,
  nacelleShellGeometry,
  nozzleCapGeometry,
  nozzleShellGeometry,
} from './geometries'

/** Ghosted or wireframe casing must never swallow clicks meant for the parts inside it. */
const passThrough = () => null

interface CasingsProps {
  visibleStages: Set<StageId>
}

/**
 * Everything that does not spin: nacelle, core casing, nozzle shell (all sectioned through 270°),
 * the combustor liner, the stator rows, and the small static frames between them.
 */
export function Casings({ visibleStages }: CasingsProps) {
  const m = useTurbofanMaterials()
  const { settings } = useTurbofan()
  const { viewMode, casingMode } = settings
  const nacelleHandlers = useTurbofanPartInteraction('nacelle')
  const nozzleHandlers = useTurbofanPartInteraction('nozzle')
  const combustorHandlers = useTurbofanPartInteraction('combustor')

  const stageMode = viewMode === 'stage'
  const showCasing = !stageMode && (viewMode === 'xray' || casingMode !== 'hidden')
  // Only a solid casing is clickable; ghost / wireframe lets clicks reach the machinery.
  const casingClickable = viewMode === 'cutaway' && casingMode === 'solid'
  const showSection = viewMode === 'cutaway' && casingMode === 'solid'
  const casingRaycast = casingClickable ? undefined : passThrough

  const stators = BLADE_ROWS.filter((r) => r.kind === 'stator' && visibleStages.has(r.stage))
  const all = visibleStages.size > 1

  return (
    <group>
      {/* Nacelle + core casing */}
      <group visible={showCasing} {...(showCasing && casingClickable ? nacelleHandlers : {})}>
        <mesh geometry={nacelleShellGeometry()} material={m.nacelle} raycast={casingRaycast} />
        <mesh geometry={coreCasingShellGeometry()} material={m.casing} raycast={casingRaycast} />
        {showSection && (
          <>
            <mesh geometry={nacelleCapGeometry()} material={m.section} raycast={casingRaycast} />
            <mesh geometry={coreCasingCapGeometry()} material={m.section} raycast={casingRaycast} />
          </>
        )}
      </group>

      {/* Nozzle shell follows the casing mode but is its own part */}
      {visibleStages.has('nozzle') && (
        <group visible={showCasing || stageMode} {...(casingClickable || stageMode ? nozzleHandlers : {})}>
          <mesh geometry={nozzleShellGeometry()} material={m.nozzle} raycast={casingClickable || stageMode ? undefined : passThrough} />
          {(showSection || stageMode) && <mesh geometry={nozzleCapGeometry()} material={m.section} raycast={casingClickable || stageMode ? undefined : passThrough} />}
        </group>
      )}

      {/* Combustor liner: always an internal, always clickable */}
      {visibleStages.has('combustor') && (
        <group {...combustorHandlers}>
          <mesh geometry={combustorLinerGeometry()} material={m.combustorLiner} />
          {viewMode === 'cutaway' && <mesh geometry={combustorCapGeometry()} material={m.section} />}
        </group>
      )}

      {/* Static frames */}
      {all && (
        <>
          <mesh geometry={innerCasingGeometry()} material={m.casing} raycast={passThrough} />
          <mesh geometry={intermediateCaseGeometry()} material={m.casing} raycast={passThrough} />
        </>
      )}

      {stators.map((r) => (
        <BladeRow key={`${r.stage}-${r.index}-s`} row={r} />
      ))}
    </group>
  )
}
