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
import type { StageId, TurbofanPartId, TurbofanSettings, TurbofanSnapshot, TurbofanState } from '../types/turbofan'
import { BPR, N1 } from '../lib/turbofanConfig'
import { computeTurbofan } from '../lib/turbofanModel'

/**
 * Per-frame turbofan state, outside React. The driver rotates the spools and refreshes the cycle
 * state once per frame; meshes and particles read it directly, the HUD polls it through
 * `useTurbofanSnapshot`. Same pattern as the V8's `SimStore`.
 */
export interface TurbofanStore {
  /** LP spool angle, degrees 0-360. */
  lpAngle: number
  /** HP spool angle, degrees 0-360. */
  hpAngle: number
  state: TurbofanState
  /** Bumps whenever anything above changed, so pollers can skip identical frames. */
  version: number
  listeners: Set<() => void>
}

export function createTurbofanStore(n1: number = N1.default, bpr: number = BPR.default): TurbofanStore {
  return {
    lpAngle: 0,
    hpAngle: 0,
    state: computeTurbofan(n1, bpr),
    version: 0,
    listeners: new Set(),
  }
}

const DEFAULT_SETTINGS: TurbofanSettings = {
  n1: N1.default,
  bpr: BPR.default,
  playing: true,
  speed: 1,
  viewMode: 'cutaway',
  casingMode: 'solid',
  autoRotate: true,
  showFlow: true,
  selectedPart: null,
  hoveredPart: null,
  focusStage: 'fan',
}

interface TurbofanContextValue {
  settings: TurbofanSettings
  settingsRef: RefObject<TurbofanSettings>
  update: (patch: Partial<TurbofanSettings> | ((prev: TurbofanSettings) => Partial<TurbofanSettings>)) => void
  sim: TurbofanStore
  selectPart: (part: TurbofanPartId | null) => void
  hoverPart: (part: TurbofanPartId | null) => void
  focusStage: (stage: StageId) => void
  /** Increments whenever the camera should fly back to its default framing. */
  cameraToken: number
  resetCamera: () => void
}

const TurbofanContext = createContext<TurbofanContextValue | null>(null)

export function TurbofanSimulationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<TurbofanSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef<TurbofanSettings>(settings)
  useLayoutEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [sim] = useState(() => createTurbofanStore())
  const [cameraToken, setCameraToken] = useState(0)

  const update = useCallback<TurbofanContextValue['update']>((patch) => {
    setSettings((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch
      const merged = { ...prev, ...next }
      merged.n1 = Math.min(N1.max, Math.max(N1.idle, merged.n1))
      merged.bpr = Math.min(BPR.max, Math.max(BPR.min, merged.bpr))
      return merged
    })
  }, [])

  const selectPart = useCallback((part: TurbofanPartId | null) => update({ selectedPart: part }), [update])
  const hoverPart = useCallback((part: TurbofanPartId | null) => update({ hoveredPart: part }), [update])
  const focusStage = useCallback((stage: StageId) => update({ focusStage: stage }), [update])
  const resetCamera = useCallback(() => setCameraToken((t) => t + 1), [])

  const value = useMemo<TurbofanContextValue>(
    () => ({ settings, settingsRef, update, sim, selectPart, hoverPart, focusStage, cameraToken, resetCamera }),
    [settings, update, sim, selectPart, hoverPart, focusStage, cameraToken, resetCamera],
  )

  return <TurbofanContext.Provider value={value}>{children}</TurbofanContext.Provider>
}

export function useTurbofan() {
  const ctx = useContext(TurbofanContext)
  if (!ctx) throw new Error('useTurbofan must be used inside <TurbofanSimulationProvider>')
  return ctx
}

/**
 * The cycle state for the current settings, memoised. The HUD reads this rather than the store so
 * it is a pure function of settings and works without a canvas (and in tests).
 */
export function useTurbofanState(): TurbofanState {
  const { settings } = useTurbofan()
  const { n1, bpr } = settings
  return useMemo(() => computeTurbofan(n1, bpr), [n1, bpr])
}

/** Polls the store at `fps` and re-renders only when something actually moved. */
export function useTurbofanSnapshot(fps = 24): TurbofanSnapshot {
  const { sim } = useTurbofan()
  const [snap, setSnap] = useState<TurbofanSnapshot>(() => ({ lpAngle: sim.lpAngle, hpAngle: sim.hpAngle, state: sim.state }))

  useEffect(() => {
    let raf = 0
    let last = 0
    let lastVersion = -1
    const publish = () => {
      lastVersion = sim.version
      setSnap({ lpAngle: sim.lpAngle, hpAngle: sim.hpAngle, state: sim.state })
    }
    const loop = (t: number) => {
      if (t - last >= 1000 / fps && sim.version !== lastVersion) {
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
