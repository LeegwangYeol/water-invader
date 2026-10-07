# Handoff Report: Specification & Past Bug Invariant Miner

**Agent ID**: `ti_survey_spec_miner_1`  
**Working Directory**: `/Users/user/src/water-invader/.agents/ti_survey_spec_miner_1`  
**Milestone**: Total Codebase Inspection ("총검사") — Survey & Discovery Phase  
**Timestamp**: 2026-09-23T02:05:40Z  
**Handoff Type**: Hard Handoff (Task Complete)  

---

## 1. Observation

1. **Mandatory Specification & Requirements**:
   - `ORIGINAL_REQUEST.md`: Contains historical timeline spanning 2026-09-02 to 2026-09-23 detailing Acid Rain counterplay, 12 Crisis archetypes, allied reinforcements, homing missiles, continue vs. restart distinction, pre-continue shop access, upward drift lock bug, and the "총검사" (100+ agent inspection) directive.
   - `PROJECT.md:4-8`: Target platform is Next.js 16 (App Router), React 19, HTML5 2D Canvas, Web Audio API, Playwright E2E. Explicitly mandates `logicalWidth = 600`, `logicalHeight = 800`, CSS-only responsive scaling via `aspect-[3/4]`, and zero resource leaks.
   - `COLLABORATION.md:12-16`: Strictly mandates preserving canvas invariants, organic remediation without arbitrary clipping/teleportation, and 100% Playwright test pass rate.

2. **Core Invariant Implementations**:
   - `GameManager.ts:161-162`:
     ```ts
     public readonly logicalWidth: number = 600;
     public readonly logicalHeight: number = 800;
     ```
   - `GameManager.ts:180-182`:
     ```ts
     this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
     this.canvas.width = this.logicalWidth * this.dpr;
     this.canvas.height = this.logicalHeight * this.dpr;
     ```
   - `game-canvas.tsx:1287`:
     ```tsx
     <div className="relative w-full max-w-[600px] aspect-[3/4] rounded-lg overflow-hidden border-2 sm:border-4 border-blue-900 shadow-2xl bg-slate-900">
     ```
   - `game-canvas.tsx:1210`:
     ```ts
     const scaleX = gameManagerRef.current.logicalWidth / (canvas.clientWidth || rect.width);
     ```
   - `GameManager.ts:544-622` (`prepareContinue`): Enters `state = GameState.SHOP`, pauses loop, cancels rAF, sets `player.hp = Math.max(3, player.hp)`, resets crisis/threat state, updates UI.
   - `GameManager.ts:717-724` (`restartFromBeginning`): Invokes `this.init({ resetScoreAndCash: true, preserveUpgrades: false })`, resetting score to 0, currency to starter 150, wave to 1, and clearing all upgrades.

3. **Past Bug Remediations in Codebase**:
   - **Upward Drift Lock Bug** (`HydrothermalVent.ts:234-264`, `Player.ts:100-113`):
     - `capCeiling = this.capY + 30; // 130`
     - Transition zone `[130, 220]` where lift decays to zero (`liftRatio = depthAboveCap / 90`).
     - Lateral dispersion `dispersionSpeed = (isErupting ? 120 : 80) * (1 - liftRatio) * dt` pushes player away from anchor.
     - Outside plume, `isBallastActive && !this.isInUpdraft` restores depth to `baselineY = 740` at `ballastDescentSpeed = 165 px/s`.
   - **Enemy Friendly-Fire AI** (`Enemy.ts:657-740`):
     - `hasAlliedObstacleInShotPath(...)` implements Tier 1 vertical raycast with dynamic lead estimation (`distY / 300`) and corridor buffers (4-12px), plus Tier 2 2D slab intersection. Suppresses firing and triggers lateral slide (`slideDir`, `slideTimer`).
   - **Audio Context Leaks** (`SoundManager.ts:64-69, 91-96, 915-923`):
     - Every sound oscillator attaches `onended` handler calling `osc.disconnect()` and `gainNode.disconnect()`.
     - Master mute flag `this.isMuted` checked on all play methods.
   - **Homing Missile Math Protection** (`Bullet.ts`, `Player.ts:151-180`):
     - Targets dead enemies filtered out; epsilon distance check prevents division by zero.

4. **Test Suite Scope & Counts**:
   - `find tests -type f`: Found 77 Playwright spec files in `tests/*.spec.ts` (632 tests), 29 unit test files in `tests/unit/*.test.ts` (317 tests), and 13 stress/adversarial test files in `tests/stress/*.spec.ts` (114 tests). Total: 1,064 tests across 120 files.
   - Execution command `npx tsc --noEmit` exited with code 0 (0 errors).
   - Execution command `npx playwright test tests/20_flagship_12_features.spec.ts` passed 13/13 tests cleanly in 13.3s.

5. **Legacy Test Inconsistency Observed**:
   - In `tests/01_ui_and_controls.spec.ts:24-25`:
     ```ts
     const canvasWidth = await canvas.evaluate((el: HTMLCanvasElement) => el.width);
     const canvasHeight = await canvas.evaluate((el: HTMLCanvasElement) => el.height);
     expect(canvasWidth).toBe(600);
     expect(canvasHeight).toBe(800);
     ```
     This assertion expects `canvas.width === 600`, which only holds if `devicePixelRatio === 1`. On Retina / High-DPI screens or environments where DPR > 1, `canvas.width = 600 * DPR = 1200`, causing an assertion failure unless updated to `Math.round(600 * dpr)` (as done in `stream_f_responsive_viewports_verification.spec.ts`).

---

## 2. Logic Chain

1. **From Observation 1 & 2**: The core engine contract is defined around a fixed 600×800 logical grid, and responsive display is achieved strictly via CSS container sizing (`aspect-[3/4]`, `max-w-[600px]`). Any attempt by agents in subsequent milestones to modify `logicalWidth` or `logicalHeight` will break the 120-file test harness.
2. **From Observation 2**: Touch coordinates are scaled using `logicalWidth / clientWidth`. If an agent mistakenly references `canvas.width`, Retina devices will immediately experience touch clipping and edge pinning (Bug 5).
3. **From Observation 3**: The upward drift lock bug and enemy friendly fire AI were solved with sophisticated geometric models (plume dissipation caps, lateral dispersion, ballast restoration, 2D slab raycasts). These models must be protected against regressions when new hazards or enemies are introduced.
4. **From Observation 4 & 5**: While headless unit tests (`flagship_features.test.ts`, `adversarial_stream_d_factions_combat.spec.ts`) cover the mathematical rules of the 12 Flagship features, live browser Playwright E2E coverage is sparse for:
   - Hadal Bio-Horrors (specifically 4-wiggle clinger shake-off counterplay in live browser).
   - Automaton Shield Phalanx (specifically hexagonal shield grid linking and inductive backlash stun in live browser).
   - Bridge Crew Officer Deck (specifically promotion in the Shop modal and active bridge ability keybinds).
   - Continuous Collision Detection (CCD) for ultra-fast torpedoes (580 px/s) and harpoon catapult releases (720 px/s).
   - Complete component unmount and Web AudioContext teardown.

---

## 3. Caveats

- **Device Pixel Ratio in CI**: Playwright default configuration runs in headless mode with DPR=1 on standard Linux CI, masking the legacy hardcoded `expect(canvasWidth).toBe(600)` bug in `01_ui_and_controls.spec.ts`. On physical macOS Retina hosts or mobile emulation targets, DPR is 2 or 3.
- **Benchmark Exclusion**: Tests under `tests/benchmark/` are explicitly excluded from the standard test run via `testIgnore: ['**/benchmark/**']` in `playwright.config.ts`. They should remain separate telemetry benchmarks rather than blocking CI tests.

---

## 4. Conclusion

1. **Invariants are Sound & Documented**: All 8 hard architectural invariants (`logicalWidth=600`, `logicalHeight=800`, CSS-only scaling, aspect ratio 3/4, shop pre-continue flow, wave restart vs. continue, pre-game shop access, coordinate bounds) are verified in code and documented in `/Users/user/src/water-invader/.agents/ti_survey_spec_miner_1/report.md`.
2. **Historical Bug Taxonomy is Forensic**: Root causes and implementations for the 10 major historical bugs (including vent drift lock, friendly fire, mobile clipping, continue state loss, and touch pegging) are cataloged.
3. **5 Targeted Test Suites Blueprinted**: To achieve 100% zero-defect regression immunity during "총검사", 5 specific automated Playwright suites must be added in Milestone M4:
   - `flagship_factions_live_browser.spec.ts` (Bio-Horrors wiggle shake-off, Automaton shield backlash).
   - `flagship_crew_deck_shop_ui.spec.ts` (Bridge Crew promotion in Shop and active bridge ability hotkeys).
   - `ccd_and_extreme_kinematics.spec.ts` (Anti-tunneling for 580 px/s torpedo and 720 px/s slingshot).
   - `flagship_sensory_spectrogram.spec.ts` (Real-time waterfall FFT buffer and hull stress glass fractures).
   - `lifecycle_unmount_teardown.spec.ts` (Clean AudioContext closure, rAF cancellation, listener removal).
4. **DPR Test Fix Required**: `tests/01_ui_and_controls.spec.ts` should be updated to assert `Math.round(600 * dpr)` rather than hardcoded 600 to prevent false-positive failures on Retina environments.

---

## 5. Verification Method

To independently verify all findings and test suite health:

1. **Verify Static Types**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected outcome*: Exit code 0, 0 errors.

2. **Verify Flagship Master Spec**:
   ```bash
   npx playwright test tests/20_flagship_12_features.spec.ts
   ```
   *Expected outcome*: 13 passed in ~13 seconds.

3. **Verify Buoyancy & Upward Drift Fix**:
   ```bash
   npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts
   ```
   *Expected outcome*: 5 passed.

4. **Verify Friendly Fire AI**:
   ```bash
   npx playwright test tests/unit/friendly_fire_ai.test.ts
   ```
   *Expected outcome*: 12 passed.

5. **Verify Continue vs Restart Invariant**:
   ```bash
   npx playwright test tests/continue_vs_restart_on_death.spec.ts
   ```
   *Expected outcome*: 14 passed.

6. **Inspect Generated Report**:
   ```bash
   cat /Users/user/src/water-invader/.agents/ti_survey_spec_miner_1/report.md
   ```
   *Invalidation Condition*: If any feature in `report.md` modifies `logicalWidth` or `logicalHeight`, the report is invalid.
