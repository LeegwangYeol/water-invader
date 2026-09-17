# Dispatch: Buoyancy Hydrodynamic Convergence Remediation Worker (Iteration 3)
Assigned to: buoyancy_worker_3
Role: teamwork_preview_worker
Target: Eliminate multi-vent overlap convergence trap in HydrothermalVent.ts by adding prevailing ambient drift to plume cap lateral dispersion and ensuring complete passive descent across all 6 modular chassis hulls.
Original Request: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
Scope: /Users/user/src/water-invader/.agents/orchestrator_physics_buoyancy_1/SCOPE.md
Collaboration Guide: /Users/user/src/water-invader/COLLABORATION.md
Challenger Gate 2 Handoff: /Users/user/src/water-invader/.agents/buoyancy_challenger_gate2_1/handoff.md
Challenger Gate 2 Test Suite: /Users/user/src/water-invader/tests/adversarial_buoyancy_gate2_verification.spec.ts
## 2026-09-17T05:23:40Z

You are buoyancy_worker_3, a teamwork_preview_worker agent.
Your Working Directory: /Users/user/src/water-invader/.agents/buoyancy_worker_3
Your Write Ownership:
- `src/game/flagship/environment/HydrothermalVent.ts`
- `tests/adversarial_buoyancy_gate2_verification.spec.ts`

Read the following files before starting:
- ORIGINAL_REQUEST.md: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md
- Challenger Gate 2 Handoff: /Users/user/src/water-invader/.agents/buoyancy_challenger_gate2_1/handoff.md
- Test File: /Users/user/src/water-invader/tests/adversarial_buoyancy_gate2_verification.spec.ts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context & Problem to Solve:
In `tests/adversarial_buoyancy_gate2_verification.spec.ts`, Challenger Gate 2 demonstrated that when a submarine is placed at x = 300, y = 130 under passive drift (no input keys pressed), Vent Left (anchorX=180, pushing East) and Vent Right (anchorX=420, pushing West) cancel out horizontally (+v_x - v_x = 0), trapping the passive submarine at x ≈ 300. Because both halos overlap at the top of the canvas, the submarine is held in an equilibrium convergence trap and cannot descend to baseline depth (y ≈ 740).

Solution:
1. In `src/game/flagship/environment/HydrothermalVent.ts`:
   In `HydrothermalVent.prototype.update`:
   In the lateral dispersion block near the plume cap:
   The natural ocean environment in Water Invader has a prevailing Eastward upper surface current (+75 px/s at y < 400 per `OceanCurrent.ts`). When fluid mushrooms at the plume cap, the ambient surface flow breaks the symmetry between opposing vents:
   ```typescript
   // Radial lateral outward dispersion near the plume cap with prevailing ambient surface drift
   if (liftRatio < 1.0) {
     const dispersionRatio = 1.0 - liftRatio;
     const dispersionSpeed = (this.state === VentState.ERUPTING ? 120 : 80) * dispersionRatio * deltaTime;
     const sign = playerCenterX >= this.anchorX ? 1 : -1;
     // Prevailing ambient surface drift (+60 px/s Eastward) carries dispersing fluid out of the central stagnation zone
     const ambientSurfaceDrift = 60 * dispersionRatio * deltaTime;
     player.position.x += sign * dispersionSpeed + ambientSurfaceDrift;
   }
   ```
   Notice the fluid dynamics effect:
   - In the overlap zone (x ≈ 300), the net lateral velocity is (+D + A) + (-D + A) = 2A = +120 * dispersionRatio * deltaTime Eastward!
   - The submarine is smoothly carried Eastward across the top past Vent Right (x = 420) and past x = 554 into calm open sea on the East flank.
   - Once outside the halo, `inHalo` becomes false, `isInUpdraft` becomes false, and the submarine's ballast descent (165 px/s) smoothly carries the vessel all the way down to `baselineY` (734--750 px) without any player input required!
   - On the West flank (x < 180), Vent Left pushes Westward (-D + A < 0), carrying the vessel to x < 46 into the calm West flank, where it also descends to baseline.
   - At mid-depth (y >= 220, `liftRatio = 1.0`), `dispersionRatio = 0.0`, so dispersion and ambient drift are zero, preserving 100% of mid-depth lift and existing tests!

2. In `tests/adversarial_buoyancy_gate2_verification.spec.ts`:
   Update the assertions in `GATE2-CHASSIS` and `GATE2-GRID` so they assert that the submarine DOES reach baseline depth under passive drift:
   - `expect(reachedBaseline).toBe(true);`
   - `expect(finalY).toBeGreaterThan(chassis.baselineY - 10);`
   - `expect(descentFraction).toBeGreaterThan(0.95);`

3. Verification Tasks:
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run build` (0 errors).
   - Run `SKIP_WEBSERVER=1 npx playwright test tests/adversarial_buoyancy_gate2_verification.spec.ts` (must pass 100%).
   - Run `npx playwright test tests/playtest_buoyancy_drift_escape.spec.ts` (all 5 tests must pass 100%).
   - Run `SKIP_WEBSERVER=1 npx playwright test tests/playtest_stream_b_vents_currents.spec.ts` (all 8 tests must pass 100%).

Deliverable:
Write a comprehensive report to `/Users/user/src/water-invader/.agents/buoyancy_worker_3/handoff.md` with exact command outputs and test results, and send a message.
