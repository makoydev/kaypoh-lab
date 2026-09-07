import type { Bank, CylinderSpec, Stroke } from '../types/simulation'

/**
 * Procedural geometry, all in scene units (roughly decimetres of a real small-block V8).
 * Everything else — bores, heads, rod lengths — is derived from these numbers so the
 * kinematics and the meshes never drift apart.
 */
export const GEOMETRY = {
  /** Crank throw radius → stroke = 2 × radius. */
  crankRadius: 0.45,
  rodLength: 1.55,
  bankAngleDeg: 45,
  /** Z-spacing between crank throws (bore spacing). */
  journalSpacing: 1.05,
  /** Each rod of a shared-pin pair is nudged this far along Z. */
  rodOffset: 0.13,
  boreRadius: 0.42,
  pistonRadius: 0.41,
  pistonHeight: 0.5,
  /** Piston mesh centre sits this far above the wrist pin. */
  pistonCentreOffset: 0.2,
  /** Distance from crank axis to the top of the bore (the deck). */
  deckDistance: 2.55,
  /** Distance from crank axis to the bottom of the bore liner. */
  boreBottom: 1.0,
  headThickness: 0.4,
  pinRadius: 0.16,
  pinLength: 0.42,
  webThickness: 0.14,
  webOffset: 0.28,
  mainJournalRadius: 0.2,
  counterweightRadius: 0.66,
  crankNoseZ: 2.75,
} as const

export const RPM = { idle: 800, max: 7000, redline: 6500 } as const

/**
 * The real engine turns far too fast to watch; at 7,000 rpm the crank would spin ~117 times a
 * second. The scene divides the real rotational speed by this factor so the eye can follow.
 */
export const VISUAL_TIME_SCALE = 40

/** Assumed real-world stroke for the "mean piston speed" metric (small-block ~92 mm). */
export const REAL_STROKE_M = 0.092

/** Classic crossplane V8 firing order. Cylinder 1 fires at 0°, then every 90°. */
export const FIRING_ORDER: readonly number[] = [1, 8, 4, 3, 6, 5, 7, 2]
export const DEG_PER_FIRE = 720 / FIRING_ORDER.length

export const bankAngleDeg = (bank: Bank) => (bank === 'left' ? GEOMETRY.bankAngleDeg : -GEOMETRY.bankAngleDeg)

/** Odd cylinders on the left bank, even on the right; pairs (1,2) (3,4) (5,6) (7,8) share a throw. */
export const CYLINDERS: CylinderSpec[] = Array.from({ length: 8 }, (_, i) => {
  const number = i + 1
  return {
    number,
    bank: number % 2 === 1 ? 'left' : 'right',
    journal: Math.floor(i / 2),
    fireAngle: FIRING_ORDER.indexOf(number) * DEG_PER_FIRE,
  }
})

const mod360 = (a: number) => ((a % 360) + 360) % 360

/**
 * Crank-pin angular offsets per throw, derived from the firing order so that each cylinder is
 * exactly at TDC when it is meant to fire. Works out to 45°, 135°, 315°, 225° — i.e. the four
 * throws sit 90° apart in a cross, which is what makes it a crossplane crank.
 */
export const PIN_OFFSETS_DEG: number[] = [0, 1, 2, 3].map((journal) => {
  const cyl = CYLINDERS.find((c) => c.journal === journal && c.bank === 'left')!
  return mod360(bankAngleDeg(cyl.bank) - cyl.fireAngle)
})

export const journalZ = (journal: number) => (journal - 1.5) * GEOMETRY.journalSpacing

export const cylinderZ = (cyl: CylinderSpec) =>
  journalZ(cyl.journal) + (cyl.bank === 'left' ? -GEOMETRY.rodOffset : GEOMETRY.rodOffset)

export const cylinderByNumber = (n: number) => CYLINDERS[n - 1]

export const STROKE_ORDER: Stroke[] = ['intake', 'compression', 'power', 'exhaust']

export const STROKE_META: Record<Stroke, { label: string; nick: string; color: string; tw: string }> = {
  intake: { label: 'Intake', nick: 'Suck', color: '#38bdf8', tw: 'stroke-intake' },
  compression: { label: 'Compression', nick: 'Squeeze', color: '#a78bfa', tw: 'stroke-compression' },
  power: { label: 'Power', nick: 'Bang', color: '#fb923c', tw: 'stroke-power' },
  exhaust: { label: 'Exhaust', nick: 'Blow', color: '#94a3b8', tw: 'stroke-exhaust' },
}
