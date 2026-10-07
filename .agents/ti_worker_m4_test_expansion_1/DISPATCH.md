## 2026-09-23T03:28:31Z
You are the Test Expansion & Verification Worker for Milestone M4 of the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_worker_m4_test_expansion_1
Project root: /Users/user/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely.
- Read /Users/user/src/water-invader/.agents/ti_survey_spec_miner_1/report.md and handoff.md.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

FILES YOU OWN EXCLUSIVELY:
- `tests/01_ui_and_controls.spec.ts` (specifically DPR assertion fix)
- `tests/flagship_factions_live_browser.spec.ts` (new)
- `tests/flagship_crew_deck_shop_ui.spec.ts` (new)

TASKS TO IMPLEMENT:
1. `tests/01_ui_and_controls.spec.ts`:
   - DEF-TST-01: Lines 24-25:
     Update:
     ```ts
     const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
     expect(canvasWidth).toBe(Math.round(600 * dpr));
     expect(canvasHeight).toBe(Math.round(800 * dpr));
     ```
     This prevents false positive test failures on high-DPI/Retina screens while preserving the 600x800 logical coordinate invariant.
2. `tests/flagship_factions_live_browser.spec.ts`:
   - DEF-TST-02: Create automated Playwright E2E browser test verifying:
     - Hadal Bio-Horrors parasite clinger attachment and the 4-wiggle shake-off counterplay in live browser.
     - Automaton Shield Phalanx shield grid linking and inductive backlash stun against deflected projectiles.
     - 4-sided bounds culling preventing off-screen leaks.
3. `tests/flagship_crew_deck_shop_ui.spec.ts`:
   - DEF-TST-02: Create automated Playwright E2E browser test verifying:
     - Bridge Crew Officer promotion in the Shop modal and upgrade persistence.
     - Active bridge abilities (hotkeys Q, E, R, F or 1-4) trigger correctly.
4. Comprehensive Suite Run:
   - Run `npx tsc --noEmit` (must exit 0).
   - Run `npm run build` (must compile with 0 errors).
   - Run `TARGET_URL=http://localhost:3005 npx playwright test tests/01_ui_and_controls.spec.ts tests/flagship_factions_live_browser.spec.ts tests/flagship_crew_deck_shop_ui.spec.ts tests/m1_physics_remediation.spec.ts tests/m2_sec_math_defense.spec.ts tests/m3_arch_lifecycle.spec.ts`.
   - Ensure all tests pass 100%.

OUTPUT:
- Write `changes.md` and `handoff.md` in `/Users/user/src/water-invader/.agents/ti_worker_m4_test_expansion_1/`.
- Send a completion message to parent with verification commands and results.
