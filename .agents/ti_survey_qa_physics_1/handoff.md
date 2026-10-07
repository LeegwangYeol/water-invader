# Handoff Report — QA and Physics Kinematics Explorer (`ti_survey_qa_physics_1`)

**Target Subsystem**: Hydrodynamics, Kinematics, Hazard Buoyancy, Harpoon Tether, and Boundary Containment  
**Milestone**: M0 Survey & Flaw Discovery — Total Codebase Inspection ("총검사")  
**Handoff Type**: Hard (Task Complete)  
**Date**: 2026-09-23  

---

## 1. Observation

### Obs 1: Phantom Velocity Disconnect
- **File**: `src/game/Player.ts:93-98`
  ```typescript
  if (this.isMovingLeft) {
    this.position.x -= this.speed * deltaTime;
  }
  if (this.isMovingRight) {
    this.position.x += this.speed * deltaTime;
  }
  ```
  `Player.update()` updates `position.x` directly via `this.speed`. It never modifies or reads inherited `this.velocity = { x: 0, y: 0 }`.
- **File**: `src/game/crisis/EndGameCrisis.ts:418-421`
  ```typescript
  case CrisisArchetype.GLACIAL_OBLIVION:
    if (player.position.y > this.logicalHeight - 110) {
      player.velocity.x *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
      player.velocity.y *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
    }
  ```
- **File**: `src/game/flagship/factions/KrakenPrimeBoss.ts:426-429`
  ```typescript
  let effectivePull = pullSpeed;
  if ((player.velocity && player.velocity.y > 0) || (player as any).isMovingDown) {
    effectivePull = Math.max(0, pullSpeed * 0.25 - (player.velocity ? player.velocity.y : 0));
  }
  player.position.y = Math.max(220, player.position.y - effectivePull * deltaTime);
  ```
- **File**: `tests/physics_edgecase_comprehensive.spec.ts:399`
  The test passes only because the author wrote: `player.velocity.y = 250;`. In live gameplay, neither `player.velocity.y` nor `(player as any).isMovingDown` is ever non-zero.

### Obs 2: Hydrothermal Vent Dormant Updraft & Potential Well Trap
- **File**: `src/game/flagship/environment/HydrothermalVent.ts:240-244`
  ```typescript
  if (inCore || liftRatio >= 0.5) {
    (player as any).isInUpdraft = true;
  }
  const baseLift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
  const lift = baseLift * liftRatio;
  player.position.y = Math.max(capCeiling, player.position.y - lift);
  ```
  `baseLift` is 160 even during `VentState.DORMANT` (7.5s duration).
- **File**: `src/game/Player.ts:101-112`
  ```typescript
  if (this.isBallastActive && !this.isInUpdraft) {
    const targetY = this.baselineY;
    const diff = targetY - this.position.y;
    const step = this.ballastDescentSpeed * deltaTime;
    ...
  }
  this.isInUpdraft = false;
  ```
  Ballast descent is completely skipped when `isInUpdraft` is true.
- At $y \approx 155$, $liftRatio = (175 - 130) / 90 = 0.5$. If $y > 155$, $liftRatio \ge 0.5 \implies isInUpdraft = true \implies$ ballast is blocked, upward lift pushes $y$ back up to $\le 155$. Plume halo spans 83.4% of total canvas width across the two vents.

### Obs 3: Harpoon Boss Catapult Instakill Exploit
- **File**: `src/game/flagship/weapons/HydraulicHarpoon.ts:156-174, 704-706`
  ```typescript
  const slingshotVelocity: Vector2D = {
    x: this.playerVelocity.x * 0.5,
    y: -this.config.slingshotBonus, // -720 px/s
  };
  ...
  if (proj.remainingLife <= 0 || proj.entity.position.y <= -60) {
    proj.entity.isDead = true;
    this.slingshotProjectiles.splice(i, 1);
  }
  ```
  Bosses can be tethered (`isBoss` mass=6 in lines 384, 489). When released with `'H'`, they travel upward at $-720\text{ px/s}$ and are executed by `proj.entity.isDead = true;` when crossing $y \le -60$.

### Obs 4: Uncapped Player Velocity in Harpoon
- **File**: `src/game/flagship/weapons/HydraulicHarpoon.ts:237-243`
  ```typescript
  if (deltaTime > 0) {
    this.playerVelocity = {
      x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
      y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
    };
    this.prevPlayerPos = { x: playerProw.x, y: playerProw.y };
  }
  ```
  No clamp exists on `this.playerVelocity`. Coordinate jumps (continue respawn, chassis change hitbox clamping) produce velocities exceeding $15,000\text{ px/s}$.

### Obs 5: Orphaned Tether Entity Leak
- **File**: `src/game/GameManager.ts:560, 642, 731`
  `this.enemies = [];` clears the enemy array without resetting `hydraulicHarpoon`. `tetheredEntity` references an un-dead, invincible orphaned object outside `this.enemies`.

### Obs 6: Post-Subsystem Coordinate Invariant Gap in `GameManager.ts`
- **File**: `src/game/GameManager.ts:1279, 1724, 1850+`
  `player.update()` is called at line 1279. `flagshipManager.update()` is called at line 1724. No clamping or finitude check exists between line 1724 and `this.draw()` at line 1261.

---

## 2. Logic Chain

1. **Obs 1 $\implies$ Ineffective Debuffs & Impossible Escape**:
   `Player.update` reads `this.speed` for position updates. Because `player.velocity` is unused by the player, any subsystem modifying `player.velocity` (such as `GLACIAL_OBLIVION` in `EndGameCrisis.ts`) has zero effect on actual player kinematics. Furthermore, because `KrakenPrimeBoss.ts` checks `player.velocity.y > 0` or `isMovingDown` to reduce vortex suction, and neither condition can ever be met by player controls in `GameManager.ts`, the player is unconditionally dragged into the maw.

2. **Obs 2 $\implies$ Buoyancy Entrapment Trap**:
   `HydrothermalVent` generates $160\text{ px/s}$ upward lift even during `VentState.DORMANT`. Because `liftRatio >= 0.5` sets `isInUpdraft = true`, `Player.update` disables ballast descent whenever $y \ge 155$. Conversely, whenever $y < 155$, $liftRatio < 0.5$, which re-enables ballast and moves the player downward toward 155. This establishes a stable potential-well limit cycle at $y \approx 155$, trapping the player across 83.4% of the canvas width.

3. **Obs 3 $\implies$ Game-Breaking Boss Exploit**:
   `releaseSlingshot()` accepts any tethered entity including bosses. Because `proj.entity.position.y += -720 * deltaTime`, the boss crosses $y = -60$ within 1.1s, triggering `proj.entity.isDead = true;` and bypassing 12,000 HP.

4. **Obs 4 $\implies$ Velocity Runaway & Boundary Clipping**:
   Because `playerVelocity` is computed via finite difference without bounds, instantaneous player position resets generate $>15,000\text{ px/s}$ velocity, which is multiplied into slingshot trajectories, flinging projectiles through canvas walls.

5. **Obs 5 $\implies$ State Inconsistency & Ghost Tethering**:
   Clearing `enemies = []` without notifying the harpoon subsystem leaves `tetheredEntity` referencing a detached object that cannot be killed by bullets, keeping the cable attached indefinitely.

6. **Obs 6 $\implies$ Boundary Invariant Risk**:
   Multi-force combinations (Vent dispersion + Singularity pull + Nanite push) occurring in `flagshipManager.update` displace the player without a final clamp before rendering, violating strict containment within $[0, 600 - w] \times [0, 800 - h]$.

---

## 3. Caveats

1. **Standalone Files `Whirlpool.ts` and `TectonicRift.ts`**: As noted in Section 2 of `report.md`, these files do not exist as distinct entities; their mechanics are dispersed in `KrakenPrimeBoss.ts`, `DimensionalRift.ts`, and `OceanCurrent.ts`. Remediation should focus on hardening existing implementations rather than forcing artificial file extractions unless requested by the architecture team.
2. **Arcade Movement Design**: Player lateral movement is intentionally responsive (instantaneous start/stop). Introducing full physics inertia and drag should be tuned carefully to avoid making submarine handling feel sluggish to human players.
3. **Read-Only Scope**: In strict accordance with the explorer archetype, no source files were modified during this investigation.

---

## 4. Conclusion

The physics, kinematics, and hydrodynamic subsystems contain 10 identified defects (1 Critical, 3 High, 4 Medium, 2 Low). The most critical are:
- `DEF-PHY-01`: Phantom velocity decoupling disabling Glacial crisis and Kraken vortex escape.
- `DEF-PHY-02`: Hydrothermal vent dormant lift and the $y \approx 155$ equilibrium ballast entrapment trap.
- `DEF-PHY-03`: Harpoon slingshot catapult boss instakill bypass.
- `DEF-PHY-04`: Uncapped player velocity spikes on harpoon slingshots.
- `DEF-PHY-06`: Orphaned tethered entity leaks on wave transitions.
- `DEF-PHY-08`: Missing post-flagship global coordinate clamping in `GameManager.ts`.

All defects are fully documented with concrete code locations and proposed drop-in remediations in `report.md`.

---

## 5. Verification Method

To independently reproduce the issues and verify future fixes:
1. **Existing Test Suite Baseline**:
   Run `npx playwright test tests/physics_edgecase_comprehensive.spec.ts` and `tests/adversarial_buoyancy_ballast_stress.spec.ts`.
2. **Defect Verification Commands**:
   - To inspect phantom velocity: Inspect `src/game/Player.ts:93-98` vs `src/game/crisis/EndGameCrisis.ts:419`.
   - To inspect vent dormant lift: Check `src/game/flagship/environment/HydrothermalVent.ts:242` where `baseLift = 160 * deltaTime` regardless of `state === VentState.DORMANT`.
   - To inspect boss slingshot instakill: Check `src/game/flagship/weapons/HydraulicHarpoon.ts:704-706` where any launched entity crossing $y \le -60$ has `isDead = true` set.
3. **Build and TypeScript Invariant**:
   `npx tsc --noEmit && npm run build` must compile with 0 errors.
