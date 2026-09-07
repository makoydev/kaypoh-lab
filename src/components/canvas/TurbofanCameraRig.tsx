import { useMemo, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { StageId, TurbofanViewMode } from '../../types/turbofan'
import { STAGE_EXTENT } from '../../lib/turbofanConfig'
import { useTurbofan } from '../../hooks/useTurbofanSimulation'
import { backOffFor, useFlyTo } from './useFlyTo'

/** Front-left, above, on the side the cutaway wedge opens toward. Air flows left → right on screen. */
export const TURBOFAN_CAMERA_POSITION: [number, number, number] = [-4.2, 3.1, 9.4]
export const TURBOFAN_TARGET: [number, number, number] = [0.5, 0, 0]

/** Direction the camera sits in relative to a focused stage, normalised. */
const FOCUS_DIR = new THREE.Vector3(-0.42, 0.62, 1).normalize()

function goalFor(viewMode: TurbofanViewMode, stage: StageId, aspect: number) {
  const backOff = backOffFor(aspect)
  if (viewMode !== 'stage') {
    const target = new THREE.Vector3(...TURBOFAN_TARGET)
    const position = new THREE.Vector3(...TURBOFAN_CAMERA_POSITION).sub(target).multiplyScalar(backOff).add(target)
    return { position, target }
  }
  const e = STAGE_EXTENT[stage]
  const target = new THREE.Vector3((e.xStart + e.xEnd) / 2, 0.1, 0)
  const distance = Math.max(2.8, e.radius * 2.4 + (e.xEnd - e.xStart) * 0.7) * backOff
  const position = target.clone().add(FOCUS_DIR.clone().multiplyScalar(distance))
  return { position, target }
}

/** Flies the camera to a framing whenever the view mode / focus stage changes or a reset is requested. */
export function TurbofanCameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const size = useThree((s) => s.size)
  const { settings, cameraToken } = useTurbofan()
  const { viewMode, focusStage } = settings
  const aspect = size.width / Math.max(1, size.height)
  const goal = useMemo(() => goalFor(viewMode, focusStage, aspect), [viewMode, focusStage, aspect])
  useFlyTo(controlsRef, goal, cameraToken)
  return null
}
