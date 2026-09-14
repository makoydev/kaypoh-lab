import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EscapementSimulationProvider, createEscapementStore, useEscapement } from '../useEscapementSimulation'
import { ADVANCE_PER_BEAT, ESCAPE_ANGLE_0, MAINSPRING, REGULATOR, amplitudeFor } from '../../lib/escapementConfig'

const wrapper = EscapementSimulationProvider

describe('createEscapementStore', () => {
  it('starts with the exit pallet locked and the balance at the end of its swing', () => {
    const sim = createEscapementStore(28800, 80)
    expect(sim.escapeAngle).toBeCloseTo(ESCAPE_ANGLE_0, 9)
    expect(sim.amplitude).toBe(amplitudeFor(80))
    expect(sim.balanceAngle).toBeCloseTo(-amplitudeFor(80), 9)
    expect(sim.escPhase).toBe('free')
    expect(sim.version).toBe(0)
  })
})

describe('useEscapement', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useEscapement())).toThrow(/EscapementSimulationProvider/)
  })

  it('exposes sensible defaults', () => {
    const { result } = renderHook(() => useEscapement(), { wrapper })
    expect(result.current.settings.beatRate).toBe(28800)
    expect(result.current.settings.wind).toBe(MAINSPRING.defaultWind)
    expect(result.current.settings.regulator).toBe(0)
    expect(result.current.settings.playing).toBe(true)
    expect(result.current.settings.viewMode).toBe('cutaway')
    expect(result.current.settings.sound).toBe(false)
  })

  it('clamps the mainspring and snaps the regulator to its steps', () => {
    const { result } = renderHook(() => useEscapement(), { wrapper })
    act(() => result.current.update({ wind: 999 }))
    expect(result.current.settings.wind).toBe(MAINSPRING.maxWind)
    act(() => result.current.update({ wind: -5 }))
    expect(result.current.settings.wind).toBe(MAINSPRING.minWind)
    act(() => result.current.update({ regulator: 9999 }))
    expect(result.current.settings.regulator).toBe(REGULATOR.range)
    act(() => result.current.update({ regulator: REGULATOR.step * 3 + 1 }))
    expect(result.current.settings.regulator).toBe(REGULATOR.step * 3)
  })

  it('steps the balance by beats and notifies listeners', () => {
    const { result } = renderHook(() => useEscapement(), { wrapper })
    let calls = 0
    result.current.sim.listeners.add(() => calls++)
    act(() => result.current.step(1))
    expect(result.current.sim.beats).toBe(1)
    expect(result.current.sim.escapeAngle - ESCAPE_ANGLE_0).toBeCloseTo(ADVANCE_PER_BEAT, 6)
    expect(result.current.sim.version).toBe(1)
    expect(calls).toBe(1)
  })

  it('accepts functional updates and part selection', () => {
    const { result } = renderHook(() => useEscapement(), { wrapper })
    act(() => result.current.update((prev) => ({ playing: !prev.playing })))
    expect(result.current.settings.playing).toBe(false)
    act(() => result.current.selectPart('pallets'))
    expect(result.current.settings.selectedPart).toBe('pallets')
    act(() => result.current.hoverPart('balance'))
    expect(result.current.settings.hoveredPart).toBe('balance')
  })

  it('bumps the camera token on reset', () => {
    const { result } = renderHook(() => useEscapement(), { wrapper })
    const before = result.current.cameraToken
    act(() => result.current.resetCamera())
    expect(result.current.cameraToken).toBe(before + 1)
  })
})
