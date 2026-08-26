# Water Invader Entity Hierarchy, Combat/Collision & Faction System Survey

## 1. Executive Summary
This survey provides an in-depth, verified analysis of the Water Invader codebase (`/Users/a7111/src/water-invader`) to inform the design and implementation of the **3-Way Battle System** (Player/Allies vs. Enemies vs. Third Faction) and **Dynamic Reinforcements** (diverse, unpredictable spawns).

---

## 2. Architecture & File Layout

```
/Users/a7111/src/water-invader
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root HTML layout and viewport settings
│   │   ├── page.tsx               # Renders top title and <GameCanvas /> component
│   │   └── globals.css            # Tailwind & theme styling
│   ├── components/
│   │   └── game-canvas.tsx        # React canvas wrapper, HUD, upgrade modal, pointer/keyboard input, window.gameManager
│   └── game/
│       ├── types.ts               # Vector2D, Size, Rect, GameState (MENU, PLAYING, GAME_OVER, SHOP)
│       ├── Entity.ts              # Abstract base class: position, velocity, size, isDead, AABB checkCollision()
│       ├── Player.ts              # Player entity: HP, multiShot, fireRate, suppression/stress, i-frames, draw()
│       ├── Enemy.ts               # 7 Enemy types, movement patterns, evasion, diving, shield regen, shooting
│       ├── Bullet.ts              # Projectiles (Player/Enemy), damage, piercing, isInterceptable, near-miss
│       ├── Barricade.ts           # Destructible (ice, 20 HP, voxel grid) & Indestructible (stone, 1 HP)
│       ├── Helper.ts              # Allies: FIGHTER (DPS), REPAIRER (Barricade heal), TANK (Bullet absorption)
│       ├── Particle.ts            # Explosion & splash visual particles with pooling
│       ├── SoundManager.ts        # Web Audio procedural synthesis
│       └── GameManager.ts         # Central game loop, physics, collision detection, wave progression, shop, cheats
└── tests/
    ├── 01_ui_and_controls.spec.ts # Playwright UI & control interaction tests
    ├── 03_game_mechanics.spec.ts  # Game engine state simulation & mechanics verification
    ├── 04_multiwave_progression.spec.ts # Multi-wave & Boss progression tests
    └── water-invader.spec.ts      # E2E Master Verification Suite
```

---

## 3. Entity Hierarchy & Data Models

All physical entities inherit from the abstract base class `Entity` (`src/game/Entity.ts:3`).

```
                    ┌─────────────────────────┐
                    │    Entity (abstract)    │
                    │ position, velocity, size│
                    │ isDead, color           │
                    │ checkCollision(AABB)    │
                    └────────────┬────────────┘
         ┌───────────────┬───────┴───────┬──────────────┬──────────────┬─────────────┐
         ▼               ▼               ▼              ▼              ▼             ▼
   ┌──────────┐    ┌──────────┐    ┌───────────┐  ┌───────────┐  ┌───────────┐ ┌───────────┐
   │  Player  │    │  Helper  │    │   Enemy   │  │  Bullet   │  │ Barricade │ │ Particle  │
   │ (Single) │    │ (Allies) │    │ (Invaders)│  │(Projectile│  │(Defenses) │ │ (Visuals) │
   └──────────┘    └──────────┘    └───────────┘  └───────────┘  └───────────┘ └───────────┘
```

### 3.1 `Entity` Base Class (`src/game/Entity.ts`)
- **Fields**:
  - `position: Vector2D` ({ x, y })
  - `velocity: Vector2D` ({ x, y })
  - `size: Size` ({ width, height })
  - `isDead: boolean` (default `false`)
  - `color: string` (default `#ffffff`)
- **Core Methods**:
  - `getRect(): Rect`: Returns `{ x, y, width, height }`.
  - `checkCollision(other: Entity): boolean`: Standard Axis-Aligned Bounding Box (AABB) intersection check:
    ```ts
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
    ```
  - `abstract update(deltaTime: number, ...args: any[]): any`
  - `abstract draw(ctx: CanvasRenderingContext2D): void`

### 3.2 `Player` (`src/game/Player.ts`)
- **Dimensions**: `50 x 40` px. Fixed vertical spawn: `canvasHeight - 60` (Y=740 in 800h canvas).
- **Attributes**:
  - `hp: number` (current, default 3), `maxHp: number = 5`
  - `speed: number = 300` px/sec
  - `baseFireRate: number = 0.5` sec/shot (upgradeable down to 0.1s)
  - `multiShot: number = 1` (upgradeable up to 5)
  - `piercing: number = 1` (upgradeable up to 5)
  - `ultimateGauge: number = 0` (0 to 100%, charged by killing enemies at +1.5% per kill)
  - `stressLevel: number = 0` (0 to 100; decreases fire timer by `baseFireRate / (1 + stressLevel / 50)`, decays 10/s)
  - `suppressionLevel: number = 0` (0 to 100; increases horizontal bullet spread up to `±150px/s`, decays 15/s)
  - `invincibilityTimer: number = 0` (1.0s i-frames on damage, flickering visual effect)
  - `hitFlashTimer: number = 0` (0.08s white hit flash)
- **Firing Logic (`Player.fire()`)**:
  - Calculates spread variance based on `suppressionLevel`.
  - Generates 1 to 5 bullets based on `multiShot`:
    - `1`: Single bullet straight up (`vy = -400`).
    - `2`: Twin bullets with slight outward horizontal velocity (`±20px/s`).
    - `3`: Angles `[-10°, 0°, 10°]` with trigonometrically computed `vx = 400 * sin(rad)`, `vy = -400 * cos(rad)`.
    - `4`: Angles `[-15°, -5°, 5°, 15°]`.
    - `5`: Angles `[-20°, -10°, 0°, 10°, 20°]`.

### 3.3 `Helper` (Allies) (`src/game/Helper.ts`)
- **Dimensions**: `40 x 30` px. Managed in `GameManager.helpers: Helper[]`.
- **Types (`enum HelperType`)**:
  - `FIGHTER (0)`: Green (`#4ade80`), HP: 3, `isInvincible: false`, lifespan 15s. AI: Targets closest/lowest enemy Y position, fires bullets (`damage: 2, speedY: -500, isPlayerBullet: true, piercing: 1`) every 0.3s.
  - `REPAIRER (1)`: Yellow (`#fbbf24`), HP: 1, `isInvincible: true`, lifespan 8s. AI: Finds the most damaged barricade, repairs destroyed voxel blocks and restores +5 HP (50% chance per frame).
  - `TANK (2)`: Purple (`#a855f7`), HP: 15, `isInvincible: false`, lifespan 20s. AI: Intercepts incoming enemy bullets (`!b.isPlayerBullet`) by moving into their trajectory.
- **Expiration**: `isExpired(): boolean` returns `true` if `lifespan <= 0` or (`hp <= 0 && !isInvincible`).

### 3.4 `Enemy` (`src/game/Enemy.ts`)
- **Dimensions**: Default `40 x 30` px (`BOSS: 150 x 100`, `SPLITTER: 50 x 40`, `Splitter mini: 20 x 20`).
- **Managed in**: `GameManager.enemies: Enemy[]`.
- **Types (`enum EnemyType`)**:
  1. `NORMAL (0)`: Orange (`#f97316`), standard horizontal movement + downward step, fires straight downward bullet every 1~4s.
  2. `ZIGZAG (1)`: Yellow (`#eab308`), fast `speedX` (`+level*10 + 50`), oscillates horizontally with `sin(time/200)*5`.
  3. `BOSS (2)`: Dark Red (`#dc2626`), large hitbox (150x100), massive HP (`level * 10`), faster fire rate (`fireTimer = 0.5~3.5s`), triggers boss health bar on HUD.
  4. `SNIPER (3)`: Purple (`#a855f7`), slow movement (`speedX = 20`), fires targeted angled bullets aimed at `playerPos` with `speed = 400` and `isInterceptable = true`.
  5. `DIVER (4)`: Red (`#ef4444`), detects player directly below (`|dx| < 25 && playerPos.y > enemy.y`), initiates high-speed dive (`diveSpeed = Math.max(280, currentSpeedY * 35)`). Does not fire while diving.
  6. `SHIELDED (5)`: Slate (`#64748b`), starts with `shieldHp = 3`. Shield absorbs damage first. When shield breaks, triggers 5.0s `shieldRegenTimer`.
  7. `SPLITTER (6)`: Green (`#22c55e`), size 50x40. Upon death, spawns two mini enemies (`20x20` px, `NORMAL` type) diverging left and right (`vx = ±10`).
- **Dynamic Movement & Evasion**:
  - `canEvade: boolean`: When incoming player bullet is within 250px vertical and width+10 horizontal, swerves to opposite direction (`evadeCooldown = 1.5s`).
  - Speed scaling: Enemy horizontal/vertical speed scales smoothly with wave level and inversely with remaining enemy count (multiplier from 1.0x up to 1.8x).

### 3.5 `Bullet` (`src/game/Bullet.ts`)
- **Dimensions**: Player bullets `6 x 12` px; Enemy bullets `10 x 10` px.
- **Fields**:
  - `damage: number`: Base damage inflicted on target (Player bullet: 1, Fighter helper bullet: 2, Ultimate bullet: 10, Enemy bullet: 1).
  - `isPlayerBullet: boolean`: Binary faction flag (true = Player/Ally, false = Enemy).
  - `piercing: number`: Number of enemies/targets the bullet can penetrate before dying (`piercing--` on each collision; dies when `<= 0`).
  - `isInterceptable: boolean`: Flag set on Sniper enemy bullets allowing them to be shot down mid-air by player bullets.
  - `hasTriggeredNearMiss: boolean`: Prevents multiple near-miss suppression triggers on the player per bullet.
  - `hitEntities: Set<Entity>`: Tracks pierced entities to prevent duplicate damage in a single frame.

### 3.6 `Barricade` (`src/game/Barricade.ts`)
- **Dimensions**: `60 x 40` px. Voxel destruction grid: 6 columns x 4 rows (24 blocks).
- **Types**:
  - `DESTRUCTIBLE (0)`: Sky blue (`#38bdf8`), `maxHp = 20`. Voxel blocks disappear proportionally to remaining HP.
  - `INDESTRUCTIBLE (1)`: Slate stone (`#94a3b8`), `maxHp = 1`. Blocks bullets and physically impedes enemies without degrading.

---

## 4. Combat & Collision System

### 4.1 Collision Resolution Pipeline (`GameManager.checkCollisions()`)
Every frame during `GameState.PLAYING`, collision checking executes in sequential phases:

```
[Frame Start: GameManager.checkCollisions()]
   │
   ├─► 1. Bullets vs. Barricades
   │      └─ If bullet.checkCollision(barricade):
   │           - bullet.isDead = true
   │           - If DESTRUCTIBLE: barricade.hp -= bullet.damage
   │
   ├─► 2. IF bullet.isPlayerBullet === true:
   │      ├─► A. Player Bullet vs. Interceptable Enemy Bullets
   │      │      └─ If enemyBullet.isInterceptable && bullet.checkCollision(enemyBullet):
   │      │           - bullet.isDead = true, enemyBullet.isDead = true
   │      │           - Spawn purple spark explosion
   │      │
   │      └─► B. Player Bullet vs. Enemies
   │             └─ For each enemy in this.enemies:
   │                  - If bullet.checkCollision(enemy) && not yet hit:
   │                      * bullet.hitEntities.add(enemy)
   │                      * bullet.piercing--
   │                      * If piercing <= 0: bullet.isDead = true
   │                      * If SHIELDED and shieldHp > 0:
   │                          enemy.shieldHp -= bullet.damage
   │                          (if <= 0: trigger 5s shieldRegenTimer)
   │                      * Else:
   │                          enemy.hp -= bullet.damage
   │                      * If enemy.hp <= 0:
   │                          enemy.isDead = true
   │                          (if SPLITTER: spawn 2 mini-enemies)
   │                          handleEnemyKill() (+combo, +score, +currency, +ultimate, +stress)
   │
   ├─► 3. IF bullet.isPlayerBullet === false (Enemy Bullet):
   │      ├─► A. Enemy Bullet vs. Helpers (Allies)
   │      │      └─ If bullet.checkCollision(helper):
   │      │           - bullet.isDead = true
   │      │           - If not helper.isInvincible: helper.hp -= bullet.damage
   │      │
   │      ├─► B. Enemy Bullet vs. Player
   │      │      └─ If bullet.checkCollision(player):
   │      │           - bullet.isDead = true
   │      │           - If not isGodMode && player.invincibilityTimer <= 0:
   │      │               player.hp -= bullet.damage
   │      │               player.invincibilityTimer = 1.0s
   │      │               player.stressLevel += 40, suppressionLevel += 20
   │      │               combo = 0
   │      │               If player.hp <= 0: gameOver()
   │      │
   │      └─► C. Near-Miss Detection
   │             └─ If bullet passes within 80px horizontal of player:
   │                  player.suppressionLevel += 15, player.stressLevel += 5
   │
   ├─► 4. Enemy vs. Barricade Collision
   │      └─ If enemy.checkCollision(barricade):
   │           - If DIVER: enemy dies, DESTRUCTIBLE takes 20 crash damage
   │           - Else: enemy.isGnawing = true (speed drops to 0.2x), DESTRUCTIBLE takes 0.1 hp/frame
   │           - INDESTRUCTIBLE: clamps enemy Y above barricade top
   │
   └─► 5. Enemy vs. Player & Defense Line Breach (`GameManager.update()`)
          ├─► If enemy.checkCollision(player):
          │      - BOSS: enemy.hp -= 10
          │      - Non-Boss: enemy.isDead = true
          │      - Player takes 1 damage (if i-frames <= 0), +40 stress, combo reset
          └─► If enemy.position.y + enemy.size.height >= logicalHeight (Breach):
                 - enemy.isDead = true
                 - Player takes 1 HP penalty, combo reset
```

---

## 5. Faction Hostility & Targeting Analysis

### 5.1 Current Binary Hostility Model
Currently, the codebase operates strictly on a **2-faction binary model**:

| Entity / Projectile | Current Faction Affiliation | Hardcoded Representation |
|---|---|---|
| `Player` | Player Team | `GameManager.player` |
| `Helper` (Fighter/Repairer/Tank) | Player Team | `GameManager.helpers: Helper[]` |
| Player / Helper Bullets | Player Team | `Bullet.isPlayerBullet = true` |
| `Enemy` (All 7 types) | Enemy Team | `GameManager.enemies: Enemy[]` |
| Enemy Bullets | Enemy Team | `Bullet.isPlayerBullet = false` |

### 5.2 Targeting & Friendly Fire Matrix (Current vs. Target 3-Way)

#### Current Binary Matrix:
| Attacking \ Defending | Player / Allies | Original Enemies | Barricades |
|---|---|---|---|
| **Player / Ally Bullets** | ❌ No friendly fire | ✅ Hits & Damages | ✅ Hits & Damages |
| **Original Enemy Bullets** | ✅ Hits & Damages | ❌ No friendly fire | ✅ Hits & Damages |
| **Original Enemy Body Collision** | ✅ Damages Player / Allies | ❌ No collision between enemies | ✅ Gnaws / Crashes |

#### Required 3-Way Battle Matrix:
| Attacking \ Defending | Player / Allies (Faction A) | Original Enemies (Faction B) | Third Faction (Faction C) | Barricades |
|---|---|---|---|---|
| **Player / Ally Bullets** | ❌ Friendly | ✅ **HOSTILE (Damage)** | ✅ **HOSTILE (Damage)** | ✅ Damages |
| **Original Enemy Bullets** | ✅ **HOSTILE (Damage)** | ❌ Friendly | ✅ **HOSTILE (Damage)** | ✅ Damages |
| **Third Faction Bullets** | ✅ **HOSTILE (Damage)** | ✅ **HOSTILE (Damage)** | ❌ Friendly | ✅ Damages |
| **Body Collision (Enemies / 3rd)** | ✅ Damages Player | ✅ Cross-hostile / Damage | ✅ Cross-hostile / Damage | ✅ Gnaws/Crashes |

---

## 6. Architectural Blueprint for 3-Way Battle & Dynamic Reinforcements

To implement the requirements from `ORIGINAL_REQUEST.md`, the following architectural changes are necessary:

### 6.1 Faction Enum & Entity Tagging
Define a formal Faction system in `src/game/types.ts`:
```ts
export enum Faction {
  PLAYER = 'PLAYER',   // Player and summoned Allies (Helpers)
  ENEMY = 'ENEMY',     // Original Invader army
  THIRD = 'THIRD'      // Independent 3rd Faction (Rogue / Outlaw / Pirate)
}
```
Add `faction: Faction` to `Entity` base class and `Bullet`. Replace boolean `isPlayerBullet` with `faction: Faction` (while maintaining backward compatibility getters if needed).

### 6.2 Universal Hostility Matrix
Create a centralized hostility evaluation function:
```ts
export function isHostile(f1: Faction, f2: Faction): boolean {
  if (f1 === f2) return false; // No friendly fire within same faction
  return true; // True 3-way: all distinct factions are mutually hostile
}
```

### 6.3 Generalized Collision Engine
Refactor `GameManager.checkCollisions()` so that:
1. Every bullet checks all entities in all faction lists (`[this.player, ...this.helpers]`, `this.enemies`, `this.thirdFactionEntities`).
2. If `isHostile(bullet.faction, target.faction)` is `true`, apply damage, piercing, hit flashes, and destruction.
3. Bullets from opposing factions can intercept or collide if interceptable rules apply.

### 6.4 AI Targeting & Evasion Generalization
- **Helper Fighter**: Scans all hostile units (`enemies` and `thirdFaction`), targeting the lowest Y hostile entity.
- **Helper Tank**: Intercepts bullets where `isHostile(Faction.PLAYER, bullet.faction)`.
- **Enemy Units (Sniper/Diver)**: Can target either Player or nearby Third Faction entities.
- **Third Faction AI**: Has distinct behaviors (e.g. flanking, firing broadsides, targeting whichever faction has higher density).

### 6.5 Dynamic Reinforcement Director
Rework `GameManager.reinforcementTimer` from a simple binary zigzag/helper coin flip into a dynamic event director:
- Supports unpredictable multi-faction drop-ins:
  - Third faction pirate skiffs / rogue drones entering from flanks (left/right or diagonal drop).
  - Mixed reinforcement waves where Enemy and Third Faction units spawn simultaneously and immediately engage in combat with each other as well as the player.
  - Dynamic warning banners and audio cues tailored to the arriving faction.

---

## 7. Implementation Complexity & Risk Analysis

| Subsystem | Affected Files | Risk / Complexity | Mitigation Strategy |
|---|---|---|---|
| **Faction Typing** | `src/game/types.ts`, `Entity.ts`, `Bullet.ts` | Low | Introduce `Faction` enum, default to `Faction.PLAYER` / `Faction.ENEMY`. |
| **Collision Matrix** | `src/game/GameManager.ts:checkCollisions()` | Medium | Centralize `isHostile()` predicate so all entity pairs (Player vs 3rd, Enemy vs 3rd) are checked symmetrically. |
| **AI Targeting** | `src/game/Helper.ts`, `src/game/Enemy.ts` | Medium | Update AI loops from single target arrays to multi-faction query filters. |
| **Reinforcements** | `src/game/GameManager.ts:spawnWave()`, `GameManager.ts:update()` | Medium | Create flexible spawn tables with dynamic faction ratios and unpredictable timers. |
| **Existing Test Compatibility** | `tests/*.spec.ts` | Low-Medium | Ensure `isPlayerBullet` getter is maintained or tests updated cleanly. |

