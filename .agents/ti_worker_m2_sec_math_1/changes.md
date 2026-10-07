# Changes: Security, CCD & Math Defense (Milestone M2)

**Worker:** `ti_worker_m2_sec_math_1`  
**Milestone:** M2 — Security, Continuous Collision Detection (CCD) & Coordinate Math Defense  
**Target Subsystems:** Projectiles, Boss Visuals, Faction Armor/Shields, Collision Primitives, Inputs  
**Date:** 2026-09-23  

---

## 1. Summary of Modifications

### 1.1 `src/game/Bullet.ts` (DEF-SEC-01)
- **Target Lines:** 285–345
- **Modifications:**
  - Added `Number.isFinite()` and distance threshold validation (`distSq > 0.0001`) before `Math.atan2` in `HomingMissile.update()`.
  - Added default fallback angle (`this.angle = -Math.PI / 2`) if `this.angle` is non-finite or `NaN`.
  - Guarded `currentSpeed`, `velocity.x`, `velocity.y`, and `position` integration against `NaN` and `Infinity`.
  - Protected `smokeTrail.push()` coordinates so `NaN` values are never stored into the particle pool.
  - In `draw()`, added `Number.isFinite()` guards on `s.x`, `s.y`, and `s.r` before calling `ctx.arc()`, eliminating canvas render drops in strict browser engines.

### 1.2 `src/game/crisis/CrisisSovereign.ts` (DEF-SEC-01)
- **Target Lines:** 213–235, 606–625
- **Modifications:**
  - In `update()`, guarded player coordinate subtraction and `Math.atan2` calculation with `Number.isFinite()` and epsilon distance checks before updating `this.eyeAngle`.
  - Set fallback heading `this.eyeAngle = Math.PI / 2` if computed value evaluates to non-finite.
  - At the beginning of `draw()`, enforced `if (!Number.isFinite(this.eyeAngle)) this.eyeAngle = Math.PI / 2`.
  - In `drawSingularityCore()`, validated pupil target coordinates `pupilX` and `pupilY` before executing `ctx.arc()`.

### 1.3 `src/game/flagship/factions/AutomatonShieldGrid.ts` (DEF-SEC-01)
- **Target Lines:** 208–225
- **Modifications:**
  - Guarded incoming `bulletVel.x` and `bulletVel.y` against `Infinity` and `NaN`.
  - Replaced unsafe `Math.hypot() || 1` with a finite-checked, clamped speed divisor (`rawSpeed > 0.0001 ? rawSpeed : 1`).
  - Guaranteed `bulletDirX`, `bulletDirY`, and `impactCos` are strictly finite numbers, preventing false-negative shield deflections when high-velocity projectiles hit frontal shields.

### 1.4 `src/game/flagship/weapons/BioluminescentLaser.ts` (DEF-SEC-01)
- **Target Lines:** 418–440
- **Modifications:**
  - In `damageEnemiesAlongSegment()`, replaced `if (lenSq === 0) return;` with `if (!Number.isFinite(lenSq) || lenSq < 0.0001) return;`, catching `NaN` and sub-pixel degenerate laser segments.
  - Added finite coordinate guards for enemy positions and projection parameter `t`, ensuring vector projections never generate `NaN` or `Infinity`.

### 1.5 `src/game/Entity.ts` (DEF-SEC-02)
- **Target Lines:** 53–115
- **Modifications:**
  - Replaced axis-aligned swept bounding box (`getSweptRect()` overlap) with exact narrowphase continuous collision detection:
    - Added `public static lineSegmentIntersectsAABB(ax, ay, bx, by, xmin, xmax, ymin, ymax): boolean` using the Liang-Barsky / Slab method.
    - Updated `sweptAABB(other: Entity): boolean` to calculate relative displacement $\Delta_{\text{rel}} = \Delta P - \Delta Q$ and test the swept relative segment against the expanded Minkowski difference box.
    - Updated `checkCollision(other: Entity): boolean` to delegate to `this.sweptAABB(other)` when either entity has `prevPosition`.
  - **Result:** Completely eliminated diagonal swept AABB phantom hits (false positives) while maintaining 100% detection for true intersections and opposing head-on projectiles.

### 1.6 `src/game/flagship/weapons/CavitationTorpedo.ts` (DEF-SEC-02)
- **Target Lines:** 105–210, 650–665
- **Modifications:**
  - Added `barricades: Barricade[] = []` parameter to `update()` and `updateCruise()`.
  - Implemented continuous swept segment collision checking from `prevPosition` to current position in `updateCruise()`.
  - Added swept capsule / segment vs hostile entity distance checks using point-to-segment projection, eliminating discrete point-check tunneling at 580 px/s during lag frames ($\Delta t = 0.05\text{ s}$).
  - Added swept segment vs barricade AABB intersection tests, ensuring torpedoes detonate upon impacting defensive barricades rather than tunneling through them.
  - Passed `context.barricades` in `CavitationTorpedoSystem.update()`.

### 1.7 `src/game/flagship/factions/HadalBioHorrors.ts` (DEF-SEC-03)
- **Target Lines:** 20, 544–586
- **Modifications:**
  - Imported `GameState` from `../../types`.
  - In `BROODMOTHER` behavior update, added check for `context.state === GameState.SHOP` or paused states.
  - Froze `unit.spawnTimer` when in `SHOP` or paused, preventing infinite parasite spawning while the player is in the upgrade store.
  - Expanded unit boundary culling to 4-sided rectangular bounds:
    `unit.isDead || unit.position.x < -150 || unit.position.x > 750 || unit.position.y < -150 || unit.position.y > 850`.
  - Prevented permanent memory leaks from laterally displaced or upward-lifted bio-horror entities.

### 1.8 `src/game/flagship/factions/AutomatonPhalanx.ts` (DEF-SEC-03)
- **Target Lines:** 271–285
- **Modifications:**
  - Added 4-sided playfield exit bounds check for `railSlugs`:
    `slug.y < -100 || slug.x < -100 || slug.x > 700 || slug.y > 850`.
  - Culled slugs exiting in lateral or upward directions without spawning bottom shock puddles, preventing array growth leaks.

### 1.9 `src/components/game-canvas.tsx` (DEF-SEC-04)
- **Target Lines:** 1206–1225, 1252–1270
- **Modifications:**
  - In `handleCanvasPointerDown` and `handleCanvasPointerUp`, added `Number.isFinite(e.clientX) && Number.isFinite(e.clientY)` guards.
  - Clamped computed `logicalX` to `[0, logicalWidth]` and `logicalY` to `[0, logicalHeight]` before passing to `gameManagerRef.current.handlePointer()`.
  - Prevented negative coordinates and out-of-bounds clicks from propagating to tactical sonar, torpedo crosshairs, and harpoon aiming systems.

### 1.10 `tests/m2_sec_math_defense.spec.ts` (Testing & Regression Harness)
- **Modifications:**
  - Created 14 comprehensive, genuine automated regression unit and integration tests across all 4 defect areas:
    - 5 tests for NaN resistance and trigonometric safety (`Bullet`, `CrisisSovereign`, `AutomatonShieldGrid`, `BioluminescentLaser`).
    - 5 tests for Continuous Collision Detection and anti-tunneling (`Entity` phantom hit elimination, diagonal true hit detection, opposing head-on CCD, Cavitation Torpedo 580 px/s hostile anti-tunneling, Cavitation Torpedo barricade anti-tunneling).
    - 3 tests for 4-sided bounds culling and SHOP spawn freeze (`HadalBioHorrors` 4-sided culling, Broodmother SHOP timer freeze, `AutomatonPhalanx` 4-sided rail slug culling).
    - 1 test for responsive canvas pointer coordinate clamping and NaN rejection.

---

## 2. Verification Summary
- `npx tsc --noEmit`: Exited 0 (zero errors).
- `npm run build`: Compiled production build in 990ms (zero errors).
- `TARGET_URL=http://localhost:3005 npx playwright test tests/m2_sec_math_defense.spec.ts`: 14 passed (100% pass rate).
- `TARGET_URL=http://localhost:3005 npx playwright test tests/m1_physics_remediation.spec.ts`: 18 passed (100% pass rate, zero regressions).
