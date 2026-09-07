import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EngineSimulationProvider, createSimStore, useEngine } from '../useEngineSimulation'
import { RPM } from '../../lib/engineConfig'

const wrapper = EngineSimulationProvider

describe('createSimStore', () => {
  it('starts with resolved cylinder states', () => {
    const sim = createSimStore(90)
    expect(sim.angle).toBe(90)
    expect(sim.cylinders).toHaveLength(8)
    expect(sim.cylinders[7].stroke).toBe('power') // cylinder 8 fires at 90°
  })
})

describe('useEngine', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useEngine())).toThrow(/EngineSimulationProvider/)
  })

  it('exposes sensible defaults', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    expect(result.current.settings.playing).toBe(true)
    expect(result.current.settings.viewMode).toBe('cutaway')
    expect(result.current.settings.focusCylinder).toBe(1)
    expect(result.current.sim.angle).toBe(0)
  })

  it('clamps rpm to the idle–max range', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    act(() => result.current.update({ rpm: 99999 }))
    expect(result.current.settings.rpm).toBe(RPM.max)
    act(() => result.current.update({ rpm: 1 }))
    expect(result.current.settings.rpm).toBe(RPM.idle)
  })

  it('accepts functional updates', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    act(() => result.current.update((prev) => ({ playing: !prev.playing })))
    expect(result.current.settings.playing).toBe(false)
  })

  it('setAngle wraps to 0-720 and recomputes cylinders immediately', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    act(() => result.current.setAngle(725))
    expect(result.current.sim.angle).toBe(5)
    expect(result.current.sim.cylinders[0].phase).toBeCloseTo(5)
    act(() => result.current.stepAngle(-10))
    expect(result.current.sim.angle).toBe(715)
  })

  it('notifies subscribers when the angle is set manually', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    let calls = 0
    const listener = () => {
      calls++
    }
    result.current.sim.listeners.add(listener)
    act(() => result.current.setAngle(100))
    expect(calls).toBe(1)
  })

  it('toggles selection and hover', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    act(() => result.current.selectPart('piston'))
    expect(result.current.settings.selectedPart).toBe('piston')
    act(() => result.current.hoverPart('crankshaft'))
    expect(result.current.settings.hoveredPart).toBe('crankshaft')
    act(() => result.current.selectPart(null))
    expect(result.current.settings.selectedPart).toBeNull()
  })

  it('bumps the camera token on reset', () => {
    const { result } = renderHook(() => useEngine(), { wrapper })
    const before = result.current.cameraToken
    act(() => result.current.resetCamera())
    expect(result.current.cameraToken).toBe(before + 1)
  })
})
