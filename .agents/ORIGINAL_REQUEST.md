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

## 2026-09-07T15:42:17Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → delegate to teamwork_preview
> Requested team: Use a very large team of agents (40+ agents)

This is a major feature update and balance adjustment for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Pre-Continue Shop Access
When a player dies and selects the "Continue" (이어하기) option, they must be given an opportunity to access the Shop to purchase additional upgrades (including HP restoration/upgrades) before the wave actually resumes.

### R2. Enemy Piercing Damage Scaling
Implement a "piercing" attack scaling concept for enemies, especially common mobs. As enemies grow stronger in later waves, their damage should scale up more aggressively to simulate piercing through the player's armor.

### R3. Mobile Viewport Adjustments (CSS Only)
Adjust the game canvas sizing for mobile devices so that enemies do not appear to suddenly drop in from the top of the screen, extending the visible X and Y axis bounds.
**CRITICAL CONSTRAINT**: You MUST NOT change `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`, as this will immediately fail the Playwright test suite. All visual scaling and viewport extensions must be handled strictly via CSS (e.g., `max-width`, `max-height`, aspect ratio adjustments) without changing the core logical grid size.

### R4. Stability & Crash Prevention Verification
Thoroughly test the Continue -> Shop -> Resume flow to ensure there are no crashes, state resets, or unhandled exceptions that kick the player to the main screen.

## Acceptance Criteria

### Gameplay Mechanics
- [ ] A player can open the shop and buy items (including HP) after clicking "Continue" but before the gameplay resumes.
- [ ] Common enemy damage formulas include a scaling piercing multiplier based on the wave level.
- [ ] Mobile viewports show more of the game board via CSS scaling, without altering the core logical dimensions.

### Quality & Deployment
- [ ] `npm run build` and `npx playwright test` pass without errors.
- [ ] Automated tests explicitly verify that the Continue-Shop flow does not crash or drop state.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## 2026-09-07T15:44:53Z

사용자가 프롬프트 상에서 "바로 수정 시작 나에게 묻지말라. 40 에이젼트 이상 동원 허락, 수정후 바로 푸쉬"라고 명시적으로 묻지 말고 진행하라고 허가(Approval)를 내렸습니다. 따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고, 이 메시지를 **사전 승인(Pre-approved)**으로 간주하여 탐색 단계(Phase 0)가 끝나는 즉시 코딩 및 배포(Implementation & Push)까지 원스톱으로 진행하십시오. 승인(Proceed)합니다.

## 2026-09-09T02:46:26Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → delegate to teamwork_preview
> Requested team: Use a very large team of agents (40+ agents)

This is a comprehensive bug-hunting and quality assurance sweep for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Deep E2E Testing & Bug Hunting
Deploy a massive team of agents to thoroughly test the game for any edge cases, logic flaws, state leaks, visual glitches, or unexpected crashes. Pay special attention to the recently added features (Continue Shop, Piercing scaling, Mobile Viewport CSS, Reinforcements, Crises).

### R2. Fix Found Issues
For every bug found, design a fix that strictly respects the game's existing architectural constraints (especially the constraint that `logicalWidth` and `logicalHeight` in `GameManager.ts` must never be modified).

### R3. Automated Verification & Git Push
Verify that any fixes compile and don't break existing logic using the Playwright E2E suite. Add or update tests to explicitly check that the found bugs stay fixed. Once verified, commit the changes and push them to the repository.

## Acceptance Criteria

### Quality & Deployment
- [ ] A comprehensive bug hunt has been conducted by the agent team, and all discovered issues have been resolved.
- [ ] Running `npx playwright test` (and `npm run build`) passes without errors.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## 2026-09-09T02:46:33Z

사용자가 프롬프트 상에서 "허락 구하지말고 알아서 ㄱ"라고 명시적으로 묻지 말고 진행하라고 허가(Approval)를 내렸습니다. 따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고, 이 메시지를 **사전 승인(Pre-approved)**으로 간주하여 탐색 단계(Phase 0)가 끝나는 즉시 버그 수정 및 배포(Implementation & Push)까지 원스톱으로 진행하십시오. 승인(Proceed)합니다.

## 2026-09-10T00:43:41Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → delegate to teamwork_preview
> Requested team: Use a very large team of agents (40+ agents)

This is an open-ended creative brainstorming and feature implementation update for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Ideate New Features
Use the massive agent team to brainstorm new, highly engaging features, mechanics, or game modes for the "Water Invader" game. Ideas can include but are not limited to: new player weapons, unique environmental hazards, meta-progression systems, distinct enemy factions, or interactive events.

### R2. Implement the Best Ideas
Select the best ideas generated in R1 and implement them into the codebase. Ensure the new features fit seamlessly into the existing game loop and mechanics.

### R3. Architectural Constraints
Ensure that the new features do not break existing game constraints, particularly ensuring that `logicalWidth` and `logicalHeight` in `GameManager.ts` are never modified.

### R4. Automated Verification & Git Push
Verify that any new features compile and do not break existing logic using the Playwright E2E suite. Add or update tests to cover the newly added features. Once verified, commit the changes and push them to the repository.

## Acceptance Criteria

### Quality & Deployment
- [ ] At least 3 new creative features/mechanics have been brainstormed and implemented.
- [ ] Running `npx playwright test` (and `npm run build`) passes without errors.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## 2026-09-10T00:43:45Z

사용자가 프롬프트 상에서 "모든건 허용 바로 시작"라고 명시적으로 묻지 말고 진행하라고 허가(Approval)를 내렸습니다. 따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고, 이 메시지를 **사전 승인(Pre-approved)**으로 간주하여 기획 단계(Phase 0)가 끝나는 즉시 기능 구현 및 배포(Implementation & Push)까지 원스톱으로 진행하십시오. 승인(Proceed)합니다.

## 2026-09-10T00:44:47Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → delegate to teamwork_preview
> Requested team: Use a very large team of agents (40+ agents)

This is an open-ended creative brainstorming operation for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: exploration

## Requirements

### R1. Ideate New Features (NO CODING)
Use the massive agent team to brainstorm new, highly engaging features, mechanics, or game modes for the "Water Invader" game. Ideas can include but are not limited to: new player weapons, unique environmental hazards, meta-progression systems, distinct enemy factions, or interactive events.

### R2. Compile a Comprehensive Pitch Document
Synthesize the best ideas from the 40+ agents into a highly detailed presentation or pitch document. This document should detail the mechanics, visual themes, and potential impact of each idea.

### R3. STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE
This is an ideation-only task. You MUST NOT modify any source code files (e.g., .ts, .tsx, .css). Do not attempt to implement the ideas, do not run tests, and do not push to git.

## Acceptance Criteria

### Quality & Output
- [ ] A highly detailed pitch document (e.g., `IDEAS_PITCH.md` in the repo or an artifact) containing at least 10 fully fleshed-out game mechanic/feature ideas has been generated.
- [ ] Absolutely zero changes were made to the game's source code.

## 2026-09-10T00:44:54Z

사용자가 프롬프트 상에서 "바로 시작"이라고 명시적으로 묻지 말고 진행하라고 허가(Approval)를 내렸습니다. 또한 **"개발은 하지마"**라는 추가 지시가 있었습니다. 따라서 사용자 승인 게이트(User Approval Gate)를 기다리지 말고 사전 승인된 것으로 간주하되, **절대 코드를 수정하거나 기능을 구현하지 말고 오직 브레인스토밍 아이디어 산출 및 문서화(IDEAS_PITCH.md 등) 작업만 원스톱으로 진행하십시오.** 승인(Proceed)합니다.

## 2026-09-10T05:27:47Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → delegate to teamwork_preview
> Requested team: Use a very large team of agents (40+ agents)

This is a massive, multi-phase implementation operation for the Next.js "Water Invader" project. Use a very large team of agents.

Working directory: /Users/user/src/water-invader
Integrity mode: development

## Requirements

### R1. Implement ALL Pitch Features
Read the `/Users/user/src/water-invader/IDEAS_PITCH.md` document. You are tasked with implementing ALL 12 Flagship Features into the game's source code. This includes:
1. Cavitation Torpedo
2. Prism Laser
3. Hydraulic Harpoon
4. Hydrothermal Vents
5. Biolapse Darkness Cycle
6. Modular Submersible Chassis
7. Veteran Crew Synergy Deck
8. Mutating Bio-Horror Faction
9. Automaton Shield Phalanx
10. Apex Bosses
11. Roguelike Endless Mode
12. Sonar/Hydrophone UI

### R2. Strict Architectural Integrity
You MUST preserve the core game dimensions: `logicalWidth` (600/720) and `logicalHeight` (800/960) in `GameManager.ts` and `Enemy.ts` must NOT be changed. Any responsiveness must remain strictly CSS-based.

### R3. Automated Testing & Deployment
With a feature drop this massive, regression bugs are highly likely. The agent swarm must write unit and E2E Playwright tests for the new systems. Ensure the entire suite passes cleanly. Once verified, commit the changes and push to `origin/master`.

## Acceptance Criteria

### Quality & Deployment
- [ ] All 12 flagship features detailed in `IDEAS_PITCH.md` are fully implemented in the game loop and UI.
- [ ] Running `npx playwright test` (and `npm run build`) passes without errors.
- [ ] Changes are successfully committed to Git and pushed to the remote repository.

## 2026-09-10T05:27:53Z

사용자가 "전부 구현해야지 새끼야" 라며 강력한 승인(Approval)을 내렸습니다. 사용자 승인 게이트(User Approval Gate)를 기다리지 말고 이 메시지를 **사전 승인(Pre-approved)**으로 간주하십시오. 

즉시 40명 이상의 초대형 개발 에이전트 부대를 편성하여 `IDEAS_PITCH.md`에 명시된 **12개의 메인(Flagship) 기능을 전부 게임 소스 코드에 구현(Coding & Implementation)**하십시오. 
물리 엔진, UI, 적군 AI, 신규 모드 등 모든 시스템을 개발하되, 기존 `logicalWidth`/`logicalHeight`는 절대 변경하지 마십시오. 코딩, 테스트, 그리고 Github 배포(Push)까지 원스톱으로 끝까지 밀어붙이십시오. 승인(Proceed)합니다.

