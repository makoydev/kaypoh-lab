import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { StudioEnvironment } from '../canvas/Lighting'
import { GearboxAssembly } from '../canvas/GearboxAssembly'

function Turntable() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.14
  })
  return (
    <group ref={ref} rotation-y={-0.4}>
      <group position={[0, 0.5, 0]}>
        <GearboxAssembly labels={false} />
      </group>
      <ContactShadows position={[0, -1.9, 0]} opacity={0.5} scale={16} blur={2.4} far={5} resolution={256} />
    </group>
  )
}

/** The real, running gearbox rendered small and transparent for the Workshop sheet. */
export function GearboxLivePreview() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [-5.5, 4.0, 10.5], fov: 32, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment resolution={128} />
        <Turntable />
      </Suspense>
    </Canvas>
  )
}
