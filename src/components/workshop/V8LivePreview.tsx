import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { StudioEnvironment } from '../canvas/Lighting'
import { EngineAssembly } from '../canvas/EngineAssembly'

function Turntable() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.18
  })
  return (
    <group ref={ref} rotation-y={0.6}>
      <group position-y={0.15}>
        <EngineAssembly labels={false} />
      </group>
      <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={12} blur={2.4} far={4} resolution={256} />
    </group>
  )
}

/** The real, running engine rendered small and transparent for the Workshop sheet. */
export function V8LivePreview() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [7.2, 3.6, 8.4], fov: 32, near: 0.1, far: 60 }}
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
