# Architectural Performance Audit: Web Audio Synthesis & Particle Engine

**Agent**: `bughunt_exp_audio_perf_3` (Read-only exploration agent)  
**Target Subsystems**: Web Audio Synthesis (`SoundManager.ts`), Particle Engine (`Particle.ts`, `GameManager.ts`), Floating Combat Text, Animation Loop (`GameManager.ts`, `game-canvas.tsx`).  
**Working Directory**: `/Users/user/src/water-invader/.agents/bughunt_exp_audio_perf_3/`  
**Date**: 2026-09-03  

---

## 1. Observation

### 1.1 Web Audio API Lifecycle & Node Leak Vulnerability
- **AudioContext Initialization & Autoplay Handling**:
  - In `src/game/SoundManager.ts:10-21`:
    ```typescript
    public init() {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this.enabled = true;
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
    ```
  - `soundManager.init()` is invoked when `GameManager.startGame()` is called (`src/game/GameManager.ts:305`), which aligns with clicking the "Start Game" button.
  - In `src/components/game-canvas.tsx:689-700`:
    ```typescript
    const handleVisibilityChange = () => {
      if (document.hidden) {
        ...
        game.clearKeys();
      } else {
        if (!soundManager.isMuted) {
          soundManager.init();
        }
      }
    };
    ```
    `document.addEventListener('visibilitychange', handleVisibilityChange)` calls `soundManager.init()` when the tab becomes visible. However, modern browser autoplay policies (Chrome 66+, WebKit / Safari 11+, iOS Safari) do NOT consider `visibilitychange` as a user gesture. The call to `this.audioCtx.resume()` fails or is silently ignored by the browser if the context was suspended during backgrounding.
  - Furthermore, touch and drag interactions in `MobileControls` (`src/components/game-canvas.tsx`) do not trigger `soundManager.init()`. If audio failed to resume, mobile users remain silent.

- **Audio Node Disconnect & Frozen Clock Leak**:
  - In all 19 playback methods in `src/game/SoundManager.ts` (e.g. `playShoot` lines 43-54, `playExplosion` lines 70-82, `playEnemyHit` lines 149-161):
    ```typescript
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.onended = () => {
      try {
        osc.disconnect();
        gainNode.disconnect();
      } catch (e) {}
    };
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
    ```
  - If `this.audioCtx.state === 'suspended'`, `this.audioCtx.currentTime` freezes and does not advance. The stop time `this.audioCtx.currentTime + 0.1` is never reached on the audio clock, which means `osc.onended` never fires.
  - Any sounds dispatched while audio is suspended remain perpetually connected to `this.audioCtx.destination`, accumulating in memory and leaking Web Audio hardware processing graph nodes.

- **Voice Concurrency & Digital Clipping (Lack of Polyphony Limiting)**:
  - In `src/game/GameManager.ts:1081, 1333, 1361, 1376, 1379, 1539`, collision checks trigger sound effects per-entity hit with zero cooldown or voice capping:
    - Line 1081: `soundManager.playEnemyHit()`
    - Line 1333: `soundManager.playCrossfireHit()`
    - Line 1361: `soundManager.playEnemyHit()` / `soundManager.playCrossfireHit()`
    - Line 1250: `soundManager.playExplosion()`
  - During multi-shot piercing penetrations or multi-faction crossfire, 15-30 `OscillatorNode` and `GainNode` pairs are created in a single 16.6ms animation frame.
  - There is no master gain node (`gainNode.connect(this.audioCtx.destination)`). Multiple simultaneous full-amplitude square/sawtooth waves sum past 0 dBFS, causing digital clipping and crackling.
  - `SoundManager` lacks a `dispose()` or `close()` method; the singleton `soundManager` instance retains its `AudioContext` indefinitely across React unmounts.

---

### 1.2 Particle Engine Performance & Allocation Rates
- **Pool Management & Active Particle Array Uncapped State**:
  - `src/game/GameManager.ts:22-23`:
    ```typescript
    public particles: Particle[] = [];
    private particlePool: Particle[] = [];
    ```
  - In `src/game/GameManager.ts:1248-1261`:
    ```typescript
    private createExplosion(x: number, y: number, color: string, count: number, speedMult: number = 1.0) {
      if (count > 5) {
        soundManager.playExplosion();
      }
      for (let i = 0; i < count; i++) {
        let p = this.particlePool.pop();
        if (p) {
          p.init(x, y, color, speedMult);
        } else {
          p = new Particle(x, y, color, speedMult);
        }
        this.particles.push(p);
      }
    }
    ```
  - While `particlePool` is capped at 500 when recycling (`src/game/GameManager.ts:1189-1191`), **`this.particles` has no maximum capacity cap**.
  - On boss death, `count = 150` (`src/game/GameManager.ts:1389`). On End-Game Crisis Sovereign defeat, 120 particles spawn. On rift destruction, 30 particles spawn (`src/game/GameManager.ts:347`). Normal enemy deaths spawn 30 particles.
  - Coincident events easily drive active particle counts past 600-800 particles.

- **Pool Bypassing in Crisis Subsystems**:
  - In `src/game/crisis/EndGameCrisis.ts:218-222`:
    ```typescript
    if (Math.random() < 0.3 && particles.length < 400) {
      const center = rift.getSingularityCenter();
      const p = new Particle(center.x + (Math.random() * 20 - 10), center.y + (Math.random() * 20 - 10), rift.color, 0.6);
      particles.push(p);
    }
    ```
  - In `src/game/crisis/EndGameCrisis.ts:1057-1064`:
    ```typescript
    private spawnCataclysmExplosion(center: Vector2D, particles: Particle[]): void {
      for (let i = 0; i < 40; i++) {
        ...
        const p = new Particle(center.x, center.y, col, 2.0);
        particles.push(p);
      }
    }
    ```
  - In `src/game/crisis/AlliedReinforcements.ts:366`:
    ```typescript
    particles.push(new Particle(bx, by, '#38bdf8', 0.4));
    ```
  - These subsystems instantiate `new Particle()` directly instead of drawing from `GameManager.particlePool`.

- **Drawing Pipeline Load & Missing Boundary Culling**:
  - In `src/game/Particle.ts:50-65`:
    ```typescript
    public draw(ctx: CanvasRenderingContext2D): void {
      // Fake Glow (Much faster than shadowBlur)
      ctx.globalAlpha = this.alpha * 0.4;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.size.width * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.size.width / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1.0;
    }
    ```
  - Every particle issues two arc paths and two fills per frame. At 500 active particles, this yields **1,000 arc/fill calls** and **1,500 `globalAlpha` context state mutations** per frame ($60,000\text{ calls/s}$ and $90,000\text{ mutations/s}$ at 60 FPS).
  - In `src/game/Particle.ts:34-48`, particles update with gravity and friction until `lifeTime <= 0` (0.3s to 0.7s). There is no off-screen boundary culling (`x < 0 || x > logicalWidth || y < 0 || y > logicalHeight`). High-velocity particles thrown off-screen continue to update and execute `draw()` path commands until their timer runs out.

---

### 1.3 Floating Combat Text System Audit
- **Current Codebase State**:
  - `GameManager.ts` currently contains **no** `floatingTexts` or `combatText` array.
  - Floating in-world text is confined to:
    1. `src/game/crisis/AlliedReinforcements.ts:536`:
       ```typescript
       // Floating +1 REPAIRED text
       ctx.font = 'bold 12px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
       ctx.fillText('+1 REPAIRED', px, py - 35 - pulseProgress * 20);
       ```
       (Calculated inline during aura pulse rendering without maintaining an array).
    2. Static UI text banners: Center reinforcement warnings (`GameManager.ts:1948`), Crisis incursion banners (`EndGameCrisis.ts:1120-1143`), and Boss HP labels (`GameManager.ts:1641, 1685`).
- **Architectural Vulnerability**:
  - Because combat text was omitted from the original game loop, any prospective feature adding damage numbers (`-10`, `CRIT`, `DEFLECT`) without strict pooling, off-screen pruning, and font state caching will introduce significant GC churn and canvas CPU bottlenecks.

---

### 1.4 Animation Loop Lifecycle & requestAnimationFrame Concurrency
- **Synchronous `this.loop()` Invocation in `startGame()`**:
  - In `src/game/GameManager.ts:300-312`:
    ```typescript
    public startGame() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
      }
      soundManager.init();
      this.state = GameState.PLAYING;
      this.isPaused = false;
      this.accumulator = 0;
      if (this.onStateChange) this.onStateChange(this.state);
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
    ```
  - `startGame()` invokes `this.loop(this.lastTime)` synchronously on the call stack.
  - Inside `this.loop`, line 709 queues the next frame: `this.animationFrameId = requestAnimationFrame(this.loop);`.
  - Executing `loop` synchronously causes a 0ms frame interval spike between button dispatch and the first browser rAF callback, resulting in physics accumulator jitter.

- **Missing `isPaused` Guard in `this.loop` & Multiple Concurrent Loops**:
  - In `src/game/GameManager.ts:678-710`:
    ```typescript
    private loop = (timestamp: number) => {
      if (this.state === GameState.MENU) return;
      ...
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
  - Notice line 679: `if (this.state === GameState.MENU) return;`.
  - The loop **never checks** `this.isPaused`!
  - In `pause()` (`src/game/GameManager.ts:130-137`):
    ```typescript
    public pause(): void {
      if ((this.state === GameState.PLAYING || this.state === GameState.SHOP) && !this.isPaused) {
        this.isPaused = true;
        this.accumulator = 0;
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = 0;
        }
        this.clearKeys();
      }
    }
    ```
  - **Loop Duplication Race Condition**:
    If an rAF callback was already dispatched into the browser's execution pipeline before `cancelAnimationFrame` ran, `this.loop` runs. Because `this.state === GameState.PLAYING` and `this.isPaused` is not checked at the start of `loop`, the loop executes `update(FIXED_STEP)`, calls `draw()`, and reschedules itself via line 709: `this.animationFrameId = requestAnimationFrame(this.loop);`.
    When the player subsequently calls `resume()` (`src/game/GameManager.ts:140-150`):
    `this.animationFrameId = requestAnimationFrame(this.loop);`
    Now **TWO concurrent rAF loops run in parallel**. Physics runs at 2x speed (120Hz/240Hz effective simulation speed), bullets travel twice as fast, and CPU usage doubles.

- **Continuous Idle GPU/CPU Churn on Game Over & Shop**:
  - When `gameOver()` is called (`src/game/GameManager.ts:1610-1628`), `this.state = GameState.GAME_OVER`.
  - `gameOver()` does NOT call `cancelAnimationFrame(this.animationFrameId)`.
  - Inside `this.loop()`, because `this.state !== GameState.MENU`, `draw()` runs every frame, and `requestAnimationFrame(this.loop)` is continually re-queued at 60/120 FPS indefinitely while waiting on the Game Over screen.

- **React Component Unmount & Zombie Loop Risk**:
  - In `src/components/game-canvas.tsx:715-727`:
    ```typescript
    return () => {
      ...
      game.stopGame();
      gameManagerRef.current = null;
      if (typeof window !== 'undefined') {
        (window as any).gameManager = null;
      }
    };
    ```
  - In `src/game/GameManager.ts:314-320`:
    ```typescript
    public stopGame() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
      }
      this.clearKeys();
    }
    ```
  - `stopGame()` does not transition `this.state` to `GameState.MENU` nor set a destruction flag (`this.isDestroyed = true`).
  - If an in-flight rAF callback executes after component unmount, `this.loop` re-registers itself with the browser, keeping the entire `GameManager` instance, entity arrays, and callback closures alive as a background zombie loop.

---

## 2. Logic Chain

```
[Observation 1.1] soundManager.init() relies on visibilitychange, but browsers reject resume() without a direct user gesture.
       │
       ▼
AudioContext remains suspended if tab was blurred/backgrounded.
       │
       ▼
[Observation 1.1] While suspended, audioCtx.currentTime is frozen. osc.stop(audioCtx.currentTime + duration) never completes.
       │
       ▼
osc.onended never triggers -> osc and gainNode remain connected to destination indefinitely.
       │
       ▼
Dangling audio nodes leak in browser audio rendering memory.

[Observation 1.2] createExplosion pops from particlePool, but this.particles has no upper bound.
       │
       ▼
Boss/Sovereign defeats (120-150 particles) + rift ambient particles drive this.particles > 600.
       │
       ▼
Crisis and Allied subsystems bypass pool with `new Particle()`.
       │
       ▼
[Observation 1.2] Every particle triggers 2 arcs, 2 fills, and 3 globalAlpha mutations per frame without boundary culling.
       │
       ▼
Canvas 2D rendering pipeline incurs 1,000+ draw commands and 1,500 context mutations per frame, degrading mobile FPS.

[Observation 1.4] this.loop() only checks `state === GameState.MENU`. It does NOT check `this.isPaused`.
       │
       ▼
If an rAF callback is dispatched right around pause(), loop executes and re-registers requestAnimationFrame(this.loop).
       │
       ▼
When resume() is clicked, a second requestAnimationFrame(this.loop) is scheduled.
       │
       ▼
Two concurrent loops run simultaneously, causing 2x physics speedup and doubled CPU/GPU consumption.

[Observation 1.4] gameOver() sets state = GameState.GAME_OVER without canceling rAF.
       │
       ▼
this.loop() continues to request frames and execute draw() continuously on the Game Over screen.
```

---

## 3. Caveats

1. **Browser Autoplay Matrix**: AudioContext auto-suspension behavior varies across Chromium, Gecko, and WebKit. On desktop Chrome, if the page received a prior user gesture, `audioCtx.resume()` during `visibilitychange` may sometimes succeed, but on mobile WebKit (iOS Safari) it is strictly blocked without direct touch interaction.
2. **Device Pixel Ratio (DPR) Scaling**: The Canvas uses `logicalWidth = 600`, `logicalHeight = 800`, scaled by `window.devicePixelRatio` (`GameManager.ts:95-97`). On Retina/3x mobile displays, canvas backbuffer is $1800 \times 2400$ ($4.32\text{ megapixels}$). Particle overdraw with dual alpha arcs becomes fill-rate bound much faster than on 1x desktop displays.
3. **Absence of Floating Combat Text in Source**: The codebase currently does not feature a dedicated floating combat text array in `GameManager.ts`. Our analysis identifies the exact current touchpoints (`AlliedReinforcements.ts:536`, UI banners) and provides proactive architectural guardrails to prevent regressions if damage numbers are introduced.

---

## 4. Conclusion & Recommended Architecture

### 4.1 Web Audio Synthesis Optimization
1. **User Gesture AudioContext Resume Barrier**:
   - Bind `soundManager.init()` (or `audioCtx.resume()`) to canvas `pointerdown` and `touchstart` in `MobileControls` and `game-canvas.tsx`, not just `visibilitychange`.
2. **Master Gain & Voice Limiting Polyphony Manager**:
   - Introduce a `MasterGainNode`:
     `osc -> sfxGain -> masterGain -> destination`.
     `toggleMute()` toggles `masterGain.gain.setValueAtTime(0, audioCtx.currentTime)` to instantly silence active sound without stopping oscillators prematurely.
   - Implement an SFX polyphony cap (e.g. max 8 concurrent voices) and cooldown throttling per sound type (e.g. `playEnemyHit` throttled to at most once per $40\text{ms}$) to prevent digital clipping and audio thread lockup.
3. **Defensive Disconnect Timer**:
   - In addition to `osc.onended`, schedule a `setTimeout(() => { try { osc.disconnect(); gainNode.disconnect(); } catch (e) {} }, duration * 1000 + 100)` to guarantee node detachment even if the audio clock is frozen or suspended.
4. **Lifecycle Disposal**:
   - Implement `soundManager.dispose()` to close or suspend `audioCtx` when unmounting.

### 4.2 Particle Engine Optimization
1. **Hard Global Particle Limit**:
   - Introduce `MAX_ACTIVE_PARTICLES = 300` in `GameManager.ts`. In `createExplosion()`, if `this.particles.length >= MAX_ACTIVE_PARTICLES`, drop new particle creation or recycle the oldest particles.
2. **Unify Crisis Particle Allocations into GameManager Pool**:
   - Pass a spawning delegate `(x, y, color, speed) => gameManager.spawnParticle(x, y, color, speed)` into `EndGameCrisis` and `AlliedReinforcements` instead of calling `new Particle()`.
3. **Off-Screen Culling & Single-Pass Drawing**:
   - Add boundary check in `Particle.update()`: if `x < -30 || x > logicalWidth + 30 || y < -30 || y > logicalHeight + 30`, mark `isDead = true`.
   - Batch particle drawing: instead of switching `ctx.globalAlpha` 3 times per particle, render all particles of the same alpha/color in batches, or draw a single radial circle per particle.

### 4.3 Floating Combat Text System Specification (If Implemented)
- If floating combat text is added:
  1. Use a pre-allocated pool (`combatTextPool: FloatingText[] = []`, max 40).
  2. Employ in-place two-pointer compaction (identical to `GameManager` bullets and particles).
  3. Prune immediately when `y < -20` or `lifeTime <= 0`.
  4. Aggregate rapid successive hits on the same target into an accumulative damage number.

### 4.4 Animation Loop & Concurrency Guarding
1. **Strict Guarding in `this.loop`**:
   ```typescript
   private loop = (timestamp: number) => {
     if (this.isDestroyed || this.state === GameState.MENU || this.isPaused) {
       this.animationFrameId = 0;
       return;
     }
     ...
     if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
       this.draw();
       this.animationFrameId = 0;
       return; // Stop scheduling rAF on Game Over / Victory
     }
     ...
     this.animationFrameId = requestAnimationFrame(this.loop);
   };
   ```
2. **Prevent Synchronous Loop Launch**:
   - In `startGame()`, replace `this.loop(this.lastTime)` with:
     ```typescript
     if (this.animationFrameId) {
       cancelAnimationFrame(this.animationFrameId);
       this.animationFrameId = 0;
     }
     this.animationFrameId = requestAnimationFrame(this.loop);
     ```
3. **Component Teardown Protocol**:
   - Add `public destroy(): void` to `GameManager`:
     ```typescript
     public destroy(): void {
       this.isDestroyed = true;
       this.state = GameState.MENU;
       if (this.animationFrameId) {
         cancelAnimationFrame(this.animationFrameId);
         this.animationFrameId = 0;
       }
       this.onStateChange = undefined;
       this.onScoreChange = undefined;
       this.onPlayerHpChange = undefined;
       this.onUpgradesChange = undefined;
       this.onCrisisEvent = undefined;
       this.onEndGameCrisisEvent = undefined;
     }
     ```
   - Invoke `game.destroy()` in the `useEffect` return callback of `src/components/game-canvas.tsx`.

---

## 5. Verification Method

To independently reproduce and verify the findings:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected result*: Clean exit code 0.

2. **Simulation & Regression Test Suite**:
   ```bash
   npx playwright test tests/unit/endgame_crisis_simulation.test.ts
   ```
   *Expected result*: All combat physics, 12 crisis archetypes, and simulation invariants pass with 0 errors.

3. **Audio Node Inspection (Browser Console Reproduction)**:
   - In browser DevTools, monitor `soundManager.audioCtx.state`.
   - Call `soundManager.playShoot()` while `audioCtx.state === 'suspended'`.
   - Inspect memory heap snapshot: `OscillatorNode` and `GainNode` instances remain pinned in memory without being collected.

4. **rAF Loop Concurrency Test (Browser Console Reproduction)**:
   - In browser DevTools during active gameplay:
     ```javascript
     window.gameManager.pause();
     window.gameManager.resume();
     window.gameManager.pause();
     window.gameManager.resume();
     ```
   - Check `window.gameManager.fps` in debug overlay (F3): if loop doubling occurs, effective FPS and update rates double.
