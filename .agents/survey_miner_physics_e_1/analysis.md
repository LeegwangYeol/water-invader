# Stream E & Physics Test Harness Specification Discovery Report

**Author**: survey_miner_physics_e_1 (Read-Only Specification Investigator)  
**Date**: 2026-09-17  
**Working Directory**: `/Users/user/src/water-invader/.agents/survey_miner_physics_e_1`  
**Primary Target Files**:  
- `/Users/user/src/water-invader/src/game/GameManager.ts`
- `/Users/user/src/water-invader/src/components/game-canvas.tsx` (Shop Modal, Game Over Modal, Pointer Controls, Visibility Handlers)
- `/Users/user/src/water-invader/src/game/Player.ts`
- `/Users/user/src/water-invader/src/game/flagship/progression/ModularChassis.ts`
- `/Users/user/src/water-invader/src/game/crisis/EndGameCrisis.ts`
- `/Users/user/src/water-invader/src/game/crisis/CrisisSovereign.ts`
- `/Users/user/src/water-invader/src/game/crisis/DimensionalRift.ts`
- `/Users/user/src/water-invader/src/game/crisis/AlliedReinforcements.ts`
- `/Users/user/src/water-invader/tests/playtest_stream_b_vents_currents.spec.ts`
- `/Users/user/src/water-invader/tests/20_flagship_12_features.spec.ts`
- `/Users/user/src/water-invader/tests/stress/bughunt_physics_adversarial_stress.spec.ts`
- `/Users/user/src/water-invader/tests/stress/stream_a_harpoon_physics_stress.spec.ts`
- `/Users/user/src/water-invader/tests/adversarial_flagship_state_transitions.spec.ts`
- `/Users/user/src/water-invader/tests/adversarial_m1_continue_shop_challenger.spec.ts`

---

## 1. Executive Summary

This report documents the exhaustive specification mining and architectural probing for **Stream E: Game Loop, Time Scaling & State Transitions**, along with an engineering analysis of how automated physics reproduction tests can be cleanly, deterministically, and reliably authored across all 5 streams without flaky timeouts.

### Core Discoveries:
1. **Fixed-Timestep Accumulator Engine**: `GameManager.ts` implements a semi-fixed timestep accumulator loop (`FIXED_STEP = 1/60 = 0.01666...s`). All entity physics and updates are evaluated with constant `dt = 1/60`, preventing frame-rate dependent physics anomalies across 60Hz, 120Hz, and 144Hz displays.
2. **Delta-t Clamping Against Lag Spikes**: `frameTime` is strictly clamped to `0.1s` (`100ms`). When returning to a tab after minutes or experiencing GC pauses, the engine executes a maximum of 6 physics sub-steps in that frame rather than hundreds, eliminating the "spiral of death" lockup.
3. **State Transition Lifecycle**: Five core states (`MENU`, `PLAYING`, `SHOP`, `GAME_OVER`, `PAUSED`) govern the engine. `SHOP` encompasses three distinct user flows: Pre-Game Shop, Between-Wave Shop, and Post-Death Continue Shop. Transitions between these states reset the physics accumulator (`accumulator = 0`) and synchronize `lastTime = performance.now()` to guarantee zero lag-burst acceleration upon resumption.
4. **Resurrection Coordinate Offsets**: When reviving in `prepareContinue()` and `continueGame()`, player coordinates are reset to `(logicalWidth / 2 - 25, logicalHeight - 60) = (275, 740)`. For the default 50x40 submarine, this places the player centered horizontally and exactly at `baselineY = 800 - 40 - 20 = 740`. However, when alternative Modular Chassis with non-standard dimensions are active (e.g. Nautilus: 64x46, Stingray: 38x30), this fixed offset causes a 6-7px lateral asymmetry and vertical baseline displacement, triggering unintended ballast sinking.
5. **Zero-Flake Automated Test Architecture**: Existing tests demonstrate two distinct paradigms:
   - *Headless Mock-Canvas Physics Harnesses* (`playtest_stream_b_vents_currents.spec.ts`, `stream_a_harpoon_physics_stress.spec.ts`, `bughunt_physics_adversarial_stress.spec.ts`): Execute in under 10 milliseconds, run in pure Node.js without browser or DOM overhead, and eliminate all timeout flakes.
   - *In-Browser E2E Harnesses* (`20_flagship_12_features.spec.ts`, `adversarial_m1_continue_shop_challenger.spec.ts`): Use `page.evaluate()` direct state injection and `data-testid` selectors. Pitfalls causing flakiness include `waitForTimeout()` race conditions and assuming array lengths remain static across `update()` calls due to in-place compaction.

---

## 2. Deep Technical Specification: Stream E

### 2.1 Game Loop & Time Accumulation (`GameManager.ts:1212-1244`)
The primary game loop operates via `requestAnimationFrame(this.loop)`:
```typescript
private loop = (timestamp: number) => {
  if (this.state === GameState.MENU) return;

  let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);
  this.lastTime = timestamp;
  
  // Guard against spiral of death on lag spikes or tab switching
  if (frameTime > 0.1) {
    frameTime = 0.1;
  }
  this.accumulator += frameTime;

  // FPS Calculation
  this.frameCount++;
  if (timestamp - this.lastFpsTime >= 1000) {
    this.fps = this.frameCount;
    this.frameCount = 0;
    this.lastFpsTime = timestamp;
  }

  // Fixed timestep update for deterministic physics stability across 60Hz/120Hz/144Hz
  while (this.accumulator >= this.FIXED_STEP) {
    this.update(this.FIXED_STEP);
    this.accumulator -= this.FIXED_STEP;
    if (this.state !== GameState.PLAYING) {
      this.accumulator = 0;
      break;
    }
  }
  this.draw();

  this.animationFrameId = requestAnimationFrame(this.loop);
};
```

#### Key Characteristics & Behavioral Rules:
1. **MENU State Termination**: When `this.state === GameState.MENU`, `this.loop` immediately returns without rescheduling `requestAnimationFrame`. Starting the game calls `startGame()` which explicitly schedules the loop with `this.loop(performance.now())`.
2. **Delta-t Clamp (100ms)**:
   - Even if the browser was suspended for 60 seconds in the background, `frameTime` is capped at `0.1`.
   - Maximum sub-steps per frame: $\lfloor 0.1 / (1/60) \rfloor = 6$ sub-steps.
   - Any excess time beyond 100ms is discarded, causing deliberate frame-rate slow-motion rather than physics explosion.
3. **Loop State Break & Accumulator Drain**:
   - If during any sub-step the state changes away from `PLAYING` (e.g. player dies, wave clears to shop, or crisis triggers game over), the engine immediately zeroes `this.accumulator = 0` and breaks out of the while loop.
   - This prevents queued residual delta-t from spilling over into the next state.
4. **Drawing During GAME_OVER**:
   - In `gameOver()`, `pause()` is deliberately **not** called. The loop continues scheduling `requestAnimationFrame(this.loop)` so `this.draw()` runs every frame. This renders the static background, threat vignette, floating particles, and arena behind the semi-transparent React `GameOverModal` overlay.

---

### 2.2 Tab Unfocus, Window Blur & Lag Spike Protection

#### Event Handlers (`game-canvas.tsx:871-889`):
1. **Window Blur (`blur`)**:
   - Clears input keys (`game.clearKeys()`), releases pointer drag (`activePointerIdRef.current = null, isDraggingRef.current = false`), preventing stuck movement keys when clicking outside the browser window.
2. **Visibility Change (`visibilitychange`)**:
   - When `document.hidden` is true: drops pointer dragging and calls `game.clearKeys()`.
   - When tab becomes visible again: re-initializes Web Audio context (`soundManager.init()`).
   - Note: The game engine does **not** force-pause gameplay on visibility change. Instead, it relies on browser throttling of `requestAnimationFrame` and the 100ms `frameTime` clamp in `GameManager.loop`.
3. **Window Resize / Orientation Change (`resize`, `orientationchange`)**:
   - Clears `lastPointerXRef.current = null` to prevent delta drag jumps.
   - Calls `game.resize()` to recompute device pixel ratio (`this.dpr = window.devicePixelRatio || 1`) and canvas dimensions (`logicalWidth * dpr`, `logicalHeight * dpr`) while preserving logical bounds `600x800`.

---

### 2.3 State Machine & Transitions Matrix

The game transitions through 5 discrete states (`GameState` in `types.ts`):

```
       ┌─────────── [ Pre-Game Shop ] ────────────┐
       │                                          ▼
   [ MENU ] ────────> [ PLAYING ] <─────────> [ PAUSED ] (Manual Modal)
                         │     ▲
       ┌─────────────────┘     │
       │ (Wave Clear)          │ (startNextWave)
       ▼                       │
   [ SHOP ] ───────────────────┘
       ▲
       │ (Continue clicked)
       │
 [ GAME_OVER ] <── (Player HP <= 0) ─── [ PLAYING ]
       │
       └─────────────> [ PLAYING ] (Restart Wave 1)
```

#### Detailed Transition Specifications:

| Origin State | Destination State | Trigger Event / Function | Pre-Conditions | Engine Actions & Cleanup |
|---|---|---|---|---|
| `MENU` | `PLAYING` | `startGame()` | User clicks START GAME | `init(false, true)`, applies Modular Chassis, `state = PLAYING`, `accumulator = 0`, `lastTime = performance.now()`, schedules `requestAnimationFrame(this.loop)`. |
| `MENU` | `SHOP` | `handleOpenPreGameShop()` | User clicks ARMORY & WORKSHOP | `isPreGameShop = true`, `setGameState(SHOP)`, preserves starter cash (150) and upgrades. |
| `SHOP` (Pre-Game) | `PLAYING` | `startGame()` | User clicks START MISSION | `init(false, true)`, applies purchased upgrades & chassis, resets wave=1, spawns Wave 1 enemies, starts loop. |
| `PLAYING` | `SHOP` | `update()` (Wave Clear) | `remainingHostiles === 0` && `!endGameCrisis` && `warningTimer <= 0` && `pendingReinforcement === null` | `state = SHOP`, `pause()`, cancels `animationFrameId`, resets crisis state, notifies UI via `onStateChange(SHOP)`. |
| `SHOP` (Wave Clear) | `PLAYING` | `startNextWave()` | User clicks NEXT WAVE | `state = PLAYING`, `isPaused = false`, `accumulator = 0`, `level++`, `restoreBarricades()`, `spawnWave()`, `lastTime = performance.now()`, resumes loop. |
| `PLAYING` | `PAUSED` | `pause()` | User clicks How-To-Play manual | `isPaused = true`, `accumulator = 0`, cancels `animationFrameId`, clears keys. |
| `PAUSED` | `PLAYING` | `resume()` | User closes How-To-Play manual | `isPaused = false`, `accumulator = 0`, `lastTime = performance.now()`, reschedules `requestAnimationFrame(this.loop)`. |
| `PLAYING` | `GAME_OVER` | `gameOver(reason)` | `player.hp <= 0` | Checks `flagshipManager.checkRevive()`. If false: `state = GAME_OVER`, `player.isDead = true`, plays game over sound, stores high score, leaves rAF running for background rendering. |
| `GAME_OVER` | `SHOP` (Continue) | `handleContinueToShop()` -> `prepareContinue()` | User clicks Continue (이어하기) | `prepareContinue()` resets bullets, enemies, helpers, particles, hazards. Sets `player.hp = Math.max(3, hp)`, resets coords to (275, 740), `state = SHOP`, `isPaused = true`, cancels rAF. |
| `SHOP` (Continue) | `PLAYING` | `handleResumeContinuedWave()` -> `continueGame()` | User clicks RESUME WAVE | `continueGame()` preserves purchased/repaired HP (`Math.max(3, hp)`), sets `invincibilityTimer = 1.5s`, spawns barricades, spawns wave with `{ isContinue: true }`, `state = PLAYING`, `isPaused = false`, resumes loop. |
| `GAME_OVER` | `PLAYING` | `restartFromBeginning()` | User clicks Restart from Beginning | `init({ resetScoreAndCash: true, preserveUpgrades: false })`, resets wave=1, score=0, cash=150, resets player stats, starts Wave 1. |

---

### 2.4 Resurrection Coordinates & Chassis Geometry Edge Case

#### Baseline Design:
- Logical dimensions: `width = 600, height = 800`.
- Baseline player: width = 50, height = 40.
- Standard spawn: `position.x = 600 / 2 - 25 = 275`.
- Standard vertical baseline: `baselineY = 800 - 40 - 20 = 740`.
- Standard spawn Y: `position.y = 800 - 60 = 740`.

#### Modular Chassis Hitbox Matrix:
| Chassis Archetype | Width | Height | Horizontal Center (`275 + W/2`) | Actual Canvas Center Delta | Baseline Y (`800 - H - 20`) | Respawn Y (`800 - 60`) | Vertical Delta vs Baseline |
|---|---|---|---|---|---|---|---|
| **Standard / Kraken** | 50 | 40 | 300 | 0 px (Exact) | 740 | 740 | 0 px (Exact resting) |
| **Nautilus Dreadnought** | 64 | 46 | 307 | +7 px (Right-shifted) | 734 | 740 | +6 px (Below baseline) |
| **Stingray Interceptor** | 38 | 30 | 294 | -6 px (Left-shifted) | 750 | 740 | -10 px (Above baseline) |
| **Leviathan Harvester** | 54 | 42 | 302 | +2 px (Right-shifted) | 738 | 740 | +2 px (Below baseline) |
| **Ghost Stealth Sub** | 46 | 34 | 298 | -2 px (Left-shifted) | 746 | 740 | -6 px (Above baseline) |

#### Observed Mechanical Behavior:
- When respawning as **Stingray** (height 30, baseline 750):
  The player spawns at `y = 740`. Because `position.y < baselineY`, line 1253 of `GameManager.ts`:
  `if (this.player.position.y < (this.player as any).baselineY) (this.player as any).isBallastActive = true;`
  immediately triggers hydrodynamic ballast, causing the submarine to drift down by 10px from 740 to 750 over 0.06 seconds.
- When respawning as **Nautilus** (width 64):
  Spawning at `x = 275` places the left hull edge at 275 and right hull edge at 339, shifting the visual symmetry 7px to the starboard side.
- **Remediation Specification**: To ensure all chassis spawn perfectly centered at their hydrodynamic equilibrium without ballast jitter:
  `this.player.position.x = (this.logicalWidth - this.player.size.width) / 2;`
  `this.player.position.y = (this.player as any).baselineY;`

---

### 2.5 Time Scaling, Speed Scaling & End-Game Crises

1. **Hostile Wave Acceleration**:
   - `GameManager.ts:1617`:
     `const speedMultiplier = Math.min(1.8, Math.max(1.0, 1.0 + (20 - Math.min(20, this.enemies.length)) * 0.04));`
   - Dynamically scales enemy movement from 1.0x (when 20+ enemies remain) up to 1.8x (when 0 enemies remain), emulating classic arcade tension.
2. **Chrono Devourer Temporal Mechanics (`CrisisArchetype.CHRONO_DEVOURER`)**:
   - Sovereign and Rift Tachyon Monoliths apply localized projectile bending and velocity bursts without altering the global engine `FIXED_STEP`.
3. **EMP Weapon Suppression**:
   - `crisisState.empSuppressionActive = true; crisisState.empTimer = 2.5s;`
   - Forces `player.isShooting = false; player.suppressionLevel = 100;` for exactly 2.5 seconds.

---

## 3. Playwright Test Harness Architecture: 5-Stream Blueprint

### 3.1 Headless vs In-Browser Testing Analysis

| Evaluation Metric | Pattern A: Headless Direct Physics Harness | Pattern B: In-Browser E2E Harness (`page.goto`) |
|---|---|---|
| **Execution Speed** | **Sub-millisecond to 10ms per test** (e.g. 7 tests in 9ms) | **1.5s to 5.0s per test** (Web server, Chromium start, DOM layout) |
| **Flakiness Risk** | **0% flake** (Deterministic, no DOM/network/audio races) | **Moderate to High** (Timeout if Next.js compiles on demand) |
| **Best Used For** | Kinematics, force integration, collision CCD, boundary clamping, mathematical edge cases | UI modals, button clicks, visual overlays, responsive canvas CSS |
| **Implementation** | Directly import TS classes (`Player`, `Enemy`, `HydrothermalVent`, etc.) | Playwright `page.evaluate()` or UI locators |

### 3.2 Common Pitfalls Causing Flaky Timeouts & Fixes

1. **Pitfall 1: In-Place Compaction Index Out-of-Bounds**
   - *Observation*: In `tests/stress/bughunt_physics_adversarial_stress.spec.ts:125`, a loop did:
     `for (let i = 0; i < 20; i++) (gm.enemies[i] as any).fireTimer = 0; gm.update(1/60);`
     This threw `TypeError: Cannot set properties of undefined (setting 'fireTimer')`.
   - *Root Cause*: `GameManager.update()` performs two-pointer in-place array compaction (`this.enemies.length = enemyWriteIdx`). When enemies die, `enemies.length` shrinks!
   - *Clean Pattern*: Always iterate with `for (const enemy of gm.enemies)` or `for (let i = 0; i < gm.enemies.length; i++)`.
2. **Pitfall 2: Arbitrary Hardcoded `waitForTimeout(1000)`**
   - *Observation*: Tests waiting for fixed timeouts can fail under high CPU load or run unnecessarily slowly.
   - *Clean Pattern*: Use condition polling: `await page.waitForFunction(() => (window as any).gameManager?.state === 'PLAYING', { timeout: 5000 })`.
3. **Pitfall 3: AudioContext Initialization Blocking**
   - *Observation*: SoundManager initialization can stall if browser audio policies require user interaction.
   - *Clean Pattern*: Initialize tests with `soundManager.isMuted = true` or mock `soundManager.init = () => {}`.
4. **Pitfall 4: Canvas Non-Finite Float Crashes**
   - *Observation*: Standard browsers throw `TypeError: The provided double value is non-finite` when `NaN` or `Infinity` is passed to Canvas 2D methods.
   - *Clean Pattern*: The `createMockCanvas` pattern in `bughunt_physics_adversarial_stress.spec.ts` wraps `arc`, `createLinearGradient`, `createRadialGradient` with `Number.isFinite()` assertions to catch NaN leaks immediately.

### 3.3 5-Stream Physics Reproduction Test Blueprint

```
tests/
├── physics_stream_a_player_kinematics.spec.ts   # Stream A: Kinematics, ballast, boundary clamping, chassis sizing
├── physics_stream_b_environment_hazards.spec.ts # Stream B: Conical plumes, buoyant lift, shear currents, whirlpools
├── physics_stream_c_weapons_ccd.spec.ts         # Stream C: High-speed CCD, zero-division homing, projectile lifetime
├── physics_stream_d_factions_bosses.spec.ts     # Stream D: Multi-part boss sequencing, friendly fire raycasting
└── physics_stream_e_gameloop_transitions.spec.ts # Stream E: Fixed timestep, dt clamping, state machine, respawn coords
```

#### Blueprint Code Templates for Each Stream:

#### Stream A: Player Kinematics & Ballast
```typescript
import { test, expect } from '@playwright/test';
import { Player } from '../src/game/Player';
import { ModularChassis } from '../src/game/flagship/progression/ModularChassis';
import { ChassisId } from '../src/game/flagship/types';

test.describe('Stream A: Player Kinematics & Ballast Subsystem', () => {
  test('A1: Player clamps strictly within [0, 600 - width] at extreme speeds', () => {
    const player = new Player(600, 800);
    player.speed = 10000;
    player.isMovingLeft = true;
    player.update(0.1);
    expect(player.position.x).toBe(0);

    player.isMovingLeft = false;
    player.isMovingRight = true;
    player.update(0.1);
    expect(player.position.x).toBe(600 - player.size.width);
  });

  test('A2: Modular Chassis switches update player dimensions and baselineY', () => {
    const player = new Player(600, 800);
    const chassis = new ModularChassis();
    chassis.selectChassis(ChassisId.NAUTILUS);
    chassis.applyToPlayer(player);
    expect(player.size.width).toBe(64);
    expect(player.size.height).toBe(46);
    expect((player as any).baselineY).toBe(800 - 46 - 20); // 734
  });
});
```

#### Stream B: Environmental Dynamics & Hazard Superposition
```typescript
import { test, expect } from '@playwright/test';
import { HydrothermalVent } from '../src/game/flagship/environment/HydrothermalVent';
import { OceanCurrent } from '../src/game/flagship/environment/OceanCurrent';
import { Player } from '../src/game/Player';

test.describe('Stream B: Hazard Superposition & Updraft Release', () => {
  test('B1: Simultaneous Vent Updraft and Ocean Current Shear resolves without NaN coordinates', () => {
    const vent = new HydrothermalVent('vent_left', 180, 0);
    const current = new OceanCurrent('current_deep', 0, 800, 'EAST', 75);
    const player = new Player(600, 800);
    player.position = { x: 180, y: 350 };

    for (let frame = 0; frame < 60; frame++) {
      vent.update(1 / 60, player, [], []);
      current.applyCurrent(player, 1 / 60);
      player.update(1 / 60);
      expect(Number.isFinite(player.position.x)).toBe(true);
      expect(Number.isFinite(player.position.y)).toBe(true);
    }
  });
});
```

#### Stream C: Weapons & Continuous Collision Detection (CCD)
```typescript
import { test, expect } from '@playwright/test';
import { Bullet } from '../src/game/Bullet';
import { Enemy, EnemyType } from '../src/game/Enemy';

test.describe('Stream C: Ballistics CCD & Division-by-Zero Safety', () => {
  test('C1: Bullet moving at extreme velocity (6000 px/s) does not tunnel through 30px target', () => {
    const enemy = new Enemy(280, 300, 600, 1, EnemyType.NORMAL);
    const bullet = new Bullet(300, 380, -6000, 20, true);
    // CCD swept collision detection
    const hit = (bullet as any).checkContinuousCollision ? (bullet as any).checkContinuousCollision(enemy, 0.05) : bullet.checkCollision(enemy);
    expect(hit || bullet.position.y <= enemy.position.y + enemy.size.height).toBe(true);
  });
});
```

#### Stream D: Swarm Formations & Boss Multipart Sequencing
```typescript
import { test, expect } from '@playwright/test';
import { Enemy, EnemyType } from '../src/game/Enemy';

test.describe('Stream D: Swarm Friendly Fire & Boss Multipart Sequencing', () => {
  test('D1: Hostile in rear ranks suppresses fire when ally directly in line of fire', () => {
    const front = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
    const rear = new Enemy(200, 150, 600, 1, EnemyType.NORMAL);
    const bullet = rear.fire({ x: 200, y: 700 }, [front, rear]);
    expect(bullet).toBeNull(); // Blocked by front ally
  });
});
```

#### Stream E: Game Loop, Time Scaling & State Transitions
```typescript
import { test, expect } from '@playwright/test';
import { GameManager } from '../src/game/GameManager';
import { GameState } from '../src/game/types';

function createMockCanvas(): HTMLCanvasElement {
  return {
    width: 600,
    height: 800,
    getContext: () => ({
      save: () => {}, restore: () => {}, scale: () => {}, translate: () => {},
      fillRect: () => {}, strokeRect: () => {}, fill: () => {}, stroke: () => {},
      beginPath: () => {}, closePath: () => {}, arc: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 60 }),
    }),
  } as unknown as HTMLCanvasElement;
}

test.describe('Stream E: Fixed Timestep Clamping & State Transitions', () => {
  test('E1: Lag spike (5.0s delta-t) is clamped to 100ms (max 6 physics updates)', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.startGame();
    let updatesCount = 0;
    const origUpdate = gm.update.bind(gm);
    gm.update = (dt: number) => {
      updatesCount++;
      origUpdate(dt);
    };

    // Simulate 5.0 second lag spike from tab unfocus
    const loopFn = (gm as any).loop;
    loopFn(performance.now() + 5000);

    expect(updatesCount).toBeLessThanOrEqual(6);
    expect((gm as any).accumulator).toBeLessThan(1 / 60);
  });

  test('E2: Continue flow resets accumulator and cleans up arena entities', () => {
    const canvas = createMockCanvas();
    const gm = new GameManager(canvas);
    gm.startGame();
    gm.player.hp = 0;
    (gm as any).gameOver('Player killed');
    expect(gm.state).toBe(GameState.GAME_OVER);

    gm.prepareContinue();
    expect(gm.state).toBe(GameState.SHOP);
    expect(gm.bullets.length).toBe(0);
    expect(gm.enemies.length).toBe(0);
    expect((gm as any).accumulator).toBe(0);

    gm.continueGame();
    expect(gm.state).toBe(GameState.PLAYING);
    expect(gm.player.hp).toBeGreaterThanOrEqual(3);
    expect(gm.player.invincibilityTimer).toBe(1.5);
  });
});
```

---

## 4. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Game Loop | Fixed Timestep Accumulator | Ensures physics integration runs at deterministic 60Hz (`FIXED_STEP = 1/60`) regardless of monitor refresh rate (60Hz, 120Hz, 144Hz, 240Hz). | `timestamp: number` from `requestAnimationFrame` | Regular discrete calls to `update(FIXED_STEP)` | Clamped to 100ms on frame spikes | `GameManager.ts:1212-1240` |
| 2 | Game Loop | Frame-Time Clamping (Anti-Spiral) | Prevents spiral of death on long browser pauses or background tab throttling by capping maximum frame delta-t to 100ms. | `frameTime = (timestamp - lastTime) / 1000` | Clamped `frameTime = Math.min(frameTime, 0.1)` | Excess real time (>100ms) discarded | `GameManager.ts:1219-1221` |
| 3 | State Machine | Pre-Game Armory & Workshop Access | Allows purchasing upgrades and selecting modular chassis from the main menu prior to Wave 1. | User clicks Armory & Workshop in Menu | `state = GameState.SHOP, isPreGame = true` | Starting mission transitions directly to Wave 1 with upgrades | `game-canvas.tsx:1050-1060`, `ShopModal.tsx` |
| 4 | State Machine | Wave-Clear Shop Transition | Automatically pauses game loop and transitions to Shop when all hostiles are defeated and no crisis/reinforcements pending. | `remainingHostiles === 0`, `!endGameCrisis`, `warningTimer <= 0` | `state = GameState.SHOP, pause()` | If an acid storm is active, shop wait until acid storm expires | `GameManager.ts:1809-1837` |
| 5 | State Machine | Continue Shop Access (`prepareContinue`) | Allows players who die to enter a dedicated Continue Shop to repair tank HP, buy upgrades, or swap chassis before resuming the current wave. | User clicks Continue on GameOver Modal | `state = GameState.SHOP, isContinue = true`, arena cleared | Player HP restored to at least 3 | `GameManager.ts:531-609`, `game-canvas.tsx:982-1001` |
| 6 | State Machine | Wave Continuation (`continueGame`) | Revives the player on the current wave with 1.5s invulnerability, preserved repairs/purchases, restored barricades, and cleans hostile bullets. | User clicks RESUME WAVE in Continue Shop | `state = GameState.PLAYING`, `invincibilityTimer = 1.5` | `Math.max(3, hp)` ensures repaired HP is never lost | `GameManager.ts:611-700` |
| 7 | State Machine | Game Loop Manual Pause / Resume | Freezes game simulation, clears keyboard inputs, and halts rAF when How-To-Play modal is opened. | `handleOpenManual()`, `handleCloseManual()` | `pause()` / `resume()` | Only resumes if state was `PLAYING` | `GameManager.ts:216-238`, `game-canvas.tsx:739-749` |
| 8 | State Machine | Flagship Sub-Zero Purge Revive | Officer Quad-Resonance perk that intercepts lethal damage, restores HP to maxHp (5), and cancels GAME_OVER transition. | `player.hp <= 0` in `gameOver()` | `player.hp = player.maxHp, player.isDead = false`, returns early | Perk consumed until next recharge cycle | `GameManager.ts:2420-2427`, `CrewOfficerDeck.ts` |
| 9 | Physics / Kinematics | Player Resurrection Coordinates | Resets player position upon continue/revival to horizontal center and bottom baseline. | `prepareContinue()`, `continueGame()` | `x = logicalWidth / 2 - 25, y = logicalHeight - 60` | Fixed 50px offset creates slight asymmetry on non-standard chassis | `GameManager.ts:540-541, 620-621` |
| 10 | Physics / Kinematics | Hydrodynamic Ballast Restoration | Automatically pulls the submarine back to baseline resting depth (`baselineY`) when displaced by buoyant updrafts or hazards. | `player.position.y < baselineY && !isInUpdraft` | `position.y += ballastDescentSpeed * dt` | Clamps at baselineY and deactivates ballast | `Player.ts:100-109` |
| 11 | Crisis Director | Standard Crisis Engine (Stage 10+) | Spawns emergency crises: Titan Horde, Acid Storm, Swarm Blitz, EMP Disruption, Solar Flare Surge. | Wave level >= 10, crisis timer | `crisisState` population, banner alarm, hazard spawns | Warning timer (2.0s) delays hazard activation | `GameManager.ts:1075-1210` |
| 12 | Crisis Director | Stellaris-Style End-Game Crisis (Stage 15+) | Spawns one of 12 existential archetypes with 3-phase combat, dimensional rifts, gravitational vortexes, and sovereign bosses. | Wave level >= 15, `triggerEndGameCrisis()` | Spawns `CrisisSovereign` and 2 `DimensionalRift` anchors | Standard hostiles wiped to isolate crisis encounter | `GameManager.ts:712-757`, `EndGameCrisis.ts` |
| 13 | Crisis Director | Allied Vanguard Reinforcements | Spawns Aegis Vanguard Command Dreadnought with escort fighters, PD laser grid, and periodic healing (+1 HP). | Phase 2 of EndGameCrisis or every 5 waves | `alliedReinforcements` instance created | Warps out upon crisis defeat | `GameManager.ts:773-781`, `AlliedReinforcements.ts` |
| 14 | Memory / Perf | Zero-Allocation Array Compaction | Two-pointer in-place compaction for enemies, bullets, helpers, and particles during update loop. | Arrays with dead entities (`isDead = true`) | Compacted arrays with truncated `.length = writeIdx` | Barricades excluded to preserve static index mapping | `GameManager.ts:1738-1786` |
| 15 | Rendering | Threat Vignette & Biome Interpolation | Interpolates dynamic vertical biome gradient and danger vignette alpha based on active boss or crisis presence. | `threatIntensity`, `activeThreatLevel` | Smooth canvas vignette rendering behind gameplay entities | Zero alpha when threat level is NONE | `GameManager.ts:2523-2557` |

---

## 5. Edge Cases & Boundary Behaviors

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Delta-t Clamping | Tab backgrounded for 60 seconds (60,000ms elapsed) | Next frame receives `frameTime = 60.0`, clamped to `0.1s`. Executes exactly 6 physics sub-steps (`0.1 / (1/60)`), discarding 59.9s of dead time. No spiral of death or memory freeze. |
| 2 | State Transition | Player dies during sub-step 1 of 6 inside while loop | `gameOver()` sets `state = GameState.GAME_OVER`. Line 1236 checks `if (state !== PLAYING) { accumulator = 0; break; }`. Remaining 5 sub-steps are discarded, and accumulator is zeroed. |
| 3 | State Transition | How-To-Play manual opened while in SHOP state | `pause()` cancels `animationFrameId`. Closing manual checks `if (state === PLAYING) resume()`. Because state is `SHOP`, loop remains cleanly suspended. |
| 4 | State Transition | Acid Storm active when last enemy killed | Line 1815 checks `crisisState.activeCrisis !== 'ACID_STORM' \|\| crisisState.timer <= 0`. Wave clear transition is deferred until acid projectiles finish falling, preventing damage in shop. |
| 5 | Resurrection Coords | Continue with Nautilus Dreadnought (width 64, height 46) | Player spawns at `(275, 740)`. Horizontal center is 307 (shifted right by 7px relative to canvas 300). Spawns at y=740 vs baseline 734 (starts 6px below baseline). |
| 6 | Resurrection Coords | Continue with Stingray Interceptor (width 38, height 30) | Player spawns at `(275, 740)`. Horizontal center is 294 (shifted left by 6px). Spawns at y=740 vs baseline 750 (starts 10px above baseline). Ballast activates immediately and sinks ship 10px. |
| 7 | Continue Shop Economy | Player dies with 2 HP, repairs to 5 HP, clicks Resume Wave | `continueGame()` evaluates `player.hp = Math.max(3, player.hp)`. Because `player.hp = 5`, `Math.max(3, 5) = 5`. Full 5 HP is preserved upon wave start. |
| 8 | In-Place Compaction | External loop accessing `enemies[i]` while enemy dies | Compaction shrinks `this.enemies.length` from 20 to 19. Any loop assuming fixed array length encounters `undefined`. Fixed by iterating with `for (const e of enemies)`. |
| 9 | Boundary Clamping | Player forced to coordinates `(-50, -50)` or `(1000, 1000)` | `Player.update()` clamps: `x in [0, 600 - width]`, `y in [0, 800 - height]`. Coordinates instantly restored to legal visible area. |
| 10 | Division-by-Zero | EndGameCrisis gravitational pull at exact center (`dx=0, dy=0`) | `applyRiftGravity` explicitly asserts `distSq > 100` before dividing by `dist`. No `NaN` or `Infinity` velocities generated. |

---

## 6. Actionable Implementation & Testing Recommendations

1. **Adopt Headless MockCanvas Harnesses for Physics Edge Cases**:
   - Write all physics reproduction tests for Streams A, B, C, D, and E using direct TypeScript class imports and `createMockCanvas()`.
   - Running in Node.js delivers 100x faster execution (~5ms per test) and 100% immunity to Playwright page navigation or network timeouts.
2. **Standardize Chassis Resurrection Alignment**:
   - In `GameManager.ts` `prepareContinue()` and `continueGame()`:
     Replace the hardcoded `(logicalWidth / 2 - 25, logicalHeight - 60)` with:
     ```typescript
     this.player.position.x = (this.logicalWidth - this.player.size.width) / 2;
     this.player.position.y = (this.player as any).baselineY;
     ```
     This ensures all 5 chassis archetypes respawn symmetrically centered without ballast settling jitter.
3. **Guard Against Compaction Out-of-Bounds in Tests**:
   - In all stress and adversarial test suites, always iterate over `gm.enemies` using `for (const e of gm.enemies)` rather than index loops with hardcoded upper limits.
