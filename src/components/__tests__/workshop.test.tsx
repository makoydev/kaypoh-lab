import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DrawingSheet } from '../workshop/DrawingSheet'
import { LearningPath } from '../workshop/LearningPath'
import { ModuleSchematic } from '../workshop/ModuleSchematic'
import { MODULES, ACTIVE_MODULE, moduleById } from '../../lib/modules'

describe('DrawingSheet', () => {
  it('renders a live sheet with an Open button that reports the module', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<DrawingSheet module={ACTIVE_MODULE} onOpen={onOpen} preview={<div data-testid="preview" />} />)
    expect(screen.getAllByText('HLD-001')).toHaveLength(2) // header strip + title block
    expect(screen.getByText(/live simulation/i)).toBeInTheDocument()
    expect(screen.getByTestId('preview')).toBeInTheDocument()
    for (const l of ACTIVE_MODULE.learn) expect(screen.getByText(l)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /open simulation/i }))
    expect(onOpen).toHaveBeenCalledWith(ACTIVE_MODULE)
  })

  it('renders a draft sheet without an Open button', () => {
    const draft = moduleById('escapement')!
    render(<DrawingSheet module={draft} />)
    expect(screen.getByText(/in drafting/i)).toBeInTheDocument()
    expect(screen.getByText(`Draft · ${draft.progress}%`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /open simulation/i })).not.toBeInTheDocument()
  })
})

describe('ModuleSchematic', () => {
  it('draws something for every module', () => {
    for (const m of MODULES) {
      const { container, unmount } = render(<ModuleSchematic moduleId={m.id} accent={m.accent} />)
      expect(container.querySelectorAll('path, circle, line, rect').length).toBeGreaterThan(3)
      unmount()
    }
  })
})

describe('LearningPath', () => {
  it('only makes live modules clickable', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<LearningPath modules={MODULES} onOpen={onOpen} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
    expect(buttons.filter((b) => !(b as HTMLButtonElement).disabled)).toHaveLength(3)
    await user.click(buttons[0])
    expect(onOpen).toHaveBeenCalledWith(ACTIVE_MODULE)
  })
})
