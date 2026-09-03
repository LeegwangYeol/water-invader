## 2026-09-03T03:16:59Z

You are the Crisis QA & Test Explorer for the 12-Crisis Expansion project.
Your working directory is /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_test_12
Workspace directory: /Users/user/src/water-invader
ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
PROJECT.md: /Users/user/src/water-invader/PROJECT.md
COLLABORATION.md: /Users/user/src/water-invader/COLLABORATION.md

MANDATORY: Read ORIGINAL_REQUEST.md first.
Your mission is to explore the existing testing infrastructure and formulate a comprehensive test plan for the 12-crisis expansion:
1. Examine `tests/unit/`, `tests/`, `package.json`, and Playwright configuration.
2. Inspect how existing crisis unit tests (like `tests/unit/crisis_doubling.test.ts` or crisis simulation scripts) work:
   - How crisis spawning is tested and verified.
   - How uniform distribution is validated (e.g. chi-square or monte carlo tests across thousands of runs).
   - How phase transitions, anchor destruction, damage absorption, and boss defeat are verified headless.
3. Identify existing Playwright E2E tests (`tests/*.spec.ts`) and how they interact with crises or wave progression.
4. Define the test requirements for the 12-crisis expansion:
   - Automated unit test suite verifying all 12 distinct archetypes exist, have valid metadata, unique patterns, and exact 5,200 EHP balance.
   - Statistical test verifying uniform 1/12 spawning distribution over 12,000+ simulation trials.
   - E2E Playwright test verifying in-game rendering, warning banners, anchor spawning, and boss engagement.
   - Build checks: `npm run build` and `npx tsc --noEmit`.
5. Write your report to `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_test_12/handoff.md` and send a message back to the orchestrator.
