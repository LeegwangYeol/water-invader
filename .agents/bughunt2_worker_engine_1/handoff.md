# Handoff Report: Engine Core & Physics Fixes (bughunt2_worker_engine_1)

## 1. Observation

### Targeted Files & File Ownership
- `src/game/GameManager.ts`
- `src/game/Entity.ts`

### Direct Observations & Verbatim Issues Addressed
1. **DEF-C1 (SpawnWave Fall-Through During Crisis)**:
   - **File**: `src/game/GameManager.ts:751-757`
   - **Observed**: In `spawnWave()`, after `this.triggerEndGameCrisis()`, there was no `return;`. As a result, the function continued into wave horde generation, spawning 50–60 normal enemies directly on top of the Crisis Sovereign and Rifts.
   - **Fix Applied**: Added `return;` immediately after `this.triggerEndGameCrisis();`.

2. **DEF-S2 & DEF-A7 (Emergency Allies Lockout Flag State Leak)**:
   - **File**: `src/game/GameManager.ts`
   - **Observed**: `this.emergencyAlliesTriggeredThisWave` was only reset in `startNextWave()`. It leaked across continues (`prepareContinue()` and `continueGame()`) and new game initializations (`init()`), permanently locking the player out of emergency reinforcements if they continued or restarted on Wave 1.
   - **Fix Applied**: Added `this.emergencyAlliesTriggeredThisWave = false;` to `prepareContinue()`, `continueGame()`, and `init()`.

3. **DEF-S3 (Lingering Reinforcement Banner State Leak)**:
   - **File**: `src/game/GameManager.ts`
   - **Observed**: `this.alliedReinforcementBannerTimer` and `this.alliedReinforcementBannerText` were never cleared in `prepareContinue()` or `continueGame()`, leaving a ghost banner displayed upon continuing.
   - **Fix Applied**: Added `this.alliedReinforcementBannerTimer = 0; this.alliedReinforcementBannerText = ""; if (this.onAlliedReinforcements) this.onAlliedReinforcements(false, "");` to `prepareContinue()`, `continueGame()`, and `init()`.

4. **DEF-S4 (Persistent Threat Danger Vignette)**:
   - **File**: `src/game/GameManager.ts`
   - **Observed**: `this.threatIntensity` and `this.activeThreatLevel` were not reset in `prepareContinue()` or `continueGame()`, causing boss/elite perimeter vignettes to linger after continuing.
   - **Fix Applied**: Added `this.threatIntensity = 0; this.activeThreatLevel = 'NONE';` to `prepareContinue()` and `continueGame()`.

5. **DEF-A1 (Barricade Array Compaction Index Distortion)**:
   - **File**: `src/game/GameManager.ts:1688-1696`
   - **Observed**: In-place compaction spliced dead barricades out of `this.barricades`, altering the array length from 4 to 3, 2, or 1. This shifted fixed indices (0: Ice, 1: Stone, 2: Stone, 3: Ice), corrupting Saboteur targeting (`barricades[1], barricades[2]`), preventing Repair Bots from targeting dead barricades for resurrection, and distorting `damagedBarricades.length`.
   - **Fix Applied**: Removed array compaction. Retained all 4 barricade objects in fixed indices `[0, 1, 2, 3]`, marking destroyed barricades with `b.hp = 0; b.isDead = true;`.

6. **DEF-P1 (Ally Piercing Penetration Failure)**:
   - **File**: `src/game/GameManager.ts:2034-2048`
   - **Observed**: When a hostile bullet hit a helper drone, `bullet.isDead = true;` was unconditionally set without checking `bullet.piercing` or recording `bullet.hitEntities`.
   - **Fix Applied**: Checked `!bullet.hitEntities.has(helper)` and added helper / `helper.id` to `bullet.hitEntities`. If `bullet.piercing > 1`, decrements `bullet.piercing--` and allows the bullet to continue; only marks `bullet.isDead = true` if `bullet.piercing <= 1`.

7. **DEF-P2 (Barricade Phantom Multi-Hit Collision)**:
   - **File**: `src/game/GameManager.ts:1827-1835`
   - **Observed**: Destructible barricade damage `barricade.hp -= bullet.damage` did not set `barricade.isDead = true` when HP dropped $\le 0$. Other bullets in the exact same frame would still see `!barricade.isDead === true` and collide with a 0-HP ghost barrier.
   - **Fix Applied**: Added `if (barricade.hp <= 0) { barricade.hp = 0; barricade.isDead = true; }` immediately on bullet impact.

8. **DEF-A10 (Diver vs Multi-Barricade Collision Seam Leak)**:
   - **File**: `src/game/GameManager.ts:2150-2165`
   - **Observed**: When a Diver collided with a barricade, `enemy.isDead = true` was set, but the loop over `this.barricades` lacked a `break;`, causing it to damage multiple adjacent barricades if intersecting their seam.
   - **Fix Applied**: Added `break;` immediately after Diver impact and clamped barricade death to 0 HP.

9. **DEF-S6 & DEF-C4 (Frame-1 Instant Crisis Incursion on Wave 15+ Continue & Defeat Flag Memory)**:
   - **File**: `src/game/GameManager.ts:608-625, 734-785`
   - **Observed**: On continuing Wave 15+, `spawnWave()` rolled a 30% random crisis chance on frame 1 of respawn, instantly wiping normal enemies and triggering unexpected crisis encounters. In addition, the two-step continue flow (`prepareContinue` -> `continueGame`) was resetting `hasEndGameCrisisOccurred = false` even when the crisis was defeated.
   - **Fix Applied**:
     - `continueGame()` passes `{ isContinue: true }` to `this.spawnWave({ isContinue: true })`.
     - `spawnWave(optionsOrIsContinue?)` suppresses the initial random crisis roll when `isContinue` is true.
     - Preserved `hasEndGameCrisisOccurred` in `continueGame()` if already resolved.

10. **DEF-P8 (Continuous Collision Detection Swept-to-Swept Support)**:
    - **File**: `src/game/Entity.ts:53-95`
    - **Observed**: `Entity.checkCollision` only compared `swept1` vs `rect2` and `rect1` vs `swept2`. Two opposing high-velocity projectiles could cross each other during a frame tick and tunnel through without colliding. Furthermore, `sweptAABB` was missing from `Entity`.
    - **Fix Applied**: Added `public sweptAABB(other: Entity): boolean` checking intersection between `this.getSweptRect()` and `other.getSweptRect()`, and integrated it into `checkCollision`.

---

## 2. Logic Chain

1. **Step 1 (DEF-C1)**: In `GameManager.ts:640`, `triggerEndGameCrisis()` explicitly clears `this.enemies = []` to set up an isolated existential encounter. Because `spawnWave()` lacked a `return;` statement, execution fell through into regular horde spawning. Adding `return;` aligns `spawnWave()` with the intended architecture and guarantees that only the Crisis Sovereign and Rifts spawn.
2. **Step 2 (DEF-S2, DEF-S3, DEF-S4)**: Reinforcement flags, overlay timers, and threat vignettes are transient wave-level state. Because `prepareContinue()`, `continueGame()`, and `init()` previously omitted clearing these fields, state leaked across deaths and restarts. Adding comprehensive resets restores clean-slate invariants for resumed and newly initialized games.
3. **Step 3 (DEF-A1)**: Splicing elements from `this.barricades` mutates array indices dynamically. Saboteur AI (`Enemy.ts:378`) and Repair Bot AI (`Helper.ts:301`) hardcode indices 1 and 2 as the central defense line. Removing array compaction and maintaining a fixed 4-element array with `isDead = true` and `hp = 0` guarantees permanent index stability, enables Repair Bots to locate and resurrect dead barricades, and keeps `damagedBarricades.length >= 2` functional for emergency reinforcements.
4. **Step 4 (DEF-P1 & DEF-P2)**: Projectile piercing penetration requires two invariants: tracking struck entities in `bullet.hitEntities` and decrementing `bullet.piercing` until it reaches 0. Implementing this in helper collisions prevents hostile piercing bullets from terminating on the first helper. Concurrently, clamping barricades to `isDead = true` on the exact tick their HP hits 0 prevents phantom collision absorption for subsequent bullets in the same frame.
5. **Step 5 (DEF-A10)**: A Diver enemy is a suicide missile entity. Once it impacts any barricade and sets `enemy.isDead = true`, breaking out of the barricade loop prevents collateral damage to adjacent barricades across multi-voxel boundaries.
6. **Step 6 (DEF-S6 & DEF-C4)**: Passing `{ isContinue: true }` from `continueGame()` to `spawnWave()` allows the engine to distinguish between a natural wave start and a continue respawn. This prevents frame-1 random crisis rolls while retaining normal wave enemies and preserving crisis defeat status.
7. **Step 7 (DEF-P8)**: For two entities moving in opposite directions, the instantaneous bounding boxes and one-sided swept boxes can miss intersection when their paths cross within a single frame interval. Evaluating `swept1` vs `swept2` closes this tunneling gap.

---

## 3. Caveats

1. **Architectural Constraint Adherence**: `logicalWidth` (600) and `logicalHeight` (800) in `GameManager.ts` were strictly preserved and never modified.
2. **Coordinated Workspaces**: Parallel worker agents operate on adjacent files (`game-canvas.tsx` by worker_ui; `Enemy.ts`, `Bullet.ts`, `Helper.ts`, `Barricade.ts` by worker_combat). All changes made here are strictly isolated to `src/game/GameManager.ts` and `src/game/Entity.ts` (with one outdated test expectation in `tests/unit/endgame_crisis_m2_integration.test.ts` updated to align with DEF-C1).

---

## 4. Conclusion

All 10 requested engine and physics defects (DEF-C1, DEF-S2/A7, DEF-S3, DEF-S4, DEF-A1, DEF-P1, DEF-P2, DEF-A10, DEF-S6/C4, DEF-P8) are fully implemented, verified, and passing type-checking with 0 errors.

---

## 5. Verification Method

### 1. TypeScript Static Type-Check
```bash
npx tsc --noEmit
```
**Result**: Clean PASS with exit code 0.

### 2. Playwright Automated Test Verification
```bash
# Continue vs Restart Suite (14/14 passed)
npx playwright test tests/continue_vs_restart_on_death.spec.ts

# Barricade Saboteur & Repair Suite (5/5 passed)
npx playwright test tests/19_barricade_saboteur_and_repair.spec.ts

# Allied Reinforcements & Roles Suite (7/7 passed)
npx playwright test tests/18_allied_reinforcements_and_roles.spec.ts

# 12-Crisis Statistical Incursion & Gating Suite (4/4 passed)
npx playwright test tests/unit/crisis_distribution_12.test.ts

# End-Game Crisis M2 Integration Suite (8/8 passed)
npx playwright test tests/unit/endgame_crisis_m2_integration.test.ts

# Piercing Damage & Barricade Stress Suites (10/10 passed)
npx playwright test tests/adversarial_challenger_m2_piercing_stress.spec.ts
npx playwright test tests/enemy_piercing_damage_scaling.spec.ts
```
**Result**: All suites pass with 0 regressions.
