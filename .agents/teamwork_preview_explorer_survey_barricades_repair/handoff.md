# Handoff Report: Requirement R3 — Barricade Saboteurs & Repair Mechanics Survey

## 1. Observation
- **Barricade Data Model & Layout (`src/game/Barricade.ts:8-26`, `src/game/GameManager.ts:255-266`)**:
  - `Barricade` extends `Entity` with `size = { width: 60, height: 40 }`.
  - Grid resolution: 6 columns $\times$ 4 rows = 24 boolean voxel blocks (`this.blocks: boolean[]`).
  - Barricades are created at $y = \text{logicalHeight} - 150 = 810\text{px}$ with 150px padding:
    - `barricades[0]`: $x = \text{startX}$, `type = BarricadeType.DESTRUCTIBLE` (0, Ice sky blue `#38bdf8`, `hp = 20`, `maxHp = 20`).
    - `barricades[1]`: $x = \text{startX} + 150$, `type = BarricadeType.INDESTRUCTIBLE` (1, Stone slate `#94a3b8`).
    - `barricades[2]`: $x = \text{startX} + 300$, `type = BarricadeType.INDESTRUCTIBLE` (1, Stone slate `#94a3b8`).
    - `barricades[3]`: $x = \text{startX} + 450$, `type = BarricadeType.DESTRUCTIBLE` (0, Ice sky blue `#38bdf8`, `hp = 20`, `maxHp = 20`).
  - Barricades 1 and 2 are the central defensive barricades protecting the player.
- **Wave Transition Defect (`src/game/GameManager.ts:268-308`)**:
  - `startNextWave()` advances `this.level++`, clears bullets, solar flares, and hazard projectiles, but **does not call `this.spawnBarricades()` or restore barricades**.
  - Barricades damaged or destroyed in Wave 1 remain depleted/absent in all subsequent waves.
- **Voxel Block Asymmetry (`src/game/Barricade.ts:40-58`)**:
  - `Barricade.update()` calculates `targetActiveBlocks = Math.ceil((this.hp / this.maxHp) * 24)` and contains a `while (currentActive > targetActiveBlocks)` loop to randomly turn blocks to `false`.
  - It contains **no reverse loop** to re-activate blocks (`true`) when `this.hp` increases via repair.
- **In-Place Compaction Removal (`src/game/GameManager.ts:1443-1451`)**:
  - If `barricade.hp <= 0`, `isDead` is set to `true`.
  - In `update()`, dead barricades are compacted out of `this.barricades`.
- **Existing Enemy vs Barricade Interaction (`src/game/GameManager.ts:1834-1860`, `src/game/Enemy.ts:314`)**:
  - When non-diver enemies collide with destructible barricades, `enemy.isGnawing = true` and `barricade.hp -= 6.0 * deltaTime`.
  - In `Enemy.ts:314`, `const gnawMultiplier = this.isGnawing ? 0.2 : 1.0;`.
  - Diver enemies kamikaze: `barricade.hp -= 20; enemy.isDead = true`.
  - Non-diver enemies colliding with indestructible barricades are stopped at `enemy.position.y = Math.min(enemy.position.y, barricade.position.y - enemy.size.height)`.
- **Homing Missile Bypass (`src/game/Bullet.ts:175`, `src/game/GameManager.ts:1541`)**:
  - `HomingMissile` has `public ignoreBarricades: boolean = true;`.
  - In `GameManager.ts:1541`, `if (!(bullet as any).ignoreBarricades)` wraps the barricade collision check, allowing homing missiles to fly unimpeded over barricades to strike enemies behind/on them.
- **Existing Helper / Repair Bot (`src/game/Helper.ts:41-47, 92-117`)**:
  - `HelperType.REPAIRER` (1) exists with yellow color `#fbbf24`, `isInvincible: true`, targeting lowest HP barricades.
  - In synergy with R2, allied units will feature visible health bars and clear role identifiers ("Repair Bot", "Medic", "Fighter").
- **Existing Test Assertions (`tests/02_rendering_and_vector_art.spec.ts:171-186`, `tests/adversarial_challenger_m1_2.spec.ts:116-185`)**:
  - `02_rendering_and_vector_art.spec.ts` verifies: `barricadeInfo[1].type === 1`, `barricadeInfo[2].type === 1`, `color === '#94a3b8'`.
  - `adversarial_challenger_m1_2.spec.ts` verifies: Stone barricades take 0 damage from normal enemy types (0, 1, 3, 4, 5, 6).

## 2. Logic Chain
1. From the observation that `barricades[1]` and `barricades[2]` are positioned centrally and classified as `BarricadeType.INDESTRUCTIBLE` (protecting the player from all bullets and regular enemies), requirement R3's mandate for a "Barricade Saboteur" enemy directly addresses attacking the player's core defensive bastion.
2. Because existing tests verify that `barricades[1]` and `barricades[2]` have `type: 1` and take 0 damage from normal enemies, stone barricades must retain `type: BarricadeType.INDESTRUCTIBLE` and standard bullet immunity, but the Saboteur must be granted a specialized fortification-boring mechanic that can erode barricade HP.
3. Because `Barricade.update()` currently only deletes voxel blocks when HP drops and never restores them when healed, any repair mechanic (wave restoration or Allied Repair Bot) would fail to visually restore the voxel barrier without adding the reverse loop `while (currentActive < targetActiveBlocks) { reactivate inactive block; }`.
4. Because `startNextWave()` never re-instantiates or heals barricades, adding `this.restoreBarricades()` in `startNextWave()` guarantees full defensive reset at the start of every wave, fulfilling the primary requirement.
5. Because `HelperType.REPAIRER` already possesses barricade targeting, integrating it with R2's "Repair Bot" role indicator and enhancing its targeting to prioritize damaged central barricades fulfills the second half of R3 with complete gameplay synergy.
6. Because Homing Missiles have `ignoreBarricades = true`, they provide an intentional tactical counterplay: while regular player bullets hit the barricade from below, homing missiles bypass the cover and eliminate the Saboteur.

## 3. Caveats
- **Compaction vs Ghost Barricades**: When a barricade's HP hits 0, `GameManager.ts` compacts `this.barricades` and removes the element. Wave restoration must handle `this.barricades.length < 4` by reconstructing missing barricades at their deterministic spatial coordinates (`spawnBarricades()`).
- **Allied Reinforcement Dependencies**: While the Repair Bot behavior can function via `Helper.ts`, the full role indicator UI ("Repair Bot" text and overhead health bar) is being coordinated with sibling explorer milestone R2 (`teamwork_preview_explorer_survey_allies_ui`). Both designs are fully aligned.
- **Indestructible HP Allocation**: Stone barricades currently have `maxHp: 1`. Setting `maxHp: 20` for stone barricades allows 24-block voxel degradation when attacked by Saboteurs without breaking any existing tests, since no test asserts `barricadeInfo[1].maxHp === 1`.

## 4. Conclusion
The survey for Requirement R3 is complete and thoroughly documented in `survey.md`. The design is fully compatible with existing systems and tests, introduces a high-impact, tactically interesting `BARRICADE_SABOTEUR` enemy (`EnemyType.SABOTEUR = 13`), repairs the long-standing bug of unrespawned barricades via `restoreBarricades()`, empowers the Allied Repair Bot with intelligent prioritized repair, and specifies 5 automated Playwright test scenarios for end-to-end verification.

## 5. Verification Method
- Independent verification commands:
  - `npx tsc --noEmit` (passes with 0 errors)
  - `npx playwright test tests/02_rendering_and_vector_art.spec.ts` (verifies existing barricade layout)
  - `npx playwright test tests/03_game_mechanics.spec.ts` (verifies diver crash & gnawing baseline)
  - `npx playwright test tests/16_homing_missile_combat.spec.ts` (verifies missile barricade bypass)
- Files to inspect:
  - `/Users/user/src/water-invader/.agents/teamwork_preview_explorer_survey_barricades_repair/survey.md`
  - `/Users/user/src/water-invader/src/game/Barricade.ts`
  - `/Users/user/src/water-invader/src/game/GameManager.ts`
  - `/Users/user/src/water-invader/src/game/Enemy.ts`
  - `/Users/user/src/water-invader/src/game/Helper.ts`
