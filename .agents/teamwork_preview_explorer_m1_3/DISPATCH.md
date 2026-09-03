## 2026-09-01T06:23:30Z

You are a teamwork_preview_explorer analyzing Milestone 1 (Crisis State Machine & Integration Contracts).
Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_3
Read:
- /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- /Users/user/src/water-invader/PROJECT.md
- /Users/user/src/water-invader/COLLABORATION.md

Your mission:
1. Inspect `src/game/GameManager.ts` and `src/components/game-canvas.tsx`.
2. Define how `EndGameCrisis` interacts with `GameManager`:
   - State representation in `GameManager` (`this.endGameCrisis: EndGameCrisis | null`).
   - Phase lifecycle: `INCURSION` (3s warning) -> `PHASE_1_SHIELD` (Anchors active) -> `PHASE_2_HULL` (Sovereign exposed) -> `PHASE_3_CORE` (Singularity core enrage) -> `DEFEATED`.
   - HUD Boss Bar rendering for Crisis (multi-phase health bar overlay, phase title, warning countdown).
3. Write your analysis to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_m1_3/analysis.md and create handoff.md.
4. Send a message to caller when complete.
