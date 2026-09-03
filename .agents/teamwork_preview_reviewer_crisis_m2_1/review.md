# Review Report: Milestone 2 (Crisis Incursion Engine, Combat Mechanics & GameManager Integration)

## Review Summary

**Verdict**: REQUEST_CHANGES

The core architecture, 3-phase multi-entity hierarchy, reality-warping physics, collision routing, anti-soft-lock wave progression, HUD banners, and Web Audio synthesis for the Stellaris-Style End-Game Crisis are excellently designed and cleanly integrated. TypeScript typechecking (`npx tsc --noEmit`) and production builds (`npm run build`) pass with 0 errors, and the dedicated integration suite (`tests/unit/endgame_crisis_m2_integration.test.ts`) passes 8/8 tests.

However, during a full 488-test regression pass across the entire Playwright suite, **5 existing regression tests failed**. The root cause is that `GameManager.spawnWave()` evaluates the Stage 15+ Crisis incursion check *before* boss wave evaluation (`this.level % 5 === 0`) and triggers on Boss stages (e.g. Wave 15, 20, 50), preventing regular Bosses and their escort legions from spawning and causing 5 existing test suites to fail.

---

## Findings

### [Major] Finding 1: Stage 15+ Crisis Trigger Overwrites Boss Waves on Multiples of 5 (5 Regression Failures)

- **What**: When `GameManager.spawnWave()` runs at `this.level >= 15`, it evaluates the 30% random roll and Stage 18 pity trigger *before* the Boss wave branch (`this.level % 5 === 0`). When the Crisis triggers on Wave 15, 20, or 50, it clears `this.enemies = []` and returns early. This prevents standard Bosses and their escort formations from spawning on multiples of 5, breaking 5 existing regression test suites.
- **Where**: `/Users/user/src/water-invader/src/game/GameManager.ts` (lines 318–328):
  ```typescript
  private spawnWave() {
    // Stage 15+ End-Game Crisis Trigger Evaluation
    if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
      const isPityTrigger = this.level >= 18;
      const isRandomTrigger = Math.random() < 0.30;
      if (isPityTrigger || isRandomTrigger) {
        this.triggerEndGameCrisis();
        return;
      }
    }

    if (this.level % 5 === 0) {
      // Boss wave
      ...
  ```
- **Why**:
  1. `tests/adversarial_challenger_m1_m2_stress.spec.ts:649:9` (`5.3 Stage 15 & Stage 20 Boss formations scale to 6 and 8 escorts with exponential boss HP`): Expects Stage 20 to spawn 1 Boss + 8 Escorts. Since $20 \ge 18$, `isPityTrigger` fired 100% of the time, spawning the Crisis with 0 standard enemies and failing with `expect(received).toBe(8)` where received was `-1`.
  2. `tests/adversarial_challenger_m3.spec.ts:131:9` (`1.3 High-Wave Boss Progression: Scales maxHp and titles correctly on Waves 5, 10, 15, 20`): Fails with `TypeError: Cannot read properties of undefined (reading 'hp')` because no Boss enemy exists in `gm.enemies` on Wave 15/20.
  3. `tests/adversarial_opt_challenger_1.spec.ts:175:7` (`Domain 2.2: Wave 50 Boss Encounter, HP Scaling & HUD Rendering Stability`): Fails with `Error: Boss was not spawned at Wave 50`.
  4. `tests/adversarial_challenger_m3_1.spec.ts:285:9` (`3.1 Full 20-wave formation sweep guarantees min Y >= 80 and Boss Y >= 90`): Expects at least 1 enemy on Wave 15/20; received 0.
  5. `tests/adversarial_challenger_m1_2.spec.ts:10:7` (`EMP-WAVE-01: Exhaustive Wave Scaling & Boundary Invariants (Waves 1 to 50)`): Expects regular wave grid on non-boss waves; received 0 enemies on the wave where Crisis triggered.
- **Suggestion**:
  Restrict the automatic incursion trigger in `spawnWave()` to **non-boss waves** (or check `this.level % 5 !== 0`):
  ```typescript
  private spawnWave() {
    // Boss wave takes precedence on multiples of 5 (e.g. Wave 15, 20, 25, 50)
    if (this.level % 5 === 0) {
      // Standard Boss wave logic ...
      return;
    }

    // Stage 15+ End-Game Crisis Trigger Evaluation on non-boss waves (e.g. Wave 16, 17, 18, 19, 21...)
    if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
      const isPityTrigger = this.level >= 18;
      const isRandomTrigger = Math.random() < 0.30;
      if (isPityTrigger || isRandomTrigger) {
        this.triggerEndGameCrisis();
        return;
      }
    }
    
    // Standard grid wave logic ...
  }
  ```
  *(Alternatively, ensure `triggerEndGameCrisis` can be called independently and does not overwrite boss waves when `level % 5 === 0`).*

---

## Verified Claims

| Claim from Worker Handoff | Verification Method | Status | Details |
|---|---|---|---|
| `npx tsc --noEmit` exits with 0 errors | Terminal command | **PASS** | Exited with code 0 (0 errors) |
| `npm run build` compiles successfully | Terminal command | **PASS** | Compiled in 235ms, 5 static routes generated |
| `tests/unit/endgame_crisis_m2_integration.test.ts` passes | `npx playwright test tests/unit/endgame_crisis_m2_integration.test.ts` | **PASS** | 8/8 tests passing (100%) |
| `tests/13_endgame_crisis_e2e.spec.ts` passes | `npx playwright test tests/13_endgame_crisis_e2e.spec.ts` | **PASS** | 3/3 browser E2E tests passing (100%) |
| Full test suite regression passes (440+ tests) | `npx playwright test` (all 47 test files) | **FAIL** | 483 passed, **5 failed** due to Boss wave overwrite in `spawnWave()` |

---

## Adversarial Stress-Test Results

| Stress Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **Phase 1 Invulnerability**: 500-damage bullet hits Sovereign body while Rifts are active | Sovereign absorbs 0 damage, hull remains 2,500 HP | Bullet deflected, 0 damage dealt, hull intact at 2,500 HP | **PASS** |
| **Gravitational Singularity**: Player and player bullets near active Rift | Player pulled gently and bullet paths bent towards rift singularity | `dx / dist` pull force applied smoothly without NaN | **PASS** |
| **Phase Progression 1 -> 2 -> 3 -> Defeated**: Sequential destruction of Rifts (1,200 EHP), Hull (2,500 HP), and Core (1,500 HP) | Phase transitions trigger synchronously, HUD badges update, victory rewards granted | 3 distinct phases execute, badges update, +2000 score & +500 currency awarded | **PASS** |
| **Anti-Soft-Lock Wave Completion**: Standard enemies = 0 during active Crisis | Game remains in `GameState.PLAYING` until Crisis Core is eliminated | `isEndGameCrisisEngaged` blocks `GameState.SHOP` until `isDefeated()` is true | **PASS** |
| **Post-Defeat Shop Transition**: Defeating Core with 0 hostiles remaining | State transitions to `GameState.SHOP`, resets crisis state cleanly | SHOP modal displays, clicking NEXT WAVE increments level and spawns next wave | **PASS** |
| **Boss Wave Escalation (Stage 15, 20, 50)** | Waves on multiples of 5 spawn Boss + Escort formations | Overwritten by Crisis incursion when `level >= 18` or 30% roll occurs | **FAIL** |

---

## Required Action Items for Worker (to achieve APPROVAL)

1. Modify `GameManager.spawnWave()` so that Boss waves (`this.level % 5 === 0`) are evaluated and spawned before the Crisis incursion roll, or ensure Crisis incursion evaluates only on non-boss waves (`this.level % 5 !== 0 && this.level >= 15`).
2. Run the full regression test suite: `npx playwright test`.
3. Confirm that all 488 tests across all 47 test files pass 100%.
