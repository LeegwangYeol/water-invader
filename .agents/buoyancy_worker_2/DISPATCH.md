# Dispatch: Buoyancy Remediation Worker (Iteration 2)
Assigned to: buoyancy_worker_2
Role: teamwork_preview_worker
Target: Fix multi-vent overlap passive trap in HydrothermalVent.ts and fix BUOYANCY-E2E-01 wave clear deadlock in tests/playtest_buoyancy_drift_escape.spec.ts.
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
Reviewer 2 Handoff: /Users/user/src/water-invader/.agents/buoyancy_reviewer_2/handoff.md
Challenger 2 Handoff: /Users/user/src/water-invader/.agents/buoyancy_challenger_2/handoff.md
Gate Status: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/GATE_STATUS.md

## 2026-09-17T05:14:00Z
You are buoyancy_worker_2, a teamwork_preview_worker agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_worker_2
Your Write Ownership:
- `src/game/flagship/environment/HydrothermalVent.ts`
- `tests/playtest_buoyancy_drift_escape.spec.ts`

Remediation Tasks:
1. Fix Multi-Vent Overlap Passive Trap in `src/game/flagship/environment/HydrothermalVent.ts`:
   In `HydrothermalVent.prototype.update`:
   Currently, whenever `inHalo || inCore`, `(player as any).isInUpdraft = true;` is unconditionally set, which suppresses ballast settling in `Player.ts:update`. At $y = 130$ in the overlap zone between Vent Left and Vent Right ($x \approx 300$), opposing lateral dispersion vectors cancel out and vertical lift is $0\text{ px/s}$ (`liftRatio = 0`), yet `isInUpdraft = true` blocks ballast settling, creating a permanent passive ceiling trap.
   Refine the `isInUpdraft` assignment:
   Only set `(player as any).isInUpdraft = true;` when the upward buoyant force is genuinely dominant:
   ```typescript
   if (inCore || liftRatio >= 0.5) {
     (player as any).isInUpdraft = true;
   }
   ```
   This ensures that near the plume cap in the cooling outer halo ($y < 175$, `liftRatio < 0.5`), ballast settling ($165\text{ px/s}$) is NOT suppressed. The vessel naturally sinks down into the deepening clear water gap between the vents and settles all the way to baseline depth ($y = 740$), completely eliminating the passive overlap trap!
   Meanwhile, at mid-depth ($y \ge 220$, `liftRatio = 1.0`) or in the scalding core, `isInUpdraft` remains `true`, perfectly preserving pure $+160\text{ px/s}$ and $+260\text{ px/s}$ upward lift required by `STREAM-B-06` and `BUOYANCY-01`.

2. Fix BUOYANCY-E2E-01 Deadlock in `tests/playtest_buoyancy_drift_escape.spec.ts`:
   In `BUOYANCY-E2E-01` around line 179:
   Currently `gm.enemies = [];` triggers `remainingHostiles === 0` in `GameManager.ts:1810`, transitioning the state machine from `GameState.PLAYING` to `GameState.SHOP` ("WAVE CLEARED"). In `SHOP` state, keyboard inputs (`page.keyboard.down('ArrowLeft')`) are ignored, causing the test to time out.
   Replace `gm.enemies = [];` with:
   ```typescript
   // Retain one offscreen inert enemy so remainingHostiles > 0 and GameManager stays in PLAYING state
   const dummyEnemy = new (window as any).Enemy(-500, -500, 600, 1, 'NORMAL', 800);
   dummyEnemy.isDead = false;
   gm.enemies = [dummyEnemy];
   ```

3. Verification Tasks:
   - Run `npx tsc --noEmit` (must exit 0).
   - Run `npm run build` (must exit 0).
   - Run `npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts` (all 5 tests, including BUOYANCY-E2E-01, must pass 100%).
   - Run `SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_modular_overlap.spec.ts` (must pass 100%).
   - Run `SKIP_WEBSERVER=1 npx playwright test tests/playtest_stream_b_vents_currents.spec.ts` (must pass 100%).

Deliverable:
Write a full report to `/Users/user/src/water-invader/.agents/buoyancy_worker_2/handoff.md` with exact commands and test results, and send a message.

