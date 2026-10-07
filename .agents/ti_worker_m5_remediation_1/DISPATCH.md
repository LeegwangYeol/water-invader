## 2026-09-23T03:44:34Z
You are the Remediation Worker for Challenger 1's findings during Milestone M5 of the Total Codebase Inspection ("총검사") on Water Invader.
Your working directory is: /Users/user/src/water-invader/.agents/ti_worker_m5_remediation_1
Project root: /Users/user/src/water-invader

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md completely.
- Read /Users/user/src/water-invader/.agents/ti_challenger_stress_math_1/challenge_report.md and handoff.md.
- Read /Users/user/src/water-invader/PROJECT.md and /Users/user/src/water-invader/COLLABORATION.md.

FILES YOU OWN EXCLUSIVELY:
- `src/game/flagship/factions/HadalBioHorrors.ts`
- `src/game/flagship/factions/AutomatonPhalanx.ts`

TASKS TO IMPLEMENT:
1. `src/game/flagship/factions/HadalBioHorrors.ts`:
   - Vulnerability 1 (NaN culling bypass):
     In unit culling (around line 595), add finiteness check:
     ```ts
     const isOutOfBounds = !Number.isFinite(unit.position.x) ||
       !Number.isFinite(unit.position.y) ||
       unit.position.x < -150 ||
       unit.position.x > 750 ||
       unit.position.y < -150 ||
       unit.position.y > 850;
     if (unit.isDead || isOutOfBounds) {
       this.units.splice(i, 1);
       continue;
     }
     ```
   - Vulnerability 2 (Stun skip bypass):
     Around lines 414-417, when `unit.stunTimer > 0`, do NOT `continue;` before running boundary culling and death removal!
     Instead, decrement `unit.stunTimer`, check death/bounds culling, and only skip the unit's active attack/movement execution when stunned.
2. `src/game/flagship/factions/AutomatonPhalanx.ts`:
   - In `railSlugs` culling (around line 283):
     Add `!Number.isFinite(slug.x) || !Number.isFinite(slug.y)` so non-finite coordinates are culled immediately.
   - In drones update: ensure any non-finite coordinates are culled/culled cleanly.
3. Verification:
   - Run `npx tsc --noEmit` (must exit 0).
   - Run `npm run build` (must compile with 0 errors).
   - Run `TARGET_URL=http://localhost:3005 npx playwright test tests/adversarial_challenger_stress_math.spec.ts`.
   - Ensure all 22 tests pass cleanly.

OUTPUT:
- Write `changes.md` and `handoff.md` in `/Users/user/src/water-invader/.agents/ti_worker_m5_remediation_1/`.
- Send a completion message to parent with verification commands and results.
