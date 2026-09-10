# Adversarial Empirical Challenge Report: Milestone 1 (Pre-Continue Shop Access & Stability)

**Challenger**: `teamwork_preview_challenger_m1_1`  
**Milestone**: M1 (Pre-Continue Shop Access & Stability)  
**Target Work Product**: Worker M1 Implementation (`src/components/game-canvas.tsx`, `src/game/GameManager.ts`)  
**Verdict**: **CONFIRM (APPROVE)**  
**Date**: 2026-09-08T01:12:00Z  

---

## 1. Observation

### 1.1 Direct Code Inspection
1. **Tank Repair Unlock on Death (`src/components/game-canvas.tsx:51`)**:
   ```tsx
   <button 
     onClick={onRepairTank}
     disabled={currency < 75 || hp >= 5}
     className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded font-bold transition-colors"
   >{hp >= 5 ? 'MAX' : '75 💧'}</button>
   ```
   The dead player restriction (`hp <= 0`) was removed, allowing dead players entering the Continue Shop at baseline 3 HP to repair up to 5 HP whenever `currency >= 75`.

2. **Decoupled State Machine Transitions (`src/components/game-canvas.tsx:857-889`)**:
   - `handleContinueToShop`:
     - Guard: `if (gameStateRef.current !== GameState.GAME_OVER) return;`
     - Sets `isContinueShop = true`, `isPreGameShop = false`.
     - Calls `gameManagerRef.current.prepareContinue()`.
     - Synchronizes React state (`upgrades`, `currency`, `score`, `wave`, `hp`).
     - Sets `setGameState(GameState.SHOP)`.
   - `handleResumeContinuedWave`:
     - Guard: `if (gameStateRef.current !== GameState.SHOP) return;`
     - Sets `isContinueShop = false`.
     - Calls `gameManagerRef.current.continueGame()`.
     - Transitions to `GameState.PLAYING`.

3. **Shop Modal Routing & UI Signifiers (`src/components/game-canvas.tsx:455-497`)**:
   - Title renders: `"ARMORY & WORKSHOP (CONTINUE)"` / `"정비소 / 무기고 (이어하기)"`.
   - Subtitle renders: `"Prepare weapons & restore HP before resuming Wave {wave}!"` / `"전투 재개 전 무기와 체력을 정비하세요!"`.
   - Action button renders: `"RESUME WAVE"` / `"전투 재개 (RESUME WAVE)"` with `data-testid="resume-wave-button"`.

4. **Engine Pausing & Resource Cleansing in `prepareContinue` (`src/game/GameManager.ts:486-549`)**:
   - Revives player to baseline HP: `this.player.isDead = false; this.player.hp = Math.max(3, this.player.hp);`.
   - Purges volatile combat entities: `this.bullets = []; this.enemies = []; this.helpers = []; this.particles = []; this.hazardProjectiles = []; this.solarFlares = [];`.
   - Caps particle pool at 500 units.
   - Cleans up crises and warning timers.
   - Halts animation frames: `cancelAnimationFrame(this.animationFrameId); this.animationFrameId = 0;`.
   - Enters paused shop: `this.state = GameState.SHOP; this.isPaused = true;`.

5. **Combat Resumption & Preserved Repaired HP in `continueGame` (`src/game/GameManager.ts:551-626`)**:
   - Preserves repaired HP: `this.player.hp = Math.max(3, this.player.hp);` (if player repaired to 4 or 5 HP in shop, this HP is strictly retained!).
   - Grants 1.5s invincibility frames: `this.player.invincibilityTimer = 1.5;`.
   - Spawns fresh 4 barricades (`this.spawnBarricades()`).
   - Spawns current wave enemies without advancing or resetting wave (`this.spawnWave()`).
   - Resumes animation frame cleanly: cancels any lingering `animationFrameId`, sets it to 0, then registers `requestAnimationFrame(this.loop)`.

6. **Engine Repair Method (`src/game/GameManager.ts:2856-2871`)**:
   ```ts
   public repairTank(): boolean {
     if (!this.player) return false;
     const maxHp = this.player.maxHp || 5;
     if (this.currency >= 75 && this.player.hp < maxHp) {
       this.currency -= 75;
       this.player.hp = Math.min(maxHp, this.player.hp + 1);
       soundManager.playPowerUp();
       this.updateScoreUI();
       if (this.onPlayerHpChange) {
         this.onPlayerHpChange(this.player.hp);
       }
       return true;
     }
     return false;
   }
   ```

### 1.2 Empirical Test Execution Telemetry
Authored dedicated adversarial empirical test suite: `tests/adversarial_m1_continue_shop_challenger.spec.ts`.
Executed via Playwright:
```bash
npx playwright test tests/adversarial_m1_continue_shop_challenger.spec.ts
```
**Results**:
```
Running 8 tests using 1 worker

  ✓  1 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:27:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.1 [Full Transition & Double Repair]: Death -> Continue -> Shop Modal Open -> Buy Tank Repair (3 -> 4 -> 5 HP) -> Resume Wave maintains HP 5, barricades, wave 3, and 1.5s i-frames (9.4s)
  ✓  2 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:148:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.2 [Single Repair to 4 HP]: Death -> Continue -> Buy 1 Tank Repair (3 -> 4 HP) -> Resume Wave maintains HP 4 (2.0s)
  ✓  3 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:200:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.3 [Zero Repair Baseline]: Death -> Continue -> No Repair bought -> Resume Wave maintains baseline HP 3 (1.9s)
  ✓  4 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:250:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.4 [Stress: Rapid Continue Clicks]: Quintuple rapid clicks on Continue button do not corrupt state or leak loops (1.7s)
  ✓  5 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:289:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.5 [Stress: Rapid Resume Wave Clicks]: Quintuple rapid clicks on Resume Wave button do not duplicate entities or leak loops (2.4s)
  ✓  6 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:343:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.6 [Multi-Cycle Longevity]: 3 consecutive Death -> Continue -> Shop -> Resume cycles maintain clean state (4.2s)
  ✓  7 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:398:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.7 [Invincibility Protection in Combat]: Player is completely immune to hostile projectile damage during the 1.5s continue i-frame window (4.9s)
  ✓  8 [chromium] › tests/adversarial_m1_continue_shop_challenger.spec.ts:456:7 › Adversarial M1 Challenger: Pre-Continue Shop Access & Stability › C1.8 [Combined Upgrades Persistence]: Buying both Tank Repair and Fire Rate in Continue Shop correctly applies both to active combat (3.8s)

  8 passed (58.5s)
```

Pre-Commit Build Verification:
- `npx tsc --noEmit`: Exit code 0 (0 errors).
- `npm run build`: Exit code 0, compiled successfully in 4.5s.

---

## 2. Logic Chain

1. **State Machine Correctness (Observation 1.1.2 & Test C1.1)**:
   - When player HP reaches 0, the game transitions to `GameState.GAME_OVER`.
   - Clicking `[data-testid="continue-button"]` enters `handleContinueToShop`, which invokes `prepareContinue()`.
   - `prepareContinue()` revives the player with `hp = 3`, purges hostile entities and bullets, cancels animation frames, and transitions to `GameState.SHOP` with `isPaused = true`.
   - The UI correctly displays `<ShopModal>` with continue headers, current wave subtitle, and `data-testid="resume-wave-button"`.
2. **Tank Repair Economy & Progression (Observation 1.1.1, 1.1.6 & Tests C1.1, C1.2, C1.3)**:
   - With initial 300 currency and 3 HP, Tank Repair is enabled at `75 💧`.
   - Click 1 deducts 75 currency (300 -> 225) and increments HP to 4 (displayed as 4/5).
   - Click 2 deducts 75 currency (225 -> 150) and increments HP to 5 (displayed as 5/5).
   - Once at 5 HP, the button changes text to `'MAX'` and disables.
   - If currency is < 75, the button disables immediately.
3. **Resumption Invariants & HP Preservation (Observation 1.1.5 & Tests C1.1, C1.2)**:
   - Clicking `[data-testid="resume-wave-button"]` calls `handleResumeContinuedWave()`, which invokes `continueGame()`.
   - In `continueGame()`, `player.hp = Math.max(3, player.hp)` preserves repaired HP (5 remains 5, 4 remains 4).
   - `spawnBarricades()` creates 4 intact barricades.
   - `spawnWave()` creates enemies for the current wave without skipping.
   - `player.invincibilityTimer` is set to 1.5s, protecting the player against initial spawn damage.
4. **Idempotency & Anti-Leak Under Rapid Clicking (Observation 1.1.4, 1.1.5 & Tests C1.4, C1.5)**:
   - Firing 5 rapid clicks on Continue does not corrupt state: `animationFrameId` remains 0 while in shop, and no wave spawns prematurely.
   - Firing 5 rapid clicks on Resume Wave does not duplicate entities: barricades count is strictly 4, enemy count is within wave bounds, and loop runs at steady 60 FPS without multi-speed acceleration.
5. **Combat Invincibility Validation (Observation 1.1.5 & Test C1.7)**:
   - A hostile bullet spawned directly on the player during the 1.5s post-continue window deals 0 damage, verifying empirical i-frame protection.

---

## 3. Caveats

1. **Legacy Test Update Dependency (Milestone 4)**:
   - As identified by Worker M1, legacy tests in `tests/continue_vs_restart_on_death.spec.ts` and `tests/bughunt_empirical_edgecases_state_machine.spec.ts` (test 4.3) assumed an immediate jump to `PLAYING` on continue click. Because Requirement R1 introduces the intermediate `SHOP` state, those tests will be updated during Milestone 4 to include the `resume-wave-button` click.
2. **Logical Dimensions Invariant**:
   - Verified that `logicalWidth = 600` and `logicalHeight = 800` were untouched in `GameManager.ts`.
3. **No Cheating / Genuine Implementation**:
   - All transitions, entity updates, currency deductions, and timers are verified to be real state mutations without mocks or facades.

---

## 4. Conclusion

**Verdict: CONFIRM (APPROVE)**

The Milestone 1 Pre-Continue Shop Access and Stability implementation is thoroughly validated:
- The state transition flow `Death -> Continue -> Shop -> Tank Repair (3 -> 4 -> 5 HP) -> Resume Wave` executes flawlessly.
- Repaired HP (4 or 5 HP) is preserved in active combat.
- All 4 barricades spawn fresh and current wave enemies populate the field.
- 1.5s invincibility timer actively protects the player from instant death upon resumption.
- Rapid double/quintuple clicking stress proves strict idempotency with 0 loop leaks or entity duplications.
- Production build and TypeScript type check pass cleanly with 0 errors.

---

## 5. Verification Method

To independently reproduce and verify this verdict:

```bash
# 1. Execute the dedicated Milestone 1 adversarial empirical challenge suite
npx playwright test tests/adversarial_m1_continue_shop_challenger.spec.ts

# 2. Execute the shop economy progression suite
npx playwright test tests/06_shop_economy_max_upgrades.spec.ts

# 3. Verify TypeScript typecheck
npx tsc --noEmit

# 4. Verify Next.js production build
npm run build
```

**Invalidation Conditions**:
- Any failure in `tests/adversarial_m1_continue_shop_challenger.spec.ts`.
- Player HP being reset to 3 upon wave resume if tank repair was purchased (4 or 5 HP).
- Lingering animation frame loop running while in `GameState.SHOP`.
- Player not receiving 1.5s invincibility frames upon combat resumption.
- Any TypeScript error or build failure during `npm run build`.

