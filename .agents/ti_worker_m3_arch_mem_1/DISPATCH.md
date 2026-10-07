## 2026-09-23T03:09:02Z

You are the Architecture, State & Memory Lifecycle Worker for Milestone M3 of the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_worker_m3_arch_mem_1
Project root: /Users/user/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely.
- Read /Users/user/src/water-invader/.agents/ti_survey_arch_memory_1/report.md and handoff.md.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

FILES YOU OWN EXCLUSIVELY:
- `src/game/GameManager.ts` (specifically game loop rAF exit guards and line 1874 crisis clear condition)
- `src/game/flagship/FlagshipManager.ts` (subsystem array caching and shop state freeze)
- `src/game/SoundManager.ts` (master GainNode, suspend, resume, mute)
- `src/game/Enemy.ts` (gradient allocation optimizations)
- `src/components/game-canvas.tsx` (visibilitychange audio suspend/resume hook)

TASKS TO IMPLEMENT:
1. `src/game/GameManager.ts`:
   - DEF-ARC-01: In `this.loop` (lines 1226-1264):
     - Add exit guard at start of loop: `if (this.state !== GameState.PLAYING || this.isPaused) { this.animationFrameId = 0; return; }`
     - Only schedule `this.animationFrameId = requestAnimationFrame(this.loop)` at line 1263 if `this.state === GameState.PLAYING && !this.isPaused`.
     - In `resume()`, `start()`, `continueGame()`, and when exiting `SHOP`, if `this.state === GameState.PLAYING && !this.isPaused && !this.animationFrameId`, start the loop: `this.animationFrameId = requestAnimationFrame(this.loop)`.
     - In `pause()` and `gameOver()`, cancel `this.animationFrameId` and set to 0.
   - DEF-ARC-02: Fix line 1874:
     - Replace `(this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))`
       with `(this.crisisState.activeCrisis === null || this.crisisState.timer <= 0)`.
     - This guarantees that non-Acid crises (like Solar Flare, EMP, etc.) run their full duration and do not abort prematurely when regular wave enemies die!
2. `src/game/flagship/FlagshipManager.ts`:
   - DEF-ARC-03: Cache the array of subsystems in `private cachedSubsystems: ISubsystem[]` upon construction or system change rather than allocating 4 new arrays + `Array.from` every single frame (240 arrays/sec). In `drawForeground`, avoid allocating `new Set` every frame.
3. `src/game/SoundManager.ts` & `src/components/game-canvas.tsx`:
   - DEF-ARC-04:
     - Add master `GainNode` connected between master analyser and destination. When muted, set master gain to 0.
     - Add `public suspend(): Promise<void>` and `public resume(): Promise<void>` methods to `SoundManager`.
     - In `game-canvas.tsx:handleVisibilityChange`: call `soundManager.suspend()` when `document.hidden` is true, and `soundManager.resume()` when returning.
4. `src/game/Enemy.ts`:
   - DEF-ARC-03: Optimize dynamic gradient creations in `draw()`, using solid accents or caching where appropriate to reduce GC pressure.
5. `tests/m3_arch_lifecycle.spec.ts`:
   - Create automated regression unit and integration tests verifying all 4 defect areas: loop halt in menus, crisis duration persistence, subsystem array caching, and audio lifecycle management.

VERIFICATION REQUIREMENTS:
- Run `npx tsc --noEmit` (must exit 0).
- Run `npm run build` (must compile with 0 errors).
- Run `npx playwright test tests/m3_arch_lifecycle.spec.ts`.
- Run all prior milestone tests (`tests/m1_physics_remediation.spec.ts`, `tests/m2_sec_math_defense.spec.ts`) to ensure zero regressions.

OUTPUT:
- Write `changes.md` and `handoff.md` in `/Users/user/src/water-invader/.agents/ti_worker_m3_arch_mem_1/`.
- Send a completion message to parent with verification commands and results.
