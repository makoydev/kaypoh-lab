import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useEscapement } from '../../hooks/useEscapementSimulation'
import { EscapementScene } from './EscapementScene'
import { ESCAPEMENT_CAMERA_POSITION } from './EscapementCameraRig'

export function EscapementCanvas() {
  const { selectPart } = useEscapement()
  return (
    <div className="cad-backdrop absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: ESCAPEMENT_CAMERA_POSITION, fov: 40, near: 0.05, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onPointerMissed={() => selectPart(null)}
      >
        <Suspense fallback={null}>
          <EscapementScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
