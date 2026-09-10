# BRIEFING — 2026-09-08T00:58:50+09:00

## Mission
Implement Requirement R1 (Pre-Continue Shop Access) and R4 (Stability & Crash Prevention) in `src/components/game-canvas.tsx` and `src/game/GameManager.ts`.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_continue_shop_1
- Original parent: 38e78144-9abc-48a3-8a83-099f912ed48b
- Milestone: Milestone 1 (Pre-Continue Shop Access & Stability)

## 🔒 Key Constraints
- Exclusive File Ownership: `src/components/game-canvas.tsx` and `src/game/GameManager.ts` ONLY. Do not touch other files.
- DO NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts`.
- Integrity Mandate: Genuine implementation only; no dummy/facade implementations.
- Pre-approved execution: Proceed through implementation and verification as authorized.
- Pre-commit verification: `npx tsc --noEmit` must pass with 0 errors.

## Current Parent
- Conversation ID: 38e78144-9abc-48a3-8a83-099f912ed48b
- Updated: 2026-09-08T00:58:50+09:00

## Task Summary
- **What to build**:
  1. Fix Tank Repair button in `ShopUpgradePanel` by removing `hp <= 0` disabled condition.
  2. Modify Continue flow in `GameOverModal` to pause engine, revive player baseline, and open Shop in continue mode (`isContinueShop = true`).
  3. Add continue mode support in `ShopModal` with dedicated title, subtitle, and "전투 재개 (RESUME WAVE)" action button (`data-testid="resume-wave-button"`).
  4. Ensure clean engine helpers `prepareContinue()` / `continueGame()` in `GameManager.ts` to prevent rAF leaks, double resumes, or wave skips.
- **Success criteria**:
  - `npx tsc --noEmit` passes with 0 errors.
  - Continue -> Shop -> Resume cleanly transitions through states without crashing, losing stats, or skipping waves.
- **Interface contracts**: `/Users/user/src/water-invader/PROJECT.md` & `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1/handoff.md`
- **Code layout**: `src/components/game-canvas.tsx`, `src/game/GameManager.ts`

## Key Decisions Made
- `GameManager.prepareContinue()`: revives player baseline (`player.isDead = false`, `player.hp = Math.max(3, player.hp)`), clears lingering bullets/hazards/helpers/enemies, resets crisis state, cancels any running animation frame, and sets `state = GameState.SHOP`.
- `GameManager.continueGame()`: preserves repaired HP (`player.hp = Math.max(3, player.hp)`), grants 1.5s i-frames, spawns barricades, spawns wave enemies, cancels existing animation frame to prevent leak, and starts loop in `GameState.PLAYING`.
- `ShopUpgradePanel`: removed `|| hp <= 0` from disabled check on line 51.
- `ShopModal`: added `isContinue?: boolean` and `wave?: number` props; renders continue title "ARMORY & WORKSHOP (CONTINUE)" / "정비소 / 무기고 (이어하기)", subtitle, and action button "전투 재개 (RESUME WAVE)" with `data-testid="resume-wave-button"`.
- `GameCanvas`: added `isContinueShop` state, `handleContinueToShop`, and `handleResumeContinuedWave` callbacks with state guards preventing duplicate calls.

## Change Tracker
- **Files modified**:
  - `src/components/game-canvas.tsx`: Tank Repair disabled condition, continue mode in ShopModal and GameOverModal, callbacks.
  - `src/game/GameManager.ts`: `pause()` check extension, `prepareContinue()`, `continueGame()` rAF leak fix, `repairTank()`.
- **Build status**: `npx tsc --noEmit` PASS (0 errors), `npm run build` PASS (0 errors).
- **Pending issues**: None.

## Quality Status
- **Build/test result**:
  - `npx tsc --noEmit`: PASS (code 0)
  - `npm run build`: PASS (code 0)
  - `tests/06_shop_economy_max_upgrades.spec.ts`: 8/8 passed (code 0)
- **Lint status**: 0 violations observed.
- **Tests added/modified**: Verified continue flow transitions from GAME_OVER -> SHOP -> PLAYING cleanly.

## Loaded Skills
- None explicitly requested for M1.

## Artifact Index
- `.agents/teamwork_preview_worker_m1_continue_shop_1/DISPATCH.md` — Assignment & instructions
- `.agents/teamwork_preview_worker_m1_continue_shop_1/BRIEFING.md` — Agent briefing & situational awareness
- `.agents/teamwork_preview_worker_m1_continue_shop_1/progress.md` — Progress tracker & liveness heartbeat
- `.agents/teamwork_preview_worker_m1_continue_shop_1/handoff.md` — Final handoff report
