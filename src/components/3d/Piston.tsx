import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CYLINDERS, GEOMETRY, bankAngleDeg } from '../../lib/engineConfig'
import { DEG2RAD } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import { pistonGeometry, pistonRingGeometry, wristPinGeometry } from './geometries'

const RING_HEIGHTS = [0.24, 0.33, 0.4]

/** One piston. Its group origin is the wrist pin; +Y points up the bore. */
export function Piston({ index }: { index: number }) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEngine()
  const m = useEngineMaterials()
  const handlers = usePartInteraction('piston')
  const spec = CYLINDERS[index]
  const beta = bankAngleDeg(spec.bank) * DEG2RAD

  useFrame(() => {
    const st = sim.cylinders[index]
    if (!ref.current || !st) return
    ref.current.position.set(st.piston.x, st.piston.y, st.piston.z)
  })

  return (
    <group ref={ref} rotation-z={beta} {...handlers}>
      <mesh geometry={pistonGeometry()} material={m.piston} position-y={GEOMETRY.pistonCentreOffset} />
      {RING_HEIGHTS.map((y) => (
        <mesh key={y} geometry={pistonRingGeometry()} material={m.ring} position-y={y} rotation-x={Math.PI / 2} />
      ))}
      <mesh geometry={wristPinGeometry()} material={m.ring} />
    </group>
  )
}
