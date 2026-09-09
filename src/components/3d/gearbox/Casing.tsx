import { COUNTER_CENTRE, GB } from '../../../lib/gearboxConfig'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { useGearboxPartInteraction } from '../../../hooks/usePartInteraction'
import { useGearboxMaterials } from './materials'
import { bearingGeometry, bearingRaceGeometry, bellCapGeometry, bellShellGeometry, caseCapGeometry, caseEndWallGeometry, caseShellGeometry } from './geometries'

/** Ghosted or wireframe casing must never swallow clicks meant for the parts inside it. */
const passThrough = () => null

const BEARINGS: [number, number][] = [
  [GB.case.xStart + GB.case.wall / 2, 0],
  [GB.case.xEnd - GB.case.wall / 2, 0],
  [GB.case.xStart + GB.case.wall / 2, COUNTER_CENTRE.y],
  [GB.case.xEnd - GB.case.wall / 2, COUNTER_CENTRE.y],
]

/**
 * Main case, end walls and bell housing, all cut along the centre plane with the near half removed.
 * Orange cut faces appear only when the casing is solid.
 */
export function Casing() {
  const m = useGearboxMaterials()
  const { settings } = useGearbox()
  const { viewMode, casingMode } = settings
  const handlers = useGearboxPartInteraction('casing')

  const focusMode = viewMode === 'synchro'
  const show = !focusMode && (viewMode === 'xray' || casingMode !== 'hidden')
  const clickable = viewMode === 'cutaway' && casingMode === 'solid'
  const raycast = clickable ? undefined : passThrough

  return (
    <group visible={show} {...(show && clickable ? handlers : {})}>
      <mesh geometry={caseShellGeometry()} material={m.case} raycast={raycast} />
      <mesh geometry={caseEndWallGeometry()} material={m.case} raycast={raycast} position-x={GB.case.xStart} />
      <mesh geometry={caseEndWallGeometry()} material={m.case} raycast={raycast} position-x={GB.case.xEnd - GB.case.wall} />
      <mesh geometry={bellShellGeometry()} material={m.case} raycast={raycast} />
      {clickable && (
        <>
          <mesh geometry={caseCapGeometry()} material={m.section} raycast={raycast} />
          <mesh geometry={bellCapGeometry()} material={m.section} raycast={raycast} />
        </>
      )}
      {BEARINGS.map(([x, y]) => (
        <group key={`${x}-${y}`} position={[x, y, 0]}>
          <mesh geometry={bearingGeometry()} material={m.bearing} raycast={raycast} />
          <mesh geometry={bearingRaceGeometry()} material={m.rail} raycast={raycast} />
        </group>
      ))}
    </group>
  )
}
