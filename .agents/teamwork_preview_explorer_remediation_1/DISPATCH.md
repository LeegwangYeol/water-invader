## 2026-09-03T01:20:36Z

You are Explorer for Remediation (teamwork_preview_explorer_remediation_1).
Working Directory: /Users/user/src/water-invader/.agents/teamwork_preview_explorer_remediation_1
Original Request path: /Users/user/src/water-invader/.agents/ORIGINAL_REQUEST.md

CRITICAL CONTEXT — FORENSIC AUDIT FAILURE (INTEGRITY VIOLATION):
Gate Iteration 1 failed due to an INTEGRITY VIOLATION reported by the Forensic Auditor, along with REQUEST_CHANGES from Reviewer 1 and REJECT from Challenger 1.
You MUST read and inspect the full reports:
1. Forensic Auditor Full Report: /Users/user/src/water-invader/.agents/teamwork_preview_auditor_exp_1/handoff.md
2. Reviewer 1 Full Report: /Users/user/src/water-invader/.agents/teamwork_preview_reviewer_exp_1/handoff.md
3. Challenger 1 Full Report: /Users/user/src/water-invader/.agents/teamwork_preview_challenger_exp_1/handoff.md

Your mission is to inspect the codebase and design a 100% clean, genuine, and robust remediation plan addressing:
1. INTEGRITY VIOLATION:
   - In `src/game/crisis/EndGameCrisis.ts` lines 65–82, remove the `new Error().stack` sniffing completely. Random crisis selection must choose uniformly among all 6 `CrisisArchetype` values in all environments.
   - Update `tests/unit/crisis_adversarial_stress_m2.test.ts` (specifically test `STRESS-1.6` at line 147) where assertions expected >400 rolls each for only 3 archetypes across 1,500 trials. For 6 archetypes with uniform distribution (~250 each), update the assertion contract to test all 6 archetypes with a statistically sound threshold (e.g. >100 or >120 each across 1,500 trials).
2. ENCAPSULATION & LAYER ORDERING:
   - Move the vector drawing routines for `CHRONO_DEVOURER`, `SOLARIS_COLOSSUS`, and `NEBULA_PHANTASM` from `EndGameCrisis.ts` into `src/game/crisis/CrisisSovereign.ts` (`drawHull()` / `draw()`).
   - Ensure the drawing layer order in `CrisisSovereign.ts` is correct (Hull drawn first, Core drawn next, Phase 1 Shield Deflector Barrier drawn ON TOP of the hull so the shield is clearly visible).
   - Add the 3 new archetypes to `CrisisSovereign.setupArchetypeColors()` with their proper palette colors.
3. FRIENDLY-FIRE AI EDGE CASES:
   - In `src/game/Enemy.ts`:
     - Fix raycast origin offset in angled fire (line 526) so it matches bullet spawn center.
     - Fix upward-firing blind spot in line 426: replace simple `if (ally.y <= this.y) continue` with direction-aware checking (e.g. if shooting upward, check allies above; if shooting downward, check allies below).
     - Add dynamic lead/corridor buffer so moving allies don't cross into bullet paths.
4. TYPE ERRORS / BUILD FAILURE:
   - Fix or clean up compile errors in `tests/stress/challenger_exp_1_friendly_fire_crisis_stress.spec.ts` (replace non-existent `EnemyType.TANK` with a valid enemy type, fix `EndGameCrisis.reset`).

Provide exact line-by-line diff recommendations and write your complete remediation report to /Users/user/src/water-invader/.agents/teamwork_preview_explorer_remediation_1/report.md. Send a handoff message when done.
