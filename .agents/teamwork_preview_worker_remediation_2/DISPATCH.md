## 2026-09-03T06:30:07Z

You are teamwork_preview_worker_remediation_2, an expert engineer.
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_worker_remediation_2/
Project Root: /Users/user/src/water-invader

MANDATORY: Read /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md, /Users/user/src/water-invader/COLLABORATION.md, /Users/user/src/water-invader/PROJECT.md, /Users/user/src/water-invader/.agents/orchestrator_bughunt_1/DEFECT_LOG.md, and /Users/user/src/water-invader/.agents/teamwork_preview_reviewer_gate_2/handoff.md before starting work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Remediate the exact regression and test synchronization issues identified in Reviewer 2's handoff report:

1. Fix Enemy Bullet Centering & Raycast Origin in src/game/Enemy.ts:
   - In both Rogue firing (around lines 624-628) and Invader firing (around lines 705-709):
     ```typescript
     const spawnX = this.position.x + this.size.width / 2 - 5;
     const spawnY = isShootingUp ? this.position.y : this.position.y + this.size.height;
     const originX = spawnX + 5; // Exactly equal to this.position.x + this.size.width / 2
     const originY = spawnY;
     ```
   - Verify that this cleanly fixes tests/unit/friendly_fire_ai.test.ts (specifically FF-09 line 201). All 12/12 tests must pass.

2. Update tests/unit/gamestate_edgecases_audit.test.ts:
   - Update test DEFECT-C3 (around lines 408-415) to assert that `originX === enemy.position.x + enemy.size.width / 2` and verify that the bullet rectangle `[spawnX, spawnX + 10]` is symmetrically centered on the ship `[enemy.position.x, enemy.position.x + enemy.size.width]`.

3. Synchronize Peer Test Suites:
   - In tests/unit/crisis_adversarial_stress_m2.test.ts (line 287):
     Update assertion from `expect(gm.score).toBe(1200);` to `expect(gm.score).toBe(0);` with comment explaining that `init()` resets score to 0 to prevent score inheritance across runs (DEFECT-F1).
   - In tests/unit/challenger_crisis_empirical_stress.test.ts:
     - Line 350 (Scenario 3.3): Update to assert that enraged Phase 3 fires at 0.7s cadence (DEFECT-A2).
     - Line 411 (Scenario 4.1): Update to assert that Sovereign defeat marks anchors `isDead = true` (DEFECT-A4).
     - Line 524 (Scenario 4.4): Update to assert that Sovereign defeat awards `>= 2000` score and `500` currency (DEFECT-A5).

4. Verification Requirements:
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run build` (Next.js production build succeeds).
   - Run `npx playwright test` (ensure 100% of all 576+ tests pass with 0 failures).

Write your handoff report to /Users/user/src/water-invader/.agents/teamwork_preview_worker_remediation_2/handoff.md and send a completion message to parent.
