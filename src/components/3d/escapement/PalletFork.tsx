import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ESC } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { useEscapementPartInteraction } from '../../../hooks/usePartInteraction'
import { palletMaterialKey, useEscapementMaterials } from './materials'
import { forkArborGeometry, forkGeometry, guardPinGeometry, palletStoneGeometry } from './geometries'

const DEG = Math.PI / 180

/** The lever with its guard pin and two ruby pallets, rocking about the fork arbor between the banking pins. */
export function PalletFork() {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEscapement()
  const m = useEscapementMaterials()
  const fork = useEscapementPartInteraction('fork')
  const pallets = useEscapementPartInteraction('pallets')

  useFrame(() => {
    if (ref.current) ref.current.rotation.y = sim.forkAngle * DEG
  })

  return (
    <group ref={ref}>
      <group {...fork}>
        <mesh geometry={forkGeometry()} material={m.fork} position-y={ESC.fork.y} />
        <mesh geometry={guardPinGeometry()} material={m.fork} position-y={ESC.fork.y} />
        <mesh geometry={forkArborGeometry()} material={m.forkArbor} position-y={ESC.fork.y} />
      </group>
      <group {...pallets}>
        {(['entry', 'exit'] as const).map((p) => (
          <mesh key={p} geometry={palletStoneGeometry(p)} material={m[palletMaterialKey(p)]} position-y={ESC.fork.y - 0.015} />
        ))}
      </group>
    </group>
  )
}
