# Empirical Challenger Handoff Report: Milestone M1 (Faction System & Multi-Directional Combat Core)

- **Agent**: Challenger 2 (`teamwork_preview_challenger_m1_2`)
- **Roles**: critic, specialist
- **Date**: 2026-08-26
- **Verdict**: **REJECT** (Critical Bug Identified in Inter-Faction Physical Body Collision Loop)

---

## 1. Observation

Direct empirical observations from source analysis, tool commands, Playwright test runs, and custom stress harnesses:

### 1.1 Helper AI Multi-Faction Targeting & Interception
- **File & Line**: `src/game/Helper.ts:67-83` (Fighter AI), `src/game/Helper.ts:123-138` (Tank AI)
- **Observed Implementation**:
  ```typescript
  // Helper.ts:71-76
  for (const e of enemies) {
     if (!e.isDead && e.faction !== this.faction && e.position.y > lowestY) {
        lowestY = e.position.y;
        bestEnemy = e;
     }
  }
  ```
- **Test Executions**:
  - `tests/adversarial_challenger_m1_faction_combat.ts` (Suite 1: Tests 1.1–1.7): All 7 passed.
  - `tests/adversarial_challenger_m1_faction_combat.spec.ts:10` (`EMP-HELPER-AI-01`): Passed in 1.1s.
- **Verification**:
  - Fighter AI tracks the closest/lowest hostile target whether `Faction.INVADER` or `Faction.ROGUE`.
  - When the primary target is destroyed, Fighter AI dynamically retargets to the next living hostile entity on the subsequent frame.
  - Fighter AI ignores player allies (`Faction.PLAYER`).
  - Tank AI accurately tracks and intercepts both Invader and Rogue projectiles while ignoring friendly Player bullets.

### 1.2 Same-Faction Friendly Fire Immunity
- **File & Line**: `src/game/GameManager.ts:508`, `src/game/GameManager.ts:601`
- **Observed Implementation**:
  ```typescript
  // GameManager.ts:508
  if (bullet.faction === enemy.faction) continue; // Friendly fire immunity
  ```
  ```typescript
  // GameManager.ts:601
  if (bullet.faction !== Faction.PLAYER) { // Hostile bullets only vs helpers & player
  ```
- **Test Executions**:
  - `tests/adversarial_challenger_m1_faction_combat.ts` (Suite 2: Tests 2.1–2.4): All 5 passed.
  - `tests/adversarial_challenger_m1_faction_combat.spec.ts:83` (`EMP-FRIENDLY-FIRE-01`): Passed in 824ms.
- **Verification**:
  - 50 overlapping Player bullets hitting Player/Helpers deal 0 damage and are not consumed.
  - 50 overlapping Invader bullets hitting Invaders (Normal, Shielded, Boss) deal 0 damage and pass through.
  - 50 overlapping Rogue bullets hitting Rogues deal 0 damage and pass through.
  - Piercing projectiles passing through same-faction allies preserve 100% of their piercing charges.

### 1.3 Inter-Faction Enemy-vs-Enemy Physical Body Collision & Critical Ghost Corpse Bug (`VULN-M1-01`)
- **File & Line**: `src/game/GameManager.ts:689-718`
- **Observed Implementation**:
  ```typescript
  // GameManager.ts:689-718
  for (let i = 0; i < this.enemies.length; i++) {
    const enemyA = this.enemies[i];
    if (enemyA.isDead) continue;

    for (let j = i + 1; j < this.enemies.length; j++) {
      const enemyB = this.enemies[j];
      if (enemyB.isDead || enemyA.faction === enemyB.faction) continue;

      if (enemyA.checkCollision(enemyB)) {
        enemyA.hp -= 1;
        enemyB.hp -= 1;
        enemyA.hitFlashTimer = 0.08;
        enemyB.hitFlashTimer = 0.08;
        soundManager.playCrossfireHit();
        this.createExplosion((enemyA.position.x + enemyB.position.x) / 2, (enemyA.position.y + enemyB.position.y) / 2, '#f59e0b', 4);

        if (enemyA.hp <= 0) {
          enemyA.isDead = true;
          this.createExplosion(enemyA.position.x + enemyA.size.width / 2, enemyA.position.y + enemyA.size.height / 2, enemyA.color || '#f97316', 25);
          this.handleCrossfireKill(enemyA, enemyB.faction);
        }
        if (enemyB.hp <= 0) {
          enemyB.isDead = true;
          this.createExplosion(enemyB.position.x + enemyB.size.width / 2, enemyB.position.y + enemyB.size.height / 2, enemyB.color || '#f97316', 25);
          this.handleCrossfireKill(enemyB, enemyA.faction);
        }
      }
    }
  }
  ```
- **Observed Failure & Verbatim Output (`tests/test_ghost_collision_bug.ts`)**:
  ```
  handleCrossfireKill called for INVADER enemy, killer: ROGUE, hp: 0
  handleCrossfireKill called for INVADER enemy, killer: ROGUE, hp: -1
  handleCrossfireKill called for INVADER enemy, killer: ROGUE, hp: -2
  handleCrossfireKill called for INVADER enemy, killer: ROGUE, hp: -3
  handleCrossfireKill called for INVADER enemy, killer: ROGUE, hp: -4
  Total handleCrossfireKill calls: 5
  Single Invader final HP: -4
  Rogue 0 HP: 4
  Rogue 1 HP: 4
  Rogue 2 HP: 4
  Rogue 3 HP: 4
  Rogue 4 HP: 4
  ```

---

## 2. Logic Chain

1. **Premise 1**: In `GameManager.checkCollisions()` Phase 3 (lines 689–718), outer loop iterates over `enemyA` (`i`), and inner loop iterates over `enemyB` (`j = i + 1`).
2. **Premise 2**: When `enemyA` collides with `enemyB[0]` and `enemyA.hp` drops to `<= 0`, `enemyA.isDead` is set to `true`, and `handleCrossfireKill(enemyA, enemyB[0].faction)` is executed.
3. **Premise 3**: The inner loop continues iterating for `enemyB[1]`, `enemyB[2]`, etc. There is NO `if (enemyA.isDead) break;` or guard checking `enemyA.isDead` inside the inner loop.
4. **Inference 1**: `enemyA` (despite being dead with `isDead = true`) continues to collide with all subsequent opposing entities in the array within the same frame.
5. **Inference 2**: For each subsequent collision, `enemyA.hp` underflows further below zero (`-1`, `-2`, `-3`, `-4`), and `handleCrossfireKill(enemyA, ...)` is called repeatedly for the exact same unit.
6. **Inference 3**: Each redundant invocation of `handleCrossfireKill` increments player score (`score += baseScore * comboMultiplier`), grants pure water currency (`currency += baseCurrency * comboMultiplier`), increments combo (`combo++`), and charges ultimate gauge (`ultimateGauge += 2.0`).
7. **Inference 4**: Subjugated opposing units take physical collision damage from an already-destroyed corpse that should no longer exist in the combat space.
8. **Deduction**: This causes score inflation exploits, unintended free currency generation, infinite combo scaling on single-unit collisions, and physical desynchronization in multi-unit crossfire encounters.

---

## 3. Caveats

- In 1v1 single-pair isolated collisions (where only 1 Invader and 1 Rogue collide without other units nearby), the bug is masked because the inner loop terminates immediately after `j = 1`.
- Helper AI targeting and bullet-based same-faction immunity are robust, clean, and fully compliant with specification contracts.
- All 41 baseline tests in `tests/05_three_way_battle.spec.ts` pass because those tests primarily asserted projectile collisions rather than dense multi-unit body overlapping grids.

---

## 4. Conclusion

**Verdict**: **REJECT**

Milestone M1 cannot be approved in its current state due to `VULN-M1-01` in `src/game/GameManager.ts:689-718`.

### Required Mitigation for Implementer:
Add `if (enemyA.isDead) break;` at the beginning of the inner `j` loop or immediately after `enemyA` is marked dead:

```typescript
// Proposed Fix in src/game/GameManager.ts Phase 3:
for (let i = 0; i < this.enemies.length; i++) {
  const enemyA = this.enemies[i];
  if (enemyA.isDead) continue;

  for (let j = i + 1; j < this.enemies.length; j++) {
    if (enemyA.isDead) break; // <-- Critical guard: dead entity can no longer collide

    const enemyB = this.enemies[j];
    if (enemyB.isDead || enemyA.faction === enemyB.faction) continue;

    if (enemyA.checkCollision(enemyB)) {
      enemyA.hp -= 1;
      enemyB.hp -= 1;
      enemyA.hitFlashTimer = 0.08;
      enemyB.hitFlashTimer = 0.08;
      soundManager.playCrossfireHit();
      this.createExplosion((enemyA.position.x + enemyB.position.x) / 2, (enemyA.position.y + enemyB.position.y) / 2, '#f59e0b', 4);

      if (enemyA.hp <= 0) {
        enemyA.isDead = true;
        this.createExplosion(enemyA.position.x + enemyA.size.width / 2, enemyA.position.y + enemyA.size.height / 2, enemyA.color || '#f97316', 25);
        this.handleCrossfireKill(enemyA, enemyB.faction);
      }
      if (enemyB.hp <= 0) {
        enemyB.isDead = true;
        this.createExplosion(enemyB.position.x + enemyB.size.width / 2, enemyB.position.y + enemyB.size.height / 2, enemyB.color || '#f97316', 25);
        this.handleCrossfireKill(enemyB, enemyA.faction);
      }
      if (enemyA.isDead) break; // <-- Break out immediately if enemyA perished
    }
  }
}
```

---

## 5. Verification Method

To independently reproduce and verify this finding:

1. **Run the isolated bug reproduction script**:
   ```bash
   npx tsx tests/test_ghost_collision_bug.ts
   ```
   *Expected result before fix*: `handleCrossfireKill` called 5 times, `Single Invader final HP: -4`.
   *Expected result after fix*: `handleCrossfireKill` called exactly 1 time, `Single Invader final HP: 0`.

2. **Run the full adversarial combat test suite**:
   ```bash
   npx tsx tests/adversarial_challenger_m1_faction_combat.ts
   ```

3. **Run the browser-based Playwright spec**:
   ```bash
   npx playwright test tests/adversarial_challenger_m1_faction_combat.spec.ts
   ```

4. **Verify production compilation**:
   ```bash
   npm run build
   ```
