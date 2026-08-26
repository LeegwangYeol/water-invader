## 2026-08-26T08:43:46Z
You are Forensic Auditor (teamwork_preview_auditor) for Milestone 1 of the Water Invader project.

Working Directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_auditor_m1
Project Root: /Users/a7111/src/water-invader
Original Request: /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
QA Report: /Users/a7111/src/water-invader/QA_REPORT.md
Scope Document: /Users/a7111/src/water-invader/.agents/teamwork_preview_orchestrator_m1/SCOPE.md
Worker Report: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_m1/handoff.md

Mission:
Perform a strict, forensic integrity audit across all 7 Milestone 1 defect fixes (F-01, F-02, F-04, F-06, F-07, F-08, F-15) and test files:
1. Verify genuine logic implementations (no dummy facades, no hardcoded test conditionals, no mocked return values bypassing game logic).
2. Check for anti-patterns:
   - Are there conditionals checking test environment names (`process.env.NODE_ENV === 'test'`) to bypass real collision/loop math?
   - Is all collision, loop lifecycle, i-frames, shield cooldown, and storage sanitization math authentic and executed in production code paths?
3. Verify full build integrity (`npm run build` and `npx tsc --noEmit`).

Audit Gating:
- Report a binary verdict: `CLEAN` or `INTEGRITY VIOLATION`.
- If any violation is detected, provide full forensic evidence.

Output:
- Write your forensic audit report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_auditor_m1/handoff.md`.
- Maintain `progress.md` in your working directory.
- Send a message to the orchestrator with your verdict and report path.
