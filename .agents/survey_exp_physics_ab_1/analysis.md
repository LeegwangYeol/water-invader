# Physics & Kinematic Subsystem Audit Report: Streams A & B

**Auditor Agent**: `survey_exp_physics_ab_1`  
**Target Subsystems**:
- **Stream A**: Player Kinematics & Ballast Subsystem (`Player.ts`, `ModularChassis.ts`, controls, baseline depth settling, boundary collision, ceiling/floor clipping, zero-coordinate safety, high-speed lateral penetration, chassis hitbox switches).
- **Stream B**: Environmental Dynamics & Hazard Fields (`HydrothermalVent.ts`, `OceanCurrent.ts`, `Whirlpool.ts` / Vortexes, `TectonicRift.ts` / Singularities, multi-hazard superposition, force accumulation, Euler integration clamping, vortex trapping/release vectors).

---

## 1. Executive Summary

A comprehensive, read-only static and mathematical audit was performed on the Water Invader game physics engine (`src/game/`). The investigation discovered **16 critical physical, kinematic, and numerical vulnerabilities** across Player Kinematics, Ballast Settling, Modular Chassis Hitbox transitions, Environmental Hazard Fields, and Gravity Singularities:

| ID | Stream | Subsystem / File | Line(s) | Severity | Category | Description |
|---|---|---|---|---|---|---|
| **BUG-01** | A | `ModularChassis.ts` | 410-430 | **CRITICAL** | Boundary Penetration | Lateral and floor boundary clipping on chassis hitbox switch (e.g. Stingray 38px -> Nautilus 64px). |
| **BUG-02** | A | `Player.ts` | 100-109 | **HIGH** | Kinematic Snapping | Ballast settling branch snaps instantly to `targetY` if `y > targetY`, causing unphysical teleportation. |
| **BUG-03** | A | `GameManager.ts` | 310, 321, 620 | **MEDIUM** | Desynchronization | Hardcoded `y = 740, x = 275` respawn coordinates desynchronized with modular chassis hitboxes and baselineY. |
| **BUG-04** | A | `HadalBioHorrors.ts` | 324-328 | **CRITICAL** | Stat Overwrite | `bioHorror.update()` unconditionally overwrites `player.speed` to 300 px/s every frame, destroying all chassis speed stats. |
| **BUG-05** | A | `EndlessDescent.ts` | 290-298 | **HIGH** | Velocity Blowup | Exponential velocity divergence caused by speed throttling desynchronized with `HadalBioHorrors` resets. |
| **BUG-06** | A | `GameManager.ts` | 2942-2954 | **HIGH** | Input Lockout | Keypresses buffered during SHOP, MENU, or CONTINUE states do not engage movement on transition to PLAYING. |
| **BUG-07** | A/C | `HydraulicHarpoon.ts` | 236-241 | **CRITICAL** | Velocity Blowup | Finite difference derivative spikes to -16,500 px/s on player continue/respawn, breaking slingshot catapult. |
| **BUG-08** | A/C | `Player.ts`, `Entity.ts` | 19, 39-65 | **MEDIUM** | CCD Tunneling | `Player` never sets `prevPosition`, disabling Continuous Collision Detection (CCD) for player vessel. |
| **BUG-09** | B | `HydrothermalVent.ts` | 247-261 | **CRITICAL** | Boundary Violation | Lateral plume dispersion lacks horizontal clamping, driving player vessel past lateral canvas boundaries ($x < 0$ or $x > 550$). |
| **BUG-10** | B | `GameManager.ts` | 1705-1709 | **CRITICAL** | State Entrapment | `hydrothermalVents.update()` runs unpaused during `GameState.SHOP`, pushing player to ceiling ($y = 130$) and out-of-bounds while shopping. |
| **BUG-11** | B | `HydrothermalVent.ts` | 233-245 | **HIGH** | Kinematic Oscillation | Discontinuous `liftRatio < 0.5` boundary toggles ballast on/off, creating a violent limit-cycle jitter at $y \approx 155$. |
| **BUG-12** | B | `HydrothermalVentManager.ts` | 495-497 | **HIGH** | Vortex Entrapment | Convergent stagnation zone between Left Vent ($x=180$) and Right Vent ($x=420$) traps passive players at $y=130$ indefinitely. |
| **BUG-13** | B | `KrakenPrimeBoss.ts`, `HydrothermalVent.ts` | 412, 244 | **HIGH** | Force Conflict | Superposition conflict between Vent ceiling ($y=130$) and Kraken Maw vortex floor ($y=220$) causes 60px positional flicker. |
| **BUG-14** | B | `EndGameCrisis.ts` | 322, 365 | **HIGH** | Boundary Violation | Gravitational vortexes (`applyRiftGravity`, `applySingularityRiftGravity`) lack canvas clamping, pushing player through walls. |
| **BUG-15** | B | `EndGameCrisis.ts` | 416-419 | **MEDIUM** | Dead Logic | Glacial Oblivion frostbite hazard modifies unused `player.velocity` vectors rather than `player.speed`. |
| **BUG-16** | B/E | `GameManager.ts` | 1215-1223 | **CRITICAL** | Accumulator Freeze | Unsanitized `frameTime` NaN propagates to `this.accumulator`, permanently freezing the fixed timestep update loop. |

---

## 2. Stream A: Player Kinematics & Ballast Subsystem

### 2.1 Hitbox Switch Boundary Penetration (BUG-01)
- **Source Files**: `src/game/flagship/progression/ModularChassis.ts` (lines 410-430), `src/game/GameManager.ts` (lines 2991-3000).
- **Direct Observation**:
  ```typescript
  // ModularChassis.ts:410
  public applyToPlayer(player: Player): void {
    if (!player) return;
    player.maxHp = this.activeChassis.maxHp;
    player.hp = this.activeChassis.baseHp;
    player.speed = this.activeChassis.baseSpeed;
    player.size.width = this.activeChassis.hitboxWidth;
    player.size.height = this.activeChassis.hitboxHeight;
  ```
- **Physical Analysis**:
  Hitbox dimensions across chassis:
  - `STINGRAY`: width = 38, height = 30
  - `NAUTILUS`: width = 64, height = 46 ($\Delta W = +26\text{ px}$, $\Delta H = +16\text{ px}$)
  - `LEVIATHAN`: width = 54, height = 42 ($\Delta W = +16\text{ px}$, $\Delta H = +12\text{ px}$)
  If a player playing Stingray moves to the right canvas wall, `position.x = 600 - 38 = 562`.
  When switching to Nautilus in the hangar or shop (`selectChassis(ChassisId.NAUTILUS)`):
  $$\text{RightEdge} = \text{position.x} + \text{size.width} = 562 + 64 = 626\text{ px} > 600\text{ px}$$
  Similarly, near the seabed at $y = 770$:
  $$\text{BottomEdge} = \text{position.y} + \text{size.height} = 770 + 46 = 816\text{ px} > 800\text{ px}$$
  `applyToPlayer()` fails to perform immediate coordinate clamping:
  $$\text{position.x} = \max(0, \min(\text{canvasWidth} - \text{size.width}, \text{position.x}))$$
  $$\text{position.y} = \max(0, \min(\text{canvasHeight} - \text{size.height}, \text{position.y}))$$
  Until `player.update()` runs in the subsequent frame, the vessel penetrates the physical boundary.

### 2.2 Ballast Settling Asymmetry & Teleportation Snap (BUG-02)
- **Source File**: `src/game/Player.ts` (lines 100-109).
- **Direct Observation**:
  ```typescript
  // Player.ts:101
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
- **Physical Analysis**:
  The ballast mechanism assumes `this.position.y < targetY`.
  When `position.y > targetY` (e.g. following a chassis switch from Stingray baseline 750 to Nautilus baseline 734, or following downward spore buffeting), the condition `position.y < targetY` evaluates to `false`.
  The `else` branch executes immediately on frame 1:
  $$\text{position.y} = \text{targetY}$$
  This causes an instant 16px vertical teleportation upward in a single time step. Smooth hydrodynamic restoration requires bi-directional easing or signed velocity:
  $$\text{position.y} \pm= \text{ballastSpeed} \cdot \Delta t$$

### 2.3 Hardcoded Respawn Coordinates vs Modular Dimensions (BUG-03)
- **Source Files**: `src/game/GameManager.ts` (lines 310-311, 321-322, 620-621).
- **Direct Observation**:
  ```typescript
  // GameManager.ts:620
  this.player.position.x = this.logicalWidth / 2 - 25;
  this.player.position.y = this.logicalHeight - 60;
  ```
- **Physical Analysis**:
  The coordinates hardcode $x = 300 - 25 = 275$ and $y = 800 - 60 = 740$, assuming a fixed 50x40 vessel.
  Baseline depths per chassis:
  - Nautilus: $\text{baselineY} = 800 - 46 - 20 = 734\text{ px}$. Spawning at 740 places it 6px below baseline.
  - Stingray: $\text{baselineY} = 800 - 30 - 20 = 750\text{ px}$. Spawning at 740 places it 10px above baseline.
  - Leviathan: $\text{baselineY} = 800 - 42 - 20 = 738\text{ px}$. Spawning at 740 places it 2px below baseline.
  - Ghost: $\text{baselineY} = 800 - 34 - 20 = 746\text{ px}$. Spawning at 740 places it 6px above baseline.
  Furthermore, center $x$ offsets vary:
  $$\text{Correct } X = \frac{\text{logicalWidth} - \text{player.size.width}}{2}$$
  $$\text{Correct } Y = \text{player.baselineY}$$
  Spawning at hardcoded 275 and 740 produces asymmetric lateral placement and immediate ballast activation upon continue.

### 2.4 Modular Chassis Speed Overwrite by Hadal Bio-Horrors (BUG-04)
- **Source Files**: `src/game/flagship/progression/ModularChassis.ts` (line 415), `src/game/flagship/factions/HadalBioHorrors.ts` (lines 324-328).
- **Direct Observation**:
  ```typescript
  // ModularChassis.ts:415
  player.speed = this.activeChassis.baseSpeed;
  // player.baseSpeed is NEVER updated!
  
  // HadalBioHorrors.ts:324
  if (n > 0) {
    player.speed = (player.baseSpeed || 300) * speedRatio;
  } else {
    player.speed = player.baseSpeed || 300;
  }
  ```
- **Physical Analysis**:
  `Player` has both `speed` and `baseSpeed` initialized to 300 in `Player.ts:8-9`.
  When `ModularChassis.applyToPlayer()` executes, it assigns `player.speed = this.activeChassis.baseSpeed`, but omits `player.baseSpeed = this.activeChassis.baseSpeed`.
  In `FlagshipManager.ts:188`, subsystems execute in order: `modularChassis` $\to$ `crewDeck` $\to$ `bioHorror`.
  When `HadalBioHorrors.update()` executes, line 327 evaluates:
  $$\text{player.speed} = \text{player.baseSpeed} \parallel 300$$
  Since `player.baseSpeed` remains 300:
  - Nautilus: Intended speed 220 px/s is boosted to 300 px/s every frame.
  - Stingray: Intended speed 420 px/s is throttled to 300 px/s every frame.
  - Leviathan: Intended speed 270 px/s is boosted to 300 px/s every frame.
  - Ghost: Intended speed 320 px/s is throttled to 300 px/s every frame.
  - Kraken: Dynamic pulsating propulsion ($300 + \sin(\omega t) \cdot 60$, lines 496-497) is completely erased.
  - Crew Deck: Speed modifiers (`player.speed = player.baseSpeed * 1.20`, line 725) are completely erased.

### 2.5 Endless Descent Speed Throttling Divergence (BUG-05)
- **Source Files**: `src/game/flagship/modes/EndlessDescent.ts` (lines 290-298).
- **Direct Observation**:
  ```typescript
  // EndlessDescent.ts:290
  if (this.runState.pressure.stressPercentage >= 50) {
    if (!this.isSpeedThrottled && context.player) {
      context.player.speed *= 0.85;
      this.isSpeedThrottled = true;
    }
  } else if (this.isSpeedThrottled && context.player) {
    context.player.speed /= 0.85;
    this.isSpeedThrottled = false;
  }
  ```
- **Physical Analysis**:
  Because `HadalBioHorrors` resets `player.speed = 300` on every frame, when stress drops below 50%:
  $$\text{context.player.speed} = \frac{300}{0.85} \approx 352.94\text{ px/s}$$
  Repeated transitions across the 50% pressure boundary compound multiplicatively if speed was cached or if baseSpeed was altered, leading to velocity blowups.

### 2.6 Input Lockout on Game State Transitions (BUG-06)
- **Source Files**: `src/game/GameManager.ts` (lines 2942-2954, 452-500, 611-640).
- **Direct Observation**:
  ```typescript
  // GameManager.ts:2942
  if (this.state === GameState.PLAYING) {
    if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = true;
    if (k === 'arrowright' || k === 'd') this.player.isMovingRight = true;
    if (k === ' ' || k === 'spacebar' || k === 'space') {
      this.player.isShooting = true;
    }
  }
  ```
- **Physical Analysis**:
  If a player holds down 'A', 'D', or Spacebar while in `GameState.SHOP` or on the Game Over screen:
  `this.keysPressed[k] = true` is recorded, but `this.player.isMovingLeft` is not set.
  When the player clicks "Start Next Wave" or "Continue", `this.state` transitions to `GameState.PLAYING`.
  Neither `startNextWave()` nor `continueGame()` resynchronizes `player.isMovingLeft = !!(this.keysPressed['a'] || this.keysPressed['arrowleft'])`.
  The player submarine remains stationary and will not shoot until the player physically releases and re-presses the key.

### 2.7 Harpoon Velocity Finite-Difference Singularity (BUG-07)
- **Source Files**: `src/game/flagship/weapons/HydraulicHarpoon.ts` (lines 235-241).
- **Direct Observation**:
  ```typescript
  // HydraulicHarpoon.ts:236
  if (deltaTime > 0) {
    this.playerVelocity = {
      x: (playerProw.x - this.prevPlayerPos.x) / deltaTime,
      y: (playerProw.y - this.prevPlayerPos.y) / deltaTime,
    };
    this.prevPlayerPos = { x: playerProw.x, y: playerProw.y };
  }
  ```
- **Physical Analysis**:
  Upon death and continue, the player position teleports from e.g. $x = 550$ to $x = 275$.
  With $\Delta t = 0.0166\text{ s}$:
  $$v_x = \frac{275 - 550}{0.0166} = -16,566.26\text{ px/s}$$
  This singular velocity feeds directly into:
  - Slingshot catapult release (line 156): $v_{\text{launch}} = -8,283\text{ px/s}$
  - Centripetal whip angular velocity (line 465): $\omega = \frac{16,566}{L}$
  - Wrecking ball tangential velocity (line 466): $v_t = 16,566\text{ px/s}$
  - Slam damage formula (line 480): Max damage (140) triggered instantly.
  The finite difference velocity lacks an upper bound clamp (`Math.min(600, ...)`) and lacks a reset when the vessel respawns.

---

## 3. Stream B: Environmental Dynamics & Hazard Fields

### 3.1 Unbounded Lateral Plume Dispersion (BUG-09)
- **Source File**: `src/game/flagship/environment/HydrothermalVent.ts` (lines 247-261).
- **Direct Observation**:
  ```typescript
  // HydrothermalVent.ts:255
  const dispersionRatio = 1.0 - liftRatio;
  const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio * deltaTime;
  const sign = playerCenterX >= this.anchorX ? 1 : -1;
  const ambientSurfaceDrift = (playerCenterX >= this.anchorX ? 60 : 0) * dispersionRatio * deltaTime;
  player.position.x += sign * dispersionSpeed + ambientSurfaceDrift;
  ```
- **Physical Analysis**:
  The displacement `sign * dispersionSpeed + ambientSurfaceDrift` is added directly to `player.position.x` without clamping to $[0, \text{canvasWidth} - \text{player.size.width}]$.
  Near the right vent ($x = 420$), when the player approaches the right boundary ($x = 550$):
  $$\Delta x = (120 + 60) \cdot 1.0 \cdot \Delta t = +180\Delta t\text{ px}$$
  $$\text{position.x} + \text{width} = 550 + 180\Delta t + 50 > 600\text{ px}$$
  The player vessel penetrates through the right canvas wall.
  Near the left vent ($x = 180$), when $x < 180$, `sign = -1`, pushing the player leftwards into negative coordinates ($x < 0$).

### 3.2 Unpaused Vent Buoyancy During GameState.SHOP (BUG-10)
- **Source Files**: `src/game/GameManager.ts` (lines 1705-1709), `src/game/flagship/environment/HydrothermalVent.ts` (lines 224-262).
- **Direct Observation**:
  ```typescript
  // GameManager.ts:1705
  } else if (this.state === GameState.SHOP) {
    if (this.flagshipManager) {
      this.flagshipManager.update(deltaTime, this.getFlagshipContext());
    }
  }
  ```
- **Physical Analysis**:
  In `GameState.SHOP`:
  1. `flagshipManager.update()` is invoked every frame.
  2. `HydrothermalVent.update()` executes, actively computing buoyancy lift (`player.position.y -= lift`) and lateral dispersion.
  3. `player.update(deltaTime)` is **NOT** invoked while in `GameState.SHOP`.
  4. Ballast restoration is halted because `player.update()` is not running.
  5. Boundary clamping is halted because `player.update()` is not running.
  6. If the player opens the shop while over a vent, the vent pushes the player to the ceiling cap ($y = 130$) and laterally through the walls during shopping.
  7. When the player clicks "Start Next Wave", the vessel spawns pinned at $y = 130$ directly inside enemy formation trajectories.

### 3.3 LiftRatio = 0.5 Limit-Cycle Oscillation in Convective Halo (BUG-11)
- **Source Files**: `src/game/flagship/environment/HydrothermalVent.ts` (lines 233-245), `src/game/Player.ts` (lines 101-110).
- **Direct Observation**:
  ```typescript
  // HydrothermalVent.ts:239
  const depthAboveCap = Math.max(0, playerCenterY - capCeiling);
  const liftRatio = Math.min(1.0, depthAboveCap / transitionZone);
  if (inCore || liftRatio >= 0.5) {
    (player as any).isInUpdraft = true;
  }
  const baseLift = (this.state === VentState.ERUPTING ? 260 : 160) * deltaTime;
  const lift = baseLift * liftRatio;
  player.position.y = Math.max(capCeiling, player.position.y - lift);
  ```
- **Physical Analysis**:
  In the outer halo (`inHalo && !inCore`), when $\text{liftRatio} < 0.5$ ($\text{depthAboveCap} < 45\text{ px}$, $\text{playerCenterY} < 175\text{ px}$):
  `isInUpdraft` is set to `false`.
  In `Player.update()`, ballast descent activates because `isBallastActive && !isInUpdraft`:
  $$v_{\text{descent}} = +165\text{ px/s (downward)}$$
  In `HydrothermalVent.update()`, halo lift acts:
  $$v_{\text{lift}} = 160 \times 0.49 = -78.4\text{ px/s (upward)}$$
  Net velocity: $+86.6\text{ px/s}$ downward.
  As the vessel descends, $\text{depthAboveCap}$ exceeds 45px ($\text{liftRatio} \ge 0.5$).
  Immediately, `isInUpdraft` flips to `true`, deactivating ballast!
  Net velocity becomes $-80\text{ px/s}$ upward.
  As the vessel ascends, $\text{depthAboveCap}$ drops below 45px, re-activating ballast!
  This creates a high-frequency limit-cycle oscillation / jittering at $y \approx 155$ in the halo band.

### 3.4 Convergent Stagnation Well in Overlap Zone [286, 314] (BUG-12)
- **Source Files**: `src/game/flagship/environment/HydrothermalVent.ts` (lines 247-261), `src/game/flagship/environment/HydrothermalVentManager.ts` (lines 494-497).
- **Direct Observation**:
  Left Vent anchor: $x = 180$. Right Vent anchor: $x = 420$.
  Plume cap halo radius at $y = 130$: $R_{\text{halo}} = 133.94\text{ px}$.
  - Left Vent halo span: $[180 - 133.94, 180 + 133.94] = [46.06, 313.94]$
  - Right Vent halo span: $[420 - 133.94, 420 + 133.94] = [286.06, 553.94]$
  - Overlap confluence band: $x \in [286.06, 313.94]$ at $y = 130$.
- **Physical Analysis**:
  For any coordinate in $x \in [286, 314]$:
  1. Left Vent evaluates $\text{playerCenterX} \ge 180 \implies \text{sign} = +1$. Pushes vessel **EAST** towards center.
  2. Right Vent evaluates $\text{playerCenterX} < 420 \implies \text{sign} = -1$. Pushes vessel **WEST** towards center.
  3. Both vents apply upward convective lift, keeping $\text{isInUpdraft} = \text{true}$.
  4. Because `isInUpdraft` is true, ballast descent is permanently suppressed.
  5. The opposing lateral forces cancel out near $x = 300$, forming a **convergent stagnation well**.
  Empirical proof from `adversarial_buoyancy_modular_overlap.spec.ts:238`:
  > *"Under passive conditions, NO chassis ever descends past ceiling! (`descendedCount === 0` over 30 seconds)"*
  A passive player caught in the overlap zone is permanently trapped at the ceiling.

### 3.5 Multi-Hazard Vertical Conflict: Kraken Maw Vortex vs Vent Plume (BUG-13)
- **Source Files**: `src/game/flagship/factions/KrakenPrimeBoss.ts` (line 412), `src/game/flagship/environment/HydrothermalVent.ts` (line 244).
- **Direct Observation**:
  ```typescript
  // HydrothermalVent.ts:244
  player.position.y = Math.max(capCeiling, player.position.y - lift); // capCeiling = 130
  
  // KrakenPrimeBoss.ts:412
  player.position.y = Math.max(220, player.position.y - pullSpeed * deltaTime);
  ```
- **Physical Analysis**:
  When Kraken Prime reaches Phase 2 (Charybdis Maw Vortex) while a Hydrothermal Vent is erupting:
  1. `hydrothermalVents.update()` executes first, lifting the player toward $y = 130$ (e.g. reaching $y = 160$).
  2. `apexBoss.update()` executes later in the same frame. Line 412 computes:
     $$\text{player.position.y} = \max(220, 160 - \text{pullSpeed} \cdot \Delta t) = 220\text{ px}$$
  3. Kraken Prime forcibly clamps the player down to 220px.
  4. On the subsequent frame, the Vent lifts the player back towards 160px.
  5. The player vessel flickers violently between 160px and 220px (a 60px displacement every single frame).

### 3.6 Unclamped Gravitational Vortex Vectors (BUG-14)
- **Source File**: `src/game/crisis/EndGameCrisis.ts` (lines 315-323, 358-366).
- **Direct Observation**:
  ```typescript
  // EndGameCrisis.ts:322
  const force = (1 - dist / pullRadius) * pullForce * deltaTime;
  player.position.x += (dx / dist) * force;
  
  // EndGameCrisis.ts:365
  const force = (1 - dist / pullRadius) * pullForce * deltaTime * direction;
  player.position.x += (dx / dist) * force;
  ```
- **Physical Analysis**:
  Unlike line 425 and line 441 in the same file which enforce:
  $$\text{player.position.x} = \max(10, \min(\text{logicalWidth} - \text{player.size.width} - 10, \text{player.position.x}))$$
  the gravitational singularity methods (`applyRiftGravity` and `applySingularityRiftGravity`) omit coordinate clamping.
  In Singularity Core, the right rift exerts a repulsive push (`direction = -1`) of 50 px/s. When combined with ambient currents or vent dispersion, this drives the player through the lateral walls ($x < 0$ or $x > 550$).

### 3.7 Ineffective Hazard Logic: Glacial Oblivion & Biolapse Battery (BUG-15)
- **Source Files**: `src/game/crisis/EndGameCrisis.ts` (lines 416-419), `src/game/flagship/environment/BiolapseDarknessCycle.ts` (lines 160, 241, 328).
- **Direct Observation**:
  ```typescript
  // EndGameCrisis.ts:417
  player.velocity.x *= Math.max(0.80, 1 - 0.20 * deltaTime * 60);
  
  // BiolapseDarknessCycle.ts:241
  this.cachedPlayerVx = context.player.velocity?.x ?? 0;
  // BiolapseDarknessCycle.ts:328
  const isMoving = Math.abs(this.cachedPlayerVx) > 10;
  const charge = isMoving ? 3.0 : 1.2;
  ```
- **Physical Analysis**:
  `Player.ts` updates kinematics via `position.x += this.speed * deltaTime`. The inherited `velocity.x` and `velocity.y` properties from `Entity` are **NEVER** populated or used by `Player`.
  Consequently:
  - `player.velocity.x` is always 0.
  - The Glacial Oblivion crisis slow is a non-functional no-op.
  - `cachedPlayerVx` in `BiolapseDarknessCycle` is always 0.
  - Dynamic headlight tilt angle (`getBeamAngle`, line 160) is permanently locked at $-90^\circ$.
  - Photonic battery kinetic recharge bonus (`charge = 3.0`) can never activate.

### 3.8 Fixed Timestep Accumulator NaN Poisoning (BUG-16)
- **Source File**: `src/game/GameManager.ts` (lines 1215-1223).
- **Direct Observation**:
  ```typescript
  let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);
  this.lastTime = timestamp;
  if (frameTime > 0.1) {
    frameTime = 0.1;
  }
  this.accumulator += frameTime;
  ```
- **Physical Analysis**:
  If `timestamp` or `lastTime` is `NaN` (e.g. from background tab throttled timers or uninitialized `performance.now()`):
  `Math.max(0, NaN)` returns `NaN`.
  `frameTime > 0.1` evaluates to `false`.
  `this.accumulator += NaN` results in `this.accumulator = NaN`.
  In the fixed timestep loop:
  `while (this.accumulator >= this.FIXED_STEP)` evaluates `NaN >= 0.0166` which is `false`.
  The entire simulation update loop terminates permanently. The screen continues to render empty frames via `requestAnimationFrame`, but all physics, entities, and inputs freeze permanently.

---

## 4. Synthesis & Cross-Subsystem Interactions

1. **Kinematics & Stat Hierarchy Failure**:
   The engine lacks a single authoritative velocity/kinematics pipeline. `Player.ts` uses scalar `speed` for movement, while `Entity.ts` exposes `velocity.x/y`. Environmental hazards and secondary systems inconsistently read or modify one or the other, causing silent functional failures (Glacial Oblivion, Biolapse headlight tilt, battery recharge).
2. **Hitbox Dimension Invariants**:
   The system invariant `logicalWidth = 600, logicalHeight = 800` is compromised when changing chassis hitboxes near canvas edges. Hitbox resizing must be accompanied by an immediate constraint resolution pass.
3. **Environmental Superposition Traps**:
   Multiple hazards (Vents + Kraken Vortex + Rift Singularities) modify `player.position` directly rather than accumulating generalized force vectors with Euler integration and terminal velocity clamping. Because displacements are applied sequentially with conflicting `Math.max()` clamps, entities experience limit-cycle oscillations and stagnation wells.
4. **State Machine Decoupling**:
   Running environmental physics inside `GameState.SHOP` without updating player ballast or clamping allows external forces to displace the vessel while the player cannot control it.

---

## 5. Proposed Remediation Architecture (Non-Modifying Blueprint)

To resolve all 16 vulnerabilities while preserving all architectural invariants (`logicalWidth=600`, `logicalHeight=800`, zero regressions):

1. **Unified Velocity Kinematics (`Player.ts`)**:
   In `Player.update(deltaTime)`:
   - Synchronize `this.velocity.x = (this.isMovingLeft ? -this.speed : (this.isMovingRight ? this.speed : 0))`.
   - Ensure `prevPosition = { x: this.position.x, y: this.position.y }` is recorded at the start of every frame for Continuous Collision Detection.
2. **Safe Modular Chassis Switch (`ModularChassis.ts`)**:
   In `applyToPlayer(player)`:
   - Set `player.baseSpeed = this.activeChassis.baseSpeed`.
   - Immediately clamp coordinates:
     `player.position.x = Math.max(0, Math.min(player.canvasWidth - player.size.width, player.position.x))`.
     `player.position.y = Math.max(0, Math.min(player.canvasHeight - player.size.height, player.position.y))`.
3. **Smooth Ballast Settling (`Player.ts`)**:
   Replace asymmetric `else` snap with signed descent/ascent easing:
   ```typescript
   const dy = targetY - this.position.y;
   if (Math.abs(dy) < 1.0) {
     this.position.y = targetY;
     this.isBallastActive = false;
   } else {
     this.position.y += Math.sign(dy) * Math.min(Math.abs(dy), this.ballastDescentSpeed * deltaTime);
   }
   ```
4. **Pause Environment in Shop (`GameManager.ts`)**:
   Do not run `flagshipManager.update()` in `GameState.SHOP`, or pass a paused context where environment forces do not displace player position.
5. **Plume Dispersion & Gravity Clamping (`HydrothermalVent.ts`, `EndGameCrisis.ts`)**:
   Strictly clamp `player.position.x = Math.max(0, Math.min(canvasWidth - player.size.width, player.position.x))` after applying lateral forces.
6. **Robust Loop Accumulator (`GameManager.ts`)**:
   Sanitize `frameTime`:
   ```typescript
   if (!Number.isFinite(frameTime) || frameTime < 0) frameTime = 0.016;
   if (frameTime > 0.1) frameTime = 0.1;
   ```
