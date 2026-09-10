import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { EngineSimulationProvider } from '../hooks/useEngineSimulation'
import { TurbofanSimulationProvider } from '../hooks/useTurbofanSimulation'
import { GearboxSimulationProvider } from '../hooks/useGearboxSimulation'
import { EscapementSimulationProvider } from '../hooks/useEscapementSimulation'

/** Render inside the engine provider, the way every HUD component is mounted in the app. */
export function renderWithEngine(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: EngineSimulationProvider, ...options })
}

/** Render inside the turbofan provider. */
export function renderWithTurbofan(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: TurbofanSimulationProvider, ...options })
}

/** Render inside the gearbox provider. */
export function renderWithGearbox(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: GearboxSimulationProvider, ...options })
}

/** Render inside the escapement provider. */
export function renderWithEscapement(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: EscapementSimulationProvider, ...options })
}

/** All providers, the way `App` mounts them. */
export function AllProviders({ children }: { children: ReactNode }) {
  return (
    <EngineSimulationProvider>
      <TurbofanSimulationProvider>
        <GearboxSimulationProvider>
          <EscapementSimulationProvider>{children}</EscapementSimulationProvider>
        </GearboxSimulationProvider>
      </TurbofanSimulationProvider>
    </EngineSimulationProvider>
  )
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options })
}
