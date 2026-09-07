import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithTurbofan } from '../../test/utils'
import { TurbofanPlayback } from '../controls/turbofan/TurbofanPlayback'
import { N1Throttle } from '../controls/turbofan/N1Throttle'
import { BypassRatioSlider } from '../controls/turbofan/BypassRatioSlider'
import { ThrustSplit } from '../controls/turbofan/ThrustSplit'
import { StationStrip } from '../controls/turbofan/StationStrip'
import { TurbofanViewModes } from '../controls/turbofan/TurbofanViewModes'
import { TurbofanPartInspector } from '../controls/turbofan/TurbofanPartInspector'
import { HowTurbofanWork } from '../education/turbofan/HowTurbofanWork'
import { TurbofanStatusBar } from '../layout/turbofan/TurbofanStatusBar'
import { TURBOFAN_PART_INFO } from '../../lib/turbofanInfo'
import { PHASE_INFO } from '../../lib/turbofanInfo'
import { STATIONS } from '../../lib/turbofanConfig'

describe('TurbofanPlayback', () => {
  it('toggles between pause and play', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(<TurbofanPlayback />)
    await user.click(screen.getByRole('button', { name: /pause/i }))
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1×' })).toBeChecked()
  })
})

describe('N1Throttle', () => {
  it('shows N1 with its rpm and reacts to the slider', () => {
    renderWithTurbofan(<N1Throttle />)
    const slider = screen.getByRole('slider', { name: /throttle/i })
    expect(slider).toHaveValue('60')
    expect(screen.getByText(/fan 1,980 rpm/i)).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '100' } })
    expect(slider).toHaveValue('100')
    expect(screen.getByText(/takeoff power/i)).toBeInTheDocument()
    expect(screen.getByText(/fan 3,300 rpm/i)).toBeInTheDocument()
  })
})

describe('BypassRatioSlider', () => {
  it('shows the ratio, the split, and a cheaper fuel figure at higher bypass', () => {
    renderWithTurbofan(<BypassRatioSlider />)
    expect(screen.getByText('8.0')).toBeInTheDocument()
    expect(screen.getByText(/89 % of the air bypasses/i)).toBeInTheDocument()
    const fuel = () => parseFloat(screen.getByText(/fuel per kn/i).nextElementSibling!.textContent!)
    const before = fuel()
    const slider = screen.getByRole('slider', { name: /bypass ratio/i })
    fireEvent.change(slider, { target: { value: '12' } })
    expect(screen.getByText('12.0')).toBeInTheDocument()
    expect(screen.getByText(/very high bypass/i)).toBeInTheDocument()
    expect(fuel()).toBeLessThan(before)
  })
})

describe('ThrustSplit', () => {
  it('reports total thrust and the fan share', () => {
    renderWithTurbofan(<ThrustSplit />)
    expect(screen.getByText('kN')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /bypass \d+ percent, core \d+ percent/i })).toBeInTheDocument()
    expect(screen.getByText(/from the fan/i)).toBeInTheDocument()
  })
})

describe('StationStrip', () => {
  it('lists every core station in the strip and focuses a stage on click', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(
      <>
        <StationStrip />
        <TurbofanViewModes />
      </>,
    )
    const coreStations = STATIONS.filter((s) => s.strip && s.stream !== 'bypass')
    for (const s of coreStations) expect(screen.getByText(s.id, { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText(/station 13/i)).toBeInTheDocument()
    expect(screen.queryByText(/focus stage/i)).not.toBeInTheDocument()
    await user.click(screen.getByTitle(/focus the HP compressor/i))
    expect(screen.getByText(/focus stage/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'HPC' })).toHaveClass('text-accent')
  })
})

describe('TurbofanViewModes', () => {
  it('reveals the stage picker in stage focus and locks the casing outside cutaway', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(<TurbofanViewModes />)
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeEnabled()
    await user.click(screen.getByText('Stage Focus'))
    expect(screen.getByText(/focus stage/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Burn' }))
    expect(screen.getByRole('button', { name: 'Burn' })).toHaveClass('text-accent')
    expect(screen.getByRole('radio', { name: 'Ghost' })).toBeDisabled()
  })

  it('toggles the air flow switch', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(<TurbofanViewModes />)
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('aria-checked', 'true')
    await user.click(switches[0])
    expect(switches[0]).toHaveAttribute('aria-checked', 'false')
  })
})

describe('TurbofanPartInspector', () => {
  it('shows an explainer card for a chip and clears it again', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(<TurbofanPartInspector />)
    expect(screen.getByText(/click any part/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^fan$/i }))
    expect(await screen.findByText(TURBOFAN_PART_INFO.fan.tagline)).toBeInTheDocument()
    expect(screen.getByText(TURBOFAN_PART_INFO.fan.kaypohFact)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /clear selection/i }))
    expect(await screen.findByText(/click any part/i)).toBeInTheDocument()
  })
})

describe('HowTurbofanWork', () => {
  it('walks the four phases and can push a phase into the 3D view', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(
      <>
        <HowTurbofanWork />
        <TurbofanViewModes />
      </>,
    )
    expect(screen.getByRole('button', { name: /how like dat work/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(PHASE_INFO.suck.headline)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /2\s*Squeeze/i }))
    expect(await screen.findByText(PHASE_INFO.squeeze.headline)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /highlighting booster, hp compressor/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /show in 3d/i }))
    expect(screen.getByText(/focus stage/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Boost' })).toHaveClass('text-accent')
  })

  it('collapses', async () => {
    const user = userEvent.setup()
    renderWithTurbofan(<HowTurbofanWork defaultOpen={false} />)
    const toggle = screen.getByRole('button', { name: /how like dat work/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('TurbofanStatusBar', () => {
  it('reports both spool speeds and thrust', () => {
    renderWithTurbofan(<TurbofanStatusBar />)
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('84')).toBeInTheDocument()
    expect(screen.getByText('kN')).toBeInTheDocument()
    expect(screen.getByText('1:60')).toBeInTheDocument()
  })
})
