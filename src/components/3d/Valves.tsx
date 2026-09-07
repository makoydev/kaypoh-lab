import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GEOMETRY } from '../../lib/engineConfig'
import { valveLift } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import { valveHeadGeometry, valveStemGeometry } from './geometries'

const MAX_LIFT = 0.16

interface ValvesProps {
  /** Index of the cylinder (0-7) whose stroke drives these valves. */
  index: number
  /** Bank-local X of intake / exhaust valve. */
  intakeX: number
  exhaustX: number
  z: number
}

/** Intake + exhaust valve pair, drawn in bank-local space (Y up the bore). */
export function Valves({ index, intakeX, exhaustX, z }: ValvesProps) {
  const intakeRef = useRef<THREE.Group>(null)
  const exhaustRef = useRef<THREE.Group>(null)
  const { sim } = useEngine()
  const m = useEngineMaterials()
  const handlers = usePartInteraction('valves')
  const deck = GEOMETRY.deckDistance

  useFrame(() => {
    const st = sim.cylinders[index]
    if (!st) return
    if (intakeRef.current) intakeRef.current.position.y = deck + 0.02 - valveLift(st.stroke, st.strokeProgress, 'intake') * MAX_LIFT
    if (exhaustRef.current) exhaustRef.current.position.y = deck + 0.02 - valveLift(st.stroke, st.strokeProgress, 'exhaust') * MAX_LIFT
  })

  return (
    <group {...handlers}>
      <group ref={intakeRef} position={[intakeX, deck + 0.02, z]}>
        <mesh geometry={valveHeadGeometry()} material={m.valveIntake} />
        <mesh geometry={valveStemGeometry()} material={m.valveIntake} position-y={0.26} />
      </group>
      <group ref={exhaustRef} position={[exhaustX, deck + 0.02, z]}>
        <mesh geometry={valveHeadGeometry()} material={m.valveExhaust} />
        <mesh geometry={valveStemGeometry()} material={m.valveExhaust} position-y={0.26} />
      </group>
    </group>
  )
}
