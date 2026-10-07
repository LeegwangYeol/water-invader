# Changes Implemented: Milestone M1 (Core Physics & Kinematics Remediation)

## Overview
Remediated all 6 identified physics and kinematics defects across `Player.ts`, `HydrothermalVent.ts`, `HydraulicHarpoon.ts`, and `GameManager.ts`. Added comprehensive automated regression tests in `tests/m1_physics_remediation.spec.ts`.

---

## 1. `src/game/Player.ts` (DEF-PHY-01)
- **Accurate Velocity Tracking**:
  - Implemented real `this.velocity.x` and `this.velocity.y` frame-by-frame synchronization.
  - Directional keyboard movement updates `this.velocity.x = sign * effectiveSpeed`, preserving instant arcade responsiveness on key release (`velocity.x = 0`).
  - Added external modifier inheritance: when downstream forces (such as Glacial Oblivion) scale `player.velocity.x`, the reduction factor is inherited into next frame's displacement rather than being silently discarded.
- **Ballast Descent Velocity & Downward Motion**:
  - During ballast restoration, `this.velocity.y` is set to `dir * descentSpeed` (default `165 px/s`).
  - Set `this.isMovingDown = this.velocity.y > 0` and `(this as any).isMovingDown = this.isMovingDown`, enabling organic Maw vortex escape in `KrakenPrimeBoss.ts:426` without artificial test injection.
- **Hitbox Dimension Getters**:
  - Added `get width()` and `get height()` returning `this.size.width` and `this.size.height` for robust coordinate boundary clamping across all callers.

---

## 2. `src/game/flagship/environment/HydrothermalVent.ts` (DEF-PHY-02 & DEF-PHY-07)
- **Zero Lift on Dormant Vents**:
  - Set `baseLift = 0` when `this.state === VentState.DORMANT`, eliminating the artificial 160 px/s lift during dormant cycles.
  - Set `maxDispersion = 0` during `VentState.DORMANT` to prevent lateral drift when inactive.
- **$y \approx 155$ Potential Well Trap Elimination**:
  - Updated `isInUpdraft` condition to only activate when active upward thrust is physically applied (`this.state === VentState.ERUPTING || (this.state === VentState.CHARGING && liftRatio >= 0.5)`).
  - Outside of active erupting lift, `isInUpdraft` remains `false` while `isBallastActive = true` is primed, allowing the submarine's ballast system to smoothly descend back to baseline operating depth ($y = 740$).
- **Anti-Downward Teleportation**:
  - Changed plume cap ceiling clamp to `Math.min(player.position.y, Math.max(capCeiling, player.position.y - lift))`, preventing vessels entering at $y < 130$ from snapping downwards.

---

## 3. `src/game/flagship/weapons/HydraulicHarpoon.ts` (DEF-PHY-03, DEF-PHY-04/05)
- **Boss Slingshot Instakill Prevention**:
  - In `updateSlingshotProjectiles()`, when a catapulted entity crosses $y \le -60$ or expires, checked `!(proj.entity as any).isBoss && !(proj.entity as any).isApexBoss`.
  - Boss entities are NOT killed; instead, 180 kinetic slingshot impact damage is dealt, and the boss is clamped/bounced back into the active arena ($y = 120, v_y > 0$). Regular enemies continue to be executed cleanly.
- **Velocity Spikes & Jump Teleport Protection**:
  - Clamped finite-difference `playerVelocity.x` and `playerVelocity.y` to `[-600, 600]` with `Number.isFinite` sanitization.
  - Handled single-frame position jumps $> 200\text{ px}$ (e.g. respawn, continue) by resetting `prevPlayerPos` and zeroing velocity, preventing multi-thousand px/s velocity spikes.
- **Spring Damping Relative Velocity**:
  - Factored target relative velocity `(targetVx - playerVelocity.x, targetVy - playerVelocity.y)` into spring damping calculation, preventing high-frequency numerical chatter.
- **Tether Reset & Lifecycle**:
  - Added public `resetTether()` and `onWaveComplete()` methods.
  - Re-exported `HydraulicHarpoon as HydraulicHarpoonSystem`.

---

## 4. `src/game/GameManager.ts` (DEF-PHY-06, DEF-PHY-08)
- **Post-Subsystem Boundary Invariant Clamp (DEF-PHY-08)**:
  - Added coordinate boundary containment clamp immediately following `flagshipManager.update(deltaTime, context)`:
    ```typescript
    if (this.player && this.player.position) {
      if (!Number.isFinite(this.player.position.x)) this.player.position.x = (this.logicalWidth - this.player.width) / 2;
      if (!Number.isFinite(this.player.position.y)) this.player.position.y = this.player.baselineY;
      this.player.position.x = Math.max(0, Math.min(this.logicalWidth - this.player.width, this.player.position.x));
      this.player.position.y = Math.max(0, Math.min(this.logicalHeight - this.player.height, this.player.position.y));
    }
    ```
- **Orphaned Tether Reset on State Transitions (DEF-PHY-06)**:
  - In `startNextWave()`, `init()`, `prepareContinue()`, `continueGame()`, and `triggerEndGameCrisis()`, invoked `hydraulicHarpoon.resetTether()` whenever `this.enemies = []` is cleared, preventing ghost tethers to deleted enemy instances.

---

## 5. `tests/m1_physics_remediation.spec.ts` (New Automated Test Suite)
- 18 dedicated tests covering all defect remediations:
  - `DEF-PHY-01.1` to `DEF-PHY-01.4`: Velocity tracking, ballast kinematics, Kraken vortex escape, Glacial Oblivion frostbite.
  - `DEF-PHY-02.1` to `DEF-PHY-02.3`: Dormant vent 0-lift, smooth descent from $y=155$ to $y=740$, anti-teleportation ceiling clamp.
  - `DEF-PHY-03.1` to `DEF-PHY-03.2`: Boss slingshot protection (180 dmg, arena bounce to $y=120$, `isDead=false`), regular mob execution.
  - `DEF-PHY-04.1` to `DEF-PHY-05.1`: Velocity clamp within `[-600, 600]`, jump $>200\text{ px}$ reset to 0, relative damping.
  - `DEF-PHY-06.1` to `DEF-PHY-06.4`: Tether reset on wave transition, continue, crisis, and direct call.
  - `DEF-PHY-08.1` to `DEF-PHY-08.2`: Post-subsystem boundary clamp and NaN sanitization.
