import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TurbofanState } from '../../../types/turbofan'
import { STAGE_EXTENT, TF, bypassAnnulusAt, coreAnnulusAt } from '../../../lib/turbofanConfig'
import { FLOW_X_END_BYPASS, FLOW_X_END_CORE, FLOW_X_START, flowSpeedAt, swirlRateAt, temperatureColor } from '../../../lib/flowVis'
import { useTurbofan } from '../../../hooks/useTurbofanSimulation'
import { streakGeometry } from './geometries'

const COUNT = 1100

/** Piecewise-linear temperature along one stream, rebuilt only when the cycle state changes. */
function buildTempCurve(state: TurbofanState, stream: 'core' | 'bypass') {
  const pts = state.stations
    .filter((s) => (stream === 'bypass' ? s.stream !== 'core' : s.stream !== 'bypass'))
    .sort((a, b) => a.x - b.x)
    .map((s) => [s.x, s.temperatureK] as const)
  return (x: number) => {
    if (x <= pts[0][0]) return pts[0][1]
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const [x0, t0] = pts[i - 1]
        const [x1, t1] = pts[i]
        return t0 + ((t1 - t0) * (x - x0)) / (x1 - x0)
      }
    }
    return pts[pts.length - 1][1]
  }
}

/**
 * Air as streaks: one instanced mesh, coloured by local gas temperature, moving at a speed that
 * follows N1 and the jet velocities. Particles pick a stream when they respawn with probability
 * BPR / (1 + BPR), so the bypass visibly carries most of the air.
 */
export function FlowParticles() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const { sim, settingsRef } = useTurbofan()

  const data = useMemo(() => {
    const x = new Float32Array(COUNT)
    const theta = new Float32Array(COUNT)
    const rf = new Float32Array(COUNT)
    const stream = new Uint8Array(COUNT) // 0 = core, 1 = bypass
    const jitter = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      x[i] = FLOW_X_START + Math.random() * (FLOW_X_END_CORE - FLOW_X_START)
      theta[i] = Math.random() * Math.PI * 2
      rf[i] = 0.08 + Math.random() * 0.84
      stream[i] = Math.random() < 8 / 9 ? 1 : 0
      jitter[i] = 0.7 + Math.random() * 0.6
    }
    return { x, theta, rf, stream, jitter }
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    [],
  )
  // R3F disposes the mesh on unmount, not the material or geometry it was handed.
  useEffect(() => () => material.dispose(), [material])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3)
    const m = new THREE.Matrix4()
    m.makeScale(0, 0, 0)
    for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, m)
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  const scratch = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color() }), [])
  const curves = useRef<{ state: TurbofanState | null; core: (x: number) => number; bypass: (x: number) => number }>({ state: null, core: () => 288, bypass: () => 288 })

  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const settings = settingsRef.current
    const state = sim.state
    mesh.visible = settings.showFlow
    if (!settings.showFlow) return

    if (curves.current.state !== state) {
      curves.current = { state, core: buildTempCurve(state, 'core'), bypass: buildTempCurve(state, 'bypass') }
    }

    const step = settings.playing ? Math.min(dt, 0.1) * settings.speed : 0
    const pBypass = state.bpr / (1 + state.bpr)
    const stageMode = settings.viewMode === 'stage'
    const focus = STAGE_EXTENT[settings.focusStage]
    const { m, p, q, s, c } = scratch
    const { x, theta, rf, stream, jitter } = data

    for (let i = 0; i < COUNT; i++) {
      const isBypass = stream[i] === 1
      const kind = isBypass ? 'bypass' : 'core'
      const speed = flowSpeedAt(state, x[i], kind) * jitter[i]
      x[i] += speed * step
      theta[i] += swirlRateAt(state, x[i], kind) * step

      const end = isBypass ? FLOW_X_END_BYPASS : FLOW_X_END_CORE
      if (x[i] > end) {
        x[i] = FLOW_X_START + Math.random() * 0.6
        theta[i] = Math.random() * Math.PI * 2
        rf[i] = 0.08 + Math.random() * 0.84
        stream[i] = Math.random() < pBypass ? 1 : 0
        continue
      }

      const xi = x[i]
      let inner: number
      let outer: number
      if (isBypass) {
        const a = bypassAnnulusAt(xi)
        inner = a.inner
        outer = xi > TF.nacelle.xEnd ? a.outer * Math.max(0.6, 1 - 0.07 * (xi - TF.nacelle.xEnd)) : a.outer
      } else {
        const a = coreAnnulusAt(xi)
        inner = a.inner
        outer = xi > TF.nozzle.xEnd ? a.outer * Math.max(0.5, 1 - 0.1 * (xi - TF.nozzle.xEnd)) : a.outer
      }
      const r = inner + rf[i] * Math.max(0.02, outer - inner)

      // Fade in at the intake, out at the far end, and hide everything outside the focused stage.
      let fade = Math.min(1, (xi - FLOW_X_START) / 0.8) * Math.min(1, (end - xi) / 1.4)
      if (stageMode && (xi < focus.xStart - 0.35 || xi > focus.xEnd + 0.35)) fade = 0

      const tempK = isBypass ? curves.current.bypass(xi) : curves.current.core(xi)
      const rgb = temperatureColor(tempK)
      const glow = fade * (isBypass ? 0.5 : 0.7)
      c.setRGB(rgb[0] * glow, rgb[1] * glow, rgb[2] * glow)
      mesh.setColorAt(i, c)

      p.set(xi, Math.cos(theta[i]) * r, Math.sin(theta[i]) * r)
      const len = 0.1 + speed * 0.04
      const thick = 0.008 + 0.008 * fade
      s.set(len * fade + 0.001, thick, thick)
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[streakGeometry(), material, COUNT]} frustumCulled={false} raycast={() => null} />
}
