## 2026-09-17T08:35:44Z

You are worker_physics_stream_cd_1, an implementation worker.
Working Directory: /Users/user/src/water-invader/.agents/worker_physics_stream_cd_1
Original Request Path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Collaboration Guide Path: /Users/user/src/water-invader/COLLABORATION.md
Scope Document: /Users/user/src/water-invader/.agents/orchestrator_physics_audit_1/SCOPE.md
Reproduction Test Suite: /Users/user/src/water-invader/tests/physics_edgecase_comprehensive.spec.ts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE OWNERSHIP:
You exclusively own and may edit ONLY these files:
- src/game/Enemy.ts
- src/game/flagship/weapons/HydraulicHarpoon.ts
- src/game/flagship/factions/KrakenPrimeBoss.ts
- src/game/flagship/factions/HadalBioHorrors.ts
- src/game/Helper.ts

DO NOT modify any other files.

TASKS:
1. In `src/game/Enemy.ts`:
   - In `takeDamage(damage: number)`:
     When `this.hp <= 0`, set:
     ```typescript
     this.hp = 0;
     this.isDead = true;
     ```
     This ensures laser and torpedo lethal damage properly marks enemies as dead and prevents immortal zombie enemies / wave lock.
   - In `hasAlliedObstacleInShotPath(allies)`:
     When `Math.abs(selfCenterX - allyCenterX) < 1e-3` (identical X coordinate tie), break symmetry using entity unique ID or pointer comparison:
     ```typescript
     const myId = (this as any).id ?? this.position.y;
     const allyId = (ally as any).id ?? ally.position.y;
     slideDir = myId <= allyId ? -1 : 1;
     ```
     This ensures identical-X allies diverge in opposite directions instead of locking step together.
2. In `src/game/flagship/weapons/HydraulicHarpoon.ts`:
   - In continuous collision detection for flying harpoon head (`updateFlying`):
     Perform continuous swept line-segment CCD between `this.prevHeadPosition` and `this.headPosition` against each enemy's bounding box:
     Check if the line segment from `(prevX, prevY)` to `(currX, currY)` intersects the rectangle `[ex, ey, ew, eh]` (e.g. via slab test or ray-box / segment-box intersection).
     This guarantees harpoon traveling at 650 px/s never tunnels through thin or small enemies between frames.
3. In `src/game/flagship/factions/KrakenPrimeBoss.ts`:
   - In `CharybdisTentacle.updateIK()`:
     When `Math.hypot(dx, dy) < 4`, hold the previous segment angle instead of calling `Math.atan2(0, 0) = 0`, avoiding accordion $0 \leftrightarrow \pi$ flipping.
   - In Phase 2 Maw inhalation vortex pull (`updatePhase2`):
     When `player.velocity && player.velocity.y > 0` (or `player.isMovingDown`), reduce `pullSpeed` by 75% or cap pull speed so player downward movement allows descending and escaping the vortex.
   - In Phase 3 breach charge:
     Clamp charge exit and entry coordinates so the boss does not reset off-screen to 550 and pop 130px to 420.
   - In missile swat check line 357:
     Ensure checks safely verify if bullet is homing (e.g. `(b as any).isHoming || (b as any).target || b instanceof (HomingMissile as any)`).
4. In `src/game/flagship/factions/HadalBioHorrors.ts`:
   - In `update(deltaTime, player)`:
     Use `player.baseSpeed || 300` properly, ensuring `player.baseSpeed` is respected and not trampled.
   - In Broodmother roar speed multiplication (`this.units` velocity scaling):
     Clamp each unit's velocity: `const spd = Math.hypot(u.velocity.x, u.velocity.y); if (spd > 400) { u.velocity.x = (u.velocity.x / spd) * 400; u.velocity.y = (u.velocity.y / spd) * 400; }`.
5. In `src/game/Helper.ts`:
   - Clamp helper vessel's Y coordinate: `this.position.y = Math.max(30, Math.min(this.canvasHeight - 50, this.position.y));`.

VERIFICATION:
Run `npx tsc --noEmit` and `npx playwright test tests/physics_edgecase_comprehensive.spec.ts -g "STREAM-A-03|STREAM-C|STREAM-D"` and confirm your target tests pass with 0 errors.
Document changes and results in `/Users/user/src/water-invader/.agents/worker_physics_stream_cd_1/handoff.md` and notify the orchestrator via send_message.
