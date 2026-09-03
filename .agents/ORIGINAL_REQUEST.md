# Original User Request

## Initial Request — 2026-09-02T13:31:23+09:00

You are the Project Orchestrator for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/orchestrator_qol_1
Workspace Directory: /Users/user/src/water-invader
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Claude Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md

Your mission is to coordinate the full lifecycle of implementing, testing, balancing, verifying, committing, and pushing the QoL and Event Gameplay update for Water Invader:
1. R1. Acid Rain Counterplay (deployable safe zone, umbrella/shield mechanic, or purchasable shop item that neutralizes/mitigates acid rain damage).
2. R2. Event Background Visibility Fix (adjust event background colors/opacity, add high-contrast projectile outline/glow/highlighting to ensure enemy attacks remain highly visible during environmental events).
3. R3. Expand Crisis Variety (introduce more distinct behaviors, mechanics, or entirely new crisis types so each End-Game Crisis feels unique and less repetitive).
4. R4. Pre-Game Shop Access (allow players to access and use the Shop before Wave 1 begins on main menu / pre-game lobby, ensuring purchased items/upgrades apply upon game start).
5. Comprehensive Automated Testing:
   - Automated tests verifying Acid Rain counterplay mitigates/prevents damage.
   - Automated tests verifying pre-wave 1 shop purchases apply to stats/inventory upon game start.
   - Automated tests verifying new/distinct Crisis behaviors and mechanics.
   - Visual clarity verification for projectile visibility during background color shifts.
   - Full test suite execution ensuring `npm run build` and `npx playwright test` pass with 0 errors.
6. Git commit and push all changes according to pre-commit and pre-push verification rules.

Please structure your execution into clear phases (exploration, implementation, test development & simulation, adversarial review, build & push), spawn specialist subagents as needed under `.agents/`, maintain `BRIEFING.md` and `progress.md`, and report completion with a detailed `handoff.md`.

## 2026-09-03T00:53:04Z

Enhance the Water Invader game with UI fixes, smarter AI algorithms, and expanded content for end-game crises. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Expand End-Game Crisis Types
Double the current number of End-Game Crisis types. Brainstorm and implement entirely new crisis concepts with distinct mechanics, patterns, and visual themes to significantly expand the late-game variety.

### R2. Responsive and Clear Event Backgrounds
The current event/crisis warning background color is getting clipped or cut off on mobile screens and is interfering with the visibility of enemy projectiles. Fix the background rendering logic so it covers the entire responsive canvas seamlessly and adjust the opacity/color blending to guarantee bullet visibility on all devices.

### R3. Smarter Enemy Friendly-Fire AI
Enemies can currently damage each other, but the AI is flawed: they often shoot directly into the back of an ally that is standing right in front of them. Modify the enemy targeting and shooting algorithms to implement basic line-of-sight or spatial awareness so they avoid firing if an ally is blocking their immediate shot path.

## Acceptance Criteria

### Gameplay Verification
- [ ] Code inspection or automated tests confirm the total number of distinct End-Game Crisis types has been doubled.
- [ ] Automated tests or explicit collision logs verify that enemies will suppress their fire or reposition if another enemy is directly in their line of fire.

### Quality & Deployment
- [ ] `npm run build` and `npx playwright test` pass without any errors.
- [ ] Rendering logic for background warnings dynamically adapts to varying canvas/screen dimensions without clipping.
- [ ] Changes are successfully committed and pushed to the repository.

## 2026-09-03T01:00:30Z

The user has already provided explicit approval: "승인". Proceed with the source code modifications and milestone implementation immediately.

## 2026-09-03T03:14:24Z

Expand the End-Game Crises in the Water Invader game to a total of 12 distinct types. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Massive Crisis Expansion (12 Types)
The game currently has 6 crisis types. Double this number to 12. Research grand strategy/sci-fi tropes (such as Stellaris crises) and use creative discretion to design 6 entirely new, distinct End-Game Crisis archetypes. Each new crisis should have unique mechanics, visual themes, and patterns.

## Acceptance Criteria

### Gameplay Verification
- [ ] Code inspection or automated tests confirm the game now features exactly 12 distinct End-Game Crisis archetypes, uniformly distributed.

### Quality & Deployment
- [ ] `npm run build` and `npx playwright test` pass without any errors.
- [ ] Changes are successfully committed and pushed to the repository.

## 2026-09-03T03:26:37Z

The user has provided an additional urgent requirement: "중간에 큰 아군의 증원도넣어주삼" (Also add massive allied reinforcements in the middle of the game/crisis). Please incorporate this massive allied reinforcement feature into your current milestone plan and implement it alongside the 12-crisis expansion.

## 2026-09-03T05:13:03Z

This is a comprehensive testing and bug-hunting pass for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Deep E2E Testing & Bug Hunting
Deploy a very large team of agents (30+) to exhaustively playtest and analyze the game for any edge cases, crashes, visual clipping, physics glitches, or UI lockups.

### R2. Automated Fixes & Verification
If any bugs or errors are found during the deep testing phase, implement fixes, write corresponding regression tests, and ensure the entire Playwright test suite passes.

## Acceptance Criteria

### Quality & Deployment
- [ ] The game passes exhaustive simulated stress testing without console errors or game-breaking states.
- [ ] `npm run build` and `npx playwright test` pass without any errors.
- [ ] If fixes were applied, they are successfully committed and pushed to the repository.
## 2026-09-03T10:09:20Z

This is a major gameplay update for the Next.js "Water Invader" project introducing late-game mechanics, a new weapon, and a 3rd faction. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Homing Missile Weapon Upgrade
Introduce a new purchasable weapon upgrade in the shop: Homing Missiles (유도탄). This weapon must target the closest enemy and deal significant damage. It is intended to help players clear enemies that spawn too close to them after Wave 10. The price can be scaled for late-game.

### R2. Enemy Swarm and 3rd Faction (Mid-Tier Monsters)
Increase the overall spawn count of enemies. Introduce a new "3rd faction" consisting of mid-tier monsters that also spawn in the game. These entities should have distinct mechanics or stats compared to the regular invaders.

### R3. Mandatory Double-Check Testing Before Push
Before committing and pushing the changes, the agent team MUST thoroughly verify the balance and logic. Ensure that the homing missiles work correctly and that the new faction doesn't crash the game. Write and run Playwright tests to confirm these behaviors.

## Acceptance Criteria

### Gameplay Mechanics
- [ ] A Homing Missile upgrade is purchasable in the shop, and when used, projectiles successfully seek the nearest enemy.
- [ ] A distinct 3rd faction (mid-tier monsters) spawns during gameplay, and the overall enemy count is noticeably higher.

### Quality & Deployment
- [ ] Automated tests confirm the new homing physics and 3rd faction mechanics without error.
- [ ] `npm run build` and `npx playwright test` pass cleanly.
- [ ] Changes are pushed to the repository only after unanimous tester verification.

## 2026-09-03T15:09:55Z

This is a single self-contained feature for the Next.js "Water Invader" project. Keep it small and focused.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Continue vs Restart Option on Death
When the player dies (Game Over), the game should not immediately reset completely or only offer a single restart button. Instead, present the player with two explicit options on the Game Over UI:
1. "Restart from Beginning" (처음부터 시작) - Resets score, wave, and upgrades, starting from Wave 1.
2. "Continue" (이어하기) - Revives the player at the current wave, maintaining their current score and purchased upgrades.

### R2. Automated Verification & Git Push
Verify that the changes compile and don't break existing logic using the Playwright E2E suite. Add or update tests to explicitly check that the two options function correctly (Continuing keeps wave > 1 and upgrades, Restarting resets wave to 1 and upgrades). Once verified, commit the changes and push them to the repository.

## Acceptance Criteria

### Gameplay Mechanics
- [ ] Game Over screen displays two distinct choices: Restart and Continue.
- [ ] Selecting "Continue" respawns the player on the current wave with their upgrades intact.
- [ ] Selecting "Restart" fully resets the game state to Wave 1.

### Quality & Deployment
- [ ] Running `npm run build` and `npx playwright test` passes without errors.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## 2026-09-03T15:37:41Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: A very large team of agents

This is a major feature expansion for the Next.js "Water Invader" project. It introduces dynamic backgrounds, allied reinforcements, new enemy types, and barricade repair mechanics. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Dynamic Backgrounds & Threat Signifiers
Every 10 stages (e.g., Wave 10, 20), the game background must change to indicate progression. Additionally, when Elite enemies, Bosses, or high-difficulty events are present, the color scheme or background must visually shift to give the player a distinct impression of heightened danger.

### R2. Allied Reinforcements with Roles & UI
Introduce massive allied reinforcement events. Allied units must display their remaining health and a clear role indicator (e.g., an icon or text indicating if they are a "Medic", "Repair Bot", or "Fighter"). The UI must make it obvious what function each ally serves.

### R3. Barricade Saboteurs & Repair Mechanics
Introduce a new enemy type that specifically targets and gnaws away at the central defensive barricades. To counter this, the central barricades must either automatically fully restore at the start of every new wave, or the newly added Allied Repair Bots must prioritize repairing the barricades as their primary action.

## Acceptance Criteria

### Gameplay Mechanics
- [ ] Reaching a multiple of 10 waves triggers a background change, and Boss/Elite spawns trigger a distinct color/visual shift.
- [ ] Allied units spawn with visible health bars and role identifiers.
- [ ] A new enemy successfully attacks and degrades barricades.
- [ ] Barricades are fully restored per wave or actively repaired by allied bots.

### Quality & Deployment
- [ ] Running `npm run build` and `npx playwright test` passes without errors, including any new tests written for these mechanics.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.


