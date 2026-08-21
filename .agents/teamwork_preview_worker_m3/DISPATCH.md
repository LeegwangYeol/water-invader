## 2026-08-21T09:41:03Z
You are the implementation Worker for Milestone 3 of the Water Invader QA Sweep and Auto-fix project.

# Working Directory & Identity
- Working Directory: C:\src\SpaceInvader\.agents\teamwork_preview_worker_m3
- Original Request: C:\src\SpaceInvader\.agents\ORIGINAL_REQUEST.md
- Scope: UI/UX, HiDPI Scaling, Audio/Visual FX & Boss Polish (Milestone 3: F-10, F-11, F-13, F-14)
- Files Owned Exclusively: `src/components/game-canvas.tsx`, `src/game/SoundManager.ts`, `src/game/Enemy.ts`, `src/game/GameManager.ts`, `src/game/Player.ts`

# MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

# Specific Tasks to Implement:
1. **F-10 [HIGH] Desktop Canvas 12% Horizontal Stretch Fix**:
   - In `src/components/game-canvas.tsx`, remove `sm:aspect-auto` on the canvas wrapper so it consistently maintains the `aspect-[3/4]` aspect ratio across mobile, tablet, and desktop displays without horizontal stretching.
2. **F-11 [HIGH] Retina & HiDPI Canvas Scaling**:
   - In `src/components/game-canvas.tsx` and `src/game/GameManager.ts`, support `window.devicePixelRatio` scaling:
     - Set backing canvas width and height to `600 * dpr` and `800 * dpr`.
     - In `GameManager.draw()`, wrap drawing with `ctx.save()`, `ctx.scale(dpr, dpr)` and `ctx.restore()` so logical coordinate space remains 600x800 while crisp on Retina/HiDPI displays.
3. **F-13 [HIGH] Top HUD Overlay Occlusion Fix**:
   - In `src/game/GameManager.ts`, adjust the enemy formation spawn Y offset from Y:40 down to Y:80 (and Boss spawn from Y:50 to Y:90) so enemies and bullets do not emerge from behind top HUD overlay cards.
4. **F-14 [HIGH] Boss HP Bar & Enhanced Audio/Visual Feedback**:
   - **Boss HP Bar**: When Wave 5 Boss is alive, render a prominent Boss health bar at the top of the canvas (or via HUD state callback `bossHp` / `bossMaxHp`) with animated shield/HP status.
   - **Hit Flash FX**: In `Player.ts` and `Enemy.ts`, add a `hitFlashTimer: number = 0` (0.08s). When taking damage, set `hitFlashTimer = 0.08`. When `hitFlashTimer > 0`, draw white silhouette overlay or brighten sprite.
   - **Audio FX Suite & Mute**: In `src/game/SoundManager.ts`:
     - Implement missing audio methods: `playPlayerHit()`, `playEnemyHit()`, `playShieldBreak()`, `playVictory()`, `playGameOver()`.
     - Implement `toggleMute(): boolean` and `isMuted: boolean` state.
     - Add clean node disconnect in all `osc.onended = () => { osc.disconnect(); gain.disconnect(); }` to prevent audio memory leaks.
     - In `game-canvas.tsx`, add a Mute/Unmute toggle button in the HUD controls.

# Verification Requirements:
- Run `npm run build` and `npx tsc --noEmit` to verify type safety and compilation.
- Run `npx playwright test` to verify all test suites pass.
- Write your full report to `C:\src\SpaceInvader\.agents\teamwork_preview_worker_m3\handoff.md`.
- Notify parent orchestrator via `send_message` when complete.
