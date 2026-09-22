import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/** Squared distance at which the camera counts as arrived (0.01 scene units). */
const SETTLED = 0.01 * 0.01

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
  const lastGoal = useRef<CameraGoal | null>(null)

  /**
   * A resize re-runs the rig's `goalFor` and hands us a fresh pair of vectors. Most of the time the
   * framing it computes is identical — every landscape aspect backs off by exactly 1 — so re-arming
   * on the object identity alone threw the user's orbit away on every window resize. Re-arm only
   * when the goal actually moved, by more than the fly-to's own settling distance.
   */
  useEffect(() => {
    const previous = lastGoal.current
    lastGoal.current = goal
    if (previous && previous.position.distanceToSquared(goal.position) < SETTLED && previous.target.distanceToSquared(goal.target) < SETTLED) return
    active.current = true
  }, [goal])

  // A reset always flies, even when the goal is where it already was.
  useEffect(() => {
    active.current = true
  }, [token])

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
    if (camera.position.distanceToSquared(goal.position) < SETTLED && controls.target.distanceToSquared(goal.target) < SETTLED) {
      active.current = false
    }
  })
}

/** Narrow (portrait) viewports need the camera further back to keep the whole machine in frame. */
export function backOffFor(aspect: number) {
  return aspect >= 1.3 ? 1 : Math.min(2.4, 1.3 / aspect)
}
