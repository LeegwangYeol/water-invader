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

