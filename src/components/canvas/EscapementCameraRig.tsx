import { useMemo, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { EscapementViewMode } from '../../types/escapement'
import { ESC } from '../../lib/escapementConfig'
import { useEscapement } from '../../hooks/useEscapementSimulation'
import { backOffFor, useFlyTo } from './useFlyTo'

/** Front, well above, slightly right: the movement lies flat like a watch on the bench. Energy flows left → right. */
export const ESCAPEMENT_CAMERA_POSITION: [number, number, number] = [1.1, 6.0, 7.0]
export const ESCAPEMENT_TARGET: [number, number, number] = [0.25, 0.1, 0]

/** Pallet focus looks almost straight down at the jewels and the teeth between them. */
const FOCUS_DIR = new THREE.Vector3(0.14, 0.92, 0.38).normalize()
const FOCUS_TARGET = new THREE.Vector3((ESC.escapeWheel.x + 0.1) / 2 - 0.15, 0.05, 0)

function goalFor(viewMode: EscapementViewMode, aspect: number) {
  const backOff = backOffFor(aspect)
  if (viewMode !== 'pallet') {
    const target = new THREE.Vector3(...ESCAPEMENT_TARGET)
    const position = new THREE.Vector3(...ESCAPEMENT_CAMERA_POSITION).sub(target).multiplyScalar(backOff).add(target)
    return { position, target }
  }
  const target = FOCUS_TARGET.clone()
  const position = target.clone().add(FOCUS_DIR.clone().multiplyScalar(3.6 * backOff))
  return { position, target }
}

/** Flies the camera to a framing whenever the view mode changes or a reset is requested. */
export function EscapementCameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const size = useThree((s) => s.size)
  const { settings, cameraToken } = useEscapement()
  const aspect = size.width / Math.max(1, size.height)
  const goal = useMemo(() => goalFor(settings.viewMode, aspect), [settings.viewMode, aspect])
  useFlyTo(controlsRef, goal, cameraToken)
  return null
}
