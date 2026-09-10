import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Pallet } from '../../../types/escapement'
import { ESC } from '../../../lib/escapementConfig'
import { type P2, angleOf, bankingPinPositions, len, palletStoneOutline, polar } from '../../../lib/escapementModel'

function once<T>(factory: () => T) {
  let value: T | undefined
  return () => (value ??= factory())
}

const DEG = Math.PI / 180

/**
 * Extrude a polygon drawn in the plane of the movement (x, z) into a slab `height` tall, centred on
 * y = 0. Shape space is (x, y); the extrusion runs along the shape's z, which becomes −Y, so rotate
 * and lift it into place.
 */
export function extrudeXZ(points: P2[], height: number, curveSegments = 4) {
  const shape = new THREE.Shape()
  points.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.z) : shape.lineTo(p.x, p.z)))
  shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments })
  g.rotateX(Math.PI / 2)
  g.translate(0, height / 2, 0)
  g.computeVertexNormals()
  return g
}

/** A flat ring of sample points around a circle, in plane coordinates. */
function circlePoints(r: number, segments: number, start = 0, end = 360): P2[] {
  const pts: P2[] = []
  for (let i = 0; i <= segments; i++) pts.push(polar(r, start + ((end - start) * i) / segments))
  return pts
}

function cylinderY(radius: number, height: number, segments = 24) {
  return new THREE.CylinderGeometry(radius, radius, height, segments)
}

function boxAlongX(x0: number, x1: number, width: number, height: number) {
  const g = new THREE.BoxGeometry(x1 - x0, height, width)
  g.translate((x0 + x1) / 2, 0, 0)
  return g
}

function mergeAll(parts: THREE.BufferGeometry[]) {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p))
  const merged = mergeGeometries(flat)!
  parts.forEach((p) => p.dispose())
  flat.forEach((p) => p.dispose())
  return merged
}

/* ---------------------------------- Balance ---------------------------------- */

export const balanceRimGeometry = once(() => {
  const { rimRadius: r, rimWidth: w, rimHeight: h } = ESC.balance
  const ri = r - w
  const pts = [
    new THREE.Vector2(ri, -h / 2),
    new THREE.Vector2(r - 0.02, -h / 2),
    new THREE.Vector2(r, -h / 2 + 0.02),
    new THREE.Vector2(r, h / 2 - 0.02),
    new THREE.Vector2(r - 0.02, h / 2),
    new THREE.Vector2(ri, h / 2),
    new THREE.Vector2(ri, -h / 2),
  ]
  return new THREE.LatheGeometry(pts, 96)
})

/** One arm from the staff to the rim, pointing +X. */
export const balanceArmGeometry = once(() => {
  const { rimRadius, rimWidth, armWidth, armHeight, staffRadius } = ESC.balance
  return boxAlongX(staffRadius, rimRadius - rimWidth + 0.01, armWidth, armHeight)
})

export const staffGeometry = once(() => {
  const { staffRadius, staffBottom, staffTop } = ESC.balance
  const g = cylinderY(staffRadius, staffTop - staffBottom, 20)
  g.translate(0, (staffTop + staffBottom) / 2, 0)
  return g
})

/** Decorative timing weight sitting on the outside of the rim. */
export const rimWeightGeometry = once(() => {
  const g = cylinderY(0.035, 0.05, 12)
  g.rotateZ(Math.PI / 2)
  g.translate(ESC.balance.rimRadius + 0.012, 0, 0)
  return g
})

/* ---------------------------------- Hairspring ---------------------------------- */

/**
 * A flat ribbon along an Archimedean spiral, as a strip of quads whose positions are rewritten every
 * frame by `updateHairspring`. Allocated once; nothing is created per frame.
 */
export function createHairspringGeometry() {
  const n = ESC.hairspring.segments
  const g = new THREE.BufferGeometry()
  const positions = new Float32Array((n + 1) * 2 * 3)
  const normals = new Float32Array((n + 1) * 2 * 3)
  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    const a = i * 2
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  g.setIndex(indices)
  return g
}

/** Spiral angle (degrees) at parameter t for a balance angle: inner end turns with the balance, the stud is fixed. */
export function hairspringAngle(t: number, balanceAngle: number) {
  const total = ESC.hairspring.turns * 360
  const inner = ESC.hairspring.studAngle - total
  return inner + balanceAngle + (total - balanceAngle) * t
}

export const hairspringRadius = (t: number) => ESC.hairspring.innerRadius + (ESC.hairspring.outerRadius - ESC.hairspring.innerRadius) * t

/** Rewrites the ribbon for a balance angle. Centre of the spiral is the local origin. */
export function updateHairspring(g: THREE.BufferGeometry, balanceAngle: number) {
  const n = ESC.hairspring.segments
  const h = ESC.hairspring.height / 2
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const nor = g.getAttribute('normal') as THREE.BufferAttribute
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = hairspringAngle(t, balanceAngle) * DEG
    const r = hairspringRadius(t)
    const c = Math.cos(a)
    const s = -Math.sin(a)
    const k = i * 2
    pos.setXYZ(k, r * c, -h, r * s)
    pos.setXYZ(k + 1, r * c, h, r * s)
    nor.setXYZ(k, c, 0, s)
    nor.setXYZ(k + 1, c, 0, s)
  }
  pos.needsUpdate = true
  nor.needsUpdate = true
}

export const colletGeometry = once(() => cylinderY(ESC.hairspring.innerRadius, ESC.hairspring.height * 1.6, 20))

/** Stud: a small block that pins the outer end of the spring, pointing +X from the stud position. */
export const studGeometry = once(() => new THREE.BoxGeometry(0.07, 0.11, 0.07))

/** Regulator: an arm from near the staff out to the outer coil with two curb pins straddling the ribbon. Points +X. */
export const regulatorGeometry = once(() => {
  const { outerRadius, height } = ESC.hairspring
  const arm = boxAlongX(0.22, outerRadius + 0.08, 0.06, 0.03)
  arm.translate(0, height * 0.9, 0)
  const pin = (dz: number) => {
    const p = cylinderY(0.012, height * 2.2, 10)
    p.translate(outerRadius, height * 0.2, dz)
    return p
  }
  const ring = new THREE.TorusGeometry(0.2, 0.02, 8, 32)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, height * 0.9, 0)
  return mergeAll([arm, pin(0.035), pin(-0.035), ring])
})

/* ---------------------------------- Roller & impulse pin ---------------------------------- */

/** Safety roller with a crescent cut facing the fork (the −X side at rest, angle 180°). */
export const rollerGeometry = once(() => {
  const { radius: R, thickness, crescentRadius: rb } = ESC.roller
  const centre = polar(R, 180)
  // Where the bite circle meets the rim: cos Δ = 1 − r²/(2R²).
  const delta = Math.acos(1 - (rb * rb) / (2 * R * R)) / DEG
  const pts: P2[] = circlePoints(R, 72, 180 + delta, 540 - delta)
  // Bite arc from the last rim point back to the first, passing inside the roller (through angle 0 from the bite centre).
  const last = pts[pts.length - 1]
  const half = angleOf({ x: last.x - centre.x, z: last.z - centre.z })
  for (let i = 1; i < 12; i++) {
    const p = polar(rb, half - (2 * half * i) / 12)
    pts.push({ x: centre.x + p.x, z: centre.z + p.z })
  }
  return extrudeXZ(pts, thickness, 2)
})

/** D-shaped ruby: flat face toward the balance centre, round face toward the fork. Points +X before placement. */
export const impulsePinGeometry = once(() => {
  const { pinHalfWidth: w, pinHeight } = ESC.roller
  const pts: P2[] = [{ x: 0.35 * w, z: -w }, { x: 0.35 * w, z: w }]
  for (let i = 1; i < 12; i++) {
    const p = polar(w, 270 - (180 * i) / 12)
    pts.push({ x: p.x + 0.35 * w, z: p.z })
  }
  return extrudeXZ(pts, pinHeight, 2)
})

/* ---------------------------------- Pallet fork ---------------------------------- */

/** Centroid of a pallet jewel outline, in the fork frame. */
export function palletCentroid(pallet: Pallet): P2 {
  const pts = palletStoneOutline(pallet)
  const sum = pts.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 })
  return { x: sum.x / pts.length, z: sum.z / pts.length }
}

const stoneCache = new Map<Pallet, THREE.BufferGeometry>()

/** Pallet jewel, shaped from the path the tooth tip actually takes. In the fork frame, centred on y = 0. */
export function palletStoneGeometry(pallet: Pallet) {
  let g = stoneCache.get(pallet)
  if (!g) {
    g = extrudeXZ(palletStoneOutline(pallet), ESC.stones.height, 1)
    stoneCache.set(pallet, g)
  }
  return g
}

/** The lever: boss, long arm, forked head with horns, and two pallet arms reaching the jewels. Fork frame, y centred. */
export const forkGeometry = once(() => {
  const { thickness, armWidth, notchRadius, notchWidth, hornLength, hornWidth, palletArmWidth } = ESC.fork
  const parts: THREE.BufferGeometry[] = []
  parts.push(cylinderY(0.1, thickness, 28))
  parts.push(boxAlongX(0.08, notchRadius - 0.1, armWidth, thickness))
  const half = notchWidth / 2 + hornWidth
  const head: P2[] = [
    { x: notchRadius - 0.12, z: -half },
    { x: notchRadius + hornLength, z: -half + 0.012 },
    { x: notchRadius + hornLength, z: -notchWidth / 2 - 0.01 },
    { x: notchRadius + hornLength * 0.55, z: -notchWidth / 2 },
    { x: notchRadius, z: -notchWidth / 2 },
    { x: notchRadius, z: notchWidth / 2 },
    { x: notchRadius + hornLength * 0.55, z: notchWidth / 2 },
    { x: notchRadius + hornLength, z: notchWidth / 2 + 0.01 },
    { x: notchRadius + hornLength, z: half - 0.012 },
    { x: notchRadius - 0.12, z: half },
  ]
  parts.push(extrudeXZ(head, thickness, 1))
  for (const pallet of ['entry', 'exit'] as const) {
    const c = palletCentroid(pallet)
    const arm = boxAlongX(0.06, len(c) - ESC.stones.thickness * 0.7, palletArmWidth, thickness)
    arm.rotateY(angleOf(c) * DEG)
    parts.push(arm)
  }
  return mergeAll(parts)
})

/** Guard pin: a post up from the fork body and a slim pin toward the safety roller, at roller height. */
export const guardPinGeometry = once(() => {
  const { notchRadius, guardPinLength, guardPinRadius, thickness } = ESC.fork
  const rise = ESC.roller.y - ESC.fork.y
  const post = cylinderY(guardPinRadius * 1.6, rise, 10)
  post.translate(notchRadius - 0.09, rise / 2, 0)
  const pin = new THREE.CylinderGeometry(guardPinRadius, guardPinRadius, guardPinLength, 10)
  pin.rotateZ(Math.PI / 2)
  pin.translate(notchRadius - 0.09 + guardPinLength / 2, rise, 0)
  const g = mergeAll([post, pin])
  g.translate(0, thickness / 2 - 0.01, 0)
  return g
})

export const forkArborGeometry = once(() => cylinderY(ESC.fork.arborRadius, 0.42, 16))

/* ---------------------------------- Escape wheel ---------------------------------- */

/** Club-tooth escape wheel. Tooth k's tip is at angle k·pitch, radius `tipRadius`, and leads the tooth body. */
export const escapeWheelGeometry = once(() => {
  const { teeth, tipRadius: Rt, rootRadius: Rr, thickness, rimInnerRadius } = ESC.escapeWheel
  const pitch = 360 / teeth
  const outline: P2[] = []
  for (let k = 0; k < teeth; k++) {
    const a = k * pitch
    outline.push(polar(Rr, a - 14), polar(Rt - 0.09, a - 4), polar(Rt - 0.012, a - 3.4), polar(Rt, a), polar(Rt - 0.16, a + 1), polar(Rr, a + 4))
    for (let j = 1; j < 3; j++) outline.push(polar(Rr, a + 4 + (6 * j) / 3))
  }
  const shape = new THREE.Shape()
  outline.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.z) : shape.lineTo(p.x, p.z)))
  shape.closePath()
  const hole = new THREE.Path()
  circlePoints(rimInnerRadius, 64)
    .reverse()
    .forEach((p, i) => (i === 0 ? hole.moveTo(p.x, p.z) : hole.lineTo(p.x, p.z)))
  shape.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  g.rotateX(Math.PI / 2)
  g.translate(0, thickness / 2, 0)
  g.computeVertexNormals()
  return g
})

/** Hub and spokes of the escape wheel, one merged geometry. */
export const escapeWheelCrossingGeometry = once(() => {
  const { hubRadius, rimInnerRadius, spokes, spokeWidth, thickness } = ESC.escapeWheel
  const parts: THREE.BufferGeometry[] = [cylinderY(hubRadius, thickness * 1.3, 24)]
  for (let i = 0; i < spokes; i++) {
    const s = boxAlongX(hubRadius - 0.02, rimInnerRadius + 0.03, spokeWidth, thickness * 0.9)
    s.rotateY(((360 / spokes) * i + 12) * DEG)
    parts.push(s)
  }
  return mergeAll(parts)
})

export const escapeArborGeometry = once(() => cylinderY(ESC.escapeWheel.arborRadius, 0.52, 16))

/* ---------------------------------- Frame ---------------------------------- */

export const bankingPinGeometry = once(() => cylinderY(ESC.banking.pinRadius, ESC.banking.height, 14))

export const BANKING_PINS = bankingPinPositions()

/** Rounded main plate, top face at `plate.yTop`. */
export const plateGeometry = once(() => {
  const { xStart, xEnd, halfWidth, thickness, cornerRadius: r } = ESC.plate
  const pts: P2[] = []
  const corner = (cx: number, cz: number, a0: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (90 * i) / 8
      const p = polar(r, a)
      pts.push({ x: cx + p.x, z: cz + p.z })
    }
  }
  corner(xEnd - r, -halfWidth + r, 0)
  corner(xStart + r, -halfWidth + r, 90)
  corner(xStart + r, halfWidth - r, 180)
  corner(xEnd - r, halfWidth - r, 270)
  const g = extrudeXZ(pts, thickness, 2)
  g.translate(0, ESC.plate.yTop - thickness / 2, 0)
  return g
})

/** Boss plus jewel seat where an arbor passes a bridge or the plate. Centred on the origin. */
export const bossGeometry = once(() => {
  const { jewelRadius, thickness } = ESC.bridges
  return cylinderY(jewelRadius + 0.06, thickness * 1.3, 24)
})

export const jewelBearingGeometry = once(() => cylinderY(ESC.bridges.jewelRadius, ESC.bridges.thickness * 1.5, 20))

/**
 * A bridge (cock): a flat arm from a foot at (x0, z0) to a boss over (x1, z1), at height y. Built in
 * world coordinates, so position the mesh at the origin.
 */
export function bridgeGeometry(x0: number, z0: number, x1: number, z1: number, y: number) {
  const { width, thickness } = ESC.bridges
  const dx = x1 - x0
  const dz = z1 - z0
  const length = Math.hypot(dx, dz)
  const arm = new THREE.BoxGeometry(length + 0.1, thickness, width)
  arm.translate(length / 2, 0, 0)
  arm.rotateY(angleOf({ x: dx, z: dz }) * DEG)
  arm.translate(x0, y, z0)
  // Foot: a pillar from the plate up to the arm, the way a cock stands off the plate.
  const footHeight = y - ESC.plate.yTop + thickness / 2
  const foot = new THREE.CylinderGeometry(width * 0.62, width * 0.72, footHeight, 20)
  foot.translate(x0, ESC.plate.yTop + footHeight / 2, z0)
  const screw = new THREE.CylinderGeometry(0.045, 0.045, thickness * 0.5, 12)
  screw.translate(x0, y + thickness * 0.75, z0)
  const boss = bossGeometry().clone()
  boss.translate(x1, y, z1)
  return mergeAll([arm, foot, screw, boss])
}
