# BRIEFING — 2026-08-31T09:27:45Z

## Mission
Implement extreme difficulty scaling in `src/game/Enemy.ts` and `src/game/GameManager.ts` for Milestone M1 (Piecewise exponential HP, attack tempo & projectile scaling, elite 2-damage shots, and boss escort legions for Stage 10+).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_m1
- Original parent: a4485adf-cb83-4c08-9329-6b6a2a94f8de
- Milestone: M1: Extreme Difficulty Scaling Engine

## 🔒 Key Constraints
- For `level < 10`: Preserve exact existing formula: `hp = 1 + Math.floor(level / 3)` (and corresponding rogue/boss formulas) to ensure early game (Waves 1-9) onboarding and regression tests remain 100% intact.
- For `level >= 10`: Implement accelerated/exponential HP scaling as specified.
- For `level >= 10`: Enemy firing cooldown reduced to `Math.random() * 0.7 + 0.8` (0.8s ~ 1.5s, scaling down with level) from default 2.0s ~ 5.0s.
- Projectile speed for enemies at `level >= 10` scaled to `250 + Math.min(150, (level - 10) * 15)` px/s.
- Elite enemies (Snipers, Rogue Stalkers/Mechs, Bosses) fire projectiles with `damage = 2` starting at Stage 10+.
- In `GameManager.ts` `spawnWave()`, when `level >= 10` and `level % 5 === 0`, spawn the Boss escorted by 4-8 accompanying minions (Shielded, Snipers, and Divers).
- Verify: `npx tsc --noEmit` and `npm run build` with 0 errors.
- Verify: `npx playwright test tests/04_multiwave_progression.spec.ts tests/05_three_way_battle.spec.ts tests/unit/physics_and_math.test.ts` to ensure 0 regressions.

## Current Parent
- Conversation ID: a4485adf-cb83-4c08-9329-6b6a2a94f8de
- Updated: 2026-08-31T09:27:45Z

## Task Summary
- **What to build**: Piecewise Enemy HP scaling (Waves 1-9 baseline vs Stage 10+ exponential), attack tempo & projectile speed scaling, elite 2-damage shots, and boss escort fleets.
- **Success criteria**: Stage 10+ enemies scale up in HP and firing tempo; early waves 1-9 unaffected; Boss has escort minion fleet at Stage 10+; test suites pass.
- **Interface contracts**: `PROJECT.md`
- **Code layout**: `src/game/Enemy.ts`, `src/game/GameManager.ts`, `tests/unit/physics_and_math.test.ts`

## Key Decisions Made
- Implemented piecewise HP formula branching on `this.level < 10` vs `this.level >= 10`.
- Stored `maxShieldHp` in `Enemy` class so shield regeneration works seamlessly for both early waves and Stage 10+.
- Scaled enemy projectile velocities and fire rates dynamically at Stage 10+ while preserving legacy values for Waves 1-9.
- Configured elite enemies (Snipers, Bosses, Rogue Stalkers, Rogue Mechs) to deal 2 projectile damage at Stage 10+.
- Added symmetrical multi-flank escort minions (Shielded, Snipers, Divers) around Bosses on boss waves starting at Stage 10+.

## Artifact Index
- `.agents/teamwork_preview_worker_m1/DISPATCH.md` — Assignment instructions
- `.agents/teamwork_preview_worker_m1/BRIEFING.md` — Agent briefing & memory
- `.agents/teamwork_preview_worker_m1/progress.md` — Execution progress log
- `.agents/teamwork_preview_worker_m1/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**:
  - `src/game/Enemy.ts`: Implemented piecewise HP formulas, attack tempo, projectile speed, and elite 2-damage scaling.
  - `src/game/GameManager.ts`: Added Stage 10+ boss escort fleets in `spawnWave()`.
  - `tests/unit/physics_and_math.test.ts`: Added unit tests for Stage 10+ difficulty scaling and piecewise formulas.
- **Build status**: 100% PASS (`npx tsc --noEmit` + `npm run build` + 71/71 Playwright tests pass).
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (71 passed, 0 failed).
- **Lint status**: 0 violations.
- **Tests added/modified**: 5 new unit test cases covering all scaling formulas and Stage 10+ mechanics.

## Loaded Skills
- None
