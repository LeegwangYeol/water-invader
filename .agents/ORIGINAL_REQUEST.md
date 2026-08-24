# Original User Request

## Initial Request — 2026-08-21T17:54:07+09:00

You are the Project Orchestrator for the Water Invader QA Sweep and Auto-fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_orchestrator_qa_1
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Workspace Root: C:\src\SpaceInvader

# Mission & Objectives
Conduct a comprehensive QA sweep of the Water Invader game to identify any remaining UX issues, bugs, or gameplay flaws (e.g., UI scaling, weird enemy behaviors, missing feedback). Compile a prioritized list of these issues in a markdown report, and automatically implement fixes for critical and high-priority items in the codebase.

# Requirements & Acceptance Criteria
1. Inspect the game statically (code review) and dynamically (automated or manual testing / Playwright / DevTools) to find edge cases, UX annoyances, graphical glitches, or balancing oversights.
2. Produce a detailed markdown report detailing all found issues with code references / screenshots / reproduction details.
3. Implement code fixes for all critical and high-priority items.
4. Ensure `npm run build` / typecheck succeeds and validate that identified issues no longer reproduce.
5. Report completion when all work and verification are finished.

Maintain your `plan.md` and `progress.md` in your working directory.

## Follow-up — 2026-08-21T11:34:12Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Endless survival stress test with weapon/skill usage
> Requested team: Very large team of agents

Deploy a massive swarm of automated Playwright test bots to play Water Invader endlessly. The bots must prioritize survival (evasion) to reach deep late-game waves, while actively utilizing all available skills (Ultimate, Ally) and shop upgrades to stress-test full game mechanics.

Working directory: ~/teamwork_projects/water_invader_survival_stress_test
Integrity mode: development

## Requirements

### R1. Deep Survival & Combat Heuristics
The automated test scripts must prioritize dodging to maximize survival time. However, they must also actively engage in combat by continuously firing, using the Ultimate (E) when at 100%, and deploying the Ally (Q) when currency allows, ensuring these mechanics are tested under extreme late-game conditions.

### R2. Shop Upgrade Stress Testing
The bots must automatically spend accumulated currency (Pure Water) on shop upgrades (Fire Rate, Multi-Shot, Piercing) during gameplay to test the stability of maxed-out weapons (e.g., 5-spread Multi-Shot) in deep waves.

### R3. Massive Concurrency & Endurance
A very large team of agents must execute these bots concurrently. They must monitor for memory leaks, frame drops, Web Audio node limits, and anomalous enemy behaviors at high speeds and heavy projectile counts.

## Acceptance Criteria

### Verification
- [ ] Bots successfully execute extreme survival gameplay while actively casting Ultimates and summoning Allies.
- [ ] Bots successfully purchase and fully upgrade shop items during the run.
- [ ] A final Markdown report is generated detailing any new bugs (e.g., memory leaks, projectile limit crashes, skill cooldown bugs) discovered during the runs.
## Follow-up — 2026-08-24T16:38:54+09:00

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Fix the Wave Intermission Shop transition and restore the Game Over shop
> Requested team: Small, focused team

The recent shop refactoring introduced bugs in `GameManager.ts` and `game-canvas.tsx`. The shop currently incorrectly appears at the start of the game, does not trigger between waves as intended, and was removed from the GAME_OVER screen, preventing players from purchasing upgrades. The team must cleanly implement the in-game intermission shop and restore the rogue-lite upgrade mechanics.

Working directory: ~/teamwork_projects/water_invader_shop_fix
Integrity mode: development

## Requirements

### R1. Fix Wave Intermission Transition
Rewrite the wave transition logic in `src/game/GameManager.ts`. When a wave is cleared (`this.enemies.length === 0`), the game must pause and transition to `GameState.SHOP` instead of automatically spawning the next wave. Ensure `init()` properly starts the game with `spawnWave()` instead of jumping to the shop.

### R2. Restore Game Over Shop
Players should also be able to purchase upgrades using their remaining Pure Water when they die. Restore the shop UI inside the `GameState.GAME_OVER` overlay in `src/components/game-canvas.tsx`, while keeping it in the `GameState.SHOP` overlay.

### R3. Verify Purchasing Logic
Ensure that purchasing upgrades (Fire Rate, Multi-Shot, Piercing) properly deducts currency and applies the upgrades to the player's weapon both during the Intermission Shop and the Game Over Shop.

## Acceptance Criteria

### Verification
- [ ] Automated or manual verification confirms the game starts normally on Wave 1 (not in the shop).
- [ ] Clearing all enemies in a wave properly transitions the game to the `SHOP` state.
- [ ] Dying transitions the game to `GAME_OVER` where the shop is fully accessible.
- [ ] Purchasing an upgrade correctly reduces currency and updates player stats.
