# Total Codebase Inspection ("총검사") Report: Security & Mathematical Boundary

**Auditor Archetype:** Security & Mathematical Boundary Explorer (`ti_survey_sec_math_1`)  
**Project:** Water Invader (`/Users/user/src/water-invader`)  
**Target Milestone:** Total Codebase Inspection ("총검사")  
**Date:** 2026-09-23  
**Status:** Audit Complete (Read-Only Analysis)

---

## Executive Summary

An exhaustive, read-only mathematical and security boundary inspection was conducted across the core game loop (`GameManager.ts`, `Entity.ts`, `Bullet.ts`, `Enemy.ts`, `Player.ts`, `Barricade.ts`), the flagship subsystems (`flagship/weapons`, `flagship/factions`, `flagship/environment`, `flagship/sensory`, `flagship/modes`), the crisis engine (`crisis/`), and the UI input pipeline (`components/game-canvas.tsx`).

The audit uncovered **14 critical vulnerabilities** spanning:
1. **Mathematical instability & NaN/Infinity injection**: Unsanitized trigonometric calls (`Math.atan2`), vector normalizations susceptible to division by zero or `Infinity / Infinity = NaN`, and canvas rendering methods executing on non-finite coordinates.
2. **Continuous Collision Detection (CCD) failure & tunneling**: Axis-aligned swept bounding boxes causing phantom hit false positives on diagonal shots; critical tunneling by ultra-high-speed projectiles (Cavitation Torpedo at 580 px/s, Slingshot at 720 px/s) and diving enemies (`DIVER` at 300–900 px/s) due to missing `prevPosition` recording and point-instantaneous collision checks.
3. **Unbounded memory leaks & cross-wave persistence**: Flagship weapon and faction arrays persisting across waves, asymmetrical offscreen culling causing permanent zombie entities, and shop-phase continuous simulation where Broodmothers spawn endless minions while the player browses the shop.
4. **Input sanitization & coordinate clamping defects**: Unclamped canvas pointer events passing negative and extreme coordinates into game subsystems, and execution-order post-update boundary breaches where hydrodynamic forces push the player outside the playable arena without re-clamping.

---

## Pillar 1: Coordinate Math Defense (Division-by-Zero, NaN/Infinity, Normalization)

### 1.1 Homing Missile Unchecked Trigonometry & NaN Propagation
- **File & Lines:** `src/game/Bullet.ts:285–305`
- **Observed Code:**
  ```typescript
  const targetX = this.target.position.x + this.target.size.width / 2;
  const targetY = this.target.position.y + this.target.size.height / 2;
  const myX = this.position.x + this.size.width / 2;
  const myY = this.position.y + this.size.height / 2;

  const targetAngle = Math.atan2(targetY - myY, targetX - myX);
  const deltaTheta = Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle));
  const maxTurn = this.turnRate * deltaTime;
  this.angle += Math.max(-maxTurn, Math.min(maxTurn, deltaTheta));
  ```
- **Mathematical Failure Proof:**
  If `this.target.position` contains `NaN` or non-finite values (or if target is destroyed mid-frame leaving uninitialized state):
  $$\Delta x = \text{NaN} - \text{myX} = \text{NaN}$$
  $$\text{targetAngle} = \text{atan2}(\text{NaN}, \text{NaN}) = \text{NaN}$$
  $$\text{deltaTheta} = \text{atan2}(\sin(\text{NaN}), \cos(\text{NaN})) = \text{NaN}$$
  $$\text{this.angle} += \text{NaN} \implies \text{this.angle} = \text{NaN}$$
  $$\text{velocity.x} = \cos(\text{NaN}) \cdot v = \text{NaN}, \quad \text{velocity.y} = \sin(\text{NaN}) \cdot v = \text{NaN}$$
  $$\text{position.x} += \text{NaN} \implies \text{position.x} = \text{NaN}$$
  At lines 310–313: `this.smokeTrail.push({ x: tailX, y: tailY, ... })` pushes `NaN` coordinates into the smoke particle array. In `draw()` (lines 337, 344), `ctx.arc(s.x, s.y, ...)` and `ctx.translate(cx, cy)` receive `NaN`, breaking Canvas2D rendering or silently aborting rendering in strict WebKit browsers.
- **Recommended Remediation:**
  1. Validate `Number.isFinite(targetX) && Number.isFinite(targetY)` before computing `Math.atan2`.
  2. If `isNaN(this.angle)`, reset `this.angle = -Math.PI / 2` (upward).
  3. Validate `isFinite(this.position.x) && isFinite(this.position.y)`.

---

### 1.2 Crisis Sovereign Eye Angle Unvalidated Pointer / Core Coordinates
- **File & Lines:** `src/game/crisis/CrisisSovereign.ts:213–217` & `lines 598, 926, 1035, 1137, 1419, 1557, 1678, 1817, 1968`
- **Observed Code:**
  ```typescript
  // Line 213
  if (playerPosition) {
    const core = this.getCoreCenter();
    this.eyeAngle = Math.atan2(playerPosition.y - core.y, playerPosition.x - core.x);
  }
  // Line 598 (draw)
  const pupilX = cx + Math.cos(this.eyeAngle) * lookDist;
  const pupilY = cy + Math.sin(this.eyeAngle) * lookDist;
  ctx.arc(pupilX, pupilY, 4.5, 0, Math.PI * 2);
  ```
- **Mathematical Failure Proof:**
  While lines 233–234 defensive checks were added for `this.position.x` and `this.position.y`, `this.eyeAngle` has no defense. If `playerPosition` has `NaN` (or before player initializes), `this.eyeAngle` becomes `NaN`.
  In 9 different phase-specific render methods (`drawSingularityCore`, `drawHullDecayPhase`, `drawEnragedAura`, etc.), `Math.cos(this.eyeAngle)` and `Math.sin(this.eyeAngle)` evaluate to `NaN`.
  Passing `NaN` to `ctx.arc(pupilX, pupilY, ...)` causes canvas rendering commands to be discarded or throw DOM exceptions in strict browser contexts.
- **Recommended Remediation:**
  Ensure `this.eyeAngle = Number.isFinite(this.eyeAngle) ? this.eyeAngle : Math.PI / 2` in `update()` and prior to all drawing routines.

---

### 1.3 Automaton Shield Grid Vector Normalization with Infinity
- **File & Lines:** `src/game/flagship/factions/AutomatonShieldGrid.ts:211–217`
- **Observed Code:**
  ```typescript
  const bulletSpeed = Math.hypot(bulletVel.x, bulletVel.y) || 1;
  const bulletDirX = bulletVel.x / bulletSpeed;
  const bulletDirY = bulletVel.y / bulletSpeed;
  const impactCos = -(bulletDirX * drone.shieldNormal.x + bulletDirY * drone.shieldNormal.y);
  ```
- **Mathematical Failure Proof:**
  If `bulletVel.x` or `bulletVel.y` is `Infinity` (e.g., from an instantaneous acceleration or zero-time delta):
  $$\text{bulletSpeed} = \text{hypot}(\infty, 0) = \infty$$
  $$\text{bulletSpeed} \lor 1 = \infty$$
  $$\text{bulletDirX} = \frac{\infty}{\infty} = \text{NaN}$$
  $$\text{impactCos} = -(\text{NaN} \cdot n_x + \dots) = \text{NaN}$$
  In JavaScript, `NaN >= AutomatonShieldGrid.SHIELD_ARC_COS` evaluates to `false`. The drone fails to register frontal deflection and absorbs full damage, or conversely misclassifies shield hits.
- **Recommended Remediation:**
  Guard with `if (!Number.isFinite(bulletVel.x) || !Number.isFinite(bulletVel.y)) return fallback;`.

---

### 1.4 Bioluminescent Laser Segment Projection with Zero / Non-Finite Length
- **File & Lines:** `src/game/flagship/weapons/BioluminescentLaser.ts:418–435`
- **Observed Code:**
  ```typescript
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return;

  for (const enemy of enemies) {
    ...
    const t = Math.max(0, Math.min(1, ((ex - x1) * dx + (ey - y1) * dy) / lenSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distSq = (ex - projX) ** 2 + (ey - projY) ** 2;
    if (distSq <= hitRadius * hitRadius) { ... }
  }
  ```
- **Mathematical Failure Proof:**
  1. If `x1, y1` or `x2, y2` contains `NaN`, `lenSq` evaluates to `NaN`.
  2. In JavaScript, `NaN === 0` is `false`. The early exit does NOT trigger!
  3. Inside the loop, `t = Math.max(0, Math.min(1, NaN / NaN)) = NaN`.
  4. `projX = NaN`, `projY = NaN`, `distSq = NaN`.
  5. The loop performs wasteful computation across all enemies with invalid numerical values.
  6. Furthermore, if `0 < lenSq < 1e-12` (sub-pixel segment), floating-point division by `lenSq` produces massive values (`1e12`), resulting in `projX` flying off to infinity.
- **Recommended Remediation:**
  Replace check with: `if (!Number.isFinite(lenSq) || lenSq < 0.0001) return;`.

---

## Pillar 2: Continuous Collision Detection (CCD) & Tunneling

### 2.1 Swept AABB Phantom Collisions on Diagonal Projectiles
- **File & Lines:** `src/game/Entity.ts:40–65` & `81–112`
- **Observed Code:**
  ```typescript
  public getSweptRect(): Rect {
    if (!this.prevPosition) return this.getRect();
    const minX = Math.min(this.prevPosition.x, this.position.x);
    const maxX = Math.max(this.prevPosition.x + this.size.width, this.position.x + this.size.width);
    const minY = Math.min(this.prevPosition.y, this.position.y);
    const maxY = Math.max(this.prevPosition.y + this.size.height, this.position.y + this.size.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  ```
- **Geometric Vulnerability Analysis:**
  A projectile traveling from $(x_0, y_0) = (100, 500)$ to $(x_1, y_1) = (300, 300)$ produces a swept bounding box of:
  $$[X_{\min}, X_{\max}] \times [Y_{\min}, Y_{\max}] = [100, 300 + w] \times [300, 500 + h]$$
  This is an area of $(200 + w) \times (200 + h) \approx 40,000 \text{ px}^2$.
  Any stationary entity located at $(120, 320)$ lies within this bounding box.
  However, the projectile's trajectory is the line segment $y - 500 = -(x - 100) \implies x + y = 600$.
  At $x = 120$, the projectile's actual path passes through $y = 480$.
  The entity at $(120, 320)$ is **160 pixels away** from the projectile!
  Because `sweptAABB` checks only box-box overlap:
  $$\text{swept1.x} < \text{swept2.x} + \text{swept2.width} \dots \implies \mathbf{TRUE}$$
  This generates **Phantom Hits**: bullets hitting enemies or barricades that they did not physically come anywhere near.
- **Recommended Remediation:**
  Implement true Swept Circle/Capsule vs. Box or Line Segment vs. Box intersection:
  Only use `getSweptRect()` as a broadphase filter; perform segment-to-box distance check before returning `true`.

---

### 2.2 Cavitation Torpedo Tunneling at 580 px/s
- **File & Lines:** `src/game/flagship/weapons/CavitationTorpedo.ts:151–154` & `184–209`
- **Observed Code:**
  ```typescript
  // Line 152
  this.prevPosition = { x: this.position.x, y: this.position.y };
  this.position.y += this.velocity.y * deltaTime;
  this.position.x += this.velocity.x * deltaTime;
  ...
  // Line 193 (in updateCruise)
  const distSq = (centerX - hx) ** 2 + (centerY - hy) ** 2;
  if (distSq <= combinedRadius * combinedRadius) { ... }
  ```
- **Kinematic Tunneling Analysis:**
  - Torpedo max speed: $v_{\max} = 580\text{ px/s}$.
  - Torpedo hit radius: $r_t \approx 6\text{ px}$.
  - Enemy target size (e.g. Swarm Drone): $w = 20\text{ px}, h = 16\text{ px} \implies r_e \approx 8\text{ px}$.
  - Combined collision radius: $R_c = r_t + r_e \approx 14\text{ px}$.
  - At a moderate framerate dip or lag spike ($\Delta t = 0.05\text{ s}$, 20 FPS):
    $$\Delta y = 580 \cdot 0.05 = 29.0\text{ px}$$
  - Since $29.0\text{ px} > 2 \cdot R_c = 28\text{ px}$, the torpedo can completely jump across the hostile from one frame to the next without the point-distance check ever registering `distSq <= combinedRadius ** 2`!
  - Furthermore: `updateCruise` checks collisions ONLY against `hostiles: Entity[]`. It has **zero collision logic against Barricades**, allowing torpedoes to cruise right through protective barriers without detonating or being blocked.
- **Recommended Remediation:**
  Use segment-to-circle intersection from `prevPosition` to `position`, and check against `context.barricades`.

---

### 2.3 Hydraulic Harpoon Slingshot Projectile Tunneling at 720 px/s
- **File & Lines:** `src/game/flagship/weapons/HydraulicHarpoon.ts:25` & `674–705`
- **Observed Code:**
  ```typescript
  // slingshotBonus = 720 px/s
  proj.entity.position.x += proj.velocity.x * deltaTime;
  proj.entity.position.y += proj.velocity.y * deltaTime;
  ...
  const distSq = (px - ex) ** 2 + (py - ey) ** 2;
  if (distSq <= (pr + er) * (pr + er)) { ... }
  ```
- **Kinematic Tunneling Analysis:**
  At $720\text{ px/s}$, the projectile moves $24\text{ px}$ in a single 30 FPS frame and $36\text{ px}$ in a 20 FPS frame.
  Because collision is evaluated only at the instantaneous discrete end-point, any enemy whose thickness along the projectile vector is less than the displacement step will be skipped without collision.
- **Recommended Remediation:**
  Track `proj.prevPosition` and test line segment $(P_{\text{prev}}, P_{\text{curr}})$ against enemy bounding boxes or circles.

---

### 2.4 Missing `prevPosition` in Enemy, Player, and Hazard Projectiles
- **Files & Lines:** `src/game/Enemy.ts:update()`, `src/game/Player.ts:update()`, `src/game/GameManager.ts:1518–1575`
- **Observed Behavior:**
  A search for `this.prevPosition` across the entire codebase revealed it is assigned ONLY in `Bullet.ts` and `CavitationTorpedo.ts`.
  Neither `Enemy.ts` nor `Player.ts` records `prevPosition`.
- **Tunneling Consequences:**
  When a diving enemy (`EnemyType.DIVER` with dive speed $300 - 450\text{ px/s}$, or in late-wave rush up to $900\text{ px/s}$) approaches a barricade (height $40\text{ px}$):
  In `Entity.ts:checkCollision(other)`:
  - `this.prevPosition` is `undefined`.
  - `other.prevPosition` is `undefined`.
  - Lines 81–112 (CCD checks) are skipped entirely.
  - Only instantaneous AABB (lines 72–77) is checked.
  At $900\text{ px/s}$ and $\Delta t = 0.05\text{ s}$, displacement is $45\text{ px} > 40\text{ px}$ barricade height. The enemy teleports directly through the barricade without dealing or taking collision damage!
- **Recommended Remediation:**
  Add `this.prevPosition = { x: this.position.x, y: this.position.y };` at the beginning of `Enemy.ts:update()` and `Player.ts:update()`.

---

## Pillar 3: Out-of-Bounds Leaks & Array Growth

### 3.1 Subsystem Entities Persisting Across Wave Transitions
- **File & Lines:** `src/game/GameManager.ts:483–495`, `flagship/FlagshipManager.ts:405–425`, `flagship/factions/index.ts:145–150`
- **Observed Code:**
  ```typescript
  // GameManager.ts:483-485
  this.bullets = [];
  this.solarFlares = [];
  this.hazardProjectiles = [];
  ...
  if (this.flagshipManager) {
    this.flagshipManager.onWaveComplete(this.level, this.getFlagshipContext());
  }
  ```
- **Leak Mechanism:**
  When a wave completes:
  1. `this.bullets` is reset to `[]`.
  2. However, `FlagshipManager` delegates `onWaveComplete` only to subsystems that implement it (`CrewOfficerDeck` and `FactionDirector`).
  3. `CavitationTorpedoSystem.torpedoes`, `HydraulicHarpoonSystem.slingshotProjectiles`, `HydraulicHarpoonSystem.activeEmpBursts`, `AutomatonPhalanx.railSlugs`, `AutomatonPhalanx.shockPuddles`, `AutomatonPhalanx.units`, and `KrakenPrimeBoss.toothProjectiles` do NOT implement wave culling.
  4. These projectiles and hostile units persist into `GameState.SHOP` and carry over into subsequent waves.
- **Recommended Remediation:**
  Implement explicit `clearWaveState()` or `onWaveComplete()` cleanup across all weapon and faction subsystems to purge active projectiles and temporary units.

---

### 3.2 Asymmetrical Off-Screen Culling in Hadal Bio-Horrors
- **File & Lines:** `src/game/flagship/factions/HadalBioHorrors.ts:582–586`
- **Observed Code:**
  ```typescript
  // Remove dead or off-screen units
  if (unit.isDead || unit.position.y > 850) {
    this.units.splice(i, 1);
  }
  ```
- **Leak Mechanism:**
  The culling check tests ONLY `unit.position.y > 850`.
  If a Bio-Horror unit is displaced laterally by a torpedo singularity, hydrodynamic vent, or explosion force such that `unit.position.x < -100` or `unit.position.x > 700`, or deflected upward (`unit.position.y < -100`), **it is never culled**!
  The unit remains in `this.units` indefinitely, updating kinematics and collision tests every frame, resulting in permanent CPU bloat and array growth.
- **Recommended Remediation:**
  Cull if:
  `unit.position.y > 850 || unit.position.y < -150 || unit.position.x < -150 || unit.position.x > 750`.

---

### 3.3 Asymmetrical Off-Screen Culling in Automaton Phalanx Rail Slugs
- **File & Lines:** `src/game/flagship/factions/AutomatonPhalanx.ts:272–283`
- **Observed Code:**
  ```typescript
  // Hits bottom of canvas -> creates induction shock puddle
  if (slug.y >= 780 || slug.isDead) {
    this.shockPuddles.push({ ... });
    this.railSlugs.splice(i, 1);
  }
  ```
- **Leak Mechanism:**
  Rail slugs are culled only when `slug.y >= 780` or `slug.isDead`.
  If a slug is deflected laterally or upward by an environmental current or explosion, it leaves the canvas bounds horizontally or vertically without triggering culling, leaking memory and remaining in `this.railSlugs`.
- **Recommended Remediation:**
  Add boundary checks: `slug.y < -100 || slug.x < -100 || slug.x > 700`.

---

### 3.4 Infinite Minion Spawning During GameState.SHOP
- **File & Lines:** `src/game/GameManager.ts:1758` & `flagship/factions/HadalBioHorrors.ts:532–556`
- **Observed Code:**
  ```typescript
  // GameManager.ts:1758
  } else if (this.state === GameState.SHOP) {
    if (this.flagshipManager) {
      ...
      this.flagshipManager.update(deltaTime, shopContext);
    }
  }
  ```
- **Leak Mechanism:**
  In `GameState.SHOP`, `flagshipManager.update(deltaTime, shopContext)` is actively invoked.
  If a `BROODMOTHER` unit survives the wave transition:
  - Every 9.0 seconds (`unit.spawnTimer <= 0`), lines 544–556 execute.
  - The Broodmother spawns two `ParasiteClinger` units and a `SporeSiphoner` unit.
  - While the user is peacefully selecting upgrades in the shop, the `this.units` array grows unbounded, spawning dozens of bio-monsters into the background.
  - When the player exits the shop, they are immediately overwhelmed by a horde of spawned units.
- **Recommended Remediation:**
  In `FlagshipManager.update`, check if `context.state === GameState.SHOP` and freeze faction AI spawning cycles, or despawn boss/minion units upon entering `GameState.SHOP`.

---

## Pillar 4: Input Sanitization & Coordinate Clamping

### 4.1 Unsanitized & Unclamped Canvas Pointer Coordinates
- **File & Lines:** `src/components/game-canvas.tsx:1208–1215` & `1247–1253`
- **Observed Code:**
  ```typescript
  const scaleX = gameManagerRef.current.logicalWidth / (canvas.clientWidth || rect.width);
  const scaleY = gameManagerRef.current.logicalHeight / (canvas.clientHeight || rect.height);
  const logicalX = (e.clientX - rect.left) * scaleX;
  const logicalY = (e.clientY - rect.top) * scaleY;
  gameManagerRef.current.handlePointer(logicalX, logicalY, true, e.button);
  ```
- **Vulnerability Analysis:**
  1. No check for `Number.isFinite(e.clientX)` or `Number.isFinite(e.clientY)`. If synthetic or corrupted pointer events are dispatched, `logicalX` and `logicalY` evaluate to `NaN`.
  2. Pointer events are **not clamped** to `[0, logicalWidth]` and `[0, logicalHeight]`.
     When dragging with pointer capture active, `e.clientX` can be far outside the canvas window:
     - Dragging left of the canvas yields negative coordinates ($\text{logicalX} < 0$, e.g. $-350$).
     - Dragging right yields coordinates exceeding logical bounds ($\text{logicalX} > 600$, e.g. $+1200$).
  3. These unclamped coordinates are passed into `GameManager.handlePointer`, which forwards them to:
     - `TacticalSonarHUD`
     - `CavitationTorpedoSystem` (for targeting crosshairs)
     - `HydraulicHarpoonSystem` (for reticle alignment)
     - `BathymetricDAG` / `BoonDraftDeck`
- **Recommended Remediation:**
  Sanitize and clamp pointer coordinates:
  ```typescript
  if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) return;
  const clampedX = Math.max(0, Math.min(gameManagerRef.current.logicalWidth, logicalX));
  const clampedY = Math.max(0, Math.min(gameManagerRef.current.logicalHeight, logicalY));
  gameManagerRef.current.handlePointer(clampedX, clampedY, true, e.button);
  ```

---

### 4.2 Post-Update Order Boundary Violation in GameManager
- **File & Lines:** `src/game/GameManager.ts:1279`, `1294`, `1724`
- **Observed Sequence:**
  1. Line 1279: `this.player.update(deltaTime)` executes. This is where `Player.ts` clamps `this.position.x` to $[0, \text{logicalWidth} - \text{width}]$ and `this.position.y` to $[\text{baselineY}, \text{logicalHeight} - \text{height}]$.
  2. Line 1294: `this.endGameCrisis.update(deltaTime, this.player, ...)` executes and applies dimensional rift displacement forces.
  3. Line 1724: `this.flagshipManager.update(deltaTime, this.getFlagshipContext())` executes. Inside `HydrothermalVentManager`, upward vertical lift and lateral vent plumes apply velocity and positional offsets directly to `player.position`.
  4. There is **NO subsequent clamping** performed after line 1724.
- **Vulnerability Analysis:**
  Hydrothermal vents and rift forces can displace the player beyond $[0, 600]$ or below $y = 800$, causing the player ship to render partially or completely outside the canvas viewport and bypass edge barricades.
- **Recommended Remediation:**
  Add a post-subsystem boundary enforcement pass in `GameManager.ts` after line 1725:
  ```typescript
  if (this.player) {
    this.player.clampToBounds(this.logicalWidth, this.logicalHeight);
  }
  ```

---

## Synthesis & Implementation Roadmap for Repair Phase

| Vulnerability ID | Category | Severity | Target File(s) | Fix Complexity |
|---|---|---|---|---|
| **SEC-MATH-01** | Math | High | `src/game/Bullet.ts` | Low (Sanitize `targetAngle` and `this.angle` against `NaN`) |
| **SEC-MATH-02** | Math | Medium | `src/game/crisis/CrisisSovereign.ts` | Low (Ensure finite `eyeAngle` in `update` & `draw`) |
| **SEC-MATH-03** | Math | Medium | `src/game/flagship/factions/AutomatonShieldGrid.ts` | Low (Finite speed check in `resolveHit`) |
| **SEC-MATH-04** | Math | Low | `src/game/flagship/weapons/BioluminescentLaser.ts` | Low (Threshold check `lenSq < 0.0001` & `isFinite`) |
| **SEC-CCD-01** | Collision | High | `src/game/Entity.ts` | Medium (Replace axis-aligned swept AABB with segment/capsule check) |
| **SEC-CCD-02** | Collision | High | `src/game/flagship/weapons/CavitationTorpedo.ts` | Medium (Add swept collision segment in `updateCruise` + barricade check) |
| **SEC-CCD-03** | Collision | High | `src/game/flagship/weapons/HydraulicHarpoon.ts` | Medium (Add swept collision check for slingshot projectiles) |
| **SEC-CCD-04** | Collision | Critical | `src/game/Enemy.ts`, `src/game/Player.ts` | Low (Record `prevPosition` in `update()`) |
| **SEC-LEAK-01** | Memory | High | `src/game/flagship/FlagshipManager.ts` | Medium (Purge weapon & faction projectile arrays on wave transition) |
| **SEC-LEAK-02** | Memory | Medium | `src/game/flagship/factions/HadalBioHorrors.ts` | Low (4-sided bounds check `x < -150 || x > 750 || y < -150 || y > 850`) |
| **SEC-LEAK-03** | Memory | Low | `src/game/flagship/factions/AutomatonPhalanx.ts` | Low (4-sided bounds check on `railSlugs`) |
| **SEC-LEAK-04** | Gameplay | High | `src/game/flagship/FlagshipManager.ts` | Low (Pause enemy AI spawning during `GameState.SHOP`) |
| **SEC-INPUT-01** | Input | Medium | `src/components/game-canvas.tsx` | Low (Validate `isFinite` and clamp pointer coords to canvas bounds) |
| **SEC-INPUT-02** | Boundary | Medium | `src/game/GameManager.ts` | Low (Re-clamp player position after environmental/flagship updates) |

---
*Report prepared in accordance with Total Codebase Inspection guidelines.*
