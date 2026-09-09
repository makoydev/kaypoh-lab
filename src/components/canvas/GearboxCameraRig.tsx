import { useMemo, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { HubId } from '../../types/gearbox'
import { HUB_X } from '../../lib/gearboxConfig'
import { useGearbox, useGearboxFocusHub } from '../../hooks/useGearboxSimulation'
import { backOffFor, useFlyTo } from './useFlyTo'

/** Front-left, above, looking into the open half of the case. Power flows left → right on screen. */
export const GEARBOX_CAMERA_POSITION: [number, number, number] = [-3.4, 2.9, 8.4]
export const GEARBOX_TARGET: [number, number, number] = [0.15, -0.5, 0]

const FOCUS_DIR = new THREE.Vector3(-0.55, 0.5, 1).normalize()

function goalFor(focusHub: HubId | null, aspect: number) {
  const backOff = backOffFor(aspect)
  if (!focusHub) {
    const target = new THREE.Vector3(...GEARBOX_TARGET)
    const position = new THREE.Vector3(...GEARBOX_CAMERA_POSITION).sub(target).multiplyScalar(backOff).add(target)
    return { position, target }
  }
  const target = new THREE.Vector3(HUB_X[focusHub], 0, 0)
  const position = target.clone().add(FOCUS_DIR.clone().multiplyScalar(3.4 * backOff))
  return { position, target }
}

/** Flies the camera to a framing whenever the view mode / focus hub changes or a reset is requested. */
export function GearboxCameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const size = useThree((s) => s.size)
  const { settings, cameraToken } = useGearbox()
  const focusHub = useGearboxFocusHub(settings.viewMode === 'synchro')
  const aspect = size.width / Math.max(1, size.height)
  const goal = useMemo(() => goalFor(focusHub, aspect), [focusHub, aspect])
  useFlyTo(controlsRef, goal, cameraToken)
  return null
}
