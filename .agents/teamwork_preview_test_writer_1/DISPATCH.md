## 2026-09-02T04:48:50Z

<USER_REQUEST>
You are teamwork_preview_test_writer_1.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_test_writer_1
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Spec: /Users/user/src/water-invader/PROJECT.md
Test Infra: /Users/user/src/water-invader/TEST_INFRA.md
Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All test suites must genuinely test functionality. DO NOT create dummy tests that trivially pass without exercising actual code paths.

Write Ownership (Files you own):
- tests/unit/acid_rain_counterplay.test.ts
- tests/unit/pregame_shop_persistence.test.ts
- tests/unit/crisis_variety_expansion.test.ts
- tests/13_qol_and_crisis_mechanics.spec.ts

Tasks to Implement:
1. `tests/unit/acid_rain_counterplay.test.ts`:
   - Headless unit simulation importing `GameManager`, `Player`, `HazardProjectile`.
   - Test that when `player.hasAcidShield = false`, an Acid Rain droplet collision reduces player HP by 1.
   - Test that when `player.hasAcidShield = true`, the droplet is destroyed (`isDead = true`) and player HP remains unchanged.
   - Test purchasing `upgradeAcidShield()` in `GameManager` deducts 150 💧 and activates `hasAcidShield`.

2. `tests/unit/pregame_shop_persistence.test.ts`:
   - Test pre-game shop purchasing before Wave 1: upgrading fire rate, multi-shot, piercing, or acid shield before `startGame()`.
   - Test `gameManager.init(preserveUpgrades = true)` preserves `baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, and remaining pure water.
   - Verify un-preserved reset (`init(false)`) resets back to base stats.

3. `tests/unit/crisis_variety_expansion.test.ts`:
   - Test `SOLAR_FLARE` crisis activation in `GameManager` and hazard projectile / beam lifecycle.
   - Test Phase 1 boss anchor configurations in `EndGameCrisis` for Void Sovereign, Abyssal Leviathan, and Cybernetic Exterminator.

4. `tests/13_qol_and_crisis_mechanics.spec.ts`:
   - E2E Playwright test navigating to `http://localhost:3000`.
   - Verify Main Menu has "ARMORY / SHOP" button.
   - Click "ARMORY / SHOP", verify ShopModal opens with Acid Shield card and upgrades.
   - Buy upgrade (e.g. Acid Shield or Fire Rate), verify pure water deducts.
   - Start game, verify Wave 1 starts and purchased stats are active.
   - Verify canvas rendering loop is running smoothly without console errors.

5. Verification:
   - Run `npx playwright test tests/unit/ tests/13_qol_and_crisis_mechanics.spec.ts`.
   - Maintain `progress.md` with timestamps.
   - Write `handoff.md` and notify orchestrator when done.
</USER_REQUEST>
