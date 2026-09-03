# Edge-Case Catalog and Risk Assessment: Game State Management

**Author:** bughunt_exp_edgecases_1 (Read-Only Exploration Agent)  
**Date:** 2026-09-03  
**Target Subsystems:** `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, `src/app/page.tsx`, `src/game/Player.ts`, `src/game/Barricade.ts`, `src/game/crisis/EndGameCrisis.ts`

---

## Executive Summary

An exhaustive, line-by-line audit of game state management and React synchronization was conducted across all 5 assigned focus areas. The audit uncovered **2 Critical Severity Bugs** (cross-run score inheritance and permanent disabling of End-Game Crises in subsequent runs), **3 Moderate Severity Bugs** (frozen lingering boss bullets across waves, React TopHUD combo display desync upon bullet damage, and currency loss when repairing tank in the Game Over modal), and several minor ergonomic edge cases.

---

## 1. Observation

### Focus Area 1: Shop Modal Before Wave 1 vs Mid-Game
- **Obs 1.1 (Score Leak Across Runs):** In `src/components/game-canvas.tsx` (lines 730–741) and `GameOverModal` (line 1094):
  ```typescript
  // game-canvas.tsx line 730
  const startGame = useCallback(() => {
    setIsPreGameShop(false);
    gameManagerRef.current?.init(false, true);
    // ...
    gameManagerRef.current?.startGame();
  }, []);
  ```
  `GameOverModal` maps `onPlayAgain={startGame}`. Calling `init(false, true)` sets `resetScoreAndCash = false` and `shouldPreserve = true`.
  In `src/game/GameManager.ts` (lines 198–201):
  ```typescript
  if (resetScoreAndCash) {
    this.score = 0;
    this.currency = 150;
  }
  ```
  Because `resetScoreAndCash` is `false`, `this.score` is **never reset to 0** when starting a new game after Game Over. Run 2 starts at Wave 1 retaining the entire score from Run 1.
- **Obs 1.2 (Wasted Tank Repair in GameOverModal):** In `src/components/game-canvas.tsx` (lines 498–507), `GameOverModal` renders `ShopUpgradePanel` with `onRepairTank={repairTank}`. If a deceased player (0 HP) purchases a tank repair for 75 pure water, `game.player.hp` becomes 1. When clicking `PLAY AGAIN`, `startGame()` calls `init(false, true)`. In `src/game/GameManager.ts` (lines 180–181):
  ```typescript
  // Preserve player upgrades (baseFireRate, multiShot, piercing, maxHp, hp, hasAcidShield)
  this.player.hp = Math.max(3, this.player.hp);
  ```
  `Math.max(3, 1)` yields 3. The 75 pure water spent in the Game Over modal is consumed with zero net gain, as fresh runs grant 3 HP unconditionally.
- **Obs 1.3 (Pre-Game Shop State & Navigation):** In `src/components/game-canvas.tsx` (lines 743–754), `handleOpenPreGameShop` sets React `gameState` to `GameState.SHOP`, while `gameManagerRef.current.state` remains `GameState.MENU`. In `ShopModal` (lines 446–452), the only interactive button is `DEPLOY TO WAVE 1`; there is no "Return to Menu" or "Cancel" button.
- **Obs 1.4 (Engine Method Absence for Tank Repair):** In `src/components/game-canvas.tsx` (lines 787–803), `repairTank` directly mutates `game.currency` and `game.player.hp`, calling `(game as any).updateScoreUI?.()`. No `repairTank()` method exists on `GameManager.ts`.

### Focus Area 2: Acid Rain & Environmental Counterplay
- **Obs 2.1 (Barricade Umbrella Shielding & Gaps):** In `src/game/GameManager.ts` (lines 959–1007), falling acid droplets ($y = -15, \text{speedY} > 0$) encounter Barricades ($y = 650$) before reaching Player ($y = 740$). Indestructible stone barricades absorb infinite droplets with zero damage. Destructible ice barricades take `b.hp -= 2` per hit (max 20 HP = 10 droplets). Barricades are 60px wide with 150px spacing (line 249), creating 90px unprotected gaps between safe zones.
- **Obs 2.2 (Acid Shield Mitigation):** In `src/game/GameManager.ts` (lines 971–975):
  ```typescript
  if (this.player.hasAcidShield) {
    soundManager.playShieldDeflect();
    this.createExplosion(hz.x, hz.y, '#38bdf8', 10);
  }
  ```
  `hasAcidShield` completely neutralizes `HazardProjectile` with zero damage, zero screen shake, zero stress increase, zero combo reset, and does not consume shield durability. It does not protect barricades or defend against solar flares or boss attacks.
- **Obs 2.3 (i-Frame Droplet Pass-Through):** In `src/game/GameManager.ts` (line 959):
  ```typescript
  if (this.player && !this.isGodMode && this.player.invincibilityTimer <= 0) {
  ```
  When the player is in damage invulnerability frames (`invincibilityTimer > 0`), acid droplets do not detonate or deflect; they pass through the ship until reaching the bottom of the screen ($y > 830$).
- **Obs 2.4 (Solar Flare Retention Across Waves):** In `src/game/GameManager.ts` (line 1226), wave clear checks `(this.crisisState.activeCrisis === null || (this.crisisState.activeCrisis !== 'ACID_STORM' || this.crisisState.timer <= 0))`. A wave can clear while `SOLAR_FLARE` is active. In `startNextWave()` (lines 259–278), `this.hazardProjectiles` is cleared, but `this.solarFlares` is not reset, allowing active/charging flare columns to persist into the next wave.

### Focus Area 3: Game Over State & Encounter Transitions
- **Obs 3.1 (Permanent Crisis Incursion Disabling in Run 2+):** In `src/game/GameManager.ts` (lines 233–235):
  ```typescript
  if (resetScoreAndCash) {
    this.hasEndGameCrisisOccurred = false;
  }
  ```
  In `startGame()` (line 732), `init(false, true)` is called with `resetScoreAndCash = false`. Consequently, once an End-Game Crisis triggers in Run 1 (`this.hasEndGameCrisisOccurred = true` at line 323), `this.hasEndGameCrisisOccurred` is **never reset to false** in subsequent runs. At line 414:
  ```typescript
  if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
  ```
  No End-Game Crisis will ever spawn again in Run 2 or beyond unless the page is reloaded.
- **Obs 3.2 (Lingering Boss Bullets Carried Across Waves):** In `src/game/GameManager.ts` (lines 1220–1245), defeating the boss clears hostiles (`remainingHostiles === 0`), immediately transitioning to `GameState.SHOP` and calling `this.pause()`. In `startNextWave()` (lines 259–294), `this.bullets` is **not cleared**. Any boss projectiles in flight when the boss died remain frozen and resume flight when Wave 6 or 11 begins.
- **Obs 3.3 (Player Death During Crisis Incursion Banner):** If an in-flight projectile kills the player during the 3.0s `CrisisPhase.INCURSION` warning banner, `this.gameOver()` sets `this.state = GameState.GAME_OVER`. In `src/components/game-canvas.tsx` (line 969), the warning banner unmounts cleanly because `gameState === GameState.PLAYING` evaluates to false, and `GameOverModal` mounts cleanly.

### Focus Area 4: Pause / Resume Delta Time Accumulation
- **Obs 4.1 (Clean rAF Cancellation and Timestep Protection):** In `src/game/GameManager.ts` (lines 128–150):
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
- **Obs 4.2 (Fixed Timestep Accumulator Clamp):** In `src/game/GameManager.ts` (lines 681–706):
  `frameTime` is clamped to 0.1s (`if (frameTime > 0.1) frameTime = 0.1`). Physics updates execute strictly at `FIXED_STEP = 1 / 60` (line 30). Even under extreme pause/unpause delays, the loop executes at most 6 sub-steps. Bullets never skip or teleport.
- **Obs 4.3 (Absence of User-Facing In-Game Pause Control):** During `GameState.PLAYING`, there is no pause button on the HUD and no key binding ('p' or 'Escape') in `handleKeyDown()` (lines 1995–2020).

### Focus Area 5: Combo Multiplier & LocalStorage High Score
- **Obs 5.1 (Combo UI Desync on Bullet Damage):** In `src/game/GameManager.ts` (lines 1456–1470):
  ```typescript
  if (bullet.checkCollision(this.player)) {
    // ...
    this.combo = 0;
    if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
    // MISSING: this.updateScoreUI();
  ```
  When the player is struck by an enemy bullet, `this.combo` is reset to 0 in engine state, but `this.updateScoreUI()` is omitted. React's `TopHUD` continues to display the old combo (e.g., "12x COMBO!") until either the internal combo timer expires or another enemy is killed.
- **Obs 5.2 (LocalStorage High Score Only Saved on Game Over):** In `src/game/GameManager.ts` (lines 1616–1625), high score is persisted to `localStorage.setItem('waterInvaderHighScore', ...)` exclusively inside `gameOver()`. If a player sets a new record score and closes or reloads the tab while playing or inside the wave clear shop, the high score is permanently lost.
- **Obs 5.3 (Cross-Wave Combo Preservation):** In `src/game/GameManager.ts` (lines 259–294), `startNextWave()` does not reset `this.combo` or `this.comboTimer`. If a player finishes Wave $N$ with a 15x combo, that combo and its 2.5x multiplier carry over into Wave $N+1$.

---

## 2. Logic Chain

1. **Premise (Score & Crisis Reset):** `game-canvas.tsx` line 732 calls `init(false, true)` for both pre-game starts and `onPlayAgain`.
2. **Inference (Score):** `init` only resets `this.score = 0` when `resetScoreAndCash` is `true`. Therefore, whenever `onPlayAgain` is clicked, `this.score` remains at the previous run's final score instead of resetting to 0.
3. **Inference (Crisis):** `init` only resets `this.hasEndGameCrisisOccurred = false` when `resetScoreAndCash` is `true`. In all subsequent runs initiated via `onPlayAgain`, `hasEndGameCrisisOccurred` remains `true`, permanently locking out all End-Game Crises for the life of the session.
4. **Premise (Bullet Persistence):** `startNextWave()` re-initializes wave parameters but does not touch `this.bullets`.
5. **Inference:** Any enemy bullets in flight when the final wave enemy dies are frozen by `pause()`. When `startNextWave()` unpauses, those hostile bullets resume their trajectories right into the player's starting space.
6. **Premise (Combo Desync):** In `checkCollisions()` line 1468, bullet-player collision sets `this.combo = 0` but does not invoke `this.updateScoreUI()`. All other collision handlers (enemy collision, sovereign collision, bottom breach) invoke `this.updateScoreUI()`.
7. **Inference:** The React `TopHUD` combo state is decoupled from engine state upon bullet impact, misleading the player until the next kill or timer expiry.
8. **Premise (Physics Delta Time):** `pause()` and `resume()` both set `accumulator = 0`, and `resume()` sets `lastTime = performance.now()`. Furthermore, `frameTime` is capped at 0.1s and executed via fixed `1/60s` sub-steps.
9. **Inference:** Delta time accumulation upon unpausing is mathematically bounded to $\le 0.1\text{s}$ ($\le 6$ ticks), preventing bullet hell step jumps or collision tunnel-through.

---

## 3. Caveats

1. **Meta-Progression Design Ambiguity:** It is possible that retaining currency across runs was an intentional rogue-lite choice, but retaining `this.score` across runs is unambiguously a bug because score represents individual run performance and distorts high score calculations.
2. **Cross-Wave Combo:** Retaining combo across wave transitions could be viewed as a feature rewarding fast wave clearing, but it creates balance discrepancies depending on enemy spawn animation delays.
3. **No Code Modified:** In accordance with explorer read-only constraints, no modifications were made to project source files.

---

## 4. Conclusion & Edge-Case Catalog

### Risk Assessment Matrix

| ID | Focus Area | Finding Description | Severity | Impact |
|---|---|---|---|---|
| **EC-01** | Shop / Game Over | Score leaks across runs on `PLAY AGAIN` (`init(false, true)`) | **CRITICAL** | Players start Wave 1 with previous run's score, corrupting leaderboard/high scores. |
| **EC-02** | Crises / State | `hasEndGameCrisisOccurred` never resets in Run 2+ | **CRITICAL** | End-Game Crises can only ever spawn once per browser session. Run 2+ has no crises. |
| **EC-03** | Wave Transition | `this.bullets` not cleared on `startNextWave()` | **MODERATE** | Hostile boss bullets in flight at wave clear hit the player at the start of the next wave. |
| **EC-04** | Combo / HUD | `this.updateScoreUI()` missing on bullet collision (line 1468) | **MODERATE** | React TopHUD combo displays stale broken combo after taking bullet damage. |
| **EC-05** | Shop / Game Over | Tank repair in `GameOverModal` wasted by `Math.max(3, hp)` | **MODERATE** | Player spends 75 pure water in game over screen with 0 HP benefit upon restart. |
| **EC-06** | Crises / Wave | `this.solarFlares` not reset in `startNextWave()` | **LOW** | Solar flare plasma beams can persist across wave transition into the next wave. |
| **EC-07** | LocalStorage | High score only saved on `gameOver()` | **LOW** | Closing the browser or refreshing mid-game loses personal best score. |
| **EC-08** | Pause / Controls | No player-accessible in-game pause key or button | **LOW** | Players cannot pause active bullet hell to take a break. |

---

### Concrete Proposed Fixes for Implementer

#### Fix 1: Score & Crisis Reset in `GameManager.init()`
In `src/game/GameManager.ts` (lines 198–203 and 233–236):
```typescript
// BEFORE:
if (resetScoreAndCash) {
  this.score = 0;
  this.currency = 150;
}
// ...
if (resetScoreAndCash) {
  this.hasEndGameCrisisOccurred = false;
}

// PROPOSED AFTER:
// Score and single-run event flags should ALWAYS reset on new game start
this.score = 0;
this.hasEndGameCrisisOccurred = false;
if (resetScoreAndCash) {
  this.currency = 150;
}
```

#### Fix 2: Clear Bullets & Solar Flares in `startNextWave()`
In `src/game/GameManager.ts` (lines 278–283):
```typescript
// PROPOSED AFTER:
this.bullets = []; // Clear in-flight bullets from previous wave
this.solarFlares = []; // Clear active/charging solar flares
this.hazardProjectiles = [];
```

#### Fix 3: Sync Score UI on Bullet Hit
In `src/game/GameManager.ts` (line 1468):
```typescript
// BEFORE:
this.combo = 0;
if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);

// PROPOSED AFTER:
this.combo = 0;
this.updateScoreUI();
if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
```

#### Fix 4: Disable Tank Repair in GameOverModal If Dead
In `src/components/game-canvas.tsx` (line 49):
```typescript
// In ShopUpgradePanel:
disabled={currency < 75 || hp >= 5 || hp <= 0}
```

---

## 5. Verification Method

### Automated Headless Unit Verification
Run the existing Playwright unit test suite:
```bash
npx playwright test tests/unit/pregame_shop_persistence.test.ts tests/unit/acid_rain_counterplay.test.ts
```

### Edge-Case Reproduction Commands
To test the identified edge cases in a new unit test suite:
1. **EC-01 Verification:**
   ```typescript
   const gm = new GameManager(mockCanvas);
   gm.score = 2500;
   gm.init(false, true); // simulate play again
   expect(gm.score).toBe(0); // currently FAILS (gm.score remains 2500)
   ```
2. **EC-02 Verification:**
   ```typescript
   const gm = new GameManager(mockCanvas);
   gm.hasEndGameCrisisOccurred = true;
   gm.init(false, true); // simulate play again
   expect(gm.hasEndGameCrisisOccurred).toBe(false); // currently FAILS (remains true)
   ```
3. **EC-03 Verification:**
   ```typescript
   const gm = new GameManager(mockCanvas);
   gm.bullets.push(new Bullet(100, 100, 200, 1, false));
   gm.startNextWave();
   expect(gm.bullets.length).toBe(0); // currently FAILS (remains 1)
   ```
4. **EC-04 Verification:**
   ```typescript
   let uiCombo = -1;
   gm.onScoreChange = (_s, _c, combo) => { uiCombo = combo; };
   gm.combo = 10;
   // Trigger bullet hit on player
   // Check if uiCombo === 0 (currently FAILS, uiCombo remains 10 until next event)
   ```

### Invalidation Conditions
- If the game intentionally adopts a global persistent arcade run score where dying continues the same cumulative score run, EC-01 would be considered by-design (though high score logic would still be distorted).
