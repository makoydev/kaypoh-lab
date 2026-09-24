import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GB, GEARS } from '../../../lib/gearboxConfig'
import { gearGeometry } from './gearGeometry'

function once<T>(factory: () => T) {
  let value: T | undefined
  return () => (value ??= factory())
}

/** Profile point: axial position, radius. */
type P = [number, number]

/** Revolve a profile about +X. `phiStart`/`phiLength` in lathe terms: [π/2, π] keeps the z ≤ 0 half. */
function revolve(profile: P[], segments = 48, phiStart = 0, phiLength = Math.PI * 2) {
  const pts = profile.map(([x, r]) => new THREE.Vector2(Math.max(0, r), x))
  const g = new THREE.LatheGeometry(pts, segments, phiStart, phiLength)
  g.rotateZ(-Math.PI / 2)
  return g
}

function tube(x0: number, x1: number, r: number, segments = 32) {
  const g = new THREE.CylinderGeometry(r, r, x1 - x0, segments, 1, false)
  g.rotateZ(-Math.PI / 2)
  g.translate((x0 + x1) / 2, 0, 0)
  return g
}

/** Solid of revolution between two radii along +X, centred at the origin. */
function ring(width: number, innerRadius: number, outerRadius: number, segments = 48) {
  return revolve(
    [
      [-width / 2, innerRadius],
      [-width / 2, outerRadius],
      [width / 2, outerRadius],
      [width / 2, innerRadius],
      [-width / 2, innerRadius],
    ],
    segments,
  )
}

/* ---------------------------------- Gears ---------------------------------- */

const gearCache = new Map<string, THREE.BufferGeometry>()

/** Extruded tooth profile for a wheel in the mesh table, built once per wheel. */
export function wheelGeometry(id: string) {
  let g = gearCache.get(id)
  if (!g) {
    const spec = GEARS[id]
    g = gearGeometry({ teeth: spec.teeth, radius: spec.radius, module: spec.module, bore: spec.bore, width: GB.faceWidth, backlash: GB.backlash })
    gearCache.set(id, g)
  }
  return g
}

/* ---------------------------------- Shafts ---------------------------------- */

export const inputShaftGeometry = once(() => tube(GB.shafts.input.xStart, GB.shafts.input.xEnd, GB.shafts.input.radius))
export const outputShaftGeometry = once(() => tube(GB.shafts.output.xStart, GB.shafts.output.xEnd, GB.shafts.output.radius))
export const counterShaftGeometry = once(() => tube(GB.shafts.counter.xStart, GB.shafts.counter.xEnd, GB.shafts.counter.radius))
export const idlerStubGeometry = once(() => tube(-GB.idlerStubLength / 2, GB.idlerStubLength / 2, 0.09, 20))
/** Crank stub poking out of the engine into the bell housing. */
export const crankStubGeometry = once(() => tube(GB.bell.xStart - 0.05, GB.clutch.x - GB.clutch.flywheelWidth, 0.22, 24))

/* ---------------------------------- Synchro pack ---------------------------------- */

export const hubGeometry = once(() => {
  const { width: w, radius: ro, innerRadius: ri } = GB.hub
  // Splined outer surface suggested by a shallow step.
  return revolve(
    [
      [-w / 2, ri],
      [-w / 2, ro - 0.02],
      [-w / 2 + 0.03, ro],
      [w / 2 - 0.03, ro],
      [w / 2, ro - 0.02],
      [w / 2, ri],
      [-w / 2, ri],
    ],
    48,
  )
})

export const sleeveGeometry = once(() => {
  const { width: w, innerRadius: ri, outerRadius: ro, grooveWidth: gw, grooveDepth: gd } = GB.sleeve
  return revolve(
    [
      [-w / 2, ri],
      [-w / 2 + 0.015, ro - 0.015],
      [-w / 2 + 0.03, ro],
      [-gw / 2, ro],
      [-gw / 2, ro - gd],
      [gw / 2, ro - gd],
      [gw / 2, ro],
      [w / 2 - 0.03, ro],
      [w / 2 - 0.015, ro - 0.015],
      [w / 2, ri],
      [-w / 2, ri],
    ],
    64,
  )
})

/** Brass blocker ring: a short cone-lined ring with a few blocking teeth on its outside. */
export const blockerRingGeometry = once(() => {
  const { width: w, outerRadius: ro, innerRadius: ri } = GB.ring
  const body = revolve(
    [
      [-w / 2, ri + 0.012],
      [-w / 2, ro],
      [w / 2, ro],
      [w / 2, ri],
      [-w / 2, ri + 0.012],
    ],
    48,
  )
  const teeth: THREE.BufferGeometry[] = [body]
  const box = new THREE.BoxGeometry(w * 0.6, 0.02, 0.04)
  for (let k = 0; k < GB.dog.count; k++) {
    const b = box.clone()
    b.translate(0, ro + 0.01, 0)
    b.rotateX((k / GB.dog.count) * Math.PI * 2)
    teeth.push(b)
  }
  const merged = mergeGeometries(teeth)!
  teeth.forEach((t) => t.dispose())
  return merged
})

/** Friction cone on the gear side, tapering toward the ring. Built pointing −X (narrow end at −X). */
export const coneGeometry = once(() => {
  const { length, radius } = GB.cone
  const g = new THREE.CylinderGeometry(radius - 0.03, radius, length, 40, 1, false)
  g.rotateZ(-Math.PI / 2)
  return g
})

/** Dog-tooth ring plus its collar, one merged geometry. Centred on the origin along X. */
export const dogRingGeometry = once(() => {
  const { count, innerRadius, outerRadius, length } = GB.dog
  const parts: THREE.BufferGeometry[] = [ring(length, GB.shafts.output.radius + 0.01, innerRadius, 40)]
  const rMid = (innerRadius + outerRadius) / 2
  const tangential = (Math.PI * 2 * rMid) / count / 2
  const box = new THREE.BoxGeometry(length * 0.92, outerRadius - innerRadius, tangential)
  for (let k = 0; k < count; k++) {
    const b = box.clone()
    b.translate(0, rMid, 0)
    b.rotateX((k / count) * Math.PI * 2)
    parts.push(b)
  }
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  box.dispose()
  return merged
})

/* ---------------------------------- Clutch ---------------------------------- */

export const flywheelGeometry = once(() => {
  const { flywheelRadius: r, flywheelWidth: w } = GB.clutch
  return revolve(
    [
      [-w / 2, 0],
      [-w / 2, r - 0.05],
      [-w / 2 + 0.02, r],
      [w / 2 - 0.02, r],
      [w / 2, r - 0.05],
      [w / 2, 0.3],
      [w / 2 - 0.03, 0.3],
      [w / 2 - 0.03, 0],
    ],
    72,
  )
})

/** Ring gear around the flywheel, for the starter motor. Purely decorative. */
export const flywheelRingGeometry = once(() => {
  const r = GB.clutch.flywheelRadius
  const parts: THREE.BufferGeometry[] = []
  const box = new THREE.BoxGeometry(GB.clutch.flywheelWidth * 0.6, 0.03, 0.022)
  for (let k = 0; k < 96; k++) {
    const b = box.clone()
    b.translate(0, r + 0.012, 0)
    b.rotateX((k / 96) * Math.PI * 2)
    parts.push(b)
  }
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  box.dispose()
  return merged
})

export const clutchDiscGeometry = once(() => {
  const { discRadius: r, discWidth: w } = GB.clutch
  return revolve(
    [
      [-w / 2, GB.shafts.input.radius + 0.005],
      [-w / 2, 0.24],
      [-w * 1.2, 0.24],
      [-w * 1.2, 0.3],
      [-w / 2, 0.3],
      [-w / 2, r],
      [w / 2, r],
      [w / 2, 0.3],
      [w * 1.2, 0.3],
      [w * 1.2, 0.24],
      [w / 2, 0.24],
      [w / 2, GB.shafts.input.radius + 0.005],
    ],
    64,
  )
})

export const pressurePlateGeometry = once(() => {
  const { plateRadius: r, plateWidth: w } = GB.clutch
  return revolve(
    [
      [-w / 2, 0.36],
      [-w / 2, r],
      [w / 2, r - 0.04],
      [w / 2, 0.55],
      [w / 2 + 0.05, 0.42],
      [w / 2 + 0.05, 0.36],
    ],
    64,
  )
})

/* ---------------------------------- Casing ---------------------------------- */

/** Half a rounded rectangle (z ≤ 0) in the (y, z) plane as shape coordinates (u = y, v = z). */
function halfRoundedRect(top: number, bottom: number, halfWidth: number, radius: number, shape: THREE.Shape | THREE.Path, reverse = false) {
  const r = Math.min(radius, halfWidth, (top - bottom) / 2)
  const pts: [number, number][] = [[top, 0]]
  const arc = (cy: number, cz: number, a0: number, a1: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + ((a1 - a0) * i) / 6
      pts.push([cy + r * Math.cos(a), cz + r * Math.sin(a)])
    }
  }
  pts.push([top, -(halfWidth - r)])
  arc(top - r, -(halfWidth - r), Math.PI / 2, Math.PI)
  pts.push([bottom + r, -halfWidth])
  arc(bottom + r, -(halfWidth - r), Math.PI, Math.PI * 1.5)
  pts.push([bottom, 0])
  const seq = reverse ? pts.reverse() : pts
  seq.forEach(([u, v], i) => (i === 0 ? shape.moveTo(u, v) : shape.lineTo(u, v)))
  return seq
}

const AXIS_PERMUTE = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1)

/** Main case: a half shell (z ≤ 0) with wall thickness, open toward the camera. */
export const caseShellGeometry = once(() => {
  const { xStart, xEnd, top, bottom, halfWidth, wall, cornerRadius } = GB.case
  const shape = new THREE.Shape()
  const outer = halfRoundedRect(top, bottom, halfWidth, cornerRadius, shape)
  const inner: [number, number][] = []
  const tmp = new THREE.Path()
  halfRoundedRect(top - wall, bottom + wall, halfWidth - wall, cornerRadius - wall, tmp, true).forEach((p) => inner.push(p))
  // Continue the outline down the inner wall so the cut faces at z = 0 close the shape.
  inner.forEach(([u, v]) => shape.lineTo(u, v))
  shape.lineTo(outer[0][0], outer[0][1])
  const g = new THREE.ExtrudeGeometry(shape, { depth: xEnd - xStart, bevelEnabled: false, curveSegments: 8 })
  g.applyMatrix4(AXIS_PERMUTE)
  g.translate(xStart, 0, 0)
  g.computeVertexNormals()
  return g
})

/** Front and rear walls of the case, half plates. */
export const caseEndWallGeometry = once(() => {
  const { top, bottom, halfWidth, wall, cornerRadius } = GB.case
  const shape = new THREE.Shape()
  halfRoundedRect(top, bottom, halfWidth, cornerRadius, shape)
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: wall, bevelEnabled: false })
  g.applyMatrix4(AXIS_PERMUTE)
  g.computeVertexNormals()
  return g
})

/** Orange cut faces of the main case: thin strips along the top and bottom walls, and the end walls' cut edges. */
export const caseCapGeometry = once(() => {
  const { xStart, xEnd, top, bottom, wall } = GB.case
  const len = xEnd - xStart
  const cx = (xStart + xEnd) / 2
  const parts: THREE.BufferGeometry[] = []
  const topStrip = new THREE.BoxGeometry(len, wall, 0.012)
  topStrip.translate(cx, top - wall / 2, 0)
  const bottomStrip = new THREE.BoxGeometry(len, wall, 0.012)
  bottomStrip.translate(cx, bottom + wall / 2, 0)
  parts.push(topStrip, bottomStrip)
  for (const x of [xStart, xEnd]) {
    const end = new THREE.BoxGeometry(wall, top - bottom, 0.012)
    end.translate(x + wall / 2, (top + bottom) / 2, 0)
    parts.push(end)
  }
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  return merged
})

const bellProfile = once<P[]>(() => {
  const { xStart, xEnd, radiusStart, radiusEnd, wall } = GB.bell
  return [
    [xStart, radiusStart],
    [xStart + 0.15, radiusStart + 0.03],
    [xEnd, radiusEnd],
    [xEnd, radiusEnd - wall],
    [xStart + 0.15, radiusStart + 0.03 - wall],
    [xStart, radiusStart - wall],
  ]
})

/** Bell housing: a flaring conical shell around the clutch, far half only. */
export const bellShellGeometry = once(() => revolve(bellProfile(), 64, Math.PI / 2, Math.PI))

/** Flat cut faces of the bell housing at z = 0, both sides of the axis. */
export const bellCapGeometry = once(() => {
  const shape = new THREE.Shape()
  bellProfile().forEach(([x, r], i) => (i === 0 ? shape.moveTo(x, r) : shape.lineTo(x, r)))
  shape.closePath()
  const a = new THREE.ShapeGeometry(shape)
  const b = new THREE.ShapeGeometry(shape)
  b.rotateX(Math.PI)
  const merged = mergeGeometries([a, b])!
  a.dispose()
  b.dispose()
  return merged
})

/** Bearing: a dark ring with a bright race, hugging a shaft where it passes a wall. */
export const bearingGeometry = once(() => ring(0.1, 0.13, 0.24, 40))
export const bearingRaceGeometry = once(() => new THREE.TorusGeometry(0.185, 0.02, 8, 40).rotateY(Math.PI / 2))

/* ---------------------------------- Forks ---------------------------------- */

export const railGeometry = once(() => tube(GB.case.xStart + 0.05, GB.case.xEnd - 0.05, GB.forks.railRadius, 12))

/**
 * Fork: a hoop around the sleeve groove on the far side, a radial bar up to the rail and a boss on
 * the rail. Built around the sleeve centre; angles follow the kinematics convention (+Y toward +Z about +X).
 */
export const forkGeometry = once(() => {
  const groove = GB.sleeve.outerRadius - GB.sleeve.grooveDepth + 0.012
  const { railY, railZ, armRadius, railRadius } = GB.forks
  const railAngle = Math.atan2(railZ, railY)
  const sweep = Math.PI * 0.9
  // TorusGeometry starts at +X and sweeps toward +Y; rotateY(π/2) puts that start on −Z (angle −π/2).
  // Straddle the sleeve symmetrically about the direction of the rail.
  const hoop = new THREE.TorusGeometry(groove, armRadius, 8, 28, sweep)
  hoop.rotateY(Math.PI / 2)
  hoop.rotateX(railAngle - sweep / 2 + Math.PI / 2)
  const start = new THREE.Vector3(0, groove * Math.cos(railAngle), groove * Math.sin(railAngle))
  const top = new THREE.Vector3(0, railY, railZ)
  const bar = new THREE.CylinderGeometry(armRadius, armRadius, start.distanceTo(top), 10)
  const dir = top.clone().sub(start).normalize()
  bar.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir))
  const mid = start.clone().add(top).multiplyScalar(0.5)
  bar.translate(mid.x, mid.y, mid.z)
  const boss = new THREE.CylinderGeometry(railRadius + 0.03, railRadius + 0.03, 0.16, 16)
  boss.rotateZ(-Math.PI / 2)
  boss.translate(0, railY, railZ)
  const merged = mergeGeometries([hoop, bar, boss])!
  hoop.dispose()
  bar.dispose()
  boss.dispose()
  return merged
})
