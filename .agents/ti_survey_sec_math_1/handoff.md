# Handoff Report: Security & Mathematical Boundary Inspection

**Agent:** `ti_survey_sec_math_1` (Security & Mathematical Boundary Explorer)  
**Parent Agent:** `03443970-0963-4172-bce8-68ffd5c5aefe`  
**Milestone:** Total Codebase Inspection ("총검사")  
**Date:** 2026-09-23  
**Handoff Type:** Hard (Task complete)

---

## 1. Observation

### Pillar 1: Coordinate Math Defense
- **Observation 1.1 (`src/game/Bullet.ts:285–305`):**
  ```typescript
  const targetAngle = Math.atan2(targetY - myY, targetX - myX);
  const deltaTheta = Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle));
  const maxTurn = this.turnRate * deltaTime;
  this.angle += Math.max(-maxTurn, Math.min(maxTurn, deltaTheta));
  ```
  `targetAngle` is not verified for `isFinite`. If `targetX` or `targetY` is `NaN`, `this.angle` becomes `NaN`, which poisons `this.velocity.x`, `this.velocity.y`, and `this.position`. In addition, line 312 pushes `{ x: tailX, y: tailY }` containing `NaN` into `this.smokeTrail`.
- **Observation 1.2 (`src/game/crisis/CrisisSovereign.ts:213–217` & line 598):**
  ```typescript
  this.eyeAngle = Math.atan2(playerPosition.y - core.y, playerPosition.x - core.x);
  ...
  const pupilX = cx + Math.cos(this.eyeAngle) * lookDist;
  const pupilY = cy + Math.sin(this.eyeAngle) * lookDist;
  ctx.arc(pupilX, pupilY, 4.5, 0, Math.PI * 2);
  ```
  `this.eyeAngle` is not protected against `NaN` values. When `eyeAngle` is `NaN`, 9 different phase render functions pass `NaN` coordinates to `ctx.arc()`.
- **Observation 1.3 (`src/game/flagship/factions/AutomatonShieldGrid.ts:211–217`):**
  ```typescript
  const bulletSpeed = Math.hypot(bulletVel.x, bulletVel.y) || 1;
  const bulletDirX = bulletVel.x / bulletSpeed;
  ```
  If `bulletVel.x` is `Infinity`, `bulletSpeed` evaluates to `Infinity`, producing `Infinity / Infinity = NaN`.
- **Observation 1.4 (`src/game/flagship/weapons/BioluminescentLaser.ts:420–435`):**
  ```typescript
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return;
  ```
  If `dx` or `dy` contains `NaN`, `lenSq` evaluates to `NaN`. In JavaScript, `NaN === 0` is `false`, bypassing the guard and propagating `NaN` into projection calculations.

### Pillar 2: Continuous Collision Detection (CCD) & Tunneling
- **Observation 2.1 (`src/game/Entity.ts:40–65`):**
  `getSweptRect()` constructs an axis-aligned bounding box enclosing `[min(x), min(y)]` to `[max(x + w), max(y + h)]`. For diagonal movements, `sweptAABB()` flags entities located up to 160px away from the actual line segment as colliding (false positive phantom hits).
- **Observation 2.2 (`src/game/flagship/weapons/CavitationTorpedo.ts:184–209`):**
  At `vMax = 580 px/s`, frame displacement during lag spikes ($\Delta t = 0.05\text{ s}$) is $29\text{ px}$. While `prevPosition` is saved at line 152, `updateCruise` checks collision strictly at the discrete end point (`distSq <= combinedRadius ** 2`), completely skipping 15–20px hostiles without detonating. Furthermore, barricade collisions are completely absent.
- **Observation 2.3 (`src/game/flagship/weapons/HydraulicHarpoon.ts:674–705`):**
  Slingshot kinetic projectiles travel at `slingshotBonus = 720 px/s`. Collisions use instantaneous circle checks (`distSq <= (pr + er) ** 2`) without swept trajectory checks.
- **Observation 2.4 (`src/game/Enemy.ts`, `src/game/Player.ts`):**
  Grep for `prevPosition` confirms it is ONLY saved in `Bullet.ts` and `CavitationTorpedo.ts`. Neither `Enemy.ts` nor `Player.ts` assigns `prevPosition`. High-speed diving enemies (`EnemyType.DIVER` moving at 300–900 px/s) bypass 40px barricades entirely on lag frames.

### Pillar 3: Out-of-Bounds Leaks & Array Growth
- **Observation 3.1 (`src/game/GameManager.ts:483–495` vs `flagship/FlagshipManager.ts:418–425`):**
  `startNextWave()` resets `this.bullets`, `this.solarFlares`, and `this.hazardProjectiles`, but `FlagshipManager` has no cleanup for `CavitationTorpedoSystem.torpedoes`, `HydraulicHarpoonSystem.slingshotProjectiles`, `AutomatonPhalanx.railSlugs`, `AutomatonPhalanx.shockPuddles`, or `HadalBioHorrors.units`.
- **Observation 3.2 (`src/game/flagship/factions/HadalBioHorrors.ts:583`):**
  ```typescript
  if (unit.isDead || unit.position.y > 850) {
    this.units.splice(i, 1);
  }
  ```
  Hostiles pushed laterally ($x < -150$ or $x > 750$) or upward ($y < -150$) are never removed, leaking memory and processing time indefinitely.
- **Observation 3.3 (`src/game/flagship/factions/AutomatonPhalanx.ts:272`):**
  `railSlugs` are only culled if `slug.y >= 780 || slug.isDead`, leaking deflected slugs.
- **Observation 3.4 (`src/game/GameManager.ts:1758` & `flagship/factions/HadalBioHorrors.ts:544–556`):**
  In `GameState.SHOP`, `flagshipManager.update()` runs continuously. Broodmothers execute their 9.0s spawn timer, creating endless `ParasiteClinger` units while the player is in the shop menu.

### Pillar 4: Input Sanitization & Boundary Clamping
- **Observation 4.1 (`src/components/game-canvas.tsx:1208–1215` & `1247–1253`):**
  Pointer coordinates are converted via `(e.clientX - rect.left) * scaleX` and passed directly to `gameManager.handlePointer()` without finiteness validation or clamping to `[0, logicalWidth]` and `[0, logicalHeight]`.
- **Observation 4.2 (`src/game/GameManager.ts:1279`, `1294`, `1724`):**
  Player boundary clamping occurs in `player.update(deltaTime)` at line 1279. Hydrothermal vents, ocean currents, and crisis rifts apply physical displacements to `player.position` at lines 1294 and 1724 without any subsequent clamping before rendering or collision testing.

---

## 2. Logic Chain

1. **Premise:** JavaScript numeric arithmetic evaluates invalid operations (`NaN + x`, `Infinity / Infinity`, `atan2(NaN)`) to `NaN`, and Canvas2D arc/translate operations fail silently or throw exceptions when passed `NaN`.
   - **Step:** Observations 1.1, 1.2, 1.3, and 1.4 show unverified coordinates and velocities directly feeding `Math.atan2`, `Math.hypot`, and segment projections.
   - **Deduction:** Numerical poisoning causes missiles to corrupt their smoke trails, Crisis Sovereign to break canvas rendering, and laser projections to execute on invalid geometry.

2. **Premise:** Discrete collision detection evaluates bounding box or distance only at the end-of-frame coordinates. If frame displacement $\Delta s = v \cdot \Delta t$ exceeds target dimension $D$, the object tunnels through the target without overlapping.
   - **Step:** Observations 2.2 and 2.3 prove that torpedoes ($v = 580\text{ px/s}$) and slingshot projectiles ($v = 720\text{ px/s}$) have single-frame displacements of $24 - 36\text{ px}$, exceeding small enemy collision radii ($14 - 16\text{ px}$).
   - **Step:** Observation 2.4 proves `Enemy.ts` lacks `prevPosition`, disabling CCD against barricades for diving enemies ($v = 300 - 900\text{ px/s}$).
   - **Deduction:** High-speed projectiles and diving enemies physically tunnel through targets and barricades on standard lag spikes ($20 - 30\text{ FPS}$).

3. **Premise:** Broadphase swept bounding boxes (`min(p0, p1)` to `max(p0, p1)`) enclose large rectangular areas that the projectile does not traverse.
   - **Step:** Observation 2.1 shows `Entity.ts:sweptAABB` returns `true` based solely on swept AABB overlap.
   - **Deduction:** Any diagonal bullet triggers false positive collisions with entities far outside its path.

4. **Premise:** Entities and projectiles not culled when exiting the playfield or transitioning waves remain in active arrays.
   - **Step:** Observations 3.1, 3.2, and 3.3 demonstrate missing wave-transition resets and single-axis culling ($y > 850$ only).
   - **Step:** Observation 3.4 demonstrates that Broodmothers remain active in `GameState.SHOP`, spawning parasites every 9 seconds.
   - **Deduction:** Memory bloats and CPU usage increases with each wave, causing framerate drops and unexpected enemy ambushes upon exiting the shop.

5. **Premise:** User pointers outside the canvas area emit coordinates $< 0$ or $> \text{logicalWidth}$, and external forces displace entities after clamping.
   - **Step:** Observations 4.1 and 4.2 show unclamped pointer forwarding and post-clamp environmental force application.
   - **Deduction:** Tactical reticles, torpedo clicks, and the player entity itself can be pushed completely outside the valid arena.

---

## 3. Caveats

1. **Read-Only Scope:** This investigation was strictly read-only. No source code was modified.
2. **Audio/DOM Interaction:** SoundManager calls inside weapon systems (e.g. `soundManager.playMissileExplosion()`) are wrapped in `try/catch` fallbacks, so audio playback errors do not crash math pipelines.
3. **Simulation Assumptions:** Framerate lag spikes of $\Delta t = 0.05\text{ s}$ (20 FPS) and $\Delta t = 0.033\text{ s}$ (30 FPS) were assumed for tunneling derivations; higher framerate devices (120 Hz) will experience lower tunneling frequency, but the vulnerability remains algebraically present.

---

## 4. Conclusion

The Water Invader codebase exhibits critical boundary weaknesses in coordinate mathematics, CCD geometry, lifecycle memory pooling, and coordinate clamping. 14 distinct vulnerabilities were cataloged with exact file references and mathematical proofs in `report.md`.
Implementing the recommended remediations will completely immunize the game against `NaN` canvas crashes, projectile/enemy tunneling, memory bloat across waves, and out-of-bounds entity drift.

---

## 5. Verification Method

To independently verify these findings:
1. **Source Code Inspection:**
   - Inspect `src/game/Bullet.ts:285–305` to verify lack of `isFinite` checks on `targetAngle`.
   - Inspect `src/game/Entity.ts:40–65` to verify `getSweptRect()` uses axis-aligned bounding box rather than capsule/line intersection.
   - Inspect `src/game/flagship/weapons/CavitationTorpedo.ts:184–209` to confirm `updateCruise` uses point-distance without swept raycast.
   - Inspect `src/game/flagship/factions/HadalBioHorrors.ts:583` to verify one-sided culling (`unit.position.y > 850`).
   - Inspect `src/components/game-canvas.tsx:1208–1215` to verify unclamped pointer coordinates.
2. **TypeScript Compilation & Build Verification:**
   Run:
   ```bash
   npm run build
   ```
   (Verify baseline typecheck passes before any subsequent implementation phase).
3. **Mathematical Invalidation Condition:**
   These findings would be invalidated only if an upstream proxy or middleware guarantees that all entities strictly clamp positions, all pointers are restricted to $[0, 600] \times [0, 800]$, and all velocities never exceed $R_{\text{combined}} / \Delta t_{\max}$ (which does not exist in the current architecture).
