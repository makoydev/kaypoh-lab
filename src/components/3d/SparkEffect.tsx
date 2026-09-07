import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CYLINDERS } from '../../lib/engineConfig'
import { chamberPosition } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { sparkCoreGeometry } from './geometries'

/** Additive glow blob at the top of a bore that flares when that cylinder fires. */
export function SparkEffect({ index }: { index: number }) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const { sim } = useEngine()
  const pos = useMemo(() => chamberPosition(CYLINDERS[index], 0.14), [index])

  const coreMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fff4c2',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#fb923c',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame(() => {
    const st = sim.cylinders[index]
    if (!group.current || !st) return
    const f = st.flash
    const visible = f > 0.01
    group.current.visible = visible
    if (!visible) return
    if (core.current) core.current.scale.setScalar(0.06 + f * 0.26)
    if (halo.current) halo.current.scale.setScalar(0.12 + f * 0.6)
    if (core.current) (core.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, f * 1.4)
    if (halo.current) (halo.current.material as THREE.MeshBasicMaterial).opacity = f * 0.55
  })

  return (
    <group ref={group} position={[pos.x, pos.y, pos.z]} visible={false}>
      <mesh ref={core} geometry={sparkCoreGeometry()} material={coreMat} />
      <mesh ref={halo} geometry={sparkCoreGeometry()} material={haloMat} />
    </group>
  )
}

/** A single point light that hops to whichever cylinder is burning brightest. */
export function CombustionLight() {
  const ref = useRef<THREE.PointLight>(null)
  const { sim } = useEngine()
  const chambers = useMemo(() => CYLINDERS.map((c) => chamberPosition(c, 0.25)), [])

  useFrame(() => {
    if (!ref.current) return
    let best = -1
    let bestFlash = 0
    for (let i = 0; i < sim.cylinders.length; i++) {
      const f = sim.cylinders[i].flash
      if (f > bestFlash) {
        bestFlash = f
        best = i
      }
    }
    if (best < 0) {
      ref.current.intensity = 0
      return
    }
    const p = chambers[best]
    ref.current.position.set(p.x, p.y, p.z)
    ref.current.intensity = bestFlash * 40
  })

  return <pointLight ref={ref} color="#fb923c" intensity={0} distance={7} decay={2} />
}
