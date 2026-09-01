# Implementation Plan: Score/Cash Persistence on Death & Enemy Crossfire

## Objective
1. **R1. Prevent Score and Cash Reset on Death**: Preserve score and cash across player deaths and respawns in `GameManager.ts`.
2. **R2. Enable Enemy Crossfire (Friendly Fire)**: Allow enemy projectiles to collide with and damage other enemies (both opposite and same-faction), and update enemy targeting AI to target threats across factions and player.
3. **R3. Automated Verification & Git Push**: Create comprehensive Playwright E2E and unit tests for score/cash persistence and enemy crossfire, verify via `npx tsc --noEmit`, `npm run build`, `npx playwright test`, and commit & push.

## Steps
1. **R1 Implementation**:
   - In `src/game/GameManager.ts`: Modify `init(resetScoreAndCash: boolean = false)` so that `score` and `currency` are preserved across respawns/death restarts.
   - Ensure `this.score` and `this.currency` carry over into the new game session and HUD callbacks.

2. **R2 Implementation**:
   - In `src/game/Bullet.ts`: Add `public shooter?: Entity;` property to Bullet class.
   - In `src/game/Enemy.ts`:
     - When firing bullets, set `b.shooter = this;` and `b.hitEntities.add(this);`.
     - Update targeting AI so Snipers and multi-threat enemies can target other enemies across all factions in addition to the player.
   - In `src/game/GameManager.ts`:
     - In `checkCollisions()` Phase 1.3: Remove `bullet.faction === enemy.faction` exclusion so all enemy projectiles damage enemies on contact (excluding the shooter itself via `hitEntities`/`shooter`).
     - In Phase 1.3 kill handling: Call `handleCrossfireKill(enemy, bullet.faction)` for non-player bullet eliminations.

3. **R3 Verification & Tests**:
   - Create a dedicated test suite `tests/crossfire_and_score_persistence.spec.ts`.
   - Test:
     - Cash and score carry over after player HP reaches 0 and game restarts.
     - Invader projectiles damage other Invaders (friendly fire).
     - Invader projectiles damage Rogues.
     - Rogue projectiles damage other Rogues and Invaders.
     - Crossfire kills grant appropriate combo, score, and currency bonuses.
   - Run `npx tsc --noEmit`, `npm run build`, and `npx playwright test`.
   - Commit and push to git repository.
