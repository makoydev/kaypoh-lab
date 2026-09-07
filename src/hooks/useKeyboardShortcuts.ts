import { useEffect } from 'react'
import { useEngine } from './useEngineSimulation'

/**
 * Space: play/pause · ←/→: step 1° (shift = 10°) when paused · 1/2/3: view modes
 * R: reset camera · C: cycle casing · Esc: clear selection
 */
export function useKeyboardShortcuts() {
  const { update, settingsRef, stepAngle, resetCamera, selectPart } = useEngine()

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
          if (!s.playing) stepAngle(e.shiftKey ? 10 : 1)
          break
        case 'ArrowLeft':
          if (!s.playing) stepAngle(e.shiftKey ? -10 : -1)
          break
        case '1':
          update({ viewMode: 'cutaway' })
          break
        case '2':
          update({ viewMode: 'xray' })
          break
        case '3':
          update({ viewMode: 'piston' })
          break
        case 'r':
        case 'R':
          resetCamera()
          break
        case 'c':
        case 'C':
          update({ casingMode: s.casingMode === 'hidden' ? 'ghost' : s.casingMode === 'ghost' ? 'solid' : 'hidden' })
          break
        case 'Escape':
          selectPart(null)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [update, settingsRef, stepAngle, resetCamera, selectPart])
}
