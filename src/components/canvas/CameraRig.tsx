import { useMemo, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ViewMode } from '../../types/simulation'
import { CYLINDERS } from '../../lib/engineConfig'
import { borePoint } from '../../lib/kinematics'
import { useEngine } from '../../hooks/useEngineSimulation'
import { backOffFor, useFlyTo } from './useFlyTo'

export const ENGINE_Y_OFFSET = 0.2
export const DEFAULT_CAMERA_POSITION: [number, number, number] = [6.4, 3.4, 7.2]
export const DEFAULT_TARGET: [number, number, number] = [0, 0.55, 0]

function goalFor(viewMode: ViewMode, focusCylinder: number, aspect: number) {
  const backOff = backOffFor(aspect)
  if (viewMode !== 'piston') {
    const target = new THREE.Vector3(...DEFAULT_TARGET)
    const position = new THREE.Vector3(...DEFAULT_CAMERA_POSITION).sub(target).multiplyScalar(backOff).add(target)
    return { position, target }
  }
  const spec = CYLINDERS[focusCylinder - 1]
  const mid = borePoint(spec, 1.7)
  const side = spec.bank === 'left' ? -1 : 1
  const target = new THREE.Vector3(mid.x, mid.y + ENGINE_Y_OFFSET, mid.z)
  const position = target.clone().add(new THREE.Vector3(side * 3.4, 1.5, 4.6).multiplyScalar(backOff))
  return { position, target }
}

/** Flies the camera to a framing whenever the view mode / focus cylinder changes or a reset is requested. */
export function CameraRig({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const size = useThree((s) => s.size)
  const { settings, cameraToken } = useEngine()
  const { viewMode, focusCylinder } = settings
  const aspect = size.width / Math.max(1, size.height)
  const goal = useMemo(() => goalFor(viewMode, focusCylinder, aspect), [viewMode, focusCylinder, aspect])
  useFlyTo(controlsRef, goal, cameraToken)
  return null
}
