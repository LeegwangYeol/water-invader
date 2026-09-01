# Claude Collaboration Guide: Water Invader

## Current Mission: Score/Cash Persistence on Death & Enemy Crossfire (Friendly Fire)

### Objectives & Requirements
1. **R1. Prevent Score and Cash Reset on Death**:
   - When the player dies (HP reaches 0) and the game resets or respawns, preserve accumulated score and cash (currency) so they carry over. [VERIFIED & HARDENED]
2. **R2. Enable Enemy Crossfire (Friendly Fire)**:
   - Modify projectile/attack collision and targeting logic so that enemies can hit and damage each other (Invaders, Rogues, and same-faction units). [VERIFIED & HARDENED]
3. **R3. Automated Verification & Git Push**:
   - Add/update Playwright E2E tests validating score/cash persistence after player death and enemy crossfire mechanics.
   - Run typecheck (`npx tsc --noEmit`), build (`npm run build`), and test suite (`npx playwright test`).
   - Commit and push to git repository upon full verification. [COMPLETED]

### Execution Plan & Review Status (SWE Light Workflow)
- **Implementer (R0)**: Applied core logic modifications in `src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/game/Bullet.ts`, and added initial test suite in `tests/crossfire_and_score_persistence.spec.ts`.
- **Reviewer (R1)**:
  - Audited all changes, conducted independent adversarial stress analysis.
  - Resolved flaky wave 11 enemy indexing in `tests/12_extreme_difficulty_and_crises.spec.ts`.
  - Added dedicated adversarial stress suite `tests/adversarial_r1_reviewer_crossfire_stress.spec.ts` (6 passing tests).
  - Executed full suite: 429 / 429 tests passing, `npx tsc --noEmit` clean, `npm run build` successful.
- **Reviewer (R2)**:
  - Conducted deep adversarial verification across barricade penetration, helper drone crossfire absorption, post-death shop upgrade currency persistence, and mid-air bullet interception.
  - Added dedicated 6-test suite `tests/adversarial_r2_reviewer_deep_crossfire.spec.ts` (6 passing tests).
  - Hardened `tests/adversarial_challenger_m1_m2_stress.spec.ts` against post-activation crossfire diver attrition.
  - Executed full test suite: 435 / 435 tests passing across 44 spec files, `npx tsc --noEmit` clean, `npm run build` successful.
- **Reviewer (R3)**:
  - Conducted comprehensive final adversarial verification: multi-death/respawn monotonic persistence with post-death shop purchases, vertical-column multi-fire self-immunity, Splitter crossfire mitosis state validity, hostile mid-air bullet neutralization, and 60-unit heavy 3-way crossfire physics stability.
  - Added dedicated 5-test suite `tests/adversarial_r3_reviewer_crossfire_stress.spec.ts` (5 passing tests).
  - Executed full repository test suite: 440 / 440 tests passing across 45 spec files in 7.3m, `npx tsc --noEmit` clean (0 errors), `npm run build` successful (340ms).
  - Final Milestone Sign-off: All requirements R1, R2, R3 completely satisfied and verified.

## Collaboration Rules & Protocol
- All changes adhere to Next.js guidelines and pre-commit verification checks (`npx tsc --noEmit`, `npm run build`).
- Automated tests must run via `npx playwright test`.


