import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BANKED_FORK_ANGLE, ESC } from '../../../lib/escapementConfig'
import { palletWorkingEdge, rot } from '../../../lib/escapementModel'
import { useEscapement } from '../../../hooks/useEscapementSimulation'

/** World position of each pallet's lock point, where a tooth lands. */
const LANDING = {
  entry: rot(BANKED_FORK_ANGLE.entry, palletWorkingEdge('entry', 2)[0]),
  exit: rot(BANKED_FORK_ANGLE.exit, palletWorkingEdge('exit', 2)[0]),
}

/** A brief additive ring at the landing point on every tick. Click-transparent. */
export function TickFlash() {
  const ref = useRef<THREE.Mesh>(null)
  const { sim } = useEscapement()
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
    [],
  )
  const geometry = useMemo(() => new THREE.RingGeometry(0.05, 0.11, 32).rotateX(-Math.PI / 2), [])
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
    const f = sim.tickFlash
    if (f < 0.02) {
      mesh.visible = false
      return
    }
    const p = LANDING[sim.lastLanding]
    mesh.visible = true
    mesh.position.set(p.x, ESC.escapeWheel.y + 0.09, p.z)
    const k = 1 + (1 - f) * 1.6
    mesh.scale.set(k, k, k)
    material.opacity = 0.9 * f
  })

  return <mesh ref={ref} geometry={geometry} material={material} raycast={() => null} />
}
