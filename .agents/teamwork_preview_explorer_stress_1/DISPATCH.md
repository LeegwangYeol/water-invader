## 2026-08-21T08:04:38Z
You are an Explorer subagent specializing in QA Automation and Live Stress Testing for the SpaceInvader (Water Invader) project.
Working directory: C:\src\SpaceInvader\.agents\teamwork_preview_explorer_stress_1
Original User Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
Workspace Root: C:\src\SpaceInvader
Live Deployed URL: https://water-invader.vercel.app/

TASK:
Survey the testing infrastructure, dependencies, and environment for QA and Stress Testing:
1. Check existing test tools and dependencies in package.json (Playwright, Puppeteer, Chromium, Vitest/Jest).
2. Assess how to automate tests against the live URL (https://water-invader.vercel.app/) using Playwright/Puppeteer or node scripts to:
   - Verify Canvas loading, UI elements, ALLY(Q) button.
   - Simulate player movement (Arrow keys/WASD), shooting (Space), Ally summoning (Q).
   - Survive through waves 1, 2, 3+ until Divers and Snipers spawn.
   - Intercept Sniper bullets and test Diver collisions.
3. Inspect Chrome DevTools MCP capabilities (navigate_page, take_screenshot, evaluate_script, press_key, etc.) and propose a concrete step-by-step strategy for live manual/semi-automated gameplay, visual inspection, and screenshot capture of all enemy types (Normal, Sniper, Diver, Splitter, Boss).

Document your analysis and recommended testing plan in:
C:\src\SpaceInvader\.agents\teamwork_preview_explorer_stress_1\analysis.md
and write a comprehensive Handoff report in:
C:\src\SpaceInvader\.agents\teamwork_preview_explorer_stress_1\handoff.md

Maintain progress.md in your working directory with timestamps.
Send a message back to the orchestrator when completed.
