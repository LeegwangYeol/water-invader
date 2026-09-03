# Handoff Report — Milestone 2 Review (E2E Integration & UI/UX Alert Banners)

## 1. Observation
- **Inspected Files**:
  - `src/components/game-canvas.tsx`: Lines 906–941 contain the `data-testid="endgame-crisis-warning-banner"` and `data-testid="endgame-crisis-active-badge"` overlays.
  - `src/game/GameManager.ts`: Lines 318–327 contain the `spawnWave()` trigger logic:
    ```typescript
    if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
      const isPityTrigger = this.level >= 18;
      const isRandomTrigger = Math.random() < 0.30;
      if (isPityTrigger || isRandomTrigger) {
        this.triggerEndGameCrisis();
        return;
      }
    }
    ```
  - `tests/13_endgame_crisis_e2e.spec.ts`: Lines 1–122 define 3 browser E2E tests (`E2E-C1`, `E2E-C2`, `E2E-C3`).
  - `tests/unit/endgame_crisis_m2_integration.test.ts`: Lines 1–294 define 8 unit tests (`M2-1` through `M2-8`).
- **Command Executions & Verbatim Outputs**:
  - `npx tsc --noEmit`: Exited code 0 (0 errors).
  - `npm run build`: Exited code 0 (Compiled successfully in 496ms, 5 static routes generated).
  - `npx playwright test tests/13_endgame_crisis_e2e.spec.ts`:
    ```
    Running 3 tests using 1 worker
      ✓  1 [chromium] › tests/13_endgame_crisis_e2e.spec.ts:13:7 › E2E-C1 (629ms)
      ✓  2 [chromium] › tests/13_endgame_crisis_e2e.spec.ts:28:7 › E2E-C2 (306ms)
      ✓  3 [chromium] › tests/13_endgame_crisis_e2e.spec.ts:67:7 › E2E-C3 (298ms)
      3 passed (3.1s)
    ```
  - `npx playwright test` (Full Suite of 488 tests):
    ```
    5 failed
      [chromium] › tests/adversarial_challenger_m1_2.spec.ts:10:7 › EMP-WAVE-01: Exhaustive Wave Scaling & Boundary Invariants (Waves 1 to 50)
      [chromium] › tests/adversarial_challenger_m1_m2_stress.spec.ts:649:9 › 5.3 Stage 15 & Stage 20 Boss formations scale to 6 and 8 escorts with exponential boss HP
      [chromium] › tests/adversarial_challenger_m3_1.spec.ts:285:9 › 3.1 Full 20-wave formation sweep guarantees min Y >= 80 and Boss Y >= 90
      [chromium] › tests/adversarial_challenger_m3.spec.ts:131:9 › 1.3 High-Wave Boss Progression: Scales maxHp and titles correctly on Waves 5, 10, 15, 20
      [chromium] › tests/adversarial_opt_challenger_1.spec.ts:175:7 › Domain 2.2: Wave 50 Boss Encounter, HP Scaling & HUD Rendering Stability
    483 passed (7.8m)
    ```

## 2. Logic Chain
1. **Observation 1 & 4**: Milestone 2 UI components in `game-canvas.tsx` and M2 E2E tests in `tests/13_endgame_crisis_e2e.spec.ts` execute cleanly and meet all visual and functional criteria.
2. **Observation 2 & 4**: `GameManager.spawnWave()` unconditionally evaluates the random/pity Crisis trigger on any wave where `this.level >= 15`. When a crisis triggers, it clears `this.enemies = []` and returns early.
3. **Observation 4**: In test suites that test milestone Boss scaling on Waves 15, 20, 50 or execute loops from Wave 1 to 50, the early return in `spawnWave()` leaves `this.enemies` empty (`[]`). This breaks tests expecting scheduled Boss encounters on `level % 5 === 0`.
4. **Conclusion Derivation**: The code change is functionally complete for M2 in isolation, but introduced a regression that prevents 100% test pass on the full project test suite.

## 3. Caveats
- No caveats regarding UI or E2E crisis mechanics. The only blocker is the preemption of scheduled Boss waves in `spawnWave()`.

## 4. Conclusion
- **Verdict**: **REQUEST_CHANGES**
- **Actionable Remedy**: In `src/game/GameManager.ts`, update `spawnWave()` to evaluate Crisis incursion only on non-boss waves (`this.level % 5 !== 0`):
  ```typescript
  if (this.level >= 15 && this.level % 5 !== 0 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
  ```
  Then re-run `npx playwright test` to achieve 488/488 tests passing (100%).

## 5. Verification Method
1. Inspect `src/game/GameManager.ts` line 320.
2. Apply the fix: `this.level >= 15 && this.level % 5 !== 0 ...`
3. Run:
   ```bash
   npx tsc --noEmit
   npm run build
   npx playwright test tests/13_endgame_crisis_e2e.spec.ts
   npx playwright test tests/unit/endgame_crisis_m2_integration.test.ts
   npx playwright test tests/adversarial_challenger_m1_2.spec.ts tests/adversarial_challenger_m1_m2_stress.spec.ts tests/adversarial_challenger_m3.spec.ts tests/adversarial_challenger_m3_1.spec.ts tests/adversarial_opt_challenger_1.spec.ts
   ```
4. Invalidation condition: Any of the 5 failed tests continue to fail.
