# Water Invader Endless Survival — Performance, Audio, Entity & Telemetry Architecture Survey

## 1. Observation

Direct code inspection of the Water Invader codebase (`C:\src\SpaceInvader\src\`) revealed the following concrete mechanisms and operational parameters:

### 1.1 Web Audio Lifecycle & Sound Nodes (`src/game/SoundManager.ts`)
- **Lazy Context Initialization** (`SoundManager.ts:10-21`):
  - `AudioContext` is created only on the first user interaction via `init()`.
  - Single shared singleton instance `soundManager = new SoundManager();` (`SoundManager.ts:250`).
- **Dynamic Node Creation & Teardown** (`SoundManager.ts:28-246`):
  - Every sound method (`playShoot`, `playExplosion`, `playPowerUp`, `playPlayerHit`, `playEnemyHit`, `playShieldBreak`, `playVictory`, `playGameOver`) creates a new pair of nodes:
    ```typescript
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    ```
  - Disconnection is bound to `osc.onended`:
    ```typescript
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    ```
  - **Absence of Voice Pooling / Concurrency Throttling**: There is no voice limit or node recycling pool. During high fire rates, multiple explosions, and rapid helper shooting, 50~150+ audio node pairs are allocated and discarded per second.
  - **Mute Flag Early-Return** (`SoundManager.ts:29, 58, 85, etc.`):
    `if (!this.enabled || !this.audioCtx || this.isMuted) return;`

### 1.2 Projectile & Particle Lifecycle and Array Allocation (`src/game/Player.ts`, `GameManager.ts`, `Particle.ts`, `Bullet.ts`)
- **Player Fire Rate & 5-Spread Multi-Shot** (`Player.ts:91-153`, `GameManager.ts:858-883`):
  - `baseFireRate` starts at `0.5s`, upgraded in 0.1s increments down to `0.1s` in shop (`GameManager.ts:861`).
  - Stress multiplier accelerates fire rate: `currentFireRate = this.baseFireRate / (1 + (this.stressLevel / 50))` (`Player.ts:94`). At 100% stress, actual fire interval is `0.1 / 3.0 = 0.0333s` (~30 shots/sec).
  - Multi-Shot Level 5 fires 5 bullets simultaneously at angles `[-20°, -10°, 0°, 10°, 20°]` (`Player.ts:141-150`).
  - Maximum player bullet output under full upgrade + max stress: `30 shots/sec * 5 bullets = 150 bullets/sec`.
  - Ultimate Skill ("Heavy Rain") immediately creates 30 piercing bullets (`GameManager.ts:809-814`):
    ```typescript
    for (let i = 0; i < 30; i++) {
      const b = new Bullet(x, -20, 300, 10, true, 3);
      b.velocity.x = (Math.random() - 0.5) * 50;
      this.bullets.push(b);
    }
    ```
- **Particle System Explosion Bursts** (`GameManager.ts:380-387`, `Particle.ts:9-21`):
  - Normal Enemy Kill: 30 particles (`GameManager.ts:467`).
  - Boss Kill: 150 particles (`GameManager.ts:467`).
  - Player Death: 200 particles (`GameManager.ts:529`).
  - Diver Crash / Shield Break: 16~30 particles.
  - Particle lifetime: `Math.random() * 0.4 + 0.3` (0.3s to 0.7s) (`Particle.ts:19`).
- **Array Re-Allocation in Per-Frame Update** (`GameManager.ts:350-362`):
  - Every frame (60 FPS), 5 entity arrays are recreated via `Array.prototype.filter`:
    ```typescript
    this.enemies = this.enemies.filter(e => !e.isDead);
    this.helpers = this.helpers.filter(h => !h.isExpired());
    this.bullets = this.bullets.filter(b => !b.isDead && b.position.y > -50 && b.position.y < this.logicalHeight + 50 && b.position.x > -100 && b.position.x < this.logicalWidth + 100);
    this.particles = this.particles.filter(p => !p.isDead);
    this.barricades = this.barricades.filter(b => !b.isDead);
    ```
  - This results in 300 array allocations per second in JS heap memory.

### 1.3 Enemy Scaling & Collision Detection Loop (`src/game/GameManager.ts`, `src/game/Enemy.ts`)
- **Wave Grid Dimension Scaling** (`GameManager.ts:183-184`):
  - `rows = 3 + Math.floor(this.level / 4)`
  - `cols = 6 + Math.floor(this.level / 3)`
  - Wave 1: 18 enemies | Wave 10: 45 enemies | Wave 20: 88 enemies | Wave 30: 150 enemies | Wave 50: 330 enemies.
  - Boss waves occur every 5th wave (`level % 5 === 0`) with HP = `level * 10` (`Enemy.ts:54`).
- **Collision Detection Complexity** (`GameManager.ts:393-573`):
  - `checkCollisions()` performs nested quadratic iterations:
    - Bullet vs 4 Barricades ($4 \times N$)
    - Player Bullet vs Enemy Bullets (Interception check: $N_{player} \times N_{enemy}$)
    - Player Bullet vs Enemies ($N_{player} \times M_{enemies}$)
    - Enemy Bullet vs Helpers ($N_{enemy} \times K_{helpers}$)
    - Enemy vs Barricades ($M_{enemies} \times 4$)
  - In deep waves with ~120 enemies and ~100 active bullets, the collision loop performs $12,000 \sim 25,000$ un-indexed AABB comparisons per frame ($0.7 \sim 1.5$ million checks/second).

### 1.4 Existing Bot Telemetry & Monitoring (`tests/benchmark/`)
- `tests/benchmark/bot_heuristics.ts`: 1D Potential Field solver evaluates candidate X positions ($0 \sim 550$ at 5px step) with bullet time-to-impact (TTI), barricade shadowing occlusion, and diver crash penalties.
- `tests/benchmark/telemetry_collector.ts`: Tracks `durationMs`, `waveReached`, `score`, `currency`, `shotsFired`, `shotsHit`, `accuracy`, `killBreakdown`, `causeOfDeath`, and `waveHistory`.
- `tests/benchmark/automated_runner.spec.ts`: Injects test runner inside Playwright `page.evaluate()` running bot interval at 16ms.

---

## 2. Logic Chain & Architectural Trees

### 2.1 Game Engine Execution Flow & Per-Frame Call Graph

```
GameManager.loop(timestamp)
 ├── 1. Time Delta & FPS Calculation (rolling 1000ms window)
 ├── 2. GameManager.update(min(deltaTime, 0.1))
 │    ├── Player.update(deltaTime)
 │    │    ├── Invincibility / Hit flash / Stress decay / Suppression decay
 │    │    └── Player.fire() -> Bullet[] (MultiShot 1~5, Angled spread)
 │    │         └── SoundManager.playShoot() [Allocation: Oscillator + Gain]
 │    ├── Reinforcement Update (Timer / Ally spawn / Enemy wave)
 │    ├── Enemy.update(deltaTime, speedMultiplier, bullets, playerPos)
 │    │    ├── Evasive check (bullets.find)
 │    │    ├── Movement / Diver dive logic / Shield regen timer
 │    │    └── Enemy.fire() -> Bullet | null (Sniper / Boss / Normal)
 │    ├── Helper.update(deltaTime, barricades, enemies, bullets)
 │    │    └── Fighter fire -> SoundManager.playShoot()
 │    ├── Barricade.update(deltaTime)
 │    ├── Bullet.update(deltaTime)
 │    ├── GameManager.checkCollisions()
 │    │    ├── Bullet vs Barricades (Destruction / Particle spawn)
 │    │    ├── Player Bullet vs Sniper Bullet (Interception / Particle spawn)
 │    │    ├── Player Bullet vs Enemy
 │    │    │    ├── Shield absorption / Shield break sound
 │    │    │    ├── Damage / Enemy hit sound / Particle splash
 │    │    │    └── Death check -> handleEnemyKill() + createExplosion()
 │    │    │         └── SoundManager.playExplosion() / playVictory()
 │    │    ├── Enemy Bullet vs Helpers
 │    │    ├── Enemy Bullet vs Player (i-frame check, Damage, Stress, Near-miss)
 │    │    └── Enemy vs Barricade (Gnawing / Diver crash)
 │    ├── Particle.update(deltaTime) [Gravity + Friction + LifeTime decay]
 │    ├── Dead Entity Cleanup [.filter() on 5 arrays]
 │    └── Wave Transition Check (Wave cleared -> 3.0s rest -> Level++)
 └── 3. GameManager.draw()
      ├── Canvas Clear & Dynamic Bubble Background (30 arcs)
      ├── Barricades, Player, Helpers, Enemies, Bullets, Particles
      ├── Boss HP Bar (if active)
      ├── Debug Overlay (Hitboxes & FPS text if isDebugMode)
      └── HUD Overlays (Reinforcement warning / Wave cleared)
```

### 2.2 Web Audio Node Lifecycle & GC Churn Risk Tree

```
Sound Event Trigger (e.g., Player Shoot / Explosion / Hit)
 ├── Check: SoundManager.enabled && audioCtx && !isMuted
 ├── Branch A: [Muted / Disabled]
 │    └── Return immediately (Zero overhead)
 └── Branch B: [Active Audio Playback]
      ├── 1. Allocate OscillatorNode: audioCtx.createOscillator()
      ├── 2. Allocate GainNode: audioCtx.createGain()
      ├── 3. Configure parameters (frequency ramp, gain envelope)
      ├── 4. Connect graph: Oscillator -> Gain -> audioCtx.destination
      ├── 5. Schedule: osc.start(now) -> osc.stop(now + duration)
      ├── 6. Register Closure Callback: osc.onended
      │    └── When playback ends: osc.disconnect(), gainNode.disconnect()
      └── 7. Node Lifecycle in V8 Engine:
           ├── Disconnected nodes detach from audio routing graph
           ├── BUT objects remain in JS Heap until next Major/Minor GC cycle
           └── High fire rate (150 bullets/sec) -> 300 nodes/sec -> Memory churn & GC pauses
```

### 2.3 Deep-Wave Entity Scaling & Collision Performance Bottleneck Tree

```
Wave Level Progression (Level N)
 ├── Grid Dimensions: Rows = 3 + floor(N/4), Cols = 6 + floor(N/3)
 │    ├── Wave 1:  18 Enemies
 │    ├── Wave 10: 45 Enemies
 │    ├── Wave 20: 88 Enemies
 │    ├── Wave 30: 150 Enemies
 │    └── Wave 50: 330 Enemies
 ├── Projectile Saturation:
 │    ├── Player Multi-Shot Lv 5 (Max Stress): ~150 bullets/sec
 │    ├── Active bullets on screen: 80 ~ 250 bullets
 │    └── Enemy sniper/boss bullets: 20 ~ 60 bullets
 └── Collision Detection Load per Frame (GameManager.checkCollisions):
      ├── 1. Bullet vs Barricades: N_bullets * 4
      ├── 2. Player Bullets vs Enemy Bullets: N_player * N_enemy (Interception)
      ├── 3. Player Bullets vs Enemies: N_player * M_enemies (Direct damage)
      ├── 4. Enemy Bullets vs Helpers: N_enemy * K_helpers
      ├── 5. Enemy Bullets vs Player: N_enemy (AABB + Near-miss calculation)
      └── 6. Enemies vs Barricades: M_enemies * 4
           └── Total AABB checks/frame at Wave 25: ~18,000 comparisons
                └── At 60 FPS: > 1,000,000 checks/sec (O(N*M) unindexed)
```

### 2.4 End-to-End Metrics & Telemetry Collection Architecture Tree

```
Playwright Test Swarm Runner (Master Orchestrator)
 ├── Concurrency: Multi-Worker Browser Contexts (1 ~ 8 parallel bots)
 ├── Per-Worker Pipeline:
 │    ├── Step 1: Launch Chromium Page & Navigate to App URL
 │    ├── Step 2: Inject Telemetry & Monitoring Hooks into window.gameManager
 │    │    ├── Hook A: Performance Memory (performance.memory.usedJSHeapSize)
 │    │    ├── Hook B: Frame Timing & Jank Tracker (delta times, min FPS, 1% low FPS)
 │    │    ├── Hook C: Entity Count Monopolies (bullets.length, particles.length, enemies.length)
 │    │    ├── Hook D: Audio Voice Tracker (hook createOscillator / track active node count)
 │    │    └── Hook E: Error & Anomaly Traps (window.onerror, unhandledrejection, NaN checks)
 │    ├── Step 3: Execute Bot Brain AI Decision Loop (every 16ms / requestAnimationFrame)
 │    │    ├── 1D Potential Field Evasion (TTI calculation, Barricade shadowing)
 │    │    ├── Weapon Firing & Dynamic Shop Auto-Upgrade (Fire Rate, Multi-Shot, Piercing)
 │    │    └── Tactical Skill Deployment (Ultimate Heavy Rain at 100%, Ally Summon at 50+💧)
 │    └── Step 4: Periodic Snapshot Collector (Sample every 100ms)
 │         └── In-memory ring buffer: [Timestamp, FPS, HeapMB, Bullets, Particles, Wave]
 └── Step 5: Statistical Engine & Report Aggregation
      ├── Aggregates: Mean/Median Survival Time, 95% Confidence Interval (Student's t)
      ├── Memory Stability Analysis: Heap growth slope (MB/min) after GC cycles
      ├── Frame Stability Analysis: Average FPS, 1% Low FPS, Stutter count (>50ms frames)
      └── Anomaly Triage: Crash cause categorization & NaN coordinate detection
```

---

## 3. Caveats

1. **Browser Environment Specifics**:
   - `window.performance.memory` is non-standard and available specifically in Chromium-based browsers (Playwright Chromium). In Firefox or WebKit, memory telemetry must rely on Playwright DevTools Protocol (CDP) `Performance.getMetrics` or standard memory estimation APIs.
2. **Audio Mute in Headless CI**:
   - In headless CI testing (e.g. GitHub Actions / default Playwright), browsers enforce autoplay policies or disable audio output device contexts by default unless explicitly initialized with `--autoplay-policy=no-user-gesture-required`.
   - Testing audio node churn requires either initializing `soundManager.init()` and unmuting, or observing mock context behavior.
3. **No Existing Source Code Modifications**:
   - In accordance with read-only survey guidelines, no source code in `src/` has been altered. All observations reflect the current intact codebase.
4. **Hardware Performance Variance**:
   - JS heap garbage collection pauses and raw frame rates will vary based on host CPU clock speed and hardware acceleration availability in headless vs headed browser modes.

---

## 4. Conclusion & Stress Test Measurement Strategies

### 4.1 System Health & Risk Assessment Summary

| Subsystem | Current Implementation | Risk Level | Primary Stress Bottleneck | Recommended Mitigation / Monitoring |
|---|---|---|---|---|
| **Web Audio** | Dynamic Oscillator & Gain allocation per sound effect; cleanup on `onended` | **Medium** | High node allocation churn (100+ nodes/sec) during 5-spread multi-shot firing and rapid enemy hits; GC overhead | Implement Audio Node Object Pool or Voice Cap (max 8 concurrent voices); monitor `activeAudioNodes` and GC pause frequency |
| **Projectiles** | Array of `Bullet` instances filtered every frame; no maximum ceiling | **Medium-High** | Up to 150+ bullets/sec with 5-spread and max stress; Ultimate adds 30 bullets simultaneously | Implement `MAX_BULLETS` cap (e.g. 500) and object pooling; monitor `bullets.length` and array reallocation time |
| **Particle System** | Dynamic particle instantiation (30 per kill, 150 per boss); lifetime 0.3~0.7s | **Medium** | Burst particle generation (300~600+ particles during multi-kill/Ultimate); per-frame filter allocations | Implement Particle Pool with `MAX_PARTICLES` (e.g. 1000); monitor `particles.length` spikes |
| **Enemy & Wave Scaling** | Unbounded wave grid growth ($3+N/4 \times 6+N/3$); $O(N \cdot M)$ collision checks | **High** | Late waves (Wave 20+) spawn >80~150 enemies, causing >20,000 AABB checks/frame and possible frame drop | Implement Spatial Grid / Y-band partitioning; monitor frame render time & collision check duration in deep waves |
| **State & NaN Resilience** | Score and upgrades tracked in GameManager; LocalStorage NaN fallback implemented | **Low** | State variables could get corrupted if float velocities produce `NaN` | Monitor entity positions and score values for `Number.isNaN()` during continuous runs |

### 4.2 Comprehensive Stress Test Measurement Strategy

To fulfill the requirements of the Endless Survival Stress Test (R1, R2, R3), the following measurement and execution strategy is formulated:

1. **4-Tier Stress Test Scenarios**:
   - **Tier 1 (Baseline Autonomous Endurance)**:
     - Run 10 benchmark rounds from Wave 1 to Game Over using standard `BotBrain` heuristics.
     - Measure mean survival time, wave distribution, death causes, and baseline FPS/heap.
   - **Tier 2 (Max Weapon & Skill Saturation)**:
     - Pre-configure or rapidly upgrade shop to Level 5 Multi-Shot (5-spread), Level 5 Fire Rate (0.1s base), Level 5 Piercing.
     - Force 100% stress level and trigger Ultimate (E) and Ally (Q) on cooldown.
     - Verify projectile rendering stability, audio node stability, and collision throughput.
   - **Tier 3 (Deep Wave Soak Test — Waves 1 to 20+)**:
     - Long-duration survival run targeting Wave 20+ (>10 minutes continuous gameplay per bot).
     - Measure JS Heap growth slope (testing for monotonic leaks), memory footprint after garbage collections, and frame pacing.
   - **Tier 4 (Massive Multi-Bot Swarm Concurrency)**:
     - Execute 5 to 10 concurrent Playwright bot instances simultaneously.
     - Measure aggregate system stability, crash-free execution rate, and CPU/memory scalability.

2. **Telemetry Sampling Metrics Matrix**:
   - **Performance**: Average FPS, 1% Low FPS, Frame time delta variance ($\sigma_{dt}$), Frame drops ($>33\text{ms}$ and $>50\text{ms}$).
   - **Memory**: `usedJSHeapSize` (MB), `totalJSHeapSize` (MB), Heap growth rate ($\Delta\text{MB}/\text{min}$).
   - **Entities**: Active `bullets.length`, `particles.length`, `enemies.length`, `helpers.length`, `barricades.length`.
   - **Audio**: Sound trigger frequency, active oscillator nodes.
   - **Combat & Economy**: Pure Water currency accumulated/spent, upgrade purchase logs, Ultimate/Ally cast counts.
   - **Anomalies**: Uncaught exceptions, frame freezes ($>2000\text{ms}$ watchdog), NaN detections in coordinates/scores.

---

## 5. Verification Method

### 5.1 Static Verification Commands
- Check TypeScript types across codebase:
  ```powershell
  npx tsc --noEmit
  ```
- Run Next.js production build:
  ```powershell
  npm run build
  ```

### 5.2 Dynamic & Stress Test Verification Commands
- Execute existing unit and mechanics regression test suite:
  ```powershell
  npx playwright test tests/03_game_mechanics.spec.ts --reporter=line
  ```
- Execute multi-wave progression suite:
  ```powershell
  npx playwright test tests/04_multiwave_progression.spec.ts --reporter=line
  ```
- Execute baseline benchmark telemetry runner:
  ```powershell
  npx playwright test tests/benchmark/automated_runner.spec.ts --reporter=line
  ```
- Run adversarial empirical stress suite:
  ```powershell
  npx tsx tests/stress_m1.ts
  ```

### 5.3 Invalidation Conditions
- If `usedJSHeapSize` exhibits continuous monotonic growth exceeding 50 MB over 10 minutes without plateauing after GC, a memory leak is confirmed.
- If 1% Low FPS drops below 25 FPS during 5-spread multi-shot and Ultimate execution, entity/collision optimization is required.
- If any uncaught runtime exception or `NaN` coordinate value is captured by telemetry hooks, the run is flagged as failed.
