# Empirical Challenge Report: Enemy Friendly-Fire AI & State Machine Gate (Iter 2)

**Agent**: `teamwork_preview_challenger_gate_iter2_1`  
**Roles**: critic, specialist (empirical challenger)  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_challenger_gate_iter2_1/`  
**Timestamp**: 2026-09-03T07:07:30Z  
**Verdict**: **FAILED**

---

## 1. Observation

Direct empirical execution of the four assigned test suites and compilation checks produced the following results:

### 1.1 Command 1: `tests/unit/friendly_fire_ai.test.ts`
- **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/friendly_fire_ai.test.ts`
- **Result**: **12 passed (2.7s)**, Exit Code 0.
- **Specific Verification**:
  - `FF-09 [Agile Tactical Slide]: Sniper repositions laterally when blocked to peek around ally`: **PASSED** (19ms).
  - All 12 unit tests (`FF-01` to `FF-12`) passed cleanly.
  - Symmetrical centering in `src/game/Enemy.ts:624-628, 705-709` (`spawnX = position.x + width / 2 - 5`, `originX = spawnX + 5`) eliminated the 0.102px raycast clipping bug.

### 1.2 Command 2: `tests/unit/gamestate_edgecases_audit.test.ts`
- **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts`
- **Result**: **1 failed, 16 passed (4.5s)**, Exit Code 1.
- **Verbatim Error Output**:
  ```
  1) [chromium] › tests/unit/gamestate_edgecases_audit.test.ts:332:7 › Remediation Verification & State Machine Edge-Cases Audit › DEFECT-A5: GameManager grants crisis defeat rewards even if isActive is false when phase is DEFEATED 

    Error: expect(received).toBe(expected) // Object.is equality

    Expected: 4000
    Received: 2000

      357 |
      358 |     // REMEDIATION VERIFIED: victory rewards (+2000 score, +500 currency, +10 combo) granted!
    > 359 |     expect(gm.score).toBe(prevScore + 2000);
          |                      ^
      360 |     expect(gm.currency).toBe(prevCurrency + 500);
      361 |     expect(gm.combo).toBe(prevCombo + 10);
      362 |   });
        at /Users/user/src/water-invader/tests/unit/gamestate_edgecases_audit.test.ts:359:22
  ```
- **Discrepancy with Prior Worker Claim**:
  In `/Users/user/src/water-invader/.agents/teamwork_preview_worker_remediation_2/handoff.md` (lines 33, 87), the worker claimed:
  > *"Running `npx playwright test tests/unit/gamestate_edgecases_audit.test.ts` passed 17/17 tests with 0 failures."*
  Empirical re-run demonstrates this claim was inaccurate; test 14 (`DEFECT-A5`) consistently fails.

### 1.3 Command 3: `tests/unit/bughunt_allied_reinforcements_stress.test.ts`
- **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/bughunt_allied_reinforcements_stress.test.ts`
- **Result**: **15 passed (1.7s)**, Exit Code 0.
- **Specific Verification**:
  - `STRESS-1.1` to `STRESS-1.4`: 150-1,000 bullet dense barrages entering Point Defense grid vaporized without unhandled exceptions or runaway particles.
  - `DEFECT-B1-FIXED`: Nano-shield pulses strictly ignore dead players (`isDead: true`, `hp: 0`, and negative HP `-2`), preventing resurrection.
  - `DEFECT-B3-FIXED`: `triggerAlliedReinforcements()` is strictly idempotent under 50 successive calls.

### 1.4 Command 4: `tests/stress/bughunt_physics_adversarial_stress.spec.ts`
- **Command**: `SKIP_WEBSERVER=1 npx playwright test tests/stress/bughunt_physics_adversarial_stress.spec.ts`
- **Result**: **12 passed (1.8s)**, Exit Code 0.
- **Specific Verification**:
  - `SCENARIO-1.1` to `1.4`: 5x5 dense grid (5px gap) friendly-fire benchmark produced 0 friendly fire collisions.
  - `SCENARIO-2.1` to `2.3`: Continuous Collision Detection (CCD) swept AABB demonstrated 0.0% tunneling (0/100 across 500 to 10,000 px/s down to 10 FPS lag).
  - `SCENARIO-3.4`: `NaN` and `Infinity` coordinate guards prevented `createRadialGradient` / `arc` canvas crashes.

### 1.5 Supplemental Invariant & Build Checks
- **TypeScript Typecheck**: `npx tsc --noEmit` exited with code 0 (0 errors).
- **Next.js Turbopack Production Build**: `npm run build` compiled successfully in 4.1s + 8.5s typecheck with exit code 0.
- **Milestone 2 Stress Suite**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_adversarial_stress_m2.test.ts` exited with code 0 (14/14 passed).
- **Challenger Crisis Stress Suite**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/challenger_crisis_empirical_stress.test.ts` exited with code 0 (16/16 passed).
- **Crisis Adversarial Stress Suite**: `SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_adversarial_stress.test.ts` exited with code 0 (12/12 passed).

---

## 2. Logic Chain

1. **Root Cause Analysis of the Test 14 Failure in `gamestate_edgecases_audit.test.ts`**:
   - In `src/game/GameManager.ts:342-350`, `triggerEndGameCrisis` sets:
     ```typescript
     onDefeated: (_arch) => {
       this.handleCrisisDefeatedRewards();
       ...
     }
     ```
   - In `src/game/GameManager.ts:372-384`, `handleCrisisDefeatedRewards` implements idempotent single-grant protection:
     ```typescript
     public handleCrisisDefeatedRewards(): void {
       if (!this.endGameCrisisDefeatedHandled) {
         this.endGameCrisisDefeatedHandled = true;
         this.score += 2000;
         this.currency += 500;
         this.combo += 10;
         ...
       }
     }
     ```
   - In `tests/unit/gamestate_edgecases_audit.test.ts:342-362`:
     ```typescript
     // Lines 343-346: Defeat is triggered
     gm.endGameCrisis!.sovereign!.hullHp = 0;
     gm.endGameCrisis!.sovereign!.coreHp = 0;
     gm.endGameCrisis!.sovereign!.isDead = true;
     gm.endGameCrisis!.update(0.016, gm.player, [], []); // <--- HERE: transitionToPhase(DEFEATED) executes callbacks.onDefeated!

     // Line 351: Test measures baseline AFTER onDefeated has ALREADY awarded 2000 score:
     const prevScore = gm.score; // prevScore === 2000!

     // Line 356: Test runs GameManager.update
     (gm as any).update(1 / 60);

     // Line 359: Test asserts score increased by another 2000:
     expect(gm.score).toBe(prevScore + 2000); // 2000 !== 2000 + 2000 (4000)
     ```
2. **Analysis of the Behavioral vs Test Flaw**:
   - The game logic in `GameManager.ts` correctly prevents double-granting rewards by setting `endGameCrisisDefeatedHandled = true` upon the first invocation in `onDefeated`.
   - The test in `gamestate_edgecases_audit.test.ts` sampled `prevScore = gm.score` on line 351, *after* line 346 `gm.endGameCrisis!.update()` had already executed the transition to `DEFEATED` and triggered `onDefeated`.
   - The test was originally written under the assumption that `endGameCrisis.update()` would not award the victory rewards, and that only `GameManager.update()` would do so.
   - Because worker 2 added `handleCrisisDefeatedRewards()` into `onDefeated` (to solve a wave-clear race condition where `checkCollisions` transitions to `SHOP` before `update`), the rewards are awarded immediately at line 346.
   - Consequently, when `GameManager.update()` runs at line 356, `handleCrisisDefeatedRewards()` correctly does nothing.
   - The test assertion `expect(gm.score).toBe(prevScore + 2000)` expected a *second* 2,000 point award (total 4,000 points), which failed.

3. **Adversarial Gate Mandate**:
   - Objective requirement 2 states: *"Run tests/unit/gamestate_edgecases_audit.test.ts (verify all 17 tests pass)."*
   - Only 16 of 17 tests passed.
   - In accordance with the Review-Only constraint, the empirical challenger does not alter implementation code or tests to force a pass.
   - Therefore, the gate cannot be confirmed as passing.

---

## 3. Caveats

- **Test Logic vs Implementation Soundness**:
  The failure is caused by a test setup ordering flaw in `gamestate_edgecases_audit.test.ts` (sampling `prevScore` after defeat execution rather than before), rather than a bug that allows score leaks in production. In actual gameplay, player bullets trigger `onDefeated` and award +2,000 score exactly once, which is verified by `tests/unit/challenger_crisis_empirical_stress.test.ts:463` (Scenario 4.4, which correctly records `scoreBeforeFatalShot` before the defeat event and passes).
- **Other 3 Test Suites**:
  All 3 other mandatory suites (`friendly_fire_ai.test.ts`, `bughunt_allied_reinforcements_stress.test.ts`, `bughunt_physics_adversarial_stress.spec.ts`) passed with 100% success rates.
- **Build Integrity**:
  TypeScript compilation (`npx tsc --noEmit`) and Next.js Turbopack build (`npm run build`) pass cleanly with 0 errors.

---

## 4. Conclusion

**Verdict: FAILED**

- **Gate Status**: BLOCKED pending test synchronization in `tests/unit/gamestate_edgecases_audit.test.ts`.
- **Finding Summary**:
  - `tests/unit/friendly_fire_ai.test.ts`: **CONFIRMED** (12/12 passed, FF-09 verified).
  - `tests/unit/bughunt_allied_reinforcements_stress.test.ts`: **CONFIRMED** (15/15 passed).
  - `tests/stress/bughunt_physics_adversarial_stress.spec.ts`: **CONFIRMED** (12/12 passed).
  - `tests/unit/gamestate_edgecases_audit.test.ts`: **FAILED** (16 passed, 1 failed on test `DEFECT-A5`).
- **Remediation Action for Implementer**:
  In `tests/unit/gamestate_edgecases_audit.test.ts:332-362`, sample `prevScore`, `prevCurrency`, and `prevCombo` *before* line 346 (`gm.endGameCrisis!.update(0.016, ...)`), or verify that `gm.score === prevScore + 2000` reflects the initial defeat grant rather than asserting a duplicate grant across both `endGameCrisis.update()` and `gm.update()`.

---

## 5. Verification Method

To independently reproduce this finding:

1. Run the audit test suite:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts
   ```
   *Observed outcome*: 1 failure at line 359 (`Expected: 4000, Received: 2000`).

2. Verify that the other target suites pass:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/friendly_fire_ai.test.ts
   SKIP_WEBSERVER=1 npx playwright test tests/unit/bughunt_allied_reinforcements_stress.test.ts
   SKIP_WEBSERVER=1 npx playwright test tests/stress/bughunt_physics_adversarial_stress.spec.ts
   ```
   *Expected outcome*: 12 passed, 15 passed, 12 passed.

3. Verify build integrity:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected outcome*: Exit code 0, build succeeds.
