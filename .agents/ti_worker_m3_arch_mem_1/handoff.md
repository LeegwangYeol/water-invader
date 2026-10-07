# Handoff Report: Milestone M3 Architecture, State & Memory Lifecycle

## 1. Observation
- **DEF-ARC-01 (rAF Loop Leak)**:
  - In `src/game/GameManager.ts`, `this.loop = (currentTime: number) => { ... }` was previously requesting next frame indefinitely (`this.animationFrameId = requestAnimationFrame(this.loop)`) without verifying whether `this.state === GameState.PLAYING` or `this.isPaused`. In menus (`SHOP`, `GAME_OVER`), the loop continued running in the background, consuming CPU/battery and mutating physics timers.
  - Furthermore, `pause()` set `this.isPaused = true` but did not cancel the active `animationFrameId`.
- **DEF-ARC-02 (Crisis Lifespan Premature Termination)**:
  - In `src/game/GameManager.ts` line 1923, the wave completion condition evaluated:
    ```ts
    (this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))
    ```
    For any active crisis other than `'ACID_STORM'` (such as `'SOLAR_FLARE'`, `'EMP_DISRUPTION'`, `'VOID_RIFT'`), `this.crisisState.activeCrisis !== 'ACID_STORM'` evaluated to `true`, instantly satisfying the condition and terminating the crisis on enemy wave clear even when several seconds of hazard duration remained.
- **DEF-ARC-03 (High-Frequency Memory Allocations & Subsystem Leak)**:
  - In `src/game/flagship/FlagshipManager.ts`, `getSubsystems()` created a fresh array literal of 12 subsystems on every invocation. Called across multiple draw routines (`drawBackground`, `drawWorld`, `drawForeground`), `update()`, and `init()`, this generated over 240 transient arrays per second.
  - In `drawForeground()`, `const alreadyDrawn = new Set([...])` instantiated a new `Set` on every render frame at 60 FPS (3,600 Sets/min).
  - In `src/game/Enemy.ts`, multiple archetype draw functions constructed `ctx.createLinearGradient` or `ctx.createRadialGradient` per enemy per frame, generating thousands of short-lived canvas gradient objects per second during combat.
  - In `GameManager.ts`, `ctx.createLinearGradient(0, 0, 0, this.logicalHeight)` was called on every frame to render the biome background.
  - In `FlagshipManager.update()`, subsystems continued updating during `GameState.SHOP`.
- **DEF-ARC-04 (Audio Context Leak & Lack of Master Gain)**:
  - In `src/game/SoundManager.ts`, audio was routed directly from `analyser` to `audioCtx.destination` without a master `GainNode`. Muting was handled by zeroing individual oscillators or sound calls, leaving open nodes and leaking audio when new sounds fired.
  - There was no `suspend()` or `resume()` hook for `document.visibilitychange` or canvas unmount in `src/components/game-canvas.tsx`, keeping `AudioContext` active and processing silent clock buffers when the tab was hidden or navigating away.

## 2. Logic Chain
1. **Addressing DEF-ARC-01**:
   - By adding an early exit guard in `GameManager.loop` (`if (this.state !== GameState.PLAYING || this.isPaused) { this.animationFrameId = 0; return; }`), any frame scheduled right before a pause or state transition aborts immediately without scheduling further frames.
   - Calling `cancelAnimationFrame(this.animationFrameId)` and setting `this.animationFrameId = 0` in `pause()` and `gameOver()` ensures immediate loop termination.
   - Scheduling rAF idempotently in `resume()`, `start()`, `startGame()`, `continueGame()`, and `startNextWave()` ensures the game loop resumes smoothly upon returning to active gameplay without duplicate concurrent loops.
2. **Addressing DEF-ARC-02**:
   - Simplifying the wave completion check in `GameManager.ts` line 1923 to:
     ```ts
     (this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)
     ```
     guarantees that any active crisis—regardless of archetype—must finish its countdown (`timer <= 0`) before the wave is considered cleared and transitions to `SHOP`.
   - Clamping `this.crisisState.timer = 0` upon expiry and wave transition eliminates lingering negative floating-point timer artifacts.
3. **Addressing DEF-ARC-03**:
   - In `FlagshipManager.ts`, maintaining a private `cachedSubsystems` array and precomputed `alreadyDrawnSet`, rebuilt via `rebuildSubsystemCache()` whenever subsystems are registered, completely eliminates dynamic array and Set instantiations during frame updates and rendering.
   - Guarding `FlagshipManager.update()` with `if (context.gameState === GameState.SHOP || context.state === GameState.SHOP) return;` freezes flagship operations while the player visits the shop.
   - In `Enemy.ts`, introducing `getCachedLinearGradient` and `getCachedRadialGradient` with a 1.5px Euclidean movement tolerance caches and reuses `CanvasGradient` objects across frames for stationary and smoothly drifting enemies while maintaining full visual fidelity and zero-raster vector integrity.
   - In `GameManager.ts`, vertical background gradients are cached per biome ID.
4. **Addressing DEF-ARC-04**:
   - Inserting `masterGain: GainNode` between `analyser` and `audioCtx.destination` enables instant, hardware-level mute/unmute modulation without iterating or tracking individual active oscillator nodes.
   - Adding `suspend()`, `resume()`, and `destroy()` methods to `SoundManager`, and hooking them into `handleVisibilityChange` and the unmount cleanup in `game-canvas.tsx`, ensures the Web Audio context suspends when the tab is backgrounded and terminates when the canvas unmounts, preventing resource leakage.

## 3. Caveats
- No caveats. All changes strictly preserve the existing zero-raster canvas drawing model, comply with the logical 600x800 resolution requirement, and maintain complete API backward compatibility.

## 4. Conclusion
- All four M3 defects (`DEF-ARC-01`, `DEF-ARC-02`, `DEF-ARC-03`, `DEF-ARC-04`) are genuinely resolved and covered by automated Playwright test suite `tests/m3_arch_lifecycle.spec.ts`.
- `npx tsc --noEmit` passes with 0 errors.
- `npm run build` succeeds cleanly.
- 52/52 Playwright tests in `tests/m1_physics_remediation.spec.ts`, `tests/m2_sec_math_defense.spec.ts`, and `tests/m3_arch_lifecycle.spec.ts` pass with 0 failures.

## 5. Verification Method
Execute the following verification commands from the project root:
```bash
# 1. Typecheck verification
npx tsc --noEmit

# 2. Production build verification
npm run build

# 3. Milestone M3 Architecture & Lifecycle suite (20 tests)
npx playwright test tests/m3_arch_lifecycle.spec.ts

# 4. Regression suites across all completed milestones (52 tests total)
npx playwright test tests/m1_physics_remediation.spec.ts tests/m2_sec_math_defense.spec.ts tests/m3_arch_lifecycle.spec.ts
```

### Invalidation Conditions
- If `gm.animationFrameId` remains non-zero during `gm.pause()` or `gm.state === GameState.SHOP`.
- If an active `SOLAR_FLARE` or `EMP_DISRUPTION` crisis is discarded when `gm.enemies` becomes empty while `gm.crisisState.timer > 0`.
- If `flagship.getSubsystems()` returns different array object references across consecutive calls without registrations.
- If `soundManager.setMuted(true)` fails to set `masterGain.gain.value` to 0.
