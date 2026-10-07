# Comprehensive Physics, Kinematics & Hydrodynamics Inspection Report
**Subsystem Stream**: QA & Physics Kinematics Explorer (`ti_survey_qa_physics_1`)  
**Target Project**: Water Invader (`/Users/user/src/water-invader`)  
**Inspection Date**: 2026-09-23  
**Status**: COMPLETE (Read-Only Investigation)

---

## 1. Executive Summary

As part of the codebase-wide Total Inspection ("총검사"), this report delivers an exhaustive audit of the physics, kinematics, and hydrodynamic simulation subsystems in Water Invader. The audit encompassed core vessel mechanics, environmental hazard dynamics, weapon tether kinematics, and global boundary invariants across `src/game/GameManager.ts`, `src/game/Player.ts`, `src/game/flagship/environment/*`, `src/game/flagship/weapons/HydraulicHarpoon.ts`, `src/game/flagship/factions/KrakenPrimeBoss.ts`, and `src/game/crisis/*`.

### Key Discoveries & Critical Vulnerabilities:
1. **The "Phantom Velocity" Disconnect**: `Player.ts` inherits `velocity = { x: 0, y: 0 }` from `Entity`, but `Player.update()` operates solely on `player.position.x += player.speed * deltaTime`. `player.velocity` remains permanently `{ x: 0, y: 0 }`. Downstream subsystems (`EndGameCrisis.ts:GLACIAL_OBLIVION` and `KrakenPrimeBoss.ts:Phase 2 Maw`) attempt to scale or check `player.velocity`, rendering frostbite speed debuffs completely inoperative and making the Kraken Maw vortex escape check mathematically impossible for a human player.
2. **Hydrothermal Vent DORMANT Updraft & Equilibrium Potential Well Trap**: 
   - `HydrothermalVent.ts:242` applies `baseLift = 160 * deltaTime` even when `this.state === VentState.DORMANT` (7.5s out of 12s cycle).
   - In `HydrothermalVent.ts:240`, `liftRatio >= 0.5` sets `(player as any).isInUpdraft = true`, which unconditionally disables `Player.ts` ballast restoration (`!this.isInUpdraft`).
   - At `player.position.y ≈ 155` (where `liftRatio = 0.5`), the player is trapped in a stable limit-cycle equilibrium across 83.7% of the canvas width, unable to descend back to baseline operating depth (`y = 740`).
3. **Hydrothermal Vent Top Snap / Teleportation**: At `HydrothermalVent.ts:244`, `player.position.y = Math.max(capCeiling, player.position.y - lift)` forces `player.position.y` to snap downward to `capCeiling` (130) if the player enters the halo at `y < 130`.
4. **Harpoon Slingshot Boss Instakill Exploit**: `HydraulicHarpoon.ts` permits tethering 12,000+ HP Apex Bosses and launching them as slingshot catapult projectiles (`vy = -720 px/s`). When `proj.entity.position.y <= -60`, line 705 executes `proj.entity.isDead = true;`, instakilling any boss in under 1 second.
5. **Uncapped Slingshot Velocity & Spring Chatter**: `playerVelocity` in `HydraulicHarpoon.ts` is estimated via un-clamped finite difference `(dx / dt)`, causing explosive velocity spikes during respawns/chassis switches. Viscous damping omits `enemy.velocity`, and the step-function spring force causes high-frequency position jitter.
6. **Orphaned Tether State Leak**: Clearing `this.enemies = []` during wave transitions or crisis inceptions leaves `HydraulicHarpoon.tetheredEntity` referencing a deleted enemy indefinitely.
7. **Post-Subsystem Boundary Invariant Gap**: `GameManager.ts` executes `flagshipManager.update()` at line 1724 (after `player.update()`), leaving all subsequent entity and player displacements un-clamped before `this.draw()`.
8. **Architectural File Mapping Discrepancy**: `Whirlpool.ts` and `TectonicRift.ts` listed in `PROJECT.md` do not exist as standalone files; their vortex and rift mechanics are instead distributed across `KrakenPrimeBoss.ts`, `DimensionalRift.ts`, `HadalBioHorrors.ts`, and `OceanCurrent.ts`.

---

## 2. Architecture & File Inventory Mapping

`PROJECT.md` line 14 designates Stream B Environmental Hazards as:
`HydrothermalVent.ts, OceanCurrent.ts, Whirlpool.ts, TectonicRift.ts`.

Our filesystem survey reveals the physical layout of environmental and hydrodynamic modules:

| Intended Component | Actual File Location | Current Implementation Status |
|--------------------|----------------------|-------------------------------|
| Hydrothermal Vents | `src/game/flagship/environment/HydrothermalVent.ts` | Fully implemented (Dual staggered benthic chimneys, conical plume geometry, mineral nodules, confluence turbulence) |
| Vent Manager | `src/game/flagship/environment/HydrothermalVentManager.ts` | Re-exports `HydrothermalVent.ts` |
| Ocean Currents | `src/game/flagship/environment/OceanCurrent.ts` | Fully implemented (Stratified conveyor: +75 px/s East y<400, -60 px/s West y>=400, sigmoid shear band, streamline & vortex particle pool) |
| Whirlpool / Vortex | Dispersed in: <br>1. `src/game/flagship/factions/KrakenPrimeBoss.ts` (Phase 2 Charybdis Maw Inhalation Vortex)<br>2. `src/game/flagship/factions/HadalBioHorrors.ts` (Siphoner Ingestion Vortex)<br>3. `src/game/flagship/environment/OceanCurrent.ts` (Shear Boundary Vortices) | Implemented within factions and ocean current shear particles, NOT as standalone `Whirlpool.ts`. |
| Tectonic / Dimensional Rift | Dispersed in: <br>1. `src/game/crisis/DimensionalRift.ts`<br>2. `src/game/crisis/EndGameCrisis.ts` | Implemented as Crisis Phase 1 Anchors with gravitational distortion, NOT as standalone `TectonicRift.ts`. |
| Darkness Cycle | `src/game/flagship/environment/BiolapseDarknessCycle.ts` | Fully implemented (Lighting degradation, bioluminescent flare, HUD flashlights) |
| Hydraulic Harpoon | `src/game/flagship/weapons/HydraulicHarpoon.ts` | Fully implemented (12-node Verlet cable, non-linear spring, winch, meat shield, slingshot) |

---

## 3. Deep-Dive Subsystem Inspections

### 3.1 Kinematics & Hydrodynamics in `GameManager.ts` and `Player.ts`

#### 3.1.1 Fluid Drag & Inertia Evaluation
- **Implementation State**:
  In `Player.ts` lines 93-98:
  ```typescript
  if (this.isMovingLeft) {
    this.position.x -= this.speed * deltaTime;
  }
  if (this.isMovingRight) {
    this.position.x += this.speed * deltaTime;
  }
  ```
- **Flaw**: Player lateral kinematics are purely instantaneous piecewise-constant velocities. There is zero inertia, zero acceleration ramp, and zero hydrodynamic drag ($F_{drag} = -\frac{1}{2} C_d \rho v^2$) applied to player lateral controls. When the player releases a directional key, the vessel halts instantaneously.
- **Ocean Current Coupling**: In `OceanCurrent.ts:108-110`, the player is explicitly exempted from ocean current conveyor drag:
  ```typescript
  if (entity.faction === Faction.PLAYER) {
    return;
  }
  ```
  While intentional to preserve arcade responsiveness, it means the submarine does not organically drift with ocean currents unless caught in a hydrothermal vent plume or crisis gravity well.

#### 3.1.2 Boundary Bounce & Restitution Analysis
- **Implementation State**:
  In `Player.ts` lines 118-125:
  ```typescript
  if (this.position.x < 0) this.position.x = 0;
  if (this.position.x + this.size.width > this.canvasWidth) {
    this.position.x = this.canvasWidth - this.size.width;
  }
  if (this.position.y < 0) this.position.y = 0;
  if (this.position.y + this.size.height > this.canvasHeight) {
    this.position.y = this.canvasHeight - this.size.height;
  }
  ```
- **Flaw**: `PROJECT.md` line 6 claims: *"Hydrodynamic Kinematics: Fluid buoyancy, drag, inertia, organic boundary restitution without artificial teleportation or clipping."* In actual code, there is **zero boundary restitution or bounce**. The player simply halts dead against the boundary wall. Only enemies have wall bouncing (`Enemy.ts:621-627`, which merely flips `direction = -direction`).

#### 3.1.3 The "Phantom Velocity" Disconnect
- **Implementation State**:
  `Player` extends `Entity`, inheriting `public velocity: Vector2D = { x: 0, y: 0 }`.
  `Player.update()` never modifies or uses `this.velocity`.
- **Downstream Defect A (`EndGameCrisis.ts:416-422`)**:
  ```typescript
  case CrisisArchetype.GLACIAL_OBLIVION:
    if (player.position.y > this.logicalHeight - 110) {
      player.velocity.x *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
      player.velocity.y *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
    }
    break;
  ```
  Because `player.velocity` is `{ x: 0, y: 0 }` and `Player.update()` only checks `this.speed`, the Glacial Oblivion Frostbite zone has **zero effect on the player**.
- **Downstream Defect B (`KrakenPrimeBoss.ts:426-428`)**:
  ```typescript
  let effectivePull = pullSpeed;
  if ((player.velocity && player.velocity.y > 0) || (player as any).isMovingDown) {
    effectivePull = Math.max(0, pullSpeed * 0.25 - (player.velocity ? player.velocity.y : 0));
  }
  player.position.y = Math.max(220, player.position.y - effectivePull * deltaTime);
  ```
  In actual gameplay, human players cannot press a key for downward movement (`isMovingDown` is never set in `GameManager.ts`), and `player.velocity.y` is permanently `0`. Thus, `effectivePull` is always `pullSpeed`, and the escape path is impossible. (The unit test `STREAM-D-03` passed only by synthetic test injection `player.velocity.y = 250;`).

---

### 3.2 Environmental Buoyancy & Hazard Interactions

#### 3.2.1 Hydrothermal Vent DORMANT Updraft Bug
- **Location**: `src/game/flagship/environment/HydrothermalVent.ts:242`
- **Code**:
  ```typescript
  const baseLift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
  const lift = baseLift * liftRatio;
  player.position.y = Math.max(capCeiling, player.position.y - lift);
  ```
- **Flaw**: When `this.state === VentState.DORMANT` (lasting 7.5 seconds out of every 12.0s cycle), `baseLift` remains `160 * deltaTime`! The vent continues pushing the player upward at 160 px/s even when completely dormant.

#### 3.2.2 The `y ≈ 155` Potential Well Trap & Ballast Suppression
- **Locations**: `HydrothermalVent.ts:233-245`, `Player.ts:101-112`
- **Mathematical Proof of Trap**:
  1. In `HydrothermalVent.ts:235-240`:
     - `capCeiling = 130`
     - `transitionZone = 90` (band [130, 220])
     - `depthAboveCap = Math.max(0, playerCenterY - 130)`
     - `liftRatio = Math.min(1.0, depthAboveCap / 90)`
     - `if (inCore || liftRatio >= 0.5) (player as any).isInUpdraft = true;`
  2. In `Player.ts:101`:
     - Ballast descent is guarded: `if (this.isBallastActive && !this.isInUpdraft)`.
     - When `isInUpdraft` is `true`, ballast descent is **100% blocked**.
  3. Plume Geometry:
     - Left vent at $x=180$, right vent at $x=420$.
     - At $y=155$, $R_{core} = 22 + (760-155) \times 0.08 = 70.4\text{ px}$.
     - $R_{halo} = 70.4 \times 1.85 = 130.24\text{ px}$.
     - Plume halos span $x \in [49.76, 310.24]$ (Left) and $x \in [289.76, 550.24]$ (Right). Combined, they cover **$500.48\text{ px}$ out of $600\text{ px}$ (83.4% of total canvas width)**!
  4. Equilibrium Stability Analysis:
     - If the player is at $y > 155$ (e.g. $y=156$, $centerY = 176$):
       $depthAboveCap = 46\text{ px} \implies liftRatio = 46/90 = 0.511 \ge 0.5$.
       `isInUpdraft` becomes `true`.
       On the next frame, `Player.update()` skips ballast descent.
       Vent applies lift: $\Delta y = -160 \times 0.511 \times \Delta t = -81.8 \Delta t$. Player is pushed UPWARD ($y$ decreases toward 155).
     - If the player is at $y < 155$ (e.g. $y=154$, $centerY = 174$):
       $depthAboveCap = 44\text{ px} \implies liftRatio = 44/90 = 0.488 < 0.5$.
       Outside the core, `isInUpdraft` becomes `false`.
       On the next frame, `Player.update()` executes ballast descent: $+165 \times \Delta t$.
       Vent applies lift: $-160 \times 0.488 \times \Delta t = -78 \Delta t$.
       Net velocity: $+165 - 78 = +87\text{ px/s}$ DOWNWARD ($y$ increases toward 155).
  5. **Conclusion**: $y = 155$ is an asymptotically stable equilibrium trap (a limit cycle). Unless the player actively steers horizontally into the remaining $<16.6\%$ canvas margins ($x < 49$ or $x > 551$), **the player can NEVER descend past $y = 155$**.

#### 3.2.3 Plume Cap Downward Teleportation
- **Location**: `src/game/flagship/environment/HydrothermalVent.ts:244`
- **Code**:
  ```typescript
  player.position.y = Math.max(capCeiling, player.position.y - lift);
  ```
- **Flaw**: If the player enters the upper convective plume at $y < capCeiling$ ($y < 130$, e.g. from an upper explosion, boss fling, or custom mode), `Math.max(130, y - lift)` evaluates to `130`, causing an immediate downward coordinate snap (teleportation).

---

### 3.3 Tether & Spring Kinematics in `HydraulicHarpoon.ts`

#### 3.3.1 Boss Instakill Catapult Exploit
- **Locations**: `src/game/flagship/weapons/HydraulicHarpoon.ts:156-174`, `704-706`
- **Mechanism**:
  1. Lines 383-385 allow tethering any hostile entity with $hp > 0$, including Apex Bosses (`KrakenPrimeBoss`, `AncientMech`, `DreadnoughtBoss`, `CrisisSovereign`).
  2. Pressing `'H'` triggers `releaseSlingshot()`:
     ```typescript
     const slingshotVelocity: Vector2D = {
       x: this.playerVelocity.x * 0.5,
       y: -this.config.slingshotBonus, // -720 px/s
     };
     this.slingshotProjectiles.push({
       entity: target,
       velocity: slingshotVelocity,
       remainingLife: 1.6,
       ...
     });
     ```
  3. Lines 704-706 update slingshot projectiles:
     ```typescript
     if (proj.remainingLife <= 0 || proj.entity.position.y <= -60) {
       proj.entity.isDead = true;
       this.slingshotProjectiles.splice(i, 1);
     }
     ```
  4. The boss travels at $-720\text{ px/s}$ straight up, crosses $y \le -60$ in less than 1.1 seconds, and has `isDead = true` executed unconditionally. A 12,000 HP boss is permanently deleted from the encounter.

#### 3.3.2 Uncapped Player Velocity Estimation & Slingshot Runaway
- **Location**: `src/game/flagship/weapons/HydraulicHarpoon.ts:237-243`
- **Code**:
  ```typescript
  if (deltaTime > 0) {
    this.playerVelocity = {
      x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
      y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
    };
    this.prevPlayerPos = { x: playerProw.x, y: playerProw.y };
  }
  ```
- **Flaw**: `this.playerVelocity` is calculated without any clamping or low-pass filtering. If the player experiences a single-frame position jump (e.g. continue respawn from $x=50$ to $x=300$, chassis change hitbox clamping, or nanite wall push) with $\Delta t = 0.016\text{s}$, the calculated velocity spikes to $>15,000\text{ px/s}$.
  This causes:
  - Slingshot catapult horizontal velocity: `slingshotVelocity.x = playerVelocity.x * 0.5` becomes $>7,500\text{ px/s}$, ejecting projectiles horizontally through side walls.
  - Centripetal whip tangential velocity $v_t$ explodes, dealing max slam damage instantly.
  - Spring damping force $fDamped$ spikes to massive values.

#### 3.3.3 Viscous Damping & Spring Numerical Chatter
- **Location**: `src/game/flagship/weapons/HydraulicHarpoon.ts:482-498`
- **Code**:
  ```typescript
  const vRelDotU = (0 - this.playerVelocity.x) * uHat.x + (0 - this.playerVelocity.y) * uHat.y;
  const fDamped = Math.max(0, fElastic + this.config.damping * vRelDotU);
  ...
  enemy.position.x -= uHat.x * clampedDisp;
  enemy.position.y -= uHat.y * clampedDisp;
  ```
- **Flaws**:
  1. `vRelDotU` assumes enemy velocity is `(0, 0)`: `(0 - playerVelocity.x)`. If the enemy is charging or diving at $300\text{ px/s}$, the damping term fails to account for enemy kinetic energy.
  2. Spring force is non-continuous: when $L > L_0$, a high-order non-linear force ($k_s=95$, up to $60\text{ px/frame}$) pulls the enemy. As soon as $L \le L_0$, the force drops discontinuously to zero.
  3. `enemy.position` is shifted directly by `clampedDisp`, but `(enemy as any).velocity` is **never updated or damped**.
  4. On the subsequent frame, `Enemy.update()` moves the enemy with its un-damped velocity, overshooting past $L_0$, causing alternating high-frequency spring chatter / numerical oscillation.

#### 3.3.4 Orphaned Tether State Leak Across Wave / Crisis Transitions
- **Location**: `src/game/GameManager.ts:560, 642, 731`
- **Code**:
  ```typescript
  this.enemies = []; // Clear standard hostiles for existential crisis encounter
  ```
- **Flaw**: When waves clear or an existential crisis begins, `this.enemies = []` is assigned directly without calling `flagshipManager.hydraulicHarpoon.reset()`.
  If an enemy was tethered at that moment:
  - `harpoon.tetheredEntity` still references the old enemy instance.
  - The old enemy's `isDead` remains `false` and `hp > 0`.
  - The cable remains connected. Because the enemy is no longer in `this.enemies`, bullets cannot collide with it, and it cannot be damaged.
  - The player starts the next wave / crisis tethered to an un-killable orphaned entity until manually hitting `'H'` or moving $>420\text{ px}$ away.

---

### 3.4 Boundary Containment Invariants under Multi-Force Composites

#### 3.4.1 Post-Subsystem Update Gap in `GameManager.ts`
- **Location**: `src/game/GameManager.ts:1279, 1724, 1850+`
- **Execution Order**:
  1. Line 1279: `this.player.update(deltaTime)` executes. Clamps `player.position.x` to $[0, 600 - width]$ and `player.position.y` to $[0, 800 - height]$.
  2. Line 1294: `this.endGameCrisis.update()` executes. Applies rift gravity wells, nanite boundary erosion, spore drift.
  3. Line 1724: `this.flagshipManager.update()` executes. Applies hydrothermal vent updraft & plume dispersion, confluence turbulence downwelling & divergence, hydraulic harpoon winch.
  4. Line 1780+: Barricades, bullets compaction, particles.
  5. Line 1261: `this.draw()` executes.
- **Flaw**: Between line 1724 and line 1261, there is **zero boundary clamping or finite coordinate verification** on `this.player.position`.
  If a composite force (e.g. Vent lateral dispersion $+93\text{ px/s}$ + Singularity core pull $+50\text{ px/s}$ + Nanite gust $+35\text{ px/s}$) acts on the player when already at the edge, or if downwelling pushes $y$ downward, the player will be rendered and collide outside the valid logical box $[0, 600] \times [0, 800]$ for that frame.

#### 3.4.2 Non-Player Entity Boundary Leaks
1. **Confluence Turbulence Seabed Penetration**:
   In `HydrothermalVent.ts:685`:
   ```typescript
   entity.position.y += downwellingSpeed;
   ```
   `downwellingSpeed` is added directly to `entity.position.y` without clamping. While `centerY <= 240` filters player/enemies initially, if an enemy with large height or downward momentum receives downwelling, it can be displaced into illegal coordinate space without upper-$y$ clamping.
2. **Mineral Nodules Lateral Escape**:
   In `HydrothermalVent.ts:515-525, 595`:
   Nodules have initial velocity $v_x = \pm 30\text{ px/s}, v_y = -160\text{ to } -280\text{ px/s}$.
   Line 595 removes nodules only if `nodule.position.y < 60 || nodule.isDead`.
   Nodules drifting laterally beyond $x < 0$ or $x > 600$ are never bounded or pruned, leaking memory and visual clutter off-screen until reaching $y < 60$.

---

## 4. Concrete Defect Registry

| ID | Severity | File & Lines | Description | Impact |
|---|---|---|---|---|
| **DEF-PHY-01** | CRITICAL | `src/game/Player.ts:93-98`<br>`src/game/crisis/EndGameCrisis.ts:418-421`<br>`src/game/flagship/factions/KrakenPrimeBoss.ts:426-428` | **Phantom Velocity Disconnect**: `player.velocity` is permanently `{x:0, y:0}` while movement uses `speed`. Downstream crisis/boss speed modifications on `player.velocity` fail silently; Kraken Maw escape check is permanently blocked. | Glacial Oblivion crisis debuff non-functional; Kraken vortex escape impossible in live gameplay. |
| **DEF-PHY-02** | HIGH | `src/game/flagship/environment/HydrothermalVent.ts:240-244`<br>`src/game/Player.ts:101-112` | **Vent Dormant Updraft & $y \approx 155$ Potential Well Trap**: DORMANT vents still apply $160\text{ px/s}$ lift; `liftRatio >= 0.5` sets `isInUpdraft = true`, disabling ballast descent. | Player gets trapped at $y \approx 155$ across 83.4% of canvas width even when vent is dormant. |
| **DEF-PHY-03** | HIGH | `src/game/flagship/weapons/HydraulicHarpoon.ts:704-706` | **Slingshot Boss Instakill Exploit**: Harpoon allows tethering and catapulting Boss entities off-screen at $-720\text{ px/s}$. Line 705 executes `proj.entity.isDead = true;` when $y \le -60$. | Trivial 1-second instakill of any 12,000 HP boss. |
| **DEF-PHY-04** | HIGH | `src/game/flagship/weapons/HydraulicHarpoon.ts:237-243` | **Uncapped Player Velocity Spikes**: Finite-difference `playerVelocity` calculation has no clamp or filter, exploding on coordinate resets. | Slingshot projectiles launched at extreme velocities ($>7,500\text{ px/s}$), wall clipping. |
| **DEF-PHY-05** | MEDIUM | `src/game/flagship/weapons/HydraulicHarpoon.ts:482-498` | **Harpoon Damping Discontinuity & Spring Chatter**: Viscous damping ignores enemy velocity; step-function spring force and direct position modification without velocity damping cause high-frequency visual chatter. | Numerical instability, visual jitter of tethered entities. |
| **DEF-PHY-06** | MEDIUM | `src/game/GameManager.ts:560, 642, 731` | **Orphaned Tether State Leak Across Waves**: `this.enemies = []` is cleared without resetting harpoon tether state, leaving phantom un-killable enemies tethered. | Player starts new wave/crisis tethered to an invisible, invincible ghost entity. |
| **DEF-PHY-07** | MEDIUM | `src/game/flagship/environment/HydrothermalVent.ts:244` | **Plume Cap Downward Snap**: `Math.max(capCeiling, player.position.y - lift)` snaps entities down to $y=130$ if they enter halo at $y < 130$. | Instantaneous downward teleportation. |
| **DEF-PHY-08** | MEDIUM | `src/game/GameManager.ts:1724-1770` | **Missing Post-Subsystem Coordinate Invariant Enforcement**: No global position clamping on `this.player.position` between `flagshipManager.update()` and `draw()`. | Temporary boundary breaches ($x < 0, x > 600 - w, y < 0, y > 800 - h$) under multi-force composites. |
| **DEF-PHY-09** | LOW | `src/game/flagship/environment/HydrothermalVent.ts:518-525, 595` | **Unbounded Mineral Nodule Lateral Drift**: Vent nodules drift laterally without horizontal boundary clamping or $x$-boundary pruning. | Off-canvas entity clutter. |
| **DEF-PHY-10** | LOW | `PROJECT.md:14` vs `src/game/flagship/environment/` | **Architectural Spec Discrepancy**: `Whirlpool.ts` and `TectonicRift.ts` listed in `PROJECT.md` are missing as standalone files (functionality is dispersed into other subsystems). | Documentation/architectural mismatch. |

---

## 5. Concrete Code Remediation Proposals

### Remediation for DEF-PHY-01: Connect `Player.velocity` & Speed Synchronization
In `src/game/Player.ts`, update `update()` to synchronize `this.velocity.x` and `this.velocity.y`:
```typescript
// Calculate effective velocity
let targetVx = 0;
if (this.isMovingLeft) targetVx -= this.speed;
if (this.isMovingRight) targetVx += this.speed;

// Smooth acceleration/drag or direct velocity binding
this.velocity.x = targetVx;
this.position.x += this.velocity.x * deltaTime;

// Ballast descent velocity tracking
if (this.isBallastActive && !this.isInUpdraft) {
  const targetY = this.baselineY;
  const diff = targetY - this.position.y;
  const step = this.ballastDescentSpeed * deltaTime;
  if (Math.abs(diff) <= step) {
    this.position.y = targetY;
    this.velocity.y = 0;
    this.isBallastActive = false;
  } else {
    this.velocity.y = Math.sign(diff) * this.ballastDescentSpeed;
    this.position.y += this.velocity.y * deltaTime;
  }
} else {
  this.velocity.y = 0;
}
```
In `src/game/crisis/EndGameCrisis.ts` (`GLACIAL_OBLIVION`), scale `player.speed` alongside `velocity`:
```typescript
case CrisisArchetype.GLACIAL_OBLIVION:
  if (player.position.y > this.logicalHeight - 110) {
    player.speed = player.baseSpeed * 0.65; // Directly apply speed debuff
  } else {
    player.speed = player.baseSpeed;
  }
  break;
```

### Remediation for DEF-PHY-02: Zero Dormant Updraft & Smooth Ballast Blend
In `src/game/flagship/environment/HydrothermalVent.ts`:
```typescript
// 1. Zero lift when dormant
let baseLift = 0;
if (this.state === VentState.ERUPTING) {
  baseLift = 260 * deltaTime;
} else if (this.state === VentState.CHARGING) {
  baseLift = 80 * deltaTime;
} else {
  baseLift = 0; // Dormant vent produces NO upward buoyant thrust
}

// 2. Only active erupting plume sets isInUpdraft
if ((inCore || liftRatio >= 0.7) && this.state === VentState.ERUPTING) {
  (player as any).isInUpdraft = true;
} else {
  (player as any).isInUpdraft = false;
}

// 3. Smooth lift calculation without clamping down to capCeiling if already above it
if (baseLift > 0 && (inCore || inHalo)) {
  const lift = baseLift * liftRatio;
  player.position.y = Math.min(player.position.y, Math.max(capCeiling, player.position.y - lift));
}
```

### Remediation for DEF-PHY-03: Boss Slingshot Immunity
In `src/game/flagship/weapons/HydraulicHarpoon.ts:150-183`:
```typescript
public releaseSlingshot(): SlingshotReleaseResult | null {
  if (this.state !== HarpoonState.TETHERED || !this.tetheredEntity) {
    return null;
  }

  const target = this.tetheredEntity;
  this.tetheredEntity = null;
  this.state = HarpoonState.RETRACTING;
  this.isWinching = false;

  // Bosses are immune to being launched as slingshot projectiles
  if ((target as any).isBoss || (target as any).type === EnemyType.BOSS) {
    if (typeof (target as any).takeDamage === 'function') {
      (target as any).takeDamage(this.config.slingshotDamage);
    }
    return {
      entity: target,
      velocity: { x: 0, y: 0 },
      damage: this.config.slingshotDamage,
    };
  }

  // Regular enemies: launch as slingshot projectile
  const slingshotVelocity: Vector2D = {
    x: Math.max(-300, Math.min(300, this.playerVelocity.x * 0.5)),
    y: -this.config.slingshotBonus,
  };
  ...
}
```

### Remediation for DEF-PHY-04 & DEF-PHY-05: Velocity Clamping & Spring Damping
In `src/game/flagship/weapons/HydraulicHarpoon.ts`:
```typescript
// Clamp tracked player velocity
const rawVx = (playerProw.x - this.prevPlayerPos.x) / deltaTime;
const rawVy = (playerProw.y - this.prevPlayerPos.y) / deltaTime;
this.playerVelocity = {
  x: Math.max(-500, Math.min(500, Number.isFinite(rawVx) ? rawVx : 0)),
  y: Math.max(-500, Math.min(500, Number.isFinite(rawVy) ? rawVy : 0)),
};

// Include enemy velocity in damping
const evx = (enemy as any).velocity?.x ?? 0;
const evy = (enemy as any).velocity?.y ?? 0;
const vRelX = evx - this.playerVelocity.x;
const vRelY = evy - this.playerVelocity.y;
const vRelDotU = vRelX * uHat.x + vRelY * uHat.y;
```

### Remediation for DEF-PHY-06: Harpoon Reset on Enemy Array Invalidation
In `src/game/GameManager.ts`:
Whenever `this.enemies = []` is called (lines 560, 642, 731):
```typescript
this.enemies = [];
if (this.flagshipManager && this.flagshipManager.hydraulicHarpoon) {
  this.flagshipManager.hydraulicHarpoon.reset();
}
```

### Remediation for DEF-PHY-08: Global Post-Subsystem Coordinate Invariant Enforcement
In `src/game/GameManager.ts:update()`, immediately following `this.flagshipManager.update(deltaTime, context)`:
```typescript
// Enforce strict canvas boundary invariant [0, 600 - width] x [0, 800 - height]
if (this.player && this.player.position) {
  const pw = this.player.size?.width ?? 50;
  const ph = this.player.size?.height ?? 40;
  if (!Number.isFinite(this.player.position.x)) this.player.position.x = (this.logicalWidth - pw) / 2;
  if (!Number.isFinite(this.player.position.y)) this.player.position.y = this.player.baselineY;
  this.player.position.x = Math.max(0, Math.min(this.logicalWidth - pw, this.player.position.x));
  this.player.position.y = Math.max(0, Math.min(this.logicalHeight - ph, this.player.position.y));
}
```

---

## 6. Verification Method

To independently verify all findings and confirm remediation:
1. **Automated Reproduction Test**:
   Run `npx playwright test tests/physics_edgecase_comprehensive.spec.ts`.
2. **New Regression Tests Required for Next Milestone (M1)**:
   - `test('QA-PHY-01: Dormant vent produces 0 upward lift and does not set isInUpdraft')`
   - `test('QA-PHY-02: Player inside vent halo can smoothly descend from y=155 down to baselineY')`
   - `test('QA-PHY-03: Boss entity cannot be catapulted by Hydraulic Harpoon into y <= -60 death trigger')`
   - `test('QA-PHY-04: Player velocity estimation is capped at 500 px/s during coordinate jumps')`
   - `test('QA-PHY-05: Wave transition resetting enemies array clears active harpoon tether')`
   - `test('QA-PHY-06: Player coordinates remain strictly in [0, 600-w] x [0, 800-h] after multi-force flagship update')`
3. **Type-Check and Build Invariant**:
   `npx tsc --noEmit && npm run build` must exit 0.
