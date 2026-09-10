## 2026-09-09T02:54:00Z
You are a Worker agent for Water Invader.
Working Directory: /Users/user/src/water-invader/.agents/bughunt2_worker_engine_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL ARCHITECTURAL CONSTRAINT:
NEVER modify logicalWidth or logicalHeight in GameManager.ts or Enemy.ts. They MUST remain strictly 600 and 800. All responsive adjustments must be strictly CSS.

MANDATORY: Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md before starting work.
Also read /Users/user/src/water-invader/.agents/bughunt2_exp_shop_1/handoff.md, /Users/user/src/water-invader/.agents/bughunt2_exp_piercing_1/handoff.md, /Users/user/src/water-invader/.agents/bughunt2_exp_crisis_1/handoff.md, and /Users/user/src/water-invader/.agents/bughunt2_exp_allies_1/handoff.md.

YOUR FILE OWNERSHIP (Exclusive):
- `src/game/GameManager.ts`
- `src/game/Entity.ts`

TASKS:
1. Fix DEF-C1: In `spawnWave()` (around lines 751–756), after `this.triggerEndGameCrisis()`, add `return;` so normal enemies (50-60 hostiles) do not spawn on top of the Crisis encounter!
2. Fix DEF-S2 & DEF-A7: Reset `this.emergencyAlliesTriggeredThisWave = false;` in `prepareContinue()`, `continueGame()`, and `init()`.
3. Fix DEF-S3: Reset `this.alliedReinforcementBannerTimer = 0; this.alliedReinforcementBannerText = "";` and call `this.onAlliedReinforcements?.(false, "")` in `prepareContinue()` and `continueGame()`.
4. Fix DEF-S4: Reset `this.threatIntensity = 0; this.activeThreatLevel = 'NONE';` in `prepareContinue()` and `continueGame()`.
5. Fix DEF-A1 (Barricade Array Compaction): In `GameManager.ts` (around lines 1688–1696), do NOT splice dead barricades out of `this.barricades`. Keep all 4 barricade objects in `this.barricades` with `isDead = true` and `hp = 0` so array indices (0, 1, 2, 3) remain fixed! This ensures central barricades are always indices 1 & 2 for Saboteurs, Repair Bots can locate and resurrect them, and `damagedBarricades` counting remains accurate.
6. Fix DEF-P1 (Ally Piercing Penetration): In `GameManager.ts` (around line 2036), when a hostile bullet hits a helper drone, do NOT unconditionally set `bullet.isDead = true`. If `bullet.piercing > 0`, decrement `bullet.piercing` and track `bullet.hitEntities.add(helper.id)`. Only mark dead if `bullet.piercing <= 0`.
7. Fix DEF-P2 (Barricade Phantom Multi-Hit): In `checkCollisions()` (around line 1797), when a barricade takes damage and its HP reaches <= 0, mark `barricade.isDead = true` immediately so other bullets in the same tick do not collide with a 0-HP ghost barricade.
8. Fix DEF-A10: In Diver-Barricade collision (around lines 2100–2107), add `break;` after damaging the impacted barricade so it does not loop and damage adjacent barricades on the same frame.
9. Fix DEF-S6 & DEF-C4: In `continueGame()`, avoid frame-1 instant crisis incursion on Wave 15+. Ensure `this.hasEndGameCrisisOccurred = false` doesn't instantly roll random crisis on the very first tick of continuing.
10. Fix DEF-P8: In `src/game/Entity.ts:sweptAABB`, support swept-to-swept collision checking for opposing high-velocity projectiles.
11. Run `npx tsc --noEmit` to verify type checking passes cleanly.

OUTPUT REQUIREMENTS:
Write your implementation report to /Users/user/src/water-invader/.agents/bughunt2_worker_engine_1/handoff.md with all code diffs, logic explanations, and verification results. Send a message to parent when done.
