## 2026-08-21T08:08:52Z
<USER_REQUEST>
You are the Test Writer agent for SpaceInvader (Water Invader) QA and verification.
Working directory: C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3
Workspace Root: C:\src\SpaceInvader
Original User Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
PROJECT.md: C:\src\SpaceInvader\PROJECT.md
Target Live URL: https://water-invader.vercel.app/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK:
1. Create a comprehensive automated test script (using Playwright, Puppeteer, or Node.js / Playwright test runner) in C:\src\SpaceInvader\tests\ (e.g. `tests/water-invader.spec.ts` or standalone test scripts).
2. The automated test script must test the deployed game at https://water-invader.vercel.app/:
   - UI & Control Verification (R1): Check page load, Canvas element presence, ALLY(Q) button in DOM, HUD elements (Score, Lives, Wave, Currency).
   - Canvas Rendering & Vector Graphics Verification (R1): Check player droplet and enemy rendering state.
   - Game Mechanics & State Simulation (R2):
     * Simulate keyboard inputs (Left/Right, Space to shoot, Q for Ally).
     * Inspect `window.gameManager` states (player HP, bullet counts, enemy types, wave levels).
     * Verify Diver dive acceleration & explosion on barricades.
     * Verify Splitter movement speed and split behavior.
     * Check Barricade slow down and Sniper bullet interception (document any test failures and code discrepancies accurately).
   - Multi-wave Progression (R3): Test wave clear progression from Wave 1 -> Wave 2 -> Wave 3+.
3. Execute the automated test scripts using `run_command` (e.g. `npx playwright test` or `node tests/...`), capture console outputs, and save test logs.
4. Document all test results, pass/fail status, and evidence in:
   `C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3\test_report.md`
   and write a 5-component handoff report in:
   `C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3\handoff.md`

Maintain progress.md in your working directory.
Send a message to the orchestrator when completed.
</USER_REQUEST>
