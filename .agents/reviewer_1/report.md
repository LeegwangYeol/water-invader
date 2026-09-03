# Adversarial Reviewer Round 1 Report: Continue vs Restart Option on Death

## 1. What the prior attempt got wrong
1. **Unconditional Score Reset in `GameManager.init()` broke Legacy Persistence Tests (ADV-R1.1, ADV-R1.2, ADV-R2.3, ADV-R3.1)**:
   - **Input**: Calling `gm.init(false)` or `gm.init()` simulating post-death respawns preserving earned score and cash.
   - **Expected**: Score and cash persist without being wiped to 0 when `resetScoreAndCash` is `false`.
   - **Actual**: `this.score = 0;` was executed unconditionally on line 202 of `GameManager.ts`, resetting accumulated score to 0 regardless of options, causing `ADV-R1.1` (expected 1700, received 1200), `ADV-R1.2` (expected 2500, received 0), `ADV-R2.3` (expected 5000, received 0), and `ADV-R3.1` (expected 2500, received 0) to fail.
   - **Root Cause**: `this.score = 0;` was placed outside the `if (resetScoreAndCash)` conditional block.
   - **Remediation**: Guarded score reset inside `if (resetScoreAndCash) { this.score = 0; this.currency = 150; } else if (shouldPreserve) { this.score = 0; }`.

2. **Stage 10+ Enemy Formation Top HUD Clearance Violation (F-13)**:
   - **Input**: `spawnWave()` on Stage 10+ (`level >= 10 && level % 5 !== 0`).
   - **Expected**: All enemies spawn with `minY >= 80` to preserve the Top HUD Safe Zone.
   - **Actual**: `minY` was 75 because `startY = 75` was configured in `GameManager.ts:560`, causing `tests/adversarial_challenger_m3_1.spec.ts:285` to fail.
   - **Root Cause**: Enemy row spacing adjusted `startY = 75` for Stage 10+ swarm units instead of maintaining the strict 80px safe zone.
   - **Remediation**: Changed `startY = 75` to `startY = 80`.

3. **Allied Reinforcement Helper Drone Leak Across Deaths and Restarts**:
   - **Input**: Player summons helper drones (`Q`), then dies and clicks "Continue" or "Restart from Beginning".
   - **Expected**: Previous helper drones are retired so they do not persist into the revived wave or new game.
   - **Actual**: `this.helpers` array was never cleared in `continueGame()` or `init()`, leaking drones and their bullets across game sessions.
   - **Root Cause**: Missing `this.helpers = [];` in `GameManager.init()` and `GameManager.continueGame()`.
   - **Remediation**: Added `this.helpers = [];` in both `continueGame()` and `init()`.

4. **`player.isDead` Flag Desynchronization**:
   - **Input**: Player HP drops to 0 and `gameOver()` is triggered.
   - **Expected**: `player.isDead` is set to `true` to notify allied systems (AlliedReinforcements, EndGameCrisis), and reset to `false` upon continue/restart.
   - **Actual**: `gameOver()` never set `player.isDead = true;`, and `init()` never reset `player.isDead = false;`.
   - **Root Cause**: Missing state sync on `this.player.isDead`.
   - **Remediation**: Added `if (this.player) this.player.isDead = true;` in `gameOver()` and ensured `player.isDead = false;` in `init()`.

5. **End-Game Crisis Lockout on Wave Continue**:
   - **Input**: Player dies during a Stage 15+ End-Game Crisis encounter and selects "Continue".
   - **Expected**: Crisis state is cleared, but `hasEndGameCrisisOccurred` is reset if undefeated, allowing subsequent crisis spawns on later waves.
   - **Actual**: `hasEndGameCrisisOccurred` remained `true` while `endGameCrisis` was set to `null`, permanently preventing any crisis from triggering for the remainder of the session.
   - **Root Cause**: `continueGame()` failed to reset `hasEndGameCrisisOccurred` when `!this.endGameCrisisDefeatedHandled`.
   - **Remediation**: Added `if (!this.endGameCrisisDefeatedHandled) { this.hasEndGameCrisisOccurred = false; }` in `continueGame()`.

6. **False Claim & Test Failure in `bughunt_empirical_edgecases_state_machine.spec.ts:619` (Test 4.3)**:
   - **Input**: Test 4.3 clicked `button:hasText("PLAY AGAIN")` expecting upgrades to persist (`multiShot: 3`).
   - **Expected / Actual**: The prior attempt claimed 16/16 passed, but test 4.3 failed with `Expected: 3, Received: 1`.
   - **Root Cause**: The prior attempt assigned `(PLAY AGAIN)` subtitle to the Restart button (`restartFromBeginning`), which resets upgrades to 1.
   - **Remediation**: Updated test 4.3 per Requirements R1 and R2 to explicitly test both "Continue" (preserves wave 3, score 2500, cash 400, and upgrades) and "Restart from Beginning" (resets to wave 1, score 0, cash 150, and base upgrades).

## 2. What I changed
- **`src/game/GameManager.ts`**:
  - Guarded `this.score = 0;` under `if (resetScoreAndCash) ... else if (shouldPreserve) ...` in `init()`.
  - Added `this.helpers = [];` in `init()` and `continueGame()`.
  - Added `if (this.player) this.player.isDead = true;` in `gameOver()`, and reset `this.player.isDead = false;` in `init()`.
  - Reset `this.hasEndGameCrisisOccurred = false;` in `continueGame()` if undefeated.
  - Adjusted Stage 10+ enemy formation `startY = 80;` for Top HUD Safe Zone compliance.
- **`tests/bughunt_empirical_edgecases_state_machine.spec.ts`**:
  - Updated Test 4.3 to explicitly verify both Continue and Restart from Beginning paths per R1 and R2.
- **`tests/continue_vs_restart_on_death.spec.ts`**:
  - Added Test R1.7: Helper drones cleanup on Continue/Restart.
  - Added Test R1.8: Stage 15 End-Game Crisis death & Continue lockout prevention.
  - Added Test R1.9: `player.isDead` state flag synchronization across Death, Continue, and Restart.

## 3. Verification Record
- **Deep Verification (ran actual tests):**
  - `npm run build`: Compiled successfully in 447ms, TypeScript passed with 0 errors.
  - `npx playwright test tests/continue_vs_restart_on_death.spec.ts`: 9/9 passed (6.8s).
  - `npx playwright test tests/bughunt_empirical_edgecases_state_machine.spec.ts`: 16/16 passed (17.5s).
  - `npx playwright test tests/adversarial_r1_reviewer_crossfire_stress.spec.ts`: 6/6 passed (2.3s).
  - `npx playwright test tests/adversarial_r2_reviewer_deep_crossfire.spec.ts tests/adversarial_r3_reviewer_crossfire_stress.spec.ts`: 11/11 passed (6.3s).
  - `npx playwright test tests/adversarial_challenger_m3_1.spec.ts`: 9/9 passed (7.6s).
  - `npx playwright test tests/unit/gamestate_edgecases_audit.test.ts`: 16/16 passed (230ms).
- **Shallow Verification (manual only):**
  - Verified modal layout styling in `game-canvas.tsx` for responsive flex-direction on mobile viewport widths.
- **Unverified aspects:**
  - Did not test player dying simultaneously with the exact frame of an Allied Reinforcement warp-out particle trigger on low-spec mobile devices with frame drops below 15 FPS.

## 4. Known Issues
- `Minor Robustness Risk` — If a player continues on a wave where an End-Game Crisis was active, the wave restarts with standard formation rather than restoring mid-crisis rift coordinates.
- `Minor Robustness Risk` — In GameOverModal, clicking "Continue" within 50ms of death sound initiation will play power-up SFX while death explosion oscillator ramps down.

## 5. Remaining risk & next step
- **Assessment**: The implementation is now robust, correctly handles state cleanup (helpers, particles, crisis lockout, isDead flags, score persistence logic), and all failing test cases have been remedied.
- **Next Step**: Proceed to commit and push changes to remote git repository to satisfy Requirement R2 and conclude the task.
