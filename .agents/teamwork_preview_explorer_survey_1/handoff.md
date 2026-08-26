# Survey Explorer 1: Water Invader Entity Hierarchy, Combat/Collision & Faction Hostility Handoff Report

## 1. Observation

Direct inspection of `/Users/a7111/src/water-invader/src/game/` and related test suites revealed the following exact mechanics, entity structures, combat pipelines, and faction affiliations:

### 1.1 Entity Hierarchy & Data Models
- **Abstract Base Class (`src/game/Entity.ts:3-39`)**:
  - Properties: `position: Vector2D` (`{ x, y }`), `velocity: Vector2D`, `size: Size` (`{ width, height }`), `isDead: boolean = false`, `color: string = '#ffffff'`.
  - Methods: `getRect(): Rect` returning `{ x, y, width, height }`; `checkCollision(other: Entity): boolean` performing AABB bounding-box intersection check.
- **Player Entity (`src/game/Player.ts:4-289`)**:
  - Subclass of `Entity`. Size: `50 x 40` px. Clamped horizontally in `[0, canvasWidth - 50]` (X=0..550 in 600w canvas).
  - Combat Stats: `hp = 3` (max 5), `baseFireRate = 0.5s` (upgradeable to 0.1s), `multiShot = 1` (upgradeable to 5), `piercing = 1` (upgradeable to 5), `ultimateGauge = 0..100`.
  - Dynamic Mechanics: `suppressionLevel` (0..100, adds up to ±150px/s horizontal spread, decays 15/s), `stressLevel` (0..100, increases fire rate up to 3x, decays 10/s), `invincibilityTimer` (1.0s i-frames on hit), `hitFlashTimer` (0.08s white flash).
  - Multi-Shot Firing (`Player.fire()`):
    - Multi-shot 1: single center bullet (`vy = -400`).
    - Multi-shot 2: 2 parallel bullets (`vy = -400`, `vx = ±20`).
    - Multi-shot 3: 3 angled bullets at angles `[-10°, 0°, 10°]`.
    - Multi-shot 4: 4 angled bullets at `[-15°, -5°, 5°, 15°]`.
    - Multi-shot 5: 5 angled bullets at `[-20°, -10°, 0°, 10°, 20°]`.
- **Allies / Helpers (`src/game/Helper.ts:7-193`)**:
  - Subclass of `Entity`. Managed in `GameManager.helpers: Helper[]`. Size: `40 x 30` px.
  - Three distinct helper types (`enum HelperType`):
    1. `FIGHTER (0)`: Green (`#4ade80`), HP: 3, `isInvincible: false`, lifespan 15s. AI selects enemy with lowest Y and moves to align X, firing bullets (`speedY = -500`, `damage = 2`, `isPlayerBullet = true`, `piercing = 1`) every 0.3s.
    2. `REPAIRER (1)`: Yellow (`#fbbf24`), HP: 1, `isInvincible: true`, lifespan 8s. AI finds lowest HP barricade and repairs destroyed voxel blocks (+5 HP, 50% chance/frame).
    3. `TANK (2)`: Purple (`#a855f7`), HP: 15, `isInvincible: false`, lifespan 20s. AI tracks lowest Y enemy bullet (`!b.isPlayerBullet`) and aligns horizontally to absorb it.
- **Enemies (`src/game/Enemy.ts:5-366`)**:
  - Subclass of `Entity`. Managed in `GameManager.enemies: Enemy[]`. Default size: `40 x 30` px.
  - Seven enemy types (`enum EnemyType`):
    1. `NORMAL (0)`: Orange (`#f97316`), standard patrol + downward step.
    2. `ZIGZAG (1)`: Yellow (`#eab308`), fast `speedX` + sine-wave oscillation (`sin(Date.now() / 200) * 5`).
    3. `BOSS (2)`: Dark Red (`#dc2626`), large hitbox (`150 x 100` px), `hp = level * 10`, fast firing (`0.5s~3.5s`), HUD boss HP bar.
    4. `SNIPER (3)`: Purple (`#a855f7`), slow, fires angled interceptable projectile directly towards `playerPos` (`speed = 400`, `isInterceptable = true`).
    5. `DIVER (4)`: Red (`#ef4444`), detects player directly beneath (`|diverX - playerX| < 25 && playerY > diverY`), dives vertically at `diveSpeed = max(280, speedY * 35)`.
    6. `SHIELDED (5)`: Slate (`#64748b`), `shieldHp = 3` absorbing damage; when broken, triggers 5.0s `shieldRegenTimer`.
    7. `SPLITTER (6)`: Green (`#22c55e`), size `50 x 40` px. On death, spawns two mini enemies (`20 x 20` px, `NORMAL` type, `vx = ±10`).
  - Evasion (`canEvade`): Detects incoming player bullet within 250px Y and reverses direction (`evadeCooldown = 1.5s`).
- **Projectiles / Bullets (`src/game/Bullet.ts:3-71`)**:
  - Subclass of `Entity`. Managed in `GameManager.bullets: Bullet[]`.
  - Properties: `damage: number`, `isPlayerBullet: boolean`, `piercing: number`, `isInterceptable: boolean = false`, `hasTriggeredNearMiss: boolean = false`, `hitEntities: Set<Entity>`, `hitEntityIds: Set<string>`.
- **Barricades (`src/game/Barricade.ts:3-75`)**:
  - Subclass of `Entity`. Managed in `GameManager.barricades: Barricade[]`. Size: `60 x 40` px. Voxel grid: 6 cols x 4 rows (24 blocks).
  - `DESTRUCTIBLE (0)` (ice, 20 HP) degrades voxel blocks proportionally to HP. `INDESTRUCTIBLE (1)` (stone, 1 HP) impenetrable.
- **Particles (`src/game/Particle.ts:3-68`)**:
  - Visual explosion particles, pooled in `GameManager.particlePool` up to 500 instances.

---

### 1.2 Combat & Collision System
- **Shooting Mechanisms**:
  - Player Firing: Driven by `Player.update()` -> `Player.fire()`, producing 1~5 player bullets with `isPlayerBullet = true`.
  - Ultimate Heavy Rain (`GameManager.triggerUltimate()`): Triggered by `E`/`Shift` when `ultimateGauge >= 100`. Drops 30 piercing player bullets (`y = -20, speedY = 300, damage = 10, piercing = 3, isPlayerBullet = true`).
  - Ally Fighter Firing: Produces bullets with `damage = 2, speedY = -500, isPlayerBullet = true, piercing = 1`.
  - Enemy Firing: `Enemy.fire(playerPos)` produces `Bullet(..., isPlayerBullet = false)`. Sniper creates targeted bullet with `isInterceptable = true`.
- **Collision Pipeline (`GameManager.ts:451-644`)**:
  - `bullet.isPlayerBullet === true`:
    1. Check Barricades: Bullet dies, destructible barricade loses `bullet.damage`.
    2. Check Interceptable Enemy Bullets: If enemy bullet has `isInterceptable === true`, both bullets destroy each other with particle sparks.
    3. Check `this.enemies`: Bullet hits enemy -> `bullet.piercing--` (dies if `<= 0`), damages `shieldHp` or `enemy.hp`. If `enemy.hp <= 0`, enemy dies, spawns splitters (if applicable), calls `handleEnemyKill()` (+combo, +score, +currency, +ultimateGauge, +stress).
  - `bullet.isPlayerBullet === false` (Enemy Bullet):
    1. Check Barricades: Bullet dies, destructible barricade loses HP.
    2. Check `this.helpers`: Bullet dies, damages helper HP (unless invincible).
    3. Check `this.player`: Bullet dies, player loses `bullet.damage` HP (if not god mode and i-frames <= 0), triggers `invincibilityTimer = 1.0s`, `stressLevel += 40`, `suppressionLevel += 20`, combo resets to 0. If `player.hp <= 0`, game over.
    4. Near-Miss: If enemy bullet passes within 80px horizontal of player, increases `suppressionLevel += 15` and `stressLevel += 5`.
  - Enemy vs Player & Defense Line (`GameManager.ts:326-374`):
    - Direct collision with player: Boss loses 10 HP; non-boss dies. Player loses 1 HP, gains +40 stress, combo resets.
    - Breach (`enemy.position.y + enemy.size.height >= logicalHeight`): Enemy despawns, player takes 1 HP penalty, combo resets.
  - Enemy vs Barricade (`GameManager.ts:618-643`):
    - Diver crashes: enemy dies, destructible barricade takes 20 crash damage.
    - Other enemies: `isGnawing = true` (speed drops to 0.2x), destructible barricade takes 0.1 HP/frame. Indestructible clamps enemy Y above barricade.

---

### 1.3 Faction Hostility & Targeting
- **Binary Faction Representation**:
  - Faction 1: Player & Allies (`GameManager.player`, `GameManager.helpers: Helper[]`, `bullet.isPlayerBullet = true`).
  - Faction 2: Invaders (`GameManager.enemies: Enemy[]`, `bullet.isPlayerBullet = false`).
- **Friendly Fire & Collision Exclusions**:
  - Player bullets NEVER collide with Player or Helpers.
  - Enemy bullets NEVER collide with Enemies.
  - Enemies NEVER collide with each other.
- **Targeting Implementations**:
  - Helper Fighter: Targets enemy with lowest Y (`bestEnemy = enemies.find(lowestY)`).
  - Helper Repairer: Targets barricade with lowest HP (`bestBarricade = barricades.find(lowestHp)`).
  - Helper Tank: Targets enemy bullet with lowest Y (`bullets.find(!isPlayerBullet && lowestY)`).
  - Enemy Sniper: Targets player center `(playerPos.x + 25, playerPos.y + 20)`.
  - Enemy Diver: Triggers when player center is within 25px horizontal and below enemy.
  - Enemy Evasion: Evades bullets where `b.isPlayerBullet && b.position.y > enemy.y && |dx| < width + 10`.

---

## 2. Logic Chain

1. **Current Two-Faction Coupling (Obs 1.1, 1.2, 1.3)**:
   - Bullet ownership and faction hostility are hardcoded using a single boolean flag `isPlayerBullet: boolean`.
   - Entity collections are split into two distinct arrays: `this.player` + `this.helpers` vs `this.enemies`.
2. **Requirement for Third Faction (`ORIGINAL_REQUEST.md`)**:
   - The user requested a 3-way battle system: Player/Allies vs. Enemies vs. Third Faction.
   - The Third Faction must act independently and be hostile to **both** Player/Allies and Original Enemies.
3. **Architectural Gap & Solution**:
   - Boolean `isPlayerBullet` cannot represent a 3-way relationship.
   - **Solution**: Replace `isPlayerBullet` with a generalized `faction: Faction` enum (`PLAYER`, `ENEMY`, `THIRD`).
   - Implement a symmetric hostility predicate `isHostile(f1: Faction, f2: Faction): boolean` returning `true` whenever `f1 !== f2`.
   - Generalize the collision loop in `GameManager.checkCollisions()` so any projectile damages any entity for which `isHostile(projectile.faction, target.faction)` is true.
   - Update AI targeting in `Helper.ts` and `Enemy.ts` to query all hostile entities across factions rather than hardcoded single arrays.
4. **Dynamic Reinforcements Gap & Solution (Obs 1.1, GameManager.ts:277-314)**:
   - Current reinforcement system is a basic 10-20s timer spawning either 4 zigzags or 1-3 helpers.
   - **Solution**: Introduce a dynamic reinforcement director capable of spawning diverse compositions of Original Enemies and Third Faction units (with distinct visual themes, movement vectors, and attack styles) on unpredictable schedules.

---

## 3. Caveats

1. **Backward Compatibility with Existing Tests**: Existing tests in `tests/` check `bullet.isPlayerBullet === true` or filter by `b.isPlayerBullet`. When refactoring `Bullet`, maintaining a getter `get isPlayerBullet(): boolean { return this.faction === Faction.PLAYER; }` ensures zero regressions in existing test suites.
2. **Audio Leak Prevention**: Procedural audio generation in `SoundManager` should remain guarded or muted during heavy multi-bot stress tests.
3. **No Direct Code Changes**: In accordance with the Explorer archetype rules, no production source code has been edited during this survey.

---

## 4. Conclusion

The Water Invader codebase has a clean, modular object-oriented architecture (`Entity` base class, discrete `Player`, `Enemy`, `Helper`, `Bullet`, `Barricade`, and `GameManager` engine). 

Upgrading the game to a **3-Way Battle System** with **Dynamic Reinforcements** requires 4 focused interventions:
1. **Faction Model**: Add `enum Faction { PLAYER, ENEMY, THIRD }` and `faction` property to `Entity` and `Bullet`.
2. **Hostility & Collision Engine**: Centralize `isHostile()` and generalize `checkCollisions()` to resolve 3-way interactions (Player vs Enemy, Player vs 3rd, Enemy vs 3rd).
3. **Multi-Target AI & Third Faction Entity**: Generalize Fighter/Tank/Sniper/Diver AI targeting and create distinct Third Faction entities (e.g. Rogue Drones / Outlaws / Pirate vessels).
4. **Dynamic Reinforcement Spawner**: Replace fixed reinforcement timer with an unpredictable multi-faction wave/reinforcement director.

---

## 5. Verification Method

To independently verify the observations and validate the codebase:

1. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   *Expected result*: Clean exit code 0, 0 TypeScript errors.

2. **Core Mechanics & UI Test Suites**:
   ```bash
   npx playwright test tests/03_game_mechanics.spec.ts tests/water-invader.spec.ts
   ```
   *Expected result*: All 9 tests pass cleanly.

3. **Key Source Files to Inspect**:
   - `src/game/types.ts`: `GameState`, `Vector2D`, `Rect`
   - `src/game/Entity.ts`: `Entity` base class and AABB collision logic
   - `src/game/Player.ts`: Player stats, firing geometry, stress/suppression
   - `src/game/Enemy.ts`: 7 Enemy types, evasion, diving, shield logic
   - `src/game/Helper.ts`: Ally helper AI (Fighter, Repairer, Tank)
   - `src/game/Bullet.ts`: Bullet fields (`isPlayerBullet`, `damage`, `piercing`)
   - `src/game/GameManager.ts`: `checkCollisions()`, `update()`, `spawnWave()`, reinforcement timer
