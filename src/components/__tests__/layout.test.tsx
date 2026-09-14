import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithEngine } from '../../test/utils'
import { Header } from '../layout/Header'
import { ModuleSelector } from '../layout/ModuleSelector'
import { StatusBar } from '../layout/StatusBar'

describe('ModuleSelector', () => {
  it('lists the catalog and reports selections', async () => {
    const user = userEvent.setup()
    const onOpenModule = vi.fn()
    const onBrowse = vi.fn()
    renderWithEngine(<ModuleSelector onOpenModule={onOpenModule} onBrowse={onBrowse} />)
    await user.click(screen.getByRole('button', { name: /v8 engine/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(5)
    expect(screen.getByRole('option', { name: /turbofan/i })).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByRole('option', { name: /manual transmission/i })).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByRole('option', { name: /escapement/i })).toHaveAttribute('aria-disabled', 'false')
    expect(screen.getByRole('option', { name: /differential/i })).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('button', { name: /browse the workshop/i }))
    expect(onBrowse).toHaveBeenCalled()
  })
})

describe('Header', () => {
  it('shows a back button and sim tools only in the sim variant', () => {
    const onBrowse = vi.fn()
    const { unmount } = renderWithEngine(<Header variant="sim" onBrowse={onBrowse} onOpenModule={vi.fn()} onResetCamera={vi.fn()} />)
    expect(screen.getByRole('button', { name: /back to the workshop/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset camera/i })).toBeInTheDocument()
    unmount()
    renderWithEngine(<Header variant="hub" onBrowse={onBrowse} onOpenModule={vi.fn()} onResetCamera={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /back to the workshop/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reset camera/i })).not.toBeInTheDocument()
  })

  it('keeps the decorative tooltips out of the a11y tree', () => {
    renderWithEngine(<Header variant="sim" onBrowse={vi.fn()} onOpenModule={vi.fn()} onResetCamera={vi.fn()} />)
    // The icon buttons already say it in their aria-label; the hover bubble must not say it again.
    expect(screen.queryAllByRole('tooltip')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Reset camera' })).toBeInTheDocument()
  })

  it('goes back to the workshop from the back button', async () => {
    const user = userEvent.setup()
    const onBrowse = vi.fn()
    renderWithEngine(<Header variant="sim" onBrowse={onBrowse} onOpenModule={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /back to the workshop/i }))
    expect(onBrowse).toHaveBeenCalledTimes(1)
  })
})

describe('StatusBar', () => {
  it('reports rpm, crank angle and the firing cylinder', () => {
    renderWithEngine(<StatusBar />)
    expect(screen.getByText('1,800')).toBeInTheDocument()
    expect(screen.getByText('000°')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
  })
})

describe('Header shortcuts popover', () => {
  it('opens on click and closes on Escape', async () => {
    const user = userEvent.setup()
    renderWithEngine(<Header variant="sim" onBrowse={vi.fn()} onOpenModule={vi.fn()} onResetCamera={vi.fn()} />)
    const toggle = screen.getByRole('button', { name: /keyboard shortcuts/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Play / pause')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.queryByText('Play / pause')).not.toBeInTheDocument())
  })
})
