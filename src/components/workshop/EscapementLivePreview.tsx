import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { StudioEnvironment } from '../canvas/Lighting'
import { EscapementAssembly } from '../canvas/EscapementAssembly'

function Turntable() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.12
  })
  return (
    <group ref={ref} rotation-y={0.3}>
      <group position={[-0.3, 0.1, 0]}>
        <EscapementAssembly labels={false} sound={false} />
      </group>
      <ContactShadows position={[0, -0.3, 0]} opacity={0.5} scale={10} blur={2.4} far={3} resolution={256} />
    </group>
  )
}

/** The real, ticking escapement rendered small and transparent for the Workshop sheet. */
export function EscapementLivePreview() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [1.2, 5.2, 5.4], fov: 32, near: 0.05, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // Look, don't touch: the preview shares the module's store, so a stray hover or click here
      // would highlight parts and leave one selected for when the simulation opens.
      style={{ background: 'transparent', pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment resolution={128} />
        <Turntable />
      </Suspense>
    </Canvas>
  )
}
