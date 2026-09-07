import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TurbofanSimulationProvider, createTurbofanStore, useTurbofan, useTurbofanState } from '../useTurbofanSimulation'
import { BPR, N1 } from '../../lib/turbofanConfig'

const wrapper = TurbofanSimulationProvider

describe('createTurbofanStore', () => {
  it('starts at rest with a resolved cycle state', () => {
    const sim = createTurbofanStore(80, 6)
    expect(sim.lpAngle).toBe(0)
    expect(sim.hpAngle).toBe(0)
    expect(sim.state.n1).toBe(80)
    expect(sim.state.bpr).toBe(6)
    expect(sim.state.stations.length).toBeGreaterThan(5)
  })
})

describe('useTurbofan', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useTurbofan())).toThrow(/TurbofanSimulationProvider/)
  })

  it('exposes sensible defaults', () => {
    const { result } = renderHook(() => useTurbofan(), { wrapper })
    expect(result.current.settings.playing).toBe(true)
    expect(result.current.settings.n1).toBe(N1.default)
    expect(result.current.settings.bpr).toBe(BPR.default)
    expect(result.current.settings.viewMode).toBe('cutaway')
    expect(result.current.settings.focusStage).toBe('fan')
    expect(result.current.settings.showFlow).toBe(true)
  })

  it('clamps N1 and bypass ratio to their ranges', () => {
    const { result } = renderHook(() => useTurbofan(), { wrapper })
    act(() => result.current.update({ n1: 999, bpr: 99 }))
    expect(result.current.settings.n1).toBe(N1.max)
    expect(result.current.settings.bpr).toBe(BPR.max)
    act(() => result.current.update({ n1: -5, bpr: 0 }))
    expect(result.current.settings.n1).toBe(N1.idle)
    expect(result.current.settings.bpr).toBe(BPR.min)
  })

  it('accepts functional updates and part selection', () => {
    const { result } = renderHook(() => useTurbofan(), { wrapper })
    act(() => result.current.update((prev) => ({ playing: !prev.playing })))
    expect(result.current.settings.playing).toBe(false)
    act(() => result.current.selectPart('combustor'))
    expect(result.current.settings.selectedPart).toBe('combustor')
    act(() => result.current.hoverPart('fan'))
    expect(result.current.settings.hoveredPart).toBe('fan')
    act(() => result.current.focusStage('hpTurbine'))
    expect(result.current.settings.focusStage).toBe('hpTurbine')
  })

  it('bumps the camera token on reset', () => {
    const { result } = renderHook(() => useTurbofan(), { wrapper })
    const before = result.current.cameraToken
    act(() => result.current.resetCamera())
    expect(result.current.cameraToken).toBe(before + 1)
  })
})

describe('useTurbofanState', () => {
  it('follows the throttle without a canvas', () => {
    const { result } = renderHook(() => ({ api: useTurbofan(), state: useTurbofanState() }), { wrapper })
    const idleThrust = result.current.state.thrust.total
    act(() => result.current.api.update({ n1: 100 }))
    expect(result.current.state.n1).toBe(100)
    expect(result.current.state.thrust.total).toBeGreaterThan(idleThrust)
  })
})
