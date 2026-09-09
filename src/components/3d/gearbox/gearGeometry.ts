import * as THREE from 'three'

export interface GearGeometryOptions {
  teeth: number
  /** Pitch radius. */
  radius: number
  module: number
  bore: number
  /** Face width along the axis. */
  width: number
  /** Shaved off tip and root so meshing teeth never visibly touch. */
  backlash?: number
}

/**
 * A spur gear as an extruded tooth profile. Tooth k is centred on angle 360·k/N measured from +Y
 * toward +Z about +X, which is the convention the kinematics use, so `rotation.x = angle` is all a
 * mesh needs. Trapezoidal teeth with a rounded root: not a true involute, but reads as one.
 */
export function gearGeometry({ teeth, radius, module, bore, width, backlash = 0.004 }: GearGeometryOptions) {
  const rootR = radius - 1.25 * module + backlash
  const tipR = radius + module - backlash
  const pitch = (Math.PI * 2) / teeth
  const shape = new THREE.Shape()
  const pt = (a: number, r: number): [number, number] => [r * Math.cos(a), r * Math.sin(a)]
  const rootHalf = 0.31 * pitch
  const pitchHalf = 0.235 * pitch
  const tipHalf = 0.145 * pitch

  for (let k = 0; k < teeth; k++) {
    const a = k * pitch
    const pts: [number, number][] = [
      pt(a - rootHalf, rootR),
      pt(a - pitchHalf, radius),
      pt(a - tipHalf, tipR),
      pt(a + tipHalf, tipR),
      pt(a + pitchHalf, radius),
      pt(a + rootHalf, rootR),
      pt(a + pitch / 2, rootR - 0.15 * module),
    ]
    pts.forEach(([x, y], i) => (k === 0 && i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
  }
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, 0, bore, 0, Math.PI * 2, true)
  shape.holes.push(hole)

  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 24,
  })
  // Shape plane (u, v) → (y, z); extrusion axis → x. Cyclic permutation keeps the winding right-handed.
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1))
  g.translate(-width / 2, 0, 0)
  g.computeVertexNormals()
  return g
}
