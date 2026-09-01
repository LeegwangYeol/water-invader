# Claude Collaboration Guide: Water Invader

## Current Mission: Score/Cash Persistence on Death & Enemy Crossfire (Friendly Fire)

### Objectives & Requirements
1. **R1. Prevent Score and Cash Reset on Death**:
   - When the player dies (HP reaches 0) and the game resets or respawns, preserve accumulated score and cash (currency) so they carry over.
2. **R2. Enable Enemy Crossfire (Friendly Fire)**:
   - Modify projectile/attack collision and targeting logic so that enemies can hit and damage each other (Invaders, Rogues, and same-faction units).
3. **R3. Automated Verification & Git Push**:
   - Add/update Playwright E2E tests validating score/cash persistence after player death and enemy crossfire mechanics.
   - Run typecheck (`npx tsc --noEmit`), build (`npm run build`), and test suite (`npx playwright test`).
   - Commit and push to git repository upon full verification.

### Execution Plan (SWE Light Workflow)
- **Implementer**: Apply core logic modifications in `src/game/GameManager.ts`, `src/game/Enemy.ts`, `src/game/Projectile.ts` (or relevant game engine files), and write Playwright E2E tests.
- **Reviewer / Challenger**: Inspect code changes, verify edge cases (e.g. boss projectile collisions, game over vs respawn state, meta-progression consistency), execute test suites.
- **Verification & Deployment**: Run full verification suite, commit and push to remote.

## Collaboration Rules & Protocol
- All changes adhere to Next.js guidelines and pre-commit verification checks (`npx tsc --noEmit`, `npm run build`).
- Automated tests must run via `npx playwright test`.

