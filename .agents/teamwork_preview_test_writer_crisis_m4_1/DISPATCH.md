## 2026-09-01T07:25:38Z
You are a teamwork_preview_test_writer implementing Milestone 4 (E2E Test Track & Mathematical Survivability Verification) for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_test_writer_crisis_m4_1

Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/TEST_INFRA.md
- /Users/user/src/water-invader/src/game/GameManager.ts
- /Users/user/src/water-invader/src/game/crisis/

Your write ownership:
- `tests/13_endgame_crisis_stage15.spec.ts` (NEW)
- `tests/unit/endgame_crisis_simulation.test.ts` (NEW)
- `TEST_READY.md` (NEW at project root)

Mission:
1. Create `tests/13_endgame_crisis_stage15.spec.ts`:
   - Mock reaching Stage 15 (`gm.level = 15; gm.state = 'PLAYING'; gm.spawnWave();`).
   - Verify that the Crisis can randomly trigger during or after Stage 15 (or via `gm.triggerEndGameCrisis()`) without crashing the game.
   - Verify incursion warning banner DOM visibility, active HUD badges, continuous combat updates, entity bounding, and zero uncaught console errors.
   - Verify full progression lifecycle: defeating the Crisis transitions cleanly to `GameState.SHOP`.
2. Create `tests/unit/endgame_crisis_simulation.test.ts`:
   - Formally assert the mathematical bounds of player DPS:
     - Minimum focused sustained single-target DPS >= 50.0 DPS.
     - Maximum focused sustained single-target DPS <= 160.0 DPS (S = 100).
     - Standard Stage 15 Boss (675 HP) TTK <= 10.0 seconds (proving vulnerability).
   - Discrete 60 FPS combat simulation loop (`dt = 1/60s`) matching max-upgraded player (T_fire = 0.1s, multi-shot 5, piercing 5, 3 drones) against the End-Game Crisis (5,200 EHP across 3 phases).
   - Explicit Hard Assertion: `expect(elapsedTime).toBeGreaterThanOrEqual(15.0)` (mathematically proving it survives for >= 15.0 seconds against uninhibited max-level player DPS).
3. Create `TEST_READY.md` at `/Users/user/src/water-invader/TEST_READY.md` summarizing the 5-tier test suite results and coverage.
4. Run `npx playwright test tests/13_endgame_crisis_stage15.spec.ts` and `npx playwright test tests/unit/endgame_crisis_simulation.test.ts`.
5. Run full test suite `npx playwright test` (all tests passing).
6. Write your report to `/Users/user/src/water-invader/.agents/teamwork_preview_test_writer_crisis_m4_1/report.md` and create `handoff.md`.
7. Send a message to the caller when complete.
