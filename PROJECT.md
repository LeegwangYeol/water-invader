# Project: Water Invader - Feature Expansion (Dynamic Backgrounds, Allied Reinforcements & Barricade Saboteurs)

## Architecture
Water Invader is a Next.js / TypeScript arcade space shooter featuring continuous collision detection, dynamic event crises, allied dreadnoughts, homing missiles, and an interactive shop. This major feature expansion introduces three core systems:
1. **Dynamic Stage Backgrounds & Threat Signifiers (R1)**:
   - 5-Tier Biome Progression cycling every 10 stages (`Math.floor((level - 1) / 10)`): Surface Aquifer, Abyssal Trench, Bioluminescent Reef, Toxic Seabed, and Cosmic Void.
   - Threat Hierarchy (`NONE`, `ELITE`, `BOSS`, `CRISIS`) dynamically driving smooth ($0.4\text{s}$ lerp) radial perimeter threat vignettes (crimson for Bosses, magenta/amber for Elites, theme-tinted for Crises) rendered in Layer 1 before screen shake, maintaining zero GC allocation and $\ge 7:1$ projectile contrast.
2. **Allied Reinforcements with Roles & UI (R2)**:
   - Squadron warp-in events (Fighters, Medics, Repair Bots) triggered on wave milestones (every 5 waves) and emergency survival thresholds.
   - Distinct role behaviors: Fighters target Saboteurs and diving enemies; Medics escort the player and heal $+1\text{ HP}$ (every $3.5\text{s}$); Repair Bots prioritize damaged barricades (+8 HP/s).
   - Canvas overhead UI ($38\times 5\text{px}$ dynamic health bars, role badges $[⚔️\text{ FIGHTER}]$, $[💚\text{ MEDIC}]$, $[🔧\text{ REPAIR BOT}]$) and React DOM Squadron Status HUD + Arrival Banner.
3. **Barricade Saboteurs & Repair Mechanics (R3)**:
   - New enemy `BARRICADE_SABOTEUR` (`EnemyType.SABOTEUR = 13`) targeting central barricades (index 1 & 2), homing in, latching, and dealing $12.0\text{ DPS}$ acid/drill gnaw damage with animated rotary saw teeth.
   - Dual Counter-Mechanics: Automatic full barricade restoration on wave transition (`startNextWave()`), and active Repair Bot nanite welding with synchronized voxel block reconstruction in `Barricade.update()`.
   - Dedicated counter-weapon synergy: Player homing missiles explicitly ignore barricades to destroy Saboteurs latched onto cover.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | 5-Tier Biome Background Cycle | Surface Aquifer, Abyssal Trench, Bioluminescent Reef, Toxic Seabed, Cosmic Void cycling every 10 stages | M1 | ORIGINAL_REQUEST §R1 | PLANNED |
| 2 | Boss Threat Signifier Vignette | Radial crimson danger vignette and particle acceleration during Boss encounters | M1 | ORIGINAL_REQUEST §R1 | PLANNED |
| 3 | Elite Threat Signifier Vignette | Menacing magenta/amber danger vignette when Snipers or Rogue Elites are active | M1 | ORIGINAL_REQUEST §R1 | PLANNED |
| 4 | Threat Interpolation & Zero-GC Pipeline | 0.4s smooth threatIntensity lerp in Layer 1, 60 FPS zero-allocation | M1 | ORIGINAL_REQUEST §R1 | PLANNED |
| 5 | Role Hierarchy & Invariants | Preserve `FIGHTER = 0`, `REPAIRER = 1`, `TANK = 2`; introduce `MEDIC = 3` | M2 | ORIGINAL_REQUEST §R2 | PLANNED |
| 6 | Fighter AI & Targeting | Prioritizes Saboteurs and descending invaders; twin plasma bolts | M2 | ORIGINAL_REQUEST §R2 | PLANNED |
| 7 | Medic Escort & Healing AI | Escorts player ship, heals player HP (+1 HP every 3.5s) and mitigates suppression | M2 | ORIGINAL_REQUEST §R2 | PLANNED |
| 8 | Repair Bot Barricade Priority | Prioritizes damaged central barricades, beams repair rays (+8 HP/s) | M2, M3 | ORIGINAL_REQUEST §R2, §R3 | PLANNED |
| 9 | Overhead Health Bar & Role Badges | 38x5px health bar + [⚔️ FIGHTER], [💚 MEDIC], [🔧 REPAIR BOT] high-contrast badges | M2 | ORIGINAL_REQUEST §R2 | PLANNED |
| 10 | Squadron HUD & Arrival Banner | On-screen squadron counter and massive reinforcement arrival toast banner | M2 | ORIGINAL_REQUEST §R2 | PLANNED |
| 11 | Barricade Saboteur Enemy (`SABOTEUR`) | Dedicated siege unit targeting central barricades, 12 DPS acid/drill gnawing | M3 | ORIGINAL_REQUEST §R3 | PLANNED |
| 12 | Procedural Rotary Saw Vector Art | Procedural vector art for Saboteur with rotating saw blades and acid spark FX | M3 | ORIGINAL_REQUEST §R3 | PLANNED |
| 13 | Wave Barricade Auto-Restoration | `restoreBarricades()` in `startNextWave()` fully restoring HP and 24 voxel blocks | M3 | ORIGINAL_REQUEST §R3 | PLANNED |
| 14 | Voxel Reconstruction Sync | Reverse voxel block rebuilding loop in `Barricade.update()` as HP increases | M3 | ORIGINAL_REQUEST §R3 | PLANNED |
| 15 | Homing Missile Anti-Saboteur Synergy | Homing missiles bypass barricade obstruction to eliminate Saboteurs | M3 | ORIGINAL_REQUEST §R3 | PLANNED |
| 16 | Playwright E2E Dynamic Background Suite | 7-test suite for biomes, threat shifts, continue/restart persistence, contrast | M4 | ORIGINAL_REQUEST §R1 | PLANNED |
| 17 | Playwright E2E Allied Reinforcements Suite | Unit, combat, healing, and UI tests for Fighters, Medics, Repair Bots | M4 | ORIGINAL_REQUEST §R2 | PLANNED |
| 18 | Playwright E2E Barricade Saboteur Suite | Targeting, gnawing damage, active bot repair, and wave restoration tests | M4 | ORIGINAL_REQUEST §R3 | PLANNED |
| 19 | Full Regression & Pre-Commit Git Sync | `npm run build`, `npx tsc --noEmit`, full Playwright suite, commit & push | M4 | ORIGINAL_REQUEST AC | PLANNED |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | M0: Architecture Survey & Discovery | Codebase mapping, render pipeline analysis, gap identification | None | DONE |
| 1 | M1: Dynamic Backgrounds & Threat Signifiers | `src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/game/types.ts` | M0 | DONE |
| 2 | M2: Allied Reinforcements with Roles & UI | `src/game/Helper.ts`, `src/game/GameManager.ts`, `src/components/game-canvas.tsx` | M0 | DONE |
| 3 | M3: Barricade Saboteurs & Repair Mechanics | `src/game/Barricade.ts`, `src/game/Enemy.ts`, `src/game/GameManager.ts` | M0, M2 | IN_PROGRESS |
| 4 | M4: Dual-Track Verification, E2E Suites & Git Sync | `tests/`, Playwright runner, pre-commit build & push | M1, M2, M3 | PLANNED |

---

## Interface Contracts

### GameManager ↔ Background & Threat State
- `GameManager.BIOMES: readonly BiomeTheme[]`: Static array of 5 aquatic/cosmic biomes.
- `GameManager.getCurrentBiome(): BiomeTheme`: Returns active biome based on `Math.floor((level - 1) / 10)`.
- `GameManager.getThreatState(): ThreatState`: Returns `{ level: ThreatLevel, threatColor: string, threatIntensity: number }`.
- `Enemy.isBoss: boolean`: Public getter returning `this.type === EnemyType.BOSS`.
- `Enemy.isElite: boolean`: Public getter returning `isMidTier || type === EnemyType.SNIPER || ...`.

### Helper ↔ Roles & UI
- `HelperType`: Preserves `FIGHTER = 0`, `REPAIRER = 1`, `TANK = 2`; adds `MEDIC = 3`.
- `Helper.update(deltaTime, barricades, enemies, bullets, player)`: Receives `player` reference for Medic healing and buffs.
- `Helper.draw(ctx)`: Renders vector chassis, 38x5px health bar, and role badge pill with black stroke outline.
- `GameManager.triggerMassiveAlliedReinforcements()`: Spawns full strike squadron (2 Fighters, 1 Medic, 1-2 Repair Bots) with hyperspace warp FX.

### Barricade ↔ Saboteur & Repair Bot
- `EnemyType.SABOTEUR = 13`: Siege invader seeking central stone barricades (index 1 & 2).
- `Barricade.update(deltaTime)`: Synchronizes both block destruction (on damage) and block reconstruction (on repair).
- `GameManager.restoreBarricades()`: Fully restores all 4 barricade slots and 24 voxel blocks at `startNextWave()`.

---

## Code Layout
- `src/game/Entity.ts`: Base entity class with AABB and Continuous Collision Detection (CCD).
- `src/game/Barricade.ts`: Voxel grid barricade representation, block destruction & reconstruction.
- `src/game/Bullet.ts`: Projectile class and `HomingMissile extends Bullet` (with `ignoreBarricades = true`).
- `src/game/Player.ts`: Player ship state, controls, primary weapons, homing missile pod.
- `src/game/Enemy.ts`: Enemy state, AI, Saboteur gnaw logic, procedural vector art.
- `src/game/Helper.ts`: Allied units, roles (Fighter, Medic, Repair Bot), overhead health bars and role badges.
- `src/game/GameManager.ts`: Game loop, wave spawning, dynamic biomes, threat signifiers, massive reinforcements, collision resolution.
- `src/components/game-canvas.tsx`: React wrapper, HUD overlays, Squadron Status HUD, Reinforcement banner.
- `tests/`: Playwright E2E integration test suites.
