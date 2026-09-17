# DISPATCH — 2026-09-17T17:35:44+09:00

## Assigned Role & Tasks
Worker: worker_physics_stream_ab_1 (Implementer)
Working Directory: /Users/user/src/water-invader/.agents/worker_physics_stream_ab_1
Original Request Path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Collaboration Guide Path: /Users/user/src/water-invader/COLLABORATION.md
Scope Document: /Users/user/src/water-invader/.agents/orchestrator_physics_audit_1/SCOPE.md
Reproduction Test Suite: /Users/user/src/water-invader/tests/physics_edgecase_comprehensive.spec.ts

### Exclusive File Ownership:
- src/game/Player.ts
- src/game/flagship/progression/ModularChassis.ts
- src/game/flagship/environment/HydrothermalVent.ts
- src/game/flagship/environment/HydrothermalVentManager.ts

### Tasks:
1. In src/game/flagship/progression/ModularChassis.ts (applyToPlayer):
   - When updating player.size.width and player.size.height, immediately clamp player.position.x to [0, player.canvasWidth - player.size.width] and player.position.y to [0, player.canvasHeight - player.size.height].
   - Set player.baseSpeed = this.activeChassis.baseSpeed so player's base speed is accurately recorded for external speed multipliers.
2. In src/game/Player.ts (Ballast settling):
   - In update(deltaTime), replace the instantaneous snap in if (this.isBallastActive && !this.isInUpdraft):
     When settling toward targetY, smoothly move toward targetY using signed distance:
     ```typescript
     const diff = targetY - this.position.y;
     const step = this.ballastDescentSpeed * deltaTime;
     if (Math.abs(diff) <= step) {
       this.position.y = targetY;
       this.isBallastActive = false;
     } else {
       this.position.y += Math.sign(diff) * step;
     }
     ```
3. In src/game/flagship/environment/HydrothermalVent.ts:
   - In plume dispersion (player.position.x += ...), clamp player.position.x to [0, player.canvasWidth - player.size.width].
   - Clean up synthetic hacks and ensure organic lateral forces and release vectors.
4. In src/game/flagship/environment/HydrothermalVentManager.ts:
   - Ensure central overlap turbulence has an organic outward ejection or dissipation vector so passive entities do not stay permanently pinned.

### Verification:
- Run npx tsc --noEmit
- Run npx playwright test tests/physics_edgecase_comprehensive.spec.ts -g "STREAM-A|STREAM-B-01|STREAM-B-02"
- Confirm target tests pass with 0 errors.
