import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { HubId } from '../../../types/gearbox'
import { GB, HUB_OF, HUB_ORDER, HUB_X } from '../../../lib/gearboxConfig'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { useGearboxPartInteraction } from '../../../hooks/usePartInteraction'
import { hubMaterialKey, sleeveMaterialKey, useGearboxMaterials } from './materials'
import { blockerRingGeometry, hubGeometry, sleeveGeometry } from './geometries'

const DEG = Math.PI / 180
const RING_X = GB.sleeve.width / 2 + GB.ring.width / 2 + 0.005

/** A synchro hub with its sleeve and the two blocker rings either side. Spins with the output shaft. */
function SynchroHub({ hub }: { hub: HubId }) {
  const ref = useRef<THREE.Group>(null)
  const sleeveRef = useRef<THREE.Mesh>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('synchro')
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = sim.outputAngle * DEG
    if (sleeveRef.current) sleeveRef.current.position.x = sim.sleeves[hub] * GB.synchroGap
  })
  return (
    <group ref={ref} position-x={HUB_X[hub]} {...handlers}>
      <mesh geometry={hubGeometry()} material={m[hubMaterialKey(hub)]} />
      <mesh ref={sleeveRef} geometry={sleeveGeometry()} material={m[sleeveMaterialKey(hub)]} />
      <mesh geometry={blockerRingGeometry()} material={m.ring} position-x={-RING_X} />
      <mesh geometry={blockerRingGeometry()} material={m.ring} position-x={RING_X} />
    </group>
  )
}

export function Synchros({ visibleHubs }: { visibleHubs: Set<HubId> | null }) {
  return (
    <>
      {HUB_ORDER.filter((h) => !visibleHubs || visibleHubs.has(h)).map((h) => (
        <SynchroHub key={h} hub={h} />
      ))}
    </>
  )
}

/** Ember glow around whichever blocker ring is being pressed onto its cone. Additive, click-transparent. */
export function RingGlow() {
  const ref = useRef<THREE.Mesh>(null)
  const { sim } = useGearbox()
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fb923c', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  )
  const geometry = useMemo(() => new THREE.TorusGeometry(GB.ring.outerRadius, 0.045, 10, 48).rotateY(Math.PI / 2), [])
  // R3F disposes the mesh on unmount, not the material or geometry it was handed.
  useEffect(
    () => () => {
      material.dispose()
      geometry.dispose()
    },
    [material, geometry],
  )
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const shift = sim.shift
    const contact = sim.ringContact
    if (!shift || shift.to === 'N' || contact < 0.01) {
      material.opacity = 0
      mesh.visible = false
      return
    }
    const { hub, side } = HUB_OF[shift.to]
    mesh.visible = true
    mesh.position.x = HUB_X[hub] + side * RING_X
    material.opacity = 0.55 * contact
    mesh.rotation.x = sim.outputAngle * DEG
  })
  return <mesh ref={ref} geometry={geometry} material={material} raycast={() => null} />
}
