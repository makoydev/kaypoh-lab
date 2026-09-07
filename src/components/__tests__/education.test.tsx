import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithEngine } from '../../test/utils'
import { HowLikeDatWork } from '../education/HowLikeDatWork'
import { StrokeDiagram } from '../education/StrokeDiagram'
import { STROKE_INFO } from '../../lib/strokeInfo'

describe('StrokeDiagram', () => {
  it('renders an accessible diagram for each stroke', () => {
    for (const stroke of ['intake', 'compression', 'power', 'exhaust'] as const) {
      const { unmount } = renderWithEngine(<StrokeDiagram stroke={stroke} />)
      expect(screen.getByRole('img', { name: new RegExp(stroke, 'i') })).toBeInTheDocument()
      unmount()
    }
  })
})

describe('HowLikeDatWork', () => {
  it('follows the live cylinder by default and lets you pick a stroke manually', async () => {
    const user = userEvent.setup()
    renderWithEngine(<HowLikeDatWork />)
    // At crank 0°, cylinder 1 is on its power stroke.
    expect(screen.getByText(STROKE_INFO.power.headline)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /1\s*Suck/i }))
    expect(await screen.findByText(STROKE_INFO.intake.headline)).toBeInTheDocument()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('collapses and expands', async () => {
    const user = userEvent.setup()
    renderWithEngine(<HowLikeDatWork />)
    const toggle = screen.getByRole('button', { name: /how like dat work/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
