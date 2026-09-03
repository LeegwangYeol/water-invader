# Edge-Case Catalog & Risk Assessment: Game State Management

**Author:** bughunt_exp_edgecases_2 (Read-Only Exploration Agent)  
**Date:** 2026-09-03  
**Target Subsystems:** `src/game/GameManager.ts`, `src/components/game-canvas.tsx`, `src/app/page.tsx`, `src/game/Player.ts`, `src/game/Barricade.ts`, `src/game/crisis/EndGameCrisis.ts`

---

## Executive Summary

An exhaustive, line-by-line architectural and state-machine audit of `GameManager.ts` and React synchronization in `game-canvas.tsx` was conducted across all 5 assigned focus areas. The audit identified **2 Critical Bugs** (run-to-run score accumulation and permanent lockout of End-Game Crises in subsequent runs), **4 Moderate Bugs** (permanent TopHUD combo lockup on bullet hit, post-wave frozen bullet carryover, wasted pure water on tank repair during game over, and geometric safe-zone margin breach under barricades), and **4 Ergonomic/Design Edge Cases** (solar flare carryover across waves, premature high-score saves, lack of in-game pause controls during tab switches, and missing encapsulated repair method).

---

## 1. Observation

### Focus Area 1: Shop Modal Before Wave 1 vs Mid-Game
- **Obs 1.1 (Score Accumulation Across Runs on Play Again):**  
  In `src/components/game-canvas.tsx` (lines 730–741) and `GameOverModal` (line 1094):
  ```typescript
  // game-canvas.tsx lines 730-741
  const startGame = useCallback(() => {
    setIsPreGameShop(false);
    gameManagerRef.current?.init(false, true);
    if (gameManagerRef.current) {
      setUpgrades(gameManagerRef.current.getUpgrades());
      setCurrency(gameManagerRef.current.currency);
      if (gameManagerRef.current.player) {
        setHp(gameManagerRef.current.player.hp);
      }
    }
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
  Because `resetScoreAndCash` is `false`, `this.score` is **never reset to 0** when starting a new game after Game Over. Run 2 starts at Wave 1 retaining the entire score from Run 1, inflating leaderboard scores and high score tracking cumulatively.

- **Obs 1.2 (End-Game Crisis Permanent Lockout After Run 1):**  
  In `src/game/GameManager.ts` (lines 233–235):
  ```typescript
  if (resetScoreAndCash) {
    this.hasEndGameCrisisOccurred = false;
  }
  ```
  And at line 323:
  ```typescript
  public triggerEndGameCrisis(archetype?: CrisisArchetype): EndGameCrisis {
    this.hasEndGameCrisisOccurred = true;
  ```
  And at line 414:
  ```typescript
  if (this.level >= 15 && !this.endGameCrisis && !this.hasEndGameCrisisOccurred) {
  ```
  Because `startGame` invokes `init(false, true)` on `onPlayAgain`, `resetScoreAndCash` is `false`. Once an End-Game Crisis triggers in Run 1, `this.hasEndGameCrisisOccurred` remains `true` for all subsequent runs in that browser session. No crisis can ever spawn again in Run 2, 3, etc., unless the browser tab is hard-refreshed.

- **Obs 1.3 (Pure Water Waste on Tank Repair in GameOverModal):**  
  In `src/components/game-canvas.tsx` (lines 498–507), `GameOverModal` renders `ShopUpgradePanel` with `onRepairTank={repairTank}`. When the player dies, `player.hp` is 0. The button is enabled (`hp < 5` and `currency >= 75`). Purchasing repair increments `player.hp` to 1. When clicking `PLAY AGAIN`, `startGame()` calls `init(false, true)`.  
  In `src/game/GameManager.ts` (line 181):
  ```typescript
  this.player.hp = Math.max(3, this.player.hp);
  ```
  `Math.max(3, 1)` evaluates to 3. The 75 pure water spent in the Game Over modal yields zero net benefit, as fresh runs grant 3 HP unconditionally. Purchasing 2 repairs (150 pure water) yields `Math.max(3, 2) = 3` (still 0 benefit).

- **Obs 1.4 (Encapsulation Bypass on Tank Repair):**  
  In `src/components/game-canvas.tsx` (lines 787–803), `repairTank` directly mutates `game.currency` and `game.player.hp`, and casts `(game as any).updateScoreUI?.()`. Unlike `upgradeFireRate`, `upgradeMultiShot`, `upgradePiercing`, and `upgradeAcidShield`, there is no `repairTank()` method defined on `GameManager.ts`.

- **Obs 1.5 (Pre-Game Shop State Divergence):**  
  In `src/components/game-canvas.tsx` (lines 743–754), `handleOpenPreGameShop` sets React `gameState` to `GameState.SHOP`, but `gameManagerRef.current.state` remains `GameState.MENU`. Additionally, `ShopModal` provides only a `DEPLOY TO WAVE 1` button with no option to return to the main menu without starting the run.

---

### Focus Area 2: Acid Rain & Environmental Event Counterplay
- **Obs 2.1 (Geometric Safe-Zone Breach: Droplet Radius vs Barricade Margin):**  
  In `src/game/GameManager.ts` (lines 965–968 vs lines 994–999):
  Player collision uses radius:
  ```typescript
  hz.x + hz.radius >= px &&
  hz.x - hz.radius <= px + pw &&
  hz.y + hz.radius >= py &&
  hz.y - hz.radius <= py + ph
  ```
  Barricade collision ignores droplet radius (point-in-box check):
  ```typescript
  !b.isDead &&
  hz.x >= b.position.x &&
  hz.x <= b.position.x + b.size.width &&
  hz.y >= b.position.y &&
  hz.y <= b.position.y + b.size.height
  ```
  Barricades are 60px wide (`size.width = 60`), and the player ship is 50px wide (`size.width = 50`). When centered under a stone barricade, the horizontal clearance on either side is only $\frac{60 - 50}{2} = 5\text{px}$.  
  Droplets spawn with radius between 5px and 9px (`radius: 5 + Math.random() * 4`). A droplet falling with radius 8 at $x = b.position.x - 1$ misses the barricade entirely, travels down to player level ($y = 740$), and strikes the player because $hz.x + hz.radius \ge px$. The effective sheltered zone ($60 - 2 \times 8 = 44\text{px}$) is smaller than the player ($50\text{px}$), preventing complete umbrella protection.

- **Obs 2.2 (Destructible Safe-Zones Never Respawn):**  
  In `src/game/GameManager.ts`, `this.spawnBarricades()` (lines 246–257) is called exclusively inside `init()`. It is never called in `startNextWave()` (lines 259–294). Once the 2 destructible ice barricades take 10 hits (20 HP), they are permanently destroyed for all subsequent waves (e.g. Waves 2 through 30+).

- **Obs 2.3 (i-Frame Droplet Pass-Through Hazard):**  
  In `src/game/GameManager.ts` (line 959):
  ```typescript
  if (this.player && !this.isGodMode && this.player.invincibilityTimer <= 0) {
  ```
  When the player is in invincibility frames (`invincibilityTimer > 0`), acid droplets do not detonate or deflect; they pass through the player's bounding box without dying. If a droplet is overlapping the player when `invincibilityTimer` expires, the player immediately takes acid damage on that frame.

- **Obs 2.4 (Solar Flare Retention Across Waves):**  
  In `src/game/GameManager.ts` (line 278), `startNextWave()` resets `this.hazardProjectiles = []`, but does NOT clear `this.solarFlares`. If a wave clears while `SOLAR_FLARE` is active or charging, the high-energy plasma beam continues into the next wave.

- **Obs 2.5 (Acid Shield Scope):**  
  In `src/game/GameManager.ts` (lines 971–975), `hasAcidShield` completely neutralizes `HazardProjectile` (0 damage, deflect sound, blue spark explosion). However, it does not mitigate acid/bio-spore attacks from the End-Game Crises (`ABYSSAL_LEVIATHAN` or `BIOMORPHIC_SWARM`), which spawn standard `Bullet` entities.

---

### Focus Area 3: Game Over State & Transitions
- **Obs 3.1 (Lethal Post-Wave Bullet Carry-Over):**  
  In `src/game/GameManager.ts` (lines 1220–1245), killing the final enemy on a wave triggers `GameState.SHOP` and calls `this.pause()`. In `startNextWave()` (lines 259–294), `this.bullets` is **not cleared**. Any hostile bullets fired just prior to boss or wave completion remain frozen in memory and resume trajectory upon starting Wave $N+1$, striking the player before new enemies shoot.

- **Obs 3.2 (Simultaneous Player Death / Boss Kill Score Desync):**  
  In `checkCollisions()` (lines 1342–1491): If an enemy bullet deals lethal damage to the player (`this.gameOver()`) before a player bullet eliminates the boss later in the same loop, `gameOver()` writes `this.score` to localStorage. The boss elimination then awards +1,000 score and +50 currency to engine state. The final score displayed on the Game Over screen is 1,000 points higher than what was persisted to `localStorage`.

- **Obs 3.3 (End-Game Crisis Victory Bonus Loss on Mutual Destruction):**  
  In `src/game/GameManager.ts` (lines 754–766), the +2,000 score, +500 pure water, and +10 combo victory bonus is awarded in `update()` before `checkCollisions()`. If a player bullet destroys the Crisis Core during `checkCollisions()`, and a lingering bullet deals lethal damage to the player in the same `checkCollisions()` cycle, `this.gameOver()` sets `state = GameState.GAME_OVER`. The loop terminates, and the +2,000 victory rewards are never granted.

- **Obs 3.4 (Crisis Incursion Player Death):**  
  In `triggerEndGameCrisis` (line 324), `this.enemies = []` clears standard enemies, but in-flight enemy bullets are not cleared. If a bullet kills the player during the 3.0s incursion warning banner, `gameOver()` is called. In `game-canvas.tsx`, the warning banner unmounts cleanly because `gameState === GameState.PLAYING` evaluates to false.

---

### Focus Area 4: Pause / Resume Delta Time Accumulation
- **Obs 4.1 (Verified Deterministic Fixed Timestep):**  
  In `src/game/GameManager.ts` (lines 128–150 and lines 681–706):
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
  In `loop()`:
  ```typescript
  if (frameTime > 0.1) {
    frameTime = 0.1;
  }
  this.accumulator += frameTime;
  while (this.accumulator >= this.FIXED_STEP) {
    this.update(this.FIXED_STEP);
    this.accumulator -= this.FIXED_STEP;
  }
  ```
  Both `pause()` and `resume()` reset `accumulator = 0`, and `resume()` refreshes `this.lastTime = performance.now()`. Even under arbitrary pauses or tab throttling, `frameTime` is clamped to 0.1s ($\le 6$ fixed sub-steps of $1/60\text{s}$). Projectiles never jump or tunnel through colliders upon unpause.

- **Obs 4.2 (Absence of Manual Pause & Background Tab Unpause Hazard):**  
  `GameManager.handleKeyDown` (lines 1995–2020) does not listen for 'p', 'P', or 'Escape'. `TopHUD` lacks a pause button.  
  In `src/components/game-canvas.tsx` (lines 689–700), `handleVisibilityChange` clears keys when `document.hidden`, but **does not call `game.pause()`**. When returning to the tab, the game immediately unfreezes in active bullet hell without user intervention.

---

### Focus Area 5: Combo Multiplier & High Score Persistence
- **Obs 5.1 (Permanent TopHUD Combo Desync on Bullet Damage):**  
  In `src/game/GameManager.ts` (lines 1456–1470):
  ```typescript
  if (bullet.checkCollision(this.player)) {
    bullet.isDead = true;
    if (!this.isGodMode && this.player.invincibilityTimer <= 0) {
      this.player.hp -= bullet.damage;
      this.player.hitFlashTimer = 0.08;
      this.player.invincibilityTimer = 1.0;
      soundManager.playPlayerHit();
      this.createExplosion(this.player.position.x + this.player.size.width / 2, this.player.position.y, '#ef4444', 10);
      this.triggerScreenShake(0.2);

      this.player.stressLevel = Math.min(100, this.player.stressLevel + 40);
      this.player.suppressionLevel = Math.min(100, this.player.suppressionLevel + 20);
      this.combo = 0;
      if (this.onPlayerHpChange) this.onPlayerHpChange(this.player.hp);
      // BUG: this.updateScoreUI() is omitted!
  ```
  Every other entity collision that resets combo (Sovereign collision line 745, enemy body collision line 1102, bottom breach line 1118) calls `this.updateScoreUI()`.  
  On bullet impact, `this.combo = 0` is set in the engine, but `this.updateScoreUI()` is omitted. Furthermore, because `this.combo` is already 0, line 790 (`if (this.combo > 0)`) evaluates to false, so the combo timer **never expires and never calls `this.updateScoreUI()`**. React's `TopHUD` remains permanently stuck showing the stale combo (e.g. `15x COMBO!`) until another enemy is killed.

- **Obs 5.2 (High Score Only Saved on Game Over):**  
  In `src/game/GameManager.ts` (lines 1616–1625), `localStorage.setItem('waterInvaderHighScore', ...)` is executed exclusively inside `gameOver()`. If a player sets a record score and closes or refreshes the tab mid-run or in the shop, the high score is permanently lost.

- **Obs 5.3 (Cross-Wave Combo Preservation):**  
  `startNextWave()` (lines 259–294) does not reset `this.combo` or `this.comboTimer`. A player ending Wave $N$ with a 15x combo carries that combo and its $2.5\times$ multiplier into Wave $N+1$.

- **Obs 5.4 (Environmental Damage Immunity to Combo Reset):**  
  Taking damage from Acid Storm droplets (line 976) or Solar Flare beams (line 1041) reduces player HP but does NOT reset `this.combo = 0`.

---

## 2. Logic Chain

1. **Premise (Score & Crisis Reset):** `game-canvas.tsx` line 732 invokes `init(false, true)` for both pre-game start and `onPlayAgain`.
2. **Inference (Score):** Because `init()` guards `this.score = 0` inside `if (resetScoreAndCash)`, passing `false` preserves `this.score`. On `PLAY AGAIN`, the player starts Wave 1 with their previous final score, leading to cumulative score inflation (Obs 1.1).
3. **Inference (Crisis Lockout):** Because `init()` guards `this.hasEndGameCrisisOccurred = false` inside `if (resetScoreAndCash)`, passing `false` leaves `hasEndGameCrisisOccurred = true`. The wave evaluation check at line 414 requires `!this.hasEndGameCrisisOccurred`. Consequently, zero crises will spawn in Run 2+ (Obs 1.2).
4. **Premise (Combo HUD Desync):** Bullet collision at line 1468 resets `this.combo = 0` without calling `this.updateScoreUI()`.
5. **Inference:** Line 790 guards combo decay with `if (this.combo > 0)`. Because combo is already 0, this branch is bypassed. React's `TopHUD` never receives an updated combo value and displays a ghost combo indefinitely until a subsequent kill occurs (Obs 5.1).
6. **Premise (Bullet Persistence):** `startNextWave()` does not reinitialize `this.bullets`.
7. **Inference:** Bullets in flight when the last enemy dies freeze in place during the shop modal, and unfreeze upon entering the next wave, hitting the player unexpectedly (Obs 3.1).
8. **Premise (Geometric Bounding):** Barricade collision tests only point coordinates `(hz.x, hz.y)`, whereas player collision tests `(hz.x ± hz.radius)`.
9. **Inference:** Droplets falling just outside a barricade's horizontal boundary ($< 5\text{px}$ clearance) miss the barricade but strike the player standing underneath, breaking the intended umbrella counterplay (Obs 2.1).
10. **Premise (Fixed Timestep Stability):** `pause()` and `resume()` zero the accumulator and update `lastTime`, while `loop()` clamps `frameTime \le 0.1s`.
11. **Inference:** Physics updates are mathematically capped at 6 sub-steps ($100\text{ms}$), guaranteeing that no giant step jumps or bullet hell teleportation can occur upon unpausing (Obs 4.1).

---

## 3. Caveats

1. **Meta-Progression vs Per-Run Economy:** In `init()`, retaining currency across runs could be interpreted as intentional rogue-lite progression. However, retaining `this.score` is unequivocally a defect because score represents individual run performance.
2. **Cross-Wave Combo:** Retaining combo across wave transitions could be viewed as an intentional skill reward for fast wave clearing, but it creates balance discrepancies depending on enemy spawn delays.
3. **Read-Only Investigation:** In strict accordance with explorer constraints, no modifications were made to project source files.

---

## 4. Conclusion & Edge-Case Catalog

### Risk Assessment Matrix

| ID | Focus Area | Finding Description | Severity | Impact |
|---|---|---|---|---|
| **EC-01** | Shop / Game Over | Score leaks across runs on `PLAY AGAIN` (`init(false, true)`) | **CRITICAL** | Players inherit prior run score, permanently corrupting high scores and leaderboards. |
| **EC-02** | Crises / State | `hasEndGameCrisisOccurred` never resets on `PLAY AGAIN` | **CRITICAL** | End-Game Crises can only spawn once per browser session; Run 2+ is permanently locked out. |
| **EC-03** | Combo / HUD | `this.updateScoreUI()` missing on bullet collision (line 1468) | **MODERATE** | React TopHUD displays a frozen ghost combo indefinitely after taking bullet damage. |
| **EC-04** | Wave Transition | `this.bullets` not cleared on `startNextWave()` | **MODERATE** | Lingering hostile bullets from previous wave hit player at the start of next wave. |
| **EC-05** | Shop / Game Over | Tank repair in `GameOverModal` wiped by `Math.max(3, hp)` | **MODERATE** | Player spends 75 pure water in game over screen with 0 HP benefit upon restart. |
| **EC-06** | Acid Rain / Cover | Barricade misses droplet radius check, breaching safe zone | **MODERATE** | Player standing fully under a stone barricade can still be hit by edge-falling acid droplets. |
| **EC-07** | Crises / Wave | `this.solarFlares` not reset in `startNextWave()` | **LOW** | Solar flare plasma beams can persist across wave transitions into the next wave. |
| **EC-08** | LocalStorage | High score only saved on `gameOver()` | **LOW** | Closing or refreshing the tab mid-game loses newly achieved personal best score. |
| **EC-09** | Pause / Controls | No manual pause key; tab switch leaves game active | **LOW** | Players cannot pause active bullet hell; switching tabs can cause unexpected hits upon return. |
| **EC-10** | Architecture | `repairTank` mutates private fields instead of engine method | **LOW** | Code smells and lack of encapsulation in UI-to-engine state management. |

---

### Concrete Proposed Code Changes for Implementer

#### Fix 1: Score & Crisis Flag Reset in `GameManager.init()`
In `src/game/GameManager.ts` (lines 198–203 and lines 233–236):
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
// Score and single-run progression flags MUST ALWAYS reset on fresh run
this.score = 0;
this.hasEndGameCrisisOccurred = false;
if (resetScoreAndCash) {
  this.currency = 150;
}
```

#### Fix 2: Combo UI Synchronization on Bullet Damage
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

#### Fix 3: Clear Bullets & Solar Flares on Wave Transition
In `src/game/GameManager.ts` (lines 278–283):
```typescript
// PROPOSED AFTER:
this.bullets = []; // Clear in-flight bullets from previous wave
this.solarFlares = []; // Clear active/charging solar flares
this.hazardProjectiles = [];
```

#### Fix 4: Prevent Wasted Tank Repair in GameOverModal
In `src/components/game-canvas.tsx` (line 49):
```typescript
// BEFORE:
disabled={currency < 75 || hp >= 5}

// PROPOSED AFTER:
disabled={currency < 75 || hp >= 5 || hp <= 0}
```

#### Fix 5: Barricade Droplet Radius Detection
In `src/game/GameManager.ts` (lines 994–999):
```typescript
// BEFORE:
hz.x >= b.position.x &&
hz.x <= b.position.x + b.size.width &&
hz.y >= b.position.y &&
hz.y <= b.position.y + b.size.height

// PROPOSED AFTER:
hz.x + hz.radius >= b.position.x &&
hz.x - hz.radius <= b.position.x + b.size.width &&
hz.y + hz.radius >= b.position.y &&
hz.y - hz.radius <= b.position.y + b.size.height
```

---

## 5. Verification Method

### Automated Headless Verification
Run the Playwright unit test suite:
```bash
npx playwright test tests/unit/pregame_shop_persistence.test.ts tests/unit/acid_rain_counterplay.test.ts
```

### Deterministic Unit Test Suite for Identified Edge Cases
Create a new test file `tests/unit/gamestate_edgecases_audit.test.ts`:
```typescript
import { test, expect } from '@playwright/test';
import { GameManager } from '../../src/game/GameManager';
import { Bullet } from '../../src/game/Bullet';
import { Faction, BarricadeType } from '../../src/game/types';

function createMockCanvas(): any {
  return {
    getContext: () => ({
      scale: () => {},
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDash: () => {},
    }),
    width: 600,
    height: 800,
    clientWidth: 600,
    clientHeight: 800,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 800 }),
  };
}

test('EC-01: init(false, true) must reset score to 0', () => {
  const gm = new GameManager(createMockCanvas());
  gm.score = 5000;
  gm.init(false, true);
  expect(gm.score).toBe(0);
});

test('EC-02: init(false, true) must reset hasEndGameCrisisOccurred to false', () => {
  const gm = new GameManager(createMockCanvas());
  gm.hasEndGameCrisisOccurred = true;
  gm.init(false, true);
  expect(gm.hasEndGameCrisisOccurred).toBe(false);
});

test('EC-03: Bullet hit on player must notify onScoreChange with combo = 0', () => {
  const gm = new GameManager(createMockCanvas());
  gm.combo = 10;
  let reportedCombo = 10;
  gm.onScoreChange = (_s, _c, combo) => { reportedCombo = combo; };
  
  const hostileBullet = new Bullet(gm.player.position.x + 10, gm.player.position.y + 10, 100, 1, false);
  hostileBullet.faction = Faction.INVADER;
  gm.bullets.push(hostileBullet);
  
  (gm as any).checkCollisions(1 / 60);
  expect(reportedCombo).toBe(0);
});

test('EC-04: startNextWave() must clear all in-flight bullets', () => {
  const gm = new GameManager(createMockCanvas());
  gm.bullets.push(new Bullet(100, 100, 100, 1, false));
  gm.startNextWave();
  expect(gm.bullets.length).toBe(0);
});
```
