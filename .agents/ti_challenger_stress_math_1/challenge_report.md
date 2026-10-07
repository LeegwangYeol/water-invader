# Challenge Report: Mathematical & Collision Stress Audit (Milestone M5)

**Agent**: Adversarial Challenger 1 (`ti_challenger_stress_math_1`)  
**Target Milestone**: M5 (Total Codebase Inspection — "총검사")  
**Verdict**: `REQUEST_CHANGES` (Vulnerabilities confirmed in 4-sided boundary culling under non-finite coordinates and stun states)  
**Overall Risk Assessment**: MEDIUM

---

## 1. Executive Summary

As part of Milestone M5 of the Total Codebase Inspection ("총검사"), Adversarial Challenger 1 developed and executed a 22-test automated stress harness (`tests/adversarial_challenger_stress_math.spec.ts`) subjecting the collision detection, homing missile vector kinematics, and boundary culling subsystems to extreme adversarial conditions:
- **Homing Missile Math (`Bullet.ts`)**: Coincident coordinates ($dist = 0$), sub-pixel epsilons, extreme negative coordinates ($-10^4$), NaN coordinates, and a 1,000-frame Monte Carlo chaotic stress test.
- **Swept CCD & Anti-Tunneling (`CavitationTorpedo.ts`)**: High simulated frame lag ($\Delta t = 0.1\text{s}$, $0.2\text{s}$, $0.5\text{s}$ causing $58\text{px}$ to $290\text{px}$ single-frame leaps) against small targets ($15\text{px}$ radius) and thin barricades ($10\text{px}$ thickness).
- **Narrowphase Swept AABB (`Entity.ts`)**: Diagonal trajectories across all 4 quadrants testing corner broadphase false positives vs. true Minkowski intersections.
- **4-Sided Boundary Culling (`HadalBioHorrors.ts`, `AutomatonPhalanx.ts`)**: Extreme negative and positive coordinates, boundary threshold exactness, and non-finite coordinate injections.

### Summary Scorecard
| Defense Domain | Test Coverage | Stress Conditions | Empirical Result | Status |
|----------------|---------------|-------------------|------------------|--------|
| **Bullet.ts Homing Missile Math** | CHAL-MATH-01 ~ 06 | $dist = 0$, $distSq < 10^{-4}$, $x = -10^4$, $x = \text{NaN}$, 1000 frames | Zero NaN angles, zero NaN velocities, zero division-by-zero, canvas draw guarded | **DEFENSE HOLDS** |
| **CavitationTorpedo CCD Tunneling** | CHAL-CCD-01 ~ 05 | $\Delta t \in [0.1, 0.5]\text{s}$ ($58\text{px}-290\text{px}$ jump), $15\text{px}$ target, $10\text{px}$ barricade, near-miss | 100% catch rate on small targets & barricades; zero false-positive near-misses | **DEFENSE HOLDS** |
| **Entity.sweptAABB False Positives** | CHAL-AABB-01 ~ 05 | Diagonal trajectories (4 quadrants), corner grazing, opposing high-speed crossing | Zero phantom false-positive hits; true temporal crossings cleanly detected | **DEFENSE HOLDS** |
| **4-Sided Boundary Culling** | CHAL-CULL-01 ~ 05 | $x, y \in [-10^4, 10^5]$, threshold boundaries, $\text{NaN}$, stun state | Real coordinates culled; **NaN coordinates and stun state bypass culling** | **VULNERABILITY FOUND** |

---

## 2. Identified Challenges & Vulnerabilities

### [MEDIUM] Challenge 1: Non-Finite (`NaN`) Coordinate Bypass in 4-Sided Boundary Culling (`HadalBioHorrors.ts:595` & `AutomatonPhalanx.ts:283`)
- **Assumption Challenged**: The boundary culling check assumes that all off-screen entities can be detected by inequalities `position.x < -150 || position.x > 750 || position.y < -150 || position.y > 850`.
- **Attack Scenario**: If an entity or projectile ever receives `NaN` coordinates (e.g. from numerical instability, uninitialized vectors, or corrupt external inputs), IEEE 754 floating-point comparison semantics dictate that:
  - `NaN < -150 === false`
  - `NaN > 750 === false`
  - `NaN < -150 === false`
  - `NaN > 850 === false`
  Because this is an exclusion check (culling only when an inequality is `true`), the condition evaluates to `false`. The `NaN` entity completely bypasses boundary culling and remains indefinitely in memory (`this.units` or `this.railSlugs`).
- **Blast Radius**:
  1. **Memory Leak**: Corrupted entities accumulate in internal arrays across waves.
  2. **Canvas 2D Poisoning**: When `HadalBioHorrors.drawWorld()` calls `ctx.translate(unit.position.x, unit.position.y)` with `NaN`, the 2D transformation matrix becomes non-invertible / NaN, corrupting all rendering operations until `ctx.restore()`.
- **Mitigation**:
  Upgrade the boundary culling check in `HadalBioHorrors.ts` and `AutomatonPhalanx.ts` to include explicit `!Number.isFinite(...)` checks, mirroring the robust positive-interval pattern in `GameManager.ts:1871`:
  ```ts
  const isOutOfBounds =
    !Number.isFinite(unit.position.x) ||
    !Number.isFinite(unit.position.y) ||
    unit.position.x < -150 ||
    unit.position.x > 750 ||
    unit.position.y < -150 ||
    unit.position.y > 850;

  if (unit.isDead || isOutOfBounds) {
    this.units.splice(i, 1);
  }
  ```

---

### [LOW-MEDIUM] Challenge 2: `unit.stunTimer > 0` Premature `continue;` Bypasses Boundary Culling (`HadalBioHorrors.ts:414-417`)
- **Assumption Challenged**: Boundary culling and dead entity pruning are assumed to execute unconditionally for all units every frame.
- **Attack Scenario**: In `HadalBioHorrors.ts`:
  ```ts
  // Lines 414-417:
  if (unit.stunTimer && unit.stunTimer > 0) {
    unit.stunTimer -= deltaTime;
    continue; // Stunned, cannot move or act
  }
  ```
  The 4-sided boundary culling check is placed at lines 595-603 at the bottom of the unit update loop.
  When an entity has `stunTimer > 0` (e.g. after an Angler lure counter-snipe which inflicts a 2.0s stun, or external stun effects):
  The `continue;` jumps directly to the next loop iteration, completely bypassing:
  - Bullet collision checks (lines 591-592)
  - 4-sided boundary culling (lines 595-601)
  - Death removal `if (unit.isDead) this.units.splice(i, 1)`
  If a unit is knocked out-of-bounds while stunned, or if it dies while stunned, it is immune to culling until its `stunTimer` fully elapses.
- **Blast Radius**: Stunned entities that are dead or far out of bounds linger in memory for up to several seconds after exit.
- **Mitigation**: Move the boundary culling and `isDead` pruning block to execute *before* or *independent of* the `stunTimer` movement bypass, or wrap the movement switch in `if (!unit.stunTimer || unit.stunTimer <= 0)` without using an early loop `continue`.

---

## 3. Empirical Stress Test Results

Executed via: `SKIP_WEBSERVER=1 npx playwright test tests/adversarial_challenger_stress_math.spec.ts`

| Test ID | Scenario | Expected Behavior | Actual Behavior | Result |
|---------|----------|-------------------|-----------------|--------|
| **CHAL-MATH-01** | Missile vs Coincident Target ($dist = 0$, $dx = 0, dy = 0$) | Finite angle and velocity vectors; no NaN | Missile angle remains $-1.5707$ rad, velocity $(0, -280)$, zero NaN | **PASS** |
| **CHAL-MATH-02** | Missile vs Sub-pixel Target ($0 < distSq \le 10^{-4}$) | Epsilon guard skips degenerate steering | Finite angle and velocity maintained | **PASS** |
| **CHAL-MATH-03** | Missile & Target at Extreme Negatives ($(-10^4, -10^4)$) | atan2 evaluates valid quadrant; vectors finite | Finite heading, zero coordinate corruption | **PASS** |
| **CHAL-MATH-04** | Target with NaN coordinates ($x = \text{NaN}$) | Steering bypassed; draw() passes zero NaN to Canvas | All vectors finite; `ctx.translate` and `ctx.arc` receive 0 NaN | **PASS** |
| **CHAL-MATH-05** | Pre-poisoned Missile State ($\text{angle}=\text{NaN}, p_x=\text{NaN}, v_x=\text{NaN}$) | Self-healing fallback restores valid state | Restores angle to $-\pi/2$, position to $(300, 400)$ | **PASS** |
| **CHAL-MATH-06** | 1,000-Frame Chaotic Monte Carlo Stress Harness | Complete numerical stability across variable $\Delta t \in [0.001, 0.2]\text{s}$ | 100% of 1,000 frames maintain finite position, velocity, and speed | **PASS** |
| **CHAL-CCD-01** | Cavitation Torpedo at $\Delta t = 0.1\text{s}$ ($58\text{px}$ leap) over $15\text{px}$ radius target | Swept segment CCD intercepts target | Torpedo detonates into `SINGULARITY` stage | **PASS** |
| **CHAL-CCD-02** | Cavitation Torpedo at $\Delta t = 0.1\text{s}$ over $10\text{px}$ thin barricade | Swept AABB raycast intercepts barricade | Torpedo detonates into `SINGULARITY` stage | **PASS** |
| **CHAL-CCD-03** | Cavitation Torpedo at $\Delta t = 0.2\text{s}$ ($116\text{px}$) & $\Delta t = 0.5\text{s}$ ($290\text{px}$) leaps | Extreme displacement catches targets | Both $116\text{px}$ and $290\text{px}$ leaps catch target and detonate | **PASS** |
| **CHAL-CCD-04** | Cavitation Torpedo Precision Near-Miss ($4\text{px}$ outside flight corridor) | Zero false-positive detonation | Torpedo remains `ARMED`; zero phantom hit | **PASS** |
| **CHAL-CCD-05** | INERT Torpedo Impact at $\Delta t = 0.1\text{s}$ | Blunt impact deals 15 damage without detonating | Target HP reduced $100 \to 85$; torpedo remains `INERT` | **PASS** |
| **CHAL-AABB-01** | Up-Right Diagonal Trajectory $(100, 500) \to (300, 300)$ vs $(120, 320)$ & $(280, 480)$ | Off-path broadphase corners return `false` | Both return `false` for `checkCollision` and `sweptAABB` | **PASS** |
| **CHAL-AABB-02** | Down-Right Diagonal Trajectory $(100, 100) \to (400, 400)$ vs $(110, 380)$ & $(380, 110)$ | Broadphase corner phantom hits rejected | Both return `false` | **PASS** |
| **CHAL-AABB-03** | Up-Left & Down-Left Diagonal Trajectories (All 4 quadrants) | Quadrant symmetry rejects corner phantoms | All 4 quadrants return `false` | **PASS** |
| **CHAL-AABB-04** | Corner Grazing: $1\text{px}$ outside vs $1\text{px}$ inside Minkowski boundary | Outside returns `false`, inside returns `true` | $x=188$ returns `false`, $x=191$ returns `true` | **PASS** |
| **CHAL-AABB-05** | Opposing High-Speed Crossing vs Parallel Offset ($80\text{px}$ delta X) | True collision detected, parallel offset rejected | Crossing returns `true`, parallel offset returns `false` | **PASS** |
| **CHAL-CULL-01** | HadalBioHorrors Extreme Negative Coordinates ($x < -150, y < -150$) | Real coordinates culled from array | 4 of 4 units culled; array length $= 0$ | **PASS** |
| **CHAL-CULL-02** | HadalBioHorrors Extreme Positive Coordinates ($x > 750, y > 850$) | Real coordinates culled from array | 4 of 4 units culled; array length $= 0$ | **PASS** |
| **CHAL-CULL-03** | Boundary Threshold Exactness (Borderline inside vs outside) | Outside culled ($x = -151, 751$), inside kept | Outside culled, inside kept; exactly 4 remain | **PASS** |
| **CHAL-CULL-03b** | Stunned Unit ($stunTimer = 2.0$) Outside Bounds | Stun loop `continue` skips culling check | **Unit survives culling while stunned (Vulnerability)** | **CONFIRMED** |
| **CHAL-CULL-04** | AutomatonPhalanx railSlugs 4-Sided Culling | Slugs exiting top, bottom, left, right culled | 4 of 5 culled; only the 1 valid slug remains | **PASS** |
| **CHAL-CULL-05** | Unit with Non-Finite Coordinates ($x=\text{NaN}, y=\text{NaN}$) | IEEE 754 NaN comparison bypasses culling | **NaN unit survives culling and poisons canvas (Vulnerability)** | **CONFIRMED** |

---

## 4. Unchallenged Areas
- **Spatial Hash Partitioning**: The current codebase relies on $O(N)$ and two-pointer compaction sweeps rather than an explicit broadphase quadtree or spatial hash. While acceptable for the current entity count ($N < 100$), performance under $N > 1,000$ was out of scope.
- **AudioContext Visibility Lifecycle**: Master GainNode audio suspension was assigned to Milestone M3 architecture review and was not challenged here.

---

## 5. Verdict & Recommended Remediation

**Verdict**: `REQUEST_CHANGES`

### Required Actions for Worker Agent:
1. In `src/game/flagship/factions/HadalBioHorrors.ts` (line 595) and `src/game/flagship/factions/AutomatonPhalanx.ts` (line 283):
   Add explicit `!Number.isFinite(...)` checks to the boundary culling condition to guarantee non-finite entities cannot survive in memory or poison `ctx.translate`.
2. In `src/game/flagship/factions/HadalBioHorrors.ts` (line 414-417):
   Restructure the `unit.stunTimer` check so that stunned units skip only their steering/movement AI, while still allowing the terminal boundary culling and death pruning logic to execute.
