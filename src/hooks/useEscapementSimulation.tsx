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
import type { BeatRate, EscapementPartId, EscapementSettings, EscapementSimState, EscapementSnapshot } from '../types/escapement'
import { DEFAULT_BEAT_RATE, MAINSPRING, REGULATOR } from '../lib/escapementConfig'
import { createEscapementSimState, stepBeats } from '../lib/escapementModel'

/**
 * Per-frame escapement state, outside React. The driver calls `stepEscapement` on it once per frame;
 * meshes read angles directly, the HUD polls it through `useEscapementSnapshot`. Same pattern as the
 * other three stores (decision 010).
 */
export interface EscapementStore extends EscapementSimState {
  /** Bumps whenever anything above changed, so pollers can skip identical frames. */
  version: number
  listeners: Set<() => void>
}

export function createEscapementStore(beatRate: BeatRate = DEFAULT_BEAT_RATE, wind: number = MAINSPRING.defaultWind): EscapementStore {
  return { ...createEscapementSimState(beatRate, wind), version: 0, listeners: new Set() }
}

const DEFAULT_SETTINGS: EscapementSettings = {
  beatRate: DEFAULT_BEAT_RATE,
  wind: MAINSPRING.defaultWind,
  regulator: 0,
  playing: true,
  speed: 1,
  viewMode: 'cutaway',
  casingMode: 'solid',
  autoRotate: true,
  sound: false,
  selectedPart: null,
  hoveredPart: null,
}

interface EscapementContextValue {
  settings: EscapementSettings
  settingsRef: RefObject<EscapementSettings>
  update: (patch: Partial<EscapementSettings> | ((prev: EscapementSettings) => Partial<EscapementSettings>)) => void
  sim: EscapementStore
  selectPart: (part: EscapementPartId | null) => void
  hoverPart: (part: EscapementPartId | null) => void
  /** Move the balance by a fraction of a beat while paused (a whole beat = one tick). */
  step: (beats: number) => void
  /** Increments whenever the camera should fly back to its default framing. */
  cameraToken: number
  resetCamera: () => void
}

const EscapementContext = createContext<EscapementContextValue | null>(null)

const clampSetting = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function EscapementSimulationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EscapementSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef<EscapementSettings>(settings)
  useLayoutEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [sim] = useState(() => createEscapementStore())
  const [cameraToken, setCameraToken] = useState(0)

  const update = useCallback<EscapementContextValue['update']>((patch) => {
    setSettings((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch
      const merged = { ...prev, ...next }
      merged.wind = Math.round(clampSetting(merged.wind, MAINSPRING.minWind, MAINSPRING.maxWind))
      merged.regulator = Math.round(clampSetting(merged.regulator, -REGULATOR.range, REGULATOR.range) / REGULATOR.step) * REGULATOR.step
      return merged
    })
  }, [])

  const selectPart = useCallback((part: EscapementPartId | null) => update({ selectedPart: part }), [update])
  const hoverPart = useCallback((part: EscapementPartId | null) => update({ hoveredPart: part }), [update])

  const step = useCallback(
    (beats: number) => {
      stepBeats(sim, beats, settingsRef.current.beatRate)
      sim.version++
      sim.listeners.forEach((l) => l())
    },
    [sim],
  )

  const resetCamera = useCallback(() => setCameraToken((t) => t + 1), [])

  const value = useMemo<EscapementContextValue>(
    () => ({ settings, settingsRef, update, sim, selectPart, hoverPart, step, cameraToken, resetCamera }),
    [settings, update, sim, selectPart, hoverPart, step, cameraToken, resetCamera],
  )

  return <EscapementContext.Provider value={value}>{children}</EscapementContext.Provider>
}

export function useEscapement() {
  const ctx = useContext(EscapementContext)
  if (!ctx) throw new Error('useEscapement must be used inside <EscapementSimulationProvider>')
  return ctx
}

const snapshotOf = (sim: EscapementStore): EscapementSnapshot => ({
  balanceAngle: sim.balanceAngle,
  forkAngle: sim.forkAngle,
  escapeAngle: sim.escapeAngle,
  amplitude: sim.amplitude,
  phase: sim.escPhase,
  pallet: sim.pallet,
  beats: sim.beats,
  watchSeconds: sim.watchSeconds,
  secondsAngle: sim.secondsAngle,
  frequencyHz: sim.frequencyHz,
  s: sim.s,
})

/** Polls the store at `fps` and re-renders only when something actually moved. */
export function useEscapementSnapshot(fps = 24): EscapementSnapshot {
  const { sim } = useEscapement()
  const [snap, setSnap] = useState<EscapementSnapshot>(() => snapshotOf(sim))

  useEffect(() => {
    let raf = 0
    let last = 0
    let lastVersion = -1
    const publish = () => {
      lastVersion = sim.version
      setSnap(snapshotOf(sim))
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
