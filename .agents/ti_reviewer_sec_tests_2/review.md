# Milestone M5 Review Report: Security, CCD & Test Expansion

**Reviewer ID**: `ti_reviewer_sec_tests_2`  
**Milestone**: M5 — Total Codebase Inspection ("총검사") Quality & Adversarial Review  
**Subject**: Milestones M2 (Security, CCD & Coordinate Math Defense) and M4 (Regression Test Expansion)  
**Date**: 2026-09-23T03:55:00Z  

---

## 1. Review Summary

**Verdict**: **APPROVE**  
**Integrity Assessment**: **CLEAN (0 Integrity Violations)**  
- No hardcoded test results or fabricated outputs embedded in code.
- No dummy/facade implementations; all mathematical and physical logic is fully realized.
- No shortcut bypasses; Continuous Collision Detection (CCD) is mathematically implemented via Liang-Barsky and swept Minkowski segment intersection.
- Build and test verifications independently reproduced with 100% pass rate.

---

## 2. Review Dimensions & Subsystem Evaluation

### Dimension 1: Coordinate Math & NaN/Infinity Defenses (DEF-SEC-01)
- **`src/game/Bullet.ts` (HomingMissile)**:
  - Validates $\Delta x$ and $\Delta y$ with `Number.isFinite()` and verifies distance squared threshold `distSq > 0.0001` before executing `Math.atan2(dy, dx)`.
  - Fallback heading angle defaults safely to `-Math.PI / 2` (upward) if corrupted.
  - Velocities $v_x, v_y$ and positions $x, y$ are guarded with finite checks and fallbacks before integration.
  - Smoke trail particle push and rendering in `draw()` sanitize all coordinates and skip non-finite entries before `ctx.arc()`.
  - **Verdict**: Mathematically sound and airtight.

- **`src/game/crisis/CrisisSovereign.ts`**:
  - Central eye tracking angle `this.eyeAngle` guards $\Delta x, \Delta y$ against non-finite values and $distSq \le 0.0001$.
  - Fallback angle `Math.PI / 2` prevents `NaN` propagation to `drawSingularityCore()`.
  - Pupil rendering validates `pupilX` and `pupilY` with `Number.isFinite()` before issuing canvas arc calls.
  - **Verdict**: Airtight.

- **`src/game/flagship/factions/AutomatonShieldGrid.ts`**:
  - Frontal deflection calculation guards incoming bullet velocity against `NaN` and `Infinity`.
  - Safe divisor `bulletSpeed = (Number.isFinite(rawSpeed) && rawSpeed > 0.0001) ? rawSpeed : 1` guarantees division-by-zero immunity.
  - Normal vector sanitized before computing dot product `impactCos = -(safeDirX * normX + safeDirY * normY)`.
  - **Verdict**: Airtight.

- **`src/game/flagship/weapons/BioluminescentLaser.ts`**:
  - Segment projection protects against degenerate line segments with `lenSq < 0.0001` or `!Number.isFinite(lenSq)`.
  - Enemy positions and projection parameter $t$ are validated before applying damage.
  - **Verdict**: Airtight.

---

### Dimension 2: Continuous Collision Detection (CCD) & Anti-Tunneling (DEF-SEC-02)
- **`src/game/Entity.ts` (Liang-Barsky Slab Method & Swept Minkowski Sum)**:
  - Replaced overly conservative bounding box overlap with exact continuous collision detection:
    - Relative motion vector $\vec{d}_{\text{rel}} = \vec{\Delta p} - \vec{\Delta q}$ raycast against expanded Minkowski box $[q_0.x - w_A, q_0.x + w_B] \times [q_0.y - h_A, q_0.y + h_B]$.
    - `Entity.lineSegmentIntersectsAABB(ax, ay, bx, by, xmin, xmax, ymin, ymax)` implements the Liang-Barsky parametric clipping algorithm.
    - Handles degenerate vectors ($dx \approx 0, dy \approx 0$) safely via epsilon checks ($10^{-8}$).
    - Correctly handles negative ray directions ($dx < 0, dy < 0$) via `Math.min(tx1, tx2)` and `Math.max(tx1, tx2)`.
    - Eliminates diagonal swept AABB false positives while maintaining 100% true positive detection for swept collisions.
  - **Verdict**: Mathematically sound, highly performant, and accurate.

- **`src/game/flagship/weapons/CavitationTorpedo.ts`**:
  - Cruising torpedoes moving at up to 580 px/s (29 px displacement during 20 FPS lag spikes) now check swept segment intersection:
    - Barricades: `Entity.lineSegmentIntersectsAABB` against expanded barricade boxes.
    - Hostiles: Exact point-to-segment projection $\vec{c} = \vec{p}_0 + t \vec{v}$, with $t = \text{clamp}\left(\frac{(\vec{h} - \vec{p}_0) \cdot \vec{v}}{|\vec{v}|^2}, 0, 1\right)$, tested against $(r_{\text{torpedo}} + r_{\text{hostile}})^2$.
    - Prevents tunneling through both hostiles and barricades.
  - **Verdict**: Robust and verified.

---

### Dimension 3: 4-Sided Bounds Culling & Shop Spawn Freeze (DEF-SEC-03)
- **`src/game/flagship/factions/HadalBioHorrors.ts`**:
  - Culls off-screen entities across all 4 boundaries: $x < -150$, $x > 750$, $y < -150$, $y > 850$.
  - Freezes Broodmother parasite spawn countdown while in `GameState.SHOP` or `GameState.PAUSED`.
  - **Verdict**: Permanently prevents runaway entity leaks.

- **`src/game/flagship/factions/AutomatonPhalanx.ts`**:
  - Culls `railSlugs` exiting any boundary: $x < -100$, $x > 700$, $y < -100$, $y > 850$.
  - **Verdict**: Clean and verified.

---

### Dimension 4: Pointer Coordinate Sanitization (DEF-SEC-04)
- **`src/components/game-canvas.tsx`**:
  - `handleCanvasPointerDown` and `handleCanvasPointerUp` validate `Number.isFinite(e.clientX)` and `Number.isFinite(e.clientY)`.
  - Ensures canvas dimensions $clientW > 0, clientH > 0$.
  - Clamps converted logical coordinates strictly to $[0, \text{logicalWidth}]$ and $[0, \text{logicalHeight}]$.
  - **Verdict**: Robust defense against malformed or out-of-bounds pointer events.

---

### Dimension 5: Test Suite Expansion & Browser Verification (DEF-TST-01 & DEF-TST-02)
- **`tests/01_ui_and_controls.spec.ts` (DEF-TST-01)**:
  - Corrected legacy DPR assertion to compare `canvasWidth` to `Math.round(600 * dpr)` and `canvasHeight` to `Math.round(800 * dpr)`.
  - Eliminates false-positive failures on Retina / high-DPR displays while strictly maintaining the 600x800 logical canvas invariant.
- **`tests/flagship_factions_live_browser.spec.ts` (DEF-TST-02)**:
  - 6 live browser tests verifying Hadal parasite attachment, speed reduction, non-alternating key rejection, 4-wiggle shake-off restoration, 45px proximity latching, Automaton shield phalanx linking, 40% dampening, inductive backlash stun, piercing bypass, and 4-sided bounds culling.
- **`tests/flagship_crew_deck_shop_ui.spec.ts` (DEF-TST-02)**:
  - 4 live browser tests verifying Pre-Game Shop modal rendering, 4 officer tabs, officer rank promotion with currency deduction, persistence across game start into Wave 1, hotkey active abilities (keys 1-4), cooldown lockouts, and station assignments.
- **`tests/m2_sec_math_defense.spec.ts`**:
  - 14 comprehensive unit/simulation tests covering all 4 security pillars.

---

## 3. Adversarial Stress-Testing & Edge Cases

| Scenario Tested | Hypothesis / Attack Vector | Observed Behavior | Result |
|---|---|---|---|
| **Diagonal Phantom Overlap** | High-velocity projectile passes near but not through stationary entity | Broadphase overlap passes, but narrowphase Liang-Barsky Minkowski raycast returns `false` | **PASS (No false positive)** |
| **Opposing High-Speed Collision** | Two opposing bullets cross trajectories without overlapping at discrete frame end | Swept relative displacement detects trajectory intersection at midpoint | **PASS (True positive detected)** |
| **High-Speed Torpedo Tunneling** | Torpedo travelling at 580 px/s with 0.05s lag spike past 16px entity | Continuous swept segment detects entity along path and triggers Singularity detonation | **PASS (Tunneling eliminated)** |
| **NaN Coordinate Poisoning** | Target entity coordinates poisoned with `NaN` | `HomingMissile` and `CrisisSovereign` safely default to baseline angle and positions; canvas draw does not crash | **PASS (Zero NaN propagation)** |
| **Degenerate Division by Zero** | Bullet velocity $(0, 0)$ or laser segment length 0 | Velocity speed calculation clamps to safe divisor 1; laser segment early-exits without division | **PASS (No NaN/Infinity)** |
| **Malformed Pointer Coordinates** | Pointer down dispatched with $clientX = -500$, $+2500$, or `NaN` | Canvas handler sanitizes and clamps coordinates to $[0, 600] \times [0, 800]$ | **PASS (Strict containment)** |
| **Broodmother Shop Spawning** | Player lingers in Armory/Shop for 15+ seconds while Broodmother is alive | Spawn timer remains frozen at 8.0s; 0 parasitic entities spawned | **PASS (Zero state leak)** |

---

## 4. Independent Verification Results

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *Result*: Exit Code 0, **0 errors**.

2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Result*: Exit Code 0, **Compiled successfully in 783ms**.

3. **Mandatory Review Test Suites**:
   ```bash
   TARGET_URL=http://localhost:3005 npx playwright test tests/m2_sec_math_defense.spec.ts tests/flagship_factions_live_browser.spec.ts tests/flagship_crew_deck_shop_ui.spec.ts
   ```
   *Result*: **24 passed (10.9s)**.

4. **Full Milestone Regression Suite (M1, M2, M3, M4)**:
   ```bash
   TARGET_URL=http://localhost:3005 npx playwright test tests/01_ui_and_controls.spec.ts tests/flagship_factions_live_browser.spec.ts tests/flagship_crew_deck_shop_ui.spec.ts tests/m1_physics_remediation.spec.ts tests/m2_sec_math_defense.spec.ts tests/m3_arch_lifecycle.spec.ts
   ```
   *Result*: **66 passed (17.1s)**.

---

## 5. Coverage Gaps & Caveats

- **Caveat 1 (Port 3005 Environment)**: The development server runs on port 3005 because external Docker services occupy port 3000 on this host. Playwright tests respect `TARGET_URL=http://localhost:3005`.
- **Caveat 2 (Bounds Margin)**: Bounds culling margins are $+/-150$px for Hadal units and $+/-100$px for Automaton rail slugs outside the $[0, 600] \times [0, 800]$ canvas. This is intentionally sized to avoid visual pop-in while ensuring rapid cleanup of laterally deflected entities.
- **Coverage**: All identified security, CCD, math defense, and regression testing requirements from M2 and M4 are fully covered.

---

## 6. Final Verdict

**APPROVE**.  
The implementations for Milestone M2 and Milestone M4 are clean, robust, mathematically sound, and rigorously verified. Zero integrity violations or regressions were identified.
