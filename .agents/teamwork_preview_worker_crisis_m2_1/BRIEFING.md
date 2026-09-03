# BRIEFING — 2026-09-01T15:48:30+09:00

## Mission
Implement Milestone 2: Crisis Incursion Engine, Combat Mechanics & GameManager Integration for Stellaris-style End-Game Crises in Water Invader.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m2_1
- Original parent: 270670b6-2c75-43bf-aa57-ed25ddd6d8c0
- Milestone: Milestone 2 (Crisis Incursion Engine, Combat Mechanics & GameManager Integration)

## 🔒 Key Constraints
- Genuine implementation with authentic physics and combat mechanics; zero dummy/facade implementations.
- Verification mandates: `npx tsc --noEmit` (0 errors), `npm run build` (success), `npx playwright test tests/unit/` (all passed).
- Must report back to parent agent (`270670b6-2c75-43bf-aa57-ed25ddd6d8c0`) via `send_message`.

## Current Parent
- Conversation ID: 270670b6-2c75-43bf-aa57-ed25ddd6d8c0
- Updated: 2026-09-01T15:48:30+09:00

## Task Summary
- **What to build**: Full integration of EndGameCrisis into `GameManager.ts` (triggering at Stage 15+, incursion state machine, multi-phase combat, bullet collisions, vortex pull physics, wave clear safety, victory rewards) and `game-canvas.tsx` (HUD warning banner, active phase badges).
- **Success criteria**:
  - `GameManager.ts` seamlessly orchestrates `EndGameCrisis` with 3 archetypes (`VOID_SOVEREIGN`, `DIMENSIONAL_DEVOURER`, `CYBERNETIC_EXTERMINATOR`).
  - Stage 15+ 30% random trigger & Stage 18 guaranteed pity trigger.
  - Bullet collision detection routes through rifts and sovereign core with invulnerability logic in Phase 1.
  - Safe transition to `GameState.SHOP` upon sovereign defeat with +2000 score, +500 currency reward.
  - Visuals rendered in `GameManager.draw()` and React HUD overlays rendered in `game-canvas.tsx`.
  - All test suites passing without regression.

## Change Tracker
- **Files modified**:
  - `src/game/crisis/EndGameCrisis.ts`: Added helper accessors (`getRifts()`, `getMainBody()`, `getActiveColliders()`), phase synchronization in `handleBulletCollision`, and default canvas dimensions in `draw()`.
  - `src/game/GameManager.ts`: Added `endGameCrisis` property, `triggerEndGameCrisis`, Stage 15+ spawnWave evaluation, update loop handling, bullet collisions, wave clear guard, defeat bonus, and draw invocation.
  - `src/components/game-canvas.tsx`: Added `endGameCrisisState` state hook, `onEndGameCrisisEvent` callback wiring, incursion warning banner overlay, and active phase badges.
  - `tests/unit/endgame_crisis_m2_integration.test.ts`: Added comprehensive unit test suite covering M2-1 through M2-8.
  - `tests/13_endgame_crisis_e2e.spec.ts`: Added browser E2E test suite covering full incursion, phase transitions, and defeat flow.
- **Build status**: Pass (`npx tsc --noEmit` 0 errors, `npm run build` success, 80/80 unit tests pass, 84/84 regression tests pass, 3/3 E2E tests pass).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: Pass (100% passing across unit, E2E, and regression suites).
- **Lint status**: 0 violations.
- **Tests added/modified**: `tests/unit/endgame_crisis_m2_integration.test.ts` (8 integration unit tests), `tests/13_endgame_crisis_e2e.spec.ts` (3 browser E2E tests).

## Artifact Index
- `report.md` — Detailed technical implementation report for Milestone 2.
- `handoff.md` — 5-component handoff report for forensic auditor and parent agent.
- `progress.md` — Liveness heartbeat and completed task checklist.
