/**
 * Small, pure airfoil helpers used to loft procedural blades. NACA four-digit style: a symmetric
 * thickness distribution wrapped around a circular-arc camber line.
 */

export interface AirfoilOptions {
  /** Maximum thickness as a fraction of chord. */
  thickness: number
  /** Maximum camber as a fraction of chord (positive bows the blade toward +y). */
  camber: number
  /** Points per surface; the closed loop has 2·segments points. */
  segments?: number
}

/** Half thickness at chord fraction x (0-1). Closed trailing edge variant, so t(1) = 0. */
export function naca4Thickness(x: number, thickness: number) {
  const s = Math.sqrt(Math.max(0, x))
  return 5 * thickness * (0.2969 * s - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x)
}

/** Circular-arc-ish camber line: zero at both ends, maximum at mid-chord. */
export function camberLine(x: number, camber: number) {
  return 4 * camber * x * (1 - x)
}

/**
 * Closed outline of an airfoil section, chord along +x from 0 to 1, leading edge at x = 0.
 * Runs along the upper surface from leading edge to trailing edge, then back along the lower surface.
 * Points are spaced with cosine clustering so the rounded leading edge gets the detail.
 */
export function airfoilSection({ thickness, camber, segments = 12 }: AirfoilOptions): { x: number; y: number }[] {
  const upper: { x: number; y: number }[] = []
  const lower: { x: number; y: number }[] = []
  for (let i = 0; i <= segments; i++) {
    const x = (1 - Math.cos((i / segments) * Math.PI)) / 2
    const yc = camberLine(x, camber)
    const yt = naca4Thickness(x, thickness)
    upper.push({ x, y: yc + yt })
    lower.push({ x, y: yc - yt })
  }
  // Upper LE→TE, then lower TE→LE, skipping the duplicated end points.
  return [...upper, ...lower.slice(1, -1).reverse()]
}
