# Dispatch for pitch_worker_integration_1

**Role**: Flagship Core Loop & Canvas Integration Architect
**Working Directory**: /Users/user/src/water-invader/.agents/pitch_worker_integration_1
**Task**: Wire all completed flagship subsystems into `FlagshipManager.ts`, `GameManager.ts`, `Player.ts`, `Enemy.ts`, `SoundManager.ts`, and `src/components/game-canvas.tsx`.

**MANDATORY INTEGRITY WARNING**:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

**Inputs**:
- All 5 stream handoffs in `.agents/pitch_worker_stream_*/handoff.md`
- `src/game/flagship/FlagshipManager.ts`
- `src/game/flagship/index.ts`
- `src/game/GameManager.ts`
- `src/game/Player.ts`
- `src/game/Enemy.ts`
- `src/game/SoundManager.ts`
- `src/components/game-canvas.tsx`

**Strict Invariants**:
- `logicalWidth` (600/720) and `logicalHeight` (800/960) in `GameManager.ts` and `Enemy.ts` must NOT be changed.
- Responsive scaling must remain strictly CSS-based.
- Zero external assets.
- Must compile cleanly: `npx tsc --noEmit` and `npm run build`.

**Instructions**:
1. In `src/game/flagship/FlagshipManager.ts`:
   - Instantiate and register the 5 subsystem packages (`weapons`, `environment`, `progression`, `factions`, `modes`, `sensory`).
   - Wire all lifecycle hooks (`init`, `update`, `drawBackground`, `drawWorld`, `drawForeground`, `handleInput`, `reset`) and callbacks (`onWaveComplete`, `onEnemyKilled`, `onPlayerDamage`).
2. In `src/game/GameManager.ts`:
   - Instantiate `FlagshipManager`.
   - Call `flagshipManager.update(dt, context)` during the update loop.
   - Call `flagshipManager.drawBackground(ctx, bounds)` in Layer 1.
   - Call `flagshipManager.drawWorld(ctx, bounds)` in Layer 2.
   - Call `flagshipManager.drawForeground(ctx, bounds)` in Layer 3.
   - Forward keyboard inputs (`1`, `2`, `3`, `4`, `Q`, `E`, `R`, `F`, `C`, `Space`) and click inputs.
   - Forward wave transitions and entity death events to flagshipManager.
3. In `src/game/SoundManager.ts`:
   - Add procedural audio synth methods for flagship features (cavitation implosion, laser hum, harpoon tension creak, sonar ping sweep, steam hiss).
4. In `src/components/game-canvas.tsx`:
   - Expose flagship HUD toggle or keybind helpers if needed.
5. Verify build and type-check:
   - Run `npx tsc --noEmit`
   - Run `npm run build`
6. Write handoff report to `/Users/user/src/water-invader/.agents/pitch_worker_integration_1/handoff.md` and notify parent.
