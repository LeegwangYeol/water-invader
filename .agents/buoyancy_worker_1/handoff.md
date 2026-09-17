# Handoff Report: Hydrodynamic Ballast Restoration & Plume Cap Dissipation Implementation

**Author**: `buoyancy_worker_1` (`teamwork_preview_worker`)  
**Mission**: Implement hydrodynamic ballast restoration, plume cap dissipation, and lateral escape dynamics to eliminate the upward buoyant drift lock bug while strictly preserving physics invariants.  
**Deliverable Path**: `/Users/user/src/water-invader/.agents/buoyancy_worker_1/handoff.md`  
**Date**: 2026-09-17  

---

## 1. Observation

### 1.1 Modified Files & Direct Code Changes

#### 1.1.1 `src/game/Player.ts`
- **Lines 50–60**: Added hydrodynamic ballast properties and baseline depth getter:
  ```typescript
  // Hydrodynamic Ballast Restoration
  public isBallastActive: boolean = false;
  public ballastDescentSpeed: number = 165;
  public isInUpdraft: boolean = false;
  public get baselineY(): number {
    return this.canvasHeight - this.size.height - 20;
  }
  public enableBallast(): void {
    this.isBallastActive = true;
  }
  ```
- **Lines 98–110**: In `Player.prototype.update(deltaTime: number)`, inserted smooth ballast settling prior to coordinate clamping:
  ```typescript
  // Smooth hydrodynamic ballast restoration
  if (this.isBallastActive && !this.isInUpdraft) {
    const targetY = this.baselineY;
    if (this.position.y < targetY) {
      this.position.y = Math.min(targetY, this.position.y + this.ballastDescentSpeed * deltaTime);
    } else {
      this.position.y = targetY;
      this.isBallastActive = false;
    }
  }
  this.isInUpdraft = false;
  ```

#### 1.1.2 `src/game/flagship/environment/HydrothermalVent.ts`
- **Lines 232–251**: In `HydrothermalVent.prototype.update`, refactored player updraft handling to implement plume cap dissipation band $[130, 220]$, radial lateral dispersion, and ballast priming:
  ```typescript
  // Convective updraft and plume cap dissipation
  if (inHalo || inCore) {
    (player as any).isBallastActive = true;
    (player as any).isInUpdraft = true;
    const capCeiling = this.capY + 30; // 130
    const transitionZone = 90; // Plume cap dissipation band [130, 220]
    const depthAboveCap = Math.max(0, playerCenterY - capCeiling);
    const liftRatio = Math.min(1.0, depthAboveCap / transitionZone);
    const baseLift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
    const lift = baseLift * liftRatio;
    player.position.y = Math.max(capCeiling, player.position.y - lift);

    // Radial lateral outward dispersion near the plume cap
    if (liftRatio < 1.0) {
      const dispersionRatio = 1.0 - liftRatio;
      const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio * deltaTime;
      const sign = playerCenterX >= this.anchorX ? 1 : -1;
      player.position.x += sign * dispersionSpeed;
    }
  }
  ```

#### 1.1.3 `src/game/GameManager.ts`
- **Lines 1250–1256**: In `GameManager.prototype.update(deltaTime: number)` under `if (this.state === GameState.PLAYING)`:
  ```typescript
  if (this.player.position.y < (this.player as any).baselineY) {
    (this.player as any).isBallastActive = true;
  }
  ```

---

## 2. Logic Chain

1. **Root Cause Resolution**:
   - Previously, `HydrothermalVent.ts` lifted `player.position.y` up to `this.capY + 30` (130 px), but `Player.ts` lacked vertical velocity or downward trim restoring force. Once lifted, the vessel remained permanently pinned at the top boundary.
   - By implementing `baselineY` (`canvasHeight - size.height - 20`, default 740 px) and smooth ballast settling (`ballastDescentSpeed * deltaTime`), the submarine naturally returns to operating depth without teleportation.

2. **Updraft Coordination & Ascent Preservation**:
   - When inside the plume column, `HydrothermalVent.ts` marks `(player as any).isInUpdraft = true`.
   - In `Player.prototype.update`, ballast descent only executes when `!this.isInUpdraft`. This prevents opposing ballast force from canceling or degrading the pure $+160\text{ px/s}$ / $+260\text{ px/s}$ convective updraft lift required by `BUOYANCY-01` and `STREAM-B-06`.

3. **Plume Cap Dissipation & Lateral Escape**:
   - In hydrothermal fluid dynamics, ascending thermal plumes mushroom horizontally upon encountering neutral buoyancy density strata.
   - The dissipation band $[130, 220]$ scales vertical lift linearly via `liftRatio = Math.min(1.0, depthAboveCap / transitionZone)`.
   - When `liftRatio < 1.0`, lateral outward dispersion (`dispersionSpeed = (state === ERUPTING ? 120 : 80) * (1 - liftRatio) * deltaTime`) pushes the submarine radially away from `anchorX`, assisting horizontal steering and enabling clean escape into descending waters.

4. **Zero-Coordinate Boundary Test Invariant (`SCENARIO-3.1`)**:
   - `isBallastActive` defaults to `false`. Unprimed Player instances created via `new Player()` with `player.position.x = 0; player.position.y = 0;` remain at $(0, 0)$ after `player.update(0.016)` because ballast settling does not engage on unprimed instances. Boundary clamping keeps $y = 0$.

5. **Mid-Depth Updraft Invariant (`STREAM-B-06`)**:
   - At depth $y = 500\text{ px}$, `depthAboveCap = 516 - 130 = 386\text{ px} > 90\text{ px}`. `liftRatio` evaluates to exactly $1.0$.
   - Vertical lift remains $160\text{ px/s}$ (dormant) and $260\text{ px/s}$ (erupting) with zero attenuation, and lateral dispersion remains zero.

6. **Canvas Dimensions Invariant**:
   - `logicalWidth` (600) and `logicalHeight` (800) in `GameManager.ts` and `Enemy.ts` were strictly untouched.

---

## 3. Caveats

1. **Standalone Test Priming**:
   - For standalone unit tests that instantiate `new Player()` directly without invoking `GameManager.ts` or `HydrothermalVent.ts`, `(player as any).isBallastActive = true;` or `player.enableBallast()` must be called to engage ballast settling. This is already implemented in `BUOYANCY-02` and `BUOYANCY-04`.
2. **Webserver Dependency for E2E**:
   - `BUOYANCY-E2E-01` and `STREAM-B-08` test live browser interactions and require Next.js web server (`npm run dev`). Running in headless CI without a dev server requires `SKIP_WEBSERVER=1`.
3. **Steam Lance and Thermal Damage Independence**:
   - Projectile transformation into Steam Lances (`__steamLance`) and enemy thermal DoT are calculated in separate loops within `HydrothermalVent.ts` and remain 100% untouched.

---

## 4. Conclusion

- The upward buoyant drift lock bug is completely resolved through authentic hydrodynamic physics:
  - Submarines smoothly descend at $165\text{ px/s}$ to their chassis baseline operating depth once clear of convective updrafts.
  - Hydrothermal plumes naturally attenuate near the ceiling ($y < 220$) and generate outward radial dispersion, preventing ceiling pin traps.
- All invariants are strictly preserved:
  - `logicalWidth` (600) and `logicalHeight` (800) unchanged.
  - Backwards-compatibility with zero-coordinate tests verified.
  - Mid-depth lift rates ($160\text{ px/s}$ dormant, $260\text{ px/s}$ erupting) verified.
  - Steam Lance and thermal DoT mechanics preserved.
- `npx tsc --noEmit` and `npm run build` pass with zero errors.

---

## 5. Verification Method

To independently verify the implementation, execute the following commands in the workspace root:

1. **TypeScript Type-Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Result*: Exits with code 0 (zero errors).

2. **Reproduction & Buoyancy Playtest Suite**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts -g "BUOYANCY-01|BUOYANCY-02|BUOYANCY-03|BUOYANCY-04"
   ```
   *Result*: 4 passed (314ms).
   - `BUOYANCY-01`: Direct vent updraft lifts player from baseline to plume cap ($y < 200$) — PASS
   - `BUOYANCY-02`: Ballast restoration smoothly descends player from $y=130$ back to $y > 700$ — PASS
   - `BUOYANCY-03`: Combined simulation (updraft lift, steer left, return to depth) — PASS
   - `BUOYANCY-04`: Variable delta-time numerical resilience & clamping — PASS

3. **Hydrothermal Vents & Ocean Currents Regression Suite**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/playtest_stream_b_vents_currents.spec.ts -g "STREAM-B-0[1-7]"
   ```
   *Result*: 7 passed (275ms).

4. **Zero-Coordinate Adversarial Boundary Invariant**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/stress/bughunt_physics_adversarial_stress.spec.ts -g "SCENARIO-3.1"
   ```
   *Result*: 1 passed (300ms).

5. **Adversarial Physics Stress Suite**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/flagship_adversarial_physics_stress.test.ts
   ```
   *Result*: 16 passed (617ms).

6. **Production Next.js Build**:
   ```bash
   npm run build
   ```
   *Result*: Compiled successfully in 1014ms (zero build errors).

### Invalidation Conditions
The fix would be invalidated if:
- `player.position.y` teleports or jumps discontinuously.
- `STREAM-B-06` fails due to altered lift rate at depth $y = 500$.
- `SCENARIO-3.1` fails due to unprimed vessels descending when initialized at $(0, 0)$.
- `npm run build` or `npx tsc --noEmit` fail with compiler errors.
