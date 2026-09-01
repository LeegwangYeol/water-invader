# Plan: Reviewer Round 2 (Crossfire & Score/Cash Persistence)

## Verification & Stress Testing Strategy
1. **Independent Evaluation**: Review diffs from implementer (`407e288`) and R1 reviewer (`39269d2`).
2. **Adversarial Edge-Case Probing (`tests/adversarial_r2_reviewer_deep_crossfire.spec.ts`)**:
   - Barricade crossfire absorption & dynamic hole punch-through once destroyed.
   - Helper drone intercepting hostile crossfire while ignoring friendly fire.
   - Post-death shop upgrades: cash deduction + respawn balance integrity.
   - Boss escort legion crossfire shield-break and multi-faction kill attribution.
   - Mid-air bullet-vs-bullet interception for hostile interceptable projectiles.
   - 40-unit high-density 120-tick simulation validating finite coordinates and absence of NaNs.
3. **Flakiness & Edge-Case Hardening**:
   - Hardened `tests/adversarial_challenger_m1_m2_stress.spec.ts` against post-activation crossfire diver attrition.
4. **Full Regression Validation**:
   - `npx tsc --noEmit`
   - `npm run build`
   - `npx playwright test` (435/435 passing across 44 spec files).
