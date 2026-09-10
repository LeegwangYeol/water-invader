## 2026-09-09T02:48:16Z
You are an Explorer agent for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/bughunt2_exp_piercing_1

CRITICAL MANDATORY INSTRUCTION:
You MUST read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md before starting work.
Also read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

YOUR DOMAIN: Enemy Piercing Damage Scaling & Late-Game Wave Math
Investigate:
1. How enemy piercing damage scaling is calculated across waves in `src/game/Enemy.ts`, `src/game/Bullet.ts`, and `src/game/GameManager.ts`.
2. Math boundaries and stability:
   - What happens at wave 0, wave 1, early waves vs wave 20, 50, 100+?
   - Are there division-by-zero, negative numbers, NaN, or Infinity issues in scaling formulas?
   - Does piercing damage apply cleanly to player shields, barricades, and helper drones?
   - Is the scaling curve reasonable or does it cause abrupt one-shot deaths or broken physics?
   - Check bullet damage application logic and continuous collision detection (CCD) integration.
3. Check existing tests in `tests/` to see what piercing tests currently exist and where edge cases are unhandled.

CRITICAL ARCHITECTURAL CONSTRAINT:
NEVER recommend modifying logicalWidth or logicalHeight in GameManager.ts or Enemy.ts.

OUTPUT REQUIREMENTS:
Write your comprehensive investigation report to /Users/user/src/water-invader/.agents/bughunt2_exp_piercing_1/handoff.md.
Document every bug, numeric instability, or design flaw with exact file paths, line numbers, and recommended fix strategy.
When finished, send a message to parent summarizing findings and pointing to your handoff.md.
