# Total Codebase Inspection ("총검사"): Architecture & Memory Lifecycle Survey Report

**Survey Target**: Water Invader (Next.js 16, React 19, HTML5 2D Canvas, Web Audio API)  
**Agent ID**: `ti_survey_arch_memory_1`  
**Working Directory**: `/Users/user/src/water-invader/.agents/ti_survey_arch_memory_1`  
**Date**: 2026-09-23  
**Status**: Completed (Read-Only Investigation)

---

## 1. Executive Summary

A comprehensive architectural and memory lifecycle inspection was conducted across the entire Water Invader codebase, focusing on five critical domains:
1. **AudioContext Lifecycle & Audio Node Leaks**
2. **DOM & Canvas Event Listeners**
3. **Game Loop (`requestAnimationFrame`), Timers & State Transitions**
4. **Boss & Crisis State Transitions**
5. **Canvas Rendering 60 FPS Heap Allocations**

### Key Findings Overview
- **Runaway Animation Frame Loop (High Severity)**: When a wave is cleared or when the player dies, `this.loop` in `src/game/GameManager.ts` continues running at 60 FPS behind `ShopModal` and `GameOverModal`. Although `this.pause()` is called during wave clear, line 1263 unconditionally executes `this.animationFrameId = requestAnimationFrame(this.loop)` at the end of the loop, burning CPU/GPU in background menus.
- **Premature Crisis Abort Flaw (High Severity)**: In `GameManager.ts` (lines 1867–1875), the wave-completion check contains flawed boolean logic: `(this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))`. For any non-ACID_STORM crisis (such as `SOLAR_FLARE` or `EMP_DISRUPTION`), if all wave mobs are cleared while the hazard is charging or active, the wave immediately clears and wipes the crisis before its timer elapses.
- **Massive 60 FPS Heap Allocation & GC Churn (Medium Severity)**: 
  - `FlagshipManager.getSubsystems()` allocates a new 13+ element array **4 times every frame** (1 update + 3 draw passes), resulting in 240 arrays/sec.
  - `FlagshipManager.drawForeground()` creates a `new Set([...])` **every single frame** (60 sets/sec).
  - In `src/game/Enemy.ts`, 15 different enemy drawing routines call `ctx.createLinearGradient(...)` or `ctx.createRadialGradient(...)` inside `draw()`. With 50 enemies on screen, this generates **3,000+ CanvasGradient heap objects per second**.
  - `GameManager.draw()` allocates background linear gradients and radial vignette gradients every frame.
- **AudioContext Lifecycle Gaps (Medium Severity)**: `SoundManager.ts` is implemented as a singleton with lazy initialization, properly reusing a single `AudioContext`. However, `SoundManager` lacks an explicit `close()` or `suspend()` method on unmount, has no Master `GainNode` for instant mute cutoff, and does not suspend the `AudioContext` when the browser tab is hidden via `visibilitychange`.
- **DOM Event Listeners (Healthy)**: All 7 window and document listeners registered in `src/components/game-canvas.tsx` (`keydown`, `keyup`, `blur`, `resize`, `orientationchange`, `visibilitychange`, `beforeinstallprompt`) have strictly matching `removeEventListener` calls in their `useEffect` cleanup routines. Canvas touch/pointer inputs use React synthetic handlers with correct pointer capture acquisition and release.

---

## 2. Subsystem 1: Web Audio & AudioContext Lifecycle

### 2.1 AudioContext Initialization & Re-use
- **Location**: `src/game/SoundManager.ts` lines 1–35, 937
- **Implementation**:
  ```ts
  export class SoundManager {
    private audioCtx: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private enabled: boolean = false;
    public isMuted: boolean = false;
    ...
    public init() {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          try {
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 64;
            this.analyser.connect(this.audioCtx.destination);
          } catch (e) {
            console.warn('Failed to initialize master AnalyserNode:', e);
          }
          this.enabled = true;
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }
  }
  export const soundManager = new SoundManager();
  ```
- **Observations**:
  1. A single singleton instance `soundManager` is exported.
  2. `init()` lazily instantiates `this.audioCtx` upon first user interaction, complying with browser autoplay restrictions.
  3. Subsequent calls to `soundManager.init()` (e.g. on wave restarts, continue screens, or unmute) check `if (!this.audioCtx)`, correctly reusing the existing context and calling `this.audioCtx.resume()` if suspended. Multiple `AudioContext` instances are **not** created across restarts or continue screens.

### 2.2 Missing Teardown / Close Lifecycle
- **Defect**: `SoundManager.ts` has no `close()`, `destroy()`, or teardown method.
- **Impact**:
  - When `GameCanvas` unmounts (e.g. route transitions in Next.js or test tear-down), `audioCtx` remains open and running in memory.
  - While single-page games often stay on one route, in Next.js App Router or testing environments, unmounting and remounting `GameCanvas` leaves active hardware audio streams.
- **Remediation Recommendation**: Add `public destroy(): void` and `public suspend(): void` to `SoundManager`, called during `game-canvas.tsx` unmount and blur.

### 2.3 Master GainNode & Immediate Mute Handling
- **Location**: `SoundManager.ts` lines 19, 31–35, 41–44
- **Observation**:
  - `this.analyser` connects directly to `this.audioCtx.destination`.
  - There is **no master `GainNode`** inserted between the analyser and `destination`.
  - Calling `toggleMute()` simply toggles `this.isMuted = !this.isMuted`.
  - If long audio envelopes (e.g. `playSingularityCollapse` [0.7s], `playCrisisCataclysmSiren` [0.9s], `playSonarPingSweep` [1.2s], or `playHullGroan` [1.8s]) are currently playing when the user clicks Mute, they continue to sound until their timers expire.
- **Remediation Recommendation**: Insert a dedicated master `GainNode`:
  `this.masterGain = this.audioCtx.createGain();`
  `this.analyser.connect(this.masterGain);`
  `this.masterGain.connect(this.audioCtx.destination);`
  When `isMuted` changes, immediately ramp `this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioCtx.currentTime)`.

### 2.4 Tab Visibility (`visibilitychange`) Audio Handling
- **Location**: `src/components/game-canvas.tsx` lines 877–889
  ```ts
  const handleVisibilityChange = () => {
    if (document.hidden) {
      activePointerIdRef.current = null;
      lastPointerXRef.current = null;
      isDraggingRef.current = false;
      game.clearKeys();
    } else {
      // Ensure AudioContext resumes if sound is active upon returning to tab
      if (!soundManager.isMuted) {
        soundManager.init();
      }
    }
  };
  ```
- **Observation**: When `document.hidden === true`, the AudioContext is **not suspended**. Background audio or scheduled oscillator ramps continue processing while the tab is hidden.
- **Remediation Recommendation**: Call `soundManager.suspend()` when `document.hidden` is true, and `soundManager.resume()` when returning.

### 2.5 Audio Node Teardown & Envelope Safety
- **Location**: `SoundManager.ts` throughout all sound methods (lines 64–70, 91–97, 118–124, etc.)
- **Verification**: All procedural sound methods correctly attach an `osc.onended` handler that disconnects the oscillator and gain node from the audio graph:
  ```ts
  osc.onended = () => {
    try {
      osc.disconnect();
      gainNode.disconnect();
    } catch (e) {}
  };
  ```
- All volume fades use `exponentialRampToValueAtTime` with target values `>= 0.002` (non-zero), avoiding Web Audio API range exceptions.

---

## 3. Subsystem 2: DOM & Canvas Event Listeners

### 3.1 Primary Event Listener Registration & Teardown
- **Location**: `src/components/game-canvas.tsx` lines 760–778, 810–916
- **Audit Matrix**:

| Listener Target | Event Type | Handler Function | Cleanup Verified | Notes |
|---|---|---|---|---|
| `window` | `beforeinstallprompt` | `handleBeforeInstallPrompt` | **YES** (line 776) | Stored for PWA install button |
| `window` | `keydown` | `handleKeyDown` | **YES** (line 904) | Suppressed when manual modal open |
| `window` | `keyup` | `handleKeyUp` | **YES** (line 905) | Suppressed when manual modal open |
| `window` | `blur` | `handleBlur` | **YES** (line 906) | Clears keys and resets pointer drag |
| `window` | `resize` | `handleResize` | **YES** (line 907) | Resets drag anchor & recalculates canvas |
| `window` | `orientationchange`| `handleResize` | **YES** (line 908) | Mobile orientation change handling |
| `document` | `visibilitychange` | `handleVisibilityChange` | **YES** (line 909) | Clears keys and resets pointer drag |

- **Cleanup Execution**: All 7 listeners are cleanly unregistered inside the `useEffect` return callback:
  ```ts
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    game.stopGame();
    gameManagerRef.current = null;
    if (typeof window !== 'undefined') {
      (window as any).gameManager = null;
    }
  };
  ```

### 3.2 Touch & Pointer Events Handling
- **Location**: `src/components/game-canvas.tsx` lines 1188–1283
- **Mechanics**:
  - `touchstart` and `touchend` are **not** registered on `window` or `document`.
  - Canvas interactions use React Pointer Events on `<canvas>`: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`.
  - Pointer capture is properly acquired via `e.currentTarget.setPointerCapture(e.pointerId)` (line 1197) and released via `releasePointerCapture` in `onPointerUp` (line 1238).
  - Touch input on mobile buttons (`MobileControls`) uses JSX event handlers (`onPointerDown`, `onPointerUp`, `onPointerLeave`, `onPointerCancel`), avoiding manual DOM listener management.

### 3.3 Interval Timers
- **Location**: `src/components/game-canvas.tsx` lines 964–967
  ```ts
  syncAllies();
  const interval = setInterval(syncAllies, 200);
  return () => clearInterval(interval);
  ```
- **Verification**: Properly cleared via `clearInterval(interval)` whenever `gameState` changes or component unmounts. No dangling interval timers found.

---

## 4. Subsystem 3: Game Loop & `requestAnimationFrame` Lifecycle

### 4.1 Critical Defect: Runaway 60 FPS Loop Behind Shop & Game Over
- **Location**: `src/game/GameManager.ts` lines 1226–1264, 1895, 2478–2507
- **Code Inspection**:
  ```ts
  private loop = (timestamp: number) => {
    if (this.state === GameState.MENU) return; // <-- Only checks MENU!

    let frameTime = (timestamp - this.lastTime) / 1000;
    ...
    // Fixed timestep update
    while (this.accumulator >= this.FIXED_STEP) {
      this.update(this.FIXED_STEP);
      this.accumulator -= this.FIXED_STEP;
      if (this.state !== GameState.PLAYING) {
        this.accumulator = 0;
        break;
      }
    }
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop); // <-- Unconditional re-schedule!
  };
  ```
- **Failure Mechanism**:
  1. **Wave Clear Transition to SHOP**:
     - At wave clear, line 1876 sets `this.state = GameState.SHOP`.
     - Line 1895 calls `this.pause()`. Inside `this.pause()`, `cancelAnimationFrame(this.animationFrameId)` is executed and `this.isPaused = true`.
     - **However**, `this.pause()` was called synchronously inside `this.update()`.
     - Execution unwinds back to `this.loop()`, breaks out of the `while` loop, calls `this.draw()`, and then reaches line 1263:
       `this.animationFrameId = requestAnimationFrame(this.loop);`
     - A new frame is requested! On the subsequent frame, `this.state === GameState.SHOP` (which is NOT `GameState.MENU`), so line 1227 does **not** exit.
     - The loop continues to run at 60 FPS indefinitely while the Shop modal is open!
  2. **Death Transition to GAME_OVER**:
     - When the player dies, `gameOver(reason)` (line 2478) sets `this.state = GameState.GAME_OVER`.
     - `gameOver()` **never calls `cancelAnimationFrame` or `pause()`**.
     - Line 1263 schedules the next frame, and `this.loop` continues running at 60 FPS behind `GameOverModal` forever.
- **Architectural Impact**:
  - High CPU and GPU battery drain on mobile devices while user pauses, shops, or reads game-over stats.
  - Background rendering of biomes, stars, and particles continues unnecessarily.
- **Recommended Remediation**:
  In `this.loop`, change the exit condition to:
  ```ts
  if (this.state !== GameState.PLAYING || this.isPaused) {
    this.animationFrameId = 0;
    return;
  }
  ```
  Ensure `startNextWave()`, `continueGame()`, and `resume()` cleanly initiate `this.animationFrameId = requestAnimationFrame(this.loop)` when transitioning back to `PLAYING`.

### 4.2 Timestep & Physics Determinism
- **Location**: `GameManager.ts` lines 41, 1229–1260
- **Implementation**:
  - `FIXED_STEP = 1 / 60` (16.67ms).
  - Clamp: `if (frameTime > 0.1) frameTime = 0.1;` (prevents spiral of death on tab focus return or lag spikes).
  - Accumulator flush: `if (this.state !== GameState.PLAYING) { this.accumulator = 0; break; }`.
- **Verdict**: Timestep math is rock-solid and protects against coordinate tunneling or physics explosion on frame drops.

---

## 5. Subsystem 4: Boss & Crisis State Transitions

### 5.1 Critical Logic Flaw: Premature Wave Clear / Crisis Abort
- **Location**: `src/game/GameManager.ts` lines 1867–1876
- **Code Inspection**:
  ```ts
  if (
    this.state === GameState.PLAYING &&
    remainingHostiles === 0 &&
    !isEndGameCrisisEngaged &&
    this.warningTimer <= 0 &&
    this.pendingReinforcement === null &&
    this.crisisState.warningTimer <= 0 &&
    (this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))
  ) {
    this.state = GameState.SHOP;
    ...
    this.crisisState.activeCrisis = null;
    this.hazardProjectiles = [];
  ```
- **Failure Mechanism**:
  - Look at the expression: `(this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0)`.
  - If `this.crisisState.activeCrisis` is `'SOLAR_FLARE'` or `'EMP_DISRUPTION'`:
    `activeCrisis !== 'ACID_STORM'` evaluates to **`true`** immediately.
  - If the player defeats all regular wave enemies while a Solar Flare or EMP crisis is active, the wave clear condition evaluates to `true`.
  - The game switches to `GameState.SHOP` and immediately wipes `this.crisisState.activeCrisis = null`, cancelling the ongoing crisis mid-attack!
- **Recommended Remediation**:
  Change line 1874 to check all active crises uniformly:
  ```ts
  (this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)
  ```

### 5.2 EndGameCrisis & CrisisSovereign Coordination
- **Location**: `src/game/crisis/EndGameCrisis.ts` lines 23–135, 178–303; `src/game/crisis/CrisisSovereign.ts` lines 133–187
- **Phases**:
  1. `INCURSION`: 3.0s warning timer, reality distortion visual ramp.
  2. `PHASE_1_SHIELD`: Sovereign is invulnerable while 2 flanking Dimensional Rifts remain alive.
  3. `PHASE_2_HULL`: Triggered when both Rifts die; hull is exposed; Allied Vanguard Dreadnought is auto-summoned.
  4. `PHASE_3_CORE`: Triggered when Hull HP reaches 0; 35s enrage clock begins; core vulnerable.
  5. `DEFEATED`: Cataclysm averted; rewards awarded; Allied Vanguard warps out.
- **Verdict**: Phase transitions in `EndGameCrisis` and `CrisisSovereign` are cleanly managed. Double reward payouts are prevented by the `endGameCrisisDefeatedHandled` boolean flag in `GameManager.ts` line 774.

### 5.3 Kraken Prime Apex Boss Mechanics
- **Location**: `src/game/flagship/factions/KrakenPrimeBoss.ts` lines 180–320
- **Phases**:
  - Phase 1 (12,000 to 8,000 HP): 4 frontal living rampart tentacles absorb and deflect damage from the core.
  - Phase 2 (8,000 to 4,000 HP): Charybdis Maw opens; hydrodynamic inhalation vortex pulls the player upward; Maw is a 2.5x critical weakpoint.
  - Phase 3 (4,000 to 0 HP): Abyssal rage enrage timer (45s); ink blackout overlay; high-speed screen-crossing breach charges (750 px/s).
- **Minor Observation**: Line 309: `if (context.level !== undefined) context.level += 1;`. Since `context.level` is passed by value (primitive number) in `GameManager.getFlagshipContext()`, this modification does not update `this.level` in `GameManager`. The actual level progression is handled during `startNextWave()`.

### 5.4 Allied Reinforcements (Aegis Vanguard Command Dreadnought)
- **Location**: `src/game/crisis/AlliedReinforcements.ts` lines 147–225, 456–461
- **Lifecycle**:
  - Warp-In: 2.0s descent animation with expanding blue warp rings.
  - Combat: Heavy plasma cannons (every 0.8s), point-defense laser grid, restorative nano-shield aura (+1 HP every 5.0s), 2 escort interceptors.
  - Warp-Out: Initiated via `warpOut()`, ship ascends off the top of the screen (`y < -size.height - 50`), setting `isActive = false` and `isDismissed = true`.
- **Verdict**: Lifecycle transitions and dismissals are properly handled without memory leaks or dangling state.

---

## 6. Subsystem 5: Canvas 2D 60 FPS Heap Allocations & GC Churn

Canvas 2D rendering performance was analyzed for object and array allocations executed within the 60 FPS game and draw loop.

### 6.1 FlagshipManager Subsystems Array Re-allocation (High Churn)
- **Location**: `src/game/flagship/FlagshipManager.ts` lines 140–154, 188, 200, 209, 248–260
- **Analysis**:
  ```ts
  public getSubsystems(): IFlagshipSubsystem[] {
    return [
      this.cavitationTorpedo,
      this.prismLaser,
      this.hydraulicHarpoon,
      this.hydrothermalVents,
      this.oceanCurrents,
      this.biolapseDarkness,
      this.modularChassis,
      this.crewDeck,
      this.bioHorror,
      this.automatonPhalanx,
      this.apexBoss,
      this.endlessDescent,
      this.sonarRenderer,
      ...Array.from(this.customSubsystems.values()),
    ];
  }
  ```
  - In `update()`: calls `this.getSubsystems()` (1 array allocation).
  - In `drawBackground()`: calls `this.getSubsystems()` (1 array allocation).
  - In `drawWorld()`: calls `this.getSubsystems()` (1 array allocation).
  - In `drawForeground()`: 
    - Line 248: `const alreadyDrawn = new Set([...]);` (1 Set allocation + 1 array allocation).
    - Line 256: calls `this.getSubsystems()` (1 array allocation).
  - **Total**: **4 subsystem arrays + 1 Set allocated per frame**.
  - At 60 FPS, this equals **300 heap objects per second** exclusively for iterating static subsystems.
- **Recommended Remediation**:
  Cache the subsystem list in `this.cachedSubsystems: IFlagshipSubsystem[]`, updating it only when `registerCustomSubsystem` is called. Reuse a static/cached `Set` for `alreadyDrawn`.

### 6.2 CanvasGradient Allocations in `Enemy.ts` (3,000+ Objects/sec)
- **Location**: `src/game/Enemy.ts` lines 1293, 1375, 1441, 1496, 1513, 1558, 1608, 1665, 1752, 1793, 1837, 1880, 1929, 1981, 2026
- **Analysis**:
  - Every enemy type creates a new `CanvasGradient` object inside `draw()` every frame:
    - Line 1293 (Invader): `ctx.createLinearGradient(cx, cy - h/2, cx, cy + h/2)`
    - Line 1375 (Diver): `ctx.createRadialGradient(cx, cy - 4, 3, cx, cy, w/1.5)`
    - Line 1441 (Corvette): `ctx.createRadialGradient(cx, cy, 2, cx, cy, w/1.8)`
    - Line 1513 (Flame): `ctx.createLinearGradient(cx, cy - h/2, cx, cy - h/2 - flameHeight)`
    - Lines 1558, 1608, 1665, 1752, etc. (Shielded, Snipers, Rogues, Mechs, Dreadnoughts)
  - With 50–60 enemies active on late waves at 60 FPS:
    `55 enemies * 60 FPS = 3,300 CanvasGradient allocations per second`.
- **Architectural Impact**:
  CanvasGradient objects are native wrapper objects. Heavy GC cycles cause noticeable frame drops and jitter on low-power mobile devices.
- **Recommended Remediation**:
  Replace dynamic gradients on small mob entities with solid fill colors plus pre-calculated highlight accents, or pre-render common enemy sprites to small off-screen canvas stamps (`OffscreenCanvas` / cached bitmaps).

### 6.3 Background and Threat Gradient Allocations in `GameManager.ts`
- **Location**: `src/game/GameManager.ts` lines 2586–2589, 2599–2604, 2641–2645, 2776–2782
- **Analysis**:
  - Line 2586: `bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight)` created every frame for the biome background.
  - Line 2599: `vig = this.ctx.createRadialGradient(...)` created every frame when threat intensity > 0.
  - Line 2641: `vig = this.ctx.createRadialGradient(...)` created every frame during End-Game Crisis incursion.
  - Line 2776: `grad = this.ctx.createLinearGradient(...)` created for each active solar flare every frame.
- **Recommended Remediation**:
  - The biome background gradient has fixed vertical coordinates `(0, 0, 0, 800)`. It can be cached per biome on `GameManager` and re-created only when the biome changes (every 10 waves).

### 6.4 Additional Object & Closure Churn in Main Loop
- **`getThreatState()` in `GameManager.ts`** (lines 267–296):
  Called in `updateThreatState()` and in `draw()`, allocating a new `{ level, hasBoss, hasElite, hasCrisis, threatColor, threatIntensity }` object twice per frame (120 objects/sec) and running `.some()` closures on `this.enemies`.
- **`updateScoreUI()` in `GameManager.ts`** (lines 2468–2474):
  Executes `this.enemies.filter(...)` twice to count invaders and rogues, allocating two temporary arrays on every score change.
- **`Debug Overlay` in `GameManager.ts`** (line 2845):
  `[this.player, ...this.enemies, ...this.helpers, ...this.bullets, ...this.barricades].forEach(...)` allocates a large spread array when `isDebugMode === true`.

---

## 7. Remediation Roadmap & Recommendations

| # | Subsystem | File & Lines | Issue Description | Proposed Remediation |
|---|---|---|---|---|
| **1** | Game Loop | `GameManager.ts:1226-1264` | `this.loop` unconditionally re-schedules itself at 60 FPS via `rAF` during `SHOP` and `GAME_OVER` states. | Guard `this.loop` with `if (this.state !== GameState.PLAYING \|\| this.isPaused) return;`. |
| **2** | Crisis Logic | `GameManager.ts:1867-1875` | Wave clears and aborts non-ACID_STORM crises prematurely if regular mobs die while hazard is charging. | Change condition to `(this.crisisState.activeCrisis === null \|\| this.crisisState.timer <= 0)`. |
| **3** | Web Audio | `SoundManager.ts:1-35` | No `destroy()` / `suspend()` method; AudioContext remains active on component unmount and background tabs. | Add `destroy()` and `suspend()`, called from `game-canvas.tsx` cleanup and `visibilitychange`. |
| **4** | Web Audio | `SoundManager.ts:19-45` | Missing Master `GainNode`; active sounds cannot be immediately silenced on mute. | Insert master `GainNode` between analyser and destination; ramp gain to 0 on `toggleMute()`. |
| **5** | Performance | `FlagshipManager.ts:140-154` | `getSubsystems()` allocates 4 arrays per frame (240/sec); `drawForeground` allocates `new Set` every frame. | Cache `cachedSubsystems` array and reuse static `alreadyDrawn` set. |
| **6** | Performance | `Enemy.ts:1293-2026` | 3,000+ `CanvasGradient` objects allocated per second across 15 enemy drawing routines. | Replace mob gradients with flat/dual-tone vector paths or small pre-rendered canvas stamps. |
| **7** | Performance | `GameManager.ts:2586` | Background linear gradient recreated every frame at 60 FPS. | Pre-render or cache biome gradient on `GameManager`; invalidate only on biome tier shift. |

---

## 8. Verification Strategy

1. **Automated Unit & E2E Tests**:
   - `tests/03_game_mechanics.spec.ts`: Verify game pause/resume and shop transitions.
   - `tests/12_crisis_director_e2e.spec.ts`: Verify Solar Flare and EMP crises persist and do not terminate early when mobs are eliminated.
   - New Test: `tests/adversarial_memory_lifecycle_audit.spec.ts`:
     - Assert `animationFrameId === 0` while in `GameState.SHOP` and `GameState.GAME_OVER`.
     - Assert AudioContext suspension upon document hide (`visibilitychange`).
     - Assert no memory leak warnings or unbounded array growth across 20 consecutive waves.
2. **Build Quality**:
   - Verify `npx tsc --noEmit` exits with code 0.
   - Verify `npm run build` succeeds cleanly.
