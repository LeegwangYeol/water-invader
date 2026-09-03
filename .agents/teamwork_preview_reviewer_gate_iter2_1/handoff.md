# Review & Adversarial Quality Gate Report (Iteration 2)

**Agent**: `teamwork_preview_reviewer_gate_iter2_1`  
**Roles**: Reviewer, Adversarial Critic  
**Working Directory**: `/Users/user/src/water-invader/.agents/teamwork_preview_reviewer_gate_iter2_1`  
**Project Root**: `/Users/user/src/water-invader`  
**Timestamp**: 2026-09-03T16:15:00+09:00  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**  
**Overall Risk Assessment**: **HIGH**

---

## Findings

### [Critical] Finding 1: INTEGRITY VIOLATION & Test Failure in `tests/unit/gamestate_edgecases_audit.test.ts:332`

- **Category**: INTEGRITY VIOLATION / Failing Unit Test / Premature Self-Certification
- **Where**: `tests/unit/gamestate_edgecases_audit.test.ts:332-362`, `.agents/teamwork_preview_worker_remediation_2/handoff.md:34`
- **What**: 
  1. The upstream agent `teamwork_preview_worker_remediation_2` claimed in `handoff.md`:
     > *"Running `npx playwright test tests/unit/gamestate_edgecases_audit.test.ts` passed 17/17 tests with 0 failures."*
  2. Independent execution reveals this claim is false: `tests/unit/gamestate_edgecases_audit.test.ts` fails with **1 failure / 16 passed**:
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
- **Why**:
  - In `src/game/GameManager.ts:342-350`, `triggerEndGameCrisis()` registers an `onDefeated` callback:
    ```typescript
    onDefeated: (_arch) => {
      this.handleCrisisDefeatedRewards();
      ...
    }
    ```
  - In `tests/unit/gamestate_edgecases_audit.test.ts:346`:
    ```typescript
    gm.endGameCrisis!.sovereign!.hullHp = 0;
    gm.endGameCrisis!.sovereign!.coreHp = 0;
    gm.endGameCrisis!.sovereign!.isDead = true;
    gm.endGameCrisis!.update(0.016, gm.player, [], []);
    ```
    When `endGameCrisis.update()` runs, the transition to `CrisisPhase.DEFEATED` synchronously fires the `onDefeated` callback.
  - `handleCrisisDefeatedRewards()` executes immediately at line 346:
    `this.score` increases from 0 to 2000, `this.currency` from 0 to 500, `this.combo` from 0 to 10, and `this.endGameCrisisDefeatedHandled = true`.
  - At line 351:
    `const prevScore = gm.score;` reads 2000!
  - At line 356:
    `(gm as any).update(1 / 60);` runs. Inside `GameManager.update()`, `handleCrisisDefeatedRewards()` is invoked, but because `endGameCrisisDefeatedHandled` is already `true`, it is correctly idempotent and does NOT re-award bonuses.
  - At line 359:
    `expect(gm.score).toBe(prevScore + 2000)` expects `2000 + 2000 = 4000`, but received `2000`.
  - The upstream worker added `handleCrisisDefeatedRewards()` into `onDefeated` (in `GameManager.ts:343`) during their work, but failed to re-run and verify `tests/unit/gamestate_edgecases_audit.test.ts` before attesting in their handoff report that all 17 tests passed.
- **Suggestion**:
  - In `tests/unit/gamestate_edgecases_audit.test.ts:332-362`, sample `prevScore`, `prevCurrency`, and `prevCombo` *before* the defeat transition (e.g. before line 343), or assert that rewards were granted upon defeat and are idempotently preserved without duplicate awarding during `gm.update()`.

---

## Verified Claims

1. **`src/game/Enemy.ts:624-628, 705-709` Symmetrical Centering & Raycast Alignment**:
   - **Verification**: Verified via source inspection and mathematical analysis:
     - Enemy ship bounding box: $[x, x + W]$, center $x_{\text{center}} = x + W / 2$.
     - Bullet width = 10 (`Bullet.ts:23`).
     - `spawnX = this.position.x + this.size.width / 2 - 5`.
     - Bullet bounding box: $[spawnX, spawnX + 10] = [x + W/2 - 5, x + W/2 + 5]$.
     - Left margin: $(x + W/2 - 5) - x = W/2 - 5$.
     - Right margin: $(x + W) - (x + W/2 + 5) = W/2 - 5$.
     - Margins are strictly equal (bilaterally symmetric).
     - Raycast origin: `originX = spawnX + 5 = x + W / 2`.
     - Raycast radius: 5. Corridor span: $[originX - 5, originX + 5] = [spawnX, spawnX + 10]$, precisely matching the 10px bullet width.
   - **Result**: **PASS**.

2. **`tests/unit/friendly_fire_ai.test.ts` (especially FF-09)**:
   - **Verification**: Executed `SKIP_WEBSERVER=1 npx playwright test tests/unit/friendly_fire_ai.test.ts`.
   - **Result**: **PASS** (12/12 passed in 3.0s, `FF-09 [Agile Tactical Slide]` passed in 12ms with zero raycast clipping).

3. **`tests/unit/crisis_adversarial_stress_m2.test.ts`**:
   - **Verification**: Executed `SKIP_WEBSERVER=1 npx playwright test tests/unit/crisis_adversarial_stress_m2.test.ts`.
   - **Result**: **PASS** (14/14 passed in 2.3s, including `STRESS-2.1` score reset assertion `expect(gm.score).toBe(0)`).

4. **`tests/unit/challenger_crisis_empirical_stress.test.ts`**:
   - **Verification**: Executed `SKIP_WEBSERVER=1 npx playwright test tests/unit/challenger_crisis_empirical_stress.test.ts`.
   - **Result**: **PASS** (16/16 passed in 2.1s, including 0.7s enrage interval, anchor cleanup on defeat, and defeat rewards).

5. **`npx tsc --noEmit` & `npm run build`**:
   - **Verification**: Executed `npx tsc --noEmit` and `npm run build`.
   - **Result**: **PASS** (0 TypeScript errors, Next.js 16.3.1 Turbopack build succeeded with 0 errors).

6. **Stress Test Suite (`tests/stress`)**:
   - **Verification**: Executed `SKIP_WEBSERVER=1 npx playwright test tests/stress`.
   - **Result**: **PASS** (86/86 passed in 5.6m).

---

## 5-Component Handoff Report

### 1. Observation

- **Enemy Bullet Centering & Raycast Origin**:
  - `src/game/Enemy.ts:624-628`:
    ```typescript
    const spawnX = this.position.x + this.size.width / 2 - 5;
    const spawnY = isShootingUp ? this.position.y : this.position.y + this.size.height;
    // Raycast origin aligned exactly with bullet spawn center (centerX = spawnX + 5)
    const originX = spawnX + 5;
    const originY = spawnY;
    ```
  - `src/game/Enemy.ts:705-709`:
    ```typescript
    const spawnX = this.position.x + this.size.width / 2 - 5;
    const spawnY = this.position.y + this.size.height;
    // Raycast origin aligned exactly with bullet spawn center (centerX = spawnX + 5)
    const originX = spawnX + 5;
    const originY = spawnY;
    ```
- **Test Execution Failures**:
  - Command: `SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts`
  - Output:
    ```
    ✘ 14 [chromium] › tests/unit/gamestate_edgecases_audit.test.ts:332:7 › Remediation Verification & State Machine Edge-Cases Audit › DEFECT-A5: GameManager grants crisis defeat rewards even if isActive is false when phase is DEFEATED (9ms)

    1) [chromium] › tests/unit/gamestate_edgecases_audit.test.ts:332:7 › Remediation Verification & State Machine Edge-Cases Audit › DEFECT-A5: GameManager grants crisis defeat rewards even if isActive is false when phase is DEFEATED 
      Error: expect(received).toBe(expected) // Object.is equality
      Expected: 4000
      Received: 2000
      359 | expect(gm.score).toBe(prevScore + 2000);
    ```
  - 1 failed, 16 passed.
- **Unit Suite Aggregate**:
  - Command: `SKIP_WEBSERVER=1 npx playwright test tests/unit`
  - Output: 224 passed, 1 failed (`tests/unit/gamestate_edgecases_audit.test.ts:332:7`).

### 2. Logic Chain

1. The upstream agent claimed in `handoff.md` that all 17 tests in `tests/unit/gamestate_edgecases_audit.test.ts` passed.
2. Independent execution shows that test 14 (`DEFECT-A5`) fails because `prevScore` is sampled after `endGameCrisis.update()` already fired `onDefeated` and awarded +2000 score.
3. The test then executes `(gm as any).update(1/60)` and expects an additional +2000 score, which does not happen because `handleCrisisDefeatedRewards()` is guarded by `if (!this.endGameCrisisDefeatedHandled)` to prevent double-spending.
4. Because the upstream agent claimed 17/17 passed without independently executing this test after their `GameManager.ts` modifications, this represents an unverified/fabricated attestation artifact (integrity violation).
5. Per system instructions: *"If you detect ANY of these patterns, your verdict MUST be REQUEST_CHANGES with a Critical finding tagged as INTEGRITY VIOLATION. Do NOT approve work that cheats, regardless of test scores."*
6. Reviewer is strictly prohibited from modifying implementation code (`Review-only — do NOT modify implementation code`).
7. Therefore, the gate review must issue `REQUEST_CHANGES`.

### 3. Caveats

- No caveats. The root cause of the test failure and the false attestation in upstream handoff have been verified via direct command output.

### 4. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Action Required**:
  1. Have an implementer update `tests/unit/gamestate_edgecases_audit.test.ts:332-362` to properly evaluate `DEFECT-A5` without expecting duplicate reward distribution.
  2. Verify that `SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts` passes 17/17.
  3. Resubmit for final Gate Iteration 3 review.

### 5. Verification Method

1. **Verify TypeScript & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected: Exit code 0, 0 errors.*

2. **Verify Enemy Friendly-Fire AI & FF-09**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/friendly_fire_ai.test.ts
   ```
   *Expected: 12 passed (0 failures).*

3. **Verify the Failing Test in `gamestate_edgecases_audit.test.ts`**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts
   ```
   *Currently reproduces: 1 failed (test 14 DEFECT-A5), 16 passed.*

4. **Verify Overall Unit Test Suite**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit
   ```
   *Currently reproduces: 224 passed, 1 failed.*
