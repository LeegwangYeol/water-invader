# Handoff Report: Gameplay & Logic Survey

**Agent**: Explorer 1 (Gameplay & Logic Specialist)  
**Date**: 2026-08-28  
**Report Artifact**: `/Users/a7111/src/water-invader/.agents/teamwork_preview_explorer_survey_logic_1/report.md`

---

## 1. Observation

1. **Currency Reset in GameManager**:
   In `src/game/GameManager.ts` lines 136–140:
   ```ts
   this.score = 0;
   this.combo = 0;
   this.level = 1;
   this.shakeTimer = 0;
   this.isPaused = false;
   ```
   `this.currency` is not reset in `init()`, retaining pure water across game restarts.

2. **Framerate-Dependent Gnawing Damage**:
   In `src/game/GameManager.ts` line 786:
   ```ts
   if (barricade.type === BarricadeType.DESTRUCTIBLE) {
     barricade.hp -= 0.1;
   }
   ```
   `barricade.hp` is decremented by a fixed `0.1` per frame rather than being scaled by `deltaTime`.

3. **Key Release Handling**:
   In `src/game/GameManager.ts` lines 1136–1145:
   ```ts
   if (k === 'arrowleft' || k === 'a') this.player.isMovingLeft = false;
   if (k === 'arrowright' || k === 'd') this.player.isMovingRight = false;
   if (k === ' ' || k === 'spacebar' || k === 'space') {
     this.player.isShooting = false;
   }
   ```
   Releasing one key unconditionally resets moving/shooting flags without checking if alternate keys in `keysPressed` are still active.

4. **Bottom Boundary Breakthrough i-Frames**:
   In `src/game/GameManager.ts` lines 462–466:
   ```ts
   } else if (enemy.position.y + enemy.size.height >= this.logicalHeight) {
     enemy.isDead = true;
     this.createExplosion(enemy.position.x + enemy.size.width/2, this.logicalHeight - 10, enemy.color, 15);
     if (!this.isGodMode) {
        this.player.hp -= 1;
        ...
     }
   }
   ```
   Omits `this.player.invincibilityTimer <= 0`, allowing simultaneous damage from multiple invaders on the bottom edge in a single frame.

5. **Rogue Mech 1-Hit Kill**:
   In `src/game/Enemy.ts` line 291:
   ```ts
   const bulletDamage = this.type === EnemyType.ROGUE_MECH ? 3 : (this.type === EnemyType.ROGUE_STALKER ? 2 : 1);
   ```
   Coupled with starting HP of 3 in `Player.ts:8`, Rogue Mech deals 100% of player health in one bullet hit.

6. **HP Capacity & Healing Absence**:
   `Player.ts:8-9` sets `hp: 3` and `maxHp: 5`. `game-canvas.tsx:443-447` renders 5 HP slots. There is no shop purchase, powerup, or wave clear mechanic that restores HP.

7. **Dead Overlay Code**:
   `GameManager.ts:50-51, 1057-1069` contains `isResting` and `waveRestTimer` which are never activated.

---

## 2. Logic Chain

1. **Observation 1** demonstrates that `GameManager.init()` fails to reset `this.currency = 0`. Therefore, whenever a player restarts after Game Over, all earned Pure Water persists, allowing infinite upgrade accumulation across deaths.
2. **Observation 2** shows that barricade damage per frame is constant (`0.1`). At 120 FPS, 12 HP/s is subtracted vs 6 HP/s at 60 FPS, making destructible barricades degrade twice as fast on high refresh rate displays.
3. **Observation 3** shows that `handleKeyUp` sets `isMovingLeft = false` directly upon receiving any single key up. If both `A` and `ArrowLeft` are pressed, releasing `A` cancels movement despite `ArrowLeft` remaining held down.
4. **Observation 4** shows that while collision between Player and Enemy or hostile Bullet explicitly checks `this.player.invincibilityTimer <= 0`, bottom-boundary breach damage does not. Therefore, if a wave front reaches the bottom together, 3-4 enemies subtract 3-4 HP in a single frame, killing the player instantly without i-frames.
5. **Observation 5 & 6** establish that with 3 starting HP and zero heal mechanics, 3-damage projectiles from Rogue Mech incursions cause immediate one-shot death.

---

## 3. Caveats

- Playwright tests currently pass across the baseline test suite. Any changes to damage formulas or currency persistence should be validated against existing milestone tests to prevent test expectation regression.
- Audio synthesis relies on Web Audio oscillator nodes; behavior in background tabs is subject to browser-specific autoplay/suspend policies.

---

## 4. Conclusion

The gameplay and logic architecture is functional, robust, and feature-complete with 3-way faction combat, but contains targeted bugs in currency lifecycle, framerate-dependent physics, multi-key input release, boundary i-frames, and health balance. The survey report in `report.md` details all 12 identified items with actionable recommendations.

---

## 5. Verification Method

- **Build Verification**:
  ```bash
  npm run build
  ```
- **Automated Test Suite**:
  ```bash
  npx playwright test
  ```
- **File Inspection**:
  Inspect `/Users/a7111/src/water-invader/.agents/teamwork_preview_explorer_survey_logic_1/report.md`.
