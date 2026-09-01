# Reviewer (R3) Plan: Crossfire & Score Persistence

1. **Independent Assessment**:
   - Verify requirements R1, R2, R3 without bias.
   - Trace core gameplay and collision pipelines (`GameManager.ts`, `Enemy.ts`, `Bullet.ts`).

2. **Adversarial Probing & Test Harness Construction**:
   - Write comprehensive test suite `tests/adversarial_r3_reviewer_crossfire_stress.spec.ts` covering edge cases:
     - Multi-death monotonic persistence + post-death shop deduction + respawn carryover.
     - Vertical column simultaneous multi-firing with shooter immunity and progressive lower damage.
     - Splitter mitosis under crossfire.
     - Hostile projectile mid-air interception.
     - 60-unit heavy 3-way chaotic battle stability.

3. **Full Suite & Static Build Verification**:
   - Run `npx tsc --noEmit`.
   - Run `npm run build`.
   - Run all Playwright test files (`npx playwright test`).

4. **Git Operations & Final Handoff**:
   - Update `COLLABORATION.md`.
   - Commit changes and push to remote repository.
   - Message parent agent with exhaustive review report.
