## 2026-09-03T10:53:03Z
Implement Milestone 2 (M2) — Enemy Swarm and 3rd Faction (Mid-Tier Monsters):

1. Types Extension (`src/game/types.ts`):
   - Add new EnemyType enum entries:
     - `ROGUE_GOLIATH = 10`
     - `ROGUE_PHANTOM = 11`
     - `ROGUE_CARRIER = 12`
   - Ensure existing types 0..9 and factions remain fully backward-compatible.

2. Mid-Tier Monster Mechanics & Visuals (`src/game/Enemy.ts`):
   - Properties: `isMidTier: boolean`, `shieldHp: number`, `maxShieldHp: number`, `phaseDashCooldown: number`, `teleportEffectTimer: number`.
   - Archetypes:
     - `ROGUE_GOLIATH` (56x42 px): 35–55 HP post-Wave 10 (15 HP pre-W10), 12–20 shield HP, heavy alternating dual-plasma, EMP shockwave on shield break.
     - `ROGUE_PHANTOM` (48x34 px): 25–40 HP post-Wave 10 (10 HP pre-W10), horizontal Phase Dash (80–120px teleport with cyan afterimages) when taking sustained hits, shedding projectile locks.
     - `ROGUE_CARRIER` (52x40 px): 30–45 HP post-Wave 10 (12 HP pre-W10), 8 shield HP, cluster-split on death deploying 2–3 `ROGUE_DRONE` units.
   - Vector Rendering:
     - Distinct 3rd Faction palette: High-voltage Electric Magenta (`#d946ef`), Neon Lime (`#84cc16`), Ultraviolet (`#c026d3`), Cyan scanning visor.
     - Overhead mini-health bar (`drawHealthBar`): 40x4px container with shield overlay and health ratio gradient (Lime -> Yellow -> Red).
   - 3-Way AI Targeting & Friendly Fire:
     - For `Faction.ROGUE`: detects nearest hostile among Player and living `Faction.INVADER` enemies, aiming at whichever is closer.
     - Line-of-sight friendly-fire suppression: skips fire and performs lateral tactical slide if an allied Rogue is directly in the shot path.

3. Wave Scaling & Swarm Management (`src/game/GameManager.ts`):
   - Post-Wave 10 Grid Expansion:
     - For `this.level >= 10`: expand grid to 5–6 rows and 8–10 cols (50–60 initial units), compacted in Y in [80, 290] and X in [20, 580].
     - Naturally spawn 2–4 mid-tier Rogue monsters (`ROGUE_GOLIATH`, `ROGUE_PHANTOM`, `ROGUE_CARRIER`) in the wave.
     - Wave 7–9: naturally spawn 1–2 mid-tier Rogues for early introduction.
   - Dynamic Swarm Streaming Echelons:
     - Track `swarmEchelonsRemaining: number`.
     - In `startNextWave()`: For `this.level >= 10`, set `swarmEchelonsRemaining = this.level >= 15 ? 2 : 1;`.
     - In `update()` / `checkCollisions()`: when active hostile count (`invaderCount + rogueCount`) drops <= 18 and `swarmEchelonsRemaining > 0`:
       - Stream in a secondary swarm formation (10–14 units: fast divers, zigzags, and 1 mid-tier monster).
       - Decrement `swarmEchelonsRemaining--`.
       - Total wave casualties scale to 70–90+ enemies!
   - Population Safety Cap:
     - Strictly clamp active concurrent enemies to <= 70 units. If active enemies >= 60, delay pending echelons/reinforcements until count drops < 45.
   - Wave 5 Solitary Boss Invariant:
     - Wave 5 MUST strictly spawn exactly 1 boss and 0 minions/mid-tiers (`totalEnemies === 1`).
   - Cluster-split handling in `checkCollisions()`:
     - When `ROGUE_CARRIER` dies, spawn 2–3 `ROGUE_DRONE` units with outward velocity bursts.
   - Crossfire Kills:
     - Ensure crossfire kills trigger `handleCrossfireKill()` (+150 score, +8 water, +2% ult).

4. Verification:
   - Run `npx tsc --noEmit` and `npm run build` (0 errors).
   - Run `npx playwright test tests/unit/enemy_swarm.test.ts` (6/6 passing).
   - Run `npx playwright test tests/16_enemy_swarm_and_third_faction.spec.ts` (5/5 passing).
   - Run regression test: `npx playwright test tests/04_multiwave_progression.spec.ts`.
   - Write completion report to `/Users/user/src/water-invader/.agents/worker_lg_m2_enemies/handoff.md` and report back.
