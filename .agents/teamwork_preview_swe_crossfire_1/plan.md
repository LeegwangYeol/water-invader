# Execution Plan — SWE Light (Crossfire & Score/Cash Persistence)

## Task Breakdown
- **R1. Prevent Score and Cash Reset on Death**:
  - Carry over accumulated score and cash (currency) across player death / respawns.
- **R2. Enable Enemy Crossfire (Friendly Fire)**:
  - Modify collision logic so enemy attacks/projectiles can hit and damage other enemies (Invaders, Rogues, same-faction).
- **R3. Automated Verification & Git Push**:
  - Playwright E2E tests checking persistence and enemy crossfire.
  - Compile checks (`npx tsc --noEmit`, `npm run build`), Playwright test suite (`npx playwright test`).
  - Git commit and push to remote.

## Loop Progression
1. **Round 0 (teamwork_preview_implementer)**:
   - Implement R1, R2, and test cases for R3.
   - Run tests and report.
2. **Round 1 (teamwork_preview_reviewer)**:
   - Review diff, challenge edge cases (e.g. boss attacks, projectile lifecycles, player death loops, meta currency), test & fix.
3. **Round 2 (teamwork_preview_reviewer)**:
   - Adversarial testing, further hardening, regression checks.
4. **Round 3 (teamwork_preview_reviewer)**:
   - Final review round ensuring zero regression, full build check.
5. **Round 4 (teamwork_preview_victory_auditor)**:
   - Independent verification audit.
6. **Deployment & Final Report**:
   - Verify git commit & push, report to parent.
