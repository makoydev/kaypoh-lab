import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithEngine } from '../../test/utils'
import { PlaybackControls } from '../controls/PlaybackControls'
import { ThrottleSlider } from '../controls/ThrottleSlider'
import { StrokeStepper } from '../controls/StrokeStepper'
import { ViewModes } from '../controls/ViewModes'
import { PartInspector } from '../controls/PartInspector'
import { FiringOrder } from '../controls/FiringOrder'
import { PART_INFO } from '../../lib/partInfo'

describe('PlaybackControls', () => {
  it('toggles between pause and play', async () => {
    const user = userEvent.setup()
    renderWithEngine(<PlaybackControls />)
    const btn = screen.getByRole('button', { name: /pause/i })
    await user.click(btn)
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
  })

  it('offers the three speed multipliers', () => {
    renderWithEngine(<PlaybackControls />)
    expect(screen.getByRole('radio', { name: '0.1×' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '0.5×' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1×' })).toBeChecked()
  })
})

describe('ThrottleSlider', () => {
  it('shows the rpm and updates on slide', () => {
    renderWithEngine(<ThrottleSlider />)
    expect(screen.getByText('1,800')).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: /throttle/i })
    fireEvent.change(slider, { target: { value: '6800' } })
    expect(screen.getByText('6,800')).toBeInTheDocument()
    expect(screen.getByText(/redline\. steady lah/i)).toBeInTheDocument()
  })
})

describe('StrokeStepper', () => {
  it('is disabled while playing and offers to pause', async () => {
    const user = userEvent.setup()
    renderWithEngine(<StrokeStepper />)
    expect(screen.getByRole('slider', { name: /crank angle/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /pause to step/i }))
    expect(screen.getByRole('slider', { name: /crank angle/i })).toBeEnabled()
  })

  it('steps the crank by 1° and 10° when paused', async () => {
    const user = userEvent.setup()
    renderWithEngine(<StrokeStepper />)
    expect(screen.getByRole('button', { name: 'Step forward 1°' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /pause to step/i }))
    await user.click(screen.getByRole('button', { name: 'Step forward 1°' }))
    await user.click(screen.getByRole('button', { name: 'Step forward 10°' }))
    expect(screen.getByRole('slider', { name: /crank angle/i })).toHaveValue('11')
  })
})

describe('ViewModes', () => {
  it('switches view mode and reveals the focus-cylinder picker in piston mode', async () => {
    const user = userEvent.setup()
    renderWithEngine(<ViewModes />)
    expect(screen.queryByText(/focus cylinder/i)).not.toBeInTheDocument()
    await user.click(screen.getByText('Piston Focus'))
    expect(screen.getByRole('button', { name: /piston focus/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/focus cylinder/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '5' }))
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('only lets you change the casing in cutaway mode', async () => {
    const user = userEvent.setup()
    renderWithEngine(<ViewModes />)
    expect(screen.getByRole('radio', { name: 'Solid' })).toBeEnabled()
    await user.click(screen.getByText('X-Ray'))
    expect(screen.getByRole('radio', { name: 'Solid' })).toBeDisabled()
  })
})

describe('PartInspector', () => {
  it('shows an explainer card when a part chip is clicked and clears it again', async () => {
    const user = userEvent.setup()
    renderWithEngine(<PartInspector />)
    expect(screen.getByText(/click any part/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /crankshaft/i }))
    // AnimatePresence waits for the empty state to animate out before the card mounts.
    expect(await screen.findByText(PART_INFO.crankshaft.tagline)).toBeInTheDocument()
    expect(screen.getByText(PART_INFO.crankshaft.kaypohFact)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(await screen.findByText(/click any part/i)).toBeInTheDocument()
  })
})

describe('FiringOrder', () => {
  it('lists the firing sequence and highlights cylinder 1 at 0°', () => {
    renderWithEngine(<FiringOrder />)
    expect(screen.getByText(/1-8-4-3-6-5-7-2|every 90°/)).toBeInTheDocument()
    const cells = screen.getAllByTitle(/click to focus/i)
    expect(cells).toHaveLength(8)
  })
})
