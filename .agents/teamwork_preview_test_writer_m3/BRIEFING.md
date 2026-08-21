# BRIEFING — 2026-08-21T08:09:00Z

## Mission
Write and execute comprehensive automated E2E/integration tests for Water Invader on the deployed URL (https://water-invader.vercel.app/) covering UI, Canvas rendering, game mechanics, and multi-wave progression, followed by full test reporting.

## 🔒 My Identity
- Archetype: Test Writer
- Roles: specialist, qa
- Working directory: C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3
- Original parent: 0367b0eb-028d-49d1-8c52-a16396e3ac6f
- Milestone: M3 QA & E2E Verification

## 🔒 Key Constraints
- Target Live URL: https://water-invader.vercel.app/
- Modify test code ONLY (in `tests/`), NEVER modify source code without explicit instruction.
- Escalate implementation bugs to the implementing agent / orchestrator.
- No facade or hardcoded tests. Genuine simulation and assertion.
- Follow Korean response rules and session handoff rules.

## Current Parent
- Conversation ID: 0367b0eb-028d-49d1-8c52-a16396e3ac6f
- Updated: 2026-08-21T08:09:00Z

## Task Summary
- **What to build**: Comprehensive automated test script in `tests/` (e.g. `tests/water-invader.spec.ts` or executable Playwright scripts).
- **Success criteria**:
  - UI & Control Verification (R1)
  - Canvas Rendering & Vector Graphics Verification (R1)
  - Game Mechanics & State Simulation (R2: input simulation, window.gameManager inspection, Diver dive/explosion, Splitter movement/split, Barricade slow down, Sniper bullet interception)
  - Multi-wave Progression (R3: Wave 1 -> Wave 2 -> Wave 3+)
  - Test execution logs, `test_report.md`, `handoff.md`.
- **Interface contracts**: `PROJECT.md`, `ORIGINAL_REQUEST.md`
- **Code layout**: `tests/` for tests, `.agents/teamwork_preview_test_writer_m3/` for metadata.

## Loaded Skills
- None loaded yet

## Quality Status
- **Build/test result**: [TBD]
- **Lint status**: [TBD]
- **Tests added/modified**: [TBD]

## Key Decisions Made
- Use Playwright / Playwright Test or direct Playwright node script for headless browser testing against https://water-invader.vercel.app/.

## Artifact Index
- `C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3\progress.md` — Progress tracker and heartbeat
- `C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3\test_report.md` — Test Execution Report
- `C:\src\SpaceInvader\.agents\teamwork_preview_test_writer_m3\handoff.md` — 5-component handoff report
