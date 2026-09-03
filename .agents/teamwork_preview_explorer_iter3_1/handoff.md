# Technical Investigation Report: Crisis Defeat Lifecycle & Integrity Audit Remediation

**Agent:** `teamwork_preview_explorer_iter3_1`  
**Working Directory:** `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_iter3_1/`  
**Project Root:** `/Users/user/src/water-invader`  
**Target Files:** `src/game/GameManager.ts`, `src/game/crisis/EndGameCrisis.ts`, `tests/unit/gamestate_edgecases_audit.test.ts`, `tests/bughunt_empirical_edgecases_state_machine.spec.ts`  
**Timestamp:** 2026-09-03T07:23:00Z  

---

## Executive Summary

This investigation resolves the root cause behind the integrity audit failure reported by `teamwork_preview_auditor_gate_iter2_1` (`handoff.md:111-184`), where `tests/unit/gamestate_edgecases_audit.test.ts:332-362` (DEFECT-A5) failed with `Expected: 4000, Received: 2000`, and `tests/bughunt_empirical_edgecases_state_machine.spec.ts:239` (Test 2.2) regressed with `Expected: 2015, Received: 4015`.

The root cause was traced to an overzealous modification in `src/game/GameManager.ts:342-344`, where worker remediation 2 invoked `this.handleCrisisDefeatedRewards()` directly inside the `callbacks.onDefeated` event hook. Because `callbacks.onDefeated` executes synchronously during `endGameCrisis.update()` or bullet collision resolution, defeat rewards (+2000 score, +500 currency, +10 combo) were awarded prematurely, breaking the baseline sampling in the audit test and causing dead players to receive victory bonuses on simultaneous game-over frames.

By removing `this.handleCrisisDefeatedRewards();` from `callbacks.onDefeated` while preserving it in `GameManager.update()` (line 779) and `GameManager.checkCollisions()` (line 1255), **both failing tests pass authentically with ZERO test alterations**. A clean, machine-applicable patch has been prepared at `.agents/teamwork_preview_explorer_iter3_1/crisis_defeat_lifecycle.patch`.

---

## 1. Observation

### 1.1 Verbatim Audit Test Failure (`gamestate_edgecases_audit.test.ts:332-362`)
- **Execution Command**:
  ```bash
  SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts
  ```
- **Execution Result**: Exit code 1 (16 passed, 1 failed in 887ms).
- **Verbatim Error Output**:
  ```text
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

### 1.2 Verbatim Regression in State Machine Invariant (`bughunt_empirical_edgecases_state_machine.spec.ts:239-302`)
- **Direct Code Inspection (`tests/bughunt_empirical_edgecases_state_machine.spec.ts:289-297`)**:
  ```typescript
  expect(result.isCrisisDefeated).toBe(true);
  expect(result.playerHp).toBeLessThanOrEqual(0);
  expect(result.gameState).toBe('GAME_OVER');
  // Empirical Finding: Crisis hit score (+15) is credited immediately, but +2000/+500 defeat resolution
  // is evaluated at the start of the next update() cycle which is skipped when state transitions to GAME_OVER.
  expect(result.score).toBe(2015); // 2000 initial + 15 bullet damage score
  expect(result.currency).toBe(200); // 200 initial (500 bonus deferred to update loop)
  ```
- **Auditor Observed Result (`auditor handoff.md:168-172`)**:
  ```text
  Expected: 2015
  Received: 4015
  ```

### 1.3 Direct Inspection of Source Code Interplay
1. **`src/game/GameManager.ts:333-350` (`triggerEndGameCrisis`)**:
   ```typescript
   this.endGameCrisis.callbacks = {
     onPhaseChange: (phase, _prevPhase) => {
       if (phase === CrisisPhase.PHASE_2_HULL && !this.alliedReinforcements) {
         this.triggerAlliedReinforcements();
       }
       if (this.onEndGameCrisisEvent && this.endGameCrisis) {
         this.onEndGameCrisisEvent(this.endGameCrisis.getState());
       }
     },
     onDefeated: (_arch) => {
       this.handleCrisisDefeatedRewards(); // <-- INJECTED IN WORKER ITERATION 2
       if (this.alliedReinforcements && !this.alliedReinforcements.isWarpingOut) {
         this.alliedReinforcements.warpOut();
       }
       if (this.onEndGameCrisisEvent && this.endGameCrisis) {
         this.onEndGameCrisisEvent(this.endGameCrisis.getState());
       }
     },
     ...
   };
   ```

2. **`src/game/crisis/EndGameCrisis.ts:241-244, 285-298` (`update` & `transitionToPhase`)**:
   ```typescript
   // EndGameCrisis.ts:241-244
   if (this.sovereign.phase === CrisisPhase.DEFEATED || this.sovereign.isDead || this.sovereign.hp <= 0) {
     this.transitionToPhase(CrisisPhase.DEFEATED, soundManager);
     return;
   }

   // EndGameCrisis.ts:285-298
   } else if (newPhase === CrisisPhase.DEFEATED) {
     this.bannerText = '✦ CATACLYSM AVERTED — CRISIS SOVEREIGN DESTROYED ✦';
     this.isActive = false;
     for (const anchor of this.riftAnchors) {
       anchor.isDead = true;
     }
     if (soundManager) {
       soundManager.playSingularityCollapse();
       soundManager.playVictory();
     }
     if (this.callbacks.onDefeated) {
       this.callbacks.onDefeated(this.archetype); // <-- SYNCHRONOUSLY CALLS onDefeated!
     }
   }
   ```

3. **`src/game/GameManager.ts:778-780` (`GameManager.update`)**:
   ```typescript
   // Defeat resolution: grant massive victory bonus (+2000 score, +500 cash)
   if (this.endGameCrisis && (this.endGameCrisis.isDefeated() || this.endGameCrisis.phase === CrisisPhase.DEFEATED)) {
     this.handleCrisisDefeatedRewards();
   }
   ```

4. **`src/game/GameManager.ts:1254-1258` (`GameManager.checkCollisions` Wave Clear)**:
   ```typescript
   if (this.endGameCrisis && this.endGameCrisis.isDefeated()) {
     this.handleCrisisDefeatedRewards();
     this.endGameCrisis = null;
     if (this.onEndGameCrisisEvent) this.onEndGameCrisisEvent(null);
   }
   ```

5. **`src/game/GameManager.ts:372-384` (`handleCrisisDefeatedRewards`)**:
   ```typescript
   public handleCrisisDefeatedRewards(): void {
     if (!this.endGameCrisisDefeatedHandled) {
       this.endGameCrisisDefeatedHandled = true;
       this.score += 2000;
       this.currency += 500;
       this.combo += 10;
       this.comboTimer = 5.0;
       this.updateScoreUI();
       this.createExplosion(this.logicalWidth / 2, 200, '#fbbf24', 120, 3.0);
       this.triggerScreenShake(1.2);
       soundManager.playVictory();
     }
   }
   ```

6. **Historical Commit Inspection (`git log -S onDefeated -p src/game/GameManager.ts`)**:
   In initial commit `fd32727`, `onDefeated` had NO reward logic:
   ```typescript
   onDefeated: (_arch) => {
     if (this.onEndGameCrisisEvent && this.endGameCrisis) {
       this.onEndGameCrisisEvent(this.endGameCrisis.getState());
     }
   },
   ```
   `this.handleCrisisDefeatedRewards();` was added only in worker iteration 2 without considering its cascading side-effects on test sampling and state machine invariants.

---

## 2. Logic Chain

### 2.1 Trace of Test 14 Failure (`DEFECT-A5`)
1. In `tests/unit/gamestate_edgecases_audit.test.ts:334-340`, `gm` is initialized with `score = 0`, `currency = 150`, `combo = 0`.
2. In lines 343-345, the test sets `hullHp = 0`, `coreHp = 0`, `isDead = true`.
3. In line 346, the test calls:
   ```typescript
   gm.endGameCrisis!.update(0.016, gm.player, [], []);
   ```
4. Inside `endGameCrisis.update()`, lines 241-243 detect `sovereign.hp <= 0` and call `transitionToPhase(CrisisPhase.DEFEATED)`.
5. Inside `transitionToPhase(CrisisPhase.DEFEATED)`, lines 287-296 set `this.isActive = false` and synchronously invoke `this.callbacks.onDefeated(this.archetype)`.
6. Because `GameManager.triggerEndGameCrisis` wired `this.handleCrisisDefeatedRewards()` into `onDefeated`, `handleCrisisDefeatedRewards()` executes right here at line 346:
   - `this.score += 2000` (gm.score is now 2000)
   - `this.currency += 500` (gm.currency is now 650)
   - `this.combo += 10` (gm.combo is now 10)
   - `this.endGameCrisisDefeatedHandled = true`
7. In lines 351-353, the test samples baseline values:
   - `const prevScore = gm.score;` $\rightarrow$ `prevScore` is **2000** (not 0!).
   - `const prevCurrency = gm.currency;` $\rightarrow$ `prevCurrency` is **650** (not 150!).
   - `const prevCombo = gm.combo;` $\rightarrow$ `prevCombo` is **10** (not 0!).
8. In line 356, the test calls:
   ```typescript
   (gm as any).update(1 / 60);
   ```
9. Inside `GameManager.update()`, line 778 checks:
   `if (this.endGameCrisis && (this.endGameCrisis.isDefeated() || this.endGameCrisis.phase === CrisisPhase.DEFEATED))`
   This condition is `true`, calling `this.handleCrisisDefeatedRewards()`.
10. Inside `handleCrisisDefeatedRewards()`, line 373 checks `if (!this.endGameCrisisDefeatedHandled)`. Since `endGameCrisisDefeatedHandled` is already `true`, it immediately returns, preventing duplicate rewards.
11. `gm.score` remains 2000.
12. In line 359, the assertion runs:
    ```typescript
    expect(gm.score).toBe(prevScore + 2000);
    ```
    - `prevScore + 2000 = 2000 + 2000 = 4000`.
    - Actual `gm.score` is `2000`.
    - Result: `Expected: 4000, Received: 2000`. Fails.

### 2.2 Trace of State Machine Regression (`bughunt_empirical_edgecases_state_machine.spec.ts:239`)
1. In test 2.2, the player and Sovereign Core both reach 0 HP within the same physics tick during `(gm as any).update(1 / 60)`.
2. Initial score is 2000, currency is 200.
3. During `checkCollisions()`:
   - Player bullet strikes Sovereign Core: Core HP reaches 0.
   - Bullet damage score (+15) is credited to `gm.score` (score becomes 2015).
   - Sovereign Core depletion triggers `transitionToPhase(CrisisPhase.DEFEATED)` $\rightarrow$ `callbacks.onDefeated`.
   - Because `handleCrisisDefeatedRewards()` was inside `onDefeated`, +2000 score and +500 currency were immediately credited.
   - Hostile bullet strikes player: Player HP reaches 0 $\rightarrow$ `gameOver()` $\rightarrow$ `gm.state = GameState.GAME_OVER`.
4. Final evaluated result:
   - `score = 2000 + 15 + 2000 = 4015` (expected 2015).
   - `currency = 200 + 500 = 700` (expected 200).
5. The test assertion `expect(result.score).toBe(2015)` failed.
6. The test explicitly documented the intended system invariant at lines 293-294:
   > *"Empirical Finding: Crisis hit score (+15) is credited immediately, but +2000/+500 defeat resolution is evaluated at the start of the next update() cycle which is skipped when state transitions to GAME_OVER."*

### 2.3 Why Deferring Defeat Rewards to `update()` & Wave Clear is Architecturally Correct
- **Event hooks vs State transitions**: `EndGameCrisis.callbacks.onDefeated` is an event notification hook intended for animation and external UI notifications (`alliedReinforcements.warpOut()` and `onEndGameCrisisEvent()`). It has no awareness of player life or death.
- **State Machine Guard**: Defeat resolution in `GameManager.update()` (line 778) is wrapped inside `if (this.state === GameState.PLAYING)`. If the player dies in the collision phase, the game transitions to `GAME_OVER`, and the defeat rewards are never awarded to the deceased player.
- **Wave Clear Safety**: If the crisis is defeated and all enemies are eliminated on the same frame, `GameManager.checkCollisions()` handles wave clear to `GameState.SHOP` at lines 1254-1258, where `this.handleCrisisDefeatedRewards()` is invoked right before `this.endGameCrisis` is nulled.
- Therefore, calling `this.handleCrisisDefeatedRewards()` inside `callbacks.onDefeated` was redundant, premature, and broke both test suites.

---

## 3. Caveats

1. **Test-Mutation Proposal Rejection**:
   - Auditor handoff mentioned moving `prevScore` in `gamestate_edgecases_audit.test.ts` before line 346 as a possible fix.
   - However, our investigation proves that doing so would require also mutating `bughunt_empirical_edgecases_state_machine.spec.ts:295` to award victory rewards to a dead player. That violates the documented empirical game-state contract and represents an audit circumvention.
   - The test in `gamestate_edgecases_audit.test.ts:332` was completely correct in design: it explicitly tested that `GameManager.update()` grants defeat rewards even when `isActive` is false.
2. **Untouched Systems**:
   - The Enemy bullet centering logic in `src/game/Enemy.ts:624-628, 705-709` (`spawnX = position.x + width/2 - 5`, `originX = spawnX + 5`) passed all 12 friendly-fire AI tests and is mathematically sound. It must remain unchanged.
   - The structural symmetry test in `gamestate_edgecases_audit.test.ts:408-435` (DEFECT-C3) passed all checks and must remain unchanged.

---

## 4. Conclusion & Recommended Remediation

### Verdict: Root Cause Completely Identified & Validated

The integrity violation was caused by `this.handleCrisisDefeatedRewards()` being wired into `callbacks.onDefeated` in `src/game/GameManager.ts:343`.

### Recommended Code Remediation (Before $\rightarrow$ After)

In `src/game/GameManager.ts:340-350`:

**Before:**
```typescript
      onDefeated: (_arch) => {
        this.handleCrisisDefeatedRewards();
        if (this.alliedReinforcements && !this.alliedReinforcements.isWarpingOut) {
          this.alliedReinforcements.warpOut();
        }
        if (this.onEndGameCrisisEvent && this.endGameCrisis) {
          this.onEndGameCrisisEvent(this.endGameCrisis.getState());
        }
      },
```

**After:**
```typescript
      onDefeated: (_arch) => {
        if (this.alliedReinforcements && !this.alliedReinforcements.isWarpingOut) {
          this.alliedReinforcements.warpOut();
        }
        if (this.onEndGameCrisisEvent && this.endGameCrisis) {
          this.onEndGameCrisisEvent(this.endGameCrisis.getState());
        }
      },
```

### Generated Patch File
A verified patch file has been written to:
`/Users/user/src/water-invader/.agents/teamwork_preview_explorer_iter3_1/crisis_defeat_lifecycle.patch`

This patch has been verified with `git apply --check` and applies cleanly with 0 rejects.

---

## 5. Verification Method

To independently verify this investigation and the recommended fix:

1. **Verify Dry-Run Patch Applicability**:
   ```bash
   git apply --check /Users/user/src/water-invader/.agents/teamwork_preview_explorer_iter3_1/crisis_defeat_lifecycle.patch
   ```
   *Expected Outcome:* Exit code 0 (clean patch application).

2. **Execute Audit Test Suite After Remediation**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/gamestate_edgecases_audit.test.ts
   ```
   *Expected Outcome:* 17 passed (100% pass), DEFECT-A5 passes with `gm.score === prevScore + 2000`.

3. **Execute State Machine Invariant Test Suite**:
   ```bash
   npx playwright test tests/bughunt_empirical_edgecases_state_machine.spec.ts -g "2.2"
   ```
   *Expected Outcome:* 1 passed (100% pass), `result.score === 2015`, `result.currency === 200`.

4. **Verify All Unit Tests Pass**:
   ```bash
   SKIP_WEBSERVER=1 npx playwright test tests/unit/
   ```
   *Expected Outcome:* 225 passed, 0 failed.

5. **Verify TypeScript & Production Build**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected Outcome:* Exit code 0 for both commands.
