# Handoff Report: Architecture & Memory Lifecycle Survey ("총검사")

**Agent**: `ti_survey_arch_memory_1`  
**Working Directory**: `/Users/user/src/water-invader/.agents/ti_survey_arch_memory_1`  
**Recipient**: `parent` (`03443970-0963-4172-bce8-68ffd5c5aefe`)  
**Type**: Hard Handoff (Investigation Complete)  
**Date**: 2026-09-23

---

## 1. Observation

1. **Game Loop rAF Runaway on Menu Transitions**:
   - `src/game/GameManager.ts:1226-1264`:
     ```ts
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
   - `src/game/GameManager.ts:1895`: In `update()`, wave clear triggers `this.state = GameState.SHOP; this.pause();`.
   - `src/game/GameManager.ts:228-231`: `pause()` cancels `this.animationFrameId = 0`, but control returns to line 1263 of `this.loop`, which immediately re-schedules `this.animationFrameId = requestAnimationFrame(this.loop)`.
   - `src/game/GameManager.ts:2478-2507`: `gameOver(reason)` sets `this.state = GameState.GAME_OVER` without cancelling `animationFrameId`.
2. **Premature Crisis Abort Logic Flaw**:
   - `src/game/GameManager.ts:1867-1875`:
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
     ```
   - For `SOLAR_FLARE` and `EMP_DISRUPTION`, `(this.crisisState.activeCrisis !== 'ACID_STORM')` evaluates to `true` immediately, even while `timer > 0`.
3. **Web Audio Lifecycle & Teardown**:
   - `src/game/SoundManager.ts:1-35`: `soundManager` is a singleton instance. `init()` checks `if (!this.audioCtx)` and reuses a single `AudioContext`.
   - `src/game/SoundManager.ts`: Contains no `close()`, `destroy()`, or `suspend()` method.
   - `src/game/SoundManager.ts:17-20`: Master analyser connects directly to `this.audioCtx.destination` with no master `GainNode`.
   - `src/components/game-canvas.tsx:877-889`: `handleVisibilityChange` resumes `soundManager` on return, but does not suspend `audioCtx` when `document.hidden === true`.
4. **DOM & Canvas Event Listeners**:
   - `src/components/game-canvas.tsx:896-909`: All 7 window/document listeners (`keydown`, `keyup`, `blur`, `resize`, `orientationchange`, `visibilitychange`, `beforeinstallprompt`) have matching `removeEventListener` calls in `useEffect` cleanup.
   - `src/components/game-canvas.tsx:964-967`: `setInterval(syncAllies, 200)` is cleared via `clearInterval(interval)`.
5. **Canvas 60 FPS Heap Allocations**:
   - `src/game/flagship/FlagshipManager.ts:140-154`: `getSubsystems()` allocates a new array containing 13+ subsystems and an `Array.from` call on every invocation. Called in `update`, `drawBackground`, `drawWorld`, and `drawForeground` (4 times per frame = 240 arrays/sec).
   - `src/game/flagship/FlagshipManager.ts:248`: `new Set([...])` is allocated every single frame in `drawForeground` (60 sets/sec).
   - `src/game/Enemy.ts`: 15 enemy types invoke `ctx.createLinearGradient(...)` or `ctx.createRadialGradient(...)` in `draw()` (lines 1293, 1375, 1441, 1496, etc.), generating ~3,000 CanvasGradient allocations per second with 50 enemies on screen.
   - `src/game/GameManager.ts:2586`: Background gradient created every frame in `draw()`.

---

## 2. Logic Chain

1. From Observation 1, `this.loop` in `GameManager.ts` only checks `if (this.state === GameState.MENU) return;`. Because line 1263 unconditionally calls `requestAnimationFrame(this.loop)`, any transition to `SHOP` or `GAME_OVER` fails to halt the animation loop. Therefore, the game continuously executes `draw()` at 60 FPS in the background of menus, causing unnecessary battery and CPU drain.
2. From Observation 2, line 1874 checks `(this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0)`. When `activeCrisis` is `'SOLAR_FLARE'`, the left operand evaluates to `true` regardless of `this.crisisState.timer`. When regular wave hostiles are destroyed while a solar flare is active, the wave clear condition prematurely evaluates to `true`, transitioning the game to `SHOP` and resetting `activeCrisis = null`, thereby prematurely aborting the crisis.
3. From Observation 3, `SoundManager.ts` lacks a `destroy()` or `suspend()` method, meaning the Web Audio context remains active even if the React component unmounts or the tab is hidden. Furthermore, without a master `GainNode`, active sounds cannot be instantly muted when `toggleMute()` is invoked.
4. From Observation 4, all registered DOM event listeners in `game-canvas.tsx` are correctly mirrored with removal logic in cleanup hooks. The DOM event lifecycle is healthy.
5. From Observation 5, allocating arrays 4 times per frame in `FlagshipManager` and allocating thousands of `CanvasGradient` objects per second across `Enemy.ts` and `GameManager.ts` generates severe garbage collection pressure, leading to frame stutters on mobile and lower-spec devices.

---

## 3. Caveats

- **Scope Boundary**: This investigation was strictly read-only. No source files were edited.
- **Mock Environment**: Verification of Web Audio and canvas performance was conducted via static code inspection and TypeScript type checking (`npx tsc --noEmit`); physical audio hardware behavior depends on the browser implementation (WebKit vs Chromium).
- No other unhandled state machines or un-cleared intervals were found in the codebase.

---

## 4. Conclusion

The Water Invader architecture is generally robust with strict invariant enforcement (`logicalWidth=600`, `logicalHeight=800`, deterministic fixed-step physics, and symmetrical DOM listener cleanup). However, two high-priority logic/lifecycle defects and one performance bottleneck require remediation in Milestone M3:
1. **Fix Game Loop Exit Guard**: Add `if (this.state !== GameState.PLAYING || this.isPaused) return;` at the beginning of `this.loop` in `GameManager.ts` to prevent runaway 60 FPS rendering in `SHOP` and `GAME_OVER`.
2. **Fix Crisis Abort Condition**: Correct line 1874 of `GameManager.ts` to `(this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)` so all crisis types run their full duration.
3. **Audio Lifecycle Hardening**: Add master `GainNode` and `destroy()` / `suspend()` methods to `SoundManager.ts`.
4. **Subsystems & Gradient Caching**: Cache `subsystems` in `FlagshipManager` and replace dynamic enemy gradient allocations with solid accents or cached bitmaps.

---

## 5. Verification Method

1. **TypeScript Compilation Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must exit with code 0.
2. **Static Code Inspection**:
   - Inspect `src/game/GameManager.ts` lines 1226–1264 and 1867–1875.
   - Inspect `src/game/flagship/FlagshipManager.ts` lines 140–154.
   - Inspect `src/game/Enemy.ts` lines 1293–2026.
3. **Automated Reproduction & Regression Tests**:
   - Run `npx playwright test tests/12_crisis_director_e2e.spec.ts` to verify crisis persistence.
   - Run `npx playwright test tests/03_game_mechanics.spec.ts` to verify state transitions.
