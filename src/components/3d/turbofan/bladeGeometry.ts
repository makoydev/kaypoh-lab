import * as THREE from 'three'
import { airfoilSection } from '../../../lib/airfoil'

export interface BladeParams {
  /** Section rotation about the span axis at the root, degrees, relative to the tip (which is 0). */
  twistRootDeg: number
  /** Tip chord as a fraction of root chord. */
  taper: number
  /** Max thickness as a fraction of chord. */
  thickness: number
  /** Max camber as a fraction of chord. */
  camber: number
  spanSegments?: number
  chordSegments?: number
}

/**
 * Lofts a unit blade: span along +Y from 0 to 1, chord along X centred near mid-chord, thickness in Z.
 * Airfoil sections are rotated progressively along the span so the blade twists. Rows scale this to
 * their own chord and span, so one buffer serves every blade in a row.
 */
export function bladeGeometry({ twistRootDeg, taper, thickness, camber, spanSegments = 8, chordSegments = 10 }: BladeParams) {
  const section = airfoilSection({ thickness, camber, segments: chordSegments })
  const M = section.length
  const positions: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= spanSegments; i++) {
    const t = i / spanSegments
    const chord = 1 - (1 - taper) * t
    const twist = ((1 - t) * twistRootDeg * Math.PI) / 180
    const c = Math.cos(twist)
    const s = Math.sin(twist)
    for (const p of section) {
      const x0 = (p.x - 0.45) * chord
      const z0 = p.y * chord
      // Rotate about Y (span): x' = x cos + z sin, z' = -x sin + z cos
      positions.push(x0 * c + z0 * s, t, -x0 * s + z0 * c)
    }
  }

  for (let i = 0; i < spanSegments; i++) {
    const a = i * M
    const b = (i + 1) * M
    for (let j = 0; j < M; j++) {
      const j1 = (j + 1) % M
      indices.push(a + j, b + j, b + j1)
      indices.push(a + j, b + j1, a + j1)
    }
  }

  // Root and tip caps: triangle fans around a centre vertex.
  const rootCentre = positions.length / 3
  positions.push(0, 0, 0)
  for (let j = 0; j < M; j++) indices.push(rootCentre, (j + 1) % M, j)
  const tipCentre = positions.length / 3
  positions.push(0, 1, 0)
  const tipBase = spanSegments * M
  for (let j = 0; j < M; j++) indices.push(tipCentre, tipBase + j, tipBase + ((j + 1) % M))

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}
