# Empirical Adversarial Challenge Report: Economy, Shop State Machine & Lifecycle Persistence

**Agent**: `teamwork_preview_challenger_2`  
**Verdict**: **REQUEST_CHANGES**  
**Date**: 2026-09-02T14:02:00+09:00  

---

## 1. Observation

### Test Execution Command & Summary
```bash
SKIP_WEBSERVER=1 npx playwright test tests/adversarial_economy_shop_persistence_stress.spec.ts
```
- **Total Tests Executed**: 18
- **Passed**: 17
- **Failed**: 1 (`CAP-01 [BUG SURFACE]: Fire Rate purchase capping and floating-point precision check`)

---

### Verbatim Findings & Evidence

#### Finding 1: Fire Rate Level Cap Over-Purchase via IEEE 754 Floating Point Imprecision
- **Location**: `src/game/GameManager.ts:1924-1932`
- **Code**:
  ```ts
  public upgradeFireRate() {
    if (this.currency >= 50 && this.player.fireRate > 0.1) {
      this.currency -= 50;
      this.player.fireRate = Math.max(0.1, this.player.fireRate - 0.1);
      soundManager.playPowerUp();
      this.updateScoreUI();
      this.updateUpgradesUI();
    }
  }
  ```
- **Empirical Failure Output**:
  ```
  [CAP-01 Log] Currency before 5th attempt: 800, after: 750. Float bug detected: true
  ✘ 9 [chromium] › tests/adversarial_economy_shop_persistence_stress.spec.ts:271:7 › CAP-01 [BUG SURFACE]: Fire Rate purchase capping and floating-point precision check
    Error: Fire Rate at Level 5 cap must not allow 5th purchase or deduct extra currency
    expect(received).toBe(expected) // Object.is equality
    Expected: 800
    Received: 750
  ```
- **Root Cause**:
  In JavaScript floating point arithmetic:
  - Base `fireRate`: `0.5`
  - Upgrade 1: `0.5 - 0.1 = 0.4`
  - Upgrade 2: `0.4 - 0.1 = 0.30000000000000004`
  - Upgrade 3: `0.30000000000000004 - 0.1 = 0.20000000000000004`
  - Upgrade 4 (Lv.5 MAX): `0.20000000000000004 - 0.1 = 0.10000000000000003`
  - Condition check on 5th attempt: `this.player.fireRate > 0.1` evaluates to `0.10000000000000003 > 0.1 === true`.
  - The 5th upgrade succeeds, deducting an extra 50 pure water (`currency -= 50`) while providing 0 stat benefit (`Math.max(0.1, ...) = 0.1`).

---

#### Finding 2: `GameManager.init()` Interface Signature Mismatch for Options Object
- **Location**: `src/game/GameManager.ts:138`
- **Code**:
  ```ts
  public init(resetScoreAndCash: boolean = false, preserveUpgrades: boolean = false)
  ```
- **Contract vs Code**:
  - `PROJECT.md` line 37 specifies: `gameManager.init(preserveUpgrades?: boolean)`
  - Dispatch prompt specifies: `GameManager.init({ preserveUpgrades: true })` vs `init({ preserveUpgrades: false })`
  - `src/components/game-canvas.tsx:729` invokes positional: `gameManagerRef.current?.init(false, true);`
- **Empirical Behavior (Test `PERSIST-04`)**:
  - Calling `gm.init({ preserveUpgrades: true })` passes an object as the 1st parameter (`resetScoreAndCash`).
  - Because objects are truthy in JS, `resetScoreAndCash` evaluates to `true`.
  - The 2nd parameter `preserveUpgrades` defaults to `undefined` (falsy `false`).
  - Consequently, calling `gm.init({ preserveUpgrades: true })` **wipes all player weapon upgrades** (`baseFireRate=0.5, multiShot=1, piercing=1, hasAcidShield=false`) and resets currency to `150`.

---

#### Finding 3: Verified Working Systems
1. **Starter Economy (150 💧)**:
   - `ECON-01`: Baseline starting economy initializes with 150 pure water.
   - `ECON-02`: Acid Shield (150 💧) can be purchased before Wave 1; leaves 0 💧.
   - `ECON-03`: Fire Rate Lv.2 (50 💧) + Multi-Shot Lv.2 (100 💧) can be purchased before Wave 1; leaves 0 💧.
   - `ECON-04`: 3x Fire Rate (50x3 = 150 💧) brings weapon to Lv.4 (0.2s); leaves 0 💧.
   - `ECON-05`: Piercing Lv.2 (200 💧 > 150 💧) is correctly rejected without mutating state.
2. **Boundary & Zero-Fund Rejection**:
   - `BOUND-01`: At 0 💧, all 4 upgrade methods reject purchase cleanly without mutating state.
   - `BOUND-02`: Near-threshold funds (49, 99, 149, 199 💧) reject purchases safely.
   - `BOUND-03`: Sequential draining basket from 400 💧 to 0 💧 operates with exact arithmetic.
3. **Upgrade Caps for Other Items**:
   - `CAP-02`: Multi-Shot strictly caps at Lv.5 (5 projectiles) and rejects surplus purchases.
   - `CAP-03`: Piercing strictly caps at Lv.5 (5 hits) and rejects surplus purchases.
   - `CAP-04`: Acid Shield is strictly a 1-time purchase (150 💧) and rejects duplicate re-purchasing.
4. **Lifecycle Persistence via Positional Arguments**:
   - `PERSIST-01`: `GameManager.init(false, true)` preserves all weapon stats (`baseFireRate`, `multiShot`, `piercing`, `hasAcidShield`), hull health, and remaining currency into Wave 1.
   - `PERSIST-02`: `GameManager.init(true, false)` completely wipes stats back to baseline and restores starter currency to 150.
   - `PERSIST-05`: Multi-wave transitions (`startNextWave()`) maintain upgrades into Waves 2, 3, etc.
5. **UI State Synchronization**:
   - `SYNC-01`: `onUpgradesChange` and `onScoreChange` trigger synchronously on every purchase.

---

## 2. Logic Chain

1. **Premise 1**: The system specification states that upgrades must cap at Level 5 (Fire Rate Lv.5 = 0.1s, Multi-Shot Lv.5 = 5, Piercing Lv.5 = 5) and surplus purchases must be rejected without deducting currency.
2. **Observation Ref 1**: In `upgradeFireRate()` (`GameManager.ts:1925`), the cap condition is `this.player.fireRate > 0.1`. At Level 5, `fireRate` is `0.5 - 0.4 = 0.10000000000000003` due to IEEE 754 precision.
3. **Inference 1**: Because `0.10000000000000003 > 0.1` is true, an extra 5th purchase is accepted, charging 50 currency for 0 stat benefit.
4. **Premise 2**: Game lifecycle contracts must be robust against standard invocation patterns (`init({ preserveUpgrades: true })` as specified in the mission requirements and PROJECT.md).
5. **Observation Ref 2**: `GameManager.init()` in `GameManager.ts:138` is typed as `(resetScoreAndCash: boolean = false, preserveUpgrades: boolean = false)`.
6. **Inference 2**: Passing an options object `init({ preserveUpgrades: true })` causes the 1st parameter to be truthy and 2nd parameter to be `undefined`, which unintentionally triggers a full stat wipe and currency reset.
7. **Conclusion**: While the core economy math, pre-game shop affordability, and positional persistence work well, these two defects represent regressions in economic state machine integrity and interface robustness.

---

## 3. Caveats

- In standard browser UI gameplay, the React button for Fire Rate in `ShopUpgradePanel` (`src/components/game-canvas.tsx:61`) contains `disabled={currency < 50 || upgrades.fireRate >= 5}`, which masks the engine-level float bug during manual button clicks. However, engine-level methods, AI bots, cheats, or programmatic calls remain vulnerable.
- No other caveats.

---

## 4. Conclusion

**Verdict**: **REQUEST_CHANGES**

### Actionable Remediation Steps for Implementer:

1. **Fix Fire Rate Level Cap in `src/game/GameManager.ts:1925`**:
   Change:
   ```ts
   public upgradeFireRate() {
     if (this.currency >= 50 && this.getUpgrades().fireRate < 5) {
       this.currency -= 50;
       this.player.fireRate = Math.max(0.1, Number((this.player.fireRate - 0.1).toFixed(2)));
       soundManager.playPowerUp();
       this.updateScoreUI();
       this.updateUpgradesUI();
     }
   }
   ```
2. **Support Options Object and Flexible Overload in `GameManager.init()` (`src/game/GameManager.ts:138`)**:
   ```ts
   public init(
     resetScoreAndCashOrOptions: boolean | { resetScoreAndCash?: boolean; preserveUpgrades?: boolean } = false,
     preserveUpgrades: boolean = false
   ) {
     let resetScoreAndCash = false;
     let shouldPreserve = preserveUpgrades;
     if (typeof resetScoreAndCashOrOptions === 'object' && resetScoreAndCashOrOptions !== null) {
       resetScoreAndCash = !!resetScoreAndCashOrOptions.resetScoreAndCash;
       shouldPreserve = !!resetScoreAndCashOrOptions.preserveUpgrades;
     } else if (typeof resetScoreAndCashOrOptions === 'boolean') {
       resetScoreAndCash = resetScoreAndCashOrOptions;
     }
     // Use shouldPreserve instead of preserveUpgrades throughout init()
   ```

---

## 5. Verification Method

To independently verify all findings and test suite execution:
```bash
# Run the empirical adversarial stress test suite
SKIP_WEBSERVER=1 npx playwright test tests/adversarial_economy_shop_persistence_stress.spec.ts
```
