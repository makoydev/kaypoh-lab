import { useEffect } from 'react'
import { useTurbofan } from './useTurbofanSimulation'

/**
 * Space: play/pause · ←/→: N1 ∓/± 1 % (shift = 5 %) · 1/2/3: view modes · C: cycle casing
 * F: toggle air flow · R: reset camera · Esc: clear selection
 */
export function useTurbofanKeyboardShortcuts() {
  const { update, settingsRef, resetCamera, selectPart } = useTurbofan()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return
      const s = settingsRef.current
      switch (e.key) {
        case ' ':
          e.preventDefault()
          update({ playing: !s.playing })
          break
        case 'ArrowRight':
          update({ n1: s.n1 + (e.shiftKey ? 5 : 1) })
          break
        case 'ArrowLeft':
          update({ n1: s.n1 - (e.shiftKey ? 5 : 1) })
          break
        case '1':
          update({ viewMode: 'cutaway' })
          break
        case '2':
          update({ viewMode: 'xray' })
          break
        case '3':
          update({ viewMode: 'stage' })
          break
        case 'c':
        case 'C':
          update({ casingMode: s.casingMode === 'hidden' ? 'ghost' : s.casingMode === 'ghost' ? 'solid' : 'hidden' })
          break
        case 'f':
        case 'F':
          update({ showFlow: !s.showFlow })
          break
        case 'r':
        case 'R':
          resetCamera()
          break
        case 'Escape':
          selectPart(null)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [update, settingsRef, resetCamera, selectPart])
}

export const TURBOFAN_SHORTCUTS: [string[], string][] = [
  [['Space'], 'Play / pause'],
  [['←', '→'], 'N1 −/+ 1 %'],
  [['Shift', '←/→'], 'N1 −/+ 5 %'],
  [['1', '2', '3'], 'Cutaway / X-ray / Stage focus'],
  [['C'], 'Cycle casing'],
  [['F'], 'Toggle air flow'],
  [['R'], 'Reset camera'],
  [['Esc'], 'Clear selection'],
]
