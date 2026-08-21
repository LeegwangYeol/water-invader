## 2026-08-21T08:08:52Z
You are the Live QA & Chrome DevTools Specialist Worker for SpaceInvader (Water Invader).
Working directory: C:\src\SpaceInvader\.agents\teamwork_preview_worker_live_m4
Workspace Root: C:\src\SpaceInvader
Original User Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
PROJECT.md: C:\src\SpaceInvader\PROJECT.md
Target Live URL: https://water-invader.vercel.app/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK:
1. Connect to and interactively test the live deployed game at https://water-invader.vercel.app/ using Chrome DevTools MCP tools (`navigate_page`, `evaluate_script`, `take_screenshot`, `press_key`, `click`, etc.) or Playwright scripts.
2. Visual Inspection (R1):
   - Capture live screenshots of the UI, Canvas, ALLY(Q) button, and player Cute Blue Droplet.
   - Capture screenshots of enemy vector graphics (Normal orange tentacles, Sniper purple triangles, Diver red teardrops, Splitter green cells, Boss red titan).
   - Save screenshots in `C:\src\SpaceInvader\public\qa_screenshots\` or `.agents\teamwork_preview_worker_live_m4\screenshots\`.
3. Extreme Stress & Multi-Wave Survival Testing (R3):
   - Run the game through multiple consecutive waves (Wave 1 -> Wave 2 -> Wave 3 -> Wave 4 -> Wave 5 Boss) using interactive play / autopilot script injection.
   - Explicitly verify live spawns and unique mechanics of:
     * Diver (diving attack, crash explosion on barricades)
     * Sniper (aimed shooting, sniper bullet trajectory)
     * Splitter (slow movement, split into mini enemies)
     * Boss (appearance at Wave 5, boss HP bar, heavy barrage)
   - Measure frame rates, memory/performance stability under heavy bullet and particle load.
4. Record all live observations, screenshot paths, wave survival logs, and performance metrics in:
   `C:\src\SpaceInvader\.agents\teamwork_preview_worker_live_m4\live_qa_report.md`
   and write a 5-component handoff report in:
   `C:\src\SpaceInvader\.agents\teamwork_preview_worker_live_m4\handoff.md`

Maintain progress.md in your working directory.
Send a message to the orchestrator when completed.
