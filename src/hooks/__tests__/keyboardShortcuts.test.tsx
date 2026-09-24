import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AllProviders } from '../../test/utils'
import { useEngine } from '../useEngineSimulation'
import { useTurbofan } from '../useTurbofanSimulation'
import { useGearbox } from '../useGearboxSimulation'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts'
import { useTurbofanKeyboardShortcuts } from '../useTurbofanKeyboardShortcuts'
import { useGearboxKeyboardShortcuts } from '../useGearboxKeyboardShortcuts'
import { ignoreShortcut } from '../shortcutTarget'

const press = (key: string, init: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
  })

describe('ignoreShortcut', () => {
  const event = (init: KeyboardEventInit) => new KeyboardEvent('keydown', { key: 'c', ...init })

  it('lets a plain key through', () => {
    expect(ignoreShortcut(event({}))).toBe(false)
  })

  it('leaves browser and OS combinations alone', () => {
    expect(ignoreShortcut(event({ metaKey: true }))).toBe(true)
    expect(ignoreShortcut(event({ ctrlKey: true }))).toBe(true)
    expect(ignoreShortcut(event({ altKey: true }))).toBe(true)
  })

  it('keeps shift, the bigger-step modifier', () => {
    expect(ignoreShortcut(event({ shiftKey: true }))).toBe(false)
  })

  it('bows out while the user is typing', () => {
    const input = document.createElement('input')
    document.body.append(input)
    const e = event({})
    Object.defineProperty(e, 'target', { value: input })
    expect(ignoreShortcut(e)).toBe(true)
    input.remove()
  })

  it('lets shortcuts through a clicked button, except the keys that press it', () => {
    const button = document.createElement('button')
    document.body.append(button)
    const on = (key: string) => {
      const e = new KeyboardEvent('keydown', { key })
      Object.defineProperty(e, 'target', { value: button })
      return ignoreShortcut(e)
    }
    expect(on('c')).toBe(false)
    expect(on('Escape')).toBe(false)
    expect(on(' ')).toBe(true)
    expect(on('Enter')).toBe(true)
    button.remove()
  })

  it('leaves a focused slider its arrows but not the other shortcuts', () => {
    const range = document.createElement('input')
    range.type = 'range'
    document.body.append(range)
    const on = (key: string) => {
      const e = new KeyboardEvent('keydown', { key })
      Object.defineProperty(e, 'target', { value: range })
      return ignoreShortcut(e)
    }
    expect(on('ArrowRight')).toBe(true)
    expect(on(' ')).toBe(false)
    expect(on('1')).toBe(false)
    range.remove()
  })

  it('leaves a key alone once something else claimed it', () => {
    const e = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    e.preventDefault()
    expect(ignoreShortcut(e)).toBe(true)
  })

  it('ignores a held toggle key but keeps stepping keys repeating', () => {
    expect(ignoreShortcut(event({ key: ' ', repeat: true }))).toBe(true)
    expect(ignoreShortcut(event({ key: 'c', repeat: true }))).toBe(true)
    expect(ignoreShortcut(event({ key: 'ArrowUp', repeat: true }))).toBe(true)
    expect(ignoreShortcut(event({ key: 'ArrowRight', repeat: true }))).toBe(false)
    expect(ignoreShortcut(event({ key: '.', repeat: true }))).toBe(false)
  })

  it('bows out inside a contenteditable', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    document.body.append(div)
    const e = event({})
    Object.defineProperty(e, 'target', { value: div })
    expect(ignoreShortcut(e)).toBe(true)
    div.remove()
  })
})

describe('module shortcuts', () => {
  it('cycles the V8 casing on C but not on ⌘C', () => {
    const { result } = renderHook(
      () => {
        useKeyboardShortcuts()
        return useEngine()
      },
      { wrapper: AllProviders },
    )
    const before = result.current.settings.casingMode
    press('c', { metaKey: true })
    expect(result.current.settings.casingMode).toBe(before)
    press('c')
    expect(result.current.settings.casingMode).not.toBe(before)
  })

  it('leaves the turbofan view mode alone on ⌘1', () => {
    const { result } = renderHook(
      () => {
        useTurbofanKeyboardShortcuts()
        return useTurbofan()
      },
      { wrapper: AllProviders },
    )
    press('2')
    expect(result.current.settings.viewMode).toBe('xray')
    press('1', { metaKey: true })
    expect(result.current.settings.viewMode).toBe('xray')
  })

  it('does not toggle the torque path when the user prints with ⌘P', () => {
    const { result } = renderHook(
      () => {
        useGearboxKeyboardShortcuts()
        return useGearbox()
      },
      { wrapper: AllProviders },
    )
    const before = result.current.settings.showTorquePath
    press('p', { metaKey: true })
    expect(result.current.settings.showTorquePath).toBe(before)
    press('p')
    expect(result.current.settings.showTorquePath).toBe(!before)
  })
})
