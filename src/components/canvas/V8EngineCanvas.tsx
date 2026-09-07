import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useEngine } from '../../hooks/useEngineSimulation'
import { EngineScene } from './EngineScene'
import { DEFAULT_CAMERA_POSITION } from './CameraRig'

export function V8EngineCanvas() {
  const { selectPart } = useEngine()
  return (
    <div className="cad-backdrop absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: DEFAULT_CAMERA_POSITION, fov: 40, near: 0.1, far: 90 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onPointerMissed={() => selectPart(null)}
      >
        <Suspense fallback={null}>
          <EngineScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
