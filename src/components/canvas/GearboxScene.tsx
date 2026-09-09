import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useGearbox } from '../../hooks/useGearboxSimulation'
import { Lighting } from './Lighting'
import { GearboxAssembly } from './GearboxAssembly'
import { GEARBOX_TARGET, GearboxCameraRig } from './GearboxCameraRig'

/** The case bottom sits at −1.85; keep the floor a little below it. */
export const GEARBOX_FLOOR_Y = -2.35

export function GearboxScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { settings } = useGearbox()

  return (
    <>
      <Lighting floorY={GEARBOX_FLOOR_Y} shadowScale={22} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.3}
        minDistance={1.4}
        maxDistance={28}
        maxPolarAngle={Math.PI * 0.54}
        target={GEARBOX_TARGET}
      />
      <GearboxCameraRig controlsRef={controlsRef} />
      <GearboxAssembly />
    </>
  )
}
