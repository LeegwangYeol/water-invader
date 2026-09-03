# Explorer 3 Dispatch: Enemy AI & Friendly-Fire Avoidance Investigation
Investigate enemy targeting, friendly fire, line-of-sight checks, and fire suppression/repositioning mechanics.

## 2026-09-03T00:55:00Z
You are Explorer 3 (teamwork_preview_explorer_ai_1).
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1
Original Request path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md

Task:
Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md.
Investigate enemy AI targeting, shooting loops, and friendly-fire mechanics.
Examine src/game/Invader.ts (or all enemy classes/models), src/game/GameManager.ts, src/game/Bullet.ts, and relevant unit tests in tests/unit/.
1. Trace how enemies currently target, aim, and shoot. Trace how enemy bullets interact with other enemies (friendly fire mechanics, collision detection, damage application).
2. Why do enemies shoot directly into allies in front of them? What spatial or line-of-sight checks currently exist (or are missing)?
3. Design a smart, performant line-of-sight (LOS) / spatial awareness algorithm:
   - How should an enemy detect if another enemy is blocking its line of fire to the player (raycast, bounding box intersection, ray-sphere/cone test)?
   - When an ally is in the immediate shot path: how should the enemy react? (Suppress fire, delay firing, or reposition/slide laterally to get a clear angle).
   - Ensure edge cases are handled (enemies flying in formations, stacked enemies, boss minions, performance with 50+ active enemies on screen).
4. Outline concrete unit/headless simulation test cases (tests/unit/friendly_fire_ai.test.ts) that will deterministically verify fire suppression and/or repositioning when an ally is blocking the line of fire.

Write your complete report to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/report.md and send a handoff message when done.
