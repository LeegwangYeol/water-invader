## 2026-08-28T11:50:18Z

You are Worker 1 (Core Game Engine Specialist) for the Water Invader project.
Working directory: /Users/a7111/src/water-invader/.agents/teamwork_preview_worker_engine_1
Original Request: /Users/a7111/src/water-invader/.agents/ORIGINAL_REQUEST.md
Project Root: /Users/a7111/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your File Ownership (Exclusive):
- `src/game/GameManager.ts`
- `src/game/Player.ts`
- `src/game/Enemy.ts`
- `src/game/Bullet.ts`
- `src/game/Particle.ts`
- `src/game/Barricade.ts`
- `src/game/SoundManager.ts`
- `src/game/Helper.ts`
Do NOT edit files outside of `src/game/`.

Your Implementation Scope:
1. **Fixed Timestep Physics Loop (`GameManager.ts`)**:
   - Implement fixed timestep accumulator (FIXED_STEP = 1/60s) with clamping to guarantee deterministic physics across 60Hz/120Hz/144Hz and prevent bullet tunneling.
2. **In-Place Array Compaction (`GameManager.ts`)**:
   - Replace hot-loop `.filter()` on `bullets`, `enemies`, `helpers`, `barricades` in `GameManager.update()` with two-pointer in-place writeIndex compaction.
3. **Software Gaussian Blur Removal (`Enemy.ts`, `Player.ts`, `GameManager.ts`)**:
   - Eliminate heavy CPU `ctx.shadowBlur` operations. Replace with lightweight layered concentric alpha arcs/draws or cached gradients.
4. **Canvas State Optimization & Batching**:
   - Streamline `ctx.save()` / `ctx.restore()` in `Particle.draw()`, `Bullet.draw()`, and batch background bubble rendering.
   - Remove unused `hitEntityIds` Set from `Bullet.ts`.
5. **Logic & Gameplay Bug Fixes**:
   - BUG-01: In `GameManager.init()`, reset `this.currency = 0;`.
   - BUG-02: Scale barricade gnawing damage by `deltaTime` (`barricade.hp -= 6.0 * deltaTime;`).
   - BUG-04: Fix `handleKeyUp` in `GameManager.ts` so releasing one key checks whether alternate keys are still held in `keysPressed`.
   - BUG-05: Tune `ROGUE_MECH` bullet damage in `Enemy.ts` from 3 to 2 so a player with 3 HP survives a hit.
   - BUG-06: In bottom boundary enemy breakthrough (`GameManager.ts`), check `this.player.invincibilityTimer <= 0` before dealing damage and apply invincibilityTimer.
   - BUG-07: Clean up dead `isResting` and `waveRestTimer` canvas overlay code in `GameManager.ts`.

Verification Requirements:
- Run `npx tsc --noEmit` and verify 0 TypeScript errors.
- Write your completion report to `/Users/a7111/src/water-invader/.agents/teamwork_preview_worker_engine_1/report.md` and `handoff.md`.
- Send your completion message back via send_message.
