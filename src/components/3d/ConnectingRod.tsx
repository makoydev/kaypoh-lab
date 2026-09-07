import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GEOMETRY } from '../../lib/engineConfig'
import { useEngine } from '../../hooks/useEngineSimulation'
import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import { rodBeamFlangeGeometry, rodBeamWebGeometry, rodBigEndGeometry, rodSmallEndGeometry } from './geometries'

/** Connecting rod. Origin at the crank pin; rotates about Z so +Y points at the wrist pin. */
export function ConnectingRod({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEngine()
  const m = useEngineMaterials()
  const handlers = usePartInteraction('connectingRod')
  const l = GEOMETRY.rodLength
  const beamLength = l - 0.28

  useFrame(() => {
    const st = sim.cylinders[index]
    if (!ref.current || !st) return
    ref.current.position.set(st.pin.x, st.pin.y, st.pin.z)
    ref.current.rotation.z = st.rodAngle
  })

  return (
    <group ref={ref} {...handlers}>
      <mesh geometry={rodBigEndGeometry()} material={m.rod} />
      <mesh geometry={rodBeamFlangeGeometry()} material={m.rod} position={[0, l / 2, 0.038]} scale={[1, beamLength, 1]} />
      <mesh geometry={rodBeamFlangeGeometry()} material={m.rod} position={[0, l / 2, -0.038]} scale={[1, beamLength, 1]} />
      <mesh geometry={rodBeamWebGeometry()} material={m.rod} position={[0, l / 2, 0]} scale={[1, beamLength, 1]} />
      <mesh geometry={rodSmallEndGeometry()} material={m.rod} position-y={l} />
    </group>
  )
}
