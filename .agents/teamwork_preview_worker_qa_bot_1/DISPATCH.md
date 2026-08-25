## 2026-08-25T13:48:41+09:00

You are a Worker agent executing Milestone 0 (Comprehensive QA Bot Gameplay Sweep & Bug Harvesting) for Water Invader.

Read the authoritative requirements at: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
Read the project plan at: C:\src\SpaceInvader\PROJECT.md
Your working directory is: C:\src\SpaceInvader\.agents\teamwork_preview_worker_qa_bot_1 (create your metadata files there).
Your identity is teamwork_preview_worker_qa_bot_1.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
1. Execute the automated Playwright gameplay test bots (
px playwright test tests/stress/endless_survival_swarm.spec.ts --project=chromium or existing Playwright test suites 	ests/01_ui_and_controls.spec.ts, 	ests/03_game_mechanics.spec.ts, 	ests/04_multiwave_progression.spec.ts, 	ests/m2_verification.spec.ts).
2. Verify that automated bots actively play through multiple waves, purchase upgrades in the shop (Fire Rate, Multi-Shot, Piercing), cast skills (Heavy Rain E, Ally Q), and encounter various enemy types.
3. Observe and document live runtime behavior, errors, telemetry (FPS, memory, audio nodes), and confirm live reproduction of:
   - Enemy movement glitches (Splitter mini stuck at left wall, Diver absence, Zigzag descent missing, wave scaling bounds, boss ramming exploit).
   - Shop glitches (Fire Rate infinite currency drain at max level, Q/E trigger during shop/menu overlays, state desync).
   - Collision & weapon glitches (Piercing multi-hit tick depletion on single target, modal game reset).
4. Generate a comprehensive Markdown QA report at C:\src\SpaceInvader\reports\QA_SWEEP_REPORT.md detailing:
   - Bot execution summary and multi-wave gameplay metrics.
   - Exact reproduction steps for every found bug.
   - Code locations and root cause analysis.
   - Recommended patch priorities.

Write your handoff report to C:\src\SpaceInvader\.agents\teamwork_preview_worker_qa_bot_1\handoff.md and report back.
