import { useEffect } from 'react'
import { useGearbox } from './useGearboxSimulation'

/**
 * Space: play/pause · ↑/↓: shift up/down the gate · N: neutral · ←/→: engine rpm ∓/± 100 (shift = 500)
 * 1/2/3: view modes · C: cycle casing · P: torque path · S: synchro on/off · R: reset camera · Esc: clear selection
 */
export function useGearboxKeyboardShortcuts() {
  const { update, settingsRef, resetCamera, selectPart, selectGear, shiftBy } = useGearbox()

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
        case 'ArrowUp':
          e.preventDefault()
          shiftBy(1)
          break
        case 'ArrowDown':
          e.preventDefault()
          shiftBy(-1)
          break
        case 'ArrowRight':
          update({ engineRpm: s.engineRpm + (e.shiftKey ? 500 : 100) })
          break
        case 'ArrowLeft':
          update({ engineRpm: s.engineRpm - (e.shiftKey ? 500 : 100) })
          break
        case 'n':
        case 'N':
          selectGear('N')
          break
        case '1':
          update({ viewMode: 'cutaway' })
          break
        case '2':
          update({ viewMode: 'xray' })
          break
        case '3':
          update({ viewMode: 'synchro' })
          break
        case 'c':
        case 'C':
          update({ casingMode: s.casingMode === 'hidden' ? 'ghost' : s.casingMode === 'ghost' ? 'solid' : 'hidden' })
          break
        case 'p':
        case 'P':
          update({ showTorquePath: !s.showTorquePath })
          break
        case 's':
        case 'S':
          update({ synchro: !s.synchro })
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
  }, [update, settingsRef, resetCamera, selectPart, selectGear, shiftBy])
}

export const GEARBOX_SHORTCUTS: [string[], string][] = [
  [['Space'], 'Play / pause'],
  [['↑', '↓'], 'Shift up / down'],
  [['N'], 'Neutral'],
  [['←', '→'], 'Engine −/+ 100 rpm'],
  [['Shift', '←/→'], 'Engine −/+ 500 rpm'],
  [['1', '2', '3'], 'Cutaway / X-ray / Synchro focus'],
  [['C'], 'Cycle casing'],
  [['P'], 'Toggle torque path'],
  [['S'], 'Synchro on / off'],
  [['R'], 'Reset camera'],
  [['Esc'], 'Clear selection'],
]
