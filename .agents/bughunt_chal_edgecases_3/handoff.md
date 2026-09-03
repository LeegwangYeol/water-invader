# Empirical Challenge Report: State Machine Transitions & Boundary Conditions

**Agent:** bughunt_chal_edgecases_3  
**Working Directory:** `/Users/user/src/water-invader/.agents/bughunt_chal_edgecases_3`  
**Date:** 2026-09-03  
**Test Suite Created & Executed:** `tests/bughunt_empirical_edgecases_state_machine.spec.ts` (16 tests, 100% pass)  

---

## 1. Observation

### Focus Area 1: Rapid Pause & Unpause Toggles
- **Implementation Inspection**:
  - In `src/game/GameManager.ts`:
    - Lines 128–137:
      ```typescript
      public pause(): void {
        if (this.state === GameState.PLAYING || this.state === GameState.SHOP) {
          this.isPaused = true;
          this.accumulator = 0;
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
          }
          this.clearKeys();
        }
      }
      ```
    - Lines 140–150:
      ```typescript
      public resume(): void {
        if (this.state === GameState.PLAYING && this.isPaused) {
          this.isPaused = false;
          this.accumulator = 0;
          this.lastTime = performance.now();
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
          }
          this.animationFrameId = requestAnimationFrame(this.loop);
        }
      }
      ```
    - Lines 681–706 (`loop` method):
      ```typescript
      let frameTime = Math.max(0, (timestamp - this.lastTime) / 1000);
      this.lastTime = timestamp;
      if (frameTime > 0.1) {
        frameTime = 0.1;
      }
      this.accumulator += frameTime;
      while (this.accumulator >= this.FIXED_STEP) {
        this.update(this.FIXED_STEP);
        this.accumulator -= this.FIXED_STEP;
        if (this.state !== GameState.PLAYING) {
          this.accumulator = 0;
          break;
        }
      }
      ```
- **Empirical Execution**:
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:25` (5-second simulated background freeze): Enemy displacement was strictly bounded ($\Delta y < 15\text{px}$), `accumulator` reset to 0, player HP was unharmed ($3/3$).
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:85` (100 rapid synchronous toggles): `isPaused === false`, `state === PLAYING`, `accumulator === 0`, exactly 1 active animation frame loop, zero frame leaks.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:117` (10 cycles of 10ms micro-interval asynchronous jitter): Entity trajectories remained continuous, maximum displacement delta $< 30\text{px}$, zero NaN coordinates.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:154` (Calling `resume()` while in `SHOP`): Ignored safely; remained in `SHOP` and `isPaused === true`.

### Focus Area 2: Simultaneous Win/Loss Resolution
- **Implementation Inspection**:
  - In `src/game/GameManager.ts`:
    - Lines 1217–1228 (`completeWave`):
      ```typescript
      const isEndGameCrisisEngaged = this.endGameCrisis !== null && !this.endGameCrisis.isDefeated();
      if (
        this.state === GameState.PLAYING &&
        remainingHostiles === 0 &&
        !isEndGameCrisisEngaged &&
        ...
      ) {
        this.state = GameState.SHOP;
      ```
    - Lines 1471–1475 (Player death by bullet):
      ```typescript
      if (this.player.hp <= 0) {
        this.createExplosion(...);
        this.triggerScreenShake(1);
        this.gameOver("정수기가 파괴되었습니다. (체력 소진)");
      }
      ```
    - Lines 1610–1614 (`gameOver`):
      ```typescript
      private gameOver(reason: string) {
        this.gameOverReason = reason;
        this.state = GameState.GAME_OVER;
        this.alliedReinforcements = undefined;
        soundManager.playGameOver();
      ```
    - Lines 753–766 (End-Game Crisis Defeat evaluation in `update`):
      ```typescript
      // Defeat resolution: grant massive victory bonus (+2000 score, +500 cash)
      if (this.endGameCrisis.isDefeated()) {
        if (!this.endGameCrisisDefeatedHandled) {
          this.endGameCrisisDefeatedHandled = true;
          this.score += 2000;
          this.currency += 500;
          ...
      ```
- **Empirical Execution**:
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:182` (Wave Boss & Player mutual kill on same frame):
    - `boss.isDead === true`
    - `player.hp <= 0`
    - `state === 'GAME_OVER'`
    - `score` credited with 1,000 pts boss kill bonus ($500 \to 1500$)
    - `currency` credited with 50 pure water ($50 \to 100$)
    - UI strictly displays `GAME OVER` modal and does NOT display `WAVE CLEARED` shop.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:239` (End-Game Crisis Sovereign & Player mutual kill on same frame):
    - `crisis.isDefeated() === true`
    - `player.hp <= 0`
    - `state === 'GAME_OVER'`
    - UI strictly displays `GAME OVER` modal and does NOT open shop.
    - **Anomaly Discovered (BUG-EDGE-01)**: The player received the direct bullet hit score ($+15$), but the $+2000$ score and $+500$ currency defeat rewards were **omitted** (score remained $2015$ instead of $4000$). Because `this.gameOver()` sets `state = GAME_OVER`, the subsequent frame's `update()` loop check (`if (this.state === GameState.PLAYING)`) aborts early, never reaching line 753 where `this.endGameCrisis.isDefeated()` is checked.

### Focus Area 3: Shop Item Purchases Boundary Verification
- **Implementation Inspection**:
  - In `src/game/GameManager.ts`:
    - Line 2055: `if (this.currency >= 50 && this.getUpgrades().fireRate < 5)`
    - Line 2065: `if (this.currency >= 100 && this.player.multiShot < 5)`
    - Line 2075: `if (this.currency >= 200 && this.player.piercing < 5)`
    - Line 2085: `if (this.currency >= 150 && this.player && !this.player.hasAcidShield)`
  - In `src/components/game-canvas.tsx`:
    - Line 791 (`repairTank`): `if (game.currency >= 75 && game.player.hp < maxHp)`
- **Empirical Execution**:
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:337` (0 currency): All 4 upgrades rejected, currency stayed 0, stats stayed Lv 1.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:375` (Insufficient currency $49, 99, 199, 149$): All purchases strictly rejected, currency unchanged.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:433` (Exact currency $50$): Exactly one purchase permitted, balance decremented to 0, immediate second click rejected.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:457` (Max upgrade caps): FireRate Lv 5, MultiShot Lv 5, Piercing Lv 5, AcidShield Owned. Repeated purchases with 20,000 currency rejected without deducting funds.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:506` (Negative currency $-100$): Purchases rejected without numeric underflow.

### Focus Area 4: Stage Progression & Game Restart Lifecycle
- **Implementation Inspection**:
  - In `src/game/GameManager.ts`:
    - Lines 180–205 (`init(false, true)`): Preserves `player.baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`, and retains `this.score` and `this.currency` across sessions while resetting `level = 1`, `player.hp = Math.max(3, player.hp)`, clearing entity arrays.
    - Lines 259–294 (`startNextWave`): Resets `isPaused = false`, `accumulator = 0`, increments `level++`, spawns fresh wave.
- **Empirical Execution**:
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:533` (Wave 1 $\to$ Wave 2): Transitioned to `SHOP` (`isPaused: true`), button click advanced to Wave 2 (`state: PLAYING`, `level: 2`, `isPaused: false`, enemies spawned).
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:574` (Boss Wave 5 $\to$ Wave 6): Bio-Mech Titan spawned, defeated, cleanly transitioned to `SHOP`, advanced to Wave 6.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:619` (PLAY AGAIN lifecycle): Player killed in Wave 3 with score 2500, cash 400, multiShot 3, piercing 2. Clicking `PLAY AGAIN` reset to Wave 1, restored player HP to 3, preserved all weapon upgrades, persisted score (2500) and currency (400), wiped hostile bullets.
  - `tests/bughunt_empirical_edgecases_state_machine.spec.ts:679` (10 consecutive rapid death & restart cycles): Zero entity leakage, zero duplicate animation loops, clean state convergence.

---

## 2. Logic Chain

1. **Delta-Time & Entity Continuity**:
   - `GameManager.ts` implements a fixed-timestep physics accumulator (`FIXED_STEP = 1/60`).
   - `frameTime` is capped at $0.1\text{s}$ ($100\text{ms}$), guaranteeing that even an indefinite pause or background tab stall will produce at most $\lfloor 0.1 / (1/60) \rfloor = 6$ integration steps.
   - `pause()` and `resume()` both explicitly set `this.accumulator = 0` and `resume()` sets `this.lastTime = performance.now()`, completely eliminating time accumulation during pause.
   - Consequently, entity displacement is strictly bounded ($\Delta y \le 6 \cdot v_y \cdot \text{FIXED\_STEP}$), and entities cannot skip canvas boundaries or jump positions.

2. **Simultaneous Win/Loss Determinism**:
   - When lethal damage occurs to both Boss and Player within the same tick, `checkCollisions()` processes the collisions sequentially within the single frame.
   - For standard bosses, `handleEnemyKill` awards score/cash immediately upon boss death. When player HP reaches 0, `this.gameOver(...)` executes immediately, setting `state = GameState.GAME_OVER`.
   - At the end of `update()`, `completeWave()` checks `if (this.state === GameState.PLAYING && remainingHostiles === 0 ...)`. Because `state` is already `GAME_OVER`, the wave clear check evaluates to false. Thus, the system deterministically favors game over, preventing invalid transitions to the `SHOP` modal while the player is dead.
   - **However**, in the case of the End-Game Crisis Sovereign, `handleBulletCollision` records the hit and sets `crisis.phase = DEFEATED`, but the $+2,000$ victory score and $+500$ currency are gated inside `GameManager.update()` at line 753. If the player dies in `checkCollisions()` during that same frame, `this.gameOver()` sets `state = GAME_OVER`. On the next frame, `this.update()` aborts at line 713 (`if (this.state === GameState.PLAYING)`), permanently skipping line 753 and starving the player of their earned crisis defeat rewards.

3. **Shop Purchase Boundary Verification**:
   - All upgrade methods (`upgradeFireRate`, `upgradeMultiShot`, `upgradePiercing`, `upgradeAcidShield`) and `repairTank` enforce strict preconditions: `currency >= cost` AND `level < 5` (or `!hasAcidShield`, `hp < maxHp`).
   - Boundary tests with currency values $0$, negative ($-100$), and near-threshold ($cost - 1$) conclusively verified that no transaction occurs and internal state remains immutable.
   - Maximum level cap tests confirmed that spamming purchase calls with excessive currency ($20,000$) causes 0 fund deductions and 0 stat inflation.

4. **Stage Progression & Session Reset**:
   - Clearing a wave safely transitions to `GameState.SHOP`, pauses physics, and mounts the React `ShopModal`.
   - Clicking `NEXT WAVE` invokes `startNextWave()`, which resets the accumulator, increments `level`, spawns the new formation, and starts the render loop.
   - On death, `PLAY AGAIN` invokes `init(false, true)` and `startGame()`, which intentionally preserves accumulated score, pure water, and weapon upgrades while resetting wave to 1 and health to 3. 10 consecutive rapid stress iterations demonstrated zero entity leaks or orphaned animation loops.

---

## 3. Caveats

1. **Platform Audio Context**:
   - Procedural Web Audio synthesis (`soundManager`) runs via mocked/headless Web Audio in Playwright headless mode. Hardware-level audio buffer synchronization was not tested on physical iOS WebKit devices.
2. **Review-Only Constraint**:
   - Per role constraints, implementation code was not modified. The discovered anomaly BUG-EDGE-01 (deferred crisis defeat reward) is documented as an actionable finding for developer remediation.
3. **Display Refresh Rates**:
   - Verification was executed against 60Hz and fluctuating artificial tick rates. High-refresh 144Hz/240Hz monitors rely on the same `FIXED_STEP = 1/60` accumulator logic, which was verified mathematically in `tests/unit/physics_and_math.test.ts`.

---

## 4. Conclusion

- **State Machine Stability**: The game state machine transitions cleanly and deterministically across all tested scenarios. Rapid pause/unpause toggles maintain bounded delta times and zero position skips.
- **Mutual Win/Loss Priority**: On simultaneous lethal damage frames, the game deterministically transitions to `GAME_OVER`, preventing conflicting dual-modal UI rendering.
- **Identified Defect**:
  - **BUG-EDGE-01 (Severity: Low/P3)**: In `src/game/GameManager.ts:753`, the End-Game Crisis defeat reward (+2000 score, +500 currency) is evaluated at the start of the `update()` loop rather than inside `handleCrisisDefeated()` or `handleBulletCollision()`. When player HP and Crisis Core HP reach 0 in the same frame, the player enters `GAME_OVER` and is starved of the +2,000 score / +500 currency defeat bonus.
  - *Recommended Fix*: Move lines 756–765 into `handleCrisisDefeated()` or trigger `this.handleCrisisDefeated(this.endGameCrisis.archetype)` immediately within `checkCollisions()` when `crisis.isDefeated()` is first triggered.
- **Shop & Economy Boundaries**: Fully resilient against zero funds, insufficient funds, negative funds, exact boundary purchases, and maximum level overflows.
- **Stage Progression & Restart**: Wave transitions, boss waves, and `PLAY AGAIN` session restarts execute without orphaned loops, zombie entities, or memory leaks.

---

## 5. Verification Method

To independently reproduce and verify all 16 state machine and boundary condition tests:

```bash
# 1. Verify TypeScript type safety (0 errors)
npx tsc --noEmit

# 2. Run the empirical state machine test suite (16 tests, 100% pass)
npx playwright test tests/bughunt_empirical_edgecases_state_machine.spec.ts

# 3. Run the unit test suite (208 tests, 100% pass)
npx playwright test tests/unit/

# 4. Verify production build compilation
npm run build
```

**Invalidation Conditions**:
- If `tests/bughunt_empirical_edgecases_state_machine.spec.ts` reports any failure or unhandled rejection.
- If enemy displacement exceeds 15px following a 5-second simulated pause.
- If currency decreases when purchasing with 0 funds or when upgrades are at Lv 5.
- If a simultaneous player & boss death opens the Wave Clear Shop instead of Game Over.
