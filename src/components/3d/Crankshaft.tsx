import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GEOMETRY, PIN_OFFSETS_DEG, journalZ } from '../../lib/engineConfig'
import { DEG2RAD } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { usePartInteraction } from '../../hooks/usePartInteraction'
import { useEngineMaterials } from './materials'
import {
  boltGeometry,
  counterweightGeometry,
  crankArmGeometry,
  crankPinGeometry,
  damperGeometry,
  damperGrooveGeometry,
  flywheelGeometry,
  flywheelRingGeometry,
  mainJournalGeometry,
} from './geometries'

interface CrankshaftProps {
  /** Which throws (0-3) to draw. Piston-focus mode isolates a single one. */
  journals: number[]
}

const { crankRadius: r, webOffset, crankNoseZ } = GEOMETRY
const HALF_THROW = webOffset + GEOMETRY.webThickness / 2 // 0.35

/** A single crank throw: pin + two webs (arm + counterweight). Built at crank angle 0. */
function Throw({ journal }: { journal: number }) {
  const m = useEngineMaterials()
  const p = PIN_OFFSETS_DEG[journal] * DEG2RAD
  const z = journalZ(journal)
  const pinPos: [number, number, number] = [-r * Math.sin(p), r * Math.cos(p), z]

  return (
    <group>
      <mesh geometry={crankPinGeometry()} material={m.crank} position={pinPos} />
      {[-webOffset, webOffset].map((dz) => (
        <group key={dz} position={[0, 0, z + dz]} rotation-z={p}>
          <mesh geometry={crankArmGeometry()} material={m.crank} />
          <mesh geometry={counterweightGeometry()} material={m.crank} />
        </group>
      ))}
    </group>
  )
}

function Segment({ from, to }: { from: number; to: number }) {
  const m = useEngineMaterials()
  const len = to - from
  return <mesh geometry={mainJournalGeometry()} material={m.crank} position-z={from + len / 2} scale-z={len} />
}

export function Crankshaft({ journals }: CrankshaftProps) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useEngine()
  const m = useEngineMaterials()
  const crankHandlers = usePartInteraction('crankshaft')
  const flywheelHandlers = usePartInteraction('flywheel')
  const full = journals.length === 4

  useFrame(() => {
    if (ref.current) ref.current.rotation.z = sim.angle * DEG2RAD
  })

  const segments = useMemo(() => {
    if (full) {
      const s: [number, number][] = [[-crankNoseZ, journalZ(0) - HALF_THROW]]
      for (let j = 0; j < 3; j++) s.push([journalZ(j) + HALF_THROW, journalZ(j + 1) - HALF_THROW])
      s.push([journalZ(3) + HALF_THROW, crankNoseZ])
      return s
    }
    return journals.map((j): [number, number] => [journalZ(j) - HALF_THROW - 0.3, journalZ(j) + HALF_THROW + 0.3])
  }, [full, journals])

  const boltAngles = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), [])

  return (
    <group ref={ref}>
      <group {...crankHandlers}>
        {journals.map((j) => (
          <Throw key={j} journal={j} />
        ))}
        {segments.map(([from, to]) => (
          <Segment key={`${from}-${to}`} from={from} to={to} />
        ))}
        {/* Piston-focus mode: draw the ends of the isolated stub as main journals too */}
        {!full &&
          journals.map((j) => (
            <group key={`caps-${j}`}>
              <Segment from={journalZ(j) - HALF_THROW - 0.3} to={journalZ(j) - HALF_THROW} />
              <Segment from={journalZ(j) + HALF_THROW} to={journalZ(j) + HALF_THROW + 0.3} />
            </group>
          ))}
        {full && (
          <group position-z={-crankNoseZ - 0.09}>
            <mesh geometry={damperGeometry()} material={m.crank} />
            {[-0.05, 0.03].map((dz) => (
              <mesh key={dz} geometry={damperGrooveGeometry()} material={m.ring} position-z={dz} />
            ))}
          </group>
        )}
      </group>
      {full && (
        <group position-z={crankNoseZ + 0.09} {...flywheelHandlers}>
          <mesh geometry={flywheelGeometry()} material={m.flywheel} />
          <mesh geometry={flywheelRingGeometry()} material={m.ring} />
          {boltAngles.map((a) => (
            <mesh key={a} geometry={boltGeometry()} material={m.bolt} position={[Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.1]} />
          ))}
        </group>
      )}
    </group>
  )
}
