import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GearboxSimulationProvider, createGearboxStore, useGearbox } from '../useGearboxSimulation'
import { ENGINE, ratioOf } from '../../lib/gearboxConfig'

const wrapper = GearboxSimulationProvider

describe('createGearboxStore', () => {
  it('starts locked in gear at a steady state', () => {
    const sim = createGearboxStore(3000, '2')
    expect(sim.engaged).toBe('2')
    expect(sim.inputRpm).toBe(3000)
    expect(sim.outputRpm).toBeCloseTo(3000 / ratioOf('2'), 9)
    expect(sim.version).toBe(0)
  })
})

describe('useGearbox', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useGearbox())).toThrow(/GearboxSimulationProvider/)
  })

  it('exposes sensible defaults', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    expect(result.current.settings.engineRpm).toBe(ENGINE.default)
    expect(result.current.settings.gear).toBe('1')
    expect(result.current.settings.synchro).toBe(true)
    expect(result.current.settings.playing).toBe(true)
    expect(result.current.settings.viewMode).toBe('cutaway')
    expect(result.current.settings.showTorquePath).toBe(true)
  })

  it('clamps engine rpm', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    act(() => result.current.update({ engineRpm: 99999 }))
    expect(result.current.settings.engineRpm).toBe(ENGINE.redline)
    act(() => result.current.update({ engineRpm: 1 }))
    expect(result.current.settings.engineRpm).toBe(ENGINE.idle)
  })

  it('moves the lever through the gate and refuses reverse while rolling', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    act(() => {
      result.current.shiftBy(1)
    })
    expect(result.current.settings.gear).toBe('2')
    act(() => {
      result.current.shiftBy(-1)
    })
    act(() => {
      result.current.shiftBy(-1)
    })
    expect(result.current.settings.gear).toBe('N')
    // The store still thinks the car is rolling in 1st (no driver ran), so reverse is refused.
    let ok = true
    act(() => {
      ok = result.current.selectGear('R')
    })
    expect(ok).toBe(false)
    expect(result.current.settings.gear).toBe('N')
    expect(result.current.shiftNote).toMatch(/stop/i)
  })

  it('accepts functional updates and part selection', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    act(() => result.current.update((prev) => ({ playing: !prev.playing })))
    expect(result.current.settings.playing).toBe(false)
    act(() => result.current.selectPart('synchro'))
    expect(result.current.settings.selectedPart).toBe('synchro')
    act(() => result.current.hoverPart('clutch'))
    expect(result.current.settings.hoveredPart).toBe('clutch')
  })

  it('bumps the camera token on reset', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    const before = result.current.cameraToken
    act(() => result.current.resetCamera())
    expect(result.current.cameraToken).toBe(before + 1)
  })
})

describe('the shift note', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('clears itself after a moment', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    act(() => {
      result.current.selectGear('R')
    })
    expect(result.current.shiftNote).toMatch(/stop/i)
    act(() => void vi.advanceTimersByTime(2600))
    expect(result.current.shiftNote).toBeNull()
  })

  it('stays up for the full moment when the same refusal repeats', () => {
    const { result } = renderHook(() => useGearbox(), { wrapper })
    act(() => {
      result.current.selectGear('R')
    })
    act(() => void vi.advanceTimersByTime(2500))
    // Trying the same thing again earns a fresh window, not the tail of the first one.
    act(() => {
      result.current.selectGear('R')
    })
    act(() => void vi.advanceTimersByTime(2500))
    expect(result.current.shiftNote).toMatch(/stop/i)
    act(() => void vi.advanceTimersByTime(100))
    expect(result.current.shiftNote).toBeNull()
  })
})
