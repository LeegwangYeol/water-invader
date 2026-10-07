## 2026-09-23T02:10:04Z
You are the Physics & Kinematics Remediation Worker for Milestone M1 of the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_worker_m1_physics_1
Project root: /Users/user/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely.
- Read /Users/user/src/water-invader/.agents/ti_survey_qa_physics_1/report.md and handoff.md.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

FILES YOU OWN EXCLUSIVELY:
- `src/game/Player.ts`
- `src/game/flagship/environment/HydrothermalVent.ts`
- `src/game/flagship/weapons/HydraulicHarpoon.ts`
- `src/game/GameManager.ts` (specifically for M1 post-flagship clamp and tether cleanup)

TASKS TO IMPLEMENT:
1. `src/game/Player.ts`:
   - DEF-PHY-01: Update `this.velocity.x` and `this.velocity.y` accurately each frame.
     - When moving left/right, set `this.velocity.x` according to `this.speed`.
     - When ballast descent is active, set `this.velocity.y` to the positive descent speed (`step / deltaTime` or `this.ballastDescentSpeed`).
     - Set `(this as any).isMovingDown = this.velocity.y > 0;` so both conditions checked by `KrakenPrimeBoss.ts:426` (`(player.velocity && player.velocity.y > 0) || (player as any).isMovingDown`) function naturally for players.
     - When Glacial Oblivion or external forces modify `player.velocity`, factor velocity into movement calculations without breaking arcade responsiveness.
2. `src/game/flagship/environment/HydrothermalVent.ts`:
   - DEF-PHY-02: Fix dormant lift and the $y \approx 155$ trap:
     - Set `baseLift = 0` when `this.state === VentState.DORMANT` (or zero lift when dormant).
     - Only set `(player as any).isInUpdraft = true` when active upward lift is actually being applied (e.g. `this.state === VentState.ERUPTING || (this.state === VentState.ACTIVE && liftRatio >= 0.5)`).
     - Ensure the player's ballast system descends back to baseline operating depth ($y=740$) smoothly when outside the active plume or when dormant.
3. `src/game/flagship/weapons/HydraulicHarpoon.ts`:
   - DEF-PHY-03: Boss slingshot instakill fix:
     - In `releaseSlingshot` projectile update (lines 704-706), when crossing $y \le -60$, check `if (!proj.entity.isBoss && !(proj.entity as any).isApexBoss)`. If it IS a boss, do NOT set `isDead = true`! Apply 180 slingshot impact damage, and clamp/bounce the boss back into the active arena ($y = 120$).
   - DEF-PHY-04/05: Slingshot velocity clamp & damping:
     - In lines 237-243, clamp `this.playerVelocity.x` and `y` to `[-600, 600]`. If distance jumped > 200px in a single frame, reset `this.prevPlayerPos` without computing huge delta.
     - In spring damping, factor in target relative velocity where available to prevent spring chatter.
   - Add a public method `resetTether()` on `HydraulicHarpoonSystem` so wave transitions can cleanly detach any orphaned tether.
4. `src/game/GameManager.ts`:
   - DEF-PHY-08: Add post-subsystem boundary clamp at the end of update (after `flagshipManager.update`):
     ```ts
     this.player.position.x = Math.max(0, Math.min(this.logicalWidth - this.player.width, this.player.position.x));
     this.player.position.y = Math.max(0, Math.min(this.logicalHeight - this.player.height, this.player.position.y));
     ```
   - DEF-PHY-06: On wave transition / continue / restart, ensure any active harpoon tether is reset so dead/cleared enemies do not leave ghost tethers.

VERIFICATION REQUIREMENTS:
- Run `npx tsc --noEmit` and ensure 0 errors.
- Run `npx playwright test tests/physics_edgecase_comprehensive.spec.ts` and `tests/playtest_buoyancy_drift_escape.spec.ts`.
- Ensure all tests pass with 0 errors.

OUTPUT:
- Write `changes.md` and `handoff.md` in `/Users/user/src/water-invader/.agents/ti_worker_m1_physics_1/`.
- Send a completion message to parent with verification commands and results.
