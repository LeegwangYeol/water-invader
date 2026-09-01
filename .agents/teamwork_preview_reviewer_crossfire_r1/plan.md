# Adversarial Review Plan - Round 1 (Crossfire & Score/Cash Persistence)

## Task Scope & Independent Understanding
- **R1. Prevent Score and Cash Reset on Death**:
  - Score (`this.score`) and currency (`this.currency`) must persist across player deaths and respawns (`init()` calls).
  - High score tracking in localStorage should continue functioning properly.
- **R2. Enable Enemy Crossfire (Friendly Fire)**:
  - Enemy projectiles must damage other enemies (both intra-faction and inter-faction).
  - Shooting entity must remain immune to its own bullet on spawn frame (`shooter` / `hitEntities`).
  - Crossfire kills must award score/cash and combo progression via `handleCrossfireKill`.
  - Targeting AI (Sniper, Rogues) must evaluate nearby hostile/friendly enemy positions.
- **R3. Automated Verification & Git Push**:
  - Full Playwright suite must pass without regressions.
  - New adversarial stress suite must test edge cases.
  - Production build and type checking (`npm run build`, `npx tsc --noEmit`) must succeed with 0 errors.

## Adversarial Scrutiny Checklist
1. [x] Review diff of `407e2880801ce1c9c02a7c3c46f4b5224ad75a7a`.
2. [x] Analyze collision matrix in `GameManager.checkCollisions()`.
3. [x] Analyze targeting AI in `Enemy.fire()`.
4. [x] Author adversarial edge-case test suite (`tests/adversarial_r1_reviewer_crossfire_stress.spec.ts`).
5. [ ] Execute adversarial test suite and full Playwright test suite.
6. [ ] Verify `npx tsc --noEmit` and `npm run build`.
7. [ ] Stage and commit changes, push to remote repository.
8. [ ] Document findings and send final review report to parent.
