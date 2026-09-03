# Adversarial Stress Test & Empirical Challenge Handoff Report

**Agent**: Challenger 1 (`teamwork_preview_challenger_exp_1`)  
**Timestamp**: 2026-09-03T01:21:00Z  
**Mission**: Empirically stress-test and adversarially challenge R1 (Crisis Doubling) and R3 (Friendly-Fire Avoidance).  
**Verdict**: **REJECT** (R3 Friendly-Fire Avoidance fails under dense/chaotic formations; R1 Crisis Doubling CONFIRMED)

---

## 1. Observation

### 1.1 R3 Friendly-Fire Implementation Inspection
In `src/game/Enemy.ts`:
- **Line 524–527**:
  ```typescript
  const spawnX = this.position.x + this.size.width / 2 - 3;
  const spawnY = this.position.y + this.size.height;
  const originX = spawnX + 5;
  const originY = spawnY;
  ```
  The spawned bullet is instantiated at `spawnX = this.position.x + this.size.width / 2 - 3` with dimensions `6 x 12` (`src/game/Bullet.ts:23-26`). Its horizontal bounding box is $[spawnX, spawnX + 6]$, with true center at $spawnX + 3$. However, `originX` is explicitly offset by $+5$ to $spawnX + 5$.
- **Line 413 & 418–450**:
  ```typescript
  const effectiveVx = Math.abs(dirX * 200);
  const isVertical = Math.abs(dx) < 5 || effectiveVx < 5;
  if (isVertical) {
    for (let i = 0; i < allEnemies.length; i++) {
      const ally = allEnemies[i];
      if (ally.position.y <= this.position.y) continue; // Line 426
  ```
  The vertical suppression tier explicitly skips any ally where `ally.position.y <= this.position.y`. When Rogues or lower-positioned units fire upwards towards upper Invaders (`dirY < 0`), all intermediate allies have $y \le \text{shooter.y}$, rendering line 426 completely blind to upward allied obstructions.
- **Line 453–515 (Raycast Tier)**:
  Raycast slab intersection tests instantaneous static coordinates at frame $t_0$ with `projectileRadius = 5`. It does not calculate time-of-flight $\Delta t = \Delta y / v_y$ or project ally movement $x_{\text{ally}}(t) = x_{\text{ally}}(0) + v_{x,\text{ally}} \Delta t$.

### 1.2 Empirical Stress Test Execution Results
Execution command:
`npx playwright test tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts`

Results (verbatim tool output):
```
Running 10 tests using 1 worker

  ✓   1 STRESS-FF-01: Pure Column Aligned Suppression preserves zero allied friendly-fire in vertical corridors (27ms)
[STRESS-FF-02 Empirical Result] Friendly fire collisions in staggered formation: 2 to 4
  ✓   2 STRESS-FF-02 [EMPIRICAL ADVERSARIAL CHALLENGE]: Staggered & Diagonal Formations expose Friendly-Fire Vulnerability (24ms)
[STRESS-FF-03 Empirical Result] Friendly hits under chaotic movement: 24 to 29
  ✓   3 STRESS-FF-03 [EMPIRICAL ADVERSARIAL CHALLENGE]: Chaotic Overlapping Movement produces high friendly-fire rates (98ms)
  ✓   4 CROSSFIRE-01: Line-of-Sight does NOT block opposing faction targets and direct hits register damage (2ms)
[CROSSFIRE-02 Empirical Result] Crossfire hits: 13, Rogue-on-Rogue friendly hits: 4 to 5
  ✓   5 CROSSFIRE-02: 20-unit opposing skirmish produces active crossfire damage while exposing Rogue-on-Rogue upward blind spot (9ms)
  ✓   6 CRISIS-01: Rapid-fire instantiation of all 6 archetypes across 60 cycles causes zero memory leak or unhandled exception (40ms)
  ✓   7 CRISIS-02: 5,200 EHP Invariant strictly verified across all 6 archetypes (5ms)
  ✓   8 CRISIS-03: Anchor destruction collapses barriers and unlocks Sovereign damage vulnerability across all 6 archetypes (15ms)
  ✓   9 CRISIS-04: Phase 3 Core Enrage Cascades execute without exception or memory overflow across all 6 archetypes (9ms)
  ✓  10 CRISIS-05: Bespoke Anchor Mechanics for 3 New Archetypes under Adversarial Edge Conditions (3ms)

  10 passed (1.8s)
```

### 1.3 Detailed Trace of Friendly-Fire Failure in Staggered 55-Unit Swarm
Instrumentation trace during `STRESS-FF-02`:
```
FRIENDLY FIRE HIT at frame 27!
Shooter: R3C5 (EnemyType.SNIPER), Target: R4C5 (EnemyType.NORMAL)
Bullet was spawned at frame 25
Shooter pos at spawn: { x: 353.58, y: 218.47 }
Target pos at spawn: { id: 'R4C5', x: 329.58, y: 263.33, isDead: false }
Target pos at hit: { x: 331.33, y: 263.73 }
Bullet pos at hit: { x: 371.01, y: 268.46 }
Bullet vel: { x: 8.58, y: 399.9 }
```
At frame 25:
- Target R4C5 span: $x \in [329.58, 369.58]$
- Expanded target box: $boxMaxX = 369.58 + 5 = 374.58$
- Shooter R3C5 `spawnX`: $353.58 + 20 - 3 = 370.58$
- Raycast `originX`: $spawnX + 5 = 375.58$
- Because $originX = 375.58 > boxMaxX = 374.58$ and $dirX > 0$, the raycast started to the right of the expanded box and angled rightwards. `hasAlliedObstacleInShotPath` returned `false`.
- However, the bullet was spawned at $spawnX = 370.58$, directly aligned with the ally's right corner ($369.58$), and collided on frame 27 as the ally drifted rightwards.

### 1.4 Detailed Trace of Upward Rogue Blind Spot
During `CROSSFIRE-02`:
```
COLLISION: Bullet from ROG_6 (ROGUE) HIT ROG_1 (ROGUE)
  Bullet pos=(283.5, 302.0), vel=(-29.8, -298.5)
  Target pos=(290.4, 275.6)
```
Rogue unit `ROG_6` at $y \approx 300$ fired upwards ($v_y = -298.5$) at an upper Invader. Allied Rogue `ROG_1` was positioned ahead at $y \approx 250$. Line 426 (`if (ally.position.y <= this.position.y) continue;`) skipped `ROG_1`, and `ROG_6` shot directly into the back of `ROG_1`.

### 1.5 R1 Crisis Doubling Verification
In `src/game/crisis/`:
- `CrisisArchetype` has exactly 6 enum members: `VOID_SOVEREIGN`, `ABYSSAL_LEVIATHAN`, `CYBERNETIC_EXTERMINATOR`, `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, `NEBULA_PHANTASM`.
- 5,200 EHP Invariant: Left Anchor (600) + Right Anchor (600) + Sovereign Hull (2,500) + Sovereign Core (1,500) = 5,200 EHP across all 6 configurations.
- In Phase 1 (`PHASE_1_SHIELD`), Sovereign absorbs 0 damage (`isInvulnerable = true`).
- Upon destroying Anchor 1, Sovereign remains invulnerable.
- Upon destroying Anchor 2, Sovereign barrier collapses immediately (`isInvulnerable = false`, `PHASE_2_HULL`).
- In Phase 3 (`PHASE_3_CORE`), 35s enrage countdown executes down to 0, triggers `realityDistortionLevel = 1.0`, and cascades bespoke super-weapon patterns (8-way Tachyon Starburst, 10-way Solar Flare, 12-way Quantum Curtain).
- 60 rapid cycles of instantiation and disposal ran with zero exceptions and stable memory footprint.

---

## 2. Logic Chain

1. **Premise 1 (R3 Contract)**: The user acceptance criteria for R3 require: *"Automated tests or explicit collision logs verify that enemies will suppress their fire or reposition if another enemy is directly in their line of fire"* and the task mandates: *"dense formations (50+ active enemies), chaotic overlapping movement, staggered rows. Verify zero allied friendly-fire damage occurs over 300 simulated frames."*
2. **Step 1 (Symmetric Corridor Failure)**: Observation 1.1 and 1.3 show that `originX` is shifted $+5\text{px}$ to the right of `spawnX`, while the bullet's width is 6px ($[spawnX, spawnX + 6]$). A symmetric raycast origin must be located at $spawnX + 3$ (the bullet's actual center) or use the full $[spawnX - \text{margin}, spawnX + 6 + \text{margin}]$ corridor. Because of the $+2\text{px}$ asymmetric bias, Snipers aiming slightly rightward evaluate $originX > boxMaxX$, bypass suppression, and clip allies with the left edge of their projectile.
3. **Step 2 (Lack of Time-of-Flight Lead)**: Bullets travel at 200–400 px/s, requiring 6 to 18 frames to traverse row distances (45–100px). In dense formations and chaotic movement, frontline allies moving at 20–50 px/s travel 5 to 15 pixels while the bullet is in flight. An instantaneous line-of-sight test with a 5px margin cannot prevent an ally from stepping into the bullet path mid-flight. Observation 1.2 proves that 24–29 friendly-fire collisions occur over 300 frames under chaotic movement.
4. **Step 3 (Directional Blind Spot)**: In multi-faction crossfire, Rogues spawn below Invaders and shoot upwards ($dirY < 0$). Observation 1.1 and 1.4 show that line 426 explicitly prunes allies where $y \le \text{shooter.y}$. Consequently, Rogues shooting upwards never detect allied Rogues situated between themselves and the target, causing Rogue-on-Rogue friendly fire (4–5 collisions per skirmish).
5. **Step 4 (R1 Contract Satisfaction)**: Observation 1.5 proves that all 6 crisis archetypes (including the 3 doubled ones) strictly satisfy the 5,200 EHP invariant, multi-phase state machine transitions, anchor barrier collapse, bespoke mechanics (Tachyon monolith, Prominence pillar, Phase pods), and core enrage cascades with zero memory leak or unhandled exceptions.
6. **Inference / Verdict**: Because R3 fails the zero friendly-fire invariant under dense staggered formations and chaotic movement, the implementation cannot be confirmed as correct. The formal verdict is **REJECT**.

---

## 3. Caveats

1. **Column-Aligned Grids Pass**: If enemies are strictly arranged in a non-staggered rectangular grid with identical velocities and only vertical firing (no diagonal Snipers, no lateral evasion), zero friendly fire occurs (`STRESS-FF-01` passes 100%). The failures emerge specifically under staggered rows, diagonal targeting, dynamic movement, and upward crossfire.
2. **NEBULA_PHANTASM Effective EHP**: Nominal HP is 5,200 (600 + 600 + 2500 + 1500). However, the shifted Entangled Phase Pod reduces incoming damage by 80%. A player targeting only the shifted pod must deal 3,000 raw damage to deplete its 600 HP (unless timing shots during the 3.6s coherent window). This is considered intentional boss mechanics rather than an invariant violation.
3. **No Implementation Changes Made**: In accordance with the Challenger role constraints (`Review-only — do NOT modify implementation code`), no source code modifications were made to `src/game/`. All findings are demonstrated via the automated test suite in `tests/stress/`.

---

## 4. Conclusion

### Final Assessment
- **R1 (Crisis Doubling)**: **CONFIRM_CORRECTNESS**. The 6 Crisis archetypes are fully implemented with bespoke vector art, unique anchor mechanics, robust phase state machines, strict 5,200 EHP contract, anchor-barrier coupling, and exception-free enrage cascades.
- **R3 (Friendly-Fire Avoidance)**: **REJECT**. While simple vertical column obstruction is avoided, the implementation fails in dense formations, staggered rows, chaotic movement, and upward crossfire due to:
  1. Asymmetric raycast origin ($spawnX + 5$ instead of true bullet center $spawnX + 3$) causing edge-clipping on diagonal shots.
  2. Purely instantaneous collision checks with zero time-of-flight projection for moving allies.
  3. Directional pruning bug in line 426 (`ally.position.y <= this.position.y`) that completely disables vertical obstruction checks for upward-firing units.

### Actionable Remediation for Implementer
1. **Fix Raycast Origin**: In `Enemy.ts:526`, set `originX = spawnX + 3` (matching the bullet's center), and expand the test corridor to cover the full bullet bounding box plus margin ($\text{radius} = \text{bulletWidth} / 2 + 8$).
2. **Add Time-of-Flight Projection**: In `hasAlliedObstacleInShotPath`, compute the estimated time-of-arrival $t_{\text{arr}} = \text{dist} / v_{\text{bullet}}$, and evaluate the ally's predicted bounding box $[x + v_{x,\text{ally}} t_{\text{arr}}, \dots]$.
3. **Fix Upward Pruning**: In `Enemy.ts:426`, check direction:
   ```typescript
   if (dirY > 0 && ally.position.y <= this.position.y) continue;
   if (dirY < 0 && ally.position.y >= this.position.y) continue;
   ```

---

## 5. Verification Method

To independently verify these findings and reproduce all empirical data:

1. **Run the Adversarial Stress Suite**:
   ```bash
   npx playwright test tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts
   ```
   Inspect console outputs for `[STRESS-FF-02 Empirical Result]` (showing 2–4 friendly collisions in staggered formations), `[STRESS-FF-03 Empirical Result]` (showing 24–29 friendly collisions under chaotic movement), and `[CROSSFIRE-02 Empirical Result]` (showing 4–5 Rogue friendly hits).

2. **Verify Invariant Test Coverage**:
   ```bash
   npx playwright test tests/unit/crisis_doubling.test.ts tests/unit/friendly_fire_ai.test.ts
   ```
   All 21 baseline unit tests pass.

3. **Verify Build & Type Safety**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Both complete with 0 errors.
