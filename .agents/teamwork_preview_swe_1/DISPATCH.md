# DISPATCH

## 2026-08-24T07:39:37Z
You are the SWE Light Orchestrator for the Water Invader Shop Fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_swe_1
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Workspace Root: C:\src\SpaceInvader

# Mission & Objectives
Fix the Wave Intermission Shop transition and restore the Game Over shop per ORIGINAL_REQUEST.md:
1. Fix Wave Intermission Transition: Rewrite wave transition in `src/game/GameManager.ts`. When a wave is cleared (`this.enemies.length === 0`), the game must pause and transition to `GameState.SHOP` instead of automatically spawning the next wave. Ensure `init()` properly starts the game with `spawnWave()` instead of jumping to the shop.
2. Restore Game Over Shop: Players should also be able to purchase upgrades using their remaining Pure Water when they die. Restore the shop UI inside the `GameState.GAME_OVER` overlay in `src/components/game-canvas.tsx`, while keeping it in the `GameState.SHOP` overlay.
3. Verify Purchasing Logic: Ensure that purchasing upgrades (Fire Rate, Multi-Shot, Piercing) properly deducts currency and applies the upgrades to the player's weapon both during the Intermission Shop and the Game Over Shop.
4. Verify all acceptance criteria and run tests / build check (`npm run build` or `npx tsc --noEmit`).

Maintain your `plan.md` and `progress.md` in your working directory. Report completion with a detailed handoff when done.
