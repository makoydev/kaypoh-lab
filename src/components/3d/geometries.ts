import * as THREE from 'three'
import { GEOMETRY } from '../../lib/engineConfig'

/**
 * Geometry is expensive to build and cheap to share. Everything that appears eight (or sixteen)
 * times lives here as a singleton so the scene stays at a handful of unique buffers.
 */
function once<T>(factory: () => T) {
  let value: T | undefined
  return () => (value ??= factory())
}

const { pistonRadius, pistonHeight, boreRadius, deckDistance, boreBottom, pinRadius, pinLength, mainJournalRadius, crankRadius, webThickness, counterweightRadius } = GEOMETRY

export const pistonGeometry = once(() => new THREE.CylinderGeometry(pistonRadius, pistonRadius * 0.985, pistonHeight, 40, 1))
export const pistonRingGeometry = once(() => new THREE.TorusGeometry(pistonRadius + 0.004, 0.014, 8, 48))
export const wristPinGeometry = once(() => {
  const g = new THREE.CylinderGeometry(0.075, 0.075, 0.46, 20)
  g.rotateX(Math.PI / 2)
  return g
})

export const boreLinerGeometry = once(() => new THREE.CylinderGeometry(boreRadius + 0.02, boreRadius + 0.02, deckDistance - boreBottom, 40, 1, true))
export const boreRimGeometry = once(() => new THREE.TorusGeometry(boreRadius + 0.02, 0.012, 6, 48))

export const rodBigEndGeometry = once(() => {
  const g = new THREE.CylinderGeometry(pinRadius + 0.085, pinRadius + 0.085, 0.12, 28)
  g.rotateX(Math.PI / 2)
  return g
})
export const rodSmallEndGeometry = once(() => {
  const g = new THREE.CylinderGeometry(0.135, 0.135, 0.12, 24)
  g.rotateX(Math.PI / 2)
  return g
})
export const rodBeamFlangeGeometry = once(() => new THREE.BoxGeometry(0.15, 1, 0.055))
export const rodBeamWebGeometry = once(() => new THREE.BoxGeometry(0.06, 1, 0.1))

export const crankPinGeometry = once(() => {
  const g = new THREE.CylinderGeometry(pinRadius, pinRadius, pinLength, 28)
  g.rotateX(Math.PI / 2)
  return g
})
export const mainJournalGeometry = once(() => {
  const g = new THREE.CylinderGeometry(mainJournalRadius, mainJournalRadius, 1, 28)
  g.rotateX(Math.PI / 2)
  return g
})

/** Crank web: a rounded arm from the axis to the pin. Built in the XY plane, thickness along Z. */
export const crankArmGeometry = once(() => {
  const w = 0.42
  const len = crankRadius + 0.2
  const shape = new THREE.Shape()
  const r = w / 2
  shape.moveTo(-r, -0.2)
  shape.lineTo(-r, len - r - 0.2)
  shape.absarc(0, len - r - 0.2, r, Math.PI, 0, true)
  shape.lineTo(r, -0.2)
  shape.absarc(0, -0.2, r, 0, Math.PI, true)
  const g = new THREE.ExtrudeGeometry(shape, { depth: webThickness, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 16 })
  g.translate(0, 0, -webThickness / 2)
  return g
})

/** Counterweight: a fat sector opposite the pin. */
export const counterweightGeometry = once(() => {
  const shape = new THREE.Shape()
  const start = (-90 - 68) * (Math.PI / 180)
  const end = (-90 + 68) * (Math.PI / 180)
  shape.moveTo(0, 0)
  shape.absarc(0, 0, counterweightRadius, start, end, false)
  shape.lineTo(0, 0)
  const g = new THREE.ExtrudeGeometry(shape, { depth: webThickness, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 })
  g.translate(0, 0, -webThickness / 2)
  return g
})

export const flywheelGeometry = once(() => {
  const g = new THREE.CylinderGeometry(0.95, 0.95, 0.16, 64)
  g.rotateX(Math.PI / 2)
  return g
})
export const flywheelRingGeometry = once(() => new THREE.TorusGeometry(0.93, 0.045, 8, 96))
export const damperGeometry = once(() => {
  const g = new THREE.CylinderGeometry(0.44, 0.44, 0.18, 40)
  g.rotateX(Math.PI / 2)
  return g
})
export const damperGrooveGeometry = once(() => new THREE.TorusGeometry(0.44, 0.02, 6, 48))
export const boltGeometry = once(() => {
  const g = new THREE.CylinderGeometry(0.05, 0.05, 0.06, 6)
  g.rotateX(Math.PI / 2)
  return g
})

export const plugThreadGeometry = once(() => new THREE.CylinderGeometry(0.075, 0.075, 0.34, 16))
export const plugHexGeometry = once(() => new THREE.CylinderGeometry(0.115, 0.115, 0.12, 6))
export const plugCeramicGeometry = once(() => new THREE.CylinderGeometry(0.058, 0.07, 0.32, 16))
export const plugTerminalGeometry = once(() => new THREE.CylinderGeometry(0.045, 0.045, 0.07, 12))
export const plugElectrodeGeometry = once(() => new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8))

export const valveHeadGeometry = once(() => new THREE.CylinderGeometry(0.135, 0.11, 0.035, 24))
export const valveStemGeometry = once(() => new THREE.CylinderGeometry(0.022, 0.022, 0.5, 10))

export const sparkCoreGeometry = once(() => new THREE.SphereGeometry(1, 16, 12))
