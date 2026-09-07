import { useMemo } from 'react'
import { computeAllCylinders, computeCylinderState } from '../lib/kinematics'
import { cylinderByNumber } from '../lib/engineConfig'

export * from '../lib/kinematics'

/** Memoised kinematic state for every cylinder at a given crank angle (UI use, not per-frame). */
export function useKinematics(crankDeg: number) {
  return useMemo(() => computeAllCylinders(crankDeg), [crankDeg])
}

/** Memoised kinematic state for a single cylinder. */
export function useCylinderKinematics(cylinderNumber: number, crankDeg: number) {
  return useMemo(() => computeCylinderState(cylinderByNumber(cylinderNumber), crankDeg), [cylinderNumber, crankDeg])
}
