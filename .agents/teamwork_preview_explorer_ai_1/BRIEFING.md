# BRIEFING — 2026-09-03T01:05:00Z

## Mission
Investigate enemy AI targeting, shooting loops, and friendly-fire mechanics, and design a performant line-of-sight (LOS) spatial awareness algorithm.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1
- Original parent: 2fc0aa56-06ce-4d85-a081-2b78baaba6a9
- Milestone: enemy AI & friendly fire avoidance investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly observe pre-commit/build verification and user approval rules
- Deliver complete report to report.md and handoff report to handoff.md

## Current Parent
- Conversation ID: 2fc0aa56-06ce-4d85-a081-2b78baaba6a9
- Updated: 2026-09-03T01:05:00Z

## Investigation State
- **Explored paths**: `src/game/Enemy.ts`, `src/game/GameManager.ts`, `src/game/Bullet.ts`, `src/game/Entity.ts`, `src/game/types.ts`, `tests/unit/`, `tests/05_three_way_battle.spec.ts`, `tests/crossfire_and_score_persistence.spec.ts`, `tests/adversarial_math_physics_m1_m2_c2.spec.ts`.
- **Key findings**:
  1. Enemy bullets damage any enemy entity whose `bullet.shooter !== enemy` without faction discrimination (`GameManager.ts:1288-1296`).
  2. `Enemy.fire()` exclusively scans for opposing factions (`e.faction !== this.faction`) and completely ignores same-faction allies in front of it (`Enemy.ts:399, 483`).
  3. Formations spawn in regular grids and move in lockstep, guaranteeing that rear-row units have allies directly in their vertical firing corridor.
  4. Designed a two-tiered hybrid Line-of-Sight algorithm (1D interval overlap for vertical shots, 2D Kay-Kajiya slab raycast for angled shots) with micro-delay suppression ($0.12 - 0.24\text{s}$) and tactical lateral repositioning.
  5. Specified a 10-test deterministic headless test suite in `tests/unit/friendly_fire_ai.test.ts`.
- **Unexplored areas**: None. Complete investigation and design delivered.

## Key Decisions Made
- Chose two-tiered hybrid LOS algorithm (Tier 1 1D vertical corridor, Tier 2 2D Slab raycast) for optimal performance ($< 0.005\text{ms}$ per frame for 50+ enemies).
- Designed micro-delay suppression (120ms-240ms) instead of resetting full 2-5s cooldown to keep enemies trigger-ready without burning shots.
- Formulated 10 unit test cases for deterministic verification in `tests/unit/friendly_fire_ai.test.ts`.

## Artifact Index
- `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/report.md` — Comprehensive architectural investigation report
- `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/handoff.md` — Self-contained 5-component handoff report
- `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/progress.md` — Liveness heartbeat
- `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_ai_1/DISPATCH.md` — Task history log
