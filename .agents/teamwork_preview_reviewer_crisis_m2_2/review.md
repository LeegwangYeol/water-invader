# Milestone 2 Quality & Adversarial Review Report
**Project**: Water Invader — Stellaris-Style End-Game Crisis (Milestone 2)  
**Reviewer**: `teamwork_preview_reviewer_crisis_m2_2`  
**Date**: 2026-09-01  

---

## Review Summary

**Verdict**: **REQUEST_CHANGES**

---

## Executive Summary
Milestone 2 introduced the Incursion Warning Banner, HUD Active Badges, and GameManager crisis loop integration.
The UI components in `src/components/game-canvas.tsx` (`data-testid="endgame-crisis-warning-banner"` and `data-testid="endgame-crisis-active-badge"`) and the dedicated E2E test suite `tests/13_endgame_crisis_e2e.spec.ts` (3/3 passing) are well-crafted, visually distinct, and properly synchronized via `onEndGameCrisisEvent`. `npm run build` and `npx tsc --noEmit` succeed cleanly.

However, running the comprehensive project test suite (488 tests total) uncovered **5 regression failures** across 5 existing test suites. The root cause is that `GameManager.spawnWave()` unconditionally evaluates the random/pity Crisis incursion before checking for milestone Boss waves (`this.level % 5 === 0`). When a crisis triggers on Wave 15, 20, 50 (or Wave 18 during sweep tests), `this.enemies` is emptied (`[]`) and `spawnWave()` returns early, causing tests that verify scheduled Boss encounters to fail or crash with `TypeError: Cannot read properties of undefined (reading 'hp')`.

---

## Findings

### [Major] Finding 1: `spawnWave()` Crisis Evaluation Preempts Scheduled Boss Waves (5 Test Failures)

- **What**: When `this.level >= 15`, `GameManager.spawnWave()` triggers `triggerEndGameCrisis()`, resets `this.enemies = []`, and returns immediately. This prevents the normal `this.level % 5 === 0` Boss wave generation from running on Waves 15, 20, 50, and also intercepts Wave 18 in full 1..50 wave progression loops.
- **Where**: `src/game/GameManager.ts`, lines 318–327:
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
      // Boss wave ...
  ```
- **Why**: 
  1. Milestone Boss waves (`level % 5 === 0`) are core structural gameplay anchors (Wave 5, 10, 15, 20, etc.) with specific boss escorts and HP formulas.
  2. The Crisis incursion was designed to be an emergency existential threat on Stage 15+ waves, but replacing scheduled Boss encounters violates Boss scaling invariants and breaks 5 test suites.
- **Impacted Tests**:
  1. `tests/adversarial_challenger_m1_2.spec.ts:10:7` (`EMP-WAVE-01: Exhaustive Wave Scaling & Boundary Invariants (Waves 1 to 50)`)
  2. `tests/adversarial_challenger_m1_m2_stress.spec.ts:649:9` (`5.3 Stage 15 & Stage 20 Boss formations scale to 6 and 8 escorts with exponential boss HP`)
  3. `tests/adversarial_challenger_m3_1.spec.ts:285:9` (`3.1 Full 20-wave formation sweep guarantees min Y >= 80 and Boss Y >= 90`)
  4. `tests/adversarial_challenger_m3.spec.ts:131:9` (`1.3 High-Wave Boss Progression: Scales maxHp and titles correctly on Waves 5, 10, 15, 20`)
  5. `tests/adversarial_opt_challenger_1.spec.ts:175:7` (`Domain 2.2: Wave 50 Boss Encounter, HP Scaling & HUD Rendering Stability`)
- **Suggestion**:
  Restrict Crisis incursion evaluation in `spawnWave()` to non-boss waves (`this.level % 5 !== 0`), e.g.:
  ```typescript
  private spawnWave() {
    // Stage 15+ End-Game Crisis Trigger Evaluation (on non-boss waves)
    if (this.level >= 15 && this.level % 5 !== 0 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
      const isPityTrigger = this.level >= 18;
      const isRandomTrigger = Math.random() < 0.30;
      if (isPityTrigger || isRandomTrigger) {
        this.triggerEndGameCrisis();
        return;
      }
    }
  ```
  This guarantees that scheduled Boss encounters (Waves 15, 20, 25, 50...) spawn normally, while Crisis incursions dynamically strike on intervening waves (e.g. Waves 16, 17, 18, 19, 21, 22...).

---

## Quality & Integrity Assessment

### 1. Integrity Check
- **Façades or Dummy Implementations**: None. The Crisis entity subclasses (`CrisisSovereign.ts`, `DimensionalRift.ts`, `SingularityCore.ts`) use authentic physics (gravitational attraction vectors, inverse-square math, delta-time damping), real canvas drawing routines, and Web Audio API synthesis.
- **Hardcoded Cheats**: None. Test assertions verify runtime states directly without hardcoded mocks in source.

### 2. UI & UX Review (`src/components/game-canvas.tsx`)
- **Warning Banner** (`data-testid="endgame-crisis-warning-banner"`):
  - Renders properly during `CrisisPhase.INCURSION` or when `warningTimer > 0`.
  - Display text: `STELLARIS-STYLE END-GAME CRISIS INCURSION`, archetype name, and remaining warp countdown formatted to 1 decimal place.
  - Backdrop blur, pulse animation, and purple styling fit the cataclysm theme well.
- **Active Phase Badge** (`data-testid="endgame-crisis-active-badge"`):
  - Renders in `GameState.PLAYING` when Crisis is active and not defeated.
  - Correctly displays Phase 1 (Dimensional Shield Active), Phase 2 (Sovereign Hull Exposed), and Phase 3 (Core Overdrive with enrage seconds).

### 3. Build & Test Verification Results

| Test Category | Command | Result |
|---|---|---|
| TypeScript Typecheck | `npx tsc --noEmit` | **PASS** (0 errors) |
| Production Build | `npm run build` | **PASS** (5 static routes compiled) |
| Milestone 2 Unit Tests | `npx playwright test tests/unit/endgame_crisis_m2_integration.test.ts` | **PASS** (8/8 tests) |
| Milestone 2 E2E Tests | `npx playwright test tests/13_endgame_crisis_e2e.spec.ts` | **PASS** (3/3 tests) |
| Complete Test Suite | `npx playwright test` | **FAIL** (483 passed, 5 failed out of 488 tests) |

---

## Required Action for Implementation Worker
1. Update `src/game/GameManager.ts` in `spawnWave()` to add `this.level % 5 !== 0` to the Stage 15+ Crisis trigger condition.
2. Re-run `tests/unit/endgame_crisis_m2_integration.test.ts` and `tests/13_endgame_crisis_e2e.spec.ts` to ensure M2 tests pass.
3. Run the full test suite (`npx playwright test`) to verify all 488 tests pass with 0 failures.
