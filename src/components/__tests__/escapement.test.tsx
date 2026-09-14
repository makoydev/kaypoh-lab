import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { REGULATOR } from '../../lib/escapementConfig'
import { renderWithEscapement } from '../../test/utils'
import { EscapementPlayback } from '../controls/escapement/EscapementPlayback'
import { MainspringSlider } from '../controls/escapement/MainspringSlider'
import { RateControls } from '../controls/escapement/RateControls'
import { BeatReadout } from '../controls/escapement/BeatReadout'
import { EscapementViewModes } from '../controls/escapement/EscapementViewModes'
import { NumbersTable } from '../controls/escapement/NumbersTable'
import { EscapementPartInspector } from '../controls/escapement/EscapementPartInspector'
import { HowEscapementWork } from '../education/escapement/HowEscapementWork'
import { EscapementStatusBar } from '../layout/escapement/EscapementStatusBar'
import { ESCAPEMENT_PART_INFO, ESCAPEMENT_STEP_INFO } from '../../lib/escapementInfo'
import { MAINSPRING, amplitudeFor } from '../../lib/escapementConfig'

describe('EscapementPlayback', () => {
  it('toggles between pause and play', async () => {
    const user = userEvent.setup()
    renderWithEscapement(<EscapementPlayback />)
    await user.click(screen.getByRole('button', { name: /pause/i }))
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1×' })).toBeChecked()
  })
})

describe('MainspringSlider', () => {
  it('shows the amplitude and reacts to the wind', () => {
    renderWithEscapement(<MainspringSlider />)
    const slider = screen.getByRole('slider', { name: /mainspring/i })
    expect(slider).toHaveValue(String(MAINSPRING.defaultWind))
    expect(screen.getByText(String(Math.round(amplitudeFor(MAINSPRING.defaultWind))))).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '15' } })
    expect(slider).toHaveValue('15')
    expect(screen.getByText(/nearly run down/i)).toBeInTheDocument()
  })
})

describe('RateControls', () => {
  it('offers the four real beat rates and a regulator in seconds per day', async () => {
    const user = userEvent.setup()
    renderWithEscapement(<RateControls />)
    expect(screen.getByRole('radio', { name: '28,800' })).toBeChecked()
    expect(screen.getByText(/4 Hz · 125 ms per tick/)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '18,000' }))
    expect(screen.getByRole('radio', { name: '18,000' })).toBeChecked()
    expect(screen.getByText(/2\.5 Hz · 200 ms per tick/)).toBeInTheDocument()
    const reg = screen.getByRole('slider', { name: /regulator/i })
    fireEvent.change(reg, { target: { value: '120' } })
    expect(reg).toHaveValue('120')
    expect(screen.getByText(/noticeable by the weekend/i)).toBeInTheDocument()
  })

  it('can be regulated into the chronometer band', () => {
    renderWithEscapement(<RateControls />)
    const reg = screen.getByRole('slider', { name: /regulator/i })
    // The step has to be fine enough to land inside −4 to +6, not skip from 0 straight past it.
    fireEvent.change(reg, { target: { value: String(REGULATOR.step) } })
    expect(reg).toHaveValue(String(REGULATOR.step))
    expect(screen.getByText(/chronometer grade/i)).toBeInTheDocument()
  })
})

describe('BeatReadout', () => {
  it('reports the beat, keeps the stepper for paused mode, and steps a whole tick', async () => {
    const user = userEvent.setup()
    renderWithEscapement(
      <>
        <BeatReadout />
        <EscapementPlayback />
      </>,
    )
    expect(screen.getByText(/free swing/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /beat progress/i })).toBeInTheDocument()
    const next = screen.getByRole('button', { name: /next tick/i })
    expect(next).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /pause/i }))
    expect(next).toBeEnabled()
    await user.click(next)
    expect(await screen.findByText('1')).toBeInTheDocument()
    expect(screen.getByText('00:00.125')).toBeInTheDocument()
  })
})

describe('EscapementViewModes', () => {
  it('locks the plate control outside the bench view and toggles the sound', async () => {
    const user = userEvent.setup()
    renderWithEscapement(<EscapementViewModes />)
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeEnabled()
    await user.click(screen.getByText('Pallet Focus'))
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeDisabled()
    expect(screen.getByText(/slow it to 0\.1×/i)).toBeInTheDocument()
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('aria-checked', 'false')
    await user.click(switches[0])
    expect(switches[0]).toHaveAttribute('aria-checked', 'true')
  })
})

describe('NumbersTable', () => {
  it('lists the escapement geometry', () => {
    renderWithEscapement(<NumbersTable />)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('12°')).toBeInTheDocument()
    expect(screen.getByText('16 rpm')).toBeInTheDocument()
  })
})

describe('EscapementPartInspector', () => {
  it('shows an explainer card for a chip and clears it again', async () => {
    const user = userEvent.setup()
    renderWithEscapement(<EscapementPartInspector />)
    expect(screen.getByText(/click any part/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^pallet jewels$/i }))
    expect(await screen.findByText(ESCAPEMENT_PART_INFO.pallets.tagline)).toBeInTheDocument()
    expect(screen.getByText(ESCAPEMENT_PART_INFO.pallets.kaypohFact)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(await screen.findByText(/click any part/i)).toBeInTheDocument()
  })
})

describe('HowEscapementWork', () => {
  it('walks the four steps and can set the 3D view up for one', async () => {
    const user = userEvent.setup()
    renderWithEscapement(
      <>
        <HowEscapementWork />
        <EscapementViewModes />
        <EscapementPlayback />
      </>,
    )
    expect(screen.getByRole('button', { name: /how like dat work/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(ESCAPEMENT_STEP_INFO.swing.headline)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /3\s*Impulse/i }))
    expect(await screen.findByText(ESCAPEMENT_STEP_INFO.impulse.headline)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /escapement schematic, impulse/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show in 3d/i }))
    expect(screen.getByText(/slow it to 0\.1×/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '0.1×' })).toBeChecked()
  })

  it('collapses', async () => {
    const user = userEvent.setup()
    renderWithEscapement(<HowEscapementWork defaultOpen={false} />)
    const toggle = screen.getByRole('button', { name: /how like dat work/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('EscapementStatusBar', () => {
  it('reports the beat rate, frequency, amplitude and time scale', () => {
    renderWithEscapement(<EscapementStatusBar />)
    expect(screen.getByText('28,800')).toBeInTheDocument()
    expect(screen.getByText('4.000')).toBeInTheDocument()
    expect(screen.getByText(String(Math.round(amplitudeFor(MAINSPRING.defaultWind))))).toBeInTheDocument()
    expect(screen.getByText('1:8')).toBeInTheDocument()
  })
})
