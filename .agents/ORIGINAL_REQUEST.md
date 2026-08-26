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

## 2026-08-25T04:33:38Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Comprehensive QA testing, bug hunting, and fixing
> Requested team: Full team

Conduct a comprehensive QA sweep and stress test of the Water Invader game by actively playing it. The team must identify, document, and fix any anomalous enemy movements, shop purchasing glitches, or general gameplay bugs.

Working directory: ~/teamwork_projects/water_invader_comprehensive_qa
Integrity mode: development

## Requirements

### R1. Deep Gameplay QA & Bug Hunting
Deploy automated test bots (via Playwright) or use Chrome DevTools to actively play the game through multiple waves. Specifically monitor for:
- **Anomalous Enemy Movements:** Enemies getting stuck, moving erratically out of bounds, or ignoring physics/barricades.
- **Shop & Economy Glitches:** Upgrades not applying correctly, currency (Pure Water) deducting incorrectly, or buttons failing to click during the Intermission or Game Over screens.
- **General Gameplay Bugs:** Memory leaks, collision detection failures, or skill/ultimate activation bugs.

### R2. Bug Resolution & Patching
Compile a precise list of any identified bugs from the QA phase. Automatically apply code fixes in `src/game/` or `src/components/` to resolve these issues.

## Acceptance Criteria

### Verification
- [ ] Automated bots successfully play multiple runs of the game, actively purchasing items in the shop and encountering various enemy types.
- [ ] A generated Markdown report details all found issues (e.g., weird movements, shop bugs) and exactly how they were reproduced.
- [ ] Code patches are successfully implemented to fix all identified bugs.
- [ ] A final verification test run confirms that the previously identified bugs no longer occur, and `npm run build` passes.

## 2026-08-25T11:44:08Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Fix enemy Y-axis boundary and dive movement bugs
> Requested team: Small, focused team

The current enemy movement logic allows certain enemies to descend too deeply on the Y-axis, or their diving mechanics break the game (e.g., clipping, crashing, or ignoring bounds). The team must fix these boundary and trajectory logic errors.

Working directory: ~/teamwork_projects/water_invader_enemy_movement_fix
Integrity mode: development

## Requirements

### R1. Implement Strict Y-Axis Boundaries
Analyze the enemy movement logic in `src/game/Enemy.ts` and `src/game/GameManager.ts`. Ensure that standard downward or zigzag movements are strictly clamped to a maximum Y-axis value so enemies do not overlap the player UI or exit the playable area abnormally.

### R2. Fix Dive Mechanic Edge Cases
Investigate enemies with diving or plunging attacks (e.g., Diver type). Ensure their trajectory calculations are safe and that colliding with the bottom bounds, player, or barricades gracefully removes them or handles the collision without breaking the game state (e.g., no NaN values or endless loops).

## Acceptance Criteria

### Verification
- [ ] Code inspection confirms strict `Math.min()` clamping or boundary checks for enemy Y coordinates.
- [ ] Automated Playwright tests or test bots specifically trigger dive attacks and verify the game state remains stable and does not crash.
- [ ] Enemies that reach the bottom boundary are handled correctly (e.g., despawned, hit player, or destroyed by barricades).

## 2026-08-26T00:42:13Z

# Teamwork Project Prompt ? Draft

> Status: Launched
> Goal: Fix and improve mobile left-right movement controls
> Requested team: Small, focused team

The mobile touch controls for moving the player left and right are currently very finicky and difficult to use. The team must refine the touch/drag sensitivity and responsiveness to make mobile evasion smooth and intuitive.

Working directory: ~/teamwork_projects/water_invader_mobile_controls_fix
Integrity mode: development

## Requirements

### R1. Enhance Mobile Touch Responsiveness
Analyze the touch/drag event listeners (e.g., onTouchStart, onTouchMove, pointer events) controlling the player in src/components/game-canvas.tsx. Improve the tracking sensitivity, scaling, and deadzones so that dragging the player character horizontally feels smooth, 1:1 responsive, and free of jitter.

### R2. Resolve UI Conflicts
Ensure that the improved touch area does not conflict with overlay buttons (like Ally, Ultimate, Shop). The movement should only register in the playable canvas area or specifically where intended without accidentally triggering other UI elements.

## Acceptance Criteria

### Verification
- [ ] Code inspection confirms updated touch logic (e.g., proper delta-X calculation and boundary clamping).
- [ ] Playwright tests utilizing mobile device emulation confirm that dragging events successfully move the player without getting stuck or dropped.
- [ ] Automated tests verify that the new control scheme does not break or block interactions with the on-screen UI buttons (Ally/Ultimate).
