# Project: Water Invader - Major Late-Game Gameplay Update

## Architecture
Water Invader is a Next.js / TypeScript arcade space shooter featuring continuous collision detection, dynamic event crises, allied dreadnoughts, and an interactive shop. This major update extends late-game systems past Wave 10:
- **Weapon System**: Autonomous Homing Missile pod (`HomingMissile extends Bullet`) attached to Player ship, calculating proportional pursuit curves towards nearest Euclidean enemy threats with barricade clearance and splash damage.
- **Shop & Economy**: Tiered late-game investment array (`HOMING_MISSILE_COSTS = [250, 450, 700, 1000, 1400]`), scaling salvo count (1..3) and damage (3..7), persisting across wave resets and pre-game shop armory.
- **Swarm Progression**: Two-tier enemy swarm scaling with expanded initial grid (50–60 units) and dynamic streaming echelons (10–14 units) when active enemies drop below 18, capped at 65–70 concurrent on-screen entities.
- **3rd Faction (`Faction.ROGUE`)**: Mid-tier monsters (Rogue Goliath, Rogue Phase Phantom, Rogue Brood Carrier) with overhead mini-health bars, kinetic shields, phase dash teleports, cluster-split spawns, and 3-way crossfire AI.
- **Dual-Track Testing Architecture**: Independent requirement-driven opaque-box E2E test suites coupled with white-box unit test suites and adversarial stress testing.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Homing Missile Projectile (`HomingMissile`) | Seeker projectile with proportional angular turning ($\omega=6.2\text{ rad/s}$), CCD, and barricade passthrough | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Autonomous Missile Salvo Pod | Player wingtip launcher charging on dedicated timer ($2.0\text{s} \to 0.9\text{s}$), firing 1 to 3 missiles | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Late-Game Tiered Shop Upgrade | Shop upgrade item for Homing Missiles with tiered costs (`[250, 450, 700, 1000, 1400] 💧`) in `game-canvas.tsx` | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Upgrade State Persistence | `init(false, true)` preserves homing missile unlock level across pre-game and mid-game shop sessions | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Rocket Ignition Audio FX | Audio synthesizer in `SoundManager.ts` for missile launch and detonation | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Post-Wave 10 Swarm Grid Expansion | Wave generator expands from 40-cap to 50–60 enemies (up to 6 rows x 10 cols) post-Wave 10 | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Dynamic Swarm Echelon Streaming | Secondary swarm formations stream in when active enemies $\le 18$, scaling wave casualties to 70–90+ | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Concurrent Entity Safety Cap | Hard cap of 65–70 concurrent on-screen hostiles to ensure stable 60 FPS performance | M2 | ORIGINAL_REQUEST §R2 |
| 9 | 3rd Faction Mid-Tier Monsters | Distinct Rogue monsters (Goliath, Phase Phantom, Brood Carrier) with 25–55 HP and unique mechanics | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Overhead Mini-Health Bars | 40x4px vector health bar with kinetic shield overlay and health ratio gradient | M2 | ORIGINAL_REQUEST §R2 |
| 11 | 3-Way AI Crossfire & Friendly Fire | Rogue units engage both Invaders and Player, triggering `handleCrossfireKill()` bonuses | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Solitary Boss Wave 5 Invariant | Strict preservation of Wave 5 solitary boss (1 enemy) to protect test assertions | M2 | ORIGINAL_REQUEST §R2 |
| 13 | Unit Test Suite for Missiles & Swarms | Unit tests covering seeking geometry, economy tiers, persistence, and swarm caps | M3 | ORIGINAL_REQUEST §R3 |
| 14 | Playwright E2E Combat Suite | Playwright E2E specs for Homing Missiles (`tests/16_homing_missile_combat.spec.ts`) | M3 | ORIGINAL_REQUEST §R3 |
| 15 | Playwright E2E Swarm & Faction Suite | Playwright E2E specs for Swarm & 3rd Faction (`tests/16_enemy_swarm_and_third_faction.spec.ts`) | M3 | ORIGINAL_REQUEST §R3 |
| 16 | Full Regression & Pre-Push Verification | `npm run build`, `npx tsc --noEmit`, `npx playwright test` verification before git commit and push | M3 | ORIGINAL_REQUEST §R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Homing Missile Weapon System | `src/game/Bullet.ts`, `src/game/Player.ts`, `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, `src/game/SoundManager.ts` | Survey Complete | COMPLETED |
| 2 | M2: Enemy Swarm & 3rd Faction | `src/game/Enemy.ts`, `src/game/GameManager.ts`, `src/game/types.ts` | Survey Complete | COMPLETED |
| 3 | M3: Dual-Track Testing & Hardening | `tests/unit/`, `tests/`, Playwright runner, pre-commit/pre-push | M1, M2 | COMPLETED |


## Interface Contracts

### Player ↔ HomingMissile
- `Player.homingMissiles: number`: Upgrade level (0 = unpurchased, 1..5 = active tier).
- `Player.missileTimer: number`: Dedicated reload timer decremented by `deltaTime`.
- `HomingMissile(x: number, y: number, damage: number)`: Spawned at ship wingtips with initial upward velocity and autonomous target acquisition.
- `HomingMissile.ignoreBarricades: boolean = true`: Bypasses player barricade collision at $y = 650$.

### GameManager ↔ Shop UI
- `GameManager.getUpgrades()` returns `{ ..., homingMissiles: number }`.
- `GameManager.upgradeHomingMissiles(): boolean`: Validates currency against `HOMING_MISSILE_COSTS[level]`, deducts currency, increments level, plays audio, updates UI.
- `GameManager.init(resetScoreAndCash, preserveUpgrades)`: Preserves `homingMissiles` level when `preserveUpgrades === true`.

### Enemy ↔ 3rd Faction
- `Faction.ROGUE`: Faction identifier for mid-tier monsters.
- `Enemy.isMidTier: boolean`: Flag enabling overhead health bar rendering and mid-tier stat scaling.
- `Enemy.shieldHp: number`: Kinetic barrier absorbing damage before base HP.
- `Enemy.phaseDashCooldown: number`: Timer for horizontal teleport evasion.
- `Enemy.fire(playerPos, allEnemies)`: Scans for closest target among Player and Invaders; checks line-of-sight friendly-fire suppression for allied Rogues.

## Code Layout
- `src/game/Entity.ts`: Base entity class with continuous collision detection (CCD).
- `src/game/Bullet.ts`: Projectile class and `HomingMissile extends Bullet`.
- `src/game/Player.ts`: Player ship state, controls, primary weapons, and secondary missile salvo launcher.
- `src/game/Enemy.ts`: Enemy state, AI, swarm movement, mid-tier monsters, overhead health bars.
- `src/game/GameManager.ts`: Master game loop, wave spawning, collision resolution, shop logic.
- `src/game/SoundManager.ts`: Web Audio API sound synthesizers.
- `src/components/game-canvas.tsx`: HUD overlays, React canvas wrapper, `ShopUpgradePanel`.
- `tests/unit/`: Vitest/Node unit tests for isolated mathematical and state logic.
- `tests/`: Playwright E2E integration and browser tests.
