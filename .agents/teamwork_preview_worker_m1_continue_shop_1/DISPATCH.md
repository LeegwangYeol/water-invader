# Task Assignment: Milestone 1 (M1) — Pre-Continue Shop Access Implementation

- Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_continue_shop_1
- Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Scope Document: /Users/user/src/water-invader/PROJECT.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Architectural Specification: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1/handoff.md

## Exclusive File Ownership
- `src/components/game-canvas.tsx`
- `src/game/GameManager.ts`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement Requirement R1 (Pre-Continue Shop Access) and R4 (Stability & Crash Prevention) according to the specification in `/Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1/handoff.md`:
1. In `src/components/game-canvas.tsx`:
   - Fix `ShopUpgradePanel`: remove `hp <= 0` check on line 51 so Tank Repair is enabled when player has currency and `hp < 5`.
   - Update `GameOverModal` continue action: clicking "Continue" (`data-testid="continue-button"`) sets up continue shop state (`isContinueShop = true`, `isShopOpen = true`, revives player baseline to $\ge 3$ HP).
   - In `ShopModal`: support continue mode with dedicated title "정비소 / 무기고 (이어하기)" / "ARMORY & WORKSHOP (CONTINUE)", subtitle "전투 재개 전 무기와 체력을 정비하세요!", and action button "전투 재개 (RESUME WAVE)" with `data-testid="resume-wave-button"`.
   - Clicking "전투 재개" resumes combat cleanly via `continueGame()`, closing the shop, spawning barricades, spawning wave enemies, and starting the game loop with 1.5s i-frames.
2. In `src/game/GameManager.ts`:
   - Provide clean engine methods for continue preparation (`prepareContinue()`) and wave resumption (`continueGame()`).
   - Guard against rAF loop leaks, double resume, and state wipe.
3. Verification:
   - Run `npx tsc --noEmit` and ensure 0 TypeScript errors.
   - Run tests for continue flow or existing suites.
   - Write handoff report with exact changes, verification commands, and pass results to `handoff.md`.

## 2026-09-07T15:52:34Z
You are the Implementation Worker for Milestone 1 (Pre-Continue Shop Access & Stability) on Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_continue_shop_1
Identity & Assignment: Read /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_continue_shop_1/DISPATCH.md
Authoritative specifications:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md
- Full Survey & Spec Report: /Users/user/src/water-invader/.agents/teamwork_preview_spec_miner_survey_continue_1/handoff.md

Exclusive File Ownership:
You own `src/components/game-canvas.tsx` and `src/game/GameManager.ts`. Do not modify other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Fix the Tank Repair button in `ShopUpgradePanel` (`src/components/game-canvas.tsx:51`): remove the `hp <= 0` disabled check so that when the player enters the shop upon death/continue, HP restoration is enabled (as long as `currency >= 75 && hp < 5`).
2. Update the Continue flow in `GameOverModal`:
   - Clicking "Continue" (`data-testid="continue-button"`) pauses the game engine, prepares the player revival baseline (`player.isDead = false`, `player.hp = Math.max(3, player.hp)`), and opens the Shop modal in continue mode (`isContinueShop = true`).
3. Update `ShopModal` in `src/components/game-canvas.tsx`:
   - Add continue mode support: when `isContinueShop` is true, show header "정비소 / 무기고 (이어하기)" / "ARMORY & WORKSHOP (CONTINUE)", subtitle "전투 재개 전 무기와 체력을 정비하세요!" / "Prepare weapons & restore HP before resuming Wave {wave}!".
   - Action button: "전투 재개 (RESUME WAVE)" with `data-testid="resume-wave-button"` (keep `data-testid="next-wave-button"` or dual attributes if helpful).
   - When clicked, cleanly calls `continueGame()` which clears lingering bullets/hazards, spawns fresh barricades, spawns wave enemies, sets 1.5s i-frames, and resumes loop.
4. Update `src/game/GameManager.ts`:
   - Ensure clean helper methods for `prepareContinue()` / `continueGame()` that prevent loop leaks, double-resumes, or wave skips.
5. Verification:
   - Run `npx tsc --noEmit` and ensure 0 errors.
   - Run existing continue tests to check behavior: `npx playwright test tests/continue_vs_restart_on_death.spec.ts`. If the test needs the resume button step for the new continue-shop flow, note it.
6. Write your handoff report to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_m1_continue_shop_1/handoff.md`.
