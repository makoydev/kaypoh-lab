import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FreewheelGearId, SpeedGearId } from '../../../types/gearbox'
import { COUNTER_CENTRE, FREEWHEEL_GEARS, GB, GEARS, HUB_OF, IDLER_CENTRE, gearX } from '../../../lib/gearboxConfig'
import { gearAngles } from '../../../lib/gearboxModel'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { useGearboxPartInteraction } from '../../../hooks/usePartInteraction'
import { useGearboxMaterials, wheelMaterialKey } from './materials'
import { coneGeometry, counterShaftGeometry, dogRingGeometry, idlerStubGeometry, inputShaftGeometry, outputShaftGeometry, wheelGeometry } from './geometries'

const DEG = Math.PI / 180

/**
 * Dog-tooth collar and friction cone on the face of a wheel that faces its synchro hub. `side` is
 * where the wheel sits relative to the hub, so the pack goes the other way.
 */
function SynchroFace({ side }: { side: -1 | 1 }) {
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('synchro')
  const dogX = -side * (GB.faceWidth / 2 + GB.dog.length / 2)
  const coneX = -side * (GB.faceWidth / 2 + GB.dog.length + GB.cone.length / 2)
  return (
    <group {...handlers}>
      <mesh geometry={dogRingGeometry()} material={m.dog} position-x={dogX} />
      <mesh geometry={coneGeometry()} material={m.dog} position-x={coneX} rotation-y={side === -1 ? Math.PI : 0} />
    </group>
  )
}

interface VisibleProps {
  /** Which speed gears to draw; null = all. */
  visibleGears: Set<SpeedGearId> | null
}

/** Input shaft with its permanently meshed input gear and the 4th-gear dog teeth. Spins at input speed. */
export function InputShaft({ visibleGears }: VisibleProps) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('inputShaft')
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = sim.inputAngle * DEG
  })
  const showGear = !visibleGears || visibleGears.has('4')
  return (
    <group ref={ref}>
      {!visibleGears && (
        <group {...handlers}>
          <mesh geometry={inputShaftGeometry()} material={m.shaftIn} />
        </group>
      )}
      {showGear && (
        <group position-x={GEARS.input.x}>
          <group {...handlers}>
            <mesh geometry={wheelGeometry('input')} material={m.gearIn} />
          </group>
          <SynchroFace side={HUB_OF['4'].side} />
        </group>
      )}
    </group>
  )
}

/** Countershaft with every fixed gear on it. Spins opposite to the input. */
export function Countershaft({ visibleGears }: VisibleProps) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('countershaft')
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = gearAngles(sim.inputAngle).counter * DEG
  })
  const wheels = ['counterDrive', 'counter1', 'counter2', 'counter3', 'counter5', 'counterR'].filter((id) => {
    if (!visibleGears) return true
    if (id === 'counterDrive') return visibleGears.has('4')
    return visibleGears.has(id.slice(7) as SpeedGearId)
  })
  return (
    <group ref={ref} position={[0, COUNTER_CENTRE.y, COUNTER_CENTRE.z]} {...handlers}>
      <mesh geometry={counterShaftGeometry()} material={m.shaftCounter} />
      {wheels.map((id) => (
        <mesh key={id} geometry={wheelGeometry(id)} material={m[wheelMaterialKey(id)]} position-x={GEARS[id].x} />
      ))}
    </group>
  )
}

/** One freewheeling speed gear on the output shaft, with its dogs and cone facing its hub. */
function FreewheelGear({ gear }: { gear: FreewheelGearId }) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('speedGears')
  const id = `output${gear}`
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = gearAngles(sim.inputAngle).freewheel[gear] * DEG
  })
  return (
    <group ref={ref} position-x={gearX(gear)}>
      <group {...handlers}>
        <mesh geometry={wheelGeometry(id)} material={m[wheelMaterialKey(id)]} />
      </group>
      <SynchroFace side={HUB_OF[gear].side} />
    </group>
  )
}

export function FreewheelGears({ visibleGears }: VisibleProps) {
  return (
    <>
      {FREEWHEEL_GEARS.filter((g) => !visibleGears || visibleGears.has(g)).map((g) => (
        <FreewheelGear key={g} gear={g} />
      ))}
    </>
  )
}

/** Reverse idler on its stub shaft, off to +Z. Spins the same way as the input. */
export function ReverseIdler() {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('reverseIdler')
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = gearAngles(sim.inputAngle).idler * DEG
  })
  return (
    <group position={[gearX('R'), IDLER_CENTRE.y, IDLER_CENTRE.z]}>
      <mesh geometry={idlerStubGeometry()} material={m.rail} />
      <group ref={ref} {...handlers}>
        <mesh geometry={wheelGeometry('idler')} material={m.gearIdler} />
      </group>
    </group>
  )
}

/** The output shaft itself. Hubs and sleeves live in `Synchros`. */
export function OutputShaft() {
  const ref = useRef<THREE.Mesh>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('outputShaft')
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = sim.outputAngle * DEG
  })
  return <mesh ref={ref} geometry={outputShaftGeometry()} material={m.shaftOut} {...handlers} />
}
