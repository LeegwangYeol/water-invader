## 2026-08-31T09:22:22Z

You are Worker 1 for Milestone M1: Extreme Difficulty Scaling Engine.

Your mission:
Implement extreme difficulty scaling in `src/game/Enemy.ts` and `src/game/GameManager.ts` based on the survey findings:
1. Piecewise Enemy HP Scaling:
   - For `level < 10`: Preserve exact existing formula: `hp = 1 + Math.floor(level / 3)` (and corresponding rogue/boss formulas) to ensure early game (Waves 1-9) onboarding and regression tests remain 100% intact.
   - For `level >= 10`: Implement accelerated/exponential HP scaling:
     - Standard Invaders (Standard, Diver, Zigzag, Splitter): `hp = 4 + (level - 9) * 6 + Math.floor(Math.pow(level - 9, 1.5))` (Wave 10: 10 HP, Wave 15: 25 HP, Wave 20: 45 HP).
     - Shielded: `hp = 8 + (level - 9) * 4; shield = 6 + (level - 9) * 3` (Wave 10: 12 HP + 9 Shield).
     - Rogue Drone: `hp = 3 + (level - 9) * 3` (Wave 10: 6 HP).
     - Rogue Stalker: `hp = 6 + (level - 9) * 5` (Wave 10: 11 HP).
     - Rogue Mech: `hp = 15 + (level - 9) * 10` (Wave 10: 25 HP, Wave 20: 125 HP).
     - Boss (`level % 5 === 0`): At Wave 10, HP = 300; At Wave 15, HP = 650; At Wave 20, HP = 1200 (`hp = 50 + level * 25 + Math.floor(Math.pow(level - 5, 2) * 2.5)`).
2. Attack Tempo & Projectile Scaling:
   - For `level >= 10`, reduce enemy firing cooldown to `Math.random() * 0.7 + 0.8` (0.8s ~ 1.5s, scaling down with level) from the default 2.0s ~ 5.0s.
   - Projectile speed for enemies at `level >= 10` scaled to `250 + Math.min(150, (level - 10) * 15)` px/s.
   - Elite enemies (Snipers, Rogue Stalkers/Mechs, Bosses) fire projectiles with `damage = 2` starting at Stage 10+.
3. Boss Escort Legions:
   - In `GameManager.ts` `spawnWave()`, when `level >= 10` and `level % 5 === 0`, spawn the Boss escorted by 4-8 accompanying minions (Shielded, Snipers, and Divers) so the boss cannot be isolated and bursted down instantly.
4. Verify your work:
   - Run `npx tsc --noEmit` and `npm run build` to verify 0 errors.
   - Run `npx playwright test tests/04_multiwave_progression.spec.ts tests/05_three_way_battle.spec.ts tests/unit/physics_and_math.test.ts` to ensure 0 regressions.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Reference files:
- `/Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md`
- `/Users/user/src/water-invader/PROJECT.md`
- `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_1/survey_report.md`
