import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { BladeRow as BladeRowSpec } from '../../../lib/turbofanConfig'
import { useTurbofanPartInteraction } from '../../../hooks/usePartInteraction'
import { rowMaterialKey, useTurbofanMaterials } from './materials'
import { compressorBladeGeometry, fanBladeGeometry, turbineBladeGeometry, vaneGeometry } from './geometries'

const DEG = Math.PI / 180

function geometryFor(row: BladeRowSpec) {
  if (row.stage === 'fan') return row.kind === 'rotor' ? fanBladeGeometry() : vaneGeometry()
  if (row.stage === 'hpTurbine' || row.stage === 'lpTurbine') return turbineBladeGeometry()
  return compressorBladeGeometry()
}

/**
 * One ring of blades as a single instanced draw. The unit blade (span 0-1 along Y, chord along X) is
 * scaled to the row, staggered about its span axis, pushed out to the hub radius and rotated around
 * the engine axis. Rotors live inside a spool group that spins; stators are placed as-is.
 */
export function BladeRow({ row }: { row: BladeRowSpec }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const materials = useTurbofanMaterials()
  const handlers = useTurbofanPartInteraction(row.stage)
  const geometry = useMemo(() => geometryFor(row), [row])
  const material = materials[rowMaterialKey(row)]

  // Re-run whenever the underlying InstancedMesh could have been recreated (args changed), or the
  // matrices would be lost with it.
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const rx = new THREE.Matrix4()
    const t = new THREE.Matrix4()
    const ry = new THREE.Matrix4()
    const sc = new THREE.Matrix4()
    const span = row.tipRadius - row.hubRadius + 0.03
    // Rotors and stators lean opposite ways; the camber has to flip with them, so mirror in Z.
    const camberSign = row.stagger >= 0 ? -1 : 1
    for (let k = 0; k < row.count; k++) {
      rx.makeRotationX((k / row.count) * Math.PI * 2)
      t.makeTranslation(0, row.hubRadius - 0.03, 0)
      ry.makeRotationY(row.stagger * DEG)
      sc.makeScale(row.chord, span, camberSign * row.chord)
      m.copy(rx).multiply(t).multiply(ry).multiply(sc)
      mesh.setMatrixAt(k, m)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [row, geometry, material])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, row.count]}
      position-x={row.x}
      frustumCulled={false}
      {...handlers}
    />
  )
}
