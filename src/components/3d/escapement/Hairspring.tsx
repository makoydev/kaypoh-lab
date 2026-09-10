import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ESC, curbPinShift } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { useEscapementPartInteraction } from '../../../hooks/usePartInteraction'
import { useEscapementMaterials } from './materials'
import { colletGeometry, createHairspringGeometry, hairspringRadius, regulatorGeometry, studGeometry, updateHairspring } from './geometries'

const DEG = Math.PI / 180
/** The curb pins pinch the outer coil this many degrees before the stud at a neutral regulator setting. */
const CURB_BASE = 48

/**
 * The hairspring ribbon (rewritten every frame as the balance winds and unwinds it), its collet on the
 * staff, the fixed stud, and the regulator whose curb pins slide along the outer coil.
 */
export function Hairspring() {
  const { sim, settings } = useEscapement()
  const m = useEscapementMaterials()
  const spring = useEscapementPartInteraction('hairspring')
  const regulator = useEscapementPartInteraction('regulator')
  const colletRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => createHairspringGeometry(), [])

  useEffect(() => {
    updateHairspring(geometry, 0)
    geometry.computeBoundingSphere()
    return () => geometry.dispose()
  }, [geometry])

  useFrame(() => {
    updateHairspring(geometry, sim.balanceAngle)
    if (colletRef.current) colletRef.current.rotation.y = sim.balanceAngle * DEG
  })

  const { y, studAngle, outerRadius, turns } = ESC.hairspring
  const studPos = useMemo(() => {
    const a = studAngle * DEG
    return [Math.cos(a) * (outerRadius + 0.04), y, -Math.sin(a) * (outerRadius + 0.04)] as [number, number, number]
  }, [studAngle, outerRadius, y])

  // Regulator arm angle: along the outer coil, CURB_BASE before the stud, shifted by the setting.
  const curbAngle = studAngle - CURB_BASE - curbPinShift(settings.regulator)
  const curbT = 1 - (CURB_BASE + curbPinShift(settings.regulator)) / (turns * 360)
  const curbRadius = hairspringRadius(curbT)

  return (
    <group position={[ESC.balance.x, 0, 0]}>
      <group {...spring}>
        <mesh geometry={geometry} material={m.hairspring} position-y={y} frustumCulled={false} />
        <mesh ref={colletRef} geometry={colletGeometry()} material={m.collet} position-y={y} />
        <mesh geometry={studGeometry()} material={m.stud} position={studPos} />
      </group>
      <group {...regulator} rotation-y={curbAngle * DEG} position-y={y}>
        <mesh geometry={regulatorGeometry()} material={m.regulator} scale={[curbRadius / outerRadius, 1, 1]} />
      </group>
    </group>
  )
}
