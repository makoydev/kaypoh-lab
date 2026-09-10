import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ESC } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { useEscapementPartInteraction } from '../../../hooks/usePartInteraction'
import { useEscapementMaterials } from './materials'
import { balanceArmGeometry, balanceRimGeometry, impulsePinGeometry, rimWeightGeometry, rollerGeometry, staffGeometry } from './geometries'

const DEG = Math.PI / 180

/**
 * Balance wheel (rim, arms, staff, weights) and the safety roller with its impulse pin, all turning
 * together about the balance axis. The hairspring lives in its own component because only its inner
 * end moves with the balance.
 */
export function Balance() {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEscapement()
  const m = useEscapementMaterials()
  const balance = useEscapementPartInteraction('balance')
  const roller = useEscapementPartInteraction('roller')
  const { arms, weights, y, rimRadius } = ESC.balance

  useFrame(() => {
    if (ref.current) ref.current.rotation.y = sim.balanceAngle * DEG
  })

  return (
    <group ref={ref} position-x={ESC.balance.x}>
      <group {...balance}>
        <mesh geometry={balanceRimGeometry()} material={m.balanceRim} position-y={y} />
        {Array.from({ length: arms }, (_, i) => (
          <mesh key={i} geometry={balanceArmGeometry()} material={m.balanceArm} position-y={y} rotation-y={(360 / arms) * i * DEG} />
        ))}
        {Array.from({ length: weights }, (_, i) => (
          <mesh key={i} geometry={rimWeightGeometry()} material={m.screw} position-y={y} rotation-y={((360 / weights) * i + 30) * DEG} />
        ))}
        <mesh geometry={staffGeometry()} material={m.staff} />
      </group>
      <group {...roller}>
        <mesh geometry={rollerGeometry()} material={m.roller} position-y={ESC.roller.y} />
        <mesh
          geometry={impulsePinGeometry()}
          material={m.impulsePin}
          position={[-ESC.roller.pinRadius, ESC.roller.y - ESC.roller.thickness / 2 - ESC.roller.pinHeight / 2 + 0.005, 0]}
        />
      </group>
      {/* Balance rim radius is the scale reference for the scene; keep a hidden helper so the bounding box is honest. */}
      <object3D position={[rimRadius, 0, 0]} visible={false} />
    </group>
  )
}
