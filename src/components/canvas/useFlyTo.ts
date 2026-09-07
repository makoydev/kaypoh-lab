import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export interface CameraGoal {
  position: THREE.Vector3
  target: THREE.Vector3
}

/**
 * Flies the camera (and the OrbitControls target) to `goal` whenever the goal or `token` changes.
 * A user grabbing the controls cancels the fly-to. Shared by every module's camera rig.
 */
export function useFlyTo(controlsRef: RefObject<OrbitControlsImpl | null>, goal: CameraGoal, token: number) {
  const camera = useThree((s) => s.camera)
  const active = useRef(false)

  useEffect(() => {
    active.current = true
  }, [goal, token])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const stop = () => {
      active.current = false
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controlsRef])

  useFrame((_, dt) => {
    if (!active.current) return
    const controls = controlsRef.current
    if (!controls) return
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 4.5)
    camera.position.lerp(goal.position, k)
    controls.target.lerp(goal.target, k)
    controls.update()
    if (camera.position.distanceTo(goal.position) < 0.01 && controls.target.distanceTo(goal.target) < 0.01) {
      active.current = false
    }
  })
}

/** Narrow (portrait) viewports need the camera further back to keep the whole machine in frame. */
export function backOffFor(aspect: number) {
  return aspect >= 1.3 ? 1 : Math.min(2.4, 1.3 / aspect)
}
