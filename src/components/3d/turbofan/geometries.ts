import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { TF, coreCasingRadiusAt, hubRadiusAt } from '../../../lib/turbofanConfig'
import { bladeGeometry } from './bladeGeometry'

function once<T>(factory: () => T) {
  let value: T | undefined
  return () => (value ??= factory())
}

/** Profile point: axial position, radius. */
type P = [number, number]

/**
 * The cutaway wedge. Every casing shell is revolved through 270° so the quarter facing up and toward
 * the default camera (+Y, +Z) is missing, like a sectioned display engine.
 */
export const CUT_PHI_LENGTH = Math.PI * 1.5

/** Revolve a profile about the engine axis (+X). Full turn unless `phiLength` says otherwise. */
function revolve(profile: P[], segments = 72, phiLength = Math.PI * 2) {
  const pts = profile.map(([x, r]) => new THREE.Vector2(Math.max(0, r), x))
  const g = new THREE.LatheGeometry(pts, segments, 0, phiLength)
  // Lathe axis is Y; swing it onto X so the geometry can be placed and spun directly.
  g.rotateZ(-Math.PI / 2)
  return g
}

/** Flat cut faces for a shell revolved through `CUT_PHI_LENGTH`: one in the XZ plane, one in the XY plane. */
function cutCaps(profile: P[]) {
  const shape = new THREE.Shape()
  profile.forEach(([x, r], i) => (i === 0 ? shape.moveTo(x, r) : shape.lineTo(x, r)))
  shape.closePath()
  const a = new THREE.ShapeGeometry(shape)
  a.rotateX(Math.PI / 2) // φ = 0 face → (x, 0, r)
  const b = new THREE.ShapeGeometry(shape) // φ = 270° face → (x, r, 0)
  const merged = mergeGeometries([a, b])!
  a.dispose()
  b.dispose()
  return merged
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n: number): P[] {
  const out: P[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return out
}

function sample(fn: (x: number) => number, x0: number, x1: number, n: number): P[] {
  const out: P[] = []
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    out.push([x, fn(x)])
  }
  return out
}

/* ---------------------------------- Casings ---------------------------------- */

const nacelleProfile = once<P[]>(() => {
  const { xStart: xs, xEnd: xe, innerRadius: ri, thickness: th } = TF.nacelle
  const lipR = 0.09
  const lipCx = xs + lipR
  const lipCy = ri + 0.06 + lipR
  return [
    // inner surface, front → back (intake contracts slightly then runs straight)
    [lipCx, ri + 0.06],
    [xs + 0.45, ri + 0.015],
    [xs + 0.8, ri],
    [xe - 0.02, ri],
    // thin trailing edge
    [xe, ri + 0.03],
    // outer surface, back → front (boat-tail then max thickness)
    [xe - 0.6, ri + 0.12],
    [xe - 1.3, ri + th],
    [xs + 0.9, ri + th],
    [lipCx + 0.3, ri + th - 0.005],
    // rounded intake lip
    ...arc(lipCx, lipCy, lipR, Math.PI / 2, Math.PI * 1.5, 8),
  ]
})

export const nacelleShellGeometry = once(() => revolve(nacelleProfile(), 96, CUT_PHI_LENGTH))
export const nacelleCapGeometry = once(() => cutCaps(nacelleProfile()))

/** Core casing from the splitter lip back to the start of the nozzle. */
const coreCasingProfile = once<P[]>(() => {
  const th = TF.casingThickness
  const x0 = TF.splitter.x
  const x1 = TF.nozzle.xStart
  const inner = sample(coreCasingRadiusAt, x0 + th / 2, x1, 60)
  const outer = sample((x) => coreCasingRadiusAt(x) + th, x1, x0 + th / 2, 60)
  const noseR = th / 2
  return [...inner, [x1, coreCasingRadiusAt(x1) + th], ...outer, ...arc(x0 + noseR, coreCasingRadiusAt(x0) + noseR, noseR, Math.PI / 2, Math.PI * 1.5, 6)]
})

export const coreCasingShellGeometry = once(() => revolve(coreCasingProfile(), 96, CUT_PHI_LENGTH))
export const coreCasingCapGeometry = once(() => cutCaps(coreCasingProfile()))

/** Nozzle: the last stretch of the core casing, tapering to a thin lip. */
const nozzleProfile = once<P[]>(() => {
  const th = TF.casingThickness
  const { xStart: x0, xEnd: x1 } = TF.nozzle
  const inner = sample(coreCasingRadiusAt, x0, x1, 12)
  const outer = sample((x) => coreCasingRadiusAt(x) + th * (1 - (0.75 * (x - x0)) / (x1 - x0)), x1, x0, 12)
  return [...inner, ...outer]
})

export const nozzleShellGeometry = once(() => revolve(nozzleProfile(), 72, CUT_PHI_LENGTH))
export const nozzleCapGeometry = once(() => cutCaps(nozzleProfile()))

/** Combustor liner: an annular can with an outer wall, an inner wall and a domed front, sectioned. */
const combustorLinerProfile = once<P[]>(() => {
  const { xStart: x0, xEnd: x1, outerRadius: ro, innerRadius: ri } = TF.combustor
  const w = 0.035
  // A "C" shaped wall: outer wall, front dome, inner wall.
  return [
    [x0 + 0.08, ro],
    [x1, ro],
    [x1, ro - w],
    [x0 + 0.08 + w, ro - w],
    [x0 + w, ri + 0.12],
    [x0 + w, ri + w],
    [x1, ri + w],
    [x1, ri],
    [x0, ri],
    [x0, ri + 0.12],
  ]
})

export const combustorLinerGeometry = once(() => revolve(combustorLinerProfile(), 72, CUT_PHI_LENGTH))
export const combustorCapGeometry = once(() => cutCaps(combustorLinerProfile()))

/** Glowing volume inside the liner, a closed ring. */
export const flameGeometry = once(() => {
  const { xStart: x0, xEnd: x1, outerRadius: ro, innerRadius: ri } = TF.combustor
  const pad = 0.07
  return revolve(
    [
      [x0 + pad, ri + pad],
      [x0 + pad, ro - pad],
      [x1 - pad, ro - pad],
      [x1 - pad, ri + pad],
      [x0 + pad, ri + pad],
    ],
    48,
  )
})

/** Static inner casing between the HP compressor exit and the HP turbine, wrapping the HP shaft. */
export const innerCasingGeometry = once(() => {
  const x0 = TF.hpCompressor.xStart + TF.hpCompressor.stages * TF.hpCompressor.pitch
  const x1 = TF.hpTurbine.xStart
  const r = TF.combustor.innerRadius - 0.02
  return revolve(
    [
      [x0, r],
      [x1, r],
    ],
    48,
  )
})

/**
 * Exhaust glow: a soft cone trailing the nozzle. Vertex colours run from full brightness at the
 * nozzle lip to black at the tail, which under additive blending is a fade to nothing.
 */
export const exhaustPlumeGeometry = once(() => {
  const length = 3.2
  const g = new THREE.CylinderGeometry(0.02, 0.95, length, 40, 10, true)
  const pos = g.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    // Cylinder axis is Y before rotation: +Y (narrow end) is the far tail, −Y the nozzle lip.
    const t = (pos.getY(i) + length / 2) / length
    const k = Math.pow(Math.max(0, 1 - t * 1.08), 1.8)
    colors[i * 3] = k
    colors[i * 3 + 1] = k
    colors[i * 3 + 2] = k
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.rotateZ(-Math.PI / 2)
  g.translate(TF.nozzle.xEnd + length / 2 - 0.05, 0, 0)
  return g
})

/* ---------------------------------- Rotors ---------------------------------- */

/** Spinner: an elliptical nose from the apex to the fan disc. */
export const spinnerGeometry = once(() => {
  const apex = TF.fan.x - TF.spinner.length
  const R = TF.spinner.radius
  const pts: P[] = [[apex, 0]]
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    pts.push([apex + t * TF.spinner.length, R * Math.sqrt(1 - (1 - t) * (1 - t))])
  }
  pts.push([TF.fan.x + 0.16, R], [TF.fan.x + 0.16, 0])
  return revolve(pts, 64)
})

/** Solid drum following the hub line between two axial positions. */
function drum(x0: number, x1: number, rShrink = 0) {
  const pts: P[] = [[x0, 0], ...sample((x) => hubRadiusAt(x) - rShrink, x0, x1, 24), [x1, 0]]
  return revolve(pts, 56)
}

const boosterEnd = TF.booster.xStart + TF.booster.stages * TF.booster.pitch
const hpcEnd = TF.hpCompressor.xStart + TF.hpCompressor.stages * TF.hpCompressor.pitch
const hptEnd = TF.hpTurbine.xStart + TF.hpTurbine.stages * TF.hpTurbine.pitch

export const boosterDrumGeometry = once(() => drum(TF.fan.x + 0.16, TF.hpCompressor.xStart - 0.04))
export const hpcDrumGeometry = once(() => drum(TF.hpCompressor.xStart - 0.02, hpcEnd + 0.03))
export const hptDrumGeometry = once(() => drum(TF.hpTurbine.xStart - 0.04, hptEnd + 0.04))
export const lptDrumGeometry = once(() => drum(TF.lpTurbine.xStart - 0.04, TF.exhaustCone.xStart))
export const exhaustConeGeometry = once(() => drum(TF.exhaustCone.xStart, TF.exhaustCone.xEnd))

function tube(x0: number, x1: number, r: number, segments = 32) {
  const g = new THREE.CylinderGeometry(r, r, x1 - x0, segments, 1, false)
  g.rotateZ(-Math.PI / 2)
  g.translate((x0 + x1) / 2, 0, 0)
  return g
}

export const lpShaftGeometry = once(() => tube(TF.fan.x, TF.lpTurbine.xStart, TF.shaft.lpRadius))
export const hpShaftGeometry = once(() => tube(hpcEnd, TF.hpTurbine.xStart, TF.shaft.hpRadius))

/** Ring between booster end and HP compressor start: the intermediate case seen through the wedge. */
export const intermediateCaseGeometry = once(() => {
  const x0 = boosterEnd + 0.02
  const x1 = TF.hpCompressor.xStart - 0.02
  return tube(x0, x1, 0.58, 40)
})

/* ---------------------------------- Blades ---------------------------------- */

export const fanBladeGeometry = once(() => bladeGeometry({ twistRootDeg: TF.fan.staggerRoot - TF.fan.staggerTip, taper: 1.3, thickness: 0.06, camber: 0.07, spanSegments: 10, chordSegments: 12 }))
export const compressorBladeGeometry = once(() => bladeGeometry({ twistRootDeg: -12, taper: 0.9, thickness: 0.09, camber: 0.08, spanSegments: 4, chordSegments: 8 }))
export const turbineBladeGeometry = once(() => bladeGeometry({ twistRootDeg: -10, taper: 0.95, thickness: 0.16, camber: 0.16, spanSegments: 4, chordSegments: 8 }))
export const vaneGeometry = once(() => bladeGeometry({ twistRootDeg: -4, taper: 1, thickness: 0.08, camber: 0.05, spanSegments: 3, chordSegments: 8 }))

/** Slender streak for the flow particles, unit length along X. */
export const streakGeometry = once(() => new THREE.BoxGeometry(1, 1, 1, 1, 1, 1))

