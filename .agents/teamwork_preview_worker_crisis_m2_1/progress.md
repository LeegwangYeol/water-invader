# Progress — Milestone 2: Crisis Incursion Engine, Combat Mechanics & GameManager Integration

Last visited: 2026-09-01T15:48:30+09:00

## Completed Tasks
- [x] Read `DISPATCH.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, `EndGameCrisis.ts`, `CrisisSovereign.ts`, `DimensionalRift.ts`, `GameManager.ts`, `game-canvas.tsx`.
- [x] Enhanced `EndGameCrisis.ts` with helper accessors (`getRifts()`, `getMainBody()`, `getActiveColliders()`) and default canvas dimensions for `draw()`.
- [x] Integrated End-Game Crisis into `GameManager.ts`:
  - Added properties: `public endGameCrisis: EndGameCrisis | null = null`, `public hasEndGameCrisisOccurred: boolean = false`, `public endGameCrisisDefeatedHandled: boolean = false`, `public onEndGameCrisisEvent?: (crisis: EndGameCrisisState | null) => void`.
  - Implemented `public triggerEndGameCrisis(archetype?: CrisisArchetype): EndGameCrisis`.
  - Integrated Stage 15+ 30% random trigger & Stage 18 guaranteed pity trigger in `spawnWave()`.
  - Integrated crisis update, vortex gravity on player/bullets, player contact damage, and defeat bonus (+2000 score, +500 currency, combo bonus, victory sfx) in `update(deltaTime)`.
  - Added wave clear safety guard preventing transition to `GameState.SHOP` while crisis is active, and transitioning to `SHOP` on defeat.
  - Added bullet collision check against rifts and sovereign in `checkCollisions()` (with invulnerability handling).
  - Added crisis vector rendering and multi-segment boss bar in `draw()`.
  - Added state reset logic in `init()` and `startNextWave()`.
- [x] Integrated HUD overlay and active phase badges into `src/components/game-canvas.tsx`:
  - Added `endGameCrisisState` state hook and `game.onEndGameCrisisEvent` event listener.
  - Added incursion warning banner overlay (`[data-testid="endgame-crisis-warning-banner"]`).
  - Added active crisis HUD badge (`[data-testid="endgame-crisis-active-badge"]`).
- [x] Added comprehensive unit tests in `tests/unit/endgame_crisis_m2_integration.test.ts` covering all M2 requirements.
- [x] Added browser E2E tests in `tests/13_endgame_crisis_e2e.spec.ts`.
- [x] Verified `npx tsc --noEmit` (0 errors).
- [x] Verified `npm run build` (success).
- [x] Verified `npx playwright test tests/unit/` (80/80 passed).
- [x] Verified `npx playwright test tests/13_endgame_crisis_e2e.spec.ts` (3/3 passed).
- [x] Verified full regression suite (84/84 passed).
- [x] Generated `report.md` and `handoff.md`.
