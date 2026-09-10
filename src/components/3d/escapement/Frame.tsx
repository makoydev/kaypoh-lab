import { useMemo } from 'react'
import { ESC } from '../../../lib/escapementConfig'
import { useEscapement } from '../../../hooks/useEscapementSimulation'
import { useEscapementPartInteraction } from '../../../hooks/usePartInteraction'
import { useEscapementMaterials } from './materials'
import { BANKING_PINS, bankingPinGeometry, bridgeGeometry, jewelBearingGeometry, plateGeometry } from './geometries'

/** Ghosted or wireframe frame must never swallow clicks meant for the parts it surrounds. */
const passThrough = () => null

/**
 * Main plate, the three bridges with their jewels, and the banking pins. The plate and bridges follow
 * the casing mode (hidden / ghost / solid); the banking pins are always there because the fork needs them.
 */
export function Frame() {
  const m = useEscapementMaterials()
  const { settings } = useEscapement()
  const { viewMode, casingMode } = settings
  const plate = useEscapementPartInteraction('plate')
  const banking = useEscapementPartInteraction('banking')

  const focus = viewMode === 'pallet'
  const show = !focus && (viewMode === 'xray' || casingMode !== 'hidden')
  const clickable = viewMode === 'cutaway' && casingMode === 'solid'
  const raycast = clickable ? undefined : passThrough

  const bridges = useMemo(() => {
    const { balanceCockY, palletCockY, escapeCockY } = ESC.bridges
    const edge = ESC.plate.halfWidth - 0.25
    return [
      bridgeGeometry(ESC.balance.x + 0.45, -edge, ESC.balance.x, 0, balanceCockY),
      bridgeGeometry(0.35, edge - 0.2, 0, 0, palletCockY),
      bridgeGeometry(ESC.escapeWheel.x - 0.3, -edge + 0.05, ESC.escapeWheel.x, 0, escapeCockY),
    ]
  }, [])

  const jewels: [number, number, number][] = [
    [ESC.balance.x, ESC.bridges.balanceCockY, 0],
    [0, ESC.bridges.palletCockY, 0],
    [ESC.escapeWheel.x, ESC.bridges.escapeCockY, 0],
    [ESC.balance.x, ESC.plate.yTop, 0],
    [0, ESC.plate.yTop, 0],
    [ESC.escapeWheel.x, ESC.plate.yTop, 0],
  ]

  return (
    <>
      <group visible={show} {...(show && clickable ? plate : {})}>
        <mesh geometry={plateGeometry()} material={m.plate} raycast={raycast} />
        {bridges.map((g, i) => (
          <mesh key={i} geometry={g} material={m.bridge} raycast={raycast} />
        ))}
        {jewels.map((p, i) => (
          <mesh key={i} geometry={jewelBearingGeometry()} material={m.jewelBearing} position={p} raycast={raycast} />
        ))}
      </group>
      <group {...banking}>
        {(['entry', 'exit'] as const).map((p) => (
          <mesh key={p} geometry={bankingPinGeometry()} material={m.banking} position={[BANKING_PINS[p].x, ESC.fork.y + 0.03, BANKING_PINS[p].z]} />
        ))}
      </group>
    </>
  )
}
