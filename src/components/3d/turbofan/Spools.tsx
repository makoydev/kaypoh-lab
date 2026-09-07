import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StageId } from '../../../types/turbofan'
import { BLADE_ROWS } from '../../../lib/turbofanConfig'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { useTurbofanPartInteraction } from '../../../hooks/usePartInteraction'
import { useTurbofanMaterials } from './materials'
import { BladeRow } from './BladeRow'
import { boosterDrumGeometry, exhaustConeGeometry, hpShaftGeometry, hpcDrumGeometry, hptDrumGeometry, lpShaftGeometry, lptDrumGeometry, spinnerGeometry } from './geometries'

const DEG = Math.PI / 180

interface SpoolProps {
  visibleStages: Set<StageId>
}

/** Fan, booster and LP turbine rotors on one shaft. Spins at N1. */
export function LpSpool({ visibleStages }: SpoolProps) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useTurbofan()
  const m = useTurbofanMaterials()
  const fanHandlers = useTurbofanPartInteraction('fan')
  const boosterHandlers = useTurbofanPartInteraction('booster')
  const lptHandlers = useTurbofanPartInteraction('lpTurbine')

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = sim.lpAngle * DEG
  })

  const rotors = BLADE_ROWS.filter((r) => r.kind === 'rotor' && r.spool === 'lp' && visibleStages.has(r.stage))
  const showFan = visibleStages.has('fan')
  const showBooster = visibleStages.has('booster')
  const showLpt = visibleStages.has('lpTurbine')
  const all = visibleStages.size > 1

  return (
    <group ref={ref}>
      {showFan && (
        <group {...fanHandlers}>
          <mesh geometry={spinnerGeometry()} material={m.spinner} />
        </group>
      )}
      {(showFan || showBooster) && (
        <group {...boosterHandlers}>
          <mesh geometry={boosterDrumGeometry()} material={m.drum} />
        </group>
      )}
      {showLpt && (
        <group {...lptHandlers}>
          <mesh geometry={lptDrumGeometry()} material={m.drum} />
        </group>
      )}
      {all && <mesh geometry={lpShaftGeometry()} material={m.shaft} />}
      {rotors.map((r) => (
        <BladeRow key={`${r.stage}-${r.index}`} row={r} />
      ))}
    </group>
  )
}

/** HP compressor and HP turbine on the short, fast shaft. Spins at N2. */
export function HpSpool({ visibleStages }: SpoolProps) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useTurbofan()
  const m = useTurbofanMaterials()
  const hpcHandlers = useTurbofanPartInteraction('hpCompressor')
  const hptHandlers = useTurbofanPartInteraction('hpTurbine')

  useFrame(() => {
    if (ref.current) ref.current.rotation.x = sim.hpAngle * DEG
  })

  const rotors = BLADE_ROWS.filter((r) => r.kind === 'rotor' && r.spool === 'hp' && visibleStages.has(r.stage))
  const all = visibleStages.size > 1

  return (
    <group ref={ref}>
      {visibleStages.has('hpCompressor') && (
        <group {...hpcHandlers}>
          <mesh geometry={hpcDrumGeometry()} material={m.drum} />
        </group>
      )}
      {visibleStages.has('hpTurbine') && (
        <group {...hptHandlers}>
          <mesh geometry={hptDrumGeometry()} material={m.drum} />
        </group>
      )}
      {all && <mesh geometry={hpShaftGeometry()} material={m.shaft} />}
      {rotors.map((r) => (
        <BladeRow key={`${r.stage}-${r.index}`} row={r} />
      ))}
    </group>
  )
}

/** Static exhaust cone behind the LP turbine; belongs to the nozzle part. */
export function ExhaustCone() {
  const m = useTurbofanMaterials()
  const handlers = useTurbofanPartInteraction('nozzle')
  return (
    <group {...handlers}>
      <mesh geometry={exhaustConeGeometry()} material={m.exhaustCone} />
    </group>
  )
}

