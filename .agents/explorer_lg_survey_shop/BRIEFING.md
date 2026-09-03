# BRIEFING — 2026-09-03T10:16:30Z

## Mission
Investigate Shop system, Player weapon/upgrade inventory, and UI architecture to formulate a complete technical plan for Requirement 1 (Homing Missile Weapon Upgrade).

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/user/src/water-invader/.agents/explorer_lg_survey_shop
- Original parent: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Milestone: Late-Game Expansion - R1 Homing Missile Shop Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT edit source code or run builds
- Write only to .agents/explorer_lg_survey_shop/
- Put full report in handoff.md
- Report back to parent via send_message

## Current Parent
- Conversation ID: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Updated: 2026-09-03T10:16:30Z

## Investigation State
- **Explored paths**:
  - `src/components/game-canvas.tsx` (ShopUpgradePanel, ShopModal, GameOverModal, GameCanvas state)
  - `src/game/Player.ts` (weapon stats, firing logic, update loop)
  - `src/game/Bullet.ts` (projectile physics, layers, collision bounds)
  - `src/game/GameManager.ts` (init, upgrade methods, state transitions, economy, checkCollisions)
  - `src/game/Helper.ts` & `src/game/crisis/AlliedReinforcements.ts` (target-seeking algorithms)
  - `src/game/SoundManager.ts` (audio synthesis, shoot/explosion sounds)
  - `tests/06_shop_economy_max_upgrades.spec.ts` & `tests/unit/pregame_shop_persistence.test.ts`
- **Key findings**:
  - Shop UI is in `game-canvas.tsx`, not a separate `Shop.tsx`.
  - Existing upgrades (Fire Rate, Multi-Shot, Piercing, Acid Shield) cap at 1,550 💧 total, leaving late-game players (Wave 10+) with surplus currency.
  - Homing Missile should use an Autonomous Secondary Salvo Pod attached to `Player.ts`, firing on a dedicated interval (2.0s -> 0.9s) with heavy damage (3 -> 7).
  - Scaled pricing tiers: [250, 450, 700, 1000, 1400] 💧 totaling 3,800 💧.
  - Euclidean nearest-neighbor targeting algorithm directly counters close-spawning enemies in Waves 10+.
- **Unexplored areas**: None for this subagent's scoped mission.

## Key Decisions Made
- Architecture: Autonomous Secondary Pod (Hybrid Salvo) rather than manual toggle or simple primary bullet replacement.
- Tiered Pricing Array: `HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]`.
- Integration plan maintains full backward compatibility with existing tests and type signatures.

## Artifact Index
- `/Users/user/src/water-invader/.agents/explorer_lg_survey_shop/DISPATCH.md` — incoming dispatch log
- `/Users/user/src/water-invader/.agents/explorer_lg_survey_shop/BRIEFING.md` — working memory
- `/Users/user/src/water-invader/.agents/explorer_lg_survey_shop/progress.md` — liveness heartbeat
- `/Users/user/src/water-invader/.agents/explorer_lg_survey_shop/handoff.md` — final survey report
