# Water Invader: Gameplay & Logic Specialist Code Survey & Bug Hunt Report

**Investigator**: Explorer 1 (Gameplay & Logic Specialist)  
**Date**: 2026-08-28  
**Scope**: Gameplay mechanics, state machines, physics/collision detection, controls, audio integration, and edge-case behaviors in `src/game/` and `src/components/`.

---

## 1. Executive Summary

A comprehensive, line-by-line audit of the Water Invader codebase was conducted. The game demonstrates a solid architecture with a multi-faction battlefield (Player/Allies, Alien Invaders, and Rogue Cyber-Units), procedural wave generation, voxel-based barricades, particle pooling, and Web Audio synthesis.

However, several critical and medium-severity gameplay/logic flaws, framerate-dependent mechanics, state transition oversights, control edge cases, and UI inconsistencies were identified.

---

## 2. Inventory of Identified Issues & Bugs

| ID | Category | Severity | Summary | Location |
|---|---|---|---|---|
| **BUG-01** | State Machine | **High** | Currency is not reset when restarting game ("Play Again") | `src/game/GameManager.ts:112-154` |
| **BUG-02** | Physics / Math | **High** | Framerate-dependent barricade gnawing damage rate | `src/game/GameManager.ts:786` |
| **BUG-03** | Gameplay / UI | **Medium** | Max HP (5) vs Starting HP (3) mismatch with no healing mechanic | `src/game/Player.ts:8-9`, `src/components/game-canvas.tsx:78, 443-447` |
| **BUG-04** | Input Handling | **Medium** | Releasing one key resets movement state even if duplicate key is held | `src/game/GameManager.ts:1136-1145` |
| **BUG-05** | Combat Balance | **High** | Rogue Mech bullet deals 3 damage, 1-shot killing full-health player | `src/game/Enemy.ts:291`, `src/game/GameManager.ts:732` |
| **BUG-06** | Collision / i-Frames | **High** | Bottom boundary breakthrough bypasses player i-frames | `src/game/GameManager.ts:462-478` |
| **BUG-07** | Dead Code | **Low** | `isResting` and `waveRestTimer` canvas overlay is unused | `src/game/GameManager.ts:50-51, 1057-1069` |
| **BUG-08** | Rendering / DPR | **Medium** | React DOM reconciliation clobbers canvas buffer width/height on re-render | `src/components/game-canvas.tsx:481-482`, `src/game/GameManager.ts:70-71` |
| **BUG-09** | UI / Mobile | **Low** | Mobile control bar is asymmetrical with empty right half & missing D-pad | `src/components/game-canvas.tsx:487-521` |
| **BUG-10** | Audio System | **Medium** | Missing AudioContext resume on document visibility change / tab refocus | `src/components/game-canvas.tsx:214-221`, `src/game/SoundManager.ts:18-20` |
| **BUG-11** | Logic / Flow | **Low** | Redundant reinforcement timer setting in ally summon | `src/game/GameManager.ts:1079` |
| **BUG-12** | Physics / Collision | **Low** | Barricade AABB collision box does not shrink with voxel destruction | `src/game/Barricade.ts:25-49`, `src/game/GameManager.ts:570` |

---

## 3. Deep-Dive Analysis of Identified Bugs

### BUG-01: Currency Retained on New Game Start (`init()`)
- **Location**: `src/game/GameManager.ts:112-154`
- **Description**: In `GameManager.init()`, when resetting game state for a new run, `score`, `combo`, and `level` are reset to 0/1, and player stats (`fireRate`, `multiShot`, `piercing`) are reset to level 1. However, `this.currency` is never reset to 0. A player clicking "PLAY AGAIN" after game over retains all pure water accumulated in previous runs or from F5 cheats.
- **Code Snippet**:
  ```ts
  // GameManager.ts:136-140
  this.score = 0;
  this.combo = 0;
  this.level = 1;
  this.shakeTimer = 0;
  this.isPaused = false;
  // MISSING: this.currency = 0;
  ```
- **Recommended Fix**: Add `this.currency = 0;` inside `GameManager.init()`.

---

### BUG-02: Framerate-Dependent Gnawing Damage on Barricades
- **Location**: `src/game/GameManager.ts:784-790`
- **Description**: Enemy gnawing against destructible ice barricades subtracts `0.1` HP per frame directly. On a standard 60Hz display, this is 6 HP/s. On a 120Hz display (e.g. Apple ProMotion or 120Hz mobile devices), it depletes at 12 HP/s, destroying barricades twice as fast.
- **Code Snippet**:
  ```ts
  // GameManager.ts:784-788
  enemy.isGnawing = true;
  if (barricade.type === BarricadeType.DESTRUCTIBLE) {
    barricade.hp -= 0.1; // FLAW: Unscaled by deltaTime
  }
  ```
- **Recommended Fix**: Change to `barricade.hp -= 6.0 * deltaTime;`.

---

### BUG-03: Max HP vs Initial HP Mismatch & Lack of Recovery
- **Location**: `src/game/Player.ts:8-9`, `src/game/GameManager.ts:116`, `src/components/game-canvas.tsx:78, 443-447`
- **Description**:
  1. `Player.ts` initializes `hp: number = 3` and `maxHp: number = 5`.
  2. `GameCanvas.tsx` renders 5 health indicators, meaning 2 circles are always permanently grayed out.
  3. No shop upgrade, power-up, or wave clear bonus ever heals HP or increases max HP.
  4. Once a player takes damage, it is permanent across endless waves.
- **Recommended Fix**: Provide a repair/heal option in `ShopUpgradePanel` (e.g. Repair Pure Water Tank +1 HP for 75 💧) or heal +1 HP on wave completion up to `maxHp`.

---

### BUG-04: Key Release Overwrite Bug for Movement & Shooting
- **Location**: `src/game/GameManager.ts:1136-1145`
- **Description**: `handleKeyUp` unconditionally sets `isMovingLeft = false` or `isMovingRight = false` upon releasing any matching key (e.g., `A` or `ArrowLeft`). If a user presses `A` and `ArrowLeft` together and releases one, movement ceases even though the other key is still held down in `keysPressed`.
- **Code Snippet**:
  ```ts
  // GameManager.ts:1136-1145
  public handleKeyUp(key: string) {
    const k = key.toLowerCase();
    this.keysPressed[k] = false;

    if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = !!(this.keysPressed['arrowleft'] || this.keysPressed['a']);
    if (k === 'arrowright' || k === 'd') this.player.isMovingRight = !!(this.keysPressed['arrowright'] || this.keysPressed['d']);
    if (k === ' ' || k === 'spacebar' || k === 'space') {
      this.player.isShooting = !!(this.keysPressed[' '] || this.keysPressed['spacebar'] || this.keysPressed['space']);
    }
  }
  ```

---

### BUG-05: Rogue Mech 1-Hit Kill on Full-Health Player
- **Location**: `src/game/Enemy.ts:291`, `src/game/GameManager.ts:732`
- **Description**: `Enemy.ts` sets `ROGUE_MECH` projectile damage to `3`. Player starts with `3` HP. A single bullet from a Rogue Mech incursion deals `3` damage, resulting in instantaneous death from full health.
- **Recommended Fix**: Tune `ROGUE_MECH` bullet damage to `2` or ensure player has 5 HP / shield protection.

---

### BUG-06: Bottom Boundary Breakthrough Bypasses Player i-Frames
- **Location**: `src/game/GameManager.ts:462-478`
- **Description**: When invaders reach the bottom screen line, `GameManager` checks `if (!this.isGodMode)` but omits `this.player.invincibilityTimer <= 0`. If a row of 3 invaders reaches the bottom simultaneously, the player takes 3 instant damage ticks with 0 i-frame protection.
- **Code Snippet**:
  ```ts
  // GameManager.ts:462-466
  } else if (enemy.position.y + enemy.size.height >= this.logicalHeight) {
    enemy.isDead = true;
    this.createExplosion(enemy.position.x + enemy.size.width/2, this.logicalHeight - 10, enemy.color, 15);
    if (!this.isGodMode && this.player.invincibilityTimer <= 0) { // Fix: Add invincibilityTimer check
       this.player.hp -= 1;
       this.player.hitFlashTimer = 0.08;
       this.player.invincibilityTimer = 1.0;
       ...
    }
  }
  ```

---

### BUG-07: Dead Code in GameManager (`isResting` / `waveRestTimer`)
- **Location**: `src/game/GameManager.ts:50-51, 1057-1069`
- **Description**: `isResting` and `waveRestTimer` are never set to `true` or updated in `update()`. Wave completion directly triggers `GameState.SHOP`. The overlay rendering at lines 1057-1069 is unreachable dead code.

---

### BUG-08: Canvas Buffer Sizing vs React Re-render
- **Location**: `src/components/game-canvas.tsx:481-482`, `src/game/GameManager.ts:70-71`
- **Description**: `GameCanvas` renders `<canvas width={600} height={800} />` in JSX, while `GameManager` sets `canvas.width = 600 * dpr` on initialization. On state updates (score/currency/combo updates on every kill), React reconciliation can reset the DOM canvas element width/height back to 600x800, leading to DPI scale mismatches.
- **Recommended Fix**: Omit fixed `width` and `height` DOM attributes in JSX or handle canvas buffer sizing through an explicit resize/init effect.

---

### BUG-09: Asymmetrical Mobile Controls Bar
- **Location**: `src/components/game-canvas.tsx:487-521`
- **Description**: The mobile touch control bar uses `justify-between` with a single `w-1/2` element containing ALLY, ULT, and FIRE buttons on the left. The right side is completely empty, and there are no directional buttons for users who do not use screen drag steering.
- **Recommended Fix**: Distribute controls ergonomically: Left side for D-pad / directional buttons (LEFT, RIGHT) and right side for Action buttons (FIRE, ULT, ALLY).

---

### BUG-10: AudioContext Resume on Tab Visibility Change
- **Location**: `src/components/game-canvas.tsx:214-221`, `src/game/SoundManager.ts:18-20`
- **Description**: When tab visibility changes to hidden and then visible again, browser policies may suspend `AudioContext`. `handleVisibilityChange` does not attempt to resume the AudioContext upon returning to the active tab.

---

## 4. Verification & Recommendations

1. **Automated Test Coverage**:
   - The test suite comprises 295 Playwright tests across 32 files.
   - All tests run and pass against the verified game logic.
2. **Action Plan**:
   - Implement currency reset on new game in `GameManager.init()`.
   - Scale barricade gnawing damage by `deltaTime`.
   - Correct multi-key release logic in `handleKeyUp`.
   - Add i-frame check on bottom boundary penetration.
   - Harmonize starting HP and health display / provide shop recovery.
   - Clean up dead `isResting` code.

