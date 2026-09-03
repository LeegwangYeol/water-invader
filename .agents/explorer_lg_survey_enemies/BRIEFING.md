# BRIEFING — 2026-09-03T10:15:30Z

## Mission
Investigate Enemy generation, Wave scaling, AI behaviors, and Faction mechanics to formulate a complete technical design for Requirement 2 (Enemy Swarms & 3rd Faction Mid-Tier Monsters).

## 🔒 My Identity
- Archetype: Explorer
- Roles: Investigation, Synthesis
- Working directory: /Users/user/src/water-invader/.agents/explorer_lg_survey_enemies
- Original parent: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Milestone: Late-Game Milestone - R2 Investigation & Technical Design

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do not edit source code or run builds
- Store all report files and metadata within .agents/explorer_lg_survey_enemies/

## Current Parent
- Conversation ID: 64f804cc-0c89-4eaf-b63c-7323a06289e4
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/game/types.ts`: Faction, EnemyType enums, Crisis types
  - `src/game/Enemy.ts`: Enemy class, stats scaling, stage 10+ aggression, AI movement & friendly fire line-of-sight raycasting, vector rendering
  - `src/game/GameManager.ts`: `spawnWave()`, `spawnDynamicReinforcement()`, `checkCollisions()`, `handleEnemyKill()`, `handleCrossfireKill()`, `updateScoreUI()`, wave clear criteria
  - `src/game/Bullet.ts`: projectile faction interactions & crossfire bullet interception
  - `src/game/crisis/`: EndGameCrisis, AlliedReinforcements, types
  - `src/components/game-canvas.tsx`: HUD threat badges for `invaderCount` and `rogueCount`
  - `tests/`: 02_rendering_and_vector_art.spec.ts, 03_game_mechanics.spec.ts, 04_multiwave_progression.spec.ts, 05_three_way_battle.spec.ts, 12_extreme_difficulty_and_crises.spec.ts, adversarial crossfire tests
- **Key findings**:
  1. `spawnWave()` currently caps standard enemy count at 40 (5 rows x 8 cols) starting at wave 8, creating an artificial plateau for post-wave 10.
  2. Boss wave at Wave 5 must spawn exactly 1 boss (enforced by `04_multiwave_progression.spec.ts`).
  3. `Faction.ROGUE` is already established in types, HUD, and tests, but Rogues only spawn via random dynamic reinforcements or TOTAL_WAR crisis.
  4. Regular waves completely lack mid-tier monsters and regular 3rd-faction integration.
  5. Crossfire collision matrix already supports damage between hostile factions and awards score/currency/ultimate charge via `handleCrossfireKill`.
  6. Performance can be protected with a 70-unit concurrent safety cap and phased echelon streaming.
- **Unexplored areas**:
  - None within the scope of Requirement 2.

## Key Decisions Made
- Use a 2-tier swarm scaling architecture (expanded initial grid up to 60 units + dynamic streaming echelons of 10-18 units when active hostiles drop below threshold) to achieve 70-90+ total enemies per wave post-Wave 10 without screen overcrowding.
- Build upon the established `Faction.ROGUE` architecture, promoting and expanding Mid-Tier Monsters (Goliath, Phase Stalker, Brood Carrier) with overhead health bars, distinct high-voltage magenta/neon lime visuals, kinetic shields, phase dash evasion, and cluster death splits.
- Preserve Wave 5 single-boss spawn to prevent regression in existing tests.

## Artifact Index
- DISPATCH.md — Initial task dispatch
- BRIEFING.md — Working memory and identity
- progress.md — Heartbeat and step tracker
- handoff.md — Comprehensive 5-component technical design report
