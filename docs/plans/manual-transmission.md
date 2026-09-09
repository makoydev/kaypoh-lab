# Plan: Manual Transmission (HLD-004)

Status: **released (2026-09-09)**. All nine steps done; visual QA checklist (`docs/TESTING.md` items 18–25) passed;
`status: 'active'`, deployed by CI on push to `main`.

## Learning objectives (`lib/modules.ts` `learn`)
1. Why gears are always touching yet the car can be in neutral (constant mesh; output gears freewheel until a sleeve locks one).
2. What a synchroniser ring is saving you from (the gear and the shaft spin at different speeds; friction matches them before the dog teeth meet).
3. How a smaller gear driving a bigger one makes more torque (ratio multiplies torque and divides speed; power is conserved).

## Mechanism
Three-shaft, five-speed + reverse, constant-mesh, rear-drive style box:
- **Input shaft** carries the clutch disc and the input gear, which permanently drives the **countershaft**.
- **Countershaft** carries one fixed gear per speed (1, 2, 3, 5, R) — all always meshed with their partners.
- **Output shaft** is coaxial with the input. The speed gears freewheel on it; three **synchro hubs**
  (1-2, 3-4, 5-R) carry sliding sleeves that lock one gear to the shaft. 4th locks the sleeve straight onto the
  input gear (direct drive, 1:1). Reverse goes through an always-meshed idler so it turns the other way.
- **Clutch** (flywheel, disc, pressure plate) at the front so the engine can be disconnected during a shift.

## Model (`src/lib/gearboxConfig.ts` + `src/lib/gearboxModel.ts`)
- Tooth counts per pair; pitch radii derive from one centre distance (`r = C·N/(N₁+N₂)`), so partners always touch.
- `meshedAngle(driverAngle, N₁, ψ, N₂)`: generic phase rule so a tooth of the driver at the line of centres always meets a
  gap in the driven gear. Every gear angle is a linear function of the input angle, computed from reference phases.
- Shift timeline: clutch out → disengage → synchronise (or grind, synchro off) → engage → clutch in, as pure
  functions of elapsed time. Sleeve positions, clutch travel, ring contact, dog-tooth alignment snap.
- Speed model: engine rpm is the control; in gear the output follows; during a shift the car keeps rolling and the
  synchro drags the input cluster to the new gear's speed; clutch-in rewrites engine rpm to match (the rev drop).
- Torque: simple engine torque curve × ratio × final drive; power in = power out; speed in km/h.
- Tests: radii sum to centre distance, reverse idler distances, ratios ordered, mesh condition for every pair across a
  sweep, timeline phase coverage and boundary values, speed/torque invariants, reverse lockout.

## Visual time scale
1:40 like the V8 (`GEARBOX_VISUAL_TIME_SCALE`). Shift animation runs at scene speed, scaled by the playback multiplier.

## Procedural 3D (`components/3d/gearbox/`)
- Involute-ish gear teeth as `ExtrudeGeometry` from a tooth profile, one geometry per gear, bore hole included.
- Sectioned half-case (far half kept) with orange cut strips when solid, bell housing, bearings, shift rails + forks.
- Hubs, sleeves (slide ±), brass blocker rings (glow on contact), cones, dog-tooth rings.
- View modes: cutaway / x-ray / **synchro focus** (isolate one hub with slip-rpm labels). Torque-path glow toggle.

## HUD
- Throttle (engine rpm), H-pattern gear selector with shift phase readout and synchro on/off, torque & speed
  readout, ratio table, view modes, part inspector, "How like dat work?" explainer with an animated schematic.
- Status bar: engine rpm, gear, ratio, output rpm, km/h, wheel torque, time scale.

## Order of work
1. Config + model + tests. 2. Store. 3. Geometries + materials + meshes. 4. Scene + camera. 5. HUD + content.
6. RTL + content tests. 7. Visual QA. 8. README, roadmap, decisions. 9. Flip `active`, push.
