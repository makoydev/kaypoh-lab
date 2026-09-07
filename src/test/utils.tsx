import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { EngineSimulationProvider } from '../hooks/useEngineSimulation'

/** Render inside the engine provider, the way every HUD component is mounted in the app. */
export function renderWithEngine(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: EngineSimulationProvider, ...options })
}
