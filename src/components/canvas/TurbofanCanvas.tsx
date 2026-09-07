import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useTurbofan } from '../../hooks/useTurbofanSimulation'
import { TurbofanScene } from './TurbofanScene'
import { TURBOFAN_CAMERA_POSITION } from './TurbofanCameraRig'

export function TurbofanCanvas() {
  const { selectPart } = useTurbofan()
  return (
    <div className="cad-backdrop absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: TURBOFAN_CAMERA_POSITION, fov: 40, near: 0.1, far: 90 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onPointerMissed={() => selectPart(null)}
      >
        <Suspense fallback={null}>
          <TurbofanScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
