import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGearbox } from '../../hooks/useGearboxSimulation'
import { GearboxScene } from './GearboxScene'
import { GEARBOX_CAMERA_POSITION } from './GearboxCameraRig'

export function GearboxCanvas() {
  const { selectPart } = useGearbox()
  return (
    <div className="cad-backdrop absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: GEARBOX_CAMERA_POSITION, fov: 40, near: 0.1, far: 90 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onPointerMissed={() => selectPart(null)}
      >
        <Suspense fallback={null}>
          <GearboxScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
