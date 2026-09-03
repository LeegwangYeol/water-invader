## 2026-09-01T06:49:00Z
You are a teamwork_preview_auditor conducting a Forensic Integrity Audit on Milestone 2 for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_auditor_crisis_m2_1

Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/src/game/GameManager.ts
- /Users/user/src/water-invader/src/components/game-canvas.tsx
- /Users/user/src/water-invader/src/game/crisis/

Your mission:
1. Conduct exhaustive integrity checks:
   - Check for hardcoded test results, fake mocks, or dummy stubs in `GameManager.ts`, `game-canvas.tsx`, or `src/game/crisis/`.
   - Verify that Stage 15+ random incursion generation uses genuine probability and gameState checks.
   - Verify that collision routing, damage gating, and victory reward payouts represent authentic game logic.
2. Output your definitive verdict: `CLEAN` or `INTEGRITY VIOLATION`.
3. Write your report to /Users/user/src/water-invader/.agents/teamwork_preview_auditor_crisis_m2_1/audit_report.md and create handoff.md.
4. Send a message to caller with your verdict and file path.
