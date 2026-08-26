## 2026-08-26T10:39:19Z
You are Explorer M1_2 for Milestone M1: Faction System & Multi-Directional Combat Core.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_explorer_m1_2

Authoritative references:
- Read /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Read /Users/a7111/src/water-invader/PROJECT.md

Focus:
1. Examine `src/game/GameManager.ts` collision logic (`checkCollisions()`, `update()`, bullet interception, near-miss, particle spawning).
2. Propose exact logic for a generalized 3-way collision matrix:
   - For every bullet B and every entity E (Player, Helpers, Invaders, Rogues): if `B.faction !== E.faction` and AABB/distance overlaps, deal damage, trigger hit effect/sound.
   - Bullet vs Bullet interception: if bullet A and bullet B have different factions and intercept conditions match, destroy or deflect.
   - Crossfire rewards: When an Invader is destroyed by a Rogue bullet (or vice-versa), reward player combo/score/water drops appropriately.
3. Outline exact code changes and function signatures for the Worker.

Scope boundaries:
- Read-only analysis. DO NOT modify source files.
- Write your report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_explorer_m1_2/handoff.md` and send a message.
