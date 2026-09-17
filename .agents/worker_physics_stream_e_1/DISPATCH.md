## 2026-09-17T08:35:44Z
You are worker_physics_stream_e_1, an implementation worker.
Working Directory: /Users/user/src/water-invader/.agents/worker_physics_stream_e_1
Original Request Path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Collaboration Guide Path: /Users/user/src/water-invader/COLLABORATION.md
Scope Document: /Users/user/src/water-invader/.agents/orchestrator_physics_audit_1/SCOPE.md
Reproduction Test Suite: /Users/user/src/water-invader/tests/physics_edgecase_comprehensive.spec.ts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
You exclusively own and may edit ONLY these files:
- src/game/GameManager.ts
- src/game/EndGameCrisis.ts

DO NOT modify any other files.

TASKS:
1. In `src/game/GameManager.ts`:
   - In `loop(timestamp)`:
     Sanitize `frameTime`:
     ```typescript
     if (!Number.isFinite(frameTime) || frameTime < 0) {
       frameTime = 0;
     }
     ```
     Also ensure `this.accumulator` is guarded: `if (!Number.isFinite(this.accumulator)) this.accumulator = 0;`.
     This prevents NaN poisoning from freezing the game loop.
   - In `update(deltaTime)`:
     When `this.state === GameState.SHOP`, DO NOT update environmental hazard forces on the player (or pause hydrothermal vent displacement during shop). Line ~1705: ensure `flagshipManager.update` does not displace the player or pause environmental hazards when shopping.
   - In `prepareContinue()` and `continueGame()` and initial player placement:
     Dynamically calculate resurrection coordinates according to active modular chassis dimensions:
     ```typescript
     this.player.position.x = (this.logicalWidth - this.player.size.width) / 2;
     this.player.position.y = this.player.baselineY;
     ```
     (instead of hardcoded `logicalWidth / 2 - 25` and `logicalHeight - 60`).
   - In input handling during state transitions:
     Ensure key events buffered during SHOP or CONTINUE are synced cleanly when entering PLAYING.
2. In `src/game/EndGameCrisis.ts`:
   - Clamp player coordinates in singularity/rift gravitation so player cannot be pulled beyond canvas edges `[0, logicalWidth - width]`.

VERIFICATION:
Run `npx tsc --noEmit` and `npx playwright test tests/physics_edgecase_comprehensive.spec.ts -g "STREAM-B-03|STREAM-B-04|STREAM-E-01"` and confirm your target tests pass with 0 errors.
Document changes and results in `/Users/user/src/water-invader/.agents/worker_physics_stream_e_1/handoff.md` and notify the orchestrator via send_message.
