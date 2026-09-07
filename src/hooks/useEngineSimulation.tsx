import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { CylinderState, EngineSettings, PartId, SimSnapshot } from '../types/simulation'
import { RPM } from '../lib/engineConfig'
import { activeCylinderAt, computeAllCylinders, mod } from '../lib/kinematics'

/**
 * High-frequency simulation state lives outside React. The render loop mutates it 60×/s;
 * UI components poll it at a gentler cadence through `useSimSnapshot`.
 */
export interface SimStore {
  /** Crank angle in degrees, 0-720 (two revolutions = one full four-stroke cycle). */
  angle: number
  cylinders: CylinderState[]
  listeners: Set<() => void>
}

export function createSimStore(initialAngle = 0): SimStore {
  return {
    angle: initialAngle,
    cylinders: computeAllCylinders(initialAngle),
    listeners: new Set(),
  }
}

const DEFAULT_SETTINGS: EngineSettings = {
  rpm: 1800,
  playing: true,
  speed: 1,
  viewMode: 'cutaway',
  casingMode: 'ghost',
  autoRotate: true,
  selectedPart: null,
  hoveredPart: null,
  focusCylinder: 1,
}

interface EngineContextValue {
  settings: EngineSettings
  settingsRef: RefObject<EngineSettings>
  update: (patch: Partial<EngineSettings> | ((prev: EngineSettings) => Partial<EngineSettings>)) => void
  sim: SimStore
  /** Set the crank angle directly (used by the stroke stepper). Wraps to 0-720. */
  setAngle: (deg: number) => void
  stepAngle: (deltaDeg: number) => void
  selectPart: (part: PartId | null) => void
  hoverPart: (part: PartId | null) => void
  /** Increments whenever the camera should fly back to its default framing. */
  cameraToken: number
  resetCamera: () => void
}

const EngineContext = createContext<EngineContextValue | null>(null)

export function EngineSimulationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef<EngineSettings>(settings)
  useLayoutEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [sim] = useState(() => createSimStore(0))

  const [cameraToken, setCameraToken] = useState(0)

  const update = useCallback<EngineContextValue['update']>((patch) => {
    setSettings((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch
      const merged = { ...prev, ...next }
      merged.rpm = Math.min(RPM.max, Math.max(RPM.idle, merged.rpm))
      return merged
    })
  }, [])

  const setAngle = useCallback(
    (deg: number) => {
      sim.angle = mod(deg, 720)
      sim.cylinders = computeAllCylinders(sim.angle)
      sim.listeners.forEach((l) => l())
    },
    [sim],
  )

  const stepAngle = useCallback((delta: number) => setAngle(sim.angle + delta), [setAngle, sim])

  const selectPart = useCallback((part: PartId | null) => update({ selectedPart: part }), [update])
  const hoverPart = useCallback((part: PartId | null) => update({ hoveredPart: part }), [update])
  const resetCamera = useCallback(() => setCameraToken((t) => t + 1), [])

  const value = useMemo<EngineContextValue>(
    () => ({
      settings,
      settingsRef,
      update,
      sim,
      setAngle,
      stepAngle,
      selectPart,
      hoverPart,
      cameraToken,
      resetCamera,
    }),
    [settings, update, sim, setAngle, stepAngle, selectPart, hoverPart, cameraToken, resetCamera],
  )

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
}

export function useEngine() {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngine must be used inside <EngineSimulationProvider>')
  return ctx
}

/**
 * Polls the mutable sim store at `fps` and returns a React-friendly snapshot.
 * Only re-renders when the crank angle has actually moved.
 */
export function useSimSnapshot(fps = 24): SimSnapshot {
  const { sim } = useEngine()
  const [snap, setSnap] = useState<SimSnapshot>(() => ({
    angle: sim.angle,
    cylinders: sim.cylinders,
    activeCylinder: activeCylinderAt(sim.angle),
  }))

  useEffect(() => {
    let raf = 0
    let last = 0
    let lastAngle = Number.NaN
    const publish = () => {
      lastAngle = sim.angle
      setSnap({ angle: sim.angle, cylinders: sim.cylinders, activeCylinder: activeCylinderAt(sim.angle) })
    }
    const loop = (t: number) => {
      if (t - last >= 1000 / fps && sim.angle !== lastAngle) {
        last = t
        publish()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    sim.listeners.add(publish)
    return () => {
      cancelAnimationFrame(raf)
      sim.listeners.delete(publish)
    }
  }, [sim, fps])

  return snap
}
