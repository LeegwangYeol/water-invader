## 2026-09-23T02:21:36Z
You are the Security, CCD & Math Defense Worker for Milestone M2 of the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_worker_m2_sec_math_1
Project root: /Users/user/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely.
- Read /Users/user/src/water-invader/.agents/ti_survey_sec_math_1/report.md and handoff.md.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

FILES YOU OWN EXCLUSIVELY:
- `src/game/Bullet.ts`
- `src/game/crisis/CrisisSovereign.ts`
- `src/game/flagship/factions/AutomatonShieldGrid.ts`
- `src/game/flagship/weapons/BioluminescentLaser.ts`
- `src/game/Entity.ts`
- `src/game/flagship/weapons/CavitationTorpedo.ts`
- `src/game/flagship/factions/HadalBioHorrors.ts`
- `src/game/flagship/factions/AutomatonPhalanx.ts`
- `src/components/game-canvas.tsx` (specifically pointer coordinate clamping)

TASKS TO IMPLEMENT:
1. `src/game/Bullet.ts` & `src/game/crisis/CrisisSovereign.ts`:
   - DEF-SEC-01: In `Bullet.ts:285-305`, add `Number.isFinite()` and epsilon distance validation before `Math.atan2` for homing target angles. Protect `this.smokeTrail` from NaN coordinates.
   - In `CrisisSovereign.ts:213-217, 598`, guard `this.eyeAngle` against NaN coordinates so phase rendering never passes NaN to `ctx.arc()`.
2. `src/game/flagship/factions/AutomatonShieldGrid.ts` & `BioluminescentLaser.ts`:
   - In `AutomatonShieldGrid.ts:211`, guard `bulletSpeed` against NaN / Infinity.
   - In `BioluminescentLaser.ts:420-435`, guard `lenSq` against NaN before vector projection.
3. `src/game/Entity.ts` & `CavitationTorpedo.ts`:
   - DEF-SEC-02: Fix `sweptAABB` false positives in `Entity.ts`.
   - In `CavitationTorpedo.ts`, implement continuous swept segment collision checking from `prevPosition` to current position so torpedoes traveling at 580 px/s do not tunnel through enemies or barricades during lag frames.
4. `src/game/flagship/factions/HadalBioHorrors.ts` & `AutomatonPhalanx.ts`:
   - DEF-SEC-03: Implement 4-sided rectangular bounds culling (`x < -150 || x > 750 || y < -150 || y > 850`) in `HadalBioHorrors.ts`.
   - In `HadalBioHorrors.ts`, freeze Broodmother parasite spawn timers when game state is `SHOP` or paused.
   - In `AutomatonPhalanx.ts:272`, cull `railSlugs` that exit the playfield in any direction.
5. `src/components/game-canvas.tsx`:
   - DEF-SEC-04: Clamp pointer coordinates to `[0, logicalWidth]` and `[0, logicalHeight]` with `Number.isFinite()` check before forwarding to `gameManager.handlePointer()`.
6. `tests/m2_sec_math_defense.spec.ts`:
   - Create automated regression unit and integration tests verifying all 4 defect areas (NaN resistance, CCD anti-tunneling, 4-sided bounds culling, and pointer clamping).

VERIFICATION REQUIREMENTS:
- Run `npx tsc --noEmit` (must exit 0).
- Run `npm run build` (must compile with 0 errors).
- Run `npx playwright test tests/m2_sec_math_defense.spec.ts`.
- Ensure all tests pass.

OUTPUT:
- Write `changes.md` and `handoff.md` in `/Users/user/src/water-invader/.agents/ti_worker_m2_sec_math_1/`.
- Send a completion message to parent with verification commands and results.
