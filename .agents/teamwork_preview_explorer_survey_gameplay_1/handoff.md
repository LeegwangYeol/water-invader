# Water Invader Comprehensive QA & Gameplay Architecture Survey Report
**Target**: Test Bot Infrastructure, Collision Detection, Skills/Ultimate Lifecycle, and Memory/Resource Leaks  
**Working Directory**: `C:\src\SpaceInvader\.agents\teamwork_preview_explorer_survey_gameplay_1`  
**Date**: 2026-08-25  
**Author**: `teamwork_preview_explorer_survey_gameplay_1` (Explorer)

---

## 1. Observation

### 1.1 Test Bot & Telemetry Infrastructure
- **Bot Brain & Evasion Solver** (`tests/stress/swarm_bot_engine.ts` Lines 1-809):
  - `SwarmBotEngine.computeDecision()` executes a 1D Potential Field Raymarching Solver across the horizontal axis (`gridStep: 5px`, `wallMarginWeight: 15.0`, `inertiaWeight: 0.3`, `evasionWeight: 10.0`).
  - Bullet Time-To-Impact (TTI) is computed via `(playerY - bullet.y) / bulletVy` (Lines 313-321).
  - Barricade Shadowing Occlusion (Lines 324-345): INDESTRUCTIBLE stone barricade attenuates threat by `0.02x` (98% occlusion), DESTRUCTIBLE ice barricade by `0.2x` (80% occlusion).
  - Target Selection & Threat Prioritization (Lines 391-445): Diver (4) = +900 priority, Boss (2) = +750, Sniper (3) = +600, Splitter (6) = +450, Shielded (5) = +400; Bottom breach (>500px) = +1500; Horizontal proximity weight = `-0.4 * dist`.
  - Economy Auto-Buyer (`evaluateEconomy()`, Lines 528-597): Evaluates upgrades in strict priority: `Fire Rate (50💧)` -> `Multi-Shot (100💧, cap 5)` -> `Piercing (200💧)`.
  - Skill Dispatch (Lines 630-637): Ultimate (E) triggers when `ultimateGauge >= 100` and (`activeEnemies >= 3 || hasBoss`); Ally (Q) triggers when `currency >= 50` and (`activeEnemies >= 6 || enemy.y > 450`).
- **Real-Time Telemetry & Metric Collector** (`tests/stress/telemetry_stress_collector.ts` Lines 1-1140):
  - In-Page hooks intercept `AudioContext.prototype.createOscillator` and `createGain` (Lines 304-356) to track allocated vs active audio nodes.
  - Memory profiling via `performance.memory` tracking `usedJSHeapSize`, `heapGrowthRateMbPerMin`, and peak heap usage (Lines 617-637).
  - Anomaly Watchdog (Lines 366-390, 674-697): Flags `FRAME_DROP`, `PROJECTILE_OVERLOAD`, `AUDIO_NODE_LEAK`, `NAN_COORDINATE`, `UNHANDLED_ERROR`.
- **Swarm Endurance Runner & Multi-Worker Concurrency** (`scripts/run_swarm_endurance.ts` Lines 1-500 & `tests/stress/endless_survival_swarm.spec.ts` Lines 1-476):
  - Runs headless/headful multi-worker Playwright browser contexts with live terminal dashboard rendering every 1000ms.

---

### 1.2 Collision Detection Systems (`src/game/`)
- **Bounding Box Model** (`src/game/Entity.ts` Lines 28-38):
  - Uses Axis-Aligned Bounding Box (AABB) intersection:
    ```typescript
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
    ```
- **Player Bullets vs Enemies & Bosses** (`src/game/GameManager.ts` Lines 444-499):
  - `bullet.piercing--` is decremented on collision. When `bullet.piercing <= 0`, `bullet.isDead = true`.
  - **Defect Identified (Double Hit / Piercing Depletion Bug)**:
    In lines 447-498, when `bullet.checkCollision(enemy)` succeeds, `bullet.piercing--` is decremented and `break;` is called.
    Because `Bullet` does NOT maintain a `hitEntities: Set<Entity>` or `hitEnemyIds` list, if a piercing bullet moves through a large enemy (e.g. Boss height 100px) or an enemy that doesn't die in 1 hit, the bullet remains intersecting the SAME enemy over multiple frames (e.g. 5-10 frames at 400px/s, ~6.4px per frame). Every frame, `checkCollision` triggers again, consuming another piercing charge and dealing unintended tick damage to the single target rather than piercing through to distinct background enemies.
- **Enemy Bullets vs Player & Barricades** (`src/game/GameManager.ts` Lines 406-421, 517-554):
  - Barricades absorb bullets first. Destructible ice loses HP; stone reflects bullets.
  - Player collision grants 1.0s i-frames (`this.player.invincibilityTimer = 1.0`), triggers `playPlayerHit()`, increments stress by 40, suppression by 20, resets combo, and subtracts 1 HP.
  - Near-miss suppression trigger (`hasTriggeredNearMiss`, Lines 542-554) activates once per bullet passing within 80px horizontal delta.
- **Enemy vs Barricades & Player Movement** (`src/game/GameManager.ts` Lines 315-343, 558-579):
  - Diver crash instantly destroys destructible barricades (20 dmg) and kills the diver.
  - Normal enemies set `enemy.isGnawing = true` and deal 0.1 HP/frame damage to destructible barricades.
  - **Defect Identified (Gnawing Movement Not Slowed)**: While `isGnawing` is flagged, `Enemy.update()` in `src/game/Enemy.ts` does not reduce or halt `speedX`/`speedY`, allowing enemies to glide through barricades while gnawing.
- **Player Bullets vs Interceptable Enemy Bullets** (`src/game/GameManager.ts` Lines 424-442):
  - Sniper bullets marked `isInterceptable = true` collide with player bullets, neutralizing both with a purple particle explosion.

---

### 1.3 Skill and Ultimate Lifecycles
- **Ultimate Skill: Heavy Rain (E / Shift key)** (`src/game/GameManager.ts` Lines 807-825, `src/game/Player.ts` Line 14):
  - Gauge charge: +1.5% per enemy kill in `handleEnemyKill()` (Line 588).
  - Trigger: `triggerUltimate()` checks `this.player.ultimateGauge >= 100`. Clears gauge to 0, triggers 0.5s screen shake, plays powerup sound, and spawns 30 downward-moving piercing bullets (`x = random * 600`, `y = -20`, `speedY = 300`, `damage = 10`, `piercing = 3`, `velocity.x = (random - 0.5) * 50`).
  - Cleanup: Out-of-bounds filter in `GameManager.update()` (Lines 369-375) discards bullets when `y > logicalHeight + 50` or `isDead`.
- **Ally Support Summon (Q key)** (`src/game/GameManager.ts` Lines 796-805, 275-290; `src/game/Helper.ts` Lines 1-194):
  - Cost: 50 💧 Pure Water.
  - Spawns 1 to 3 random helpers (`FIGHTER`, `REPAIRER`, `TANK`) at `y = logicalHeight - 80`.
  - Helper Lifespans: FIGHTER (15s, fires every 0.3s for 2 damage), REPAIRER (8s, heals damaged barricades), TANK (20s, 15 HP, intercepts incoming enemy bullets).
  - Cleanup: Filtered in `GameManager.update()` via `this.helpers = this.helpers.filter(h => !h.isExpired())`.

---

### 1.4 Memory & Resource Leak Risks
- **Web Audio Context & Nodes** (`src/game/SoundManager.ts` Lines 1-251):
  - Singleton pattern. Every sound effect instantiates an `OscillatorNode` and `GainNode`.
  - Node cleanup: `osc.onended = () => { osc.disconnect(); gainNode.disconnect(); }` is attached, with `osc.stop(time)`.
  - Risk Assessment: Under extreme weapon saturation (5-spread Multi-Shot at 0.1s fire rate = 50 bullets/s = 50+ oscillators/s), high node churn occurs. However, nodes disconnect promptly on ended events.
- **Particle System Lifecycle** (`src/game/Particle.ts` Lines 1-58, `src/game/GameManager.ts` Lines 364-376):
  - `Particle` lifetime is randomized (0.3s - 0.7s). Dead particles are filtered every frame (`particles.filter(p => !p.isDead)`).
  - Risk Assessment: Boss deaths generate 150 particles. Since objects are allocated with `new Particle()` rather than recycled in an object pool, GC spikes occur during prolonged runs, though memory bounds remain stable.
- **Component Lifecycle & Event Listeners** (`src/components/game-canvas.tsx` Lines 80-135):
  - **CRITICAL UX/STATE RESET BUG Identified**:
    `useEffect` on lines 80-135 has `[showManual]` in its dependency array.
    When a player clicks "HOW TO PLAY" (setting `showManual = true`) or closes the modal (`showManual = false`), the effect cleanup triggers `game.stopGame()` and removes event listeners, and then re-instantiates `const game = new GameManager(canvas)`, completely wiping the player's active wave, score, and game state!

---

## 2. Logic Chain & System Architecture Diagrams

### 2.1 Test Bot Autonomous Decision & Execution Flow (Tree Structure)
```
[ Playwright Page Context / Autonomous Bot Engine ]
 ├── 1. Perception Extraction (extractBotPerception)
 │    ├── Player State (x, y, hp, fireRate, multiShot, piercing, ultimateGauge, suppression)
 │    ├── Bullets Array (velocity, coordinates, isPlayerBullet, damage)
 │    ├── Enemies Array (types 0~6, position, hp, isDiving)
 │    └── Barricades Array (types 0/1, remaining voxel blocks, hp)
 ├── 2. Offensive Target Selection
 │    ├── Filter active living enemies
 │    ├── Calculate threat score:
 │    │    ├── Breach threat: y > 500 (+1500) | y > 450 (+1000)
 │    │    ├── Enemy type threat: Diver (+900) > Boss (+750) > Sniper (+600) > Splitter (+450)
 │    │    └── Proximity cost: -0.4 * |enemyX - playerX|
 │    └── Select highest priority enemy target X
 ├── 3. 1D Potential Field Evasion Solver (Raymarching)
 │    ├── Iterate horizontal grid candidates (cx = 0 to canvasWidth - playerWidth, step = 5px)
 │    ├── Calculate bullet threat:
 │    │    ├── Compute Time-To-Impact (TTI = (playerY - bulletY) / bulletVy)
 │    │    ├── Predict impact X = bulletX + bulletVx * TTI
 │    │    ├── Apply Barricade Shadowing:
 │    │    │    ├── Stone (Indestructible): 0.02x threat multiplier (98% occlusion)
 │    │    │    └── Ice (Destructible): 0.20x threat multiplier (80% occlusion)
 │    │    └── Gaussian spatial falloff: exp(-distX^2 / 2048) * (1500 / (TTI + 0.05))
 │    ├── Add Diver proximity penalty: 3000 * exp(-diverDistX^2 / 4050)
 │    ├── Add wall boundary penalty: (30 - cx) * 15
 │    └── Select candidate with minimal aggregate cost
 ├── 4. Action Dispatch
 │    ├── Horizontal Movement: LEFT / RIGHT / STAY (with 6px deadzone)
 │    ├── Offensive Firing: continuous auto-shoot
 │    ├── Ultimate Activation: E key when ultimateGauge >= 100
 │    ├── Ally Support Summon: Q key when currency >= 50 & breach risk
 │    └── Economy Upgrades: FireRate (50💧) -> MultiShot (100💧) -> Piercing (200💧)
 └── 5. Non-Intrusive Telemetry Tracking
      ├── FPS & Rolling Frame Deltas (1% Low FPS, Stutters >33ms, >50ms, Freezes >1000ms)
      ├── Heap Memory Size & Growth Slope (performance.memory)
      ├── Web Audio Active Oscillators & Gains (AudioContext prototype hook)
      └── Anomaly Detection Watchdog (Uncaught Errors, NaN coordinates, Projectile Overload)
```

### 2.2 Collision Detection & Resolution Hierarchy (Tree Structure)
```
[ GameManager.checkCollisions() Frame Step ]
 ├── Step 1: Bullets vs Barricades
 │    ├── If bullet collides with Barricade (DESTRUCTIBLE / INDESTRUCTIBLE):
 │    │    ├── bullet.isDead = true
 │    │    ├── If DESTRUCTIBLE: barricade.hp -= bullet.damage, spawn splash particles
 │    │    └── If INDESTRUCTIBLE: spawn spark particles
 │    └── Skip subsequent bullet checks for this bullet
 ├── Step 2: Player Bullets
 │    ├── Sub-step 2A: vs Interceptable Enemy Bullets (Sniper Bullets)
 │    │    └── If collision: both bullets marked dead, spawn purple explosion (#a855f7)
 │    └── Sub-step 2B: vs Enemies & Bosses
 │         ├── Decrement bullet.piercing--
 │         ├── If piercing <= 0: bullet.isDead = true
 │         ├── Apply Damage:
 │         │    ├── If SHIELDED & shieldHp > 0: shieldHp -= damage (shield break at 0, 5s regen timer)
 │         │    └── Else: enemy.hp -= damage (trigger hitFlashTimer = 0.08s)
 │         └── If enemy.hp <= 0:
 │              ├── enemy.isDead = true
 │              ├── Spawn death particles (Boss: 150 particles; Normal: 30 particles)
 │              ├── If SPLITTER: spawn 2 mini-enemies (20x20px, slow speed)
 │              └── handleEnemyKill(): increment combo, score, currency, stress, +1.5% ultimate
 ├── Step 3: Enemy Bullets
 │    ├── Sub-step 3A: vs Helpers (Allies)
 │    │    └── If collision: bullet.isDead = true, helper.hp -= damage (unless invincible)
 │    ├── Sub-step 3B: vs Player Ship
 │    │    └── If collision & invincibilityTimer <= 0 & !isGodMode:
 │    │         ├── bullet.isDead = true, player.hp -= damage, invincibilityTimer = 1.0s
 │    │         ├── stressLevel += 40, suppressionLevel += 20, combo reset to 0
 │    │         └── If player.hp <= 0: gameOver("정수기가 파괴되었습니다")
 │    └── Sub-step 3C: Near Miss Detection (Single Trigger)
 │         └── If !hasTriggeredNearMiss && passing player within 80px:
 │              ├── hasTriggeredNearMiss = true
 │              └── suppressionLevel += 15, stressLevel += 5
 └── Step 4: Enemies vs Barricades & Player
      ├── Enemy reaching bottom line (y > logicalHeight):
      │    └── enemy.isDead = true, player.hp -= 1 (breach penalty)
      ├── Enemy colliding with Player:
      │    └── enemy.isDead = true, player.hp -= 1, invincibilityTimer = 1.0s
      └── Enemy colliding with Barricade:
           ├── If DIVER: enemy.isDead = true, barricade.hp -= 20, red explosion
           └── Other Enemies: isGnawing = true, barricade.hp -= 0.1/frame
```

### 2.3 Skill & Ultimate Lifecycle Pipeline (Tree Structure)
```
[ Skills & Reinforcement Pipeline ]
 ├── Ultimate Skill (Heavy Rain / E key)
 │    ├── 1. Charging: +1.5% per enemy kill via handleEnemyKill()
 │    ├── 2. Activation Check: player.ultimateGauge >= 100
 │    ├── 3. Execution:
 │    │    ├── Reset ultimateGauge = 0
 │    │    ├── Trigger screen shake (0.5s) & powerup audio
 │    │    └── Spawn 30 downward heavy rain bullets (y: -20, vy: +300, dmg: 10, piercing: 3)
 │    └── 4. Lifecycle Cleanup: bullets filtered out when y > logicalHeight + 50 or isDead
 └── Ally Support Summon (Q key)
      ├── 1. Currency Requirement: currency >= 50 💧
      ├── 2. Dispatch: currency -= 50, pendingReinforcement = 'ALLY', warningTimer = 2.0s
      ├── 3. Spawn: 1 to 3 random helpers at y = logicalHeight - 80
      │    ├── Type 0 (FIGHTER): Green, HP 3, Lifespan 15s, fires upward (dmg 2) every 0.3s
      │    ├── Type 1 (REPAIRER): Yellow, Invincible, Lifespan 8s, repairs damaged barricade voxels
      │    └── Type 2 (TANK): Purple, HP 15, Lifespan 20s, intercepts incoming enemy bullets
      └── 4. Lifecycle Cleanup: lifespan -= deltaTime, filtered out via helpers.filter(!isExpired())
```

---

## 3. Caveats
1. **Headless Audio Limitations**: Running Playwright test bots in headless Chrome creates a simulated `AudioContext` where audio graphs process without physical hardware outputs. The audio node leak checks properly monitor memory allocation on the JavaScript prototype level.
2. **Deterministic Randomness**: Enemy spawning and helper type selections use `Math.random()`. In stress test runs, aggregate runs (e.g. 4+ workers or multi-wave endurance) provide statistical smoothing across random distributions.
3. **No Direct Source Code Changes Performed**: In strict accordance with the read-only Explorer persona and user rules, no modifications were made to project source files.

---

## 4. Conclusion & 5 Architectural Improvement Proposals

### 4.1 Summary of Found Defects & Vulnerabilities
1. **Piercing Multi-Hit / Frame Depletion Defect**: `Bullet` lacks a `hitEntities: Set<Entity>` tracking mechanism, causing piercing bullets to consume all piercing charges and deal unintended multi-hit tick damage against a single large entity (like a Boss) across consecutive frames instead of piercing through to distinct enemies.
2. **Modal Game Reset Bug**: `game-canvas.tsx` includes `[showManual]` in the canvas setup `useEffect` dependency array, which recreates `GameManager` and resets ongoing games when opening/closing the manual modal.
3. **Barricade Gnaw Movement Oversight**: `Enemy.update()` does not throttle or halt enemy movement while `enemy.isGnawing = true`, allowing enemies to pass through barricades during gnawing.
4. **Particle Allocation Churn**: Particles are dynamically allocated with `new Particle()` on every kill and boss death (up to 150 particles) without an object pool, creating minor GC spikes under multi-wave swarm endurance.

---

### 4.2 Five Proposed Improvement Methods

| Option | Approach Name | Description | Pros | Cons |
|---|---|---|---|---|
| **Option 1** | **Entity Hit-Set & Penetration Tracking** | Add `hitEntityIds: Set<string>` to `Bullet` class. When colliding with an enemy, check `if (this.hitEntityIds.has(enemy.id)) return;`. Only decrement piercing and apply damage once per distinct entity. | Completely fixes the piercing boss tick-depletion bug; allows clean penetration through multiple enemies. | Requires assigning unique IDs or WeakSet references to entities. |
| **Option 2** | **Component Ref Isolation for Modals & State** | Separate `showManual` modal state entirely from the canvas initialization `useEffect` (use empty dependency array `[]`), and manage game pause/resume via dedicated ref handlers. | Prevents accidental session wipes when opening the help manual; ensures 100% stable gameplay state. | Requires slight refactoring of `game-canvas.tsx` event listener binding. |
| **Option 3** | **Barricade Friction & Gnawing Throttling** | In `Enemy.update()`, if `this.isGnawing` is true, reduce `currentSpeedY` and `currentSpeedX` by 80% (or stop completely until barricade voxel destroyed). | Prevents enemies from gliding through defense lines; creates realistic barricade stalling mechanics. | Slightly alters enemy pacing at barricade lines. |
| **Option 4** | **Particle Object Pooling System** | Pre-allocate a fixed pool of 500 reusable `Particle` objects. Recycle inactive particles instead of instantiating `new Particle()` and relying on garbage collection. | Eliminates GC churn and frame drops during intense 150+ particle Boss explosion bursts. | Adds minor pooling management code in `Particle.ts`/`GameManager.ts`. |
| **Option 5** | **Unified Architectural Overhaul (Options 1 + 2 + 3 + 4 combined)** | Implement Entity Hit-Set tracking for piercing bullets (Option 1), decouple `showManual` from Canvas `useEffect` (Option 2), add barricade gnawing speed throttling (Option 3), and introduce particle pooling (Option 4). | Solves all identified gameplay, UX, collision, and memory/performance bottlenecks in a single cohesive update. | Involves multiple localized file touches across `GameManager.ts`, `Bullet.ts`, `Enemy.ts`, and `game-canvas.tsx`. |

### 4.3 Selected Best Method & Rationale
- **Selected Method**: **Option 5 (Unified Architectural Overhaul)**.
- **Selection Rationale**:
  - Each individual issue directly affects different acceptance criteria in the Comprehensive QA Sweep:
    - Option 1 is critical for weapon balance and multi-enemy piercing integrity.
    - Option 2 is critical for UX stability (preventing user progress loss on opening manual).
    - Option 3 fixes anomalous enemy movement through barricades.
    - Option 4 guarantees optimal 60 FPS performance during high-saturation multi-wave stress tests.
  - Combining these into a clean, unified patch addresses all root causes without introducing technical debt.

---

## 5. Verification Method

### 5.1 Playwright Bot Endurance Test Verification
Run the multi-wave swarm bot endurance runner to verify autonomous gameplay, skill usage, and shop purchases:
```powershell
npx playwright test tests/stress/endless_survival_swarm.spec.ts --project=chromium
```

### 5.2 Mechanics & Collision Spec Verification
Verify collision mechanics, piercing, skills, and boss encounters:
```powershell
npx playwright test tests/03_game_mechanics.spec.ts tests/04_multiwave_progression.spec.ts --project=chromium
```

### 5.3 Full Build & Typecheck Verification
Ensure TypeScript compilation passes without errors:
```powershell
npm run build
```
