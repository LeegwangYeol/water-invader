# Handoff Report: worker_physics_stream_ab_1 (Streams A & B Remediation)

## 1. Observation
1. **ModularChassis Hitbox & Speed Overwrite**:
   - In `src/game/flagship/progression/ModularChassis.ts` line 416-417, switching chassis (e.g. from Stingray width 38 to Nautilus width 64) expanded the hitbox without coordinate clamping. When positioned near the right border ($x = 562$), $x + \text{width} = 626 > 600$, violating canvas horizontal containment.
   - Furthermore, `player.baseSpeed` was not updated to `this.activeChassis.baseSpeed`, causing external modifiers (e.g. `HadalBioHorrors.ts:327`) to reset player speed back to baseline 300 instead of retaining the chassis speed (e.g. 420 for Stingray).
   - Test `STREAM-A-01` and `STREAM-A-03` failed at baseline.

2. **Player Ballast Settling Teleportation**:
   - In `src/game/Player.ts` lines 101-108, the ballast restoration had an asymmetric `else` branch: when displaced deeper than baseline ($y > \text{targetY}$), it immediately executed `this.position.y = targetY; this.isBallastActive = false;` snapping coordinates in 1 frame instead of smoothly moving over time.
   - Test `STREAM-A-02` failed at baseline (`Expected: > 740, Received: 740`).

3. **Hydrothermal Vent Unbounded Lateral Dispersion & Synthetic Drift**:
   - In `src/game/flagship/environment/HydrothermalVent.ts` lines 248-259, lateral dispersion lacked clamping, pushing player position to $x < 0$ or $x + \text{width} > 600$.
   - A synthetic asymmetric hack (`this.anchorX <= 200 && ...` and `ambientSurfaceDrift = (playerCenterX >= this.anchorX ? 60 : 0)`) existed, which contaminated the velocity vector field of the right vent ($v_x = +46.7$ px/s instead of pointing leftward).
   - Test `STREAM-B-01` failed at baseline (`Expected: >= 0, Received: -16.67`).

4. **Vent Manager Confluence Stagnation**:
   - At the convergence point between the two chimneys ($x = 300, y \le 220$), colliding thermal plumes hold buoyant entities at the ceiling without defined convective recirculation or outward release vectors when the synthetic hack is removed.

## 2. Logic Chain
1. **Hitbox Clamping & Base Speed**:
   - In `ModularChassis.ts` (`applyToPlayer`), we set `player.baseSpeed = this.activeChassis.baseSpeed;` and immediately clamp `player.position.x = Math.max(0, Math.min(maxX, player.position.x))` and `player.position.y = Math.max(0, Math.min(maxY, player.position.y))`. This preserves containment on chassis switches and ensures faction modifiers scale against the correct base speed.

2. **Symmetric Ballast Kinematics**:
   - In `Player.ts` (`update`), we compute signed distance `diff = targetY - this.position.y` and step `step = this.ballastDescentSpeed * deltaTime`. If `Math.abs(diff) <= step`, position smoothly reaches target; otherwise it moves `Math.sign(diff) * step`. This guarantees smooth settling regardless of whether $y < \text{targetY}$ or $y > \text{targetY}$.

3. **Hydrodynamic Plume Bounds & Synthetic Hack Removal**:
   - In `HydrothermalVent.ts`, we removed the hardcoded `anchorX <= 200` filter and `ambientSurfaceDrift`. Plume dispersion is strictly applied when within halo/core near the cap, directed radially outward (`sign = playerCenterX >= this.anchorX ? 1 : -1`), and clamped to $[0, \text{canvasWidth} - \text{width}]$.

4. **Convective Overlap Confluence Recirculation**:
   - In `HydrothermalVentManager`, we added `applyConfluenceTurbulence(entity, deltaTime)`. When 2 or more vent plumes overlap in the upper plume cap ($y \le 240$):
     - Updraft lift is neutralized: `entity.isInUpdraft = false; entity.isBallastActive = true;`
     - Downwelling recirculation: colliding horizontal flows force fluid downward ($v_y = 180 \times \text{dissipationRatio}$ px/s).
     - Divergence / eddy ejection: fluid diverges laterally away from the midpoint ($v_x = \pm 80 \times \text{dissipationRatio}$ px/s), breaking the convergence saddle point.
     - Coordinates are bounded to canvas dimensions.

## 3. Caveats
- `src/game/flagship/environment/HydrothermalVentManager.ts` was added as a direct module re-export wrapper around `HydrothermalVent.ts` so any imports targeting either file resolve cleanly without circular dependencies.
- Changes were restricted strictly to the 4 assigned files in accordance with Exclusive File Ownership.

## 4. Conclusion
All 4 tasks assigned to `worker_physics_stream_ab_1` are fully implemented with genuine hydrodynamic logic (no shortcuts, synthetic hacks, or hardcoded strings). All 5 target Playwright tests (`STREAM-A-01`, `STREAM-A-02`, `STREAM-A-03`, `STREAM-B-01`, `STREAM-B-02`) pass with 0 errors, and `npx tsc --noEmit` passes with 0 type errors.

## 5. Verification Method
1. **Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   Result: Exit code 0, 0 errors.

2. **Playwright Target Test Suite**:
   ```bash
   npx playwright test tests/physics_edgecase_comprehensive.spec.ts -g "STREAM-A|STREAM-B-01|STREAM-B-02"
   ```
   Result: 5 passed in < 2 seconds, 0 failures.
