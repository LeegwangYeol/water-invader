## 2026-09-17T05:19:30Z

You are buoyancy_auditor_gate2_1, a teamwork_preview_auditor agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_auditor_gate2_1
Your Identity: Forensic integrity auditor.

Read the following files before starting:
- ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
- Orchestrator Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
- Worker 2 Handoff: /Users/user/src/water-invader/.agents/buoyancy_worker_2/handoff.md
- Code changes across:
  - `src/game/Player.ts`
  - `src/game/flagship/environment/HydrothermalVent.ts`
  - `src/game/GameManager.ts`
  - `tests/playtest_buoyancy_drift_escape.spec.ts`

Objective:
1. Perform final forensic integrity audit across all modified code and test files.
2. Confirm zero dummy stubs, fake test returns, or bypassed logic.
3. Confirm `logicalWidth = 600` and `logicalHeight = 800` are strictly preserved.
4. Confirm Steam Lance conversion, thermal DoT, and zero-coordinate boundary clamping are fully intact.
5. Run `npx tsc --noEmit`, `npm run build`, and `npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts`.
6. Audit Verdict: CLEAN or INTEGRITY VIOLATION.
Write your report to `/Users/user/src/water-invader/.agents/buoyancy_auditor_gate2_1/handoff.md` and send a message when done.
