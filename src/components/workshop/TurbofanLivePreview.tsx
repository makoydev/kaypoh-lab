import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { StudioEnvironment } from '../canvas/Lighting'
import { TurbofanAssembly } from '../canvas/TurbofanAssembly'

function Turntable() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.1) * 0.14
  })
  return (
    <group ref={ref} rotation-y={-0.5}>
      <group position={[-0.6, 0.2, 0]}>
        <TurbofanAssembly labels={false} />
      </group>
      <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={18} blur={2.4} far={5} resolution={256} />
    </group>
  )
}

/** The real, running turbofan rendered small and transparent for the Workshop sheet. */
export function TurbofanLivePreview() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [-6.5, 4.2, 12.5], fov: 32, near: 0.1, far: 60 }}
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
