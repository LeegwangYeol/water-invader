# Execution Plan — Comprehensive QA Sweep & Auto-Fix

## Phase 0: Survey & Codebase Exploration (Current)
- Dispatch 3 parallel Explorers / Spec Miners:
  - **Explorer 1 (Enemy Mechanics & Physics)**: Analyze enemy types, spawning, movement paths, bounds checking, barricades/obstacle collision, movement anomalies, and boss patterns in `src/game/`.
  - **Explorer 2 (Shop & Economy Logic)**: Analyze shop UI in Intermission and Game Over (`src/components/`, `src/game/GameManager.ts`, `src/game/Player.ts`), Pure Water currency deduction, upgrade scaling (Fire Rate, Multi-Shot, Piercing), and purchase handlers.
  - **Explorer 3 (Test Bot Infrastructure & General Gameplay)**: Analyze existing Playwright bots (`tests/`, `e2e/`, or test scripts), collision systems, ultimate/skill activations (Q, E), memory leak risks (event listeners, particles, audio nodes), and automated runner setup.
- Merge Explorer findings into `PROJECT.md` and `QA_FINDINGS_PLAN.md`.

## Phase 1: Automated QA Gameplay Swarm & Bug Harvesting
- Launch test bots via Playwright to actively play through multiple waves.
- Monitor enemy positions, out-of-bounds occurrences, shop purchasing, Game Over overlay interactions, skill activations, and console/runtime errors.
- Synthesize all discovered bugs into a prioritized Markdown QA Bug Report (`QA_SWEEP_REPORT.md`).

## Phase 2: Patching & Bug Resolution (Explorer -> Worker -> Reviewers -> Challengers -> Auditor)
- Milestone 1: Enemy movement & collision anomalies fix.
- Milestone 2: Shop UI, currency deduction, and upgrade application fix.
- Milestone 3: General gameplay, skills, memory/audio leaks, and edge case fixes.

## Phase 3: Final Verification & Build
- Re-run Playwright automated gameplay bots to verify bug resolution.
- Run `npm run build` and full test suite.
- Reviewer, Challenger, and Forensic Auditor verification.
- Final synthesis and reporting.
