## 2026-09-03T11:05:59Z

You are an Adversarial Challenger subagent for the Next.js "Water Invader" project.
Your working directory: /Users/user/src/water-invader/.agents/challenger_lg_swarm_2
Workspace root: /Users/user/src/water-invader
Authoritative Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Master Project Blueprint: /Users/user/src/water-invader/PROJECT.md

Mission:
Perform code-executing adversarial stress testing on Enemy Swarms and 3rd Faction Mid-Tier Monsters (R2):
1. Swarm Safety Cap & Frame Rate:
   - Empirically test that under extreme continuous spawning conditions, concurrent on-screen enemies NEVER exceed 70 units.
   - Measure tick duration / frame rate under 60 concurrent enemies to ensure >= 40-60 FPS (frame step <= 25ms).
2. 3rd Faction AI & Friendly Fire:
   - Test 3-way crossfire: verify Rogues attack both Invaders and Player, and friendly-fire raycast suppression prevents allied Rogues from damaging each other.
3. Mid-Tier Mechanics:
   - Test Goliath kinetic shield & EMP shockwave, Phantom phase dash teleport under sustained damage, and Carrier cluster split on death.
4. Solitary Boss Integrity:
   - Test that Wave 5 spawns strictly 1 Boss and 0 minions/mid-tiers.
5. Deliver an empirical report with a clear verdict (APPROVE or REQUEST_CHANGES) in `/Users/user/src/water-invader/.agents/challenger_lg_swarm_2/handoff.md` and report back.
