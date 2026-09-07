import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useEngine } from '../../hooks/useEngineSimulation'
import { Lighting } from './Lighting'
import { CameraRig, DEFAULT_TARGET, ENGINE_Y_OFFSET } from './CameraRig'
import { EngineAssembly } from './EngineAssembly'

export function EngineScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const { settings } = useEngine()

  return (
    <>
      <Lighting />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.45}
        minDistance={1.6}
        maxDistance={22}
        maxPolarAngle={Math.PI * 0.53}
        target={DEFAULT_TARGET}
      />
      <CameraRig controlsRef={controlsRef} />
      <group position-y={ENGINE_Y_OFFSET}>
        <EngineAssembly />
      </group>
    </>
  )
}
