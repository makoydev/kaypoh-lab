import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useEscapement } from '../../hooks/useEscapementSimulation'
import { Lighting } from './Lighting'
import { EscapementAssembly } from './EscapementAssembly'
import { ESCAPEMENT_TARGET, EscapementCameraRig } from './EscapementCameraRig'

/** The plate's underside sits at −0.32; keep the bench a little below it. */
export const ESCAPEMENT_FLOOR_Y = -0.6

export function EscapementScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { settings } = useEscapement()

  return (
    <>
      <Lighting floorY={ESCAPEMENT_FLOOR_Y} shadowScale={14} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.25}
        minDistance={1.0}
        maxDistance={22}
        maxPolarAngle={Math.PI * 0.52}
        target={ESCAPEMENT_TARGET}
      />
      <EscapementCameraRig controlsRef={controlsRef} />
      <EscapementAssembly />
    </>
  )
}
