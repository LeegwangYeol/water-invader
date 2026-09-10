# BRIEFING — 2026-09-10T10:38:00Z

## Mission
Orchestrate General execution (teamwork_preview_orchestrator) with a very large team of agents (30+ agents) for the Next.js "Water Invader" project: Extensive manual QA playtesting and visual inspection of the newly implemented 12 Flagship Features using browser automation and troubleshooting tools, runtime error & layout verification, automated remediation, playtest reporting (`QA_REPORT.md`), and git push to `origin/master`.

## 🔒 My Identity
- Archetype: sentinel
- Working directory: /Users/user/src/water-invader/.agents/sentinel
- Orchestrator: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Victory Auditor: d8680672-cb32-460b-8f57-15dfbc680ef6
- Active Orchestrator: 4a7f4a07-058b-47d1-a2a1-3e7f9530fb7a
- Cron 1 Task ID: febfa24a-ade3-4c0b-971d-640489ee1443/task-29
- Cron 2 Task ID: febfa24a-ade3-4c0b-971d-640489ee1443/task-31
- Late-Game Orchestrator: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Late-Game Cron 1 Task ID: 186a9975-abdf-42b6-a901-b48bcf46ba58/task-25
- Late-Game Cron 2 Task ID: 186a9975-abdf-42b6-a901-b48bcf46ba58/task-27
- Late-Game Victory Auditor: 2588d1cf-1980-4cc5-89d8-df3b81dd975d
- Continue-Restart Orchestrator: b4b4411d-380b-41d9-a004-e82ee8c046a7
- Continue-Restart Cron 1 Task ID: 7a1d211e-bea9-4dc1-9e45-c3340748a9ce/task-33
- Continue-Restart Cron 2 Task ID: 7a1d211e-bea9-4dc1-9e45-c3340748a9ce/task-35
- Major Expansion Orchestrator: fd67f473-0f7b-401a-90c3-a0cae3f3ba82 (terminated due to connection broken pipe)
- Major Expansion Orchestrator (Respawned): 9f82c659-c5c1-4ba9-8751-6f745d19b581 (terminated due to connection broken pipe)
- Major Expansion Orchestrator (Implementation Phase): 03251405-283f-4dac-a410-75a04069ddc9 (stopped due to 429 quota window)
- Major Expansion Orchestrator (Final Verification & Git Sync): 2c02f2d0-480f-41f3-a2d6-d4cb22bd6367
- Major Expansion Cron 1 Task ID: e047ca5c-667e-42d8-aa5c-b737e38a8d2a/task-37
- Major Expansion Cron 2 Task ID: e047ca5c-667e-42d8-aa5c-b737e38a8d2a/task-39
- Major Expansion Victory Auditor: 75d122bc-457a-4eff-a586-cecd900ee4a8 (VICTORY CONFIRMED)
- Feature Update Orchestrator (Gen 1): 38e78144-9abc-48a3-8a83-099f912ed48b (terminated: broken pipe)
- Feature Update Orchestrator (Gen 2): 212442fe-f4b2-4336-98cf-91abe2cc0526
- Feature Update Cron 1 Task ID: 4513a2fd-f95e-4297-8591-add43f114ad7/task-34
- Feature Update Cron 2 Task ID: 4513a2fd-f95e-4297-8591-add43f114ad7/task-36
- Feature Update Victory Auditor: 15b39903-3436-47ff-901b-37af2f2130ad
- Bug-Hunting & QA Sweep Orchestrator: 17c9b6c2-8167-4601-83eb-a48bc12725ca
- Bug-Hunting Cron 1 Task ID: 55058f56-77b1-43a1-b325-136457bfaa4b/task-35
- Bug-Hunting Cron 2 Task ID: 55058f56-77b1-43a1-b325-136457bfaa4b/task-37
- Creative Brainstorming Orchestrator: 8b89e85c-18d5-413c-8630-b672c8d75bba
- Creative Cron 1 Task ID: fbcf733f-6996-43a4-8664-15fe8e51b167/task-35
- Creative Cron 2 Task ID: fbcf733f-6996-43a4-8664-15fe8e51b167/task-37
- Creative Victory Auditor: e8ae499f-cfa0-45d6-aceb-aeeeacf72d47 (VICTORY CONFIRMED)
- Flagship Implementation Orchestrator: 825a4037-5803-4947-8e62-404f0b0d33b5
- Flagship Implementation Cron 1 Task ID: c037a359-674f-4a38-8bdb-f0f0f4a727f7/task-35
- Flagship Implementation Cron 2 Task ID: c037a359-674f-4a38-8bdb-f0f0f4a727f7/task-37
- Active Orchestrator: 825a4037-5803-4947-8e62-404f0b0d33b5
- Flagship Implementation Victory Auditor: d7631f42-44cf-4c24-8907-e70e2b362ce6 (VICTORY CONFIRMED)
- QA Playtest Orchestrator: efe1d016-c809-41a1-b0ba-aa528a160dca
- QA Playtest Cron 1 Task ID: d6c81654-cf53-46f3-b358-f9434a3fe851/task-30
- QA Playtest Cron 2 Task ID: d6c81654-cf53-46f3-b358-f9434a3fe851/task-32
- QA Playtest Victory Auditor: to be spawned on victory claim
- Active Orchestrator: efe1d016-c809-41a1-b0ba-aa528a160dca

## 🔒 Key Constraints
- No technical decisions — relay only
- Victory Audit is MANDATORY before reporting completion
- Route selected: General (teamwork_preview_orchestrator)
- Prompt protection rules strictly enforced
- Must follow pre-commit build verification rules and user global rules (COLLABORATION.md)
- User requested a very large team of agents (30+): orchestrator should deploy an extensive multi-specialist testing and bug-hunting swarm
- Acceptance criteria:
  1. Game passes exhaustive simulated stress testing without console errors or game-breaking states.
  2. `npm run build` and `npx playwright test` pass without any errors.
  3. If fixes were applied, they are successfully committed and pushed to the repository.
- Late-Game Constraints:
  - R1: Homing Missile Weapon Upgrade (유도탄) purchasable in shop, seeks closest enemy, high damage, scaled for late-game.
  - R2: Increased enemy swarm count, distinct 3rd faction of mid-tier monsters with unique mechanics/stats.
  - R3: Automated tests confirm homing physics and 3rd faction mechanics without error; npm run build & npx playwright test pass cleanly; changes pushed only after unanimous tester verification.
  - User Global Rules: Update COLLABORATION.md first; ensure user approval or trigger keyword alignment before source modifications.
- Continue-Restart Constraints:
  - Route selected: SWE Light (teamwork_preview_swe) per Routing Decision Table (single self-contained feature, explicit request to keep it small and focused)
  - R1: Continue vs Restart Option on Death ("Restart from Beginning" resets score, wave, upgrades to Wave 1; "Continue" revives at current wave keeping score and upgrades)
  - R2: Automated Playwright E2E verification confirming both options operate correctly, followed by git commit and push
  - Pre-commit build verification rules: npm run build & npx tsc --noEmit must pass cleanly
- Major Expansion Constraints:
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (explorers, workers, reviewers, challengers, auditors)
  - R1: Dynamic backgrounds (every 10 stages) & threat signifiers (visual/color shift on Boss/Elite/crisis)
  - R2: Massive allied reinforcements with visible health bars and clear role indicators (Medic, Repair Bot, Fighter)
  - R3: Barricade saboteur enemy attacking central defenses; barricades fully restored per wave or repaired by Repair Bots
  - Acceptance Criteria: `npm run build` & `npx playwright test` pass without errors; changes committed and pushed to remote repo
- Feature Update & Balance Constraints (Current Mission):
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (40+ agents)
  - R1: Pre-Continue Shop Access (Player accesses Shop to buy upgrades/HP after selecting Continue, before gameplay resumes)
  - R2: Enemy Piercing Damage Scaling (Common enemy attacks scale aggressively in later waves to simulate armor piercing)
  - R3: Mobile Viewport Adjustments (CSS Only - bounds extended; CRITICAL: NEVER modify `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`)
  - R4: Stability & Crash Prevention Verification (Thoroughly test Continue -> Shop -> Resume flow for no crashes/state loss)
  - Acceptance Criteria: `npm run build` and `npx playwright test` pass without errors; changes committed and pushed to remote repo
  - User Global Rules: Update COLLABORATION.md first; ensure user approval or trigger keyword alignment before source modifications; pre-commit build verification rules
- Bug-Hunting & QA Sweep Constraints (Current Mission):
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (40+ agents)
  - R1: Deep E2E Testing & Bug Hunting across all game systems (Continue Shop, Piercing scaling, Mobile Viewport CSS, Reinforcements, Crises)
  - R2: Fix found issues respecting architectural constraints (NEVER modify `logicalWidth` or `logicalHeight` in `GameManager.ts` or `Enemy.ts`)
  - R3: Automated verification (`npm run build` and `npx playwright test`) and git commit/push
  - Pre-approved execution: Proceed through implementation without waiting at approval gate
- Creative Brainstorming & Pitch Document Constraints (Current Mission):
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (40+ agents)
  - R1: Ideate New Features (NO CODING) across weapons, hazards, meta-progression, enemy factions, interactive events
  - R2: Compile a Comprehensive Pitch Document (`IDEAS_PITCH.md`) containing at least 10 fully fleshed-out game mechanic/feature ideas
  - R3: STRICT CONSTRAINT: DO NOT MODIFY SOURCE CODE. No modifications to .ts, .tsx, .css. No code implementation, no test runs, no git push.
  - Pre-approved execution: Proceed through brainstorming and documentation one-stop without waiting at approval gate.
- Flagship Features Full Implementation Constraints (Current Mission):
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (40+ agents)
  - R1: Implement ALL 12 Flagship Features from IDEAS_PITCH.md into game code and UI (Cavitation Torpedo, Prism Laser, Hydraulic Harpoon, Hydrothermal Vents, Biolapse Darkness Cycle, Modular Chassis, Crew Synergy Deck, Mutating Bio-Horrors, Automaton Phalanx, Apex Bosses, Roguelike Endless Mode, Sonar/Hydrophone UI)
  - R2: Strict Architectural Integrity: preserve logicalWidth (600/720) and logicalHeight (800/960) in GameManager.ts and Enemy.ts; responsive adjustments CSS-only
  - R3: Automated testing (unit & Playwright E2E) and build verification (npm run build); git commit and push to remote
  - Pre-approved execution: explicit user approval granted ("전부 구현해야지 새끼야", "Proceed", "승인")
- QA Playtesting & Visual Inspection Constraints (Current Mission):
  - Route selected: General (teamwork_preview_orchestrator) per Routing Decision Table
  - Requested team: A very large team of agents (30+ agents)
  - R1: Deep Visual & Interactive Playtesting (start Next.js dev server, connect via browser automation / Chrome DevTools troubleshooting, actively play and trigger 12 flagship features, observe visual rendering and interactive physics)
  - R2: Runtime Error & Layout Verification (monitor browser console for warnings, memory leaks, unhandled exceptions; verify CSS responsiveness and core 600x800 logical canvas is not visually clipped or distorted on different viewport sizes)
  - R3: Automated Remediation (implement fixes in codebase if visual bugs, console errors, or gameplay physics desyncs are discovered; verify in browser, test with npm run build and npx playwright test, push to origin/master)
  - Acceptance Criteria: comprehensive playtest report generated; browser console free of errors/leaks; bugs fixed, committed, and pushed
  - Pre-approved execution: user prompt marked "Status: Launched", proceed one-stop

## User Context
- **Last user request**: Extensive manual QA playtesting and visual inspection of the newly implemented 12 Flagship Features using browser automation and troubleshooting tools with a very large team of agents (30+ agents).
- **Pending clarifications**: none
- **Delivered results**:
  - Creative Brainstorming & Pitch Compilation: VICTORY CONFIRMED by Independent Victory Auditor (`e8ae499f-cfa0-45d6-aceb-aeeeacf72d47`).
  - Master Pitch Document generated: `/Users/user/src/water-invader/IDEAS_PITCH.md` (1,398 lines, 134 KB, 12 Flagship Features with 84 complete design subsections + 30 Compendium Innovations).
  - 12 Flagship Features Implementation & Deployment: VICTORY CONFIRMED by Independent Victory Auditor (`d7631f42-44cf-4c24-8907-e70e2b362ce6`).
  - Full codebase integration across 12 Flagship modules (`src/game/flagship/`, `GameManager.ts`, `SoundManager.ts`, `game-canvas.tsx`).
  - Strict preservation of `logicalWidth = 600` and `logicalHeight = 800`.
  - Comprehensive Playwright & Unit test suites (87/87 tests passed, 0 failures).
  - Production build verified (`npm run build`, 0 errors).
  - Git commit `4524049` cleanly pushed to remote `origin/master`.

## Project Status
- **Phase**: in progress (spawning QA playtest orchestrator)

## Victory Audit Status
- **Triggered**: no
- **Verdict**: pending
- **Retry count**: 0

## Artifact Index
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md — Verbatim user requests
- /Users/user/src/water-invader/.agents/sentinel/BRIEFING.md — Sentinel working memory
- /Users/user/src/water-invader/.agents/sentinel/handoff.md — Sentinel handoff report
- /Users/user/src/water-invader/COLLABORATION.md — Claude collaboration guide
- /Users/user/src/water-invader/PROJECT.md — Global project architecture
- /Users/user/src/water-invader/IDEAS_PITCH.md — Comprehensive Pitch Document with 12 Flagship Features
- /Users/user/src/water-invader/.agents/orchestrator_qa_playtest_1/ — Flagship QA Playtest Orchestrator working directory
- /Users/user/src/water-invader/QA_REPORT.md — Comprehensive Playtest Report (to be produced)






