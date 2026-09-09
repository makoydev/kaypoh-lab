import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { HubId } from '../../../types/gearbox'
import { GB, HUB_ORDER, HUB_X } from '../../../lib/gearboxConfig'
import { useGearbox } from '../../../hooks/useGearboxSimulation'
import { useGearboxPartInteraction } from '../../../hooks/usePartInteraction'
import { useGearboxMaterials } from './materials'
import { forkGeometry, railGeometry } from './geometries'

function Fork({ hub }: { hub: HubId }) {
  const ref = useRef<THREE.Group>(null)
  const { sim } = useGearbox()
  const m = useGearboxMaterials()
  useFrame(() => {
    if (ref.current) ref.current.position.x = HUB_X[hub] + sim.sleeves[hub] * GB.synchroGap
  })
  return (
    <group ref={ref}>
      <mesh geometry={forkGeometry()} material={m.fork} />
    </group>
  )
}

/** One rail with all three forks on it (the interlock is left to the imagination); each fork follows its sleeve. */
export function Forks({ visibleHubs }: { visibleHubs: Set<HubId> | null }) {
  const m = useGearboxMaterials()
  const handlers = useGearboxPartInteraction('shiftForks')
  return (
    <group {...handlers}>
      {!visibleHubs && <mesh geometry={railGeometry()} material={m.rail} position={[0, GB.forks.railY, GB.forks.railZ]} />}
      {HUB_ORDER.filter((h) => !visibleHubs || visibleHubs.has(h)).map((h) => (
        <Fork key={h} hub={h} />
      ))}
    </group>
  )
}
