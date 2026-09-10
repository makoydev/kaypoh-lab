import { useEffect } from 'react'
import { useEscapement } from './useEscapementSimulation'

/**
 * Space: play/pause · ←/→: wind ∓/± 5 % (shift = 20 %) · , / .: step ⅛ beat when paused (shift = one beat)
 * 1/2/3: view modes · C: cycle plate · S: sound · R: reset camera · Esc: clear selection
 */
export function useEscapementKeyboardShortcuts() {
  const { update, settingsRef, resetCamera, selectPart, step } = useEscapement()

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
          update({ wind: s.wind + (e.shiftKey ? 20 : 5) })
          break
        case 'ArrowLeft':
          update({ wind: s.wind - (e.shiftKey ? 20 : 5) })
          break
        case ',':
        case '<':
          if (!s.playing) step(e.shiftKey ? -1 : -0.125)
          break
        case '.':
        case '>':
          if (!s.playing) step(e.shiftKey ? 1 : 0.125)
          break
        case '1':
          update({ viewMode: 'cutaway' })
          break
        case '2':
          update({ viewMode: 'xray' })
          break
        case '3':
          update({ viewMode: 'pallet' })
          break
        case 'c':
        case 'C':
          update({ casingMode: s.casingMode === 'hidden' ? 'ghost' : s.casingMode === 'ghost' ? 'solid' : 'hidden' })
          break
        case 's':
        case 'S':
          update({ sound: !s.sound })
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
  }, [update, settingsRef, resetCamera, selectPart, step])
}

export const ESCAPEMENT_SHORTCUTS: [string[], string][] = [
  [['Space'], 'Play / pause'],
  [['←', '→'], 'Mainspring −/+ 5 %'],
  [['Shift', '←/→'], 'Mainspring −/+ 20 %'],
  [[',', '.'], 'Step ⅛ beat when paused'],
  [['Shift', ',/.'], 'Step one whole beat'],
  [['1', '2', '3'], 'Cutaway / X-ray / Pallet focus'],
  [['C'], 'Cycle plate & bridges'],
  [['S'], 'Tick sound on / off'],
  [['R'], 'Reset camera'],
  [['Esc'], 'Clear selection'],
]
