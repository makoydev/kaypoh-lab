import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useTurbofan } from '../../hooks/useTurbofanSimulation'
import { Lighting } from './Lighting'
import { TurbofanAssembly } from './TurbofanAssembly'
import { TURBOFAN_TARGET, TurbofanCameraRig } from './TurbofanCameraRig'

/** The nacelle is 2.2 units in radius; keep the floor clear of it like an engine on a test stand. */
export const TURBOFAN_FLOOR_Y = -2.7

export function TurbofanScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { settings } = useTurbofan()

  return (
    <>
      <Lighting floorY={TURBOFAN_FLOOR_Y} shadowScale={26} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.35}
        minDistance={1.8}
        maxDistance={30}
        maxPolarAngle={Math.PI * 0.54}
        target={TURBOFAN_TARGET}
      />
      <TurbofanCameraRig controlsRef={controlsRef} />
      <TurbofanAssembly />
    </>
  )
}
