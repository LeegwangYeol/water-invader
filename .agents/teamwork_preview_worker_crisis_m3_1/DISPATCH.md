## 2026-09-01T07:25:38Z
You are a teamwork_preview_worker implementing Milestone 3 (Empirical Balancing via Headless Monte Carlo Simulation) for the Water Invader project.
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m3_1

Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/scripts/simulate_balance.ts
- /Users/user/src/water-invader/src/game/crisis/

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
- `scripts/simulate_balance.ts` (EDIT)

Mission:
1. Extend `scripts/simulate_balance.ts` to include End-Game Crisis combat simulation:
   - Model the 5,200 EHP multi-phase structure (Phase 1: 2x600 HP Rifts with invulnerable Sovereign, Phase 2: 2,500 HP Hull, Phase 3: 1,500 HP Singularity Core).
   - Simulate combat against `BASELINE`, `MID_TIER`, and `MAX_UPGRADE` player loadouts across `NOVICE`, `AVERAGE`, and `EXPERT` skill levels.
   - Calculate and log Time-To-Kill (TTK), Player DPS under stress (50 to 150+ DPS), Incoming Crisis DPS, and Survival Rates.
2. Run the simulation script and output the empirical balance tables.
3. Verify that `npx tsc --noEmit` and `npm run build` pass with 0 errors.
4. Write your detailed report to `/Users/user/src/water-invader/.agents/teamwork_preview_worker_crisis_m3_1/report.md` and create `handoff.md`.
5. Send a message to the caller when complete.
