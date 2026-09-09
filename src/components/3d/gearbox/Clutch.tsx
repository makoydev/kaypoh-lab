import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GB } from '../../../lib/gearboxConfig'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { useGearboxPartInteraction } from '../../../hooks/usePartInteraction'
import { useGearboxMaterials } from './materials'
import { clutchDiscGeometry, crankStubGeometry, flywheelGeometry, flywheelRingGeometry, pressurePlateGeometry } from './geometries'

const DEG = Math.PI / 180
const { x, flywheelWidth, discWidth, plateWidth, travel } = GB.clutch

/**
 * Flywheel and pressure plate turn with the engine; the disc turns with the input shaft. When the
 * pedal goes down the disc and plate back away from the flywheel by `travel`, and the engine side is
 * free to spin at a different speed from the box.
 */
export function Clutch() {
  const engineRef = useRef<THREE.Group>(null)
  const plateRef = useRef<THREE.Mesh>(null)
  const discRef = useRef<THREE.Mesh>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('clutch')

  useFrame(() => {
    const gap = travel * (1 - sim.clutch)
    if (engineRef.current) engineRef.current.rotation.x = sim.engineAngle * DEG
    if (plateRef.current) plateRef.current.position.x = x + discWidth + plateWidth / 2 + gap * 2.2
    if (discRef.current) {
      discRef.current.position.x = x + discWidth / 2 + gap
      discRef.current.rotation.x = sim.inputAngle * DEG
    }
  })

  return (
    <group {...handlers}>
      <group ref={engineRef}>
        <mesh geometry={crankStubGeometry()} material={m.flywheel} />
        <mesh geometry={flywheelGeometry()} material={m.flywheel} position-x={x - flywheelWidth / 2} />
        <mesh geometry={flywheelRingGeometry()} material={m.pressurePlate} position-x={x - flywheelWidth / 2} />
        <mesh ref={plateRef} geometry={pressurePlateGeometry()} material={m.pressurePlate} />
      </group>
      <mesh ref={discRef} geometry={clutchDiscGeometry()} material={m.clutchDisc} />
    </group>
  )
}
