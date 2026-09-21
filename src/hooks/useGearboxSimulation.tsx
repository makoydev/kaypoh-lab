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
import type { GearId, GearboxPartId, GearboxSettings, GearboxSimState, GearboxSnapshot, HubId } from '../types/gearbox'
import { ENGINE } from '../lib/gearboxConfig'
import { canSelect, createGearboxSimState, nextGear } from '../lib/gearboxModel'

/**
 * Per-frame gearbox state, outside React. The driver calls `stepGearbox` on it once per frame; meshes
 * read angles and sleeve positions directly, the HUD polls it through `useGearboxSnapshot`. Same
 * pattern as the V8 and turbofan stores (decision 010).
 */
export interface GearboxStore extends GearboxSimState {
  /** Bumps whenever anything above changed, so pollers can skip identical frames. */
  version: number
  listeners: Set<() => void>
}

export function createGearboxStore(engineRpm: number = ENGINE.default, gear: GearId = '1'): GearboxStore {
  return { ...createGearboxSimState(engineRpm, gear), version: 0, listeners: new Set() }
}

const DEFAULT_SETTINGS: GearboxSettings = {
  engineRpm: ENGINE.default,
  gear: '1',
  synchro: true,
  playing: true,
  speed: 1,
  viewMode: 'cutaway',
  casingMode: 'solid',
  autoRotate: true,
  showTorquePath: true,
  selectedPart: null,
  hoveredPart: null,
}

interface GearboxContextValue {
  settings: GearboxSettings
  settingsRef: RefObject<GearboxSettings>
  update: (patch: Partial<GearboxSettings> | ((prev: GearboxSettings) => Partial<GearboxSettings>)) => void
  sim: GearboxStore
  selectPart: (part: GearboxPartId | null) => void
  hoverPart: (part: GearboxPartId | null) => void
  /** Move the lever. Refused (with a reason) when the box would not allow it, e.g. reverse while rolling. */
  selectGear: (gear: GearId) => boolean
  /** One notch up or down the R-N-1-2-3-4-5 gate. */
  shiftBy: (direction: 1 | -1) => boolean
  /** Why the last lever move was refused, cleared after a moment. */
  shiftNote: string | null
  /** Increments whenever the camera should fly back to its default framing. */
  cameraToken: number
  resetCamera: () => void
}

const GearboxContext = createContext<GearboxContextValue | null>(null)

export function GearboxSimulationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GearboxSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef<GearboxSettings>(settings)
  useLayoutEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const [sim] = useState(() => createGearboxStore())
  const [cameraToken, setCameraToken] = useState(0)
  // Wrapped in an object so repeating the same refusal is still a new note: two identical strings
  // are the same state, so React would skip the re-render and the first note's timer would run on.
  const [note, setNote] = useState<{ text: string } | null>(null)
  const shiftNote = note?.text ?? null

  const update = useCallback<GearboxContextValue['update']>((patch) => {
    setSettings((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch
      const merged = { ...prev, ...next }
      merged.engineRpm = Math.round(Math.min(ENGINE.redline, Math.max(ENGINE.idle, merged.engineRpm)))
      return merged
    })
  }, [])

  useEffect(() => {
    if (!note) return
    const id = window.setTimeout(() => setNote(null), 2600)
    return () => window.clearTimeout(id)
  }, [note])

  const selectPart = useCallback((part: GearboxPartId | null) => update({ selectedPart: part }), [update])
  const hoverPart = useCallback((part: GearboxPartId | null) => update({ hoveredPart: part }), [update])

  const selectGear = useCallback(
    (gear: GearId) => {
      const verdict = canSelect(gear, sim.engaged, sim.outputRpm)
      if (!verdict.ok) {
        setNote(verdict.reason ? { text: verdict.reason } : null)
        return false
      }
      update({ gear })
      return true
    },
    [sim, update],
  )

  const shiftBy = useCallback((direction: 1 | -1) => selectGear(nextGear(settingsRef.current.gear, direction)), [selectGear])
  const resetCamera = useCallback(() => setCameraToken((t) => t + 1), [])

  const value = useMemo<GearboxContextValue>(
    () => ({ settings, settingsRef, update, sim, selectPart, hoverPart, selectGear, shiftBy, shiftNote, cameraToken, resetCamera }),
    [settings, update, sim, selectPart, hoverPart, selectGear, shiftBy, shiftNote, cameraToken, resetCamera],
  )

  return <GearboxContext.Provider value={value}>{children}</GearboxContext.Provider>
}

export function useGearbox() {
  const ctx = useContext(GearboxContext)
  if (!ctx) throw new Error('useGearbox must be used inside <GearboxSimulationProvider>')
  return ctx
}

const snapshotOf = (sim: GearboxStore): GearboxSnapshot => ({
  inputRpm: sim.inputRpm,
  outputRpm: sim.outputRpm,
  engineRpm: sim.engineRpm,
  engaged: sim.engaged,
  shift: sim.shift,
  slipRpm: sim.slipRpm,
  crunches: sim.crunches,
  lastHub: sim.lastHub,
})

/** Polls the store at `fps` and re-renders only when something actually moved. */
export function useGearboxSnapshot(fps = 24): GearboxSnapshot {
  const { sim } = useGearbox()
  const [snap, setSnap] = useState<GearboxSnapshot>(() => snapshotOf(sim))

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

/**
 * The hub the synchro-focus view should isolate: the one doing the current or most recent shift.
 * Polled at a low rate straight from the store, so the assembly does not re-render every frame.
 */
export function useGearboxFocusHub(enabled: boolean): HubId | null {
  const { sim } = useGearbox()
  const [hub, setHub] = useState<HubId>(sim.lastHub)
  useEffect(() => {
    if (!enabled) return
    setHub(sim.lastHub)
    const id = window.setInterval(() => setHub((h) => (h === sim.lastHub ? h : sim.lastHub)), 120)
    return () => window.clearInterval(id)
  }, [enabled, sim])
  return enabled ? hub : null
}
