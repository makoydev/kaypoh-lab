import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ESC } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { useEscapementPartInteraction } from '../../../hooks/usePartInteraction'
import { useEscapementMaterials } from './materials'
import { escapeArborGeometry, escapeWheelCrossingGeometry, escapeWheelGeometry } from './geometries'

const DEG = Math.PI / 180

/** Fifteen club teeth on a light crossing, indexed half a pitch per beat. */
export function EscapeWheel() {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEscapement()
  const m = useEscapementMaterials()
  const handlers = useEscapementPartInteraction('escapeWheel')

  useFrame(() => {
    if (ref.current) ref.current.rotation.y = sim.escapeAngle * DEG
  })

  return (
    <group ref={ref} position={[ESC.escapeWheel.x, ESC.escapeWheel.y, 0]} {...handlers}>
      <mesh geometry={escapeWheelGeometry()} material={m.escapeWheel} />
      <mesh geometry={escapeWheelCrossingGeometry()} material={m.escapeWheel} />
      <mesh geometry={escapeArborGeometry()} material={m.escapeArbor} position-y={0.1} />
    </group>
  )
}
