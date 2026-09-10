# Pre-Continue Shop Access Flow & State Persistence Investigation Report

## Executive Summary
This investigation analyzes the end-to-end death, Game Over, Pre-Continue Shop, and wave resumption lifecycle in Water Invader. The core flow (`death -> GameOverModal -> Continue -> ShopModal -> Resume Wave -> continueGame()`) functions mechanically, but exhibits **6 distinct defects and flaws**:
1. **Currency Trap on Game Over Repair**: `GameOverModal` exposes `Repair Tank (+1 HP)` while player HP is $\le 0$. Purchasing repairs increments HP to 1 (cost 75 💧), but clicking "Continue" executes `prepareContinue()`, which clamps `player.hp = Math.max(3, player.hp)`. Because `Math.max(3, 1) === 3`, the 75 currency spent in Game Over is completely destroyed with 0 HP gained.
2. **Permanent Emergency Allies Lockout**: `emergencyAlliesTriggeredThisWave` is never reset in `prepareContinue()`, `continueGame()`, or `init()`. Once emergency reinforcements trigger at $\le 1\text{ HP}$, any subsequent death and continue (or restart from beginning) permanently disables emergency reinforcements for that wave (or Wave 1).
3. **Ghost Reinforcement Toast Banner**: `alliedReinforcementBannerTimer` and `alliedReinforcementBannerText` are not cleared on `prepareContinue()` or `continueGame()`, and `onAlliedReinforcements(false, "")` is not called, causing a lingering "MASSIVE ALLIED REINFORCEMENTS ARRIVED!" banner over a freshly purged arena.
4. **Persistent Threat Danger Vignette**: `threatIntensity` and `activeThreatLevel` are not reset in `prepareContinue()` or `continueGame()`, causing Boss crimson or Elite magenta perimeter vignettes to linger and slowly decay over several seconds on non-boss wave respawns.
5. **Code Duplication & Out-of-Sync Tank Repair**: `game-canvas.tsx:repairTank()` duplicates `GameManager.repairTank()` logic directly on `game.player.hp` rather than calling `game.repairTank()`, bypassing centralized encapsulation.
6. **Flaky 30% First-Frame Crisis Incursion on Wave 15+ Continues**: In `continueGame()`, `hasEndGameCrisisOccurred` is reset to `false` and `spawnWave()` evaluates `Math.random() < 0.30` on non-boss waves $\ge 15$. This causes an immediate, zero-warning End-Game Crisis to overwrite the normal wave on frame 1 of respawn with a 30% probability, causing test flakiness in E2E suites.

---

## 1. Observation

### O1: Dual Shop Panels & Game Over Repair Trap
In `src/components/game-canvas.tsx`:
- Lines 550–561 render `ShopUpgradePanel` inside `GameOverModal`:
  ```tsx
  <ShopUpgradePanel
    currency={currency}
    hp={hp}
    upgrades={upgrades}
    onBuyFireRate={onBuyFireRate}
    ...
    onRepairTank={onRepairTank}
    lang={lang}
  />
  ```
- Lines 564–572 render the Continue button:
  ```tsx
  <button 
    data-testid="continue-button"
    id="continue-btn"
    onClick={onContinue}
    ...
  >
  ```
- When `repairTank` runs from `GameOverModal` (lines 973–989):
  ```ts
  const repairTank = useCallback(() => {
    const game = gameManagerRef.current;
    if (game && game.player) {
      const maxHp = game.player.maxHp || 5;
      if (game.currency >= 75 && game.player.hp < maxHp) {
        game.currency -= 75;
        game.player.hp = Math.min(maxHp, game.player.hp + 1);
        soundManager.playPowerUp();
        ...
        setHp(game.player.hp);
        setCurrency(game.currency);
      }
    }
  }, []);
  ```
- On player death, `game.player.hp <= 0`. If the player clicks `Repair Tank`, `game.currency` decreases by 75, and `game.player.hp` becomes 1.
- When the player then clicks `Continue`, `handleContinueToShop` (line 857) calls `gameManagerRef.current.prepareContinue()`.
- In `src/game/GameManager.ts` line 489:
  ```ts
  public prepareContinue(): void {
    if (!this.player) {
      this.player = new Player(this.logicalWidth, this.logicalHeight);
    }
    this.player.isDead = false;
    this.player.hp = Math.max(3, this.player.hp);
  ```
- `Math.max(3, 1)` yields `3`.
- If the player had NOT spent 75 currency on `Repair Tank`, `game.player.hp` would be 0, and `Math.max(3, 0)` also yields `3`.
- Therefore, buying 1, 2, or 3 repairs in `GameOverModal` deducts 75, 150, or 225 currency while resulting in the identical 3 HP.

### O2: Emergency Allies Lockout Flag State Leak
In `src/game/GameManager.ts`:
- Line 83 defines the flag:
  ```ts
  public emergencyAlliesTriggeredThisWave: boolean = false;
  ```
- Line 1624–1628 sets the flag:
  ```ts
  if (this.state === GameState.PLAYING && this.player && this.player.hp <= 1 && !this.emergencyAlliesTriggeredThisWave) {
      this.emergencyAlliesTriggeredThisWave = true;
      this.triggerMassiveAlliedReinforcements();
  }
  ```
- The ONLY place where `emergencyAlliesTriggeredThisWave` is reset to `false` in the entire codebase is in `startNextWave()` line 438:
  ```ts
  public startNextWave() {
    ...
    this.emergencyAlliesTriggeredThisWave = false;
  ```
- In `prepareContinue()` (lines 484–547): `this.emergencyAlliesTriggeredThisWave` is NEVER reset.
- In `continueGame()` (lines 549–624): `this.emergencyAlliesTriggeredThisWave` is NEVER reset.
- In `init()` (lines 285–383): `this.emergencyAlliesTriggeredThisWave` is NEVER reset.

### O3: Lingering Reinforcement Banner & Threat Vignette
In `src/game/GameManager.ts`:
- Lines 81–82:
  ```ts
  public alliedReinforcementBannerTimer: number = 0;
  public alliedReinforcementBannerText: string = "";
  ```
- Lines 86–87:
  ```ts
  public threatIntensity: number = 0;
  public activeThreatLevel: ThreatLevel = 'NONE';
  ```
- In `prepareContinue()` (lines 484–547) and `continueGame()` (lines 549–624):
  - `this.alliedReinforcements = undefined;` and `this.helpers = [];` are purged.
  - However, `this.alliedReinforcementBannerTimer` and `this.alliedReinforcementBannerText` are NOT reset, and `this.onAlliedReinforcements?.(false, '')` is never fired.
  - `this.threatIntensity` and `this.activeThreatLevel` are NOT reset.
- In `src/components/game-canvas.tsx` lines 829–836:
  ```ts
  if (gameManagerRef.current.alliedReinforcementBannerTimer > 0) {
    setAlliedReinforcementBanner({
      active: true,
      text: gameManagerRef.current.alliedReinforcementBannerText || '✦ MASSIVE ALLIED REINFORCEMENTS ARRIVED! ✦',
    });
  }
  ```
- If the player dies while reinforcements are warping in with the banner displayed, the banner remains on screen when entering the continue shop and continues to show on wave resume.

### O4: Repair Tank Implementation Duplication
In `src/game/GameManager.ts` lines 2864–2878:
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
In `src/components/game-canvas.tsx` lines 973–989:
- `repairTank` does NOT call `game.repairTank()`. Instead, it manually repeats the exact arithmetic, audio trigger, and callbacks.
- In contrast, lines 933–971 for weapons (`buyFireRate`, `buyMultiShot`, `buyPiercing`, `buyAcidShield`, `buyHomingMissiles`) properly delegate to `game.upgradeFireRate()`, etc.

### O5: First-Frame Crisis Incursion in `spawnWave()` on Continued Wave 15+
In `src/game/GameManager.ts`:
- In `continueGame()` lines 595–605:
  ```ts
  if (!this.endGameCrisisDefeatedHandled) {
    this.hasEndGameCrisisOccurred = false;
  }
  this.endGameCrisis = null;
  this.endGameCrisisDefeatedHandled = false;
  ...
  this.spawnWave();
  ```
- In `spawnWave()` lines 751–757:
  ```ts
  // Stage 15+ End-Game Crisis Trigger Evaluation on non-boss waves
  if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
    const isPityTrigger = this.level >= 18;
    const isRandomTrigger = Math.random() < 0.30;
    if (isPityTrigger || isRandomTrigger) {
      this.triggerEndGameCrisis();
    }
  }
  ```
- In `triggerEndGameCrisis()` lines 639–641:
  ```ts
  this.hasEndGameCrisisOccurred = true;
  this.enemies = []; // Clear standard hostiles for existential crisis encounter
  this.endGameCrisis = new EndGameCrisis(this.logicalWidth, this.logicalHeight);
  ```
- When continuing Wave 15+, `hasEndGameCrisisOccurred` is reset to `false`. Then `spawnWave()` immediately rolls `Math.random() < 0.30`. With 30% probability, the wave instantly converts to an End-Game Crisis, emptying `this.enemies = []` and spawning the Crisis Sovereign immediately.
- In `tests/continue_vs_restart_on_death.spec.ts` line 386 (`test('R1.8...')`):
  ```ts
  expect(postContinue.hasCrisis).toBe(false);
  expect(postContinue.enemiesCount).toBeGreaterThan(0);
  ```
  If `Math.random() < 0.30` evaluates to true, `postContinue.hasCrisis` becomes `true` and `enemiesCount` becomes `0`, triggering an unexpected assertion failure.

---

## 2. Logic Chain

1. **Premise 1**: The user requirement states that selecting "Continue" gives the player an opportunity to access the Shop to purchase additional upgrades (including HP restoration/upgrades) before the wave resumes.
2. **Step 1 (O1)**: When a player dies, `player.hp <= 0`. In `GameOverModal`, the player can click `Repair Tank` costing 75 currency to increase `player.hp` to 1.
3. **Step 2 (O1)**: When the player clicks `Continue`, `handleContinueToShop` calls `prepareContinue()`, which sets `player.hp = Math.max(3, player.hp)`. Since `Math.max(3, 1) === 3`, the newly repaired HP is swallowed, deducting 75 currency without delivering any health advantage compared to not buying the repair.
4. **Step 3 (O2)**: Emergency reinforcements are governed by `emergencyAlliesTriggeredThisWave`. In `update()`, when `player.hp <= 1`, this flag is marked `true`. Because neither `prepareContinue()`, `continueGame()`, nor `init()` resets this flag, once triggered, emergency reinforcements remain permanently disabled if the player dies and continues that wave, or even if they restart from beginning on Wave 1.
5. **Step 4 (O3)**: Allied reinforcements and threat levels are visual overlays managed by timers and intensity variables. Clearing entity arrays (`this.helpers = []`, `this.alliedReinforcements = undefined`) without zeroing `alliedReinforcementBannerTimer`, `alliedReinforcementBannerText`, and `threatIntensity` leaves orphaned UI elements (banner text and crimson/magenta vignettes) active on screen upon continue.
6. **Step 5 (O4)**: `game-canvas.tsx` implements its own tank repair logic instead of delegating to `game.repairTank()`, violating the single source of truth established by all other upgrade methods.
7. **Step 6 (O5)**: In `continueGame()`, `hasEndGameCrisisOccurred` is reset to false, and `spawnWave()` rolls a 30% instant random trigger for crisis incursion on wave 15+. This causes non-deterministic crisis generation on the first frame of continuing wave 15, causing test flakiness in `continue_vs_restart_on_death.spec.ts:386`.

---

## 3. Caveats

- **No Caveats on Architecture**: The core responsive layout constraints (`logicalWidth = 600`, `logicalHeight = 800`) are respected; no modifications to coordinate dimensions are proposed or required.
- **Shop in GameOverModal Context**: `GameOverModal` contains `ShopUpgradePanel` to satisfy legacy test `R1.4: In-Game-Over Shop purchases persist when Continuing`. Removing `ShopUpgradePanel` from `GameOverModal` would break test `R1.4`. Therefore, any fix to Defect 1 must ensure repairs made in `GameOverModal` either carry over as bonus HP ($\text{base revived } 3 + \text{repairs}$) or preview the revived 3 HP baseline before repair.
- **Allied Reinforcement on Milestone Waves**: Milestone waves (`level % 5 === 0`) trigger reinforcements in `startNextWave()`, but not in `continueGame()`. Test `R1.10` explicitly asserts `postContinue.hasAlliedReinforcements === false` and `postContinue.helperCount === 0`. Preserving this test invariant is mandatory.

---

## 4. Conclusion

The Pre-Continue Shop access flow functions end-to-end (state transitions: `GAME_OVER` $\to$ `SHOP` $\to$ `PLAYING` with wave and score preservation, 1.5s i-frames, and entity cleanup). However, it suffers from critical economy and state bugs:
1. Currency is lost when buying Repair Tank in `GameOverModal` before clicking Continue.
2. `emergencyAlliesTriggeredThisWave` leaks permanently across continues and restarts.
3. Reinforcement banners and threat vignettes leak across continues.
4. `game-canvas.tsx:repairTank()` diverges from `GameManager.repairTank()`.
5. Wave 15+ continues have a 30% chance to immediately trigger an End-Game Crisis on spawn frame.

### Recommended Fix Strategy:
1. **Fix Defect 1 (Economy Trap)**:
   In `GameManager.ts:prepareContinue()`:
   Calculate repaired HP relative to revived base HP, or in `gameOver()`, initialize `this.player.hp = Math.max(3, this.player.hp)` so that repairs in `GameOverModal` start from 3/5 (3 $\to$ 4 $\to$ 5) rather than 0/5.
2. **Fix Defect 2 (Emergency Allies Reset)**:
   In `GameManager.ts`:
   Add `this.emergencyAlliesTriggeredThisWave = false;` to `prepareContinue()`, `continueGame()`, and `init()`.
3. **Fix Defect 3 (Banner & Vignette Reset)**:
   In `GameManager.ts`:
   In `prepareContinue()` and `continueGame()`:
   ```ts
   this.alliedReinforcementBannerTimer = 0;
   this.alliedReinforcementBannerText = "";
   if (this.onAlliedReinforcements) this.onAlliedReinforcements(false, "");
   this.threatIntensity = 0;
   this.activeThreatLevel = 'NONE';
   ```
4. **Fix Defect 4 (Delegate Repair in Canvas)**:
   In `src/components/game-canvas.tsx:repairTank()`:
   Replace duplicate manual logic with `gameManagerRef.current.repairTank()` followed by state synchronization.
5. **Fix Defect 5 (Grace Period for Wave 15+ Crisis Incursion on Continue)**:
   In `continueGame()`, pass a flag to `spawnWave({ isContinue: true })` or defer crisis random triggers until `this.crisisTimer` naturally elapses, preventing instant frame-1 surprise crisis incursion.

---

## 5. Verification Method

### Automated Test Verification:
Run the Playwright suites for death, continue, shop, and adversarial scenarios:
```bash
npx playwright test tests/continue_vs_restart_on_death.spec.ts tests/adversarial_m1_continue_shop_challenger.spec.ts tests/m1_reviewer2_continue_shop_verification.spec.ts
```

### New Regression Unit / E2E Tests to Author:
1. **`test_game_over_repair_persistence`**:
   - Die at Wave 2 with 300 currency.
   - Buy Repair Tank in `GameOverModal` (1 repair, cost 75).
   - Click Continue -> Verify HP in Continue Shop is 4/5 (NOT reset to 3/5!).
   - Resume Wave -> Verify in-game HP is 4.
2. **`test_emergency_allies_reset_on_continue_and_restart`**:
   - Trigger emergency allies by lowering HP $\le 1$.
   - Die and Continue (or Restart).
   - Lower HP $\le 1$ again on resumed/restarted wave.
   - Assert `emergencyAlliesTriggeredThisWave` allows emergency reinforcements to trigger again.
3. **`test_threat_vignette_and_banner_cleared_on_continue`**:
   - Trigger Boss encounter or Allied Reinforcements warp-in.
   - Die while banner and threat vignette are at peak.
   - Click Continue -> Assert banner is hidden and threat intensity is 0.
