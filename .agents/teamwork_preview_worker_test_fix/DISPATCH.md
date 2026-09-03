# Worker Dispatch: Fix STRESS-2.3 and STRESS-2.5 in crisis_adversarial_stress_m2.test.ts
Fix anchor takeDamage calls in tests/unit/crisis_adversarial_stress_m2.test.ts:
In STRESS-2.3 and STRESS-2.5, change r.takeDamage(600) to r.takeDamage(3500) so that anchors with 80% damage reduction (e.g. NEBULA_PHANTASM shifted phase) are guaranteed to reach 0 HP and trigger Phase 2 transitions deterministically.
Run SKIP_WEBSERVER=1 npx playwright test tests/unit/ 5 times to confirm 100% deterministic pass rate across random seeds.
Verify npx tsc --noEmit and npm run build.

## 2026-09-03T01:52:54Z
Task: Fix STRESS-2.3 and STRESS-2.5 in `tests/unit/crisis_adversarial_stress_m2.test.ts` so that anchor damage is sufficient to defeat anchors regardless of archetype damage resistance (takeDamage(3500) instead of takeDamage(600)). Verify with 5x repeat of test, run full unit tests (150 passing), verify tsc and build.
