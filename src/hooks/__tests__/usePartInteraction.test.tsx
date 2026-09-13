import { describe, expect, it } from 'vitest'
import { act, render } from '@testing-library/react'
import { AllProviders } from '../../test/utils'
import { useEngine } from '../useEngineSimulation'
import { usePartInteraction } from '../usePartInteraction'

/** R3F hands the handlers a synthetic event; only `stopPropagation` matters to them. */
const pointerEvent = () => ({ stopPropagation: () => {} }) as never

let hoverPiston: () => void
let hoveredPart: string | null

/** Stands in for a mesh that a view-mode switch can take away while the pointer is still on it. */
function Piston() {
  const { onPointerOver } = usePartInteraction('piston')
  hoverPiston = () => onPointerOver(pointerEvent())
  return null
}

function Scene({ showPiston }: { showPiston: boolean }) {
  hoveredPart = useEngine().settings.hoveredPart
  return showPiston ? <Piston /> : null
}

describe('usePartInteraction', () => {
  it('clears the hover and the cursor when a hovered part unmounts', () => {
    const { rerender } = render(<Scene showPiston />, { wrapper: AllProviders })

    act(() => hoverPiston())
    expect(hoveredPart).toBe('piston')
    expect(document.body.style.cursor).toBe('pointer')

    // The mesh goes away without any pointer-out ever firing.
    rerender(<Scene showPiston={false} />)
    expect(hoveredPart).toBeNull()
    expect(document.body.style.cursor).toBe('auto')
  })

  it('leaves the cursor alone when the part was not the hovered one', () => {
    const { rerender } = render(<Scene showPiston />, { wrapper: AllProviders })
    document.body.style.cursor = 'grab'
    rerender(<Scene showPiston={false} />)
    expect(document.body.style.cursor).toBe('grab')
  })
})
