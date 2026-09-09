import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithGearbox } from '../../test/utils'
import { GearboxPlayback } from '../controls/gearbox/GearboxPlayback'
import { EngineRpmSlider } from '../controls/gearbox/EngineRpmSlider'
import { GearSelector } from '../controls/gearbox/GearSelector'
import { TorqueReadout } from '../controls/gearbox/TorqueReadout'
import { RatioTable } from '../controls/gearbox/RatioTable'
import { GearboxViewModes } from '../controls/gearbox/GearboxViewModes'
import { GearboxPartInspector } from '../controls/gearbox/GearboxPartInspector'
import { HowGearboxWork } from '../education/gearbox/HowGearboxWork'
import { GearboxStatusBar } from '../layout/gearbox/GearboxStatusBar'
import { GEARBOX_PART_INFO, STEP_INFO } from '../../lib/gearboxInfo'
import { ratioOf } from '../../lib/gearboxConfig'

describe('GearboxPlayback', () => {
  it('toggles between pause and play', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<GearboxPlayback />)
    await user.click(screen.getByRole('button', { name: /pause/i }))
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1×' })).toBeChecked()
  })
})

describe('EngineRpmSlider', () => {
  it('shows engine rpm and torque and reacts to the slider', () => {
    renderWithGearbox(<EngineRpmSlider />)
    const slider = screen.getByRole('slider', { name: /engine speed/i })
    expect(slider).toHaveValue('2500')
    expect(screen.getByText('2,500')).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '7000' } })
    expect(slider).toHaveValue('7000')
    expect(screen.getByText(/redline\./i)).toBeInTheDocument()
  })
})

describe('GearSelector', () => {
  it('lays out the gate, moves the lever, and refuses reverse while rolling', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<GearSelector />)
    const group = screen.getByRole('radiogroup', { name: /gear/i })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1st' })).toBeChecked()
    expect(screen.getByText(/box in/i)).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '3rd' }))
    expect(screen.getByRole('radio', { name: '3rd' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Reverse' }))
    expect(screen.getByRole('radio', { name: 'Reverse' })).not.toBeChecked()
    expect(await screen.findByRole('status')).toHaveTextContent(/stop the car/i)
  })

  it('walks the gate with the shift buttons and toggles the synchro', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<GearSelector />)
    await user.click(screen.getByRole('button', { name: /shift up/i }))
    expect(screen.getByRole('radio', { name: '2nd' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /shift down/i }))
    await user.click(screen.getByRole('button', { name: /shift down/i }))
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked()
    const synchro = screen.getByRole('switch')
    expect(synchro).toHaveAttribute('aria-checked', 'true')
    await user.click(synchro)
    expect(synchro).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByText(/listen for the crunch/i)).toBeInTheDocument()
  })
})

describe('TorqueReadout', () => {
  it('shows the ratio and multiplies torque by it', () => {
    renderWithGearbox(<TorqueReadout />)
    expect(screen.getByText(`×${ratioOf('1').toFixed(2)}`)).toBeInTheDocument()
    expect(screen.getByText(/torque at the output/i)).toBeInTheDocument()
    expect(screen.getByText(/road speed/i)).toBeInTheDocument()
    expect(screen.getByText(/power is the same/i)).toBeInTheDocument()
  })
})

describe('RatioTable', () => {
  it('lists every gear with its teeth and shifts on click', async () => {
    const user = userEvent.setup()
    renderWithGearbox(
      <>
        <RatioTable />
        <GearSelector />
      </>,
    )
    expect(screen.getByText('14 : 29')).toBeInTheDocument()
    expect(screen.getByText('direct')).toBeInTheDocument()
    expect(screen.getByText('×1.00')).toBeInTheDocument()
    await user.click(screen.getByText('5th', { selector: 'td' }))
    expect(screen.getByRole('radio', { name: '5th' })).toBeChecked()
  })
})

describe('GearboxViewModes', () => {
  it('locks the casing outside cutaway and toggles the torque path', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<GearboxViewModes />)
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeEnabled()
    await user.click(screen.getByText('Synchro Focus'))
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeDisabled()
    expect(screen.getByText(/follows whichever hub/i)).toBeInTheDocument()
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('aria-checked', 'true')
    await user.click(switches[0])
    expect(switches[0]).toHaveAttribute('aria-checked', 'false')
  })
})

describe('GearboxPartInspector', () => {
  it('shows an explainer card for a chip and clears it again', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<GearboxPartInspector />)
    expect(screen.getByText(/click any part/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^synchroniser$/i }))
    expect(await screen.findByText(GEARBOX_PART_INFO.synchro.tagline)).toBeInTheDocument()
    expect(screen.getByText(GEARBOX_PART_INFO.synchro.kaypohFact)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(await screen.findByText(/click any part/i)).toBeInTheDocument()
  })
})

describe('HowGearboxWork', () => {
  it('walks the four steps and can set the 3D view up for one', async () => {
    const user = userEvent.setup()
    renderWithGearbox(
      <>
        <HowGearboxWork />
        <GearboxViewModes />
        <GearSelector />
      </>,
    )
    expect(screen.getByRole('button', { name: /how like dat work/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(STEP_INFO.mesh.headline)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /3\s*Synchro/i }))
    expect(await screen.findByText(STEP_INFO.synchro.headline)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /gearbox schematic, synchronise/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show in 3d/i }))
    expect(screen.getByText(/follows whichever hub/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '2nd' })).toBeChecked()
  })

  it('collapses', async () => {
    const user = userEvent.setup()
    renderWithGearbox(<HowGearboxWork defaultOpen={false} />)
    const toggle = screen.getByRole('button', { name: /how like dat work/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('GearboxStatusBar', () => {
  it('reports engine rpm, the gear, its ratio and the time scale', () => {
    renderWithGearbox(<GearboxStatusBar />)
    expect(screen.getByText('2,500')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(`×${ratioOf('1').toFixed(2)}`)).toBeInTheDocument()
    expect(screen.getByText('1:40')).toBeInTheDocument()
    expect(screen.getByText('km/h')).toBeInTheDocument()
  })
})
