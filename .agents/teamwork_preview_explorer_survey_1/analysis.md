# Water Invader Codebase & Gameplay Engine Deep Survey

## 1. Executive Summary
This document provides a comprehensive technical breakdown of the Water Invader codebase (`C:\src\SpaceInvader`) for the **Endless Survival Stress Test** project. It details the game state architecture, entity lifecycle, key bindings, DOM/canvas interactions, weapon/shop upgrade mechanics, skill execution (Ultimate 'E', Ally 'Q'), currency economies, wave scaling formulas, and the design specification for an automated Playwright bot harness.

---

## 2. Codebase Architecture & Tree Structure

```
C:\src\SpaceInvader
├── package.json                   # Next.js 16.3.1, React 19.2.8, Playwright 1.62.1, TailwindCSS 4
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout with metadata and viewport
│   │   ├── page.tsx               # Main page rendering <GameCanvas />
│   │   └── globals.css            # Tailwind & font styling
│   ├── components/
│   │   └── game-canvas.tsx        # React client component, HUD, Shop modal, mobile controls, window.gameManager exposure
│   └── game/
│       ├── types.ts               # Vector2D, Size, Rect, GameState (MENU, PLAYING, GAME_OVER)
│       ├── Entity.ts              # Abstract base class: position, velocity, size, AABB checkCollision()
│       ├── Player.ts              # Player stats, multiShot (1~5 spread), fireRate, suppression/stress, i-frames, draw()
│       ├── Enemy.ts               # 7 Enemy types, movement patterns, evasion, diving, shield regen, targeted shooting
│       ├── Bullet.ts              # Projectiles (Player/Enemy), velocity, damage, piercing, isInterceptable, near-miss
│       ├── Barricade.ts           # Destructible (ice, 20 HP, voxel grid) & Indestructible (stone, 1 HP)
│       ├── Helper.ts              # Summoned allies: FIGHTER (DPS), REPAIRER (Barricade heal), TANK (Bullet absorption)
│       ├── Particle.ts            # Explosion & splash visual particles with gravity and alpha decay
│       ├── SoundManager.ts        # Web Audio API procedural synthesis with disconnect cleanup & mute toggle
│       └── GameManager.ts         # Central game loop, physics, collision detection, wave progression, shop, cheats
└── tests/
    ├── 01_ui_and_controls.spec.ts # Playwright UI & control interaction tests
    ├── 03_game_mechanics.spec.ts  # Game engine state simulation & mechanics verification
    ├── 04_multiwave_progression.spec.ts # Multi-wave & Boss progression tests
    ├── benchmark/
    │   ├── bot_heuristics.ts      # 1D Potential Field Raymarching AI
    │   ├── automated_runner.spec.ts # Playwright automated multi-run benchmark runner
    │   └── telemetry_collector.ts # Statistics engine (survival time, CI95, accuracy, kill breakdown)
    └── stress_m1.ts               # Adversarial headless node stress test suite
```

---

## 3. Game State & Control Specifications

### 3.1 State Exposure & Access Points
- **Window Binding (`src/components/game-canvas.tsx:94`)**:
  ```ts
  (window as any).gameManager = game;
  ```
  Allows Playwright `page.evaluate()` or in-browser bot scripts to directly read/write game engine state.

### 3.2 Game State Variables (`GameManager.ts`)
| Variable | Type | Default / Range | Description |
|---|---|---|---|
| `state` | `GameState` | `'MENU'`, `'PLAYING'`, `'GAME_OVER'` | Current game lifecycle state |
| `player` | `Player` | Object | Player instance with position, health, weapons, and gauges |
| `player.position` | `{x, y}` | `x: 275, y: 740` | Logical coordinates (Canvas: 600x800) |
| `player.speed` | `number` | `300` px/s | Horizontal movement speed |
| `player.hp` | `number` | `3` (Max `5`) | Player current health points |
| `player.baseFireRate` | `number` | `0.5` -> `0.1`s | Cooldown interval between shots |
| `player.multiShot` | `number` | `1` to `5` | Number of simultaneous projectiles fired |
| `player.piercing` | `number` | `1` to `99` | Number of enemies a single bullet can penetrate |
| `player.ultimateGauge`| `number` | `0` to `100` | Heavy Rain ultimate skill charge percentage |
| `player.invincibilityTimer`| `number` | `0` to `1.0`s | Invincibility frame duration after taking damage |
| `player.stressLevel` | `number` | `0` to `100` | Boosts fire rate (up to 3x) when high |
| `player.suppressionLevel`| `number` | `0` to `100` | Adds bullet spread variance when suppressed |
| `enemies` | `Enemy[]` | Array | Active enemy entities |
| `bullets` | `Bullet[]` | Array | Active player and enemy bullets |
| `barricades` | `Barricade[]`| 4 elements | Barricades positioned at Y=650 |
| `helpers` | `Helper[]` | Array | Active summoned ally helpers |
| `particles` | `Particle[]`| Array | Active visual explosion particles |
| `currency` | `number` | `0` (💧) | Pure Water collected from enemy kills |
| `score` | `number` | `0` | Player game score |
| `combo` | `number` | `0` | Kill streak counter (resets after 2.0s inactivity) |
| `level` | `number` | `1`...N | Current wave level |
| `isResting` | `boolean` | `false`/`true` | Wave clear rest state (3.0s duration) |
| `waveRestTimer` | `number` | `0` to `3.0`s | Countdown until next wave spawns |
| `isDebugMode` | `boolean` | `false` | Hitbox visualization overlay (F3) |
| `isGodMode` | `boolean` | `false` | Damage immunity (F4) |

---

## 4. Key Bindings, Input Handling & Cheats

```
User Input Handling Tree:
├── Keyboard Listeners (window 'keydown' / 'keyup')
│   ├── Movement:
│   │   ├── 'ArrowLeft' / 'a'   ──> player.isMovingLeft = true/false (vx = -300)
│   │   └── 'ArrowRight' / 'd'  ──> player.isMovingRight = true/false (vx = +300)
│   ├── Combat:
│   │   ├── 'Space' / ' '       ──> player.isShooting = true/false (fire bullets on fireTimer <= 0)
│   │   ├── 'e' / 'Shift'       ──> GameManager.triggerUltimate() (Heavy Rain, requires ultimateGauge >= 100)
│   │   └── 'q'                 ──> GameManager.triggerSummonAlly() (Summons helpers, requires currency >= 50)
│   └── Developer Cheats:
│       ├── 'F3'                ──> Toggle isDebugMode (FPS, Entity Counts, Hitboxes)
│       ├── 'F4'                ──> Toggle isGodMode (Invulnerability)
│       └── 'F5'                ──> Add 1000 Pure Water (currency += 1000)
├── Touch / Pointer Controls (Canvas & Buttons)
│   ├── Canvas PointerDown/Move ──> Calculate targetX, set isMovingLeft/Right & isShooting = true
│   ├── ALLY(Q) Button          ──> Dispatches 'q' touch start/end
│   ├── ULT Button              ──> Dispatches 'e' touch start/end
│   └── FIRE! Button            ──> Dispatches ' ' touch start/end
```

---

## 5. Skills & Shop Upgrade Mechanics

### 5.1 Ultimate Skill: Heavy Rain ('E')
- **Gauge Generation**: `handleEnemyKill()` adds `+1.5%` per enemy killed. (~67 kills for full 100%).
- **Activation (`GameManager.ts:801-818`)**:
  - Requires `player.ultimateGauge >= 100`.
  - Resets gauge to 0.
  - Spawns **30 downward-traveling player bullets** at `Y = -20`:
    - `speedY = 300` px/s
    - `damage = 10`
    - `piercing = 3`
    - `velocity.x = (Math.random() - 0.5) * 50`
  - Screenshake: `0.5s` duration.

### 5.2 Ally Summoning ('Q')
- **Cost**: `50 💧` Pure Water.
- **Activation (`GameManager.ts:789-798`)**:
  - Requires `currency >= 50`.
  - Deducts 50 currency.
  - Triggers reinforcement warning (`warningTimer = 2.0s`, `warningMessage = "ALLY SUPPORT SUMMONED!"`).
  - Spawns 1 to 3 random helpers at player line (`Y = 720`):
    1. **FIGHTER** (Green, 3 HP, targeted firing at lowest enemy every 0.3s with 2-damage bullets).
    2. **REPAIRER** (Yellow, 1 HP, Invincible, 8s lifespan, moves to lowest HP barricade and regenerates blocks).
    3. **TANK** (Purple, 15 HP, 20s lifespan, moves horizontally to intercept incoming enemy bullets).

### 5.3 Shop Upgrades & Currency Mechanics
- **Currency Gain**: `Pure Water 💧 = Math.floor(5 * (1 + Math.floor(combo / 5) * 0.5))` per kill.
- **Available Upgrades**:
  1. **Fire Rate Upgrade** (`upgradeFireRate()`):
     - Cost: `50 💧`
     - Effect: `player.fireRate = Math.max(0.1, player.fireRate - 0.1)`
     - Levels: Lv 1 (0.5s) -> Lv 2 (0.4s) -> Lv 3 (0.3s) -> Lv 4 (0.2s) -> Lv 5 (0.1s - MAX).
  2. **Multi-Shot Upgrade** (`upgradeMultiShot()`):
     - Cost: `100 💧`
     - Effect: `player.multiShot++` (Max 5).
     - Spread geometry:
       - Lv 1: 1 center projectile
       - Lv 2: 2 parallel projectiles (+/- 20 px)
       - Lv 3: 3 projectiles (angles: -10°, 0°, +10°)
       - Lv 4: 4 projectiles (angles: -15°, -5°, +5°, +15°)
       - Lv 5: 5 projectiles (angles: -20°, -10°, 0°, +10°, +20°)
  3. **Piercing Upgrade** (`upgradePiercing()`):
     - Cost: `200 💧`
     - Effect: `player.piercing++` (Penetrates through multiple enemies without disappearing).
- **Execution Timing**:
  - UI Shop is available on Game Over screen.
  - Direct API calls (`gameManager.upgradeFireRate()`, `gameManager.upgradeMultiShot()`, `gameManager.upgradePiercing()`) can be triggered **in real-time during active gameplay** by automated bots as soon as currency thresholds are met.

---

## 6. Wave Progression & Enemy Scaling Formulas

```
Wave Scaling Architecture:
├── Wave Classification
│   ├── Non-Boss Waves (level % 5 !== 0)
│   │   ├── Grid Dimensions:
│   │   │   ├── Rows = 3 + floor(level / 4)
│   │   │   └── Cols = 6 + floor(level / 3)
│   │   ├── Enemy Types:
│   │   │   ├── NORMAL (HP = 1 + floor(level/3), speedX = 30 + level*5, speedY = 8)
│   │   │   ├── ZIGZAG (Row 1 col % 2 == 0; speedX = 80 + level*10, sine wave X oscillation)
│   │   │   ├── SNIPER (Purple, targeted 400px/s interceptable bullet)
│   │   │   ├── DIVER (Red, 6x vertical dive acceleration when above player)
│   │   │   ├── SHIELDED (Slate, 3 HP energy shield with 5.0s cooldown regen)
│   │   │   └── SPLITTER (Green, splits into 2 mini-enemies upon death)
│   │   └── Dynamic Speed Rush Multiplier:
│   │       └── speedMultiplier = min(1.8, max(1.0, 1.0 + (20 - min(20, enemies.length)) * 0.04))
│   └── Boss Waves (level % 5 === 0; e.g. Wave 5, 10, 15, 20...)
│       └── BIO-MECH TITAN:
│           ├── Spawn: X = 225, Y = 90, Size = 150x100
│           ├── HP Formula = level * 10 (Wave 5: 50 HP, Wave 20: 200 HP)
│           ├── Rapid Firing: fireTimer = 0.5s to 3.5s, bulletSpeed = 300 px/s
│           └── Top HUD Boss HP Bar (drawBossHpBar)
└── Wave Clear Transition:
    ├── Inactivity check (enemies.length === 0 && warningTimer <= 0)
    ├── Rest State: isResting = true, waveRestTimer = 3.0s
    └── level++ ──> spawnWave()
```

---

## 7. Playwright Bot & Harness Design for Deep Survival

### 7.1 Bot Decision Pipeline
```
[Perception Extraction] (16ms interval / requestAnimationFrame)
  │── Read: player (x, y, hp, gauge, fireRate, multiShot, piercing)
  │── Read: enemyBullets (x, y, vx, vy, isInterceptable)
  │── Read: activeEnemies (x, y, type, hp, isDiving)
  │── Read: barricades (x, y, hp, type)
  │── Read: economy (currency, level, score)
  ▼
[1D Potential Field Raymarching Engine]
  │── Evaluate candidate X positions [0..550] with step = 5px
  │── For each candidate X:
  │     ├── 1. Bullet Threat: TTI = (playerY - bulletY) / bulletVy
  │     │      ├── Barricade Shadowing: Stone (0.02x threat), Ice (0.2x threat)
  │     │      └── DangerScore = sum( timeUrgency * spatialWeight * shadowMultiplier )
  │     ├── 2. Diver Threat: Heavy exponential penalty if under diving trajectory
  │     ├── 3. Offensive Cost: Distance to priority enemy target (Diver > low Y > Sniper > Boss)
  │     ├── 4. Movement Inertia Cost: Distance to current player X
  │     └── 5. Edge Wall Penalty: Heavy repulsion within 30px of boundaries
  ▼
[Action Dispatcher]
  │── Movement: Set player.isMovingLeft / isMovingRight towards bestCandidateX
  │── Continuous Firing: Set player.isShooting = true
  │── Skill Execution:
  │     ├── If ultimateGauge >= 100 & (enemyCount >= 4 || bossPresent) ──> triggerUltimate()
  │     └── If currency >= 50 & (enemyCount >= 8 || enemyY > 450) ──> triggerSummonAlly()
  │── Automated Shop Upgrades:
  │     ├── If currency >= 50 & fireRate > 0.1 ──> upgradeFireRate()
  │     ├── If currency >= 100 & multiShot < 5 ──> upgradeMultiShot()
  │     └── If currency >= 200 & piercing < 5 ──> upgradePiercing()
  ▼
[Telemetry Logging]
  └── Record FPS, wave history, damage taken, memory/node usage
```

### 7.2 Performance & Node Limit Safeguards
1. **Audio Node Limits**: In long-running stress tests with max fire rate (0.1s) and 5-way multi-shot, sound synthesis creates hundreds of audio nodes. Playwright harness must toggle mute (`soundManager.isMuted = true` or `soundManager.toggleMute()`) during endurance runs to eliminate Web Audio buffer overhead.
2. **Entity Pruning**: Verify that `bullets.filter` and `particles.filter` maintain `< 500` active entities even under heavy bullet storms.
