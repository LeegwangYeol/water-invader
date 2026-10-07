# Milestone M3: Architecture, State & Memory Lifecycle Changes

## 1. Overview
Remediated four critical architectural and lifecycle defects in Water Invader:
- **DEF-ARC-01**: `requestAnimationFrame` loop management and state exit guards in `GameManager.ts`.
- **DEF-ARC-02**: Non-Acid crisis clear condition in `GameManager.ts` line 1923.
- **DEF-ARC-03**: Subsystem array caching, precomputed Set reuse, shop freeze, and gradient caching in `FlagshipManager.ts`, `Enemy.ts`, and `GameManager.ts`.
- **DEF-ARC-04**: Master `GainNode` and audio lifecycle hooks in `SoundManager.ts` and `game-canvas.tsx`.

---

## 2. File-by-File Changes

### `src/game/GameManager.ts`
- **DEF-ARC-01 (rAF Loop Exit Guards)**:
  - Added public property `public animationFrameId: number = 0;`.
  - Added exit guard at the start of `this.loop`:
    ```ts
    if (this.state !== GameState.PLAYING || this.isPaused) {
      this.animationFrameId = 0;
      return;
    }
    ```
  - Added safety break in fixed-timestep physics accumulator if state transitions out of `PLAYING` or becomes paused during sub-steps.
  - Guarded trailing `requestAnimationFrame` invocation: only request next frame if `this.state === GameState.PLAYING && !this.isPaused`.
  - In `pause()`: call `cancelAnimationFrame(this.animationFrameId)` and reset `this.animationFrameId = 0`.
  - In `gameOver()`: made public with default argument, cancel rAF and reset `this.animationFrameId = 0`.
  - In `resume()`, `start()`, `startGame()`, `continueGame()`, and `startNextWave()`: idempotently start rAF loop via `this.animationFrameId = requestAnimationFrame(this.loop)` when active and not already scheduled.
- **DEF-ARC-02 (Crisis Lifespan Preservation)**:
  - Modified line 1923 wave completion check: replaced `(this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))` with `(this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)`. Non-Acid crises (`SOLAR_FLARE`, `EMP_DISRUPTION`, etc.) persist for their full duration even if hostiles are cleared early.
  - Clamped `this.crisisState.timer = 0` upon crisis duration expiry and during wave transition.
- **DEF-ARC-03 (Rendering Gradient Caching & Shop Context Synchronization)**:
  - Added `cachedBiomeGrad` and `cachedBiomeName` to cache vertical background gradient, avoiding re-creation every frame.
  - Updated `shopContext` object passed to `FlagshipManager` to include `state: GameState.SHOP, gameState: GameState.SHOP`.

### `src/game/flagship/FlagshipManager.ts`
- **DEF-ARC-03 (Subsystem Array & Set Allocation Optimization)**:
  - Added `cachedSubsystems: IFlagshipSubsystem[] = [];` and `alreadyDrawnSet: Set<string> = new Set();`.
  - Implemented `rebuildSubsystemCache()` called in `constructor` and all `register*` methods.
  - `getSubsystems()` returns `this.cachedSubsystems` directly without allocating arrays (saving ~240 array instantiations/sec).
  - Added `registerSubsystem` alias to `registerCustomSubsystem` to simplify subsystem addition.
  - In `update()`: added check `if (context.gameState === GameState.SHOP || context.state === GameState.SHOP) return;` freezing subsystem processing when in shop.
  - In `init()`, `update()`, `drawBackground()`, `drawWorld()`, `drawForeground()`, and `onPlayerDamage()`: replaced dynamic array constructions with iterations over `this.cachedSubsystems`.
  - In `drawForeground()`: reused precomputed `this.alreadyDrawnSet`, eliminating Set allocations per frame.
  - Added default parameter `time: number = 0` to `drawBackground`, `drawWorld`, and `drawForeground`.

### `src/game/flagship/types.ts`
- Added optional `state?: GameState;` and `gameState?: GameState;` to `FlagshipUpdateContext` interface for strong typing of game state during flagship updates.

### `src/game/SoundManager.ts`
- **DEF-ARC-04 (Master GainNode & Audio Lifecycle)**:
  - Added `private masterGain: GainNode | null = null;`.
  - Inserted `masterGain` in the audio pipeline: `analyser.connect(masterGain) -> masterGain.connect(audioCtx.destination)`.
  - Added `getMasterGain(): GainNode | null` and `getAudioContext(): AudioContext | null`.
  - Refactored `setMuted(muted: boolean)` and `toggleMute()` to modulate `masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, audioCtx.currentTime)`.
  - Added `suspend(): Promise<void>` and `resume(): Promise<void>` to control `AudioContext` state.
  - Added `close(): Promise<void>` and `destroy(): Promise<void>` to cleanly disconnect nodes and close the `AudioContext`.

### `src/components/game-canvas.tsx`
- **DEF-ARC-04 (Visibility & Unmount Audio Management)**:
  - Updated `handleVisibilityChange` hook to call `soundManager.suspend()` when `document.hidden === true` and `soundManager.resume()` when returning to visibility.
  - Added `soundManager.suspend()` in `useEffect` unmount cleanup to halt audio processing when the canvas component unmounts.

### `src/game/Enemy.ts`
- **DEF-ARC-03 (Canvas Gradient Caching)**:
  - Added `cachedLinearGrad`, `cachedLinearGradPos`, `cachedRadialGrad`, and `cachedRadialGradPos` to `Enemy` class.
  - Implemented `getCachedLinearGradient` and `getCachedRadialGradient` helper methods that verify distance moved < 1.5px and key match before returning the cached `CanvasGradient`.
  - Updated gradient creation in enemy draw routines:
    - Normal mob (radial dome)
    - Sniper mob (linear beam hull)
    - Zigzag mob (linear angular hull)
    - Shielded mob (linear chassis)
    - Splitter mob (linear crystalline shell)
    - Boss (linear titan hull)
    - Rogue Drone, Rogue Stalker, Rogue Mech, Rogue Goliath, Rogue Phantom, Rogue Carrier, and Saboteur
    - Diver rocket exhaust uses solid `#f97316` fill instead of per-frame gradient allocation.

### `tests/m3_arch_lifecycle.spec.ts`
- Created comprehensive Playwright test suite covering all 4 remediation areas:
  - `DEF-ARC-01.1` to `DEF-ARC-01.6`: rAF loop management, pause/resume, game over, shop exit guards, idempotency.
  - `DEF-ARC-02.1` to `DEF-ARC-02.4`: Non-Acid crisis duration persistence across hostile clear, timed expiration, and wave shop transition.
  - `DEF-ARC-03.1` to `DEF-ARC-03.5`: Flagship subsystem cache identity, dynamic registration, zero-Set drawForeground, shop freeze, and enemy linear/radial gradient caching.
  - `DEF-ARC-04.1` to `DEF-ARC-04.5`: Master GainNode initialization, mute/unmute modulation, suspend/resume lifecycle, and destroy cleanup.
