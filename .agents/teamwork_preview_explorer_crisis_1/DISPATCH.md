## 2026-09-03T00:54:54Z
Task:
Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md.
Investigate the existing Crisis types and the End-Game Crisis architecture.
Examine src/game/types.ts, src/game/crisis/, src/game/GameManager.ts, and relevant tests in tests/ and tests/unit/.
1. Determine the EXACT current list and count of distinct End-Game Crisis types (and any intermediate/hazard crisis types like SOLAR_FLARE, ACID_RAIN, etc.).
2. Detail how End-Game Crises are instantiated, triggered, structured (e.g. Cataclysm boss phases, anchors, telegraphs, timers, attacks), and how their state transitions work.
3. Formulate a concrete specification to DOUBLE the current number of distinct End-Game Crisis types. For each new crisis concept:
   - Unique name and type identifier.
   - Distinct core mechanics, telegraphs, attack patterns, and player counterplay.
   - Distinct visual themes and audio/render cues.
   - Integration points in code (types.ts, EndGameCrisis.ts, GameManager.ts, game-canvas.tsx).
4. Detail automated test strategy to verify that the total number of distinct End-Game Crisis types has doubled and each functions properly.

Write your complete investigation and architectural proposal to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_crisis_1/report.md and send a handoff message when done.
