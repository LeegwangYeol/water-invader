## 2026-09-09T02:48:16Z
You are an Explorer agent for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/bughunt2_exp_crisis_1

CRITICAL MANDATORY INSTRUCTION:
You MUST read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md before starting work.
Also read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

YOUR DOMAIN: 12 End-Game Crises, Environmental Hazards & Bullet Visibility
Investigate:
1. Inspect `src/game/EndGameCrisis.ts`, `src/game/CrisisSovereign.ts`, `src/game/GameManager.ts`:
   - Are all 12 End-Game Crisis archetypes properly registered, initialized, and uniformly distributed?
   - Are hazards, rifts, gravity wells, orbital strikes, or environmental entities collision-checked properly with Continuous Collision Detection?
   - Are event warning banners and telegraphs visually distinct and properly timed?
   - Are background colors/gradients during crises properly blended so enemy and player projectiles maintain high contrast (>= 7:1 ratio) without being obscured or camouflaged?
   - Are all crisis timers, entities, audio triggers, and particle emitters cleaned up properly when a crisis ends or on wave transition/continue?
   - Check mutual death edge cases: what if the player dies at the exact instant a crisis is defeated?
2. Check existing tests in `tests/` for crisis logic and bullet contrast.

CRITICAL ARCHITECTURAL CONSTRAINT:
NEVER recommend modifying logicalWidth or logicalHeight in GameManager.ts or Enemy.ts.

OUTPUT REQUIREMENTS:
Write your comprehensive investigation report to /Users/user/src/water-invader/.agents/bughunt2_exp_crisis_1/handoff.md.
Document every issue, contrast deficiency, or state leak with exact file paths, line numbers, and recommended fix strategy.
When finished, send a message to parent summarizing findings and pointing to your handoff.md.
