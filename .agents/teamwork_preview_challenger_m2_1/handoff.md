# Handoff Report: Adversarial Empirical Challenge of Milestone M2 (Enemy Piercing Damage Scaling)

**Author**: Challenger 1 (EMPIRICAL CHALLENGER / critic / specialist)  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_challenger_m2_1`  
**Target Milestone**: Milestone 2 (M2) — Enemy Piercing Damage Scaling  
**Verdict**: **CONFIRM** (All 10 adversarial stress tests and 23 regression tests passed, 0 soft-locks, production build & type-check verified).

---

## 1. Observation

Direct empirical observations from test runs, static analysis, and code inspections:

### 1.1 Test Execution Commands & Verbatim Results
- **Adversarial Test File Created**: `tests/adversarial_challenger_m2_piercing_stress.spec.ts` (10 tests covering full 1-30 wave sweeps, penetration chains, stone absorption, CCD multi-tick resistance, and player survival).
- **Execution Command**: `npx playwright test tests/adversarial_challenger_m2_piercing_stress.spec.ts`
- **Output**:
  ```text
  Running 10 tests using 1 worker

    ✓   1 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:11:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-01: Exhaustive Wave 1-30 Damage & Piercing Sweep for Invader Common Mobs (663ms)
    ✓   2 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:83:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-02: Exhaustive Wave 1-30 Damage & Piercing Sweep for Rogue Drone (312ms)
    ✓   3 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:118:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-03: Elite and Boss Piercing Scaling Validation Across Wave Milestones (317ms)
    ✓   4 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:202:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-04: Destructible Barricade Multi-Penetration Chain for Piercing 1, 2, and 3 (261ms)
    ✓   5 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:317:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-05: Indestructible Stone Barricade Absolute Absorption Across All Piercing Counts (302ms)
    ✓   6 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:369:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-06: Player Protection Behind Cover (Destructible vs Stone) Under Piercing Attacks (268ms)
    ✓   7 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:456:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-07: Continuous Collision Deduplication (CCD) Multi-Tick Barricade Intersection (288ms)
    ✓   8 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:512:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-08: Zero-HP and Dead Barricades are Bypassed Without Consuming Piercing (276ms)
    ✓   9 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:548:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-09: Penetrated Bullet Retains Damage in Three-Way Crossfire Against Rogue Enemy (328ms)
    ✓  10 [chromium] › tests/adversarial_challenger_m2_piercing_stress.spec.ts:608:7 › Adversarial Challenger M2: Enemy Piercing Damage Scaling & Barricade Stress Suite › CH-M2-10: Player i-frames & Double-Bullet Anti-One-Shot Protection Under Wave 20 Fire (264ms)

    10 passed (4.0s)
  ```
- **Combined Regression Suite Execution**: `npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts tests/adversarial_r2_reviewer_deep_crossfire.spec.ts tests/enemy_piercing_damage_scaling.spec.ts`
- **Output**:
  ```text
  Running 23 tests using 1 worker
    23 passed (18.9s)
  ```
- **Type Checking Command**: `npx tsc --noEmit` -> Exit code 0 (0 errors).
- **Production Build Command**: `npm run build` -> Exit code 0 (Compiled successfully in 449ms, Next.js Turbopack).

### 1.2 Quantitative Implementation Formulas Observed in Source Code
1. **Wave Piercing Multiplier (`src/game/Enemy.ts:99-101`)**:
   $$M_p(W) = 1.0 + \min(1.5, \; \max(0, W - 10) \times 0.08)$$
2. **Common Mob Projectile Damage (`src/game/Enemy.ts:895, 1019`)**:
   $$D(W) = \min\left(2, \; 1 + \left\lfloor \frac{\max(0, W - 10)}{10} \right\rfloor\right)$$
   - Verified for all $W \in [1, 19]$: $D(W) = 1$.
   - Verified for all $W \in [20, 30]$: $D(W) = 2$.
3. **Projectile Piercing Count (`src/game/Enemy.ts:109-114, 896, 1020`)**:
   $$P(W) = \begin{cases}
   1, & \text{for } W < 15 \\
   2, & \text{for } 15 \le W < 25 \\
   3, & \text{for } W \ge 25
   \end{cases}$$
4. **Cover Penetration & Absorption (`src/game/GameManager.ts:1787-1815`)**:
   - Destructible barricade: deducts $D$ from barricade HP. If $P > 1$, decrements $P \leftarrow P - 1$ and bullet continues flying. If $P \le 1$, marks `bullet.isDead = true`.
   - Continuous Collision Deduplication: `bullet.hitEntities.add(barricade)` prevents re-hitting the same barricade during multi-frame intersection.
   - Stone barricade (`BarricadeType.INDESTRUCTIBLE`): always sets `bullet.isDead = true`, absorbing bullets of any piercing value ($P \in \{1, 2, 3, 10, 99\}$).

---

## 2. Logic Chain

1. **Hypothesis 1 (Damage Formula Verification across Waves 1 to 30)**:
   Common mobs (`NORMAL`, `ZIGZAG`, `SHIELDED`, `SPLITTER`, and `ROGUE_DRONE`) deal strictly 1 damage for waves 1–19, and scale to 2 damage at waves 20+.
   - *Evidence*: Exhaustive sweeps in `CH-M2-01` and `CH-M2-02` evaluated all 30 waves across all mob archetypes. Every wave $W \in [1, 19]$ produced bullet damage = 1 (100% assertion pass); every wave $W \in [20, 30]$ produced bullet damage = 2 (100% assertion pass).
2. **Hypothesis 2 (Piercing Count Thresholds across Waves 1 to 30)**:
   Projectile piercing counts follow the piecewise step function: $P=1$ for $W < 15$, $P=2$ for $15 \le W < 25$, and $P=3$ for $W \ge 25$.
   - *Evidence*: Evaluated in `CH-M2-01` and `CH-M2-02`. At boundary transitions $W=14 \to 15$ ($P: 1 \to 2$) and $W=24 \to 25$ ($P: 2 \to 3$), both `bullet.piercing` and `enemy.getPiercingCount()` shifted precisely. Piercing rounds also activated visual high-contrast bloom (`#f97316`).
3. **Hypothesis 3 (Destructible Barricade Penetration Dynamics)**:
   Destructible barricades lose damage equal to bullet damage, decrement piercing count, and permit bullets with $P > 1$ to punch through.
   - *Evidence*: Evaluated in `CH-M2-04`. A $P=1$ bullet dealt 2 damage to Barricade 1 (10 -> 8 HP) and was terminated (`isDead = true`). A $P=2$ bullet penetrated Barricade 1 (HP 10 -> 8, $P: 2 \to 1$), continued flight, damaged Barricade 2 (HP 10 -> 8), and terminated. A $P=3$ bullet punched through Barricade 1 and 2, terminating on Barricade 3.
4. **Hypothesis 4 (Stone Barricade Absolute Absorption)**:
   Indestructible stone barricades unconditionally stop all bullets immediately regardless of piercing count.
   - *Evidence*: Evaluated in `CH-M2-05`. Bullets with initial $P \in \{1, 2, 3, 10, 99\}$ were all terminated on frame 1 (`isDead = true`). Stone barricade HP remained at 20 (0 damage). Secondary cover and players positioned behind stone cover took 0 damage.
5. **Hypothesis 5 (Player Cover Defense & Anti-One-Shot Invariant)**:
   Players behind cover are protected from non-piercing rounds, take scaled non-lethal damage from piercing rounds, and survive Wave 20+ attacks without instant death.
   - *Evidence*: Evaluated in `CH-M2-06` and `CH-M2-10`. A Wave 20 bullet (damage 2, $P=2$) punched through destructible cover and dealt 2 damage to an un-upgraded 3 HP player, leaving 1 HP and triggering 1.0s invincibility frames (`invincibilityTimer = 1.0`). Rapid follow-up bullets during i-frames were absorbed with 0 additional damage, preventing one-shot deaths.
6. **Hypothesis 6 (Continuous Collision Deduplication / Anti-Tunneling)**:
   A penetrating bullet moving through a barricade over multiple simulation frames does not re-damage the barricade or consume extra piercing charges.
   - *Evidence*: Evaluated in `CH-M2-07`. A slow bullet traversing a barricade over 20 consecutive frames decremented piercing exactly once ($2 \to 1$) and deducted barricade HP exactly once (10 -> 8 HP), guarded by `bullet.hitEntities.has(barricade)`.

---

## 3. Caveats

1. **Continuous Collision Deduplication (CCD) Lifecycle**: CCD relies on `bullet.hitEntities: Set<Entity>` instance references. If entity pooling or reconstruction is applied to barricades during wave transitions or repairs, ensure reconstructed barricade instances are either fresh objects or `hitEntities` sets are cleared.
2. **Player Weapon Piercing Synergy**: The barricade collision pipeline in `GameManager.ts:1787-1815` is faction-agnostic for standard bullets. Player bullets with piercing upgrades will also punch through destructible barricades while being blocked by stone barricades, maintaining consistent physical laws across all entities.

---

## 4. Conclusion

**Verdict: CONFIRM**

Milestone 2 (Enemy Piercing Damage Scaling) is fully validated and verified:
- Common mob damage strictly equals 1 for Waves 1–19, and scales to 2 for Waves 20+.
- Piercing count strictly equals 1 for $W < 15$, 2 for $15 \le W < 25$, and 3 for $W \ge 25$.
- Destructible barricades properly lose HP equal to bullet damage and allow piercing bullets to punch through cover.
- Stone (indestructible) barricades unconditionally absorb all bullets regardless of piercing count.
- The player is protected from lethal one-shots via 1.0s invincibility frames.
- Continuous collision deduplication (CCD) prevents multi-tick damage leaks.
- Zero build errors (`npm run build`), zero TypeScript errors (`npx tsc --noEmit`), and 100% test pass rate across 10 adversarial stress tests and 23 regression tests.

---

## 5. Verification Method

To independently reproduce and verify all empirical findings:

```bash
# 1. Run the dedicated Milestone 2 adversarial stress suite (10 tests)
npx playwright test tests/adversarial_challenger_m2_piercing_stress.spec.ts

# 2. Run the dedicated Milestone 2 baseline suite (4 tests)
npx playwright test tests/enemy_piercing_damage_scaling.spec.ts

# 3. Run regression suites (Difficulty and Crossfire, 19 tests)
npx playwright test tests/12_extreme_difficulty_and_crises.spec.ts tests/adversarial_r2_reviewer_deep_crossfire.spec.ts

# 4. Verify TypeScript compilation (0 errors)
npx tsc --noEmit

# 5. Verify Next.js production build (Turbopack)
npm run build
```

**Invalidation Conditions**:
- Any test failure in `tests/adversarial_challenger_m2_piercing_stress.spec.ts`.
- Any mob bullet dealing 2 damage at Wave $\le 19$, or dealing 1 damage at Wave $\ge 20$.
- Any bullet punching through an indestructible stone barricade.
- Any piercing bullet being consumed multiple times by the same destructible barricade on subsequent frames.
- Non-zero exit codes from `npx tsc --noEmit` or `npm run build`.

