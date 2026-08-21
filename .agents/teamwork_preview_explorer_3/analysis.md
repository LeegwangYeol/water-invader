# Water Invader: Comprehensive QA Exploration & Lifecycle Analysis Report

> **Target Workspace**: `C:\src\SpaceInvader`  
> **Investigation Date**: 2026-08-21  
> **Agent**: QA Exploration Agent (`teamwork_preview_explorer_3`)  
> **Scope**: Build Verification, Game Loop Lifecycle, Memory/Performance, Error Boundaries, State Persistence & Edge Cases

---

## 1. Executive Summary

A comprehensive, static and dynamic QA exploration was conducted across the Next.js 16 + React 19 + HTML5 Canvas codebase of **Water Invader**. 

### Overall Health Assessment
- **TypeScript & Build**: `npx tsc --noEmit` and `npm run build` both compile with exit code `0`. Next.js 16 (Turbopack) build succeeded in ~1.45s with a minor `metadataBase` warning.
- **Test Suite**: 20/20 Playwright E2E and mechanics tests passed in 34.1s.
- **Identified Flaws**: **2 Critical**, **4 High**, **3 Medium**, and **3 Low** severity issues were discovered across game loop lifecycle, collision loop nesting, memory/audio leaks, state persistence corruption, and error boundaries.

---

## 2. System Architecture & Lifecycle Code Tree

```
Water Invader Architecture & Execution Flow
├── Next.js App Router Layer
│   ├── src/app/layout.tsx (Root Layout, Metadata, Fonts)
│   ├── src/app/page.tsx (Server Component entrypoint)
│   └── src/app/manifest.ts (PWA Web Manifest)
│
├── React Client UI & State Layer (src/components/game-canvas.tsx)
│   ├── React State (gameState, score, highScore, currency, hp, upgrades, showManual)
│   ├── Event Subscriptions (window: keydown, keyup, beforeinstallprompt)
│   ├── Canvas Pointer Handlers (onPointerDown, onPointerMove, onPointerUp, onPointerLeave)
│   └── Overlays (Menu Overlay, Manual Modal, Game Over Screen & Upgrade Shop)
│
├── Core Game Engine (src/game/GameManager.ts)
│   ├── Initialization & Restart (init, startGame, stopGame)
│   ├── Game Loop (requestAnimationFrame(loop) -> update(deltaTime) -> draw())
│   │   ├── Physics & Entity Updates
│   │   │   ├── Player.update() -> Movement, Fire Timer, Stress/Suppression Decay
│   │   │   ├── Enemy.update() -> AI Behaviors (Zigzag, Diver, Sniper, Shielded, Boss)
│   │   │   ├── Helper.update() -> Fighter, Repairer, Tank logic
│   │   │   ├── Barricade.update() -> Voxel block health breakdown
│   │   │   ├── Bullet.update() -> Projectile physics & velocity
│   │   │   └── Particle.update() -> Gravity, friction, alpha fade
│   │   ├── Collision Detection (checkCollisions)
│   │   │   ├── Bullet vs Barricade
│   │   │   ├── Player Bullet vs Enemy
│   │   │   ├── Enemy Bullet vs Helper
│   │   │   ├── Enemy Bullet vs Player (Damage & Near-Miss Suppression)
│   │   │   └── [BUG] Enemy vs Barricade (Nested inside bullet loop!)
│   │   └── Visual Rendering (Canvas 2D Context, Screen Shake, Vector Graphics)
│   └── Sound System (src/game/SoundManager.ts - Web Audio API Synthesizer)
```

---

## 3. Prioritized Issue Matrix

| # | Category | Issue Description | Severity | Impact | Code Reference |
|---|----------|-------------------|----------|--------|----------------|
| **F-01** | **Lifecycle** | **Duplicate rAF Loop Multiplication on Game Restart** | **CRITICAL** | Game speed doubles/triples on each restart | `GameManager.ts:106-112, 153-172` |
| **F-02** | **Game Mechanics** | **Enemy vs Barricade Collision Nested in Bullet Loop** | **CRITICAL** | 0 damage if no bullets; 20x damage if many bullets | `GameManager.ts:330, 448-470` |
| **F-03** | **Combat Balance** | **0-Second Player Invincibility Frames (Instant Multi-Hit)** | **HIGH** | Player dies in 1 frame (0.016s) from overlapping bullets | `GameManager.ts:411-430` |
| **F-04** | **Lifecycle / React** | **Canvas & Engine Destroyed on Modal Open (`[showManual]`)** | **HIGH** | Opening "HOW TO PLAY" destroys active game state | `game-canvas.tsx:79-122` |
| **F-05** | **Combat Balance** | **Multi-Frame Near-Miss Suppression Stacking** | **HIGH** | 1 bullet maxes suppression & stress across 12 frames | `GameManager.ts:432-444` |
| **F-06** | **AI / Mechanics** | **Shielded Enemy Instant / Infinite Shield Regeneration** | **HIGH** | Shield regenerates on next frame (0.016s) after break | `Enemy.ts:33, 94-99` |
| **F-07** | **State Persistence** | **Corrupted LocalStorage & `NaN` High Score Lock** | **MEDIUM** | `NaN` high score permanently disables score records | `GameManager.ts:501-505`, `game-canvas.tsx:75` |
| **F-08** | **Combat Balance** | **Missing Sniper Bullet Interception Resolution** | **MEDIUM** | `isInterceptable` set but player bullets cannot hit it | `GameManager.ts:330-392` |
| **F-09** | **Memory / Audio** | **Audio Graph Node Retention & Window Blur Focus Loss** | **MEDIUM** | Nodes not disconnected; keys get stuck on Alt-Tab | `SoundManager.ts:22-82`, `game-canvas.tsx:105` |
| **F-10** | **Resilience** | **Missing React Error Boundary / App Router `error.tsx`** | **LOW** | Canvas/Audio crash takes down entire Next.js page | `src/app/` (missing `error.tsx`) |
| **F-11** | **Build & SEO** | **Next.js `metadataBase` Warning** | **LOW** | Social card URLs default to localhost:3000 | `src/app/layout.tsx:15` |
| **F-12** | **Code Hygiene** | **Unused Dead Code Function `handleSkill`** | **LOW** | Dead code artifact in React component | `game-canvas.tsx:53-57` |

---

## 4. Deep-Dive Findings & Technical Analysis

---

### Finding F-01: Duplicate rAF Loop Multiplication on Game Restart (CRITICAL)

#### Observation
In `src/game/GameManager.ts`:
```typescript
// Lines 106-112:
public startGame() {
  soundManager.init();
  this.state = GameState.PLAYING;
  if (this.onStateChange) this.onStateChange(this.state);
  this.lastTime = performance.now();
  this.loop(this.lastTime);
}

// Lines 153-172:
private loop = (timestamp: number) => {
  if (this.state === GameState.MENU) return;
  ...
  this.update(Math.min(deltaTime, 0.1));
  this.draw();
  this.animationFrameId = requestAnimationFrame(this.loop);
};
```
When `gameOver()` is called, `this.state` becomes `GameState.GAME_OVER`. 
Because `loop` only checks `if (this.state === GameState.MENU) return;`, it **continues running rAF frames in the background** while the Game Over screen is displayed.
When the user clicks "PLAY AGAIN" (calling `startGame()`), `this.loop(this.lastTime)` is called again. This starts a **second concurrent `requestAnimationFrame` loop**.

#### Logic Chain & Bug Tree
```
User Dies -> state = GAME_OVER
  │
  ├── loop() checks `state === MENU` (FALSE) -> continues rAF loop #1
  │
  └── User clicks "PLAY AGAIN" -> startGame() -> calls loop()
        │
        └── Starts rAF loop #2
              │
              ├── Loop #1 runs update(dt) at 60 FPS
              └── Loop #2 runs update(dt) at 60 FPS
                    └── Total 120 updates/sec (Game runs at 2x double speed!)
```

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Cancel Existing rAF in `startGame` & `init`)**: Call `cancelAnimationFrame(this.animationFrameId)` inside `startGame()` and `init()` before initiating a new loop.
2. **Method B (Loop Guard Flag)**: Add `private isLooping = false` boolean flag to `GameManager` to ensure only one rAF loop is ever registered.
3. **Method C (Stop Loop on Game Over)**: Change `loop` guard to `if (this.state !== GameState.PLAYING) return;` and explicitly re-launch upon `startGame`.
4. **Method D (React-driven rAF)**: Move rAF out of `GameManager` into a `useAnimationFrame` React hook.
5. **Method E (Single Static Singleton Loop)**: Maintain a static persistent loop that ticks whatever current active game instance exists.

> **Selected Best Method**: **Combination of Method A & Method C**. Guard `loop()` with `if (this.state !== GameState.PLAYING) return;` and ensure `cancelAnimationFrame(this.animationFrameId)` is always called before starting. This is standard game-engine lifecycle hygiene.

---

### Finding F-02: Enemy vs Barricade Collision Nested Inside Bullet Loop (CRITICAL)

#### Observation
In `src/game/GameManager.ts` lines 330–470:
```typescript
330: private checkCollisions() {
331:   for (const bullet of this.bullets) {
332:     if (bullet.isDead) continue;
...
448:     // Enemy vs Barricade
449:     for (const enemy of this.enemies) {
450:       if (enemy.isDead) continue;
451:       enemy.isGnawing = false;
452:       for (const barricade of this.barricades) {
453:         if (!barricade.isDead && enemy.checkCollision(barricade)) {
...
465:               barricade.hp -= 0.1; // Gnaw damage per frame
...
470:   }
471: }
```
The entire `Enemy vs Barricade` collision check is indented and located inside the `for (const bullet of this.bullets)` loop!

#### Logic Chain & Bug Tree
```
checkCollisions()
  │
  └── for (const bullet of this.bullets) [Iterates N times]
        │
        ├── Bullet vs Barricade
        ├── Bullet vs Player / Enemy / Helper
        └── [WRONG PLACE] for (enemy of enemies) vs for (barricade of barricades)
              │
              ├── Case 1: Bullets = 0 -> Loop does NOT run -> Enemies walk through barricades!
              └── Case 2: Bullets = 20 -> Loop runs 20x -> Barricades take 20x gnaw damage!
```

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Un-nest Loop into Dedicated Method)**: Move Enemy-Barricade collision checking out into a dedicated `checkEnemyBarricadeCollisions()` function called independently in `update()`.
2. **Method B (Separate Sequential Loops in `checkCollisions`)**: Close the bullet loop at line 447 and start the enemy-barricade loop as a top-level loop within `checkCollisions()`.
3. **Method C (Spatial Grid Partitioning)**: Implement a 2D spatial hash grid to resolve all entity collisions in a single pass.
4. **Method D (Barricade-centric Resolution)**: Move collision check into `Barricade.checkCollisions(enemies, bullets)`.
5. **Method E (Delta-time Gnaw Scaling in Enemy Update)**: Have enemies check overlap during their own `Enemy.update(deltaTime)` instead of GameManager collision loop.

> **Selected Best Method**: **Method A / B**. Extract `checkEnemyBarricadeCollisions()` as a standalone pass, and ensure gnaw damage is scaled by `deltaTime` (e.g. `barricade.hp -= 6.0 * deltaTime`) rather than a fixed `0.1` per frame.

---

### Finding F-03: 0-Second Player Invincibility Frames Post-Hit (HIGH)

#### Observation
In `src/game/GameManager.ts` lines 411–430:
```typescript
if (bullet.checkCollision(this.player)) {
  bullet.isDead = true;
  if (!this.isGodMode) {
    this.player.hp -= bullet.damage;
    ...
  }
}
```
And lines 253–263:
```typescript
} else if (enemy.checkCollision(this.player)) {
  enemy.isDead = true;
  if (!this.isGodMode) {
    this.player.hp -= 1;
    ...
  }
}
```
When multiple bullets or enemies overlap the player's bounding box in the same frame, the player takes full cumulative damage in a single frame (0.016s), instantly draining all 5 HP.

#### Logic Chain & Bug Tree
```
Boss / Multi-shot Enemy fires cluster of 3 bullets
  │
  └── Frame #120: Bullet 1, 2, 3 collide with Player in SAME frame
        │
        ├── Bullet 1: player.hp -= 1 (5 -> 4)
        ├── Bullet 2: player.hp -= 1 (4 -> 3)
        └── Bullet 3: player.hp -= 1 (3 -> 2)
              └── Result: Instant 3-heart loss in 16ms without player reaction time!
```

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Player `invincibilityTimer` with Flashing Alpha)**: Add `public invulnerabilityTimer: number = 0` to `Player`. Set to `1.0s` upon taking damage. While > 0, ignore incoming damage and render player with oscillating alpha (`Math.sin(time * 30)`).
2. **Method B (Damage Cooldown on GameManager)**: Store `lastHitTimestamp` in `GameManager` and ignore damage if `now - lastHitTimestamp < 1000`.
3. **Method C (Post-hit Knockback/Push)**: Push player away from impact zone.
4. **Method D (Temporary Shield Bubble)**: Automatically deploy a 1-hit shield on damage.
5. **Method E (HP Grace Threshold)**: Prevent HP from dropping by more than 1 point per 500ms window.

> **Selected Best Method**: **Method A**. Standard arcade convention: 1.0s i-frames with flashing visual feedback gives players fair reaction time and prevents 1-frame insta-deaths.

---

### Finding F-04: Canvas & Engine Reinstantiated on "HOW TO PLAY" Modal Open (HIGH)

#### Observation
In `src/components/game-canvas.tsx` lines 79–122:
```typescript
useEffect(() => {
  if (!canvasRef.current) return;
  const canvas = canvasRef.current;
  const game = new GameManager(canvas);
  gameManagerRef.current = game;
  ...
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    game.stopGame();
  };
}, [showManual]); // <-- showManual is in dependency array!
```
When the user clicks "HOW TO PLAY" (`setShowManual(true)`), React runs the cleanup function, calls `game.stopGame()`, and then re-instantiates a brand new `GameManager(canvas)`, resetting wave, player, score, and all enemies!

#### Logic Chain & Bug Tree
```
User in Wave 4 clicks "HOW TO PLAY"
  │
  ├── React sets showManual = true
  ├── useEffect([showManual]) cleanup triggers: game.stopGame()
  └── useEffect runs again -> new GameManager(canvas)
        └── Game resets to Wave 1 Menu! (Progress completely lost!)
```

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Remove `showManual` from Dependency Array & Use Mutable Ref)**: Keep `showManual` in a `useRef` or check state inside the key handlers without triggering canvas re-mount.
2. **Method B (Separate Keyboard Listener Effect)**: Separate the canvas initialization `useEffect([], ...)` from the keyboard event listener `useEffect([showManual], ...)`.
3. **Method C (Pass `isPaused` flag to GameManager)**: Pause game manager instead of destroying it.
4. **Method D (Controlled Modal outside Component)**: Lift modal out of `GameCanvas`.
5. **Method E (Prevent Opening during Active Play)**: Disable "HOW TO PLAY" button when `gameState === PLAYING`.

> **Selected Best Method**: **Method B (Separation of Concerns)**. Canvas & GameManager must initialize once (`useEffect(..., [])`), while input event handlers or modal states should use refs or separate effects.

---

### Finding F-05: Multi-Frame Near-Miss Suppression Stacking (HIGH)

#### Observation
In `src/game/GameManager.ts` lines 432–444:
```typescript
if (bullet.position.y > this.player.position.y && bullet.position.y < this.player.position.y + this.player.size.height) {
  const dx = Math.abs((bullet.position.x + bullet.size.width/2) - (this.player.position.x + this.player.size.width/2));
  if (dx < 80) {
     this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 15);
     this.player.stressLevel = Math.min(100, this.player.stressLevel + 5); 
  }
}
```
A bullet travels at 200px/s. The player height is 40px. A bullet remains within the player's Y range for ~0.2s = 12 frames at 60 FPS.
Because the bullet does not flag whether it has already applied suppression, it applies `+15` suppression on **every frame for 12 consecutive frames**, immediately pinning suppression to `100%` and stress to `+60` from a single bullet.

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (`bullet.hasTriggeredSuppression` Boolean Flag)**: Mark `bullet.hasTriggeredSuppression = true` on the first near-miss frame so each bullet only applies suppression once.
2. **Method B (`deltaTime`-scaled Suppression Rate)**: Change from discrete `+15` to continuous `+60 * deltaTime` per second of proximity.
3. **Method C (Suppression Cooldown Timer on Player)**: Add `player.suppressionCooldown` to rate-limit triggers.
4. **Method D (Proximity Distance Falloff Calculation)**: Calculate suppression as an inverse-square distance function once at closest point of approach.
5. **Method E (Discrete Bullet Passing Event)**: Trigger suppression only at the exact frame `bullet.position.y` crosses `player.position.y + player.height / 2`.

> **Selected Best Method**: **Method A**. Setting `bullet.hasTriggeredSuppression = true` guarantees exactly 1 discrete trigger per near-miss bullet, precisely matching game design intentions.

---

### Finding F-06: Shielded Enemy Instant / Infinite Shield Regeneration (HIGH)

#### Observation
In `src/game/Enemy.ts`:
```typescript
// Line 33:
private shieldRegenTimer: number = 0;

// Lines 94-99:
if (this.type === EnemyType.SHIELDED && this.shieldHp <= 0) {
  this.shieldRegenTimer -= deltaTime;
  if (this.shieldRegenTimer <= 0) {
    this.shieldHp = 3; // Regenerate shield
  }
}
```
When a player shoots and breaks a shielded enemy's shield (`shieldHp = 0`), `shieldRegenTimer` is `0`. On the next frame (16ms later), `shieldRegenTimer` becomes `-0.016`, triggering immediate regeneration back to 3 HP!

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Set Cooldown on Shield Break)**: In `checkCollisions()` or `Enemy.takeDamage()`, when `shieldHp` reaches 0, initialize `this.shieldRegenTimer = 5.0` (5-second regeneration delay).
2. **Method B (One-time Shield Break)**: Make shields non-regenerating (single use per enemy).
3. **Method C (Gradual Shield Point Recharge)**: Recharge 1 shield HP every 3 seconds.
4. **Method D (Wave-based Shield Reset)**: Shields only reset between waves.
5. **Method E (Visual Shield Break Particle with Timer)**: Trigger break animation and lock regen behind a state enum (`SHIELD_ACTIVE`, `SHIELD_BROKEN`, `SHIELD_RECHARGING`).

> **Selected Best Method**: **Method A & E**. Set `shieldRegenTimer = 5.0s` upon break with a recharging visual state.

---

### Finding F-07: Corrupted LocalStorage & `NaN` High Score Lock (MEDIUM)

#### Observation
In `src/components/game-canvas.tsx`:
```typescript
const saved = localStorage.getItem('waterInvaderHighScore');
if (saved) setHighScore(parseInt(saved, 10));
```
In `src/game/GameManager.ts`:
```typescript
const best = localStorage.getItem('waterInvaderHighScore');
if (!best || this.score > parseInt(best)) {
  localStorage.setItem('waterInvaderHighScore', this.score.toString());
}
```
If `localStorage` contains invalid data (e.g. corrupted string, `NaN`, non-numeric characters), `parseInt(best)` returns `NaN`. `this.score > NaN` is always `false`. The high score can never be updated, and the UI displays `HIGH SCORE: NaN`.

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Sanitized Safe Number Parsing)**: Use a helper:
   ```typescript
   const parsed = parseInt(saved, 10);
   const safeScore = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
   ```
2. **Method B (JSON Envelope with Versioning & Schema Validation)**: Store `{ version: 1, highScore: number, checksum: string }`.
3. **Method C (Try-Catch Reset Fallback)**: Clear corrupted key and reset to 0 if parsing fails.
4. **Method D (In-Memory State with LocalStorage Sync Layer)**: Maintain high score in memory, silently syncing to localStorage.
5. **Method E (Encrypted / Base64 Storage)**: Encode storage string to avoid accidental tampering.

> **Selected Best Method**: **Method A & C**. A robust sanitized parser `Number.isFinite(parsed) && parsed >= 0 ? parsed : 0` with corrupted value eviction.

---

### Finding F-08: Missing Sniper Bullet Interception Collision Check (MEDIUM)

#### Observation
In `Enemy.ts` line 154, sniper bullets set `b.isInterceptable = true;`. 
In `Bullet.ts` line 34, interceptable bullets render with a purple glow.
However, in `GameManager.checkCollisions()`, there is **no check between player bullets and enemy bullets**. Player bullets pass straight through sniper bullets, making the intended interception mechanic non-functional.

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (Bullet vs Bullet Loop in `checkCollisions`)**: Iterate `playerBullets` vs `enemyBullets.filter(b => b.isInterceptable)` and destroy both with an explosion on contact.
2. **Method B (Tagging Interceptable Bullets as Entities)**: Include interceptable bullets in the entity target list.
3. **Method C (Area-of-Effect Player Shot)**: Allow player multi-shot bullets to intercept all enemy bullets.
4. **Method D (Defensive Barrier Helper Interception)**: Let helpers shoot down sniper bullets.
5. **Method E (Heavy Rain Interception)**: Only Ultimate Skill destroys enemy bullets.

> **Selected Best Method**: **Method A**. Add bullet-to-bullet collision for `isInterceptable` bullets.

---

### Finding F-09: Web Audio Graph Disconnect & Window Blur Focus Loss (MEDIUM)

#### Observation
1. In `SoundManager.ts`, `osc.stop()` is called, but `osc.disconnect()` and `gainNode.disconnect()` are never called upon completion. In sessions with thousands of shots, this causes audio graph node accumulation.
2. In `GameCanvas.tsx`, if the user switches windows or Alt-Tabs while holding a movement or firing key, the `keyup` event never fires. When the user returns, the player continues moving or shooting involuntarily.

#### Proposed Fix Methods (5 Options Evaluated)
1. **Method A (`osc.onended` Node Cleanup + Window `blur` / `visibilitychange` Listener)**: Attach `osc.onended = () => { osc.disconnect(); gainNode.disconnect(); }` and add `window.addEventListener('blur', resetKeys)`.
2. **Method B (Static Audio Node Pool)**: Reuse a fixed pool of 16 oscillator/gain nodes.
3. **Method C (Howler.js / Web Audio Library)**: Replace custom SoundManager with an audio library.
4. **Method D (Full AudioContext Close on Unmount)**: Call `audioCtx.close()` in cleanup.
5. **Method E (Key Polling Map via `navigator.keyboard`)**: Poll keyboard state instead of event listeners.

> **Selected Best Method**: **Method A & D**. Clean up nodes on `osc.onended`, handle `blur`/`visibilitychange` to clear movement flags, and provide `soundManager.dispose()`.

---

## 5. Test Suite & Coverage Evaluation

### Existing Test Inventory
```
tests/
├── 01_ui_and_controls.spec.ts          (4 tests - Menu, HUD, Modal, Cheats)
├── 02_rendering_and_vector_art.spec.ts (3 tests - Player, 7 Enemies, Barricades)
├── 03_game_mechanics.spec.ts           (7 tests - Movement, Shooting, Allies, Diver, Splitter, Audit)
├── 04_multiwave_progression.spec.ts    (4 tests - Wave transitions, Boss Wave 5, Combo score)
├── water-invader.spec.ts               (1 test  - E2E Lifecycle)
└── benchmark/
    ├── automated_runner.spec.ts        (10-run Playwright bot harness)
    ├── bot_heuristics.ts               (Cost-field evasion AI)
    └── telemetry_collector.ts          (Metrics calculation & summary JSON)
```

### Test Coverage Strengths & Gaps
- ✅ **Strengths**: High fidelity E2E coverage of vector art rendering, enemy types, HUD transitions, cheat keys, and wave transitions.
- ⚠️ **Coverage Gaps**:
  1. **Lifecycle Re-entry**: No test currently verifies running multiple games sequentially to assert that FPS remains 60 and no duplicate rAF loops spawn.
  2. **Window Blur / Visibility**: No test validates key-release behavior on tab defocus.
  3. **Corrupted State Recovery**: No test injects invalid/corrupted localStorage values (`"NaN"`, `"{}"`, `"-500"`).
  4. **Memory / GC Stress**: No long-duration test measuring entity array growth and memory stabilization over 20+ waves.

---

## 6. Recommended Action Plan for Sentinel & Implementer

1. **Fix F-01 (rAF Loop Guard)**: Add `cancelAnimationFrame` in `GameManager.startGame()` and `init()`, and guard `loop` to run only while `state === GameState.PLAYING`.
2. **Fix F-02 (Barricade Loop Un-nesting)**: Un-nest Enemy vs Barricade collision checking from `for (const bullet of this.bullets)` into an independent pass with `deltaTime` scaling.
3. **Fix F-03 (Player i-frames)**: Add `1.0s` invincibility timer with flashing opacity post-hit.
4. **Fix F-04 (Modal Canvas Re-creation)**: Remove `[showManual]` dependency from the canvas instantiation `useEffect`.
5. **Fix F-05 (Suppression Stacking)**: Add `hasTriggeredSuppression` flag to `Bullet`.
6. **Fix F-06 (Shielded Enemy Cooldown)**: Set `shieldRegenTimer = 5.0` upon shield break.
7. **Fix F-07 (LocalStorage Sanitization)**: Add `Number.isFinite()` verification when loading high scores.
8. **Fix F-08 (Sniper Interception)**: Add Player Bullet vs Interceptable Enemy Bullet collision detection.
9. **Fix F-09 (Audio & Focus Cleanup)**: Add `osc.onended` disconnects and `window.addEventListener('blur')` key release.
10. **Fix F-11 (Metadata Base URL)**: Add `metadataBase: new URL('https://water-invader.vercel.app')` to `src/app/layout.tsx`.
